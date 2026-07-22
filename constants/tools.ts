import {
  FileJson,
  Regex,
  Palette,
  FileText,
  Sparkles,
  Braces,
  QrCode,
  Clock,
  type LucideIcon,
} from "lucide-react";

export interface Tool {
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: LucideIcon;
  featured?: boolean;
}

/**
 * Single source of truth for all tools. FeaturedTools reads only the
 * `featured` entries; other pages (e.g. a full directory) can import
 * the same list and filter/sort differently without touching UI.
 */
export const ALL_TOOLS: Tool[] = [
  {
    name: "JSON Formatter",
    slug: "json-formatter",
    description: "Format, validate, and minify JSON with one click.",
    category: "Developer Tools",
    icon: FileJson,
    featured: true,
  },
  {
    name: "Regex Tester",
    slug: "regex-tester",
    description: "Build and debug regular expressions in real time.",
    category: "Developer Tools",
    icon: Regex,
    featured: true,
  },
  {
    name: "Prompt Optimizer",
    slug: "prompt-optimizer",
    description: "Refine prompts for clarity, tone, and better outputs.",
    category: "AI Tools",
    icon: Sparkles,
    featured: true,
  },
  {
    name: "Resume Builder",
    slug: "resume-builder",
    description: "Create an ATS-friendly resume from a simple form.",
    category: "Resume Tools",
    icon: FileText,
    featured: true,
  },
  {
    name: "API Tester",
    slug: "api-tester",
    description: "Send requests and inspect responses without Postman.",
    category: "API & Data",
    icon: Braces,
    featured: true,
  },
  {
    name: "Color Palette Generator",
    slug: "color-palette-generator",
    description: "Generate accessible color palettes from a single hue.",
    category: "Design Tools",
    icon: Palette,
    featured: true,
  },
  {
    name: "QR Code Generator",
    slug: "qr-code-generator",
    description: "Turn links or text into downloadable QR codes.",
    category: "Productivity",
    icon: QrCode,
  },
  {
    name: "Cron Expression Builder",
    slug: "cron-builder",
    description: "Build and explain cron schedules in plain English.",
    category: "Developer Tools",
    icon: Clock,
  },
];
