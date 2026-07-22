import {
  Code2,
  Sparkles,
  FileText,
  Braces,
  Palette,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface Category {
  name: string;
  slug: string;
  description: string;
  toolCount: number;
  icon: LucideIcon;
}

/**
 * Single source of truth for the Categories section. Add or edit a
 * category here and the grid, counts, and links update everywhere.
 */
export const CATEGORIES: Category[] = [
  {
    name: "Developer Tools",
    slug: "developer-tools",
    description: "Formatters, converters, and utilities for everyday coding.",
    toolCount: 0,
    icon: Code2,
  },
  {
    name: "AI Tools",
    slug: "ai-tools",
    description: "Prompt helpers, summarizers, and AI-powered assistants.",
    toolCount: 12,
    icon: Sparkles,
  },
  {
    name: "Resume Tools",
    slug: "resume-tools",
    description: "Build, format, and tailor resumes that get noticed.",
    toolCount: 8,
    icon: FileText,
  },
  {
    name: "API & Data",
    slug: "api-data",
    description: "Test endpoints, inspect payloads, and mock responses.",
    toolCount: 15,
    icon: Braces,
  },
  {
    name: "Design Tools",
    slug: "design-tools",
    description: "Color palettes, gradients, and quick UI generators.",
    toolCount: 9,
    icon: Palette,
  },
  {
    name: "Productivity",
    slug: "productivity",
    description: "Snippets, shortcuts, and small tools that save minutes.",
    toolCount: 11,
    icon: Zap,
  },
];
