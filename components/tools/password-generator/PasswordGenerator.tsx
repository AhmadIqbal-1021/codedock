"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, RefreshCw, Trash2 } from "lucide-react";

import { ToolToolbar, type ToolAction } from "@/components/shared/ToolToolbar";
import ToolError from "@/components/shared/ToolError";

// --------------------------------------------------------------------------
// Character sets
// --------------------------------------------------------------------------

type CharsetKey = "uppercase" | "lowercase" | "numbers" | "symbols";

const CHARSET_KEYS: CharsetKey[] = ["uppercase", "lowercase", "numbers", "symbols"];

const CHARACTER_SETS: Record<CharsetKey, string> = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?/~`\"'\\",
};

const CHARSET_LABELS: Record<CharsetKey, string> = {
  uppercase: "Uppercase (A–Z)",
  lowercase: "Lowercase (a–z)",
  numbers: "Numbers (0–9)",
  symbols: "Symbols (!@#$...)",
};

const SIMILAR_CHARACTERS = "O0Il1";
const AMBIGUOUS_CHARACTERS = "{}[]()/\\'\"`,;:.<>";

type CharacterOptions = Record<CharsetKey, boolean>;

interface ExclusionOptions {
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
}

const DEFAULT_OPTIONS: CharacterOptions = {
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
};

const DEFAULT_EXCLUSIONS: ExclusionOptions = {
  excludeSimilar: false,
  excludeAmbiguous: false,
};

const MIN_LENGTH = 4;
const MAX_LENGTH = 128;
const DEFAULT_LENGTH = 16;

// --------------------------------------------------------------------------
// Strength scale
// --------------------------------------------------------------------------

interface StrengthLevel {
  label: string;
  colorClass: string;
  score: number; // 0-4, used to fill the strength meter
}

const STRENGTH_LEVELS: StrengthLevel[] = [
  { label: "Very Weak", colorClass: "bg-red-500", score: 0 },
  { label: "Weak", colorClass: "bg-orange-500", score: 1 },
  { label: "Medium", colorClass: "bg-yellow-500", score: 2 },
  { label: "Strong", colorClass: "bg-lime-500", score: 3 },
  { label: "Very Strong", colorClass: "bg-emerald-500", score: 4 },
];

// --------------------------------------------------------------------------
// Pure helper functions (no React, easy to unit test in isolation)
// --------------------------------------------------------------------------

/** Removes similar/ambiguous characters from a charset based on user options. */
function applyExclusions(charset: string, exclusions: ExclusionOptions): string {
  let result = charset;

  if (exclusions.excludeSimilar) {
    result = result
      .split("")
      .filter((char) => !SIMILAR_CHARACTERS.includes(char))
      .join("");
  }

  if (exclusions.excludeAmbiguous) {
    result = result
      .split("")
      .filter((char) => !AMBIGUOUS_CHARACTERS.includes(char))
      .join("");
  }

  return result;
}

/**
 * Cryptographically secure random integer in [0, maxExclusive), using
 * rejection sampling so the result is uniformly distributed (no modulo
 * bias). Uses crypto.getRandomValues — never Math.random().
 */
function getSecureRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;

  const maxUint32 = 0xffffffff;
  const rejectionLimit = maxUint32 - (maxUint32 % maxExclusive);
  const randomBuffer = new Uint32Array(1);

  let value: number;
  do {
    crypto.getRandomValues(randomBuffer);
    value = randomBuffer[0];
  } while (value >= rejectionLimit);

  return value % maxExclusive;
}

/** Fisher-Yates shuffle using the secure random source. Does not mutate input. */
function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/** Approximate Shannon entropy in bits for a random string of the given pool size/length. */
function calculateEntropy(poolSize: number, length: number): number {
  if (poolSize <= 1 || length <= 0) return 0;
  return length * Math.log2(poolSize);
}

