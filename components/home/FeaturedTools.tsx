import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/shared/Section";
import { Container } from "@/components/shared/Container";
import { ToolCard } from "./ToolCard";
import { ALL_TOOLS} from "@/constants/tools";

/**
 * Renders only the `featured` tools from TOOLS. Mark/unmark a tool as
 * featured in src/constants/tools.ts and this grid updates on its own.
 */
export function FeaturedTools() {
  const featuredTools = ALL_TOOLS.filter((tool) => tool.featured);

  return (
   <Section id="featured-tools">
      <Container>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Featured tools
            </h2>
            <p className="mt-3 max-w-xl text-base text-muted-foreground">
              The tools developers reach for most, ready to use in seconds.
            </p>
          </div>

          <Link
            href="/tools"
            className="group flex shrink-0 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            View all tools
            <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
          </Link>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredTools.map((tool) => (
            <li key={tool.slug}>
              <ToolCard tool={tool} />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export default FeaturedTools;
