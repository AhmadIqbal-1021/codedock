"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { Check, Copy, Download, Minimize2, Trash2, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToolToolbar, type ToolAction } from "@/components/shared/ToolToolbar";
import TextStats from "@/components/shared/TextStats";
import ToolError from "@/components/shared/ToolError";
import { formatJs, minifyJs } from "./js-format";
import { cn } from "@/lib/utils";

/**
 * JavaScript Formatter's working UI: toolbar + input/output panels.
 *
 * This is deliberately a safe, lightweight beautifier — not a real
 * AST-based formatter like Prettier. A real JS formatter needs a full
 * ECMAScript parser to be correct, and getting that subtly wrong risks
 * silently corrupting someone's actual code. So the underlying logic
 * (components/tools/js-formatter/js-format.ts) guarantees its
 * transformation is whitespace-only and content-preserving by
 * construction: every non-whitespace character of the input appears in
 * the output, in the same order — it only ever chooses how much
 * whitespace to place between tokens, never rewrites/reorders/deletes any
 * actual code character. No parser dependency (no prettier/acorn/espree/
 * esprima/etc) — that's the entire point.
 *
 * No network calls — tokenizing, formatting, minifying, file upload, and
 * file download all happen in the browser. The user's code is only ever
 * rendered as text inside a read-only <textarea>, never injected into the
 * DOM.
 *
 * Meant to be rendered as `children` inside ToolLayout, which supplies the
 * page's icon/title/description/category header:
 *
 * <ToolLayout icon={Braces} title="JavaScript Formatter" description="..." category="Developer Tools">
 *   <JsFormatter />
 *   <ToolFeatures features={...} />
 *   <ToolFAQ items={...} />
 *   <RelatedTools tools={...} />
 * </ToolLayout>
 */

const SAMPLE_PLACEHOLDER = `function greet(name) {
  if (!name) { throw new Error("name is required"); }
  return \`Hello, \${name}!\`;
}`;

const INDENT_OPTIONS = [2, 4] as const;
type Indent = (typeof INDENT_OPTIONS)[number];

type PrimaryAction = "format" | "minify";

type Issue = {
  title: string;
  message: string;
  /** Fatal issues clear the output; non-fatal ones are best-effort
   *  diagnostics shown alongside a still-produced output. */
  fatal: boolean;
};

const MAX_ISSUES_SHOWN = 3;

function summarizeIssues(issues: string[]): string {
  const shown = issues.slice(0, MAX_ISSUES_SHOWN);
  const extra = issues.length - shown.length;
  return shown.join(" ") + (extra > 0 ? ` (+${extra} more)` : "");
}

interface JsPanelProps {
  id: string;
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  issue?: Issue | null;
  actions?: ReactNode;
}

/** A single labeled panel: header row (label + optional actions like a
 *  Copy button), a monospace textarea, and an optional inline issue
 *  banner. Kept local to this file since it's only used here. */
function JsPanel({ id, label, value, onChange, placeholder, readOnly = false, issue, actions }: JsPanelProps) {
  const issueId = `${id}-issue`;

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-foreground/[0.03] transition-colors",
        issue?.fatal ? "border-destructive/40" : "border-white/10"
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {actions && <div className="flex items-center gap-1.5">{actions}</div>}
      </div>

      <Textarea
        id={id}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        readOnly={readOnly}
        placeholder={placeholder}
        spellCheck={false}
        aria-invalid={issue?.fatal ? true : undefined}
        aria-describedby={issue ? issueId : undefined}
        className={cn(
          "min-h-[320px] flex-1 resize-none rounded-none border-0 bg-transparent p-4 font-mono text-sm leading-relaxed text-foreground shadow-none",
          "focus-visible:ring-0 focus-visible:ring-offset-0",
          readOnly && "text-muted-foreground"
        )}
      />

      {issue && (
        <div id={issueId} className="border-t border-white/10 p-3">
          <ToolError title={issue.title} message={issue.message} />
        </div>
      )}
    </div>
  );
}

