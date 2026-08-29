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
  ShieldCheck,
  ArrowLeftRight,
  ArrowRightLeft,
  Eye,
  Zap,
  CheckCircle,
  Copy,
  RefreshCw,
  Download,
  FileCode2,
  Braces,
  Paintbrush,
  Calculator,
  KeySquare,
  NotebookText,
  Code2,
  FileCode,
  Database,
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
    features: [
      {
        icon: CheckCircle,
        title: "Instant validation",
        description:
          "Catch syntax errors the moment you format, with the exact error message from the parser.",
      },
      {
        icon: Lock,
        title: "100% client-side",
        description:
          "Your JSON never leaves the browser — formatting and validation both run locally.",
      },
      {
        icon: Download,
        title: "Upload & download",
        description:
          "Format a .json file directly, or save the formatted output back to disk.",
      },
    ],
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
    seo: {
      title: "JWT Decoder - Decode JSON Web Tokens Online",
      description:
        "Free online JWT decoder. Paste a JSON Web Token to instantly view its header and payload — decoding happens entirely in your browser.",
    },
    features: [
      {
        icon: KeyRound,
        title: "Header & payload split",
        description:
          "See the algorithm/type header and the claims payload as separate, copyable JSON blocks.",
      },
      {
        icon: ShieldCheck,
        title: "No false sense of security",
        description:
          "Decoding never claims to verify a signature — you always know exactly what you're looking at.",
      },
      {
        icon: Lock,
        title: "100% client-side",
        description:
          "Your token is decoded locally; nothing is sent to a server, ever.",
      },
    ],
    faqs: [
      {
        question: "Does decoding a JWT verify its signature?",
        answer:
          "No. Decoding only reads the header and payload — it does not check whether the signature is valid. Never trust a decoded token's claims without verifying it server-side with the correct secret or public key.",
      },
      {
        question: "Is it safe to paste a real, live JWT here?",
        answer:
          "Decoding runs entirely in your browser using native APIs — the token is never sent to a server. That said, treat any token as sensitive and avoid pasting one from a production system into any tool you don't control.",
      },
      {
        question: "Why does decoding fail?",
        answer:
          "A JWT must have exactly three dot-separated, Base64URL-encoded parts (header, payload, signature). If any part isn't valid Base64URL or doesn't decode to JSON, decoding fails.",
      },
    ],
    keywords: [
      "jwt",
      "decoder",
      "token",
      "auth",
      "json web token",
      "jwt viewer",
      "decode jwt online",
    ],
  },
  {
    slug: "regex-tester",
    name: "Regex Tester",
    shortDescription: "Build and debug regular expressions in real time.",
    description:
      "Test regular expressions against sample text with live match highlighting and group capture.",
    category: "developer-tools",
    icon: Regex,
    status: "live",
    featured: true,
    seo: {
      title: "Regex Tester - Test Regular Expressions Online",
      description:
        "Free online regex tester with live match highlighting, capture groups, and flag support. Build and debug regular expressions instantly in your browser.",
    },
    features: [
      {
        icon: Eye,
        title: "Live match highlighting",
        description:
          "See every match highlighted directly inside your test string, not just listed separately.",
      },
      {
        icon: Regex,
        title: "Capture groups shown per match",
        description:
          "Each match lists its index and any captured groups, so you can debug patterns quickly.",
      },
      {
        icon: Zap,
        title: "All standard flags",
        description:
          "Toggle g (global), i (ignore case), m (multiline), and s (dot-all) to match how your code actually runs.",
      },
    ],
    faqs: [
      {
        question: "Which regex flags are supported?",
        answer:
          "g (global — find every match), i (ignore case), m (multiline — ^/$ match line boundaries), and s (dot-all — . matches newlines too).",
      },
      {
        question: "Why do I only see one match?",
        answer:
          "Without the g (global) flag, JavaScript's regex engine stops after the first match. Enable g to find every occurrence.",
      },
      {
        question: "Is there a limit on matches?",
        answer:
          "Yes — matching stops at 500 results to protect the tab from a runaway or catastrophically backtracking pattern. Everyday patterns won't come close to that limit.",
      },
    ],
    keywords: [
      "regex",
      "regular expression",
      "pattern",
      "tester",
      "regex online",
      "javascript regex tester",
    ],
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
    seo: {
      title: "Base64 Encoder & Decoder - Encode/Decode Base64 Online",
      description:
        "Free online Base64 encoder and decoder. Convert text to Base64 or decode Base64 back to plain text, entirely in your browser.",
    },
    features: [
      {
        icon: Binary,
        title: "Encode or decode instantly",
        description:
          "One toggle switches between encoding plain text and decoding Base64 back to text.",
      },
      {
        icon: ArrowLeftRight,
        title: "Swap direction with one click",
        description:
          "Turn your output back into a new input to chain conversions without retyping anything.",
      },
      {
        icon: Lock,
        title: "100% client-side",
        description:
          "Encoding and decoding both run locally — your text is never sent to a server.",
      },
    ],
    faqs: [
      {
        question: "What is Base64 encoding used for?",
        answer:
          "Base64 converts binary or text data into an ASCII string, commonly used to embed data in URLs, JSON, email attachments, or HTTP headers where raw binary isn't safe to transmit.",
      },
      {
        question: "Why does decoding fail on my input?",
        answer:
          "The decoder expects valid Base64 — if the input contains characters outside the Base64 alphabet or has incorrect padding, decoding will fail with an error.",
      },
      {
        question: "Is Unicode text supported?",
        answer:
          "Yes. Encoding correctly handles multi-byte UTF-8 text (emoji, accented characters, non-Latin scripts), not just ASCII.",
      },
    ],
    keywords: [
      "base64",
      "encode",
      "decode",
      "converter",
      "base64 online",
      "text to base64",
    ],
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
    seo: {
      title: "URL Encoder & Decoder - Percent-Encode URLs Online",
      description:
        "Free online URL encoder and decoder. Percent-encode or decode URLs and query parameters instantly, entirely in your browser.",
    },
    features: [
      {
        icon: Link2,
        title: "Handles special characters",
        description:
          "Safely percent-encode spaces, symbols, and reserved characters for use in a URL or query string.",
      },
      {
        icon: ArrowLeftRight,
        title: "Swap direction with one click",
        description:
          "Turn your output back into a new input to chain conversions without retyping anything.",
      },
      {
        icon: Lock,
        title: "100% client-side",
        description:
          "Encoding and decoding both run locally, using the browser's native URI functions.",
      },
    ],
    faqs: [
      {
        question: "What does URL encoding actually do?",
        answer:
          "It converts characters that aren't safe in a URL (spaces, &, ?, #, and others) into a percent-encoded form like %20, so the string can be transmitted correctly as part of a URL or query string.",
      },
      {
        question: "What's the difference between encodeURIComponent and encodeURI?",
        answer:
          "This tool uses encodeURIComponent, which encodes every reserved character — the right choice for individual query parameter values. encodeURI (used for whole URLs) leaves characters like / and : untouched.",
      },
      {
        question: "Why did decoding fail?",
        answer:
          "Decoding fails if the input contains a % that isn't followed by two valid hex digits — that's not valid percent-encoding.",
      },
    ],
    keywords: [
      "url",
      "encode",
      "decode",
      "uri",
      "percent encoding",
      "uri encoder",
      "query string encoder",
    ],
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
    seo: {
      title: "Password Generator - Create Strong, Secure Passwords",
      description:
        "Free online password generator using your browser's cryptographically secure random number generator. Customize length and character types — nothing is sent to a server.",
    },
    features: [
      {
        icon: ShieldCheck,
        title: "Cryptographically secure",
        description:
          "Every character is chosen with crypto.getRandomValues(), never Math.random().",
      },
      {
        icon: CheckCircle,
        title: "Guaranteed character coverage",
        description:
          "Always includes at least one character from every enabled type — never a lucky draw that misses a category.",
      },
      {
        icon: Zap,
        title: "Entropy & strength meter",
        description:
          "See exactly how strong a password is, in bits of entropy, not just a vague label.",
      },
    ],
    faqs: [
      {
        question: "How random are these passwords?",
        answer:
          "Every character is chosen using crypto.getRandomValues(), the browser's cryptographically secure random source — not Math.random(), which is not safe for anything security-related.",
      },
      {
        question: "What does the entropy number mean?",
        answer:
          "Entropy (in bits) measures how hard the password is to guess by brute force. Roughly: under 28 bits is very weak, 60+ bits is strong, and 128 bits is effectively unbreakable with current technology.",
      },
      {
        question: "Are the generated passwords stored or sent anywhere?",
        answer:
          "No. Generation happens entirely in your browser; nothing is transmitted or logged.",
      },
    ],
    keywords: [
      "password",
      "generator",
      "security",
      "random",
      "strong password generator",
      "secure password",
    ],
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
  seo: {
    title: "UUID Generator - Generate Random UUIDs (v4) Online",
    description:
      "Free online UUID v4 generator. Generate one or up to 100 RFC 4122-compliant UUIDs instantly, using your browser's native crypto API.",
  },
  features: [
    {
      icon: Fingerprint,
      title: "Native crypto.randomUUID()",
      description:
        "RFC 4122-compliant v4 UUIDs generated with the browser's built-in secure random source.",
    },
    {
      icon: Copy,
      title: "Generate up to 100 at once",
      description:
        "Bulk-generate, copy individually or all at once, or download the batch as a .txt file.",
    },
    {
      icon: Lock,
      title: "100% client-side",
      description: "UUIDs are generated locally — nothing is sent to a server.",
    },
  ],
  faqs: [
    {
      question: "What version of UUID does this generate?",
      answer:
        "Version 4 (random) UUIDs, generated with the browser's native crypto.randomUUID() — RFC 4122 compliant.",
    },
    {
      question: "How unique are these UUIDs really?",
      answer:
        "A v4 UUID has 122 random bits. The chance of a collision is astronomically small — you'd need to generate billions of UUIDs before the odds of a duplicate become meaningful.",
    },
    {
      question: "Can I download the generated UUIDs?",
      answer:
        "Yes — use Download to save the current batch as a plain-text .txt file, one UUID per line.",
    },
  ],
  keywords: [
    "uuid",
    "uuid generator",
    "guid",
    "v4",
    "random id",
    "identifier",
    "uuid v4",
    "generate uuid online",
  ],
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
  seo: {
    title: "Hash Generator - SHA-256, SHA-384, SHA-512 Online",
    description:
      "Free online hash generator using the Web Crypto API. Generate SHA-256, SHA-384, or SHA-512 hashes for any text, entirely in your browser.",
  },
  features: [
    {
      icon: Hash,
      title: "Real Web Crypto API digests",
      description:
        "Uses the browser's native crypto.subtle.digest() — not a hand-rolled hashing implementation.",
    },
    {
      icon: ShieldCheck,
      title: "Three SHA algorithms",
      description: "Switch between SHA-256, SHA-384, and SHA-512 with one click.",
    },
    {
      icon: Lock,
      title: "100% client-side",
      description: "Your text is hashed locally — it's never transmitted anywhere.",
    },
  ],
  faqs: [
    {
      question: "Why isn't MD5 or SHA-1 available?",
      answer:
        "This tool uses only the browser's native Web Crypto API, which doesn't implement MD5, and SHA-1 is cryptographically broken for security purposes — so only SHA-256, SHA-384, and SHA-512 are offered.",
    },
    {
      question: "Can I use this to verify a downloaded file's checksum?",
      answer:
        "You can hash any text, but for verifying a downloaded file's integrity you generally want a tool that hashes the raw file bytes directly rather than pasted text.",
    },
    {
      question: "Is the hash computed locally?",
      answer:
        "Yes — crypto.subtle.digest() runs in your browser. The text you hash is never sent to a server.",
    },
  ],
  keywords: [
    "hash",
    "hash generator",
    "md5",
    "sha1",
    "sha256",
    "sha384",
    "sha512",
    "checksum",
    "cryptography",
    "sha256 online",
    "checksum generator"
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
  seo: {
    title: "Unix Timestamp Converter - Epoch to Date Online",
    description:
      "Free online Unix timestamp converter. Convert Unix time to a readable date, or a date to a Unix timestamp, in seconds or milliseconds, local or UTC.",
  },
  features: [
    {
      icon: ArrowRightLeft,
      title: "Bidirectional conversion",
      description: "Convert Unix timestamp to date, or date to Unix timestamp, from the same tool.",
    },
    {
      icon: Clock,
      title: "Seconds or milliseconds",
      description: "You always pick the unit explicitly — it's never auto-guessed.",
    },
    {
      icon: RefreshCw,
      title: "Live current timestamp",
      description: "An always-visible, refreshable panel shows the current Unix time as you work.",
    },
  ],
  faqs: [
    {
      question: "What's the difference between seconds and milliseconds?",
      answer:
        "Unix time is traditionally counted in seconds since Jan 1, 1970 UTC, but many APIs (including JavaScript's Date.now()) use milliseconds. This tool never guesses which one you mean — pick the unit explicitly.",
    },
    {
      question: "Does this account for time zones?",
      answer:
        "Yes. A Unix timestamp is timezone-agnostic; the tool shows it converted to both your local time zone and UTC, plus the ISO 8601 representation.",
    },
    {
      question: "What's the largest timestamp this supports?",
      answer:
        "Anything within JavaScript's Date range — roughly ±273,790 years from 1970. Timestamps outside that range are rejected with an error rather than silently producing a wrong date.",
    },
  ],
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
    "datetime",
    "epoch to date"
  ],
},
{
  slug: "color-converter",
  name: "Color Converter",
  shortDescription: "Convert colors between popular formats instantly.",
  description:
    "Convert colors between HEX, RGB, and HSL formats with real-time previews. Perfect for designers and developers, with all conversions performed securely in your browser.",
  category: "developer-tools",
  icon: Palette,
  status: "live",
  featured: true,
  seo: {
    title: "Color Converter - HEX, RGB, HSL Converter Online",
    description:
      "Free online color converter. Convert between HEX, RGB, and HSL instantly with a live preview — all conversions computed locally in your browser.",
  },
  features: [
    {
      icon: Palette,
      title: "Live preview, contrast-aware",
      description:
        "The hex label automatically switches between black and white text to stay readable on any color.",
    },
    {
      icon: Eye,
      title: "Native color picker",
      description: "Pick visually or type a hex value — every format updates together.",
    },
    {
      icon: Zap,
      title: "No color library dependency",
      description: "HEX/RGB/HSL conversion math is hand-rolled, not pulled from a package.",
    },
  ],
  faqs: [
    {
      question: "Which color formats are supported?",
      answer:
        "HEX, RGB, and HSL, converted live as you edit the hex value or use the color picker.",
    },
    {
      question: "How is the preview text color chosen?",
      answer:
        "It's picked automatically using the color's relative luminance, so the label stays readable in white or black depending on how light or dark the background color is.",
    },
    {
      question: "Can I type a hex value directly instead of using the picker?",
      answer:
        "Yes — type or paste a 6-digit hex value (with or without the #) into the hex field, and every other format updates automatically.",
    },
  ],
  keywords: [
    "color converter",
    "hex",
    "rgb",
    "hsl",
    "color picker",
    "color tool",
    "css colors",
    "web colors",
    "hex to rgb",
    "rgb to hsl"
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
  seo: {
    title: "Lorem Ipsum Generator - Placeholder Text Online",
    description:
      "Free online Lorem Ipsum generator. Generate words, sentences, or paragraphs of placeholder text for mockups and designs, instantly in your browser.",
  },
  features: [
    {
      icon: FileText,
      title: "Words, sentences, or paragraphs",
      description: "Pick exactly the unit and quantity you need for the layout you're filling.",
    },
    {
      icon: CheckCircle,
      title: "Classic opening, optional",
      description:
        "Start with the familiar \"Lorem ipsum dolor sit amet...\", or skip straight to random text.",
    },
    {
      icon: Download,
      title: "Copy or download",
      description: "Grab the text with one click, or save it as a .txt file.",
    },
  ],
  faqs: [
    {
      question: "Is this real Latin?",
      answer:
        "No — like traditional Lorem Ipsum, it's scrambled, non-meaningful Latin-derived vocabulary. It's designed to look like text at a glance without being readable, so it doesn't distract from a layout or design.",
    },
    {
      question: "Can I generate a specific word count?",
      answer: "Yes — switch to Words mode and enter any quantity from 1 to 500.",
    },
    {
      question: "Does every paragraph start with the classic opening?",
      answer:
        "Only if you leave \"Start with Lorem ipsum...\" checked, and even then only the very first paragraph gets it — the rest is randomly generated from the word bank.",
    },
  ],
  keywords: [
    "lorem ipsum",
    "placeholder text",
    "dummy text",
    "text generator",
    "latin text",
    "mockup content",
    "website placeholder",
    "design tool",
    "content generator",
    "placeholder text generator"
  ],
},
{
  slug: "html-formatter",
  name: "HTML Formatter",
  shortDescription: "Format, beautify, and minify HTML instantly.",
  description:
    "Clean up messy HTML with proper indentation, or strip it down to a minified single line. Content inside <pre>, <textarea>, <script>, and <style> is always left untouched, since reformatting it would change what the page actually renders.",
  category: "developer-tools",
  icon: FileCode2,
  status: "live",
  featured: true,
  seo: {
    title: "HTML Formatter - Beautify & Minify HTML Online",
    description:
      "Free online HTML formatter and minifier. Beautify messy HTML with proper indentation, or minify it for production — entirely in your browser.",
  },
  features: [
    {
      icon: FileCode2,
      title: "Format or minify",
      description:
        "Beautify messy HTML with clean indentation, or strip it down to a minified single line for production.",
    },
    {
      icon: ShieldCheck,
      title: "Whitespace-sensitive elements preserved",
      description:
        "Content inside <pre>, <textarea>, <script>, and <style> is never reformatted — only real markup structure is.",
    },
    {
      icon: Lock,
      title: "100% client-side",
      description:
        "A hand-rolled tokenizer runs entirely in your browser — no formatting library, no server round-trip.",
    },
  ],
  faqs: [
    {
      question: "Will formatting break my <script> or <style> content?",
      answer:
        "No. Everything inside <script>, <style>, <textarea>, and <pre> tags is copied through exactly as written — only the surrounding HTML structure gets reindented.",
    },
    {
      question: "What happens if my HTML has unclosed or mismatched tags?",
      answer:
        "The formatter still produces output using the tags actually present, and lists any structural issues it found (like an unclosed tag) underneath — it won't invent or silently drop tags to force the markup to look 'correct.'",
    },
    {
      question: "Does minifying strip HTML comments?",
      answer:
        "No, by design — comments are kept as-is so conditional comments or license headers in your markup aren't silently discarded.",
    },
  ],
  keywords: [
    "html formatter",
    "html beautifier",
    "html minifier",
    "format html online",
    "pretty print html",
    "minify html",
  ],
},
{
  slug: "html-entity-encoder-decoder",
  name: "HTML Entity Encoder/Decoder",
  shortDescription: "Encode or decode HTML entities instantly.",
  description:
    "Convert special characters into safe HTML entities, or decode entities back into readable text — supports named entities and numeric character references, entirely in your browser.",
  category: "developer-tools",
  icon: Braces,
  status: "live",
  featured: true,
  seo: {
    title: "HTML Entity Encoder & Decoder - Encode/Decode HTML Entities",
    description:
      "Free online HTML entity encoder and decoder. Convert special characters to safe HTML entities, or decode named and numeric entities back to text, entirely in your browser.",
  },
  features: [
    {
      icon: Braces,
      title: "Named and numeric entities",
      description:
        "Decodes standard named entities (like &amp;) and numeric references (&#39; and &#x27;) alike.",
    },
    {
      icon: CheckCircle,
      title: "Lenient by design",
      description:
        "Unrecognized or malformed entities are left unchanged in the output, exactly like a browser would handle them.",
    },
    {
      icon: Lock,
      title: "100% client-side",
      description:
        "Encoding and decoding both run locally — your text is never sent to a server.",
    },
  ],
  faqs: [
    {
      question: "Which characters get encoded?",
      answer:
        "Encoding always escapes the five HTML-unsafe characters: & < > \" and '. There's also an optional toggle to additionally encode every non-ASCII character as a numeric entity, for output that's safe to store as pure ASCII.",
    },
    {
      question: "What happens if I try to decode something that isn't a valid entity?",
      answer:
        "It's left exactly as written. Decoding never throws an error on unrecognized or malformed entities — unmatched text just passes through unchanged, the same way a browser handles it.",
    },
    {
      question: "Does this cover every possible HTML entity?",
      answer:
        "The most common named entities are supported directly, and numeric character references (decimal and hex) cover every other Unicode character regardless of whether it has a name.",
    },
  ],
  keywords: [
    "html entity encoder",
    "html entity decoder",
    "html entities",
    "escape html",
    "unescape html",
    "html special characters",
  ],
},
{
  slug: "css-formatter",
  name: "CSS Formatter",
  shortDescription: "Format, beautify, and minify CSS instantly.",
  description:
    "Clean up messy CSS with proper indentation and one selector per line, or strip it down to a minified stylesheet for production. Handles nested at-rules like @media and @keyframes, and never mistakes structure inside strings or url() for real CSS syntax.",
  category: "developer-tools",
  icon: Paintbrush,
  status: "live",
  featured: true,
  seo: {
    title: "CSS Formatter - Beautify & Minify CSS Online",
    description:
      "Free online CSS formatter and minifier. Beautify messy CSS with clean indentation, or minify it for production — entirely in your browser.",
  },
  features: [
    {
      icon: Paintbrush,
      title: "Format or minify",
      description:
        "Beautify messy CSS with clean indentation and one selector per line, or minify it for production.",
    },
    {
      icon: ShieldCheck,
      title: "Handles @media, @keyframes, and more",
      description:
        "Nested at-rules are indented correctly, and structure inside strings or url() is never mistaken for real CSS syntax.",
    },
    {
      icon: Lock,
      title: "100% client-side",
      description:
        "A hand-rolled tokenizer runs entirely in your browser — no formatting library, no server round-trip.",
    },
  ],
  faqs: [
    {
      question: "Does this support SCSS, LESS, or other CSS preprocessors?",
      answer:
        "No — this handles plain CSS3. Preprocessor-specific syntax (variables like $foo, mixins, @if/@each) will pass through as literal text rather than being understood.",
    },
    {
      question: "What happens with @media or @keyframes blocks?",
      answer:
        "At-rules that contain nested rules — @media, @supports, @keyframes, @layer, @container — are indented just like any other nested block, so their contents stay readable.",
    },
    {
      question: "Will formatting break a url() with special characters in it?",
      answer:
        "No. The tokenizer tracks quoted strings and url(...) content specifically, so characters like {, }, or ; inside a url() or a quoted value are never mistaken for real CSS structure.",
    },
  ],
  keywords: [
    "css formatter",
    "css beautifier",
    "css minifier",
    "format css online",
    "pretty print css",
    "minify css",
  ],
},
{
  slug: "number-base-converter",
  name: "Number Base Converter",
  shortDescription: "Convert numbers between binary, octal, decimal, and hex.",
  description:
    "Convert a number between binary, octal, decimal, and hexadecimal, all updating live as you type. Uses native BigInt arithmetic, so precision is never lost even on numbers larger than Number.MAX_SAFE_INTEGER.",
  category: "developer-tools",
  icon: Calculator,
  status: "live",
  featured: true,
  seo: {
    title: "Number Base Converter - Binary, Octal, Decimal, Hex",
    description:
      "Free online number base converter. Convert between binary, octal, decimal, and hexadecimal instantly, with full precision for arbitrarily large integers.",
  },
  features: [
    {
      icon: Calculator,
      title: "All four bases update together",
      description:
        "Type in any field — binary, octal, decimal, or hex — and the other three update instantly.",
    },
    {
      icon: ShieldCheck,
      title: "Never loses precision",
      description:
        "Conversion uses native BigInt arithmetic, not Number(), so huge integers convert correctly instead of silently rounding.",
    },
    {
      icon: Lock,
      title: "100% client-side",
      description: "All conversion happens locally — nothing is sent to a server.",
    },
  ],
  faqs: [
    {
      question: "Does this support negative numbers?",
      answer: "Yes — enter a leading \"-\" in any field and the sign carries through to the other three.",
    },
    {
      question: "What happens with numbers larger than JavaScript's safe integer limit?",
      answer:
        "They convert correctly. This tool uses BigInt for the actual arithmetic rather than Number()/parseInt(), which lose precision above 2^53 - 1 — a number like 9999999999999999999 converts exactly, not approximately.",
    },
    {
      question: "Why does my hex input show an error?",
      answer:
        "Each field only accepts the digits valid for its own base — binary allows only 0-1, octal 0-7, decimal 0-9, and hex 0-9 plus A-F. Anything else is flagged immediately without corrupting the other fields' values.",
    },
  ],
  keywords: [
    "number base converter",
    "binary to decimal",
    "decimal to hex",
    "hex to binary",
    "octal converter",
    "base converter online",
  ],
},
{
  slug: "jwt-generator",
  name: "JWT Generator",
  shortDescription: "Build and sign JWTs with HS256, HS384, or HS512.",
  description:
    "Edit a header and payload, pick an HMAC algorithm, and sign a JWT with your own secret — entirely in your browser using the native Web Crypto API. For testing and development, not production secrets.",
  category: "developer-tools",
  icon: KeySquare,
  status: "live",
  featured: true,
  seo: {
    title: "JWT Generator - Create & Sign JSON Web Tokens Online",
    description:
      "Free online JWT generator. Build and sign a JSON Web Token with HS256, HS384, or HS512, entirely in your browser using the native Web Crypto API.",
  },
  features: [
    {
      icon: KeySquare,
      title: "HS256 / HS384 / HS512",
      description: "Sign with any of the three standard HMAC algorithms, switched with one click.",
    },
    {
      icon: ShieldCheck,
      title: "Native Web Crypto API",
      description:
        "Signing uses crypto.subtle directly — no external JWT or crypto library.",
    },
    {
      icon: Lock,
      title: "100% client-side",
      description:
        "Your header, payload, and secret are never sent to a server — everything happens locally.",
    },
  ],
  faqs: [
    {
      question: "Is this safe to use with real production secrets?",
      answer:
        "This tool runs entirely in your browser and never transmits anything, but it's still meant for testing and development — avoid using real production secrets in any tool you don't control.",
    },
    {
      question: "Why only HS256/HS384/HS512, not RS256 or ES256?",
      answer:
        "Those use asymmetric key pairs, which need a much larger key-management UI than this tool covers. HMAC (a shared secret) covers the overwhelming majority of \"I just need a quick test token\" use cases.",
    },
    {
      question: "Can I set an expiration or issued-at time?",
      answer:
        "Yes — use \"Use current time\" with an expiration preset to insert iat and exp claims into the payload automatically, or type them into the payload JSON yourself.",
    },
  ],
  keywords: [
    "jwt generator",
    "jwt encoder",
    "create jwt",
    "sign jwt",
    "hs256 generator",
    "json web token generator",
  ],
},
{
  slug: "markdown-previewer",
  name: "Markdown Previewer",
  shortDescription: "Preview Markdown as you type, live.",
  description:
    "Write Markdown on the left and see it rendered live on the right. Headings, bold/italic, lists, code blocks, blockquotes, and links are all supported — rendered as real elements, not raw HTML, so nothing you type can execute as script.",
  category: "developer-tools",
  icon: NotebookText,
  status: "live",
  featured: true,
  seo: {
    title: "Markdown Previewer - Live Markdown Preview Online",
    description:
      "Free online Markdown previewer. Write Markdown and see it rendered live, side by side, entirely in your browser.",
  },
  features: [
    {
      icon: NotebookText,
      title: "Live preview, no button needed",
      description: "The rendered preview updates as you type — headings, lists, code, and more.",
    },
    {
      icon: ShieldCheck,
      title: "Never rendered as raw HTML",
      description:
        "Markdown is parsed into real elements, not an HTML string, so pasted script-like content can't execute — even a link with a javascript: URL is rendered inert.",
    },
    {
      icon: Lock,
      title: "100% client-side",
      description: "Nothing you type is ever sent to a server — parsing and rendering both run locally.",
    },
  ],
  faqs: [
    {
      question: "Is this a full CommonMark-compliant renderer?",
      answer:
        "It covers the common subset most people actually use — headings, bold/italic, inline code, fenced code blocks, links, one level of nested lists, blockquotes, and horizontal rules. Less common syntax like footnotes or reference-style links isn't supported and renders as literal text.",
    },
    {
      question: "Is it safe to paste Markdown from an untrusted source?",
      answer:
        "Yes. The parser never builds an HTML string or uses dangerouslySetInnerHTML — it builds real React elements, so pasted content is always treated as text, never executed. Links using unsafe schemes like javascript: are rendered as plain, non-clickable text instead of a working link.",
    },
    {
      question: "Can I upload or download a .md file?",
      answer: "Yes — Upload loads a .md file's contents into the editor, and Download saves your current source as one.",
    },
  ],
  keywords: [
    "markdown previewer",
    "markdown editor",
    "markdown to html",
    "live markdown preview",
    "markdown viewer online",
  ],
},
{
  slug: "javascript-formatter",
  name: "JavaScript Formatter",
  shortDescription: "Reindent and beautify JavaScript instantly.",
  description:
    "Clean up messy or minified JavaScript with consistent indentation, or strip it down for production. This is a safe, lightweight beautifier — it only ever adjusts whitespace between tokens, so your code's actual characters are never rewritten, reordered, or corrupted, even on tricky input like nested template literals or regex literals.",
  category: "developer-tools",
  icon: Code2,
  status: "live",
  featured: true,
  seo: {
    title: "JavaScript Formatter - Beautify & Minify JS Online",
    description:
      "Free online JavaScript formatter. Reindent messy or minified JavaScript for readability, or minify it for production — entirely in your browser.",
  },
  features: [
    {
      icon: Code2,
      title: "Format or minify",
      description: "Reindent messy JavaScript for readability, or strip it down for production.",
    },
    {
      icon: ShieldCheck,
      title: "Whitespace-only, by construction",
      description:
        "Every character of your code appears in the output unchanged — only the whitespace between tokens is ever adjusted, never the code itself.",
    },
    {
      icon: Lock,
      title: "100% client-side",
      description:
        "A hand-rolled tokenizer runs entirely in your browser — no formatting library, no server round-trip.",
    },
  ],
  faqs: [
    {
      question: "Is this the same as Prettier?",
      answer:
        "No — this is a deliberately lightweight, safe beautifier, not a full AST-based formatter. A real formatter needs a complete JavaScript parser, and a subtle bug there risks silently corrupting your code. This tool only ever adjusts whitespace between tokens (indentation, line breaks) — it never rewrites, reorders, or deletes any character of your actual code, so the worst case is imperfect formatting, never broken code.",
    },
    {
      question: "Will it corrupt template literals, regexes, or strings?",
      answer:
        "No. Strings, template literals (including nested ${...} expressions), regex literals, and comments are each recognized as one atomic block and copied through untouched — the formatter never reformats their contents.",
    },
    {
      question: "Does it handle long lines or deeply nested function calls well?",
      answer:
        "It reindents based on { } depth, not ( ) or [ ], so it won't line-wrap long argument lists or chained calls the way Prettier would. It's built for turning minified or inconsistently-indented code into something readable, not for full stylistic formatting.",
    },
  ],
  keywords: [
    "javascript formatter",
    "js formatter",
    "javascript beautifier",
    "js minifier",
    "format javascript online",
    "minify javascript",
  ],
},
{
  slug: "xml-formatter",
  name: "XML Formatter",
  shortDescription: "Format, beautify, and minify XML instantly.",
  description:
    "Clean up messy XML with proper indentation, or strip it down to a minified document. CDATA sections are always left untouched, processing instructions and DOCTYPEs are preserved as-is, and tag names are treated case-sensitively, exactly as XML requires.",
  category: "developer-tools",
  icon: FileCode,
  status: "live",
  featured: true,
  seo: {
    title: "XML Formatter - Beautify & Minify XML Online",
    description:
      "Free online XML formatter and minifier. Beautify messy XML with proper indentation, or minify it — entirely in your browser.",
  },
  features: [
    {
      icon: FileCode,
      title: "Format or minify",
      description: "Beautify messy XML with clean indentation, or minify it down to one document.",
    },
    {
      icon: ShieldCheck,
      title: "CDATA and case-sensitivity respected",
      description:
        "CDATA sections are never reformatted, and tag names are treated case-sensitively — unlike HTML, XML requires both.",
    },
    {
      icon: Lock,
      title: "100% client-side",
      description:
        "A hand-rolled tokenizer runs entirely in your browser — no formatting library, no server round-trip.",
    },
  ],
  faqs: [
    {
      question: "Will formatting change my CDATA sections?",
      answer:
        "No. Everything inside a <![CDATA[ ... ]]> section is copied through exactly as written — CDATA exists specifically to hold content that shouldn't be reparsed as markup, and this tool respects that.",
    },
    {
      question: "Does this work for any XML-based format, like SVG or RSS?",
      answer:
        "Yes — this is generic XML formatting, not tied to a specific schema, so SVG, RSS, XML config files, and any other well-formed XML all work the same way.",
    },
    {
      question: "What happens with mismatched or unclosed tags?",
      answer:
        "The formatter still produces output using the tags actually present, and lists any structural issues it found (like an unclosed tag) underneath, rather than failing outright.",
    },
  ],
  keywords: [
    "xml formatter",
    "xml beautifier",
    "xml minifier",
    "format xml online",
    "pretty print xml",
    "minify xml",
  ],
},
{
  slug: "sql-formatter",
  name: "SQL Formatter",
  shortDescription: "Format SQL queries for readability, safely.",
  description:
    "Reindent SQL queries by clause and nesting depth, with an optional keyword-uppercasing toggle. Like the JavaScript Formatter, this is a safe beautifier — it only ever adjusts whitespace (and, if you enable it, keyword case) between tokens, so string literals, quoted identifiers, and comments are never touched.",
  category: "developer-tools",
  icon: Database,
  status: "live",
  featured: true,
  seo: {
    title: "SQL Formatter - Beautify SQL Queries Online",
    description:
      "Free online SQL formatter. Reindent SQL queries by clause and nesting depth, with an optional keyword-uppercasing toggle — entirely in your browser.",
  },
  features: [
    {
      icon: Database,
      title: "Formats by clause and nesting",
      description:
        "SELECT, FROM, WHERE, JOIN variants, and more each start a new line, indented by subquery/function-call depth.",
    },
    {
      icon: ShieldCheck,
      title: "Never touches string literals",
      description:
        "String literals, quoted identifiers, and comments are always copied through untouched — even one containing text that looks like a keyword.",
    },
    {
      icon: Lock,
      title: "100% client-side",
      description:
        "A hand-rolled tokenizer runs entirely in your browser — no formatting library, no server round-trip.",
    },
  ],
  faqs: [
    {
      question: "Is this a real SQL parser?",
      answer:
        "No — it's a deliberately safe, lightweight beautifier, not a dialect-aware parser. SQL syntax varies across MySQL, Postgres, SQLite, and others, and getting dialect-specific grammar wrong risks corrupting a real query. This tool only ever adjusts whitespace between tokens, so the worst case is imperfect formatting, never a broken query.",
    },
    {
      question: "What does \"Uppercase keywords\" actually change?",
      answer:
        "With it on, recognized SQL keywords (SELECT, FROM, WHERE, and similar) are uppercased. It's off by default and never touches string literals, quoted identifiers, or plain column/table names — only confidently-recognized keyword tokens, which are case-insensitive in every mainstream SQL dialect, so this can never change what your query does.",
    },
    {
      question: "Will it break a string that contains something like 'select this'?",
      answer:
        "No. String literals are recognized and copied through completely untouched — their contents are never scanned for keywords, reformatted, or reordered.",
    },
  ],
  keywords: [
    "sql formatter",
    "sql beautifier",
    "format sql online",
    "pretty print sql",
    "sql query formatter",
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