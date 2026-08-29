/**
 * HTML entity encode/decode — pure functions, no React, no DOM APIs.
 *
 * Decoding is done entirely via string parsing (regex + a hand-rolled
 * named-entity lookup table + `String.fromCodePoint`). This file must
 * NEVER assign untrusted input to `innerHTML`/`outerHTML` and must
 * NEVER use `DOMParser` on it — the "hidden element + innerHTML" trick
 * some entity-decoding snippets use can execute handlers embedded in
 * attacker-shaped markup even when the element is never attached to
 * the document, which defeats the entire point of this tool.
 */

/**
 * Named entity -> Unicode code point.
 *
 * Covers the commonly used HTML4/HTML5 named character references
 * (control/markup entities, punctuation, currency, math/arrows, Greek
 * letters, card suits) plus the full Latin-1 Supplement named-entity
 * block (`nbsp` through `yuml`, code points U+00A0-U+00FF) — the
 * accented Latin letters and Latin-1 symbols every HTML4 reference
 * table lists.
 */
export const NAMED_ENTITIES: Record<string, number> = {
  // Markup-significant
  amp: 0x26,
  lt: 0x3c,
  gt: 0x3e,
  quot: 0x22,
  apos: 0x27,

  // General punctuation / typography
  hellip: 0x2026,
  mdash: 0x2014,
  ndash: 0x2013,
  lsquo: 0x2018,
  rsquo: 0x2019,
  ldquo: 0x201c,
  rdquo: 0x201d,
  bull: 0x2022,
  dagger: 0x2020,
  Dagger: 0x2021,
  permil: 0x2030,
  trade: 0x2122,

  // Card suits
  spades: 0x2660,
  clubs: 0x2663,
  hearts: 0x2665,
  diams: 0x2666,

  // Currency
  euro: 0x20ac,

  // Greek letters (lowercase, common subset)
  alpha: 0x3b1,
  beta: 0x3b2,
  gamma: 0x3b3,
  delta: 0x3b4,
  pi: 0x3c0,
  sigma: 0x3c3,
  omega: 0x3c9,

  // Math / arrows
  infin: 0x221e,
  ne: 0x2260,
  le: 0x2264,
  ge: 0x2265,
  larr: 0x2190,
  uarr: 0x2191,
  rarr: 0x2192,
  darr: 0x2193,
  harr: 0x2194,

  // Latin-1 Supplement named entities, U+00A0-U+00FF (96 entries).
  nbsp: 0xa0,
  iexcl: 0xa1,
  cent: 0xa2,
  pound: 0xa3,
  curren: 0xa4,
  yen: 0xa5,
  brvbar: 0xa6,
  sect: 0xa7,
  uml: 0xa8,
  copy: 0xa9,
  ordf: 0xaa,
  laquo: 0xab,
  not: 0xac,
  shy: 0xad,
  reg: 0xae,
  macr: 0xaf,
  deg: 0xb0,
  plusmn: 0xb1,
  sup2: 0xb2,
  sup3: 0xb3,
  acute: 0xb4,
  micro: 0xb5,
  para: 0xb6,
  middot: 0xb7,
  cedil: 0xb8,
  sup1: 0xb9,
  ordm: 0xba,
  raquo: 0xbb,
  frac14: 0xbc,
  frac12: 0xbd,
  frac34: 0xbe,
  iquest: 0xbf,
  Agrave: 0xc0,
  Aacute: 0xc1,
  Acirc: 0xc2,
  Atilde: 0xc3,
  Auml: 0xc4,
  Aring: 0xc5,
  AElig: 0xc6,
  Ccedil: 0xc7,
  Egrave: 0xc8,
  Eacute: 0xc9,
  Ecirc: 0xca,
  Euml: 0xcb,
  Igrave: 0xcc,
  Iacute: 0xcd,
  Icirc: 0xce,
  Iuml: 0xcf,
  ETH: 0xd0,
  Ntilde: 0xd1,
  Ograve: 0xd2,
  Oacute: 0xd3,
  Ocirc: 0xd4,
  Otilde: 0xd5,
  Ouml: 0xd6,
  times: 0xd7,
  Oslash: 0xd8,
  Ugrave: 0xd9,
  Uacute: 0xda,
  Ucirc: 0xdb,
  Uuml: 0xdc,
  Yacute: 0xdd,
  THORN: 0xde,
  szlig: 0xdf,
  agrave: 0xe0,
  aacute: 0xe1,
  acirc: 0xe2,
  atilde: 0xe3,
  auml: 0xe4,
  aring: 0xe5,
  aelig: 0xe6,
  ccedil: 0xe7,
  egrave: 0xe8,
  eacute: 0xe9,
  ecirc: 0xea,
  euml: 0xeb,
  igrave: 0xec,
  iacute: 0xed,
  icirc: 0xee,
  iuml: 0xef,
  eth: 0xf0,
  ntilde: 0xf1,
  ograve: 0xf2,
  oacute: 0xf3,
  ocirc: 0xf4,
  otilde: 0xf5,
  ouml: 0xf6,
  divide: 0xf7,
  oslash: 0xf8,
  ugrave: 0xf9,
  uacute: 0xfa,
  ucirc: 0xfb,
  uuml: 0xfc,
  yacute: 0xfd,
  thorn: 0xfe,
  yuml: 0xff,
};

