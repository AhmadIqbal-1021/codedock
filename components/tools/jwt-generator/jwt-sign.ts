/**
 * Pure JWT signing logic (HMAC only) — no React, no DOM assumptions beyond
 * the standard `atob`/`btoa`/`TextEncoder` globals that are available in
 * every browser this app targets.
 *
 * Builds a compact JWT (`header.payload.signature`) from raw header/payload
 * JSON text and signs it with `crypto.subtle` using HMAC-SHA256/384/512 —
 * the native Web Crypto API, per this project's hard rule against external
 * crypto libraries.
 */

export const JWT_ALGORITHMS = ["HS256", "HS384", "HS512"] as const;

export type JwtAlgorithm = (typeof JWT_ALGORITHMS)[number];

/** Maps a JWT `alg` name to the Web Crypto hash algorithm it signs with. */
const HASH_BY_ALGORITHM: Record<JwtAlgorithm, string> = {
  HS256: "SHA-256",
  HS384: "SHA-384",
  HS512: "SHA-512",
};

/** Raised for any expected failure — invalid JSON, a missing secret, or a
 *  `crypto.subtle` failure — so the UI can show a clear, specific message. */
export class JwtSignError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JwtSignError";
  }
}

/** Converts a standard Base64 string into Base64URL: `+`/`/` swapped for
 *  `-`/`_`, and padding `=` stripped, per the JWT spec (RFC 7515 §2). */
function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Base64URL-encodes a UTF-8 string. Uses the same `unescape(encodeURIComponent())`
 *  trick as this project's Base64 Encoder/Decoder tool so multi-byte
 *  characters in the header/payload JSON survive `btoa`, which only
 *  accepts single-byte (Latin1) input. */
export function base64UrlEncodeText(text: string): string {
  const base64 = btoa(unescape(encodeURIComponent(text)));
  return toBase64Url(base64);
}

/** Base64URL-encodes raw bytes, e.g. an HMAC signature from `crypto.subtle.sign`. */
export function base64UrlEncodeBytes(bytes: ArrayBuffer): string {
  const binary = Array.from(new Uint8Array(bytes), (byte) =>
    String.fromCharCode(byte)
  ).join("");

  return toBase64Url(btoa(binary));
}

/** Parses `text` as JSON, throwing a `JwtSignError` that names `label`
 *  (e.g. "header" or "payload") when it isn't valid. */
export function parseJsonPart(text: string, label: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new JwtSignError(`The ${label} is not valid JSON.`);
  }
}

export interface SignJwtOptions {
  algorithm: JwtAlgorithm;
  headerJson: string;
  payloadJson: string;
  secret: string;
}

/**
 * Builds and signs a compact JWT using HMAC via the native Web Crypto API.
 *
 * Throws `JwtSignError` for invalid header/payload JSON, a missing secret,
 * or a `crypto.subtle` failure — every other error path is normalized into
 * one of those so the caller only ever has to handle `JwtSignError`.
 */
export async function signJwt({
  algorithm,
  headerJson,
  payloadJson,
  secret,
}: SignJwtOptions): Promise<string> {
  // Validate both parts up front so the error names whichever one is
  // actually broken, rather than failing generically later.
  parseJsonPart(headerJson, "header");
  parseJsonPart(payloadJson, "payload");

  if (!secret) {
    throw new JwtSignError("Enter a secret to sign the token with.");
  }

  const encoder = new TextEncoder();
  const signingInput = `${base64UrlEncodeText(headerJson)}.${base64UrlEncodeText(
    payloadJson
  )}`;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: HASH_BY_ALGORITHM[algorithm] },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signingInput)
    );

    return `${signingInput}.${base64UrlEncodeBytes(signature)}`;
  } catch (err) {
    if (err instanceof JwtSignError) throw err;

    throw new JwtSignError(
      "Failed to sign the token. Please check your inputs and try again."
    );
  }
}