export function JsFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [issue, setIssue] = useState<Issue | null>(null);
  const [indent, setIndent] = useState<Indent>(2);
  const [primaryAction, setPrimaryAction] = useState<PrimaryAction>("format");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const runFormat = useCallback(() => {
    setPrimaryAction("format");

    if (!input.trim()) {
      setIssue({
        title: "Nothing to format",
        message: "Paste some JavaScript before formatting.",
        fatal: true,
      });
      setOutput("");
      return;
    }

    try {
      const { output: result, issues } = formatJs(input, indent);
      setOutput(result);
      setIssue(
        issues.length > 0
          ? { title: "Issues found", message: summarizeIssues(issues), fatal: false }
          : null
      );
    } catch {
      setOutput("");
      setIssue({
        title: "Unable to format",
        message: "This input could not be tokenized. Check for severely malformed syntax and try again.",
        fatal: true,
      });
    }
  }, [input, indent]);

  const runMinify = useCallback(() => {
    setPrimaryAction("minify");

    if (!input.trim()) {
      setIssue({
        title: "Nothing to minify",
        message: "Paste some JavaScript before minifying.",
        fatal: true,
      });
      setOutput("");
      return;
    }

    try {
      const { output: result, issues } = minifyJs(input);
      setOutput(result);
      setIssue(
        issues.length > 0
          ? { title: "Issues found", message: summarizeIssues(issues), fatal: false }
          : null
      );
    } catch {
      setOutput("");
      setIssue({
        title: "Unable to minify",
        message: "This input could not be tokenized. Check for severely malformed syntax and try again.",
        fatal: true,
      });
    }
  }, [input]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        if (primaryAction === "minify") {
          runMinify();
        } else {
          runFormat();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [primaryAction, runFormat, runMinify]);

  const handleClear = () => {
    setInput("");
    setOutput("");
    setIssue(null);
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

  // Upload: clicking the toolbar button just forwards to the hidden
  // native file input — the browser's file picker does the real work.
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!/\.(js|jsx|ts|tsx|mjs|cjs)$/i.test(file.name)) {
      setIssue({
        title: "Unsupported file",
        message: "Please upload a .js, .jsx, .ts, .tsx, or .mjs file.",
        fatal: true,
      });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setInput(reader.result as string);
      setIssue(null);
      setOutput("");
    };
    reader.readAsText(file);

    // Reset so selecting the same file again still fires onChange.
    event.target.value = "";
  };

  const handleDownload = () => {
    if (!output) return;

    const blob = new Blob([output], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download =
      primaryAction === "minify" ? "codedock-minified.js" : "codedock-formatted.js";
    link.click();

    URL.revokeObjectURL(url);
  };

  const actions: ToolAction[] = [
    { label: "Format", icon: Wand2, onClick: runFormat },
    { label: "Minify", icon: Minimize2, onClick: runMinify, variant: "outline" },
    { label: "Clear", icon: Trash2, onClick: handleClear, variant: "outline" },
    { label: "Upload", icon: Upload, onClick: handleUploadClick, variant: "outline" },
    {
      label: "Download",
      icon: Download,
      onClick: handleDownload,
      disabled: !output,
      variant: "outline",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <ToolToolbar actions={actions}>
        <div
          role="group"
          aria-label="Indent size"
          className="flex items-center gap-1 rounded-full border border-white/10 bg-foreground/[0.03] p-1"
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
      </ToolToolbar>

      <div className="text-xs text-muted-foreground">
        Press <kbd className="rounded border px-1.5 py-0.5">Ctrl</kbd>
        {" + "}
        <kbd className="rounded border px-1.5 py-0.5">Enter</kbd>
        {` to ${primaryAction === "minify" ? "minify" : "format"} JavaScript`}
      </div>

      {/* Hidden native file input driving the "Upload" toolbar action */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".js,.jsx,.ts,.tsx,.mjs,.cjs,text/javascript,application/javascript"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <JsPanel
          id="js-input"
          label="Input"
          value={input}
          onChange={(value) => {
            setInput(value);
            setIssue(null);
          }}
          placeholder={SAMPLE_PLACEHOLDER}
          issue={issue}
        />

        <JsPanel
          id="js-output"
          label={primaryAction === "minify" ? "Minified output" : "Formatted output"}
          value={output}
          readOnly
          placeholder="Formatted JavaScript will appear here."
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

      <TextStats text={input} />
    </div>
  );
}

export default JsFormatter;
