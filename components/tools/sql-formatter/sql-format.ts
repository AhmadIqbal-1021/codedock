/**
 * Hand-rolled SQL tokenizer + whitespace-only pretty-printer/minifier.
 *
 * This is deliberately NOT a real, dialect-aware SQL parser. SQL syntax
 * varies across MySQL/Postgres/SQLite/SQL Server/etc, and getting
 * dialect-specific grammar subtly wrong risks silently corrupting someone's
 * actual query (mangling a string literal, misjudging a comment/string
 * boundary and eating real query text, etc) — a far worse failure mode
 * than cosmetically-imperfect output. So this module follows the exact
 * same non-negotiable property as components/tools/js-formatter/js-format.ts:
 *
 *   The transformation is whitespace-only and content-preserving by
 *   construction. Every token's actual characters appear in the output, in
 *   the same order, unchanged — we only ever choose how much whitespace
 *   (none / one space / a newline + indent) to place *between* tokens. We
 *   never rewrite, reorder, insert, or delete any actual token character.
 *
 * The ONE narrow, explicit, opt-in exception: an optional "Uppercase
 * keywords" toggle (off by default) that changes the case of recognized
 * SQL keyword tokens only, e.g. `select` -> `SELECT`. This is safe
 * specifically because SQL keywords are case-insensitive in every
 * mainstream dialect, so changing a keyword's case can never change query
 * semantics. It never touches string literals, quoted/backtick/bracket
 * identifiers, comments, or plain (non-keyword) identifiers — those are
 * copied through with their original case always, toggle or not.
 *
 * No external dependency (no `sql-formatter` npm package, no parser) —
 * that is the entire point of this tool.
 *
 * Self-check performed before shipping (see the tool's own testing notes):
 * with the keyword-case toggle OFF, stripping all whitespace from the
 * input and from the formatted/minified output produces character-for-
 * character identical strings for representative multi-clause queries.
 * With the toggle ON, the same check holds case-insensitively (only
 * recognized-keyword case differs, nothing else).
 */

