/**
 * Hand-rolled Markdown parser.
 *
 * This module never produces an HTML string — it parses Markdown source
 * into a plain, typed tree of block/inline nodes (`BlockNode[]` /
 * `InlineNode[]`). The component that consumes this tree
 * (`MarkdownPreviewer.tsx`) walks it and builds real React elements via
 * normal JSX, so all text content goes through React's own escaping and is
 * never interpreted as markup. There is no `dangerouslySetInnerHTML`
 * anywhere in this tool, and there does not need to be one — a raw HTML
 * string is never constructed at any point in this pipeline.
 *
 * This is a "good enough" CommonMark-ish subset, not a spec-compliant
 * implementation: no reference-style links, no footnotes, no setext
 * headings, one level of list nesting. Anything outside the supported
 * subset degrades to literal text, which is an acceptable, safe
 * simplification rather than a bug.
 *
 * Link and image URLs are passed through `sanitizeUrl`, which only allows
 * `http:`, `https:`, `mailto:`, and relative/anchor URLs. Anything else
 * (notably `javascript:` and `data:`) resolves to `null`, and the renderer
 * treats a `null` href/src as "render as inert text instead of a live
 * link" — never as "silently drop the attribute but still render a
 * clickable element."
 */

export type InlineNode =
  | { type: "text"; value: string }
  | { type: "break" }
  | { type: "bold"; children: InlineNode[] }
  | { type: "italic"; children: InlineNode[] }
  | { type: "code"; value: string }
  | { type: "link"; href: string | null; children: InlineNode[] }
  | { type: "image"; src: string | null; alt: string };

export interface ListItemNode {
  content: InlineNode[];
  /** One level of nested content (typically a single nested list block). */
  children?: BlockNode[];
}

export type BlockNode =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; children: InlineNode[] }
  | { type: "paragraph"; children: InlineNode[] }
  | { type: "blockquote"; children: BlockNode[] }
  | { type: "code-block"; value: string; lang: string | null }
  | { type: "list"; ordered: boolean; items: ListItemNode[] }
  | { type: "hr" };

const ALLOWED_URL_SCHEMES = new Set(["http:", "https:", "mailto:"]);
const SCHEME_RE = /^([a-zA-Z][a-zA-Z0-9+.-]*):/;

/**
 * Allowlist-based URL sanitizer for link/image targets. Relative paths and
 * anchors are passed through unchanged; a recognized-but-disallowed scheme
 * (e.g. `javascript:`, `data:`, `vbscript:`) returns `null` so the caller
 * renders inert text instead of a clickable/loadable element.
 */
function sanitizeUrl(rawUrl: string): string | null {
  const url = rawUrl.trim();
  if (!url) return null;

  // Anchors and relative/root-relative paths never carry a scheme that
  // could execute script — always safe to pass through.
  if (url.startsWith("#") || url.startsWith("/") || url.startsWith("./") || url.startsWith("../")) {
    return url;
  }

  const schemeMatch = SCHEME_RE.exec(url);
  if (!schemeMatch) {
    // No scheme (e.g. "example.com/page") — treat as a relative reference.
    return url;
  }

  const scheme = `${schemeMatch[1].toLowerCase()}:`;
  return ALLOWED_URL_SCHEMES.has(scheme) ? url : null;
}

