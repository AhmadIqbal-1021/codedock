/**
 * Hand-rolled HTML tokenizer + pretty-printer/minifier.
 *
 * No external dependency (no prettier/js-beautify/parser package) — this
 * walks the markup with a small state machine and rebuilds it. It is a
 * formatting convenience, not a browser-grade HTML5 parser: it does not
 * attempt full malformed-markup recovery or void-element auto-closing.
 * It is designed to never throw on ordinary (even messy) input and to
 * always make forward progress through the string.
 *
 * Content inside <script>, <style>, <textarea> and <pre> is treated as an
 * atomic, verbatim block — it is never re-tokenized, reflowed, or
 * re-indented, since whitespace inside those elements is semantically
 * significant (or, for script/style, not markup at all).
 */

export interface HtmlProcessResult {
  output: string;
  /** Non-fatal structural diagnostics (e.g. unclosed tags). Formatting/
   *  minifying still succeeds and produces output even when this is
   *  non-empty — HTML is looser than JSON, so these are best-effort
   *  warnings, not parse failures. */
  issues: string[];
}

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/** Elements whose inner content must pass through completely untouched. */
const RAW_TEXT_ELEMENTS = new Set(["script", "style", "textarea", "pre"]);

/**
 * Tags where whitespace-only text sitting between two of them is purely
 * indentation (safe to drop entirely when minifying). Anything not in this
 * set is treated conservatively — a whitespace-only text node next to an
 * inline-ish tag is collapsed to a single space rather than removed, since
 * removing it could visibly change rendering (e.g. "<span>a</span>
 * <span>b</span>").
 */
const BLOCK_LEVEL_TAGS = new Set([
  "html",
  "head",
  "body",
  "title",
  "meta",
  "link",
  "base",
  "style",
  "script",
  "div",
  "section",
  "article",
  "header",
  "footer",
  "nav",
  "main",
  "aside",
  "p",
  "ul",
  "ol",
  "li",
  "dl",
  "dt",
  "dd",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "td",
  "th",
  "caption",
  "colgroup",
  "col",
  "form",
  "fieldset",
  "legend",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "br",
  "pre",
  "blockquote",
  "address",
  "figure",
  "figcaption",
  "details",
  "summary",
  "dialog",
  "template",
  "select",
  "optgroup",
  "option",
  "textarea",
  "button",
  "label",
  "noscript",
]);

type Token =
  | { type: "doctype"; raw: string }
  | { type: "comment"; raw: string }
  | { type: "text"; raw: string }
  | { type: "open"; tag: string; raw: string; selfClosing: boolean; void: boolean }
  | { type: "close"; tag: string; raw: string }
  | { type: "raw"; tag: string; openRaw: string; content: string; closeRaw: string };

/** Finds the index just past the `>` that closes the tag starting at
 *  `start`, correctly skipping `>` characters inside quoted attribute
 *  values (e.g. `<a title="a > b">`). */
function findTagEnd(html: string, start: number): number {
  let i = start + 1;
  let quote: string | null = null;

  while (i < html.length) {
    const ch = html[i];

    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === ">") {
      return i + 1;
    }

    i += 1;
  }

  return html.length;
}