export interface SqlProcessResult {
  output: string;
  /** Non-fatal diagnostics (unterminated strings/quoted identifiers/
   *  comments, unbalanced parentheses). Formatting/minifying still
   *  succeeds and produces output even when this is non-empty. */
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
  | "quotedident"
  | "number"
  | "word"
  | "punct";

interface Token {
  type: TokenType;
  raw: string;
  /** Set on string/quotedident/blockcomment tokens that ran off the end of
   *  the input without a proper closing delimiter. */
  unterminated?: boolean;
}

/** Multi-character punctuators/operators, longest first so matching is
 *  greedy (e.g. "->>"" must be tried before "->"). */
const OPERATORS: readonly string[] = ["->>", "<=", ">=", "<>", "!=", "||", "::", "->"];

const WS_RE = /\s/;
const IDENT_START_RE = /[A-Za-z_\p{L}]/u;
const IDENT_PART_RE = /[A-Za-z0-9_$\p{L}\p{N}]/u;

function isWordChar(ch: string): boolean {
  return /[A-Za-z0-9_$\p{L}\p{N}]/u.test(ch);
}

interface ScanResult {
  end: number;
  terminated: boolean;
}

/** Scans a `quoteChar`-delimited token (string or quoted identifier)
 *  starting at `src[start] === quoteChar`. A doubled quote char (`''`,
 *  `""`, `` `` ``) is always treated as an escaped literal quote, per
 *  standard SQL. When `allowBackslashEscape` is true, a backslash also
 *  escapes the following character (tolerated for MySQL-style string
 *  literals). Returns the index just past the closing quote, and whether
 *  one was actually found — the raw slice is always copied verbatim by
 *  the caller regardless of how the escaping was interpreted. */
function scanQuoted(
  src: string,
  start: number,
  quoteChar: string,
  allowBackslashEscape: boolean
): ScanResult {
  const n = src.length;
  let j = start + 1;

  while (j < n) {
    const c = src[j];
    if (allowBackslashEscape && c === "\\") {
      j += 2;
      continue;
    }
    if (c === quoteChar) {
      if (src[j + 1] === quoteChar) {
        j += 2;
        continue;
      }
      return { end: j + 1, terminated: true };
    }
    j += 1;
  }

  return { end: n, terminated: false };
}

/** Scans a `[...]` SQL Server-style bracket-quoted identifier starting at
 *  `src[start] === "["`. A doubled `]]` is an escaped literal `]`. */
function scanBracketIdent(src: string, start: number): ScanResult {
  const n = src.length;
  let j = start + 1;

  while (j < n) {
    if (src[j] === "]") {
      if (src[j + 1] === "]") {
        j += 2;
        continue;
      }
      return { end: j + 1, terminated: true };
    }
    j += 1;
  }

  return { end: n, terminated: false };
}

/** Reads a numeric literal (decimal, optional exponent, or a `0x` hex
 *  literal) starting at a digit or a `.` followed by a digit. A practical
 *  approximation of the full numeric-literal grammar, not spec-exact —
 *  safe because any under-match is still copied through
 *  character-for-character, just possibly as more than one token. */
function readNumberEnd(src: string, start: number): number {
  const n = src.length;
  let j = start;

  const isHex = src[j] === "0" && (src[j + 1] === "x" || src[j + 1] === "X");
  if (isHex) {
    j += 2;
    while (j < n && /[0-9a-fA-F]/.test(src[j])) j += 1;
    return j;
  }

  while (j < n && /[0-9]/.test(src[j])) j += 1;

  if (src[j] === "." && /[0-9]/.test(src[j + 1] ?? "")) {
    j += 1;
    while (j < n && /[0-9]/.test(src[j])) j += 1;
  }

  if (src[j] === "e" || src[j] === "E") {
    let k = j + 1;
    if (src[k] === "+" || src[k] === "-") k += 1;
    if (/[0-9]/.test(src[k] ?? "")) {
      j = k;
      while (j < n && /[0-9]/.test(src[j])) j += 1;
    }
  }

  return j;
}

/** Reads exactly one token starting at `src[i]`. Always consumes at least
 *  one character. */
function readToken(src: string, i: number): { token: Token; end: number } {
  const n = src.length;
  const ch = src[i];

  if (WS_RE.test(ch)) {
    let j = i + 1;
    while (j < n && WS_RE.test(src[j])) j += 1;
    return { token: { type: "ws", raw: src.slice(i, j) }, end: j };
  }

  // Line comments: `-- ...` (standard) and `# ...` (MySQL), both to end of line.
  if (ch === "-" && src[i + 1] === "-") {
    let j = i + 2;
    while (j < n && src[j] !== "\n") j += 1;
    return { token: { type: "linecomment", raw: src.slice(i, j) }, end: j };
  }
  if (ch === "#") {
    let j = i + 1;
    while (j < n && src[j] !== "\n") j += 1;
    return { token: { type: "linecomment", raw: src.slice(i, j) }, end: j };
  }

  // Block comment.
  if (ch === "/" && src[i + 1] === "*") {
    const close = src.indexOf("*/", i + 2);
    const end = close === -1 ? n : close + 2;
    return { token: { type: "blockcomment", raw: src.slice(i, end), unterminated: close === -1 }, end };
  }

  // Single-quoted string literal: '' doubling + tolerated backslash escapes.
  if (ch === "'") {
    const { end, terminated } = scanQuoted(src, i, "'", true);
    return { token: { type: "string", raw: src.slice(i, end), unterminated: !terminated }, end };
  }

  // Double-quoted identifier (ANSI-style) — an identifier, never a string.
  if (ch === '"') {
    const { end, terminated } = scanQuoted(src, i, '"', false);
    return { token: { type: "quotedident", raw: src.slice(i, end), unterminated: !terminated }, end };
  }

  // Backtick-quoted identifier (MySQL-style).
  if (ch === "`") {
    const { end, terminated } = scanQuoted(src, i, "`", false);
    return { token: { type: "quotedident", raw: src.slice(i, end), unterminated: !terminated }, end };
  }

  // Bracket-quoted identifier (SQL Server-style).
  if (ch === "[") {
    const { end, terminated } = scanBracketIdent(src, i);
    return { token: { type: "quotedident", raw: src.slice(i, end), unterminated: !terminated }, end };
  }

  // Number.
  if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(src[i + 1] ?? ""))) {
    const end = readNumberEnd(src, i);
    return { token: { type: "number", raw: src.slice(i, end) }, end };
  }

  // Identifier/keyword-shaped word.
  if (IDENT_START_RE.test(ch)) {
    let j = i + 1;
    while (j < n && IDENT_PART_RE.test(src[j])) j += 1;
    return { token: { type: "word", raw: src.slice(i, j) }, end: j };
  }

  // Multi-character punctuation/operators, longest first.
  for (const op of OPERATORS) {
    if (src.startsWith(op, i)) {
      return { token: { type: "punct", raw: op }, end: i + op.length };
    }
  }

  // Single-character punctuation fallback (`(`, `)`, `,`, `;`, `.`, `=`, `*`, ...).
  return { token: { type: "punct", raw: ch }, end: i + 1 };
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const n = source.length;
  let i = 0;

  while (i < n) {
    const { token, end } = readToken(source, i);
    tokens.push(token);
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
  let unterminatedIdents = 0;
  let unterminatedComments = 0;
  let parenDepth = 0;
  let sawUnmatchedClose = false;

  for (const t of tokens) {
    if (t.type === "string" && t.unterminated) unterminatedStrings += 1;
    if (t.type === "quotedident" && t.unterminated) unterminatedIdents += 1;
    if (t.type === "blockcomment" && t.unterminated) unterminatedComments += 1;
    if (t.type === "punct" && t.raw === "(") parenDepth += 1;
    if (t.type === "punct" && t.raw === ")") {
      if (parenDepth === 0) sawUnmatchedClose = true;
      else parenDepth -= 1;
    }
  }

  if (unterminatedStrings > 0) {
    issues.push(
      `${unterminatedStrings} string literal${unterminatedStrings > 1 ? "s" : ""} ${unterminatedStrings > 1 ? "appear" : "appears"} unterminated.`
    );
  }
  if (unterminatedIdents > 0) {
    issues.push(
      `${unterminatedIdents} quoted identifier${unterminatedIdents > 1 ? "s" : ""} ${unterminatedIdents > 1 ? "appear" : "appears"} unterminated.`
    );
  }
  if (unterminatedComments > 0) {
    issues.push(
      `${unterminatedComments} block comment${unterminatedComments > 1 ? "s" : ""} ${unterminatedComments > 1 ? "appear" : "appears"} unterminated.`
    );
  }
  if (sawUnmatchedClose) {
    issues.push("Found a ')' with no matching '('.");
  }
  if (parenDepth > 0) {
    issues.push(`${parenDepth} unclosed '(' parenthes${parenDepth > 1 ? "es" : "is"}.`);
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Keyword recognition
// ---------------------------------------------------------------------------

interface KeywordPhrase {
  words: string[];
  /** Major clause-start keywords get a forced line break before them in
   *  Format mode; non-major keywords are only eligible for the uppercase
   *  toggle and don't force any layout change. */
  major: boolean;
}

/** Multi-word keyword phrases, longest first so matching is greedy. Only
 *  contiguous "word" tokens (no intervening punctuation/string/number,
 *  though comments in between silently break the match — a deliberately
 *  conservative fallback, see readme-style module doc above) count. */
const MULTI_WORD_PHRASES: KeywordPhrase[] = [
  // 3-word phrases
  { words: ["LEFT", "OUTER", "JOIN"], major: true },
  { words: ["RIGHT", "OUTER", "JOIN"], major: true },
  { words: ["FULL", "OUTER", "JOIN"], major: true },
  { words: ["IS", "NOT", "NULL"], major: false },
  // 2-word phrases
  { words: ["INNER", "JOIN"], major: true },
  { words: ["LEFT", "JOIN"], major: true },
  { words: ["RIGHT", "JOIN"], major: true },
  { words: ["FULL", "JOIN"], major: true },
  { words: ["CROSS", "JOIN"], major: true },
  { words: ["GROUP", "BY"], major: true },
  { words: ["ORDER", "BY"], major: true },
  { words: ["UNION", "ALL"], major: true },
  { words: ["INSERT", "INTO"], major: true },
  { words: ["DELETE", "FROM"], major: true },
  { words: ["CREATE", "TABLE"], major: false },
  { words: ["ALTER", "TABLE"], major: false },
  { words: ["DROP", "TABLE"], major: false },
  { words: ["IS", "NULL"], major: false },
  { words: ["NOT", "NULL"], major: false },
  { words: ["PRIMARY", "KEY"], major: false },
  { words: ["FOREIGN", "KEY"], major: false },
];

/** Single-word keywords/clause-starters across mainstream dialects. */
const SINGLE_KEYWORDS: Record<string, { major: boolean }> = {
  SELECT: { major: true },
  FROM: { major: true },
  WHERE: { major: true },
  JOIN: { major: true },
  ON: { major: false },
  HAVING: { major: true },
  LIMIT: { major: true },
  OFFSET: { major: false },
  UNION: { major: true },
  INSERT: { major: true },
  INTO: { major: false },
  VALUES: { major: true },
  UPDATE: { major: true },
  SET: { major: true },
  DELETE: { major: true },
  CREATE: { major: false },
  ALTER: { major: false },
  DROP: { major: false },
  TABLE: { major: false },
  AND: { major: false },
  OR: { major: false },
  NOT: { major: false },
  IN: { major: false },
  EXISTS: { major: false },
  BETWEEN: { major: false },
  LIKE: { major: false },
  IS: { major: false },
  NULL: { major: false },
  AS: { major: false },
  DISTINCT: { major: false },
  CASE: { major: false },
  WHEN: { major: false },
  THEN: { major: false },
  ELSE: { major: false },
  END: { major: false },
  WITH: { major: false },
  ALL: { major: false },
  BY: { major: false },
  INNER: { major: false },
  OUTER: { major: false },
  LEFT: { major: false },
  RIGHT: { major: false },
  FULL: { major: false },
  CROSS: { major: false },
  ASC: { major: false },
  DESC: { major: false },
  PRIMARY: { major: false },
  KEY: { major: false },
  FOREIGN: { major: false },
  REFERENCES: { major: false },
  DEFAULT: { major: false },
  UNIQUE: { major: false },
  INDEX: { major: false },
  VIEW: { major: false },
};

/** Attempts to match a keyword phrase starting at significant-token index
 *  `i`. Tries multi-word phrases first (already longest-first by list
 *  order), then falls back to a single-word match. Returns null if
 *  `tokens[i]` isn't a recognized keyword — e.g. an ordinary column/table
 *  identifier that happens to share no keyword's spelling. */
function matchKeywordAt(tokens: Token[], i: number): { words: string[]; major: boolean } | null {
  for (const phrase of MULTI_WORD_PHRASES) {
    const len = phrase.words.length;
    if (i + len > tokens.length) continue;

    let ok = true;
    for (let k = 0; k < len; k += 1) {
      const tok = tokens[i + k];
      if (tok.type !== "word" || tok.raw.toUpperCase() !== phrase.words[k]) {
        ok = false;
        break;
      }
    }
    if (ok) return { words: phrase.words, major: phrase.major };
  }

  const upper = tokens[i].raw.toUpperCase();
  const single = SINGLE_KEYWORDS[upper];
  if (single) return { words: [upper], major: single.major };

  return null;
}

interface UnitInfo {
  canonical: string;
  major: boolean;
  len: number;
}

/** Scans a token stream (works for either the full significant-token list
 *  used by Format, or the comment-stripped content list used by Minify)
 *  and returns, for every index: whether it's part of some recognized
 *  keyword unit (`recognized`, used for the uppercase toggle), and, keyed
 *  by the index a unit *starts* at, its canonical uppercase text and
 *  whether it's a major clause-start keyword (`unitStart`). */
function computeKeywordAnnotations(tokens: Token[]): {
  recognized: boolean[];
  unitStart: Map<number, UnitInfo>;
} {
  const recognized = new Array<boolean>(tokens.length).fill(false);
  const unitStart = new Map<number, UnitInfo>();
  let i = 0;

  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok.type !== "word") {
      i += 1;
      continue;
    }

    const match = matchKeywordAt(tokens, i);
    if (match) {
      const canonical = match.words.join(" ");
      unitStart.set(i, { canonical, major: match.major, len: match.words.length });
      for (let k = 0; k < match.words.length; k += 1) recognized[i + k] = true;
      i += match.words.length;
    } else {
      i += 1;
    }
  }

  return { recognized, unitStart };
}

