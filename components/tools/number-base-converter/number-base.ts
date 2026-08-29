// Pure number-base conversion helpers — no external big-number library.
//
// Everything here uses native BigInt for the actual arithmetic so that
// integers beyond Number.MAX_SAFE_INTEGER (2^53 - 1) convert correctly.
// Number()/parseInt() are intentionally never used for the conversion
// itself, since both silently lose precision above 2^53.

export type Base = 2 | 8 | 10 | 16;

export const BASES: readonly Base[] = [2, 8, 10, 16];

export interface BaseConfig {
  base: Base;
  label: string;
  placeholder: string;
  /** Matches a full, valid value for this base: optional leading "-", one or more valid digits. */
  pattern: RegExp;
  invalidMessage: string;
}

export const BASE_CONFIG: Record<Base, BaseConfig> = {
  2: {
    base: 2,
    label: "Binary",
    placeholder: "e.g. 11111111",
    pattern: /^-?[01]+$/,
    invalidMessage: "Binary only allows the digits 0 and 1 (with an optional leading -).",
  },
  8: {
    base: 8,
    label: "Octal",
    placeholder: "e.g. 377",
    pattern: /^-?[0-7]+$/,
    invalidMessage: "Octal only allows digits 0-7 (with an optional leading -).",
  },
  10: {
    base: 10,
    label: "Decimal",
    placeholder: "e.g. 255",
    pattern: /^-?[0-9]+$/,
    invalidMessage: "Decimal only allows digits 0-9 (with an optional leading -).",
  },
  16: {
    base: 16,
    label: "Hexadecimal",
    placeholder: "e.g. FF",
    pattern: /^-?[0-9a-fA-F]+$/,
    invalidMessage: "Hexadecimal only allows digits 0-9 and letters A-F (with an optional leading -).",
  },
};

/** Numeric value (0-15) of a single base-36-ish digit character, or -1 if not a digit character at all. */
function digitValueForChar(char: string): number {
  const code = char.toLowerCase().charCodeAt(0);
  if (code >= 48 && code <= 57) return code - 48; // '0'-'9'
  if (code >= 97 && code <= 102) return code - 97 + 10; // 'a'-'f'
  return -1;
}

/**
 * Parses a raw string (optional leading "-", then digits valid for `base`)
 * into a BigInt, digit-by-digit — never via Number()/parseInt(), so
 * arbitrarily large integers keep full precision.
 *
 * Throws if `raw` contains no digits or a digit outside the given base.
 * Callers should validate against `BASE_CONFIG[base].pattern` first;
 * this re-checks as a safety net.
 */
export function parseBigIntForBase(raw: string, base: Base): bigint {
  let text = raw.trim();
  let negative = false;

  if (text.startsWith("-")) {
    negative = true;
    text = text.slice(1);
  }

  if (text.length === 0) {
    throw new Error("No digits to parse.");
  }

  const baseBig = BigInt(base);
  let result = BigInt(0);

  for (const char of text) {
    const digit = digitValueForChar(char);
    if (digit === -1 || digit >= base) {
      throw new Error(`Invalid digit "${char}" for base ${base}.`);
    }
    result = result * baseBig + BigInt(digit);
  }

  return negative ? -result : result;
}

/** Formats a BigInt in the given base. Hex output is uppercased; sign is preserved natively by BigInt#toString. */
export function formatBigIntForBase(value: bigint, base: Base): string {
  const text = value.toString(base);
  return base === 16 ? text.toUpperCase() : text;
}
