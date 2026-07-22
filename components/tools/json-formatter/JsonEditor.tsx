"use client";

import { AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface JsonEditorProps {
  id: string;
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  error?: string | null;
  actions?: ReactNode;
  className?: string;
}

/**
 * A single labeled code panel: header row (label + optional actions
 * like a Copy button), a monospace textarea, and an optional inline
 * error message. Used for both the editable input and the read-only
 * formatted output, so the panel chrome never has to be written twice.
 */
export function JsonEditor({
  id,
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
  error,
  actions,
  className,
}: JsonEditorProps) {
  const errorId = `${id}-error`;

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-foreground/[0.03] transition-colors",
        error ? "border-destructive/40" : "border-white/10",
        className
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
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        placeholder={placeholder}
        spellCheck={false}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "min-h-[320px] flex-1 resize-none rounded-none border-0 bg-transparent p-4 font-mono text-sm leading-relaxed text-foreground shadow-none",
          "focus-visible:ring-0 focus-visible:ring-offset-0",
          readOnly && "text-muted-foreground"
        )}
      />

      {error && (
        <div
          id={errorId}
          role="alert"
          className="flex items-start gap-2 border-t border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default JsonEditor;
