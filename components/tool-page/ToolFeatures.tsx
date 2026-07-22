import type { LucideIcon } from "lucide-react";

export interface ToolFeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface ToolFeaturesProps {
  features: ToolFeatureItem[];
  title?: string;
}

/**
 * "Why use this tool" grid. Fully generic — every tool page passes
 * its own list of { icon, title, description } items, so the same
 * component covers JSON Formatter, Regex Tester, JWT Decoder, etc.
 */
export function ToolFeatures({ features, title = "Why use this tool" }: ToolFeaturesProps) {
  return (
    <section aria-labelledby="tool-features-heading" className="flex flex-col gap-8">
      <h2
        id="tool-features-heading"
        className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
      >
        {title}
      </h2>

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title: featureTitle, description }) => (
          <li
            key={featureTitle}
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-foreground/[0.03] p-5"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-background/60 text-indigo-400"
              aria-hidden
            >
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="text-sm font-semibold text-foreground">{featureTitle}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ToolFeatures;
