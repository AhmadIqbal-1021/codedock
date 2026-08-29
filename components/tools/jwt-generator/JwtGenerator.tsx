"use client";

import { useCallback, useState } from "react";
import { Check, Clock, Copy, KeyRound, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolToolbar, type ToolAction } from "@/components/shared/ToolToolbar";
import ToolError from "@/components/shared/ToolError";
import {
  JWT_ALGORITHMS,
  JwtSignError,
  signJwt,
  type JwtAlgorithm,
} from "./jwt-sign";

const DEFAULT_ALGORITHM: JwtAlgorithm = "HS256";

const DEFAULT_PAYLOAD_JSON = JSON.stringify(
  { sub: "1234567890", name: "Test User" },
  null,
  2
);

const EXPIRY_PRESETS = [
  { value: "none", label: "No expiration", seconds: 0 },
  { value: "15m", label: "Expires in 15 minutes", seconds: 15 * 60 },
  { value: "1h", label: "Expires in 1 hour", seconds: 60 * 60 },
  { value: "1d", label: "Expires in 1 day", seconds: 24 * 60 * 60 },
  { value: "7d", label: "Expires in 7 days", seconds: 7 * 24 * 60 * 60 },
  { value: "30d", label: "Expires in 30 days", seconds: 30 * 24 * 60 * 60 },
] as const;

type ExpiryPresetValue = (typeof EXPIRY_PRESETS)[number]["value"];

type ErrorSource = "header" | "payload" | "secret" | "general";

interface SignFormError {
  source: ErrorSource;
  message: string;
}

/** Builds the default header for a given algorithm. */
function buildDefaultHeader(algorithm: JwtAlgorithm): string {
  return JSON.stringify({ alg: algorithm, typ: "JWT" }, null, 2);
}

/** Rewrites the `alg` field of an existing header to match the newly
 *  selected algorithm, preserving any other fields the user added (e.g.
 *  `kid`). Leaves the text untouched if it isn't a JSON object right now —
 *  signing will surface a clear "not valid JSON" error for that case. */
function syncHeaderAlgorithm(headerJson: string, algorithm: JwtAlgorithm): string {
  try {
    const parsed = JSON.parse(headerJson);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return JSON.stringify({ ...parsed, alg: algorithm }, null, 2);
    }
  } catch {
    // Leave invalid JSON as-is.
  }

  return headerJson;
}

