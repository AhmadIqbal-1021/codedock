/**
 * Hand-rolled JavaScript tokenizer + whitespace-only pretty-printer/minifier.
 *
 * This is deliberately NOT a real formatter. A real JS formatter needs a
 * full parser (regex-vs-division disambiguation, ASI, template literals,
 * etc.) to be correct, and getting that subtly wrong risks silently
 * corrupting someone's actual code — a far worse failure mode than
 * cosmetically-imperfect output. So this module has one non-negotiable
 * property, stronger than "don't crash":
 *
 *   The transformation is whitespace-only and content-preserving by
 *   construction. Every non-whitespace character of the input appears in
 *   the output, in the same order, byte-for-byte identical. We only ever
 *   choose how much whitespace (none / one space / a newline + indent) to
 *   place *between* tokens — we never rewrite, reorder, insert, or delete
 *   any actual code character. Even in a worst-case tokenization mistake
 *   (e.g. misjudging whether a `/` starts a regex literal), the output can
 *   only end up oddly indented — it can never contain different characters
 *   than the input.
 *
 * No external parser dependency (no prettier/acorn/espree/esprima/etc) —
 * that is the entire point of this tool.
 */

export interface JsProcessResult {
  output: string;
  /** Non-fatal diagnostics (unterminated strings/templates/comments,
   *  unbalanced braces). Formatting/minifying still succeeds and produces
   *  output even when this is non-empty. */
  issues: string[];
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

type TokenType =
  | "ws"
  | "linecomment"
  | "blockcomment"
  | "string"
  | "template"
  | "regex"
  | "number"
  | "identifier"
  | "punct";

interface Token {
  type: TokenType;
  raw: string;
  /** Set on string/template/blockcomment tokens that ran off the end of
   *  the input without a proper closing delimiter. */
  unterminated?: boolean;
}

/** Keywords after which a following `/` starts a regex literal rather than
 *  being a division/operator, per the standard lexer heuristic. */
const REGEX_ALLOWED_KEYWORDS = new Set([
  "return",
  "typeof",
  "instanceof",
  "in",
  "of",
  "new",
  "delete",
  "void",
  "throw",
  "case",
  "yield",
  "await",
]);

/** Multi-character punctuators, longest first so matching is greedy. Plain
 *  `/` and `/=` are handled by the generic punctuation fallback once regex
 *  detection has ruled itself out. */
const OPERATORS: readonly string[] = [
  ">>>=",
  "...",
  "===",
  "!==",
  "**=",
  "<<=",
  ">>=",
  "&&=",
  "||=",
  "??=",
  ">>>",
  "=>",
  "==",
  "!=",
  "<=",
  ">=",
  "&&",
  "||",
  "??",
  "?.",
  "++",
  "--",
  "+=",
  "-=",
  "*=",
  "/=",
  "%=",
  "&=",
  "|=",
  "^=",
  "<<",
  ">>",
  "**",
];

const WS_RE = /\s/;
const IDENT_START_RE = /[A-Za-z_$\p{L}]/u;
const IDENT_PART_RE = /[A-Za-z0-9_$\p{L}\p{N}]/u;

function isWordChar(ch: string): boolean {
  return /[A-Za-z0-9_$\p{L}\p{N}]/u.test(ch);
}

function regexAllowed(prevSignificant: Token | undefined): boolean {
  if (!prevSignificant) return true;
  if (prevSignificant.type === "identifier") {
    return REGEX_ALLOWED_KEYWORDS.has(prevSignificant.raw);
  }
  if (prevSignificant.type === "punct") {
    return prevSignificant.raw !== ")" && prevSignificant.raw !== "]";
  }
  // string, number, template, regex => a following `/` is division/operator.
  return false;
}

/** Reads a numeric literal (decimal/hex/octal/binary, decimals, exponents,
 *  numeric separators, BigInt `n` suffix) starting at a digit or a `.`
 *  followed by a digit. Returns the index just past the literal. This is a
 *  practical approximation of the full numeric-literal grammar, not a
 *  spec-exact implementation — safe because any under-match is still
 *  copied through character-for-character, just possibly as more than one
 *  token. */
function readNumberEnd(src: string, start: number): number {
  const n = src.length;
  let j = start;

  const isHex = src[j] === "0" && (src[j + 1] === "x" || src[j + 1] === "X");
  const isOct = src[j] === "0" && (src[j + 1] === "o" || src[j + 1] === "O");
  const isBin = src[j] === "0" && (src[j + 1] === "b" || src[j + 1] === "B");

  if (isHex) {
    j += 2;
    while (j < n && /[0-9a-fA-F_]/.test(src[j])) j += 1;
  } else if (isOct) {
    j += 2;
    while (j < n && /[0-7_]/.test(src[j])) j += 1;
  } else if (isBin) {
    j += 2;
    while (j < n && /[01_]/.test(src[j])) j += 1;
  } else {
    while (j < n && /[0-9_]/.test(src[j])) j += 1;
    if (src[j] === ".") {
      j += 1;
      while (j < n && /[0-9_]/.test(src[j])) j += 1;
    }
    if (src[j] === "e" || src[j] === "E") {
      let k = j + 1;
      if (src[k] === "+" || src[k] === "-") k += 1;
      if (/[0-9]/.test(src[k] ?? "")) {
        j = k;
        while (j < n && /[0-9_]/.test(src[j])) j += 1;
      }
    }
  }

  if (src[j] === "n") j += 1; // BigInt suffix
  return j;
}

/** Attempts to read a regex literal starting at `src[start] === "/"`.
 *  Correctly skips over `[...]` character classes (where `/` doesn't end
 *  the regex) and respects `\` escapes. Returns null if no valid regex
 *  literal is found (unterminated / hits a newline) — the caller then
 *  falls back to treating `/` as division/an operator. */
function readRegexEnd(src: string, start: number): number | null {
  const n = src.length;
  let j = start + 1;
  let inClass = false;

  while (j < n) {
    const ch = src[j];
    if (ch === "\\") {
      j += 2;
      continue;
    }
    if (ch === "\n") return null;
    if (ch === "[") {
      inClass = true;
      j += 1;
      continue;
    }
    if (ch === "]") {
      inClass = false;
      j += 1;
      continue;
    }
    if (ch === "/" && !inClass) {
      j += 1;
      while (j < n && /[A-Za-z]/.test(src[j])) j += 1;
      return j;
    }
    j += 1;
  }

  return null;
}

interface ScanResult {
  end: number;
  terminated: boolean;
}

/** Scans a template literal starting at `src[start] === "\`"`, recursively
 *  handling `${...}` substitutions (which may contain arbitrary nested JS,
 *  including nested strings and nested template literals) via
 *  `scanSubstitution`. Returns the index just past the closing backtick,
 *  and whether it was actually found. */
function scanTemplate(src: string, start: number): ScanResult {
  const n = src.length;
  let i = start + 1;

  while (i < n) {
    const ch = src[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === "`") {
      return { end: i + 1, terminated: true };
    }
    if (ch === "$" && src[i + 1] === "{") {
      const sub = scanSubstitution(src, i + 2);
      i = sub.end;
      if (!sub.terminated) return { end: i, terminated: false };
      continue;
    }
    i += 1;
  }

  return { end: n, terminated: false };
}

/** Scans a `${ ... }` substitution's contents (starting just after `${`)
 *  by tokenizing it with the full `readToken` machinery and tracking
 *  `{`/`}` depth via real punctuation tokens only — so a `}` inside a
 *  nested string/template/comment/regex character class never prematurely
 *  closes the substitution. Returns the index just past the matching `}`. */
function scanSubstitution(src: string, start: number): ScanResult {
  const n = src.length;
  let i = start;
  let depth = 0;
  let prevSignificant: Token | undefined;

  while (i < n) {
    const { token, end } = readToken(src, i, prevSignificant);

    if (token.type === "punct" && token.raw === "{") {
      depth += 1;
    } else if (token.type === "punct" && token.raw === "}") {
      if (depth === 0) return { end, terminated: true };
      depth -= 1;
    }

    if (token.type !== "ws" && token.type !== "linecomment" && token.type !== "blockcomment") {
      prevSignificant = token;
    }

    i = end;
  }

  return { end: n, terminated: false };
}

/** Reads exactly one token starting at `src[i]`. `prevSignificant` is the
 *  most recent non-whitespace, non-comment token seen so far — used only
 *  for the regex-vs-division heuristic. Always consumes at least one
 *  character. */
function readToken(src: string, i: number, prevSignificant: Token | undefined): { token: Token; end: number } {
  const n = src.length;
  const ch = src[i];

  if (WS_RE.test(ch)) {
    let j = i + 1;
    while (j < n && WS_RE.test(src[j])) j += 1;
    return { token: { type: "ws", raw: src.slice(i, j) }, end: j };
  }

  if (ch === "/" && src[i + 1] === "/") {
    let j = i + 2;
    while (j < n && src[j] !== "\n") j += 1;
    return { token: { type: "linecomment", raw: src.slice(i, j) }, end: j };
  }

  if (ch === "/" && src[i + 1] === "*") {
    const close = src.indexOf("*/", i + 2);
    const end = close === -1 ? n : close + 2;
    return { token: { type: "blockcomment", raw: src.slice(i, end), unterminated: close === -1 }, end };
  }

  if (ch === '"' || ch === "'") {
    const quote = ch;
    let j = i + 1;
    let terminated = false;
    while (j < n) {
      const c = src[j];
      if (c === "\\") {
        j += 2;
        continue;
      }
      if (c === quote) {
        j += 1;
        terminated = true;
        break;
      }
      if (c === "\n") break; // real JS strings can't contain a literal newline
      j += 1;
    }
    return { token: { type: "string", raw: src.slice(i, j), unterminated: !terminated }, end: j };
  }

  if (ch === "`") {
    const { end, terminated } = scanTemplate(src, i);
    return { token: { type: "template", raw: src.slice(i, end), unterminated: !terminated }, end };
  }

  if (ch === "/" && regexAllowed(prevSignificant)) {
    const regexEnd = readRegexEnd(src, i);
    if (regexEnd !== null) {
      return { token: { type: "regex", raw: src.slice(i, regexEnd) }, end: regexEnd };
    }
    // Not actually a valid regex (unterminated) — fall through and treat
    // the "/" as ordinary punctuation below.
  }

  if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(src[i + 1] ?? ""))) {
    const end = readNumberEnd(src, i);
    return { token: { type: "number", raw: src.slice(i, end) }, end };
  }

  if (IDENT_START_RE.test(ch)) {
    let j = i + 1;
    while (j < n && IDENT_PART_RE.test(src[j])) j += 1;
    return { token: { type: "identifier", raw: src.slice(i, j) }, end: j };
  }

  for (const op of OPERATORS) {
    if (src.startsWith(op, i)) {
      return { token: { type: "punct", raw: op }, end: i + op.length };
    }
  }

  return { token: { type: "punct", raw: ch }, end: i + 1 };
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const n = source.length;
  let i = 0;
  let prevSignificant: Token | undefined;

  while (i < n) {
    const { token, end } = readToken(source, i, prevSignificant);
    tokens.push(token);
    if (token.type !== "ws" && token.type !== "linecomment" && token.type !== "blockcomment") {
      prevSignificant = token;
    }
    // Defensive: readToken always consumes >=1 char, but guard against an
    // infinite loop rather than trust that invariant blindly.
    i = end > i ? end : i + 1;
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

function collectIssues(tokens: Token[]): string[] {
  const issues: string[] = [];
  let unterminatedStrings = 0;
  let unterminatedTemplates = 0;
  let unterminatedComments = 0;
  let braceDepth = 0;
  let sawUnmatchedClose = false;

  for (const t of tokens) {
    if (t.type === "string" && t.unterminated) unterminatedStrings += 1;
    if (t.type === "template" && t.unterminated) unterminatedTemplates += 1;
    if (t.type === "blockcomment" && t.unterminated) unterminatedComments += 1;
    if (t.type === "punct" && t.raw === "{") braceDepth += 1;
    if (t.type === "punct" && t.raw === "}") {
      if (braceDepth === 0) sawUnmatchedClose = true;
      else braceDepth -= 1;
    }
  }

  if (unterminatedStrings > 0) {
    issues.push(
      `${unterminatedStrings} string literal${unterminatedStrings > 1 ? "s" : ""} ${unterminatedStrings > 1 ? "appear" : "appears"} unterminated.`
    );
  }
  if (unterminatedTemplates > 0) {
    issues.push(
      `${unterminatedTemplates} template literal${unterminatedTemplates > 1 ? "s" : ""} ${unterminatedTemplates > 1 ? "appear" : "appears"} unterminated.`
    );
  }
  if (unterminatedComments > 0) {
    issues.push(
      `${unterminatedComments} block comment${unterminatedComments > 1 ? "s" : ""} ${unterminatedComments > 1 ? "appear" : "appears"} unterminated.`
    );
  }
  if (sawUnmatchedClose) {
    issues.push("Found a '}' with no matching '{'.");
  }
  if (braceDepth > 0) {
    issues.push(`${braceDepth} unclosed '{' brace${braceDepth > 1 ? "s" : ""}.`);
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Pretty-printer (Format)
// ---------------------------------------------------------------------------

/** Splits the full token stream into the significant (non-whitespace)
 *  tokens plus, for each one, the raw whitespace token (if any) that
 *  immediately preceded it in the source. */
function buildSignificantWithGaps(tokens: Token[]): { sig: Token[]; gaps: Array<Token | null> } {
  const sig: Token[] = [];
  const gaps: Array<Token | null> = [];
  let pendingGap: Token | null = null;

  for (const t of tokens) {
    if (t.type === "ws") {
      pendingGap = t;
      continue;
    }
    sig.push(t);
    gaps.push(pendingGap);
    pendingGap = null;
  }

  return { sig, gaps };
}

function isPunct(t: Token | undefined, raw: string): boolean {
  return !!t && t.type === "punct" && t.raw === raw;
}

/** Punctuation that clearly continues the same expression/statement a
 *  closing `}` was part of (a call's closing paren, a comma in an
 *  argument list, member access, etc.) — these should stay on the same
 *  line as the `}` rather than being pushed to a new one. */
function isBraceContinuationPunct(raw: string): boolean {
  return raw !== "{" && raw !== "(" && raw !== "[";
}

/** Keywords conventionally kept on the same line as the `}` that
 *  precedes them (`} else {`, `} catch (e) {`, `} finally {`,
 *  `} while (cond);`). */
const KEEP_WITH_PRECEDING_BRACE = new Set(["else", "catch", "finally", "while"]);

/**
 * Reindents the token stream by `{`/`}` depth and inserts line breaks
 * after `{`, before `}`, and after top-level `;` when one isn't already
 * present — without inventing any other new line breaks. Existing line
 * breaks are preserved (reindented, not removed); a run of blank lines in
 * the input collapses to at most one blank line. Paren depth is tracked
 * only to suppress the forced break-after-`;` inside `for (;;)` headers —
 * it never affects indentation.
 */
function prettyPrint(tokens: Token[], indentSize: number): string {
  const { sig, gaps } = buildSignificantWithGaps(tokens);
  if (sig.length === 0) return "";

  const pad = (depth: number) => " ".repeat(Math.max(0, depth) * indentSize);
  const outLines: string[] = [];

  let depth = 0;
  let parenDepth = 0;
  let lineDepth = 0;
  let curLine = sig[0].raw;

  if (isPunct(sig[0], "{")) depth += 1;
  if (isPunct(sig[0], "}")) depth = Math.max(0, depth - 1);
  if (isPunct(sig[0], "(")) parenDepth += 1;
  if (isPunct(sig[0], ")")) parenDepth = Math.max(0, parenDepth - 1);

  for (let k = 1; k < sig.length; k += 1) {
    const prev = sig[k - 1];
    const cur = sig[k];
    const gap = gaps[k];

    if (isPunct(cur, "}")) {
      depth = Math.max(0, depth - 1);
    }

    const afterCloseBrace = isPunct(prev, "}");
    const closeBraceContinuation =
      afterCloseBrace &&
      ((cur.type === "punct" && isBraceContinuationPunct(cur.raw)) ||
        (cur.type === "identifier" && KEEP_WITH_PRECEDING_BRACE.has(cur.raw)));

    const mustBreak =
      (isPunct(prev, "{") && !isPunct(cur, "}")) ||
      (isPunct(cur, "}") && !isPunct(prev, "{")) ||
      (isPunct(prev, ";") && parenDepth === 0) ||
      (afterCloseBrace && !closeBraceContinuation);

    const hasNewlineGap = !!gap && gap.raw.includes("\n");
    const newlineCount = hasNewlineGap ? (gap!.raw.match(/\n/g)?.length ?? 0) : 0;
    const blankLine = newlineCount >= 2;

    if (hasNewlineGap || mustBreak) {
      outLines.push(pad(lineDepth) + curLine);
      if (blankLine) outLines.push("");
      lineDepth = depth;
      curLine = cur.raw;
    } else {
      const sep = gap && gap.raw.length > 0 ? " " : "";
      curLine += sep + cur.raw;
    }

    if (isPunct(cur, "{")) depth += 1;
    if (isPunct(cur, "(")) parenDepth += 1;
    if (isPunct(cur, ")")) parenDepth = Math.max(0, parenDepth - 1);
  }

  outLines.push(pad(lineDepth) + curLine);
  return outLines.join("\n");
}

// ---------------------------------------------------------------------------
// Minifier
// ---------------------------------------------------------------------------

/** Token sequences that, if two adjacent output tokens were concatenated
 *  with no separating whitespace, would form a *different* token than
 *  either side alone intended (a longer operator, or a comment opener).
 *  Used to decide when minify must keep a single safety space. */
const RISKY_BOUNDARY_TOKENS = new Set<string>([
  ">>>=",
  "...",
  "===",
  "!==",
  "**=",
  "<<=",
  ">>=",
  "&&=",
  "||=",
  "??=",
  ">>>",
  "=>",
  "==",
  "!=",
  "<=",
  ">=",
  "&&",
  "||",
  "??",
  "?.",
  "++",
  "--",
  "+=",
  "-=",
  "*=",
  "/=",
  "%=",
  "&=",
  "|=",
  "^=",
  "<<",
  ">>",
  "**",
  "//",
  "/*",
]);

const MAX_RISKY_LEN = 4;

/** True if some suffix of `prevRaw` concatenated with some prefix of
 *  `nextRaw` spells out a risky boundary token. */
function isBoundaryRisky(prevRaw: string, nextRaw: string): boolean {
  for (let pLen = 1; pLen <= Math.min(MAX_RISKY_LEN - 1, prevRaw.length); pLen += 1) {
    const tail = prevRaw.slice(-pLen);
    const maxNLen = Math.min(MAX_RISKY_LEN - pLen, nextRaw.length);
    for (let nLen = 1; nLen <= maxNLen; nLen += 1) {
      const head = nextRaw.slice(0, nLen);
      if (RISKY_BOUNDARY_TOKENS.has(tail + head)) return true;
    }
  }
  return false;
}

const ASI_KEYWORDS = new Set(["return", "break", "continue", "throw"]);

interface ContentGapInfo {
  content: Token[];
  /** True if the original gap before content[k] contained a line
   *  terminator anywhere (in whitespace or inside a multi-line block
   *  comment) — used only to preserve the handful of well-known
   *  Automatic-Semicolon-Insertion hazards. */
  hadNewline: boolean[];
}

/** Drops whitespace and comment tokens, keeping only real code tokens,
 *  while recording whether each dropped gap contained a newline. */
function buildContentWithGapInfo(tokens: Token[]): ContentGapInfo {
  const content: Token[] = [];
  const hadNewline: boolean[] = [];
  let gapHasNewline = false;

  for (const t of tokens) {
    if (t.type === "ws" || t.type === "linecomment" || t.type === "blockcomment") {
      if (t.raw.includes("\n")) gapHasNewline = true;
      continue;
    }
    content.push(t);
    hadNewline.push(gapHasNewline);
    gapHasNewline = false;
  }

  return { content, hadNewline };
}

/**
 * Strips comments and collapses insignificant whitespace to a minimum,
 * while still only ever choosing none / one space / one bare newline
 * between tokens — never rewriting a token's own characters.
 *
 * Two safety nets are applied so the result cannot silently change
 * meaning:
 *  - A single space is kept wherever removing it would merge two tokens
 *    into a different one (identifier/keyword/number run-together, or an
 *    operator/comment-opener accidentally formed at the boundary, e.g.
 *    "a + +b" collapsing into "a++b").
 *  - The well-known Automatic-Semicolon-Insertion hazards — a newline
 *    after `return`/`break`/`continue`/`throw`, and a newline before a
 *    postfix `++`/`--` — keep a bare newline instead of being removed or
 *    turned into a space, since either would change which statement the
 *    next token belongs to.
 */
function minifyTokens(tokens: Token[]): string {
  const { content, hadNewline } = buildContentWithGapInfo(tokens);
  if (content.length === 0) return "";

  let out = content[0].raw;

  for (let k = 1; k < content.length; k += 1) {
    const prev = content[k - 1];
    const cur = content[k];
    const gapHadNewline = hadNewline[k];

    const asiKeywordHazard = gapHadNewline && prev.type === "identifier" && ASI_KEYWORDS.has(prev.raw);
    const asiPostfixHazard =
      gapHadNewline &&
      cur.type === "punct" &&
      (cur.raw === "++" || cur.raw === "--") &&
      (prev.type === "identifier" ||
        prev.type === "number" ||
        prev.type === "string" ||
        prev.type === "template" ||
        prev.type === "regex" ||
        isPunct(prev, ")") ||
        isPunct(prev, "]"));

    if (asiKeywordHazard || asiPostfixHazard) {
      out += "\n" + cur.raw;
      continue;
    }

    const lastChar = prev.raw.slice(-1);
    const firstChar = cur.raw.slice(0, 1);
    const bothWordLike = isWordChar(lastChar) && isWordChar(firstChar);
    const numberDotHazard = prev.type === "number" && firstChar === ".";

    if (bothWordLike || numberDotHazard || isBoundaryRisky(prev.raw, cur.raw)) {
      out += " " + cur.raw;
    } else {
      out += cur.raw;
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function formatJs(input: string, indentSize: 2 | 4): JsProcessResult {
  const tokens = tokenize(input);
  return {
    output: prettyPrint(tokens, indentSize),
    issues: collectIssues(tokens),
  };
}

export function minifyJs(input: string): JsProcessResult {
  const tokens = tokenize(input);
  return {
    output: minifyTokens(tokens),
    issues: collectIssues(tokens),
  };
}
