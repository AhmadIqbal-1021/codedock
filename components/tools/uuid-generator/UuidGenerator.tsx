"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, Copy, Download, Fingerprint, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolToolbar, type ToolAction } from "@/components/shared/ToolToolbar";
import TextStats from "@/components/shared/TextStats";

const QUANTITY_OPTIONS = [1, 5, 10, 25, 50, 100] as const;
type Quantity = (typeof QUANTITY_OPTIONS)[number];

const DOWNLOAD_FILENAME = "uuids.txt";

// --------------------------------------------------------------------------
// Pure helpers (no state, fully testable in isolation)
// --------------------------------------------------------------------------

/** Generates `quantity` RFC 4122 v4 UUIDs via the native browser API. */
function generateUUIDs(quantity: number): string[] {
  return Array.from({ length: quantity }, () => crypto.randomUUID());
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function downloadUUIDs(uuids: string[]): void {
  const blob = new Blob([uuids.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = DOWNLOAD_FILENAME;
  link.click();

  URL.revokeObjectURL(url);
}

// --------------------------------------------------------------------------
// Component
// --------------------------------------------------------------------------

export function UuidGenerator() {
  const [quantity, setQuantity] = useState<Quantity>(5);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const joinedUuids = useMemo(() => uuids.join("\n"), [uuids]);

  const handleGenerate = useCallback(() => {
    setUuids(generateUUIDs(quantity));
    setCopiedIndex(null);
    setCopiedAll(false);
  }, [quantity]);

  const handleClear = useCallback(() => {
    setUuids([]);
    setCopiedIndex(null);
    setCopiedAll(false);
  }, []);

  const handleCopyUuid = useCallback(async (uuid: string, index: number) => {
    const success = await copyToClipboard(uuid);
    if (!success) return;

    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }, []);

  const handleCopyAll = useCallback(async () => {
    if (uuids.length === 0) return;

    const success = await copyToClipboard(joinedUuids);
    if (!success) return;

    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  }, [uuids, joinedUuids]);

  const handleDownload = useCallback(() => {
    if (uuids.length === 0) return;
    downloadUUIDs(uuids);
  }, [uuids]);

  const actions: ToolAction[] = [
    { label: "Generate", icon: Fingerprint, onClick: handleGenerate },
    {
      label: "Copy All",
      icon: Copy,
      onClick: handleCopyAll,
      disabled: uuids.length === 0,
      variant: "outline",
    },
    {
      label: "Download",
      icon: Download,
      onClick: handleDownload,
      disabled: uuids.length === 0,
      variant: "outline",
    },
    {
      label: "Clear",
      icon: Trash2,
      onClick: handleClear,
      disabled: uuids.length === 0,
      variant: "outline",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <ToolToolbar actions={actions}>
        <div
          role="group"
          aria-label="Number of UUIDs to generate"
          className="flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-foreground/[0.03] p-1"
        >
          {QUANTITY_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setQuantity(option)}
              aria-pressed={quantity === option}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                quantity === option
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </ToolToolbar>

      {/* Output */}
      <div className="space-y-2">
        <div className="flex h-8 items-center justify-between">
          <label className="text-sm font-medium">Generated UUIDs</label>

          {uuids.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyAll}
              aria-label="Copy all UUIDs"
              className="h-8 gap-1.5 rounded-full px-3 text-xs"
            >
              {copiedAll ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied all
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy all
                </>
              )}
            </Button>
          )}
        </div>

        <div
          className="max-h-[480px] overflow-y-auto rounded-xl border bg-muted/20"
          aria-live="polite"
        >
          {uuids.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No UUIDs generated yet.
            </p>
          ) : (
            <ol className="divide-y divide-white/10">
              {uuids.map((uuid, index) => (
                <li
                  key={`${uuid}-${index}`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">
                      {index + 1}
                    </span>
                    <code className="truncate font-mono text-sm">{uuid}</code>
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyUuid(uuid, index)}
                    aria-label={`Copy UUID ${index + 1}`}
                    className="h-7 shrink-0 gap-1.5 rounded-full px-2.5 text-xs"
                  >
                    {copiedIndex === index ? (
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
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="space-y-2">
        <div className="rounded-xl border bg-muted/20 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Total UUIDs: </span>
          <span className="font-mono font-medium">{uuids.length}</span>
        </div>

        <TextStats text={joinedUuids} />
      </div>
    </div>
  );
}

export default UuidGenerator;