function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  const n = html.length;
  let i = 0;

  while (i < n) {
    if (html[i] !== "<") {
      const next = html.indexOf("<", i);
      const end = next === -1 ? n : next;
      tokens.push({ type: "text", raw: html.slice(i, end) });
      i = end;
      continue;
    }

    if (html.startsWith("<!--", i)) {
      const close = html.indexOf("-->", i + 4);
      const end = close === -1 ? n : close + 3;
      tokens.push({ type: "comment", raw: html.slice(i, end) });
      i = end;
      continue;
    }

    if (html.startsWith("<!", i)) {
      const close = html.indexOf(">", i);
      const end = close === -1 ? n : close + 1;
      tokens.push({ type: "doctype", raw: html.slice(i, end) });
      i = end;
      continue;
    }

    if (html[i + 1] === "/") {
      const close = html.indexOf(">", i);
      const end = close === -1 ? n : close + 1;
      const raw = html.slice(i, end);
      const match = /^<\/\s*([a-zA-Z][a-zA-Z0-9:_-]*)/.exec(raw);
      tokens.push({ type: "close", tag: match ? match[1].toLowerCase() : "", raw });
      i = end;
      continue;
    }

    if (/[a-zA-Z]/.test(html[i + 1] ?? "")) {
      const end = findTagEnd(html, i);
      const raw = html.slice(i, end);
      const match = /^<\s*([a-zA-Z][a-zA-Z0-9:_-]*)/.exec(raw);
      const tag = match ? match[1].toLowerCase() : "";
      const selfClosing = /\/\s*>$/.test(raw);
      const isVoid = VOID_ELEMENTS.has(tag);

      if (RAW_TEXT_ELEMENTS.has(tag) && !selfClosing) {
        const closeRe = new RegExp(`</${tag}\\s*>`, "i");
        const rest = html.slice(end);
        const m = closeRe.exec(rest);

        if (m) {
          tokens.push({
            type: "raw",
            tag,
            openRaw: raw,
            content: rest.slice(0, m.index),
            closeRaw: m[0],
          });
          i = end + m.index + m[0].length;
        } else {
          // No closing tag found for the rest of the document — treat
          // everything remaining as verbatim content rather than guessing.
          tokens.push({ type: "raw", tag, openRaw: raw, content: rest, closeRaw: "" });
          i = n;
        }
        continue;
      }

      tokens.push({ type: "open", tag, raw, selfClosing, void: isVoid });
      i = end;
      continue;
    }

    // A lone '<' that isn't a recognizable tag/comment/doctype (e.g. "1 < 2
    // is true") — treat it as a literal text character and move on.
    tokens.push({ type: "text", raw: "<" });
    i += 1;
  }

  return tokens;
}

/** Best-effort structural diagnostics: unmatched closing tags and tags
 *  left open at end of input. Loose/mismatched nesting is tolerated
 *  (real-world HTML is full of it) — this never throws, it only reports. */
function collectStructuralIssues(tokens: Token[]): string[] {
  const issues: string[] = [];
  const stack: string[] = [];

  for (const token of tokens) {
    if (token.type === "open" && !token.void && !token.selfClosing) {
      stack.push(token.tag);
    } else if (token.type === "close") {
      if (token.tag === "") continue;

      const idx = stack.lastIndexOf(token.tag);
      if (idx === -1) {
        issues.push(`Closing tag </${token.tag}> has no matching opening tag.`);
      } else {
        stack.length = idx;
      }
    }
  }

  if (stack.length > 0) {
    const counts = new Map<string, number>();
    for (const tag of stack) counts.set(tag, (counts.get(tag) ?? 0) + 1);

    const parts = [...counts.entries()].map(([tag, count]) =>
      count > 1 ? `<${tag}> (x${count})` : `<${tag}>`
    );

    issues.push(`Unclosed tag${stack.length > 1 ? "s" : ""}: ${parts.join(", ")}`);
  }

  return issues;
}

