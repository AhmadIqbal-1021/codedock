/**
 * Hand-rolled XML tokenizer + pretty-printer/minifier.
 *
 * No external dependency (no parser package) — this walks generic XML with
 * a small state machine and rebuilds it. It is a formatting convenience,
 * not a spec-strict XML parser: it does not validate well-formedness (no
 * DTD/schema resolution, no entity expansion) and never throws — it is
 * designed to always make forward progress through the string and to
 * always produce *some* output from the tokens actually present.
 *
 * This is intentionally NOT a copy of the HTML formatter's assumptions:
 *
 * - XML tag/attribute names are case-SENSITIVE (`<Item>` and `<item>` are
 *   different elements) — tag names are never lowercased here, unlike the
 *   HTML formatter.
 * - There is no void-element list. Any element may self-close (`<x/>`) or
 *   use an explicit close tag (`<x></x>`) — that's purely a property of
 *   what the source text wrote, not of the element name.
 * - `<?xml ... ?>` and any other processing instruction (`<? ... ?>`), plus
 *   `<!DOCTYPE ...>`, are recognized as their own token and passed through
 *   with their inner content completely unmodified.
 * - `<![CDATA[ ... ]]>` sections are treated as atomic, verbatim blocks —
 *   like HTML's `<pre>`/`<script>` handling — since CDATA exists
 *   specifically to hold content that must never be reparsed as markup.
 * - Ordinary text content between tags has its actual characters left
 *   untouched. Formatting only trims *leading/trailing* whitespace from a
 *   text node (the purely structural indentation between elements) — it
 *   never collapses internal whitespace runs the way the HTML formatter
 *   does, since whitespace inside XML text content can be significant.
 *   Whitespace-only text nodes (pure indentation) are dropped when
 *   formatting (indentation is regenerated from nesting depth) and when
 *   minifying (insignificant inter-tag whitespace); any text node with
 *   real content is otherwise preserved verbatim.
 */

export interface XmlProcessResult {
  output: string;
  /** Non-fatal structural diagnostics (unclosed/mismatched tags,
   *  unterminated comments/CDATA/processing instructions). Formatting/
   *  minifying still succeeds and produces output even when this is
   *  non-empty — these are best-effort warnings, not parse failures. */
  issues: string[];
}

type Token =
  | { type: "pi"; raw: string }
  | { type: "doctype"; raw: string }
  | { type: "comment"; raw: string }
  | { type: "cdata"; raw: string }
  | { type: "text"; raw: string }
  | { type: "open"; tag: string; raw: string; selfClosing: boolean }
  | { type: "close"; tag: string; raw: string };

const TAG_NAME_RE = /^<\/?\s*([a-zA-Z_][a-zA-Z0-9_.:-]*)/;

/** Finds the index just past the `>` that closes the tag starting at
 *  `start`, correctly skipping `>` characters inside quoted attribute
 *  values (e.g. `<a title="a > b">`). Same approach as the HTML
 *  formatter's `findTagEnd`. */
function findTagEnd(xml: string, start: number): number {
  let i = start + 1;
  let quote: string | null = null;

  while (i < xml.length) {
    const ch = xml[i];

    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === ">") {
      return i + 1;
    }

    i += 1;
  }

  return xml.length;
}

/**
 * Walks the input into a flat token stream. Also returns a list of
 * human-readable labels for anything that ran off the end of the string
 * unterminated (comment, CDATA section, processing instruction/DOCTYPE) —
 * the caller turns these into non-fatal issues rather than aborting.
 */
function tokenize(xml: string): { tokens: Token[]; unterminated: string[] } {
  const tokens: Token[] = [];
  const unterminated: string[] = [];
  const n = xml.length;
  let i = 0;

  while (i < n) {
    if (xml[i] !== "<") {
      const next = xml.indexOf("<", i);
      const end = next === -1 ? n : next;
      tokens.push({ type: "text", raw: xml.slice(i, end) });
      i = end;
      continue;
    }

    // Processing instruction, including the XML declaration itself
    // (<?xml version="1.0" ... ?>).
    if (xml.startsWith("<?", i)) {
      const close = xml.indexOf("?>", i + 2);
      const end = close === -1 ? n : close + 2;
      if (close === -1) unterminated.push("processing instruction");
      tokens.push({ type: "pi", raw: xml.slice(i, end) });
      i = end;
      continue;
    }

    // CDATA section — copied through completely verbatim, never reparsed.
    if (xml.startsWith("<![CDATA[", i)) {
      const close = xml.indexOf("]]>", i + 9);
      const end = close === -1 ? n : close + 3;
      if (close === -1) unterminated.push("CDATA section");
      tokens.push({ type: "cdata", raw: xml.slice(i, end) });
      i = end;
      continue;
    }

    // Comment.
    if (xml.startsWith("<!--", i)) {
      const close = xml.indexOf("-->", i + 4);
      const end = close === -1 ? n : close + 3;
      if (close === -1) unterminated.push("comment");
      tokens.push({ type: "comment", raw: xml.slice(i, end) });
      i = end;
      continue;
    }

    // DOCTYPE (or any other <! ... > declaration). Tracks bracket depth so
    // a DOCTYPE with an internal subset (`<!DOCTYPE x [ ... ]>`) isn't cut
    // short by a `>` that belongs to a nested declaration inside `[ ]`.
    if (xml.startsWith("<!", i)) {
      let j = i + 2;
      let bracketDepth = 0;
      let closed = false;

      while (j < n) {
        const ch = xml[j];
        if (ch === "[") bracketDepth += 1;
        else if (ch === "]") bracketDepth = Math.max(0, bracketDepth - 1);
        else if (ch === ">" && bracketDepth === 0) {
          j += 1;
          closed = true;
          break;
        }
        j += 1;
      }

      if (!closed) unterminated.push("DOCTYPE declaration");
      tokens.push({ type: "doctype", raw: xml.slice(i, j) });
      i = j;
      continue;
    }

    // Closing tag.
    if (xml[i + 1] === "/") {
      const close = xml.indexOf(">", i);
      const end = close === -1 ? n : close + 1;
      const raw = xml.slice(i, end);
      const match = TAG_NAME_RE.exec(raw);
      tokens.push({ type: "close", tag: match ? match[1] : "", raw });
      i = end;
      continue;
    }

    // Opening (possibly self-closing) tag.
    if (/[a-zA-Z_]/.test(xml[i + 1] ?? "")) {
      const end = findTagEnd(xml, i);
      const raw = xml.slice(i, end);
      const match = TAG_NAME_RE.exec(raw);
      const tag = match ? match[1] : "";
      const selfClosing = /\/\s*>$/.test(raw);
      tokens.push({ type: "open", tag, raw, selfClosing });
      i = end;
      continue;
    }

    // A lone '<' that isn't a recognizable construct (e.g. "1 < 2 is
    // true" in stray text) — treat it as a literal text character.
    tokens.push({ type: "text", raw: "<" });
    i += 1;
  }

  return { tokens, unterminated };
}

