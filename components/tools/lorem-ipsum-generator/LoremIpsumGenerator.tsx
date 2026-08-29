"use client";

import { useCallback, useState } from "react";
import { Check, Copy, Download, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolToolbar, type ToolAction } from "@/components/shared/ToolToolbar";
import ToolError from "@/components/shared/ToolError";
import TextStats from "@/components/shared/TextStats";

type Mode = "paragraphs" | "sentences" | "words";

const DOWNLOAD_FILENAME = "lorem-ipsum.txt";

const OPENING_SENTENCE = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
const OPENING_WORDS = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit"];

// Local, dependency-free source vocabulary — no external Lorem Ipsum package.
const WORD_BANK = [
  "a", "ac", "accumsan", "adipiscing", "aenean", "aliquam", "aliquet", "amet",
  "ante", "arcu", "at", "auctor", "augue", "bibendum", "blandit", "class",
  "commodo", "condimentum", "congue", "consectetur", "consequat", "convallis",
  "cras", "cubilia", "curabitur", "curae", "cursus", "dapibus", "diam",
  "dictum", "dictumst", "dignissim", "dolor", "donec", "dui", "duis", "egestas",
  "eget", "eleifend", "elementum", "elit", "enim", "erat", "eros", "est",
  "et", "etiam", "eu", "euismod", "ex", "facilisis", "fames", "faucibus",
  "felis", "fermentum", "feugiat", "finibus", "fringilla", "fusce", "gravida",
  "habitant", "hac", "hendrerit", "iaculis", "id", "imperdiet", "in",
  "integer", "interdum", "ipsum", "justo", "lacinia", "lacus", "laoreet",
  "lectus", "leo", "libero", "ligula", "lobortis", "lorem", "luctus",
  "maecenas", "magna", "malesuada", "massa", "mattis", "mauris", "metus",
  "mi", "molestie", "mollis", "montes", "morbi", "mus", "nam", "nec",
  "neque", "nibh", "nisi", "nisl", "non", "nulla", "nunc", "odio",
  "orci", "ornare", "pellentesque", "pharetra", "phasellus", "placerat",
  "platea", "porta", "porttitor", "posuere", "praesent", "pretium",
  "proin", "pulvinar", "purus", "quam", "quis", "quisque", "rhoncus",
  "risus", "rutrum", "sagittis", "sapien", "scelerisque", "sed", "sem",
  "semper", "senectus", "sit", "sodales", "sollicitudin", "suscipit",
  "suspendisse", "tellus", "tempor", "tempus", "tincidunt", "tortor",
  "tristique", "turpis", "ullamcorper", "ultrices", "ultricies", "urna",
  "ut", "varius", "vehicula", "vel", "velit", "venenatis", "vestibulum",
  "vitae", "vivamus", "viverra", "volutpat", "vulputate",
] as const;

interface ModeConfig {
  min: number;
  max: number;
  defaultQuantity: number;
  label: string;
  unitLabel: string;
}

const MODE_CONFIG: Record<Mode, ModeConfig> = {
  words: { min: 1, max: 500, defaultQuantity: 50, label: "Words", unitLabel: "words" },
  sentences: { min: 1, max: 100, defaultQuantity: 5, label: "Sentences", unitLabel: "sentences" },
  paragraphs: { min: 1, max: 20, defaultQuantity: 3, label: "Paragraphs", unitLabel: "paragraphs" },
};

const DEFAULT_MODE: Mode = "paragraphs";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandomWord(): string {
  return WORD_BANK[randomInt(0, WORD_BANK.length - 1)];
}

function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildSentence(wordCount: number): string {
  const words = Array.from({ length: wordCount }, () => pickRandomWord());
  return `${capitalizeFirst(words.join(" "))}.`;
}

function generateWordsText(quantity: number, startWithLorem: boolean): string {
  const words: string[] = startWithLorem ? OPENING_WORDS.slice(0, quantity) : [];

  while (words.length < quantity) {
    words.push(pickRandomWord());
  }

  return words.slice(0, quantity).join(" ");
}

function generateSentencesText(quantity: number, startWithLorem: boolean): string {
  const sentences: string[] = startWithLorem ? [OPENING_SENTENCE] : [];

  while (sentences.length < quantity) {
    sentences.push(buildSentence(randomInt(6, 14)));
  }

  return sentences.slice(0, quantity).join(" ");
}

function buildParagraph(sentenceCount: number, forceOpening: boolean): string {
  const sentences: string[] = forceOpening ? [OPENING_SENTENCE] : [];

  while (sentences.length < sentenceCount) {
    sentences.push(buildSentence(randomInt(6, 14)));
  }

  return sentences.slice(0, sentenceCount).join(" ");
}

function generateParagraphsText(quantity: number, startWithLorem: boolean): string {
  const paragraphs: string[] = [];

  for (let i = 0; i < quantity; i++) {
    paragraphs.push(buildParagraph(randomInt(4, 8), i === 0 && startWithLorem));
  }

  return paragraphs.join("\n\n");
}