export function JwtGenerator() {
  const [algorithm, setAlgorithm] = useState<JwtAlgorithm>(DEFAULT_ALGORITHM);
  const [headerJson, setHeaderJson] = useState(() => buildDefaultHeader(DEFAULT_ALGORITHM));
  const [payloadJson, setPayloadJson] = useState(DEFAULT_PAYLOAD_JSON);
  const [secret, setSecret] = useState("");
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPresetValue>("1h");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<SignFormError | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSign = useCallback(async () => {
    // Guard against overlapping requests (e.g. rapid double-clicks).
    if (isSigning) return;

    setCopied(false);
    setToken(null);

    try {
      JSON.parse(headerJson);
    } catch {
      setError({ source: "header", message: "The header is not valid JSON." });
      return;
    }

    try {
      JSON.parse(payloadJson);
    } catch {
      setError({ source: "payload", message: "The payload is not valid JSON." });
      return;
    }

    if (!secret) {
      setError({
        source: "secret",
        message: "Enter a secret to sign the token with.",
      });
      return;
    }

    setError(null);
    setIsSigning(true);

    try {
      const signed = await signJwt({ algorithm, headerJson, payloadJson, secret });
      setToken(signed);
    } catch (err) {
      setError({
        source: "general",
        message:
          err instanceof JwtSignError
            ? err.message
            : "Failed to sign the token. Please check your inputs and try again.",
      });
    } finally {
      setIsSigning(false);
    }
  }, [algorithm, headerJson, payloadJson, secret, isSigning]);

  const handleClear = () => {
    setAlgorithm(DEFAULT_ALGORITHM);
    setHeaderJson(buildDefaultHeader(DEFAULT_ALGORITHM));
    setPayloadJson(DEFAULT_PAYLOAD_JSON);
    setSecret("");
    setToken(null);
    setError(null);
    setCopied(false);
  };

  const handleAlgorithmChange = (next: JwtAlgorithm) => {
    if (next === algorithm) return;

    setAlgorithm(next);
    setHeaderJson((current) => syncHeaderAlgorithm(current, next));
    // The previous token was signed for a different algorithm, so clear it
    // rather than show a stale result under the new label.
    setToken(null);
    setError(null);
    setCopied(false);
  };

  const handleInsertTime = () => {
    let parsed: unknown;

    try {
      parsed = JSON.parse(payloadJson || "{}");
    } catch {
      setError({
        source: "payload",
        message: "The payload is not valid JSON. Fix it before inserting a timestamp.",
      });
      return;
    }

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      setError({
        source: "payload",
        message: "The payload must be a JSON object to insert claims into.",
      });
      return;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const preset = EXPIRY_PRESETS.find((option) => option.value === expiryPreset);

    const next: Record<string, unknown> = {
      ...(parsed as Record<string, unknown>),
      iat: nowSeconds,
    };

    if (preset && preset.seconds > 0) {
      next.exp = nowSeconds + preset.seconds;
    }

    setPayloadJson(JSON.stringify(next, null, 2));
    setError(null);
    setToken(null);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!token) return;

    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable.
    }
  };

  const actions: ToolAction[] = [
    {
      label: isSigning ? "Signing..." : "Sign JWT",
      icon: isSigning ? Loader2 : KeyRound,
      onClick: handleSign,
      disabled: isSigning,
    },
    {
      label: "Copy",
      icon: Copy,
      onClick: handleCopy,
      disabled: !token,
      variant: "outline",
    },
    {
      label: "Clear",
      icon: Trash2,
      onClick: handleClear,
      variant: "outline",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <ToolToolbar actions={actions}>
        <div
          role="group"
          aria-label="Signing algorithm"
          className="flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-foreground/[0.03] p-1"
        >
          {JWT_ALGORITHMS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleAlgorithmChange(option)}
              aria-pressed={algorithm === option}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                algorithm === option
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </ToolToolbar>

      {/* Header + Payload */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex h-8 items-center">
            <label htmlFor="jwtgen-header" className="text-sm font-medium">
              Header (JSON)
            </label>
          </div>

          <textarea
            id="jwtgen-header"
            value={headerJson}
            onChange={(event) => {
              setHeaderJson(event.target.value);
              setError(null);
            }}
            spellCheck={false}
            aria-invalid={error?.source === "header"}
            className={`min-h-32 w-full resize-y rounded-xl border bg-background p-4 font-mono text-sm outline-none transition focus:ring-2 ${
              error?.source === "header"
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "focus:ring-ring"
            }`}
          />

          {error?.source === "header" && (
            <ToolError title="Invalid header" message={error.message} />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex h-8 items-center">
            <label htmlFor="jwtgen-payload" className="text-sm font-medium">
              Payload (JSON)
            </label>
          </div>

          <textarea
            id="jwtgen-payload"
            value={payloadJson}
            onChange={(event) => {
              setPayloadJson(event.target.value);
              setError(null);
            }}
            spellCheck={false}
            aria-invalid={error?.source === "payload"}
            className={`min-h-32 w-full resize-y rounded-xl border bg-background p-4 font-mono text-sm outline-none transition focus:ring-2 ${
              error?.source === "payload"
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "focus:ring-ring"
            }`}
          />

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={expiryPreset}
              onChange={(event) =>
                setExpiryPreset(event.target.value as ExpiryPresetValue)
              }
              aria-label="Expiration preset for the exp claim"
              className="h-8 rounded-lg border bg-background px-2 text-xs text-muted-foreground outline-none transition focus:ring-2 focus:ring-ring"
            >
              {EXPIRY_PRESETS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleInsertTime}
              className="h-8 gap-1.5 rounded-full px-3 text-xs"
            >
              <Clock className="h-3.5 w-3.5" />
              Use current time
            </Button>
          </div>

          {error?.source === "payload" && (
            <ToolError title="Invalid payload" message={error.message} />
          )}
        </div>
      </div>

      {/* Secret */}
      <div className="space-y-2">
        <label htmlFor="jwtgen-secret" className="text-sm font-medium">
          Secret
        </label>

        <div
          className={`flex items-center rounded-xl border bg-background px-4 transition focus-within:ring-2 ${
            error?.source === "secret"
              ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20"
              : "focus-within:ring-ring"
          }`}
        >
          <input
            id="jwtgen-secret"
            type="text"
            value={secret}
            onChange={(event) => {
              setSecret(event.target.value);
              setError(null);
            }}
            placeholder="A secret for testing/dev — never a real production secret"
            spellCheck={false}
            autoComplete="off"
            aria-invalid={error?.source === "secret"}
            className="min-w-0 flex-1 bg-transparent py-2.5 font-mono text-sm outline-none"
          />
        </div>

        {error?.source === "secret" && (
          <ToolError title="Missing secret" message={error.message} />
        )}
      </div>

      {/* Output */}
      <div className="space-y-2">
        <div className="flex h-8 items-center justify-between">
          <label htmlFor="jwtgen-output" className="text-sm font-medium">
            Signed JWT
          </label>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!token}
            aria-label="Copy signed JWT"
            className="h-8 gap-1.5 rounded-full px-3 text-xs"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>

        <textarea
          id="jwtgen-output"
          value={token ?? ""}
          readOnly
          spellCheck={false}
          placeholder="Your signed JWT will appear here."
          aria-live="polite"
          className="min-h-24 w-full resize-y break-all rounded-xl border bg-muted/20 p-4 font-mono text-sm outline-none"
        />

        {error?.source === "general" && (
          <ToolError title="Signing failed" message={error.message} />
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        For testing and development only — this tool runs entirely in your
        browser, but you&apos;re still responsible for keeping real
        production secrets out of any tool you don&apos;t control.
      </p>
    </div>
  );
}

export default JwtGenerator;
