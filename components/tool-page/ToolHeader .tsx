import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ToolHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  category?: string;
}

/**
 * Header used at the top of any individual tool page (JSON Formatter,
 * Regex Tester, etc). Kept generic and icon-driven so it's reusable
 * across the whole tools directory, not just this one tool.
 */
export function ToolHeader({ icon: Icon, title, description, category }: ToolHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white"
          aria-hidden
        >
          <Icon className="h-6 w-6" />
        </span>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
      </div>

      {category && (
        <Badge
          variant="secondary"
          className="w-fit rounded-full border border-white/10 bg-background/60 font-medium text-muted-foreground"
        >
          {category}
        </Badge>
      )}
    </div>
  );
}

export default ToolHeader;
