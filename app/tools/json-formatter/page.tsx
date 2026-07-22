import { Braces, ShieldCheck, Zap, Code2 } from "lucide-react";
import { ToolLayout } from "@/components/tool-page/ToolLayout";
import { ToolFeatures } from "@/components/tool-page/ToolFeatures";
import { ToolFAQ } from "@/components/tool-page/ToolFAQ";
import { RelatedTools } from "@/components/tool-page/RelatedTools";
import { JsonFormatter } from "@/components/tools/json-formatter/JsonFormatter";
import {ALL_TOOLS} from "@/constants/tools";

export const metadata = {
  title: "JSON Formatter - Format JSON Online",
  description:
    "Free online JSON formatter and validator. Beautify, validate and format JSON instantly.",
};

const FEATURES = [
  {
    icon: Zap,
    title: "Instant formatting",
    description: "Beautify minified or messy JSON with proper indentation in one click.",
  },
  {
    icon: ShieldCheck,
    title: "Client-side only",
    description: "Your JSON never leaves the browser — nothing is sent to a server.",
  },
  {
    icon: Code2,
    title: "Clear error messages",
    description: "Invalid JSON is flagged immediately with a precise syntax error.",
  },
];

const FAQS = [
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
];

const RELATED_TOOLS = ALL_TOOLS.filter(
  (tool) => tool.category === "Developer Tools" && tool.slug !== "json-formatter"
);

export default function Page() {
  return (
    <ToolLayout
      icon={Braces}
      title="JSON Formatter"
      description="Paste JSON, format it with clean indentation, and catch syntax errors instantly. Everything runs in your browser."
      category="Developer Tools"
    >
      <JsonFormatter />
      <ToolFeatures features={FEATURES} />
      <ToolFAQ items={FAQS} />
      <RelatedTools tools={RELATED_TOOLS} />
    </ToolLayout>
  );
}
