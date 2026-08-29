/**
 * Hand-rolled CSS tokenizer + pretty-printer/minifier.
 *
 * No external dependency (no postcss/prettier/CSS parser package) — this
 * walks the stylesheet with a small recursive-descent scanner and rebuilds
 * it as a tree of rules/declarations. It is a formatting convenience, not a
 * CSS3-spec-correct parser: it does not validate property names or values
 * and does not special-case every exotic at-rule. It is designed to never
 * throw on ordinary (even messy) input and to always make forward progress
 * through the string.
 *
 * Handles plain CSS3: rule blocks (`selector { declarations }`),
 * comma-separated multi-selectors, declarations (including CSS custom
 * properties `--name: value`), at-rules that contain nested rule blocks
 * (`@media`, `@supports`, `@keyframes`, `@layer`, `@container` — indent
 * depth simply increases for their children, same as any other block),
 * at-rules that are a single statement (`@import`, `@charset`), at-rules
 * with their own declaration block (`@font-face`, handled identically to a
 * normal rule), native CSS nesting (`&`, handled for free since nested
 * blocks are just blocks inside blocks), and `/* comments *\/` (preserved).
 *
 * The tokenizer tracks quote state and `url(...)` state so that `{`, `}`,
 * `;` and `:` inside a quoted string (e.g. `content: "a: b { c }"`) or
 * inside an unquoted `url(...)` value (e.g. a `data:` URL containing
 * literal `;` characters) are never mistaken for structural CSS tokens.
 */

export interface CssProcessResult {
  output: string;
  /** Non-fatal structural diagnostics (e.g. unbalanced braces). Formatting/
   *  minifying still succeeds and produces output even when this is
   *  non-empty — hand-written/scraped CSS is often slightly malformed, so
   *  these are best-effort warnings, not parse failures. */
  issues: string[];
}

type Node =
  | { type: "comment"; text: string }
  | { type: "at"; text: string }
  | { type: "decl"; text: string }
  | { type: "block"; prelude: string; children: Node[] };

/** Collapses runs of whitespace outside quoted strings to a single space
 *  and trims the ends. Whitespace inside quotes is left untouched, since
 *  it may be semantically significant (e.g. `content: "a   b"`). */
function collapseWhitespace(text: string): string {
  let out = "";
  let quote: string | null = null;
  let lastWasSpace = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (quote) {
      out += ch;
      if (ch === quote && text[i - 1] !== "\\") quote = null;
      lastWasSpace = false;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      lastWasSpace = false;
      continue;
    }

    if (/\s/.test(ch)) {
      if (!lastWasSpace) {
        out += " ";
        lastWasSpace = true;
      }
      continue;
    }

    out += ch;
    lastWasSpace = false;
  }

  return out.trim();
}

/** Splits text on top-level commas — i.e. commas outside quoted strings and
 *  outside parentheses (so `:not(.a, .b)` and `rgba(0, 0, 0, .5)` are not
 *  mistaken for selector/value separators). */
function splitTopLevelCommas(text: string): string[] {
  const parts: string[] = [];
  let current = "";
  let quote: string | null = null;
  let depth = 0;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (quote) {
      current += ch;
      if (ch === quote && text[i - 1] !== "\\") quote = null;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }

    if (ch === "(") {
      depth += 1;
      current += ch;
      continue;
    }

    if (ch === ")") {
      depth = Math.max(0, depth - 1);
      current += ch;
      continue;
    }

    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  parts.push(current);
  return parts;
}

/** Splits a declaration's raw text at its first top-level colon (outside
 *  quotes and parens), separating `property` from `value`. Returns
 *  `value: null` when no colon is found at all (a bare/malformed
 *  statement) so callers can degrade gracefully instead of guessing. */
