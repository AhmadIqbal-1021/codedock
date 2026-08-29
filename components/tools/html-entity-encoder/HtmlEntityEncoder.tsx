"use client";

import { useCallback, useEffect, useState } from "react";

import { ArrowLeftRight, Check, Code2, Copy, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ToolToolbar, type ToolAction } from "@/components/shared/ToolToolbar";

import TextStats from "@/components/shared/TextStats";
import ToolError from "@/components/shared/ToolError";

import { decodeHtmlEntities, encodeHtmlEntities } from "./html-entities";

type Mode = "encode" | "decode";

export function HtmlEntityEncoder() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [escapeNonAscii, setEscapeNonAscii] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConvert = useCallback(() => {
    setError(null);
    setOutput("");
    setCopied(false);

    if (!input.trim()) {
      setError(
        mode === "encode"
          ? "Enter some text to encode."
          : "Enter HTML-entity-encoded text to decode."
      );

      return;
    }

    if (mode === "encode") {
      setOutput(encodeHtmlEntities(input, { escapeNonAscii }));
    } else {
      setOutput(decodeHtmlEntities(input));
    }
  }, [input, mode, escapeNonAscii]);

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError(null);
    setCopied(false);
  };

  const handleSwap = () => {
    setMode((current) => (current === "encode" ? "decode" : "encode"));
    setInput(output);
    setOutput(input);
    setError(null);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      // Clipboard unavailable.
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        handleConvert();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleConvert]);

  const actions: ToolAction[] = [
    {
      label: mode === "encode" ? "Encode" : "Decode",
      icon: Code2,
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
          aria-label="HTML entity mode"
          className="flex items-center gap-1 rounded-full border border-white/10 bg-foreground/[0.03] p-1"
        >
          <button
            type="button"
            onClick={() => {
              setMode("encode");
              setError(null);
            }}
            aria-pressed={mode === "encode"}
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
            aria-pressed={mode === "decode"}
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
        <kbd className="rounded border px-1.5 py-0.5">Ctrl</kbd>
        {" + "}
        <kbd className="rounded border px-1.5 py-0.5">Enter</kbd>
        {" to "}
        {mode === "encode" ? "encode" : "decode"}
      </div>

      {mode === "encode" && (
        <label className="flex w-fit items-center gap-2.5 rounded-xl border border-white/10 bg-foreground/[0.03] px-4 py-3 text-sm transition-colors hover:bg-foreground/[0.05]">
          <input
            type="checkbox"
            checked={escapeNonAscii}
            onChange={(event) => setEscapeNonAscii(event.target.checked)}
            className="h-4 w-4 accent-indigo-500"
          />
          Encode all non-ASCII characters (as numeric entities)
        </label>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* INPUT */}
        <div className="space-y-2">
          <div className="flex h-8 items-center">
            <label htmlFor="html-entity-input" className="text-sm font-medium">
              {mode === "encode" ? "Plain text" : "HTML-encoded text"}
            </label>
          </div>

          <textarea
            id="html-entity-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError(null);
            }}
            placeholder={
              mode === "encode"
                ? "Enter text to encode, e.g. <div class=\"a\">Tom & Jerry's</div>"
                : "Paste HTML entities to decode, e.g. &lt;div&gt;Tom &amp; Jerry&#39;s&lt;/div&gt;"
            }
            spellCheck={false}
            aria-invalid={Boolean(error)}
            className={`min-h-64 w-full resize-y rounded-xl border bg-background p-4 font-mono text-sm outline-none transition focus:ring-2 ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "focus:ring-ring"
            }`}
          />

          {error && <ToolError title="Conversion Error" message={error} />}

          <TextStats text={input} />
        </div>

        {/* OUTPUT */}
        <div className="space-y-2">
          <div className="flex h-8 items-center justify-between">
            <label htmlFor="html-entity-output" className="text-sm font-medium">
              {mode === "encode" ? "HTML-encoded output" : "Decoded text"}
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
            id="html-entity-output"
            value={output}
            readOnly
            spellCheck={false}
            placeholder={
              mode === "encode"
                ? "Encoded HTML will appear here..."
                : "Decoded text will appear here..."
            }
            className="min-h-64 w-full resize-y rounded-xl border bg-muted/20 p-4 font-mono text-sm outline-none"
          />

          <TextStats text={output} />
        </div>
      </div>

      <div className="rounded-xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <p>
          <strong>Tip:</strong> Encoding always escapes{" "}
          <code>&amp; &lt; &gt; &quot; &apos;</code> so text is safe to embed
          in HTML. Decoding understands standard named entities (like{" "}
          <code>&amp;amp;</code>) and numeric references (like{" "}
          <code>&amp;#39;</code> or <code>&amp;#x27;</code>) — unrecognized
          or malformed entities are left unchanged, just like a browser
          would.
        </p>
      </div>
    </div>
  );
}

export default HtmlEntityEncoder;
