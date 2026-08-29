"use client";

import { useState } from "react";
import { Check, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolToolbar, type ToolAction } from "@/components/shared/ToolToolbar";
import ToolError from "@/components/shared/ToolError";
import {
  BASE_CONFIG,
  BASES,
  formatBigIntForBase,
  parseBigIntForBase,
  type Base,
} from "./number-base";

type FieldValues = Record<Base, string>;

const EMPTY_VALUES: FieldValues = { 2: "", 8: "", 10: "", 16: "" };

interface BaseFieldRowProps {
  base: Base;
  value: string;
  isInvalid: boolean;
  copiedField: string | null;
  onChange: (base: Base, raw: string) => void;
  onCopy: (value: string, fieldKey: string) => void;
}

/** One editable, copyable field for a single base — binary/octal/decimal/hex all share this shape. */
function BaseFieldRow({ base, value, isInvalid, copiedField, onChange, onCopy }: BaseFieldRowProps) {
  const config = BASE_CONFIG[base];
  const fieldKey = `base-${base}`;
  const isCopied = copiedField === fieldKey;
  const inputId = `number-base-input-${base}`;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {config.label} <span className="font-normal text-muted-foreground">(base {base})</span>
      </label>

      <div
        className={`flex items-center gap-1 rounded-xl border bg-background px-2 transition focus-within:ring-2 ${
          isInvalid
            ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20"
            : "focus-within:ring-ring"
        }`}
      >
        <input
          id={inputId}
          type="text"
          inputMode={base === 16 ? "text" : "numeric"}
          value={value}
          onChange={(event) => onChange(base, event.target.value)}
          placeholder={config.placeholder}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={isInvalid}
          aria-describedby={isInvalid ? `${inputId}-error` : undefined}
          className="min-w-0 flex-1 bg-transparent py-2.5 font-mono text-sm outline-none"
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCopy(value, fieldKey)}
          disabled={!value}
          aria-label={`Copy ${config.label} value`}
          className="h-7 w-7 shrink-0 rounded-full p-0 text-muted-foreground hover:text-foreground"
        >
          {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

export function NumberBaseConverter() {
  const [values, setValues] = useState<FieldValues>(EMPTY_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [errorBase, setErrorBase] = useState<Base | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleFieldChange = (base: Base, raw: string) => {
    setCopiedField(null);

    // Always reflect exactly what the user typed in the field they're editing.
    setValues((prev) => ({ ...prev, [base]: raw }));

    // Empty, or just a lone "-" — the user is still typing, not an error yet.
    // Leave the other fields' last-good values alone.
    if (raw === "" || raw === "-") {
      setError(null);
      setErrorBase(null);
      return;
    }

    if (!BASE_CONFIG[base].pattern.test(raw)) {
      setError(BASE_CONFIG[base].invalidMessage);
      setErrorBase(base);
      return;
    }

    let parsed: bigint;
    try {
      parsed = parseBigIntForBase(raw, base);
    } catch {
      setError(BASE_CONFIG[base].invalidMessage);
      setErrorBase(base);
      return;
    }

    setError(null);
    setErrorBase(null);

    // Valid value — propagate to the other three fields. The field the user
    // is actively typing in keeps their raw text (no reformatting mid-type,
    // e.g. stripping leading zeros out from under them).
    setValues((prev) => {
      const next: FieldValues = { ...prev, [base]: raw };
      for (const otherBase of BASES) {
        if (otherBase === base) continue;
        next[otherBase] = formatBigIntForBase(parsed, otherBase);
      }
      return next;
    });
  };

  const handleClear = () => {
    setValues(EMPTY_VALUES);
    setError(null);
    setErrorBase(null);
    setCopiedField(null);
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

  const isEmpty = BASES.every((base) => values[base] === "");

  const actions: ToolAction[] = [
    { label: "Clear", icon: Trash2, onClick: handleClear, disabled: isEmpty, variant: "outline" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <ToolToolbar actions={actions} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {BASES.map((base) => (
          <div key={base} className="space-y-2">
            <BaseFieldRow
              base={base}
              value={values[base]}
              isInvalid={errorBase === base}
              copiedField={copiedField}
              onChange={handleFieldChange}
              onCopy={copyToClipboard}
            />
            {errorBase === base && error && <ToolError title="Invalid Input" message={error} />}
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Supports negative integers (leading &ldquo;-&rdquo;) and numbers larger than{" "}
        <code className="rounded bg-muted/40 px-1 py-0.5 font-mono">Number.MAX_SAFE_INTEGER</code>
        , computed with native <code className="rounded bg-muted/40 px-1 py-0.5 font-mono">BigInt</code>{" "}
        arithmetic so precision is never lost.
      </p>
    </div>
  );
}

export default NumberBaseConverter;