/** Generates the requested amount of Lorem Ipsum text for the given mode. */
function generateLoremIpsum(mode: Mode, quantity: number, startWithLorem: boolean): string {
  switch (mode) {
    case "words":
      return generateWordsText(quantity, startWithLorem);
    case "sentences":
      return generateSentencesText(quantity, startWithLorem);
    case "paragraphs":
      return generateParagraphsText(quantity, startWithLorem);
  }
}

export function LoremIpsumGenerator() {
  const [mode, setMode] = useState<Mode>(DEFAULT_MODE);
  const [quantityInput, setQuantityInput] = useState(
    MODE_CONFIG[DEFAULT_MODE].defaultQuantity.toString()
  );
  const [startWithLorem, setStartWithLorem] = useState(true);

  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const config = MODE_CONFIG[mode];

  const handleGenerate = useCallback(() => {
    setCopied(false);

    const trimmed = quantityInput.trim();
    if (!trimmed) {
      setError(`Enter a quantity between ${config.min} and ${config.max}.`);
      setOutput("");
      return;
    }

    const quantity = Number(trimmed);
    if (!Number.isInteger(quantity) || quantity < config.min || quantity > config.max) {
      setError(`Enter a whole number between ${config.min} and ${config.max}.`);
      setOutput("");
      return;
    }

    setError(null);
    setOutput(generateLoremIpsum(mode, quantity, startWithLorem));
  }, [mode, quantityInput, startWithLorem, config]);

  const handleClear = () => {
    setOutput("");
    setError(null);
    setCopied(false);
  };

  const handleModeChange = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setQuantityInput(MODE_CONFIG[next].defaultQuantity.toString());
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
      // Clipboard unavailable.
    }
  };

  const handleDownload = () => {
    if (!output) return;

    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = DOWNLOAD_FILENAME;
    link.click();

    URL.revokeObjectURL(url);
  };

  const byteLength = new TextEncoder().encode(output).length;

  const actions: ToolAction[] = [
    { label: "Generate", icon: Wand2, onClick: handleGenerate },
    { label: "Copy", icon: Copy, onClick: handleCopy, disabled: !output, variant: "outline" },
    {
      label: "Download",
      icon: Download,
      onClick: handleDownload,
      disabled: !output,
      variant: "outline",
    },
    {
      label: "Clear",
      icon: Trash2,
      onClick: handleClear,
      disabled: !output,
      variant: "outline",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <ToolToolbar actions={actions}>
        <div
          role="group"
          aria-label="Generation mode"
          className="flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-foreground/[0.03] p-1"
        >
          {(Object.keys(MODE_CONFIG) as Mode[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleModeChange(option)}
              aria-pressed={mode === option}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                mode === option
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {MODE_CONFIG[option].label}
            </button>
          ))}
        </div>
      </ToolToolbar>

      {/* Settings */}
      <div className="flex flex-wrap items-end gap-6">
        <div className="space-y-2">
          <label htmlFor="lorem-quantity" className="text-sm font-medium">
            Number of {config.unitLabel}
          </label>
          <input
            id="lorem-quantity"
            type="number"
            inputMode="numeric"
            min={config.min}
            max={config.max}
            value={quantityInput}
            onChange={(event) => {
              setQuantityInput(event.target.value);
              setError(null);
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "lorem-quantity-error" : undefined}
            className={`w-32 rounded-xl border bg-background px-3 py-2.5 font-mono text-sm outline-none transition focus:ring-2 ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "focus:ring-ring"
            }`}
          />
          <p className="text-xs text-muted-foreground">
            {config.min}–{config.max}
          </p>
        </div>

        <label
          htmlFor="lorem-start-with"
          className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 pb-3.5 text-sm transition-colors hover:bg-foreground/5 has-[:focus-visible]:border-ring"
        >
          <input
            id="lorem-start-with"
            type="checkbox"
            checked={startWithLorem}
            onChange={(event) => setStartWithLorem(event.target.checked)}
            className="h-4 w-4 shrink-0 rounded border-white/20 accent-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span>Start with &ldquo;Lorem ipsum...&rdquo;</span>
        </label>
      </div>

      {error && <ToolError title="Invalid Quantity" message={error} />}

      {/* Output */}
      <div className="space-y-2">
        <div className="flex h-8 items-center justify-between">
          <label htmlFor="lorem-output" className="text-sm font-medium">
            Generated text
          </label>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!output}
            aria-label="Copy generated text"
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
          id="lorem-output"
          value={output}
          readOnly
          spellCheck={false}
          placeholder="No Lorem Ipsum generated yet."
          aria-live="polite"
          className="min-h-72 w-full resize-y rounded-xl border bg-muted/20 p-4 font-mono text-sm leading-relaxed outline-none"
        />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextStats text={output} />

        {/* Bytes isn't part of TextStats, so it's added alongside as a
            small custom stat, computed via UTF-8 byte length. */}
        <div className="rounded-xl border bg-muted/20 px-4 py-3 text-sm">
          <p className="text-xs text-muted-foreground">Bytes</p>
          <p className="mt-1 font-mono font-medium">{byteLength}</p>
        </div>
      </div>
    </div>
  );
}

export default LoremIpsumGenerator;