function prettyPrint(tokens: Token[], indentSize: number): string {
  const pad = (depth: number) => " ".repeat(Math.max(0, depth) * indentSize);
  const lines: string[] = [];
  let depth = 0;
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === "doctype" || token.type === "comment") {
      lines.push(pad(depth) + token.raw);
      i += 1;
      continue;
    }

    if (token.type === "raw") {
      if (token.content.length === 0) {
        lines.push(pad(depth) + token.openRaw + token.closeRaw);
      } else {
        lines.push(pad(depth) + token.openRaw);
        lines.push(token.content);
        lines.push(pad(depth) + token.closeRaw);
      }
      i += 1;
      continue;
    }

    if (token.type === "close") {
      depth = Math.max(0, depth - 1);
      lines.push(pad(depth) + token.raw);
      i += 1;
      continue;
    }

    if (token.type === "text") {
      const trimmed = token.raw.trim();
      if (trimmed !== "") {
        lines.push(pad(depth) + trimmed.replace(/\s+/g, " "));
      }
      i += 1;
      continue;
    }

    // token.type === "open"
    if (token.void || token.selfClosing) {
      lines.push(pad(depth) + token.raw);
      i += 1;
      continue;
    }

    const next = tokens[i + 1];
    const afterNext = tokens[i + 2];

    if (next?.type === "close" && next.tag === token.tag) {
      // Empty element, e.g. <div></div> — keep on one line.
      lines.push(pad(depth) + token.raw + next.raw);
      i += 2;
      continue;
    }

    if (
      next?.type === "text" &&
      next.raw.trim() !== "" &&
      afterNext?.type === "close" &&
      afterNext.tag === token.tag
    ) {
      // Text-only leaf, e.g. <li>Item</li> — keep on one line.
      lines.push(pad(depth) + token.raw + next.raw.trim().replace(/\s+/g, " ") + afterNext.raw);
      i += 3;
      continue;
    }

    lines.push(pad(depth) + token.raw);
    depth += 1;
    i += 1;
  }

  return lines.join("\n");
}

/** Collapses runs of whitespace inside a tag's own markup (attribute
 *  spacing) to a single space, without touching whitespace inside quoted
 *  attribute values. */
function normalizeTagWhitespace(raw: string): string {
  let result = "";
  let quote: string | null = null;
  let lastWasSpace = false;

  for (const ch of raw) {
    if (quote) {
      result += ch;
      if (ch === quote) quote = null;
      lastWasSpace = false;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      result += ch;
      lastWasSpace = false;
      continue;
    }

    if (/\s/.test(ch)) {
      if (!lastWasSpace) {
        result += " ";
        lastWasSpace = true;
      }
      continue;
    }

    result += ch;
    lastWasSpace = false;
  }

  return result.replace(/\s+(\/?>)$/, "$1").replace(/^(<\/?)\s+/, "$1");
}

function isBlockishToken(token: Token | undefined): boolean {
  if (!token) return true; // start/end of document — safe to drop whitespace there
  if (token.type === "doctype" || token.type === "comment") return true; // render nothing
  if (token.type === "open" || token.type === "close" || token.type === "raw") {
    return BLOCK_LEVEL_TAGS.has(token.tag);
  }
  return false;
}

function minifyTokens(tokens: Token[]): string {
  let out = "";

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    switch (token.type) {
      case "doctype":
        out += token.raw.replace(/\s+/g, " ").trim();
        break;

      case "comment":
        // Comments are preserved verbatim (not stripped) — this keeps
        // conditional comments and license headers intact rather than
        // silently discarding user content.
        out += token.raw;
        break;

      case "raw":
        out += token.openRaw + token.content + token.closeRaw;
        break;

      case "open":
      case "close":
        out += normalizeTagWhitespace(token.raw);
        break;

      case "text": {
        const isWhitespaceOnly = token.raw.trim() === "";

        if (isWhitespaceOnly) {
          const prevBlock = isBlockishToken(tokens[i - 1]);
          const nextBlock = isBlockishToken(tokens[i + 1]);
          out += prevBlock && nextBlock ? "" : " ";
        } else {
          out += token.raw.replace(/\s+/g, " ");
        }
        break;
      }

      default:
        break;
    }
  }

  return out;
}

export function formatHtml(input: string, indentSize: 2 | 4): HtmlProcessResult {
  const tokens = tokenize(input);
  return {
    output: prettyPrint(tokens, indentSize),
    issues: collectStructuralIssues(tokens),
  };
}

export function minifyHtml(input: string): HtmlProcessResult {
  const tokens = tokenize(input);
  return {
    output: minifyTokens(tokens),
    issues: collectStructuralIssues(tokens),
  };
}
