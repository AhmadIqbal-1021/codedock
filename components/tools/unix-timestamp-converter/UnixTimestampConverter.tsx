"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRightLeft, Check, Clock, Copy, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolToolbar, type ToolAction } from "@/components/shared/ToolToolbar";
import ToolError from "@/components/shared/ToolError";

type Mode = "unixToDate" | "dateToUnix";
type UnixUnit = "seconds" | "milliseconds";

// JS Date can only represent +/- 100,000,000 days from the epoch, i.e.
// roughly +/- 8,640,000,000,000,000 ms. Anything beyond that is rejected
// rather than silently clamped.
const MAX_SAFE_DATE_MS = 8_640_000_000_000_000;

interface UnixToDateResult {
  local: string;
  utc: string;
  iso: string;
}

interface DateToUnixResult {
  seconds: string;
  milliseconds: string;
  utc: string;
  iso: string;
}

const localDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "full",
  timeStyle: "long",
});

const utcDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "full",
  timeStyle: "long",
  timeZone: "UTC",
});

/** Parses a raw timestamp string + unit into a validated Date, or an error message. */
function parseUnixTimestamp(
  raw: string,
  unit: UnixUnit
): { date: Date } | { error: string } {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { error: "Enter a Unix timestamp." };
  }

  // Digits only, optional leading minus, optional decimal portion.
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return { error: "Timestamp must be a number (digits only)." };
  }

  const numericValue = Number(trimmed);
  if (!Number.isFinite(numericValue)) {
    return { error: "Timestamp must be a number (digits only)." };
  }

  const milliseconds = unit === "seconds" ? numericValue * 1000 : numericValue;

  if (Math.abs(milliseconds) > MAX_SAFE_DATE_MS) {
    return { error: "Timestamp is outside the supported date range." };
  }

  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) {
    return { error: "That timestamp doesn't map to a valid date." };
  }

  return { date };
}

/** Parses a datetime-local input value (local wall-clock time) into a Date. */
function parseHumanDate(raw: string): { date: Date } | { error: string } {
  if (!raw.trim()) {
    return { error: "Select a date and time." };
  }

  // datetime-local values have no timezone suffix, so the Date
  // constructor correctly treats them as local time.
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return { error: "That date and time isn't valid." };
  }

  return { date };
}

function buildUnixToDateResult(date: Date): UnixToDateResult {
  return {
    local: localDateTimeFormatter.format(date),
    utc: utcDateTimeFormatter.format(date),
    iso: date.toISOString(),
  };
}

function buildDateToUnixResult(date: Date): DateToUnixResult {
  return {
    seconds: Math.floor(date.getTime() / 1000).toString(),
    milliseconds: date.getTime().toString(),
    utc: utcDateTimeFormatter.format(date),
    iso: date.toISOString(),
  };
}

interface ResultRowProps {
  label: string;
  value: string;
  fieldKey: string;
  copiedField: string | null;
  onCopy: (value: string, fieldKey: string) => void;
}