function calculateStrength(entropyBits: number): StrengthLevel {
  if (entropyBits < 28) return STRENGTH_LEVELS[0];
  if (entropyBits < 36) return STRENGTH_LEVELS[1];
  if (entropyBits < 60) return STRENGTH_LEVELS[2];
  if (entropyBits < 128) return STRENGTH_LEVELS[3];
  return STRENGTH_LEVELS[4];
}

/**
 * Builds the list of usable character pools (one per enabled, non-empty
 * category) after exclusions are applied.
 */
function getActivePools(options: CharacterOptions, exclusions: ExclusionOptions): string[] {
  return CHARSET_KEYS.filter((key) => options[key])
    .map((key) => applyExclusions(CHARACTER_SETS[key], exclusions))
    .filter((pool) => pool.length > 0);
}

/**
 * Generates a password that always contains at least one character from
 * every enabled, non-empty category, then fills the remaining length from
 * the combined pool and shuffles the result — never a naive single draw
 * from the combined pool, which could omit an enabled category entirely.
 */
function generatePassword(
  length: number,
  options: CharacterOptions,
  exclusions: ExclusionOptions
): { password: string; poolSize: number } | { error: string } {
  const pools = getActivePools(options, exclusions);

  if (pools.length === 0) {
    return { error: "Select at least one character type to generate a password." };
  }

  const combinedPool = pools.join("");

  const requiredChars = pools.map((pool) => pool[getSecureRandomInt(pool.length)]);

  const remainingLength = Math.max(length - requiredChars.length, 0);
  const fillerChars = Array.from(
    { length: remainingLength },
    () => combinedPool[getSecureRandomInt(combinedPool.length)]
  );

  const passwordChars = shuffleArray([...requiredChars, ...fillerChars]).slice(0, length);

  return { password: passwordChars.join(""), poolSize: combinedPool.length };
}

// --------------------------------------------------------------------------
// Component
// --------------------------------------------------------------------------