/** Turns the raw "ran off the end of input" labels collected during
 *  tokenizing into de-duplicated, counted, human-readable issue strings. */
function summarizeUnterminated(unterminated: string[]): string[] {
  const counts = new Map<string, number>();
  for (const label of unterminated) counts.set(label, (counts.get(label) ?? 0) + 1);

  return [...counts.entries()].map(
    ([label, count]) => `Unterminated ${label}${count > 1 ? ` (x${count})` : ""} — missing closing marker.`
  );
}

/** Best-effort structural diagnostics: unmatched closing tags and tags
 *  left open at end of input. Tag names are compared case-sensitively,
 *  matching XML semantics. Loose/mismatched nesting is tolerated — this
 *  never throws, it only reports. */
function collectStructuralIssues(tokens: Token[]): string[] {
  const issues: string[] = [];
  const stack: string[] = [];

  for (const token of tokens) {
    if (token.type === "open" && !token.selfClosing) {
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

    if (token.type === "pi" || token.type === "doctype" || token.type === "comment") {
      lines.push(pad(depth) + token.raw);
      i += 1;
      continue;
    }

    if (token.type === "cdata") {
      lines.push(pad(depth) + token.raw);
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
      // Only the leading/trailing (purely structural) whitespace is
      // trimmed — internal whitespace is never collapsed, since it can be
      // semantically significant in XML text content.
      const trimmed = token.raw.trim();
      if (trimmed !== "") {
        lines.push(pad(depth) + trimmed);
      }
      i += 1;
      continue;
    }

    // token.type === "open"
    if (token.selfClosing) {
      lines.push(pad(depth) + token.raw);
      i += 1;
      continue;
    }

    const next = tokens[i + 1];
    const afterNext = tokens[i + 2];

    if (next?.type === "close" && next.tag === token.tag) {
      // Empty element, e.g. <name></name> — keep on one line.
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
      // Text-only leaf, e.g. <name>Value</name> — keep on one line.
      lines.push(pad(depth) + token.raw + next.raw.trim() + afterNext.raw);
      i += 3;
      continue;
    }

    if (next?.type === "cdata" && afterNext?.type === "close" && afterNext.tag === token.tag) {
      // CDATA-only leaf, e.g. <name><![CDATA[...]]></name> — keep on one line.
      lines.push(pad(depth) + token.raw + next.raw + afterNext.raw);
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
 *  attribute values. Only used when minifying — formatted output keeps a
 *  tag's original internal spacing untouched, same convention as the HTML
 *  formatter. */
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

function minifyTokens(tokens: Token[]): string {
  let out = "";

  for (const token of tokens) {
    switch (token.type) {
      case "pi":
      case "doctype":
      case "comment":
      case "cdata":
        // Passed through completely unmodified — this is exactly the
        // content the CDATA/comment/declaration exists to protect.
        out += token.raw;
        break;

      case "open":
      case "close":
        out += normalizeTagWhitespace(token.raw);
        break;

      case "text":
        if (token.raw.trim() === "") {
          // Purely structural inter-tag whitespace — insignificant, drop it.
          break;
        }
        // Real text content is preserved untouched, exactly as written.
        out += token.raw;
        break;

      default:
        break;
    }
  }

  return out;
}

export function formatXml(input: string, indentSize: 2 | 4): XmlProcessResult {
  const { tokens, unterminated } = tokenize(input);
  return {
    output: prettyPrint(tokens, indentSize),
    issues: [...summarizeUnterminated(unterminated), ...collectStructuralIssues(tokens)],
  };
}

export function minifyXml(input: string): XmlProcessResult {
  const { tokens, unterminated } = tokenize(input);
  return {
    output: minifyTokens(tokens),
    issues: [...summarizeUnterminated(unterminated), ...collectStructuralIssues(tokens)],
  };
}
