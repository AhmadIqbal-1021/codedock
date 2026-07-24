import { ToolCard } from "@/components/home/ToolCard";
import type { ToolInfo } from "@/constants/all-tools";

interface RelatedToolsProps {
  tools: ToolInfo[];
  title?: string;
}

/**
 * Shows a small set of related tools at the bottom of any tool page.
 * Reuses the same ToolCard from the Featured Tools section, so a
 * tool's card looks identical whether it appears on the homepage or
 * here. Each page decides which tools count as "related" and passes
 * them in — this component has no opinion on that logic.
 */
export function RelatedTools({ tools, title = "Related tools" }: RelatedToolsProps) {
  if (tools.length === 0) return null;

  return (
    <section aria-labelledby="related-tools-heading" className="flex flex-col gap-8">
      <h2
        id="related-tools-heading"
        className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
      >
        {title}
      </h2>

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <li key={tool.slug}>
            <ToolCard tool={tool} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RelatedTools;