export function PasswordGenerator() {
  const [length, setLength] = useState(DEFAULT_LENGTH);
  const [options, setOptions] = useState<CharacterOptions>(DEFAULT_OPTIONS);
  const [exclusions, setExclusions] = useState<ExclusionOptions>(DEFAULT_EXCLUSIONS);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(() => {
    const result = generatePassword(length, options, exclusions);

    if ("error" in result) {
      setError(result.error);
      setPassword("");
      setCopied(false);
      return;
    }

    setError(null);
    setPassword(result.password);
    setCopied(false);
  }, [length, options, exclusions]);

  // Generate automatically whenever length or character options change.
  useEffect(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleClear = () => {
    setPassword("");
    setError(null);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!password) return;

    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable.
    }
  };

  const toggleCharacterOption = (key: CharsetKey) => {
    setOptions((current) => {
      const next = { ...current, [key]: !current[key] };

      // Prevent disabling the last remaining category — a password
      // needs at least one character type to be generated from.
      const stillHasOne = CHARSET_KEYS.some((k) => next[k]);
      return stillHasOne ? next : current;
    });
  };

  const toggleExclusion = (key: keyof ExclusionOptions) => {
    setExclusions((current) => ({ ...current, [key]: !current[key] }));
  };

  const poolSize = useMemo(
    () => getActivePools(options, exclusions).join("").length,
    [options, exclusions]
  );

  const entropyBits = useMemo(() => calculateEntropy(poolSize, length), [poolSize, length]);

  const strength = useMemo(() => calculateStrength(entropyBits), [entropyBits]);

  const actions: ToolAction[] = [
    {
      label: "Generate",
      icon: RefreshCw,
      onClick: handleGenerate,
    },
    {
      label: copied ? "Copied" : "Copy",
      icon: copied ? Check : Copy,
      onClick: handleCopy,
      disabled: !password,
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

      {error && <ToolError title="Configuration Error" message={error} />}

      {/* Output */}
      <div className="space-y-2">
        <label htmlFor="generated-password" className="text-sm font-medium">
          Generated password
        </label>

        <textarea
          id="generated-password"
          value={password}
          readOnly
          spellCheck={false}
          placeholder="Enable at least one character type below to generate a password."
          aria-label="Generated password"
          className="min-h-24 w-full resize-none rounded-xl border bg-muted/20 p-4 font-mono text-lg tracking-wide outline-none transition focus:ring-2 focus:ring-ring"
        />

        {/* Strength indicator */}
        <div aria-live="polite" className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              Strength: <span>{strength.label}</span>
            </span>
            <span className="text-muted-foreground">
              {length} characters &middot; ~{entropyBits.toFixed(1)} bits of entropy
            </span>
          </div>

          <div
            role="meter"
            aria-label="Password strength"
            aria-valuemin={0}
            aria-valuemax={4}
            aria-valuenow={strength.score}
            aria-valuetext={strength.label}
            className="flex gap-1.5"
          >
            {STRENGTH_LEVELS.map((level) => (
              <span
                key={level.label}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                  level.score <= strength.score ? strength.colorClass : "bg-foreground/10"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1 text-xs text-muted-foreground">
          <span>
            Length: <span className="font-medium text-foreground">{length}</span>
          </span>
          <span>
            Character set size: <span className="font-medium text-foreground">{poolSize}</span>
          </span>
          <span>
            Entropy:{" "}
            <span className="font-medium text-foreground">{entropyBits.toFixed(1)} bits</span>
          </span>
        </div>
      </div>

      {/* Length slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password-length" className="text-sm font-medium">
            Password length
          </label>
          <span className="text-sm font-medium text-foreground">{length}</span>
        </div>

        <input
          id="password-length"
          type="range"
          min={MIN_LENGTH}
          max={MAX_LENGTH}
          step={1}
          value={length}
          onChange={(event) => setLength(Number(event.target.value))}
          aria-label="Password length"
          aria-valuemin={MIN_LENGTH}
          aria-valuemax={MAX_LENGTH}
          aria-valuenow={length}
          className="w-full accent-indigo-500"
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{MIN_LENGTH}</span>
          <span>{MAX_LENGTH}</span>
        </div>
      </div>

      {/* Character options */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Character types</legend>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CHARSET_KEYS.map((key) => (
            <label
              key={key}
              className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-foreground/[0.03] px-4 py-3 text-sm transition-colors hover:bg-foreground/[0.05]"
            >
              <input
                type="checkbox"
                checked={options[key]}
                onChange={() => toggleCharacterOption(key)}
                className="h-4 w-4 accent-indigo-500"
              />
              {CHARSET_LABELS[key]}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Exclusion options */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Exclusions</legend>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 rounded-xl border border-white/10 bg-foreground/[0.03] px-4 py-3 text-sm transition-colors hover:bg-foreground/[0.05]">
            <span className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={exclusions.excludeSimilar}
                onChange={() => toggleExclusion("excludeSimilar")}
                className="h-4 w-4 accent-indigo-500"
              />
              Exclude similar characters
            </span>
            <span className="pl-6 font-mono text-xs text-muted-foreground">
              {SIMILAR_CHARACTERS.split("").join(" ")}
            </span>
          </label>

          <label className="flex flex-col gap-1 rounded-xl border border-white/10 bg-foreground/[0.03] px-4 py-3 text-sm transition-colors hover:bg-foreground/[0.05]">
            <span className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={exclusions.excludeAmbiguous}
                onChange={() => toggleExclusion("excludeAmbiguous")}
                className="h-4 w-4 accent-indigo-500"
              />
              Exclude ambiguous characters
            </span>
            <span className="pl-6 font-mono text-xs text-muted-foreground">
              {AMBIGUOUS_CHARACTERS.split("").join(" ")}
            </span>
          </label>
        </div>
      </fieldset>

      <div className="rounded-xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <p>
          <strong>Tip:</strong> Generation uses <code>crypto.getRandomValues()</code>,
          the browser&apos;s cryptographically secure random source, and always
          includes at least one character from every enabled type before
          shuffling — never a plain random draw from the combined set.
        </p>
      </div>
    </div>
  );
}

export default PasswordGenerator;