// ---------------------------------------------------------------------------
// Pretty-printer (Format)
// ---------------------------------------------------------------------------

/** Splits the full token stream into significant (non-whitespace) tokens
 *  plus, for each one, the raw whitespace token (if any) that immediately
 *  preceded it in the source. Comments are kept in `sig` — they're
 *  content, not whitespace. */
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

interface ClauseInstance {
  commaIndices: number[];
  startIdx: number;
  endIdx: number;
}

/**
 * Walks the significant-token stream tracking `(`/`)` depth and a stack of
 * open SELECT/VALUES "list contexts" (a SELECT column list, or a
 * multi-row VALUES list), keyed by the paren depth they opened at so
 * nested subqueries and function-call argument lists never get confused
 * with the list they're nested inside. A list context closes when: another
 * major keyword appears at its own depth (e.g. FROM after a SELECT list),
 * a `)` drops the depth below where it opened, or the token stream ends.
 *
 * For each closed context with 2+ top-level commas (i.e. 3+ items — "more
 * than a couple", per the brief), every one of those commas is marked as
 * a safe line-break point, and every token strictly inside that context
 * gets one extra indent level. Contexts with fewer items are left exactly
 * as the input had them — the safer fallback when there's nothing
 * confidently worth reformatting.
 */
function computeBreakableCommasAndExtraDepth(
  sig: Token[],
  unitStart: Map<number, UnitInfo>
): { breakableCommas: Set<number>; extraDepth: number[] } {
  const extraDepth = new Array<number>(sig.length).fill(0);
  const breakableCommas = new Set<number>();
  const finished: ClauseInstance[] = [];
  const stack: Array<{ canonical: string; clauseParenDepth: number; startIdx: number; commaIndices: number[] }> = [];
  let parenDepth = 0;

  const closeAtDepth = (depth: number, endIdx: number) => {
    while (stack.length > 0 && stack[stack.length - 1].clauseParenDepth === depth) {
      const entry = stack.pop()!;
      finished.push({ commaIndices: entry.commaIndices, startIdx: entry.startIdx, endIdx });
    }
  };

  const closeDeeperThan = (depth: number, endIdx: number) => {
    while (stack.length > 0 && stack[stack.length - 1].clauseParenDepth > depth) {
      const entry = stack.pop()!;
      finished.push({ commaIndices: entry.commaIndices, startIdx: entry.startIdx, endIdx });
    }
  };

  for (let i = 0; i < sig.length; i += 1) {
    const tok = sig[i];
    const unit = unitStart.get(i);

    if (unit && unit.major) {
      closeAtDepth(parenDepth, i);
      if (unit.canonical === "SELECT" || unit.canonical === "VALUES") {
        stack.push({ canonical: unit.canonical, clauseParenDepth: parenDepth, startIdx: i, commaIndices: [] });
      }
    }

    if (tok.type === "punct" && tok.raw === "(") {
      parenDepth += 1;
    } else if (tok.type === "punct" && tok.raw === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      closeDeeperThan(parenDepth, i);
    } else if (tok.type === "punct" && tok.raw === ",") {
      if (stack.length > 0 && stack[stack.length - 1].clauseParenDepth === parenDepth) {
        stack[stack.length - 1].commaIndices.push(i);
      }
    }
  }

  while (stack.length > 0) {
    const entry = stack.pop()!;
    finished.push({ commaIndices: entry.commaIndices, startIdx: entry.startIdx, endIdx: sig.length });
  }

  for (const inst of finished) {
    if (inst.commaIndices.length >= 2) {
      for (const c of inst.commaIndices) breakableCommas.add(c);
      for (let j = inst.startIdx + 1; j < inst.endIdx; j += 1) extraDepth[j] += 1;
    }
  }

  return { breakableCommas, extraDepth };
}