function splitDeclaration(text: string): { property: string; value: string | null } {
  let quote: string | null = null;
  let depth = 0;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (quote) {
      if (ch === quote && text[i - 1] !== "\\") quote = null;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (ch === "(") {
      depth += 1;
      continue;
    }

    if (ch === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (ch === ":" && depth === 0) {
      return { property: text.slice(0, i), value: text.slice(i + 1) };
    }
  }

  return { property: text, value: null };
}

function formatDeclarationText(raw: string): string {
  const { property, value } = splitDeclaration(raw);
  const propClean = collapseWhitespace(property);
  if (value === null) return propClean;
  const valueClean = collapseWhitespace(value);
  return valueClean === "" ? `${propClean}:` : `${propClean}: ${valueClean}`;
}

function minifyDeclarationText(raw: string): string {
  const { property, value } = splitDeclaration(raw);
  const propClean = collapseWhitespace(property);
  if (value === null) return propClean;
  const valueClean = collapseWhitespace(value);
  return valueClean === "" ? `${propClean}:` : `${propClean}:${valueClean}`;
}

/** True when `buf` ends with the identifier "url" (case-insensitive) at a
 *  word boundary — used to detect the start of a `url(` function without
 *  false-triggering on identifiers that merely end in those letters
 *  (e.g. a hypothetical custom function `--curl(...)`). */
function endsWithUrlKeyword(buf: string): boolean {
  return /(?:^|[^a-zA-Z0-9_-])url$/i.test(buf);
}

/**
 * Recursive-descent scan of the stylesheet into a tree of Nodes. Never
 * throws: unbalanced braces, unterminated strings/comments/`url(...)` and
 * stray text are all tolerated and reported back as non-fatal `issues`
 * rather than aborting.
 */
function parseCss(css: string): { nodes: Node[]; issues: string[] } {
  const n = css.length;
  let i = 0;

  let unclosedBlocks = 0;
  let strayCloses = 0;
  let unterminatedComments = 0;
  let unterminatedStrings = 0;
  let unterminatedUrls = 0;

  function readCommentRaw(): string {
    const start = i;
    const end = css.indexOf("*/", i + 2);
    if (end === -1) {
      unterminatedComments += 1;
      i = n;
      return css.slice(start);
    }
    i = end + 2;
    return css.slice(start, i);
  }

  function parseChildren(topLevel: boolean): Node[] {
    const nodes: Node[] = [];
    let buf = "";
    let quote: string | null = null;
    let inUrl = false;

    const flush = () => {
      const trimmed = buf.trim();
      buf = "";
      if (trimmed === "") return;
      if (trimmed.startsWith("@")) {
        nodes.push({ type: "at", text: trimmed });
      } else {
        nodes.push({ type: "decl", text: trimmed });
      }
    };

    while (i < n) {
      const ch = css[i];

      if (quote) {
        buf += ch;
        if (ch === quote && css[i - 1] !== "\\") quote = null;
        i += 1;
        continue;
      }

      if (ch === '"' || ch === "'") {
        quote = ch;
        buf += ch;
        i += 1;
        continue;
      }

      if (inUrl) {
        buf += ch;
        if (ch === ")") inUrl = false;
        i += 1;
        continue;
      }

      if (ch === "(" && endsWithUrlKeyword(buf)) {
        inUrl = true;
        buf += ch;
        i += 1;
        continue;
      }

      if (ch === "/" && css[i + 1] === "*") {
        const commentRaw = readCommentRaw();
        if (buf.trim() === "") {
          nodes.push({ type: "comment", text: commentRaw });
          buf = "";
        } else {
          buf += commentRaw;
        }
        continue;
      }

      if (ch === "{") {
        const prelude = buf.trim();
        buf = "";
        i += 1;
        const children = parseChildren(false);
        nodes.push({ type: "block", prelude, children });
        continue;
      }

      if (ch === "}") {
        if (topLevel) {
          strayCloses += 1;
          i += 1;
          continue;
        }
        flush();
        i += 1;
        return nodes;
      }

      if (ch === ";") {
        flush();
        i += 1;
        continue;
      }

      buf += ch;
      i += 1;
    }

    // Reached end of input.
    if (quote) unterminatedStrings += 1;
    if (inUrl) unterminatedUrls += 1;
    if (!topLevel) unclosedBlocks += 1;
    flush();
    return nodes;
  }

  const nodes = parseChildren(true);

  const issues: string[] = [];
  if (unclosedBlocks > 0) {
    issues.push(
      `${unclosedBlocks} unclosed block${unclosedBlocks > 1 ? "s" : ""} — missing closing '}'.`
    );
  }
  if (strayCloses > 0) {
    issues.push(
      `${strayCloses} unmatched closing brace${strayCloses > 1 ? "s" : ""} '}' with no opening '{'.`
    );
  }
  if (unterminatedComments > 0) {
    issues.push(
      `${unterminatedComments} unterminated comment${unterminatedComments > 1 ? "s" : ""} (missing '*/').`
    );
  }
  if (unterminatedStrings > 0) {
    issues.push(
      `${unterminatedStrings} unterminated string literal${unterminatedStrings > 1 ? "s" : ""}.`
    );
  }
  if (unterminatedUrls > 0) {
    issues.push(
      `${unterminatedUrls} unterminated url(...) value${unterminatedUrls > 1 ? "s" : ""} (missing ')').`
    );
  }

  return { nodes, issues };
}

function pad(depth: number, indentSize: number): string {
  return " ".repeat(Math.max(0, depth) * indentSize);
}

function printNodes(nodes: Node[], depth: number, indentSize: number, lines: string[]): void {
  for (const node of nodes) {
    if (node.type === "comment") {
      lines.push(pad(depth, indentSize) + node.text.trim());
      continue;
    }

    if (node.type === "at") {
      lines.push(pad(depth, indentSize) + collapseWhitespace(node.text) + ";");
      continue;
    }

    if (node.type === "decl") {
      lines.push(pad(depth, indentSize) + formatDeclarationText(node.text) + ";");
      continue;
    }

    // node.type === "block"
    const prelude = node.prelude.trim();

    if (prelude === "") {
      lines.push(pad(depth, indentSize) + "{");
    } else if (prelude.startsWith("@")) {
      // At-rule header (@media, @supports, @keyframes, @font-face, ...) —
      // kept on one line even when it contains commas (e.g.
      // `@media screen, print`), matching standard formatting convention.
      lines.push(pad(depth, indentSize) + collapseWhitespace(prelude) + " {");
    } else {
      const selectors = splitTopLevelCommas(prelude)
        .map((s) => collapseWhitespace(s))
        .filter((s) => s !== "");

      if (selectors.length === 0) {
        lines.push(pad(depth, indentSize) + "{");
      } else {
        selectors.forEach((sel, idx) => {
          const isLast = idx === selectors.length - 1;
          lines.push(pad(depth, indentSize) + sel + (isLast ? " {" : ","));
        });
      }
    }

    printNodes(node.children, depth + 1, indentSize, lines);
    lines.push(pad(depth, indentSize) + "}");
  }
}

function minifyNodes(nodes: Node[]): string {
  let out = "";

  nodes.forEach((node, idx) => {
    const isLast = idx === nodes.length - 1;

    if (node.type === "comment") {
      // Comments are stripped when minifying.
      return;
    }

    if (node.type === "at") {
      out += collapseWhitespace(node.text);
      if (!isLast) out += ";";
      return;
    }

    if (node.type === "decl") {
      out += minifyDeclarationText(node.text);
      if (!isLast) out += ";";
      return;
    }

    // node.type === "block"
    const prelude = node.prelude.trim();
    const parts = splitTopLevelCommas(prelude)
      .map((s) => collapseWhitespace(s))
      .filter((s) => s !== "");

    out += (parts.length > 0 ? parts.join(",") : collapseWhitespace(prelude)) + "{";
    out += minifyNodes(node.children);
    out += "}";
    // No trailing separator needed after a block — "}" is self-terminating,
    // and the last declaration/at-statement inside it was already emitted
    // without its own trailing ";" (isLast handling above), which is how
    // the redundant semicolon right before "}" gets dropped safely.
  });

  return out;
}

export function formatCss(input: string, indentSize: 2 | 4): CssProcessResult {
  const { nodes, issues } = parseCss(input);
  const lines: string[] = [];
  printNodes(nodes, 0, indentSize, lines);
  return { output: lines.join("\n"), issues };
}

export function minifyCss(input: string): CssProcessResult {
  const { nodes, issues } = parseCss(input);
  return { output: minifyNodes(nodes), issues };
}
