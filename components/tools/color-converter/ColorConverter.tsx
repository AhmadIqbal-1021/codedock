"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolToolbar, type ToolAction } from "@/components/shared/ToolToolbar";
import ToolError from "@/components/shared/ToolError";

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

// CodeDock's own brand indigo — a fitting default for a color tool.
const DEFAULT_HEX = "6366F1";
const DEFAULT_RGB: Rgb = { r: 99, g: 102, b: 241 };

// --------------------------------------------------------------------------
// Pure color math — no external color library.
// --------------------------------------------------------------------------

function hexToRgb(hex: string): Rgb {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHex(rgb: Rgb): string {
  const toHex = (channel: number) => channel.toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function rgbToHsl(rgb: Rgb): Hsl {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        hue = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / delta + 2;
        break;
      default:
        hue = (r - g) / delta + 4;
        break;
    }
    hue /= 6;
  }

  return {
    h: Math.round(hue * 360) % 360,
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

function formatRgb(rgb: Rgb): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function formatHsl(hsl: Hsl): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/** Relative luminance (0-255 scale approximation) used to pick readable text. */
function getContrastingTextColor(rgb: Rgb): "#000000" | "#ffffff" {
  const luminance = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
  return luminance > 140 ? "#000000" : "#ffffff";
}

/** Parses raw hex input (with or without '#') into a normalized "#RRGGBB". */
function parseHexInput(raw: string): { hex: string } | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { error: "Enter a hex color value." };
  }

  const withoutHash = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  if (!/^[0-9a-fA-F]{6}$/.test(withoutHash)) {
    return { error: "Enter a valid 6-digit hex color, e.g. 6366F1." };
  }

  return { hex: `#${withoutHash.toUpperCase()}` };
}

interface CopyableRowProps {
  label: string;
  value: string;
  fieldKey: string;
  copiedField: string | null;
  onCopy: (value: string, fieldKey: string) => void;
}

/** One labeled, copyable output row for HEX/RGB/HSL. */
function CopyableRow({ label, value, fieldKey, copiedField, onCopy }: CopyableRowProps) {
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
        aria-label={`Copy ${label} value`}
        className="h-7 w-7 shrink-0 rounded-full p-0 text-muted-foreground hover:text-foreground"
      >
        {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

interface ChannelBoxProps {
  label: string;
  value: number;
  accentClassName: string;
}

function ChannelBox({ label, value, accentClassName }: ChannelBoxProps) {
  return (
    <div className={`rounded-xl border border-l-4 bg-muted/20 px-4 py-3 text-sm ${accentClassName}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono font-medium">{value}</p>
    </div>
  );
}

export function ColorConverter() {
  const [color, setColor] = useState<Rgb>(DEFAULT_RGB);
  const [hexInput, setHexInput] = useState(DEFAULT_HEX);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const hex = useMemo(() => rgbToHex(color), [color]);
  const hsl = useMemo(() => rgbToHsl(color), [color]);
  const rgbLabel = useMemo(() => formatRgb(color), [color]);
  const hslLabel = useMemo(() => formatHsl(hsl), [hsl]);
  const textColor = useMemo(() => getContrastingTextColor(color), [color]);

  const handleHexInputChange = (raw: string) => {
    setHexInput(raw);

    const withoutHash = raw.startsWith("#") ? raw.slice(1) : raw;

    // Still typing — don't flash an error on every keystroke.
    if (withoutHash.length === 0 || withoutHash.length < 6) {
      setError(null);
      return;
    }

    const parsed = parseHexInput(raw);
    if ("error" in parsed) {
      setError(parsed.error);
      return;
    }

    setError(null);
    setColor(hexToRgb(parsed.hex));
  };

  const handleColorPickerChange = (raw: string) => {
    setError(null);
    setColor(hexToRgb(raw));
    setHexInput(raw.replace("#", ""));
  };

  const handleClear = () => {
    setColor(DEFAULT_RGB);
    setHexInput(DEFAULT_HEX);
    setError(null);
    setCopiedField(null);
  };

  const copyToClipboard = async (value: string, fieldKey: string) => {
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

  const actions: ToolAction[] = [
    { label: "Copy", icon: Copy, onClick: () => copyToClipboard(hex, "hex") },
    { label: "Clear", icon: Trash2, onClick: handleClear, variant: "outline" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <ToolToolbar actions={actions} />

      {/* Preview */}
      <div
        role="img"
        aria-label={`Color preview: ${hex}`}
        className="flex h-40 items-center justify-center rounded-2xl border border-white/10 transition-colors sm:h-48"
        style={{ backgroundColor: hex }}
      >
        <span
          className="rounded-full bg-black/10 px-4 py-1.5 font-mono text-lg font-medium backdrop-blur-sm sm:text-xl"
          style={{ color: textColor }}
        >
          {hex}
        </span>
      </div>

      {/* Input */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <label htmlFor="color-picker" className="text-sm font-medium">
            Color picker
          </label>
          <input
            id="color-picker"
            type="color"
            value={hex}
            onChange={(event) => handleColorPickerChange(event.target.value)}
            aria-label="Pick a color"
            className="h-11 w-16 cursor-pointer rounded-lg border bg-background p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <label htmlFor="hex-input" className="text-sm font-medium">
            Hex value
          </label>
          <div
            className={`flex items-center gap-1 rounded-xl border bg-background px-3 transition focus-within:ring-2 ${
              error
                ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20"
                : "focus-within:ring-ring"
            }`}
          >
            <span className="font-mono text-muted-foreground">#</span>
            <input
              id="hex-input"
              type="text"
              value={hexInput.replace("#", "")}
              onChange={(event) => handleHexInputChange(event.target.value)}
              placeholder="6366F1"
              spellCheck={false}
              maxLength={7}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "hex-input-error" : undefined}
              className="flex-1 bg-transparent py-2.5 font-mono text-sm uppercase outline-none"
            />
          </div>
        </div>
      </div>

      {error && <ToolError title="Invalid Color" message={error} />}

      {/* Converted values */}
      <div className="rounded-xl border bg-muted/20">
        <div className="divide-y divide-white/10">
          <CopyableRow
            label="HEX"
            value={hex}
            fieldKey="hex"
            copiedField={copiedField}
            onCopy={copyToClipboard}
          />
          <CopyableRow
            label="RGB"
            value={rgbLabel}
            fieldKey="rgb"
            copiedField={copiedField}
            onCopy={copyToClipboard}
          />
          <CopyableRow
            label="HSL"
            value={hslLabel}
            fieldKey="hsl"
            copiedField={copiedField}
            onCopy={copyToClipboard}
          />
        </div>
      </div>

      {/* RGB channels */}
      <div className="grid grid-cols-3 gap-3">
        <ChannelBox label="R" value={color.r} accentClassName="border-l-red-500" />
        <ChannelBox label="G" value={color.g} accentClassName="border-l-green-500" />
        <ChannelBox label="B" value={color.b} accentClassName="border-l-blue-500" />
      </div>
    </div>
  );
}

export default ColorConverter;
