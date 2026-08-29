"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  Copy,
  Play,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ToolToolbar,
  type ToolAction,
} from "@/components/shared/ToolToolbar";

import TextStats from "@/components/shared/TextStats";
import ToolError from "@/components/shared/ToolError";

const FLAG_OPTIONS = ["g", "i", "m", "s"] as const;
type Flag = (typeof FLAG_OPTIONS)[number];

const FLAG_LABELS: Record<Flag, string> = {
  g: "Global",
  i: "Ignore case",
  m: "Multiline",
  s: "Dot all",
};

interface RegexMatch {
  match: string;
  index: number;
  groups: string[];
}

interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

/** Splits `text` into plain/matched segments so matches can be <mark>ed. */
function buildHighlightSegments(
  text: string,
  results: RegexMatch[]
): HighlightSegment[] {
  if (results.length === 0) {
    return [{ text, isMatch: false }];
  }

  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (const result of results) {
    if (result.index > cursor) {
      segments.push({
        text: text.slice(cursor, result.index),
        isMatch: false,
      });
    }

    segments.push({ text: result.match, isMatch: true });
    cursor = result.index + result.match.length || cursor + 1;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isMatch: false });
  }

  return segments;
}

export function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState<Flag[]>(["g"]);
  const [testString, setTestString] = useState("");
  const [error, setError] = useState<string | null>(null);
  // null = not tested yet, [] = tested with zero matches
  const [results, setResults] = useState<RegexMatch[] | null>(null);
  const [copied, setCopied] = useState(false);

  const flagString = flags.join("");

  const handleTest = useCallback(() => {
    setError(null);
    setResults(null);
    setCopied(false);

    if (!pattern.trim()) {
      setError("Enter a regular expression pattern.");
      return;
    }

    if (!testString.trim()) {
      setError("Enter some text to test against.");
      return;
    }

    let regex: RegExp;
    try {
      regex = new RegExp(pattern, flagString);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid regular expression."
      );
      return;
    }

    const found: RegexMatch[] = [];

    if (flags.includes("g")) {
      for (const m of testString.matchAll(regex)) {
        found.push({
          match: m[0],
          index: m.index ?? 0,
          groups: m.slice(1).filter((g): g is string => g !== undefined),
        });

        // Safety cap so a pathological pattern can't lock up the tab.
        if (found.length >= 500) break;
      }
    } else {
      const m = regex.exec(testString);
      if (m) {
        found.push({
          match: m[0],
          index: m.index,
          groups: m.slice(1).filter((g): g is string => g !== undefined),
        });
      }
    }

    setResults(found);
  }, [pattern, flagString, flags, testString]);

  const handleClear = () => {
    setPattern("");
    setTestString("");
    setError(null);
    setResults(null);
    setCopied(false);
  };

  const toggleFlag = (flag: Flag) => {
    setFlags((current) =>
      current.includes(flag)
        ? current.filter((f) => f !== flag)
        : [...current, flag]
    );
    setError(null);
    setResults(null);
  };

  const handleCopy = async () => {
    if (!results || results.length === 0) return;

    try {
      await navigator.clipboard.writeText(
        results.map((r) => r.match).join("\n")
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable.
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        handleTest();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTest]);

  const segments = useMemo(
    () => buildHighlightSegments(testString, results ?? []),
    [testString, results]
  );

  const actions: ToolAction[] = [
    {
      label: "Test Regex",
      icon: Play,
      onClick: handleTest,
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
          aria-label="Regex flags"
          className="flex items-center gap-1 rounded-full border border-white/10 bg-foreground/[0.03] p-1"
        >
          {FLAG_OPTIONS.map((flag) => (
            <button
              key={flag}
              type="button"
              onClick={() => toggleFlag(flag)}
              aria-pressed={flags.includes(flag)}
              title={FLAG_LABELS[flag]}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                flags.includes(flag)
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {flag}
            </button>
          ))}
        </div>
      </ToolToolbar>

      <div className="text-xs text-muted-foreground">
        Press{" "}
        <kbd className="rounded border px-1.5 py-0.5">Ctrl</kbd>
        {" + "}
        <kbd className="rounded border px-1.5 py-0.5">Enter</kbd>
        {" to test"}
      </div>

      {/* Pattern input */}
      <div className="space-y-2">
        <label htmlFor="regex-pattern" className="text-sm font-medium">
          Regular expression
        </label>

        <div
          className={`flex items-center gap-1 rounded-xl border bg-background px-3 transition focus-within:ring-2 ${
            error
              ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20"
              : "focus-within:ring-ring"
          }`}
        >
          <span className="font-mono text-muted-foreground">/</span>
          <input
            id="regex-pattern"
            value={pattern}
            onChange={(event) => {
              setPattern(event.target.value);
              setError(null);
              setResults(null);
            }}
            placeholder="e.g. ^[a-z0-9_-]{3,16}$"
            spellCheck={false}
            aria-invalid={Boolean(error)}
            className="flex-1 bg-transparent py-3 font-mono text-sm outline-none"
          />
          <span className="font-mono text-muted-foreground">
            /{flagString}
          </span>
        </div>
      </div>

      {error && <ToolError title="Regex Error" message={error} />}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* TEST STRING */}
        <div className="space-y-2">
          <div className="flex h-8 items-center">
            <label htmlFor="regex-test-string" className="text-sm font-medium">
              Test string
            </label>
          </div>

          <textarea
            id="regex-test-string"
            value={testString}
            onChange={(event) => {
              setTestString(event.target.value);
              setError(null);
              setResults(null);
            }}
            placeholder="Paste or type the text you want to match against..."
            spellCheck={false}
            className="min-h-64 w-full resize-y rounded-xl border bg-background p-4 font-mono text-sm outline-none transition focus:ring-2 focus:ring-ring"
          />

          <TextStats text={testString} />
        </div>

        {/* MATCHES */}
        <div className="space-y-2">
          <div className="flex h-8 items-center justify-between">
            <label className="text-sm font-medium">Matches</label>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={!results || results.length === 0}
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

          <div className="min-h-64 w-full space-y-3 overflow-y-auto rounded-xl border bg-muted/20 p-4 font-mono text-sm">
            {results === null ? (
              <p className="text-muted-foreground">
                Matches will appear here.
              </p>
            ) : results.length === 0 ? (
              <p className="text-muted-foreground">No matches found.</p>
            ) : (
              <>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {segments.map((segment, i) =>
                    segment.isMatch ? (
                      <mark
                        key={i}
                        className="rounded bg-cyan-400/30 px-0.5 text-foreground"
                      >
                        {segment.text}
                      </mark>
                    ) : (
                      <span key={i}>{segment.text}</span>
                    )
                  )}
                </p>

                <ul className="space-y-1.5 divide-y divide-white/10 border-t border-white/10 pt-2 text-xs text-muted-foreground">
                  {results.map((result, i) => (
                    <li key={i} className="pt-1.5 first:pt-0">
                      Match {i + 1}: <span className="text-foreground">{result.match}</span>{" "}
                      (index {result.index})
                      {result.groups.length > 0 && (
                        <> — groups: {result.groups.join(", ")}</>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {results && (
            <p className="text-xs text-muted-foreground">
              {results.length} match{results.length === 1 ? "" : "es"} found
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <p>
          <strong>Tip:</strong> <code>g</code> finds every match instead of
          just the first, <code>i</code> ignores case, <code>m</code> makes{" "}
          <code>^</code>/<code>$</code> match line boundaries, and{" "}
          <code>s</code> lets <code>.</code> match newlines too.
        </p>
      </div>
    </div>
  );
}

export default RegexTester;
