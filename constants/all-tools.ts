import {
  FileJson,
  KeyRound,
  Regex,
  Binary,
  Link2,
  Lock,
  type LucideIcon,
} from "lucide-react";

/**
 * Matches the slugs defined in constants/categories.ts. Kept as a
 * local literal union (rather than importing CATEGORIES) so this
 * registry has zero UI/runtime coupling — just update both files
 * together if a category slug ever changes.
 */
export type ToolCategorySlug =
  | "developer-tools"
  | "ai-tools"
  | "resume-tools"
  | "api-data"
  | "design-tools"
  | "productivity";

/** Build-time status. Drives whether a tool page/route should exist yet. */
export type ToolStatus = "live" | "coming-soon";

export interface ToolFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface ToolFAQItem {
  question: string;
  answer: string;
}

export interface ToolSEO {
  title: string;
  description: string;
}

/**
 * The single source of truth for every tool on CodeDock — shipped or
 * planned. Every field UI components need (cards, headers, SEO,
 * features grids, FAQs) lives here so nothing is hardcoded per page.
 */
export interface ToolInfo {
  /** Unique, URL-safe identifier. Route is always `/tools/{slug}`. */
  slug: string;
  /** Display name, e.g. "JSON Formatter". */
  name: string;
  /** One-line description for cards/grids (ToolCard, RelatedTools). */
  shortDescription: string;
  /** Longer description for the tool's own header (ToolHeader). */
  description: string;
  category: ToolCategorySlug;
  icon: LucideIcon;
  status: ToolStatus;
  /** Shown on the homepage's Featured Tools grid. */
  featured?: boolean;
  seo?: ToolSEO;
  /** Populated for ToolFeatures once the tool is built; optional for planned tools. */
  features?: ToolFeature[];
  /** Populated for ToolFAQ once the tool is built; optional for planned tools. */
  faqs?: ToolFAQItem[];
  /** Free-text search/SEO keywords. */
  keywords?: string[];
  related?: string[];
}

export const ALL_TOOLS: ToolInfo[] = [
  {
    slug: "json-formatter",
    name: "JSON Formatter",
    shortDescription: "Format, validate, and minify JSON with one click.",
    description:
      "Paste JSON, format it with clean indentation, and catch syntax errors instantly. Everything runs in your browser.",
    category: "developer-tools",
    icon: FileJson,
    status: "live",
    featured: true,
    seo: {
      title: "JSON Formatter - Format JSON Online",
      description:
        "Free online JSON formatter and validator. Beautify, validate and format JSON instantly.",
    },
    faqs: [
      {
        question: "Is my JSON data uploaded anywhere?",
        answer:
          "No. Formatting and validation both run entirely in your browser using JSON.parse and JSON.stringify — nothing is sent to a server.",
      },
      {
        question: "What happens if my JSON is invalid?",
        answer:
          "The formatter shows the exact parsing error (e.g. an unexpected token or missing comma) so you can find and fix the issue quickly.",
      },
      {
        question: "Can I choose the indentation size?",
        answer: "Yes — use the 2 spaces / 4 spaces toggle above the editors before formatting.",
      },
    ],
    keywords: ["json", "formatter", "validator", "beautify", "minify"],
  },
  {
    slug: "jwt-decoder",
    name: "JWT Decoder",
    shortDescription: "Decode JWT headers and payloads instantly.",
    description:
      "Paste a JSON Web Token to inspect its header and payload. Decoding happens entirely client-side.",
    category: "developer-tools",
    icon: KeyRound,
    status: "coming-soon",
    keywords: ["jwt", "decoder", "token", "auth", "json web token"],
  },
  {
    slug: "regex-tester",
    name: "Regex Tester",
    shortDescription: "Build and debug regular expressions in real time.",
    description:
      "Test regular expressions against sample text with live match highlighting and group capture.",
    category: "developer-tools",
    icon: Regex,
    status: "coming-soon",
    keywords: ["regex", "regular expression", "pattern", "tester"],
  },
  {
    slug: "base64-encoder-decoder",
    name: "Base64 Encoder/Decoder",
    shortDescription: "Encode or decode Base64 strings instantly.",
    description:
      "Convert plain text to Base64 or decode Base64 back to readable text, entirely in your browser.",
    category: "developer-tools",
    icon: Binary,
    status: "coming-soon",
    keywords: ["base64", "encode", "decode", "converter"],
  },
  {
    slug: "url-encoder-decoder",
    name: "URL Encoder/Decoder",
    shortDescription: "Encode or decode URL components safely.",
    description:
      "Percent-encode or decode URLs and query parameters without leaving your browser.",
    category: "developer-tools",
    icon: Link2,
    status: "coming-soon",
    keywords: ["url", "encode", "decode", "uri", "percent encoding"],
  },
  {
    slug: "password-generator",
    name: "Password Generator",
    shortDescription: "Generate strong, random passwords instantly.",
    description:
      "Create secure passwords with customizable length and character sets, generated locally on your device.",
    category: "productivity",
    icon: Lock,
    status: "coming-soon",
    keywords: ["password", "generator", "security", "random"],
  },
];

/** Lookup a single tool by its slug. Returns undefined if not found. */
export function getToolBySlug(slug: string): ToolInfo | undefined {
  return ALL_TOOLS.find((tool) => tool.slug === slug);
}

/** Tools flagged for the homepage's Featured Tools grid. */
export function getFeaturedTools(): ToolInfo[] {
  return ALL_TOOLS.filter((tool) => tool.featured);
}

/** All tools in a given category, optionally excluding the current one. */
export function getToolsByCategory(
  category: ToolCategorySlug,
  excludeSlug?: string
): ToolInfo[] {
  return ALL_TOOLS.filter(
    (tool) => tool.category === category && tool.slug !== excludeSlug
  );
}

/** Tools that have a real page shipped, i.e. safe to route to. */
export function getLiveTools(): ToolInfo[] {
  return ALL_TOOLS.filter((tool) => tool.status === "live");
}

/** Simple related-tools helper: same category first, capped to `limit`. */
export function getRelatedTools(tool: ToolInfo, limit = 3): ToolInfo[] {
  return getToolsByCategory(tool.category, tool.slug).slice(0, limit);
}