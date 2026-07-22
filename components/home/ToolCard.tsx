import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tool } from "@/constants/tools";

interface ToolCardProps {
  tool: Tool;
  className?: string;
}

/**
 * Clickable tool tile. The whole card is a Next.js Link so keyboard
 * and pointer users get one consistent target; "Open Tool" is styled
 * as a button-like affordance rather than a nested anchor.
 */
export function ToolCard({ tool, className }: ToolCardProps) {
  const { name, description, category, icon: Icon, slug } = tool;

  return (
    <Link
      href={`/tools/${slug}`}
      className={cn(
        "group relative flex flex-col gap-4 rounded-2xl border border-white/10 bg-foreground/[0.03] p-6",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-foreground/[0.05] hover:shadow-lg hover:shadow-indigo-500/5",
        "focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-background/60 text-indigo-400 transition-transform duration-300 ease-out group-hover:scale-105 group-hover:rotate-3"
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>

        <Badge
          variant="secondary"
          className="rounded-full border border-white/10 bg-background/60 font-medium text-muted-foreground"
        >
          {category}
        </Badge>
      </div>

      <div>
        <h3 className="text-base font-semibold text-foreground">{name}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      <span className="mt-auto flex items-center gap-1.5 text-sm font-medium text-indigo-400 transition-colors duration-200 group-hover:text-cyan-400">
        Open Tool
        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </Link>
  );
}

export default ToolCard;