/**
 * Reindents the token stream by `(`/`)` nesting depth (plus one extra
 * level inside a SELECT/VALUES list broken across lines, see above) and
 * inserts a line break before every major clause keyword (SELECT, FROM,
 * WHERE, the JOIN variants, GROUP BY, ORDER BY, HAVING, LIMIT, UNION,
 * INSERT INTO, VALUES, UPDATE, SET, DELETE FROM) and after a breakable
 * top-level comma — without inventing any other new line breaks. Existing
 * line breaks in the input are preserved (reindented, not removed); a run
 * of blank lines collapses to at most one. `uppercaseKeywords` only ever
 * changes a recognized keyword token's case — it never affects which
 * characters are copied through, only whitespace and (opt-in) case.
 */
function prettyPrint(tokens: Token[], indentSize: number, uppercaseKeywords: boolean): string {
  const { sig, gaps } = buildSignificantWithGaps(tokens);
  if (sig.length === 0) return "";

  const { recognized, unitStart } = computeKeywordAnnotations(sig);
  const { breakableCommas, extraDepth } = computeBreakableCommasAndExtraDepth(sig, unitStart);

  const render = (i: number): string => {
    const tok = sig[i];
    if (uppercaseKeywords && tok.type === "word" && recognized[i]) return tok.raw.toUpperCase();
    return tok.raw;
  };

  const pad = (depth: number) => " ".repeat(Math.max(0, depth) * indentSize);
  const outLines: string[] = [];

  let parenDepth = 0;
  let lineDepth = 0;
  let curLine = render(0);

  if (isPunct(sig[0], "(")) parenDepth += 1;
  if (isPunct(sig[0], ")")) parenDepth = Math.max(0, parenDepth - 1);

  for (let k = 1; k < sig.length; k += 1) {
    const cur = sig[k];
    const gap = gaps[k];

    if (isPunct(cur, ")")) parenDepth = Math.max(0, parenDepth - 1);

    const unit = unitStart.get(k);
    const isMajorStart = !!unit && unit.major;
    const afterBreakableComma = breakableCommas.has(k - 1);
    const mustBreak = isMajorStart || afterBreakableComma;

    const hasNewlineGap = !!gap && gap.raw.includes("\n");
    const newlineCount = hasNewlineGap ? (gap!.raw.match(/\n/g)?.length ?? 0) : 0;
    const blankLine = newlineCount >= 2;

    if (hasNewlineGap || mustBreak) {
      outLines.push(pad(lineDepth) + curLine);
      if (blankLine) outLines.push("");
      lineDepth = parenDepth + extraDepth[k];
      curLine = render(k);
    } else {
      const sep = gap && gap.raw.length > 0 ? " " : "";
      curLine += sep + render(k);
    }

    if (isPunct(cur, "(")) parenDepth += 1;
  }

  outLines.push(pad(lineDepth) + curLine);
  return outLines.join("\n");
}

// ---------------------------------------------------------------------------
// Minifier
// ---------------------------------------------------------------------------

/** Multi-character operators plus the two comment-openers — token
 *  sequences that, if two adjacent output tokens were concatenated with
 *  no separating whitespace, would form a *different* token than either
 *  side alone intended (a longer operator, or a comment silently starting
 *  where none existed, e.g. two adjacent `-` tokens minifying into `--`
 *  and eating the rest of the line). Used to decide when minify must keep
 *  a single safety space. */
const RISKY_BOUNDARY_TOKENS = new Set<string>([...OPERATORS, "--", "/*"]);
const MAX_RISKY_LEN = 3;

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

/**
 * Strips whitespace and comments and collapses everything else to a
 * minimum, while still only ever choosing none or one space between
 * tokens — never rewriting a token's own characters. Comments are elided
 * entirely in Minify mode (standard, expected minifier behavior — like
 * the JS Formatter's minifier, and unlike Format mode, which preserves
 * them) since they never affect query semantics.
 *
 * A single space is kept wherever removing it would merge two tokens into
 * a different one: an identifier/keyword/number run-together
 * (`isWordChar` on both sides), a longer operator or a comment opener
 * accidentally forming at the boundary (`isBoundaryRisky`), or a number
 * directly followed by a `.` that would look like it extends the literal.
 */
