"use client";

import { useState } from "react";
import { Braces, Check, Copy, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolHeader } from "@/components/tools/json-formatter/ToolHeader";
import { JsonEditor } from "./JsonEditor";

const INDENT_OPTIONS = [2, 4] as const;
type Indent = (typeof INDENT_OPTIONS)[number];  

const SAMPLE_PLACEHOLDER = `{
  "paste": "your JSON here",
  "then": "click Format"
}`;

/**
 * Client-side JSON Formatter. No network calls: parsing, validation,
 * and formatting all happen in the browser via JSON.parse/stringify.
 */
export function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState<Indent>(2);
  const [copied, setCopied] = useState(false);

  const handleFormat = () => {
    if (!input.trim()) {
      setError("Paste some JSON before formatting.");
      setOutput("");
      return;
    }

    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indent));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON.");
      setOutput("");
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
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permissions denied or unavailable; fail silently.
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <ToolHeader
        icon={Braces}
        title="JSON Formatter"
        description="Paste JSON, format it with clean indentation, and catch syntax errors instantly. Everything runs in your browser."
        category="Developer Tools"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleFormat}
          className="rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 px-5 text-white hover:opacity-90"
        >
          <Wand2 className="mr-1.5 h-4 w-4" />
          Format JSON
        </Button>

        <Button
          variant="outline"
          onClick={handleClear}
          className="rounded-full border-white/15 bg-transparent"
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          Clear
        </Button>

        <div
          role="group"
          aria-label="Indent size"
          className="ml-auto flex items-center gap-1 rounded-full border border-white/10 bg-foreground/[0.03] p-1"
        >
          {INDENT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setIndent(option)}
              aria-pressed={indent === option}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                indent === option
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option} spaces
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <JsonEditor
          id="json-input"
          label="Input"
          value={input}
          onChange={setInput}
          placeholder={SAMPLE_PLACEHOLDER}
          error={error}
        />

        <JsonEditor
          id="json-output"
          label="Formatted output"
          value={output}
          readOnly
          placeholder="Formatted JSON will appear here."
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={!output}
              className="h-7 gap-1.5 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground"
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
          }
        />
      </div>
    </div>
  );
}

export default JsonFormatter;
