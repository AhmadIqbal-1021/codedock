"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ArrowLeftRight,
  Check,
  Copy,
 Trash2,
  Link2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ToolToolbar,
  type ToolAction,
} from "@/components/shared/ToolToolbar";

import TextStats from "@/components/shared/TextStats";
import ToolError from "@/components/shared/ToolError";

type Mode = "encode" | "decode";

export function UrlEncoder() {
  const [mode, setMode] =
    useState<Mode>("encode");

  const [input, setInput] =
    useState("");

  const [output, setOutput] =
    useState("");

  const [error, setError] =
    useState<string | null>(null);

  const [copied, setCopied] =
    useState(false);

  const handleConvert = useCallback(() => {
    setError(null);
    setOutput("");
    setCopied(false);

    if (!input.trim()) {
      setError(
        mode === "encode"
          ? "Enter some text to encode."
          : "Enter a URL encoded string to decode."
      );

      return;
    }

    try {
      if (mode === "encode") {
        const encoded =
          encodeURIComponent(input);

        setOutput(encoded);
      } else {
        const decoded =
          decodeURIComponent(input);

        setOutput(decoded);
      }
    } catch {
      setError(
        "Invalid URL encoded string."
      );
    }
  }, [input, mode]);

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError(null);
    setCopied(false);
  };

  const handleSwap = () => {
    setMode((current) =>
      current === "encode"
        ? "decode"
        : "encode"
    );

    setInput(output);
    setOutput(input);
    setError(null);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(
        output
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      // Clipboard unavailable.
    }
  };

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.ctrlKey &&
        event.key === "Enter"
      ) {
        event.preventDefault();

        handleConvert();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [handleConvert]);

  const actions: ToolAction[] = [
    {
      label:
        mode === "encode"
          ? "Encode"
          : "Decode",
      icon: Link2,
      onClick: handleConvert,
    },
    {
      label: "Swap",
      icon: ArrowLeftRight,
      onClick: handleSwap,
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
          aria-label="URL mode"
          className="flex items-center gap-1 rounded-full border border-white/10 bg-foreground/[0.03] p-1"
        >
          <button
            type="button"
            onClick={() => {
              setMode("encode");
              setError(null);
            }}
            aria-pressed={
              mode === "encode"
            }
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
              mode === "encode"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Encode
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("decode");
              setError(null);
            }}
            aria-pressed={
              mode === "decode"
            }
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
              mode === "decode"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Decode
          </button>
                  </div>
      </ToolToolbar>

      <div className="text-xs text-muted-foreground">
        Press{" "}
        <kbd className="rounded border px-1.5 py-0.5">
          Ctrl
        </kbd>
        {" + "}
        <kbd className="rounded border px-1.5 py-0.5">
          Enter
        </kbd>
        {" to "}
        {mode === "encode"
          ? "encode"
          : "decode"}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* INPUT */}

        <div className="space-y-2">

          <div className="flex h-8 items-center">
            <label
              htmlFor="url-input"
              className="text-sm font-medium"
            >
              {mode === "encode"
                ? "Plain text / URL"
                : "URL encoded text"}
            </label>
          </div>

          <textarea
            id="url-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError(null);
            }}
            placeholder={
              mode === "encode"
                ? "Enter text or URL to encode..."
                : "Paste encoded URL here..."
            }
            spellCheck={false}
            aria-invalid={Boolean(error)}
            className={`min-h-64 w-full resize-y rounded-xl border bg-background p-4 font-mono text-sm outline-none transition focus:ring-2 ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "focus:ring-ring"
            }`}
          />

          {error && (
            <ToolError
              title="Conversion Error"
              message={error}
            />
          )}

          <TextStats text={input} />

        </div>

        {/* OUTPUT */}

        <div className="space-y-2">

          <div className="flex h-8 items-center justify-between">

            <label
              htmlFor="url-output"
              className="text-sm font-medium"
            >
              {mode === "encode"
                ? "Encoded URL"
                : "Decoded text"}
            </label>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={!output}
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
            id="url-output"
            value={output}
            readOnly
            spellCheck={false}
            placeholder={
              mode === "encode"
                ? "Encoded URL will appear here..."
                : "Decoded text will appear here..."
            }
            className="min-h-64 w-full resize-y rounded-xl border bg-muted/20 p-4 font-mono text-sm outline-none"
          />

          <TextStats text={output} />

        </div>

      </div>
            <div className="rounded-xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <p>
          <strong>Tip:</strong> URL encoding converts special characters into a
          format that can safely be transmitted in URLs. For example, spaces
          become <code>%20</code>, <code>?</code> becomes <code>%3F</code>, and
          <code>&amp;</code> becomes <code>%26</code>.
        </p>
      </div>
    </div>
  );
}

export default UrlEncoder;