const LINK_RE = /^\[([^[\]\n]*)\]\(\s*([^()\s]*)(?:\s+"[^"]*")?\s*\)/;
const IMAGE_RE = /^!\[([^[\]\n]*)\]\(\s*([^()\s]*)(?:\s+"[^"]*")?\s*\)/;

/**
 * Parses a single line/segment of Markdown into inline nodes: bold,
 * italic, inline code, links, images, and plain text. Recurses into link
 * text and emphasis content so nesting (e.g. `**bold *and italic* text**`)
 * works, without ever building an HTML string.
 */
export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let buffer = "";
  let i = 0;

  const flush = () => {
    if (buffer) {
      nodes.push({ type: "text", value: buffer });
      buffer = "";
    }
  };

  while (i < text.length) {
    const ch = text[i];

    // Inline code span: `code` or ``code with ` backtick``.
    if (ch === "`") {
      let j = i;
      while (text[j] === "`") j++;
      const run = j - i;
      const fence = "`".repeat(run);
      const closeIdx = text.indexOf(fence, j);
      if (closeIdx !== -1) {
        flush();
        let content = text.slice(j, closeIdx);
        if (content.startsWith(" ") && content.endsWith(" ") && content.trim().length > 0) {
          content = content.slice(1, -1);
        }
        nodes.push({ type: "code", value: content });
        i = closeIdx + run;
        continue;
      }
    }

    // Image: ![alt](url) — checked before link since both start with "[".
    if (ch === "!" && text[i + 1] === "[") {
      const match = IMAGE_RE.exec(text.slice(i));
      if (match) {
        flush();
        nodes.push({ type: "image", alt: match[1], src: sanitizeUrl(match[2]) });
        i += match[0].length;
        continue;
      }
    }

    // Link: [text](url)
    if (ch === "[") {
      const match = LINK_RE.exec(text.slice(i));
      if (match) {
        flush();
        nodes.push({
          type: "link",
          href: sanitizeUrl(match[2]),
          children: parseInline(match[1]),
        });
        i += match[0].length;
        continue;
      }
    }

    // Emphasis: ***bold italic***, **bold**, *italic* (and _ variants).
    if (ch === "*" || ch === "_") {
      let j = i;
      while (text[j] === ch) j++;
      const run = j - i;
      const candidateLengths = run >= 3 ? [3, 2, 1] : run === 2 ? [2, 1] : [1];

      let matched = false;
      for (const len of candidateLengths) {
        const marker = ch.repeat(len);
        const searchStart = i + len;
        const nextChar = text[searchStart];
        if (nextChar === undefined || nextChar === " ") continue;

        const closeIdx = text.indexOf(marker, searchStart);
        if (closeIdx === -1 || closeIdx <= searchStart) continue;
        if (text[closeIdx - 1] === " ") continue;

        flush();
        const inner = parseInline(text.slice(searchStart, closeIdx));
        if (len === 3) {
          nodes.push({ type: "bold", children: [{ type: "italic", children: inner }] });
        } else if (len === 2) {
          nodes.push({ type: "bold", children: inner });
        } else {
          nodes.push({ type: "italic", children: inner });
        }
        i = closeIdx + len;
        matched = true;
        break;
      }
      if (matched) continue;
    }

    buffer += ch;
    i++;
  }

  flush();
  return nodes;
}

/**
 * Parses a paragraph's raw lines into inline nodes, joining lines the way
 * Markdown does: a normal line break becomes a single space (soft break),
 * a line ending in two-or-more trailing spaces becomes an explicit line
 * break.
 */
function parseParagraphInline(lines: string[]): InlineNode[] {
  const nodes: InlineNode[] = [];
  lines.forEach((rawLine, index) => {
    const hardBreak = /  +$/.test(rawLine);
    const trimmedLine = rawLine.replace(/\s+$/, "");
    nodes.push(...parseInline(trimmedLine));
    if (index < lines.length - 1) {
      nodes.push(hardBreak ? { type: "break" } : { type: "text", value: " " });
    }
  });
  return nodes;
}

const BLANK_RE = /^\s*$/;
const FENCE_OPEN_RE = /^ {0,3}(```|~~~)(.*)$/;
const HEADING_RE = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const HR_RE = /^ {0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/;
const BLOCKQUOTE_RE = /^ {0,3}>/;
const UL_RE = /^(\s*)[-*+]\s+(.*)$/;
const OL_RE = /^(\s*)\d{1,9}[.)]\s+(.*)$/;
const NESTED_LIST_RE = /^(\s{2,})(?:[-*+]|\d{1,9}[.)])\s+.*$/;

function isFenceClose(line: string, fenceChar: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return [...trimmed].every((c) => c === fenceChar);
}

function isBlockStart(line: string): boolean {
  return (
    BLANK_RE.test(line) ||
    FENCE_OPEN_RE.test(line) ||
    HEADING_RE.test(line) ||
    HR_RE.test(line) ||
    BLOCKQUOTE_RE.test(line) ||
    UL_RE.test(line) ||
    OL_RE.test(line)
  );
}

/** Parses an array of source lines into a list of block nodes. Recurses
 *  (on dedented sub-slices) for blockquote and nested-list content. */
function parseBlocks(lines: string[]): BlockNode[] {
  const blocks: BlockNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (BLANK_RE.test(line)) {
      i++;
      continue;
    }

    const fenceMatch = FENCE_OPEN_RE.exec(line);
    if (fenceMatch) {
      const fenceChar = fenceMatch[1][0];
      const lang = fenceMatch[2].trim() || null;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !isFenceClose(lines[i], fenceChar)) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip the closing fence line (or step past EOF harmlessly)
      blocks.push({ type: "code-block", value: codeLines.join("\n"), lang });
      continue;
    }

    const headingMatch = HEADING_RE.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({ type: "heading", level, children: parseInline(headingMatch[2]) });
      i++;
      continue;
    }

    if (HR_RE.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    if (BLOCKQUOTE_RE.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && BLOCKQUOTE_RE.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^ {0,3}>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", children: parseBlocks(quoteLines) });
      continue;
    }

    const ulMatch = UL_RE.exec(line);
    const olMatch = OL_RE.exec(line);
    if (ulMatch || olMatch) {
      const ordered = !!olMatch;
      const items: ListItemNode[] = [];

      while (i < lines.length) {
        const match = ordered ? OL_RE.exec(lines[i]) : UL_RE.exec(lines[i]);
        if (!match || match[1].length >= 2) break;

        const content = match[2];
        i++;

        const nestedLines: string[] = [];
        while (i < lines.length) {
          const nestedMatch = NESTED_LIST_RE.exec(lines[i]);
          if (nestedMatch) {
            nestedLines.push(lines[i].slice(nestedMatch[1].length));
            i++;
          } else {
            break;
          }
        }

        const item: ListItemNode = { content: parseInline(content) };
        if (nestedLines.length > 0) {
          item.children = parseBlocks(nestedLines);
        }
        items.push(item);
      }

      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length && !isBlockStart(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }

    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", children: parseParagraphInline(paraLines) });
    } else {
      // Defensive fallback: guarantees forward progress on any line shape
      // not otherwise handled above, so this loop can never hang.
      i++;
    }
  }

  return blocks;
}

/** Parses full Markdown source text into a tree of block nodes. */
export function parseMarkdown(source: string): BlockNode[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  return parseBlocks(lines);
}
