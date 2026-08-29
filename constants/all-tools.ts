import {
  FileJson,
  KeyRound,
  Regex,
  Binary,
  Link2,
  Lock,
  Fingerprint,
  Hash,
  Clock,
  FileText,
  Palette,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIES } from "./categories";

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
    status: "live",
     featured: true,
    keywords: ["jwt", "decoder", "token", "auth", "json web token"],
  },
  {
    slug: " ",
    name: "Regex Tester",
    shortDescription: "Build and debug regular expressions in real time.",
    description:
      "Test regular expressions against sample text with live match highlighting and group capture.",
    category: "developer-tools",
    icon: Regex,
    status: "live",
     featured: true,
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
    status: "live",
    featured: true,
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
    status: "live",
     featured: true,    

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
    status: "live",
     featured: true,
    keywords: ["password", "generator", "security", "random"],
  },
  {
  slug: "uuid-generator",
  name: "UUID Generator",
  shortDescription: "Generate random UUIDs instantly.",
  description:
    "Generate secure Version 4 UUIDs instantly for databases, APIs, testing, and application development. Everything is generated client-side.",
  category: "developer-tools",
  icon: Fingerprint,
  status: "live",
  featured: true,
  keywords: ["uuid", "uuid generator", "guid", "v4", "random id", "identifier"],
},
{
  slug: "hash-generator",
  name: "Hash Generator",
  shortDescription: "Generate cryptographic hashes instantly.",
  description:
    "Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes for any text or input. All hashing is performed securely in your browser.",
  category: "developer-tools",
  icon: Hash,
  status: "live",
  featured: true,
  keywords: [
    "hash",
    "hash generator",
    "md5",
    "sha1",
    "sha256",
    "sha384",
    "sha512",
    "checksum",
    "cryptography"
  ],
},
{
  slug: "unix-timestamp-converter",
  name: "Unix Timestamp Converter",
  shortDescription: "Convert Unix timestamps to readable dates instantly.",
  description:
    "Convert Unix timestamps into human-readable date and time formats, or generate Unix timestamps from any date. Supports seconds and milliseconds, with all conversions performed securely in your browser.",
  category: "developer-tools",
  icon: Clock,
  status: "live",
  featured: true,
  keywords: [
    "unix timestamp",
    "timestamp converter",
    "epoch converter",
    "epoch time",
    "unix time",
    "date converter",
    "timestamp",
    "seconds",
    "milliseconds",
    "datetime"
  ],
},
{
  slug: "color-converter",
  name: "Color Converter",
  shortDescription: "Convert colors between popular formats instantly.",
  description:
    "Convert colors between HEX, RGB, HSL, HSV, and CMYK formats with real-time previews. Perfect for designers and developers, with all conversions performed securely in your browser.",
  category: "developer-tools",
  icon: Palette,
  status: "live",
  featured: true,
  keywords: [
    "color converter",
    "hex",
    "rgb",
    "hsl",
    "hsv",
    "cmyk",
    "color picker",
    "color tool",
    "css colors",
    "web colors"
  ],
},
{
  slug: "lorem-ipsum-generator",
  name: "Lorem Ipsum Generator",
  shortDescription: "Generate placeholder text for designs and content.",
  description:
    "Generate customizable Lorem Ipsum placeholder text with paragraphs, sentences, or words. Ideal for mockups, prototypes, websites, and design projects, all generated instantly in your browser.",
  category: "developer-tools",
  icon: FileText,
  status: "live",
  featured: true,
  keywords: [
    "lorem ipsum",
    "placeholder text",
    "dummy text",
    "text generator",
    "latin text",
    "mockup content",
    "website placeholder",
    "design tool",
    "content generator"
  ],
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
export function getRelatedTools(currentSlug: string) {
  const currentTool = getToolBySlug(currentSlug);

  if (!currentTool) return [];

  return ALL_TOOLS.filter(
    (tool) =>
      tool.slug !== currentSlug &&
      tool.category === currentTool.category
  ).slice(0, 3);
}


export function getCategoriesWithCounts() {
  return CATEGORIES.map((category) => ({
    ...category,
    toolCount: ALL_TOOLS.filter(
      (tool) => tool.category === category.slug && tool.status === "live"
    ).length,
  }));
}

export function searchTools(query: string): ToolInfo[] {
  const search = query.toLowerCase();

  return ALL_TOOLS.filter((tool) => {
    return (
      tool.name.toLowerCase().includes(search) ||
      tool.description.toLowerCase().includes(search) ||
      tool.keywords?.some((k) => k.toLowerCase().includes(search))
    );
  });
}