export interface EncodeOptions {
  /**
   * When true, every character outside the printable ASCII range
   * (U+0020-U+007E, plus tab/newline/carriage-return) is additionally
   * converted to a decimal numeric character reference (`&#NNN;`),
   * producing output that is safe to store/transmit as pure ASCII.
   * Default: false.
   */
  escapeNonAscii?: boolean;
}

/**
 * Encode plain text into HTML-safe entities. Always escapes the five
 * XML/HTML-unsafe characters. `'` is encoded as the numeric `&#39;`
 * rather than the named `&apos;` for maximum legacy-browser/HTML4
 * compatibility.
 */
export function encodeHtmlEntities(
  input: string,
  options: EncodeOptions = {}
): string {
  const { escapeNonAscii = false } = options;
  let result = "";

  for (const char of input) {
    switch (char) {
      case "&":
        result += "&amp;";
        continue;
      case "<":
        result += "&lt;";
        continue;
      case ">":
        result += "&gt;";
        continue;
      case '"':
        result += "&quot;";
        continue;
      case "'":
        result += "&#39;";
        continue;
      default:
        break;
    }

    const codePoint = char.codePointAt(0) ?? 0;
    const isPrintableAscii = codePoint >= 0x20 && codePoint <= 0x7e;
    const isPreservedWhitespace =
      char === "\n" || char === "\r" || char === "\t";

    if (escapeNonAscii && !isPrintableAscii && !isPreservedWhitespace) {
      result += `&#${codePoint};`;
      continue;
    }

    result += char;
  }

  return result;
}

/** Matches `&name;`, `&#123;`, or `&#x1F600;` — a trailing `;` is required. */
const ENTITY_PATTERN = /&(#[xX][0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g;

/**
 * Decode HTML entities back into plain text/characters. Lenient by
 * design: any sequence that isn't a recognized named entity, or that
 * isn't a well-formed numeric reference, is left in the output exactly
 * as written rather than throwing — matching how browsers themselves
 * handle unknown/malformed entities. Never touches the DOM.
 */
export function decodeHtmlEntities(input: string): string {
  return input.replace(ENTITY_PATTERN, (match, body: string) => {
    if (body.charCodeAt(0) === 0x23 /* '#' */) {
      const isHex = body[1] === "x" || body[1] === "X";
      const digits = isHex ? body.slice(2) : body.slice(1);
      const codePoint = parseInt(digits, isHex ? 16 : 10);

      if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
        return match;
      }

      // Lone surrogate halves aren't valid standalone code points.
      if (codePoint >= 0xd800 && codePoint <= 0xdfff) {
        return match;
      }

      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return match;
      }
    }

    const codePoint = NAMED_ENTITIES[body];

    if (codePoint === undefined) {
      return match;
    }

    return String.fromCodePoint(codePoint);
  });
}
