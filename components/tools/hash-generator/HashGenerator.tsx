"use client";

import { useCallback, useState } from "react";
import { Check, Copy, Hash, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolToolbar, type ToolAction } from "@/components/shared/ToolToolbar";
import ToolError from "@/components/shared/ToolError";
import TextStats from "@/components/shared/TextStats";

const ALGORITHMS = ["SHA-256", "SHA-384", "SHA-512"] as const;
type HashAlgorithm = (typeof ALGORITHMS)[number];

const DEFAULT_ALGORITHM: HashAlgorithm = "SHA-256";

/** Converts a digest ArrayBuffer into a lowercase hex string. */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Hashes `text` with the given algorithm via the native Web Crypto API. */
async function hashText(algorithm: HashAlgorithm, text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest(algorithm, data);
  return bufferToHex(digest);
}

export function HashGenerator() {
  const [input, setInput] = useState("");
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>(DEFAULT_ALGORITHM);
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    // Guard against overlapping requests (e.g. rapid double-clicks).
    if (isHashing) return;

    setCopied(false);

    if (!input.trim()) {
      setError("Enter some text to hash.");
      setHash(null);
      return;
    }

    setError(null);
    setIsHashing(true);

    try {
      const digestHex = await hashText(algorithm, input);
      setHash(digestHex);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate hash.");
      setHash(null);
    } finally {
      setIsHashing(false);
    }
  }, [input, algorithm, isHashing]);

  const handleClear = () => {
    setInput("");
    setHash(null);
    setError(null);
    setCopied(false);
  };

  const handleAlgorithmChange = (next: HashAlgorithm) => {
    if (next === algorithm) return;
    setAlgorithm(next);
    // The previous hash was computed for a different algorithm, so
    // clear it rather than show a stale result under the new label.
    setHash(null);
    setError(null);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!hash) return;

    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable.
    }
  };

  const actions: ToolAction[] = [
    {
      label: isHashing ? "Hashing..." : "Generate Hash",
      icon: isHashing ? Loader2 : Hash,
      onClick: handleGenerate,
      disabled: isHashing,
    },
    {
      label: "Copy",
      icon: Copy,
      onClick: handleCopy,
      disabled: !hash,
      variant: "outline",
    },
    {
      label: "Clear",
      icon: Trash2,
      onClick: handleClear,
      disabled: !input && !hash,
      variant: "outline",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <ToolToolbar actions={actions}>
        <div
          role="group"
          aria-label="Hash algorithm"
          className="flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-foreground/[0.03] p-1"
        >
          {ALGORITHMS.map((option) => (
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

      {/* Input */}
      <div className="space-y-2">
        <div className="flex h-8 items-center">
          <label htmlFor="hash-input" className="text-sm font-medium">
            Text to hash
          </label>
        </div>

        <textarea
          id="hash-input"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setError(null);
          }}
          placeholder="Enter or paste the text you want to hash..."
          spellCheck={false}
          aria-invalid={Boolean(error)}
          className={`min-h-48 w-full resize-y rounded-xl border bg-background p-4 font-mono text-sm outline-none transition focus:ring-2 ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "focus:ring-ring"
          }`}
        />

        {error && <ToolError title="Hashing Error" message={error} />}

        <TextStats text={input} />
      </div>

      {/* Output */}
      <div className="space-y-2">
        <div className="flex h-8 items-center justify-between">
          <label htmlFor="hash-output" className="text-sm font-medium">
            {algorithm} hash
          </label>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!hash}
            aria-label="Copy hash"
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
          id="hash-output"
          value={hash ?? ""}
          readOnly
          spellCheck={false}
          placeholder="Your hash will appear here."
          aria-live="polite"
          className="min-h-24 w-full resize-y break-all rounded-xl border bg-muted/20 p-4 font-mono text-sm outline-none"
        />
      </div>
    </div>
  );
}

export default HashGenerator;
