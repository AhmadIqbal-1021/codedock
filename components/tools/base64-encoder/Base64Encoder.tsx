"use client";

import { useState } from "react";
import { ArrowLeftRight, Check, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ToolToolbar,
  type ToolAction,
} from "@/components/shared/ToolToolbar";
import TextStats from "@/components/shared/TextStats";
import ToolError from "@/components/shared/ToolError";

type Mode = "encode" | "decode";

export function Base64Encoder() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    setError(null);
    setOutput("");
    setCopied(false);

    if (!input.trim()) {
      setError(
        `Enter some text to ${mode === "encode" ? "encode" : "decode"}.`
      );
      return;
    }

    try {
      if (mode === "encode") {
        const encoded = btoa(
          unescape(encodeURIComponent(input))
        );

        setOutput(encoded);
        return;
      }

      const decoded = decodeURIComponent(
        escape(atob(input.trim()))
      );

      setOutput(decoded);
    } catch {
      setError(
        mode === "encode"
          ? "Unable to encode the input."
          : "Invalid Base64. Please check the input and try again."
      );
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
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

  const handleSwap = () => {
    setMode((current) =>
      current === "encode" ? "decode" : "encode"
    );

    setInput(output);
    setOutput(input);
    setError(null);
    setCopied(false);
  };

  const actions: ToolAction[] = [
    {
      label: mode === "encode" ? "Encode" : "Decode",
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
      <ToolToolbar actions={actions} />

      <div
        role="group"
        aria-label="Base64 mode"
        className="flex w-fit items-center gap-1 rounded-full border border-white/10 bg-foreground/[0.03] p-1"
      >
        <button
          type="button"
          onClick={() => {
            setMode("encode");
            setError(null);
          }}
          aria-pressed={mode === "encode"}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
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
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            mode === "decode"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Decode
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-2">
         <div className="flex h-8 items-center">
  <label
    htmlFor="base64-input"
    className="text-sm font-medium"
  >
    {mode === "encode"
      ? "Text input"
      : "Base64 input"}
  </label>
</div>
          <textarea
           
            
            id="base64-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError(null);
             
            }}
            placeholder={
              mode === "encode"
                ? "Enter text to encode..."
                : "Paste Base64 to decode..."
                
            }
            className={`min-h-64 w-full resize-y rounded-xl border bg-background p-4 font-mono text-sm outline-none transition focus:ring-2 focus:ring-ring ${
                 error
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
      : "focus:ring-ring"
  }`}
            spellCheck={false}
            aria-invalid={Boolean(error)}
          />
            
              {error && (
            <ToolError
                title="Conversion error"
                message={error}
            />
            )}

          <TextStats text={input} />
        </div>

        <div className="space-y-2">
          <div className="flex h-8 items-center justify-between">
            <label
              htmlFor="base64-output"
              className="text-sm font-medium"
            >
              {mode === "encode"
                ? "Base64 output"
                : "Decoded output"}
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
            id="base64-output"
            value={output}
            readOnly
            placeholder={
              mode === "encode"
                ? "Encoded Base64 will appear here..."
                : "Decoded text will appear here..."
            }
            className="min-h-64 w-full resize-y rounded-xl border bg-muted/20 p-4 font-mono text-sm outline-none"
            spellCheck={false}
          />

          <TextStats text={output} />
        </div>
      </div>

            
    </div>
  );
}

export default Base64Encoder;