function minifyTokens(tokens: Token[], uppercaseKeywords: boolean): string {
  const content = tokens.filter((t) => t.type !== "ws" && t.type !== "linecomment" && t.type !== "blockcomment");
  if (content.length === 0) return "";

  const { recognized } = computeKeywordAnnotations(content);

  const render = (i: number): string => {
    const tok = content[i];
    if (uppercaseKeywords && tok.type === "word" && recognized[i]) return tok.raw.toUpperCase();
    return tok.raw;
  };

  let out = render(0);

  for (let k = 1; k < content.length; k += 1) {
    const prev = content[k - 1];
    const cur = content[k];

    const lastChar = prev.raw.slice(-1);
    const firstChar = cur.raw.slice(0, 1);
    const bothWordLike = isWordChar(lastChar) && isWordChar(firstChar);
    const numberDotHazard = prev.type === "number" && firstChar === ".";

    if (bothWordLike || numberDotHazard || isBoundaryRisky(prev.raw, cur.raw)) {
      out += " " + render(k);
    } else {
      out += render(k);
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function formatSql(input: string, indentSize: 2 | 4, uppercaseKeywords: boolean): SqlProcessResult {
  const tokens = tokenize(input);
  return {
    output: prettyPrint(tokens, indentSize, uppercaseKeywords),
    issues: collectIssues(tokens),
  };
}

export function minifySql(input: string, uppercaseKeywords: boolean): SqlProcessResult {
  const tokens = tokenize(input);
  return {
    output: minifyTokens(tokens, uppercaseKeywords),
    issues: collectIssues(tokens),
  };
}