/** One labeled, copyable output row — shared by both conversion modes. */
function ResultRow({ label, value, fieldKey, copiedField, onCopy }: ResultRowProps) {
  const isCopied = copiedField === fieldKey;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate font-mono text-sm">{value}</p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onCopy(value, fieldKey)}
        aria-label={`Copy ${label}`}
        className="h-7 w-7 shrink-0 rounded-full p-0 text-muted-foreground hover:text-foreground"
      >
        {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

export function UnixTimestampConverter() {
  const [mode, setMode] = useState<Mode>("unixToDate");

  const [unixInput, setUnixInput] = useState("");
  const [unixUnit, setUnixUnit] = useState<UnixUnit>("seconds");
  const [unixResult, setUnixResult] = useState<UnixToDateResult | null>(null);

  const [dateInput, setDateInput] = useState("");
  const [dateResult, setDateResult] = useState<DateToUnixResult | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [now, setNow] = useState(() => Date.now());

  const handleConvert = useCallback(() => {
    setCopiedField(null);

    if (mode === "unixToDate") {
      const parsed = parseUnixTimestamp(unixInput, unixUnit);
      if ("error" in parsed) {
        setError(parsed.error);
        setUnixResult(null);
        return;
      }
      setError(null);
      setUnixResult(buildUnixToDateResult(parsed.date));
    } else {
      const parsed = parseHumanDate(dateInput);
      if ("error" in parsed) {
        setError(parsed.error);
        setDateResult(null);
        return;
      }
      setError(null);
      setDateResult(buildDateToUnixResult(parsed.date));
    }
  }, [mode, unixInput, unixUnit, dateInput]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        handleConvert();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleConvert]);

  const handleClear = () => {
    setUnixInput("");
    setDateInput("");
    setUnixResult(null);
    setDateResult(null);
    setError(null);
    setCopiedField(null);
  };

  const handleModeChange = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setError(null);
    setCopiedField(null);
  };

  const handleNow = () => {
    setError(null);
    setCopiedField(null);

    if (mode === "unixToDate") {
      setUnixInput(
        unixUnit === "seconds"
          ? Math.floor(Date.now() / 1000).toString()
          : Date.now().toString()
      );
    } else {
      // Format for <input type="datetime-local">: "YYYY-MM-DDTHH:mm:ss" in local time.
      const current = new Date();
      const pad = (value: number) => value.toString().padStart(2, "0");
      const localValue = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(
        current.getDate()
      )}T${pad(current.getHours())}:${pad(current.getMinutes())}:${pad(current.getSeconds())}`;
      setDateInput(localValue);
    }
  };

  const copyToClipboard = async (value: string, fieldKey: string) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(fieldKey);
      setTimeout(
        () => setCopiedField((current) => (current === fieldKey ? null : current)),
        1500
      );
    } catch {
      // Clipboard unavailable.
    }
  };

  const handleToolbarCopy = () => {
    if (mode === "unixToDate" && unixResult) {
      void copyToClipboard(unixResult.iso, "iso");
    } else if (mode === "dateToUnix" && dateResult) {
      void copyToClipboard(dateResult.seconds, "seconds");
    }
  };

  const hasCopyableResult =
    (mode === "unixToDate" && unixResult !== null) ||
    (mode === "dateToUnix" && dateResult !== null);

  const actions: ToolAction[] = [
    { label: "Convert", icon: ArrowRightLeft, onClick: handleConvert },
    {
      label: "Copy",
      icon: Copy,
      onClick: handleToolbarCopy,
      disabled: !hasCopyableResult,
      variant: "outline",
    },
    {
      label: "Clear",
      icon: Trash2,
      onClick: handleClear,
      disabled: !unixInput && !dateInput,
      variant: "outline",
    },
    { label: "Now", icon: Clock, onClick: handleNow, variant: "outline" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <ToolToolbar actions={actions}>
        <div
          role="group"
          aria-label="Conversion mode"
          className="flex items-center gap-1 rounded-full border border-white/10 bg-foreground/[0.03] p-1"
        >
          <button
            type="button"
            onClick={() => handleModeChange("unixToDate")}
            aria-pressed={mode === "unixToDate"}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
              mode === "unixToDate"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Unix &rarr; Date
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("dateToUnix")}
            aria-pressed={mode === "dateToUnix"}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
              mode === "dateToUnix"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Date &rarr; Unix
          </button>
        </div>
      </ToolToolbar>

      <div className="text-xs text-muted-foreground">
        Press <kbd className="rounded border px-1.5 py-0.5">Ctrl</kbd>
        {" + "}
        <kbd className="rounded border px-1.5 py-0.5">Enter</kbd>
        {" to convert"}
      </div>

      {mode === "unixToDate" ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="unix-input" className="text-sm font-medium">
              Unix timestamp
            </label>

            <div
              role="group"
              aria-label="Timestamp unit"
              className="flex items-center gap-1 rounded-full border border-white/10 bg-foreground/[0.03] p-1"
            >
              {(["seconds", "milliseconds"] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => {
                    setUnixUnit(unit);
                    setError(null);
                  }}
                  aria-pressed={unixUnit === unit}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors duration-200 ${
                    unixUnit === unit
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          <input
            id="unix-input"
            type="text"
            inputMode="numeric"
            value={unixInput}
            onChange={(event) => {
              setUnixInput(event.target.value);
              setError(null);
            }}
            placeholder={unixUnit === "seconds" ? "e.g. 1700000000" : "e.g. 1700000000000"}
            spellCheck={false}
            aria-invalid={Boolean(error)}
            className={`w-full rounded-xl border bg-background px-4 py-3 font-mono text-sm outline-none transition focus:ring-2 ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "focus:ring-ring"
            }`}
          />

          {error && <ToolError title="Conversion Error" message={error} />}

          <div className="rounded-xl border bg-muted/20">
            {unixResult ? (
              <div className="divide-y divide-white/10">
                <ResultRow
                  label="Local time"
                  value={unixResult.local}
                  fieldKey="local"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
                <ResultRow
                  label="UTC time"
                  value={unixResult.utc}
                  fieldKey="utc"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
                <ResultRow
                  label="ISO 8601"
                  value={unixResult.iso}
                  fieldKey="iso"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
              </div>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Convert a timestamp to see the local, UTC, and ISO 8601 representations.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label htmlFor="date-input" className="text-sm font-medium">
            Date and time (local)
          </label>

          <input
            id="date-input"
            type="datetime-local"
            step="1"
            value={dateInput}
            onChange={(event) => {
              setDateInput(event.target.value);
              setError(null);
            }}
            aria-invalid={Boolean(error)}
            className={`w-full rounded-xl border bg-background px-4 py-3 font-mono text-sm outline-none transition focus:ring-2 ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "focus:ring-ring"
            }`}
          />

          {error && <ToolError title="Conversion Error" message={error} />}

          <div className="rounded-xl border bg-muted/20">
            {dateResult ? (
              <div className="divide-y divide-white/10">
                <ResultRow
                  label="Seconds"
                  value={dateResult.seconds}
                  fieldKey="seconds"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
                <ResultRow
                  label="Milliseconds"
                  value={dateResult.milliseconds}
                  fieldKey="milliseconds"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
                <ResultRow
                  label="UTC time"
                  value={dateResult.utc}
                  fieldKey="utc"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
                <ResultRow
                  label="ISO 8601"
                  value={dateResult.iso}
                  fieldKey="iso"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                />
              </div>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Convert a date to see the Unix timestamp, UTC, and ISO 8601 representations.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Current timestamp — a live reference, independent of the form above. */}
      <div className="rounded-xl border bg-foreground/[0.03] p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Current Unix timestamp</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNow(Date.now())}
            aria-label="Refresh current timestamp"
            className="h-7 gap-1.5 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ResultRow
            label="Seconds"
            value={Math.floor(now / 1000).toString()}
            fieldKey="now-seconds"
            copiedField={copiedField}
            onCopy={copyToClipboard}
          />
          <ResultRow
            label="Milliseconds"
            value={now.toString()}
            fieldKey="now-milliseconds"
            copiedField={copiedField}
            onCopy={copyToClipboard}
          />
        </div>
      </div>
    </div>
  );
}

export default UnixTimestampConverter;
