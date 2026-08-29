import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/constants/categories";
  

interface CategoryCardProps {
  category: Category;
  className?: string;
}

/**
 * Clickable category tile. Entire card is a Next.js Link, so the
 * hover state (lift + border glow + arrow shift) reads as one
 * cohesive affordance rather than separate hover targets.
 */
export function CategoryCard({ category, className }: CategoryCardProps) {
  const { name, description,toolCount, icon: Icon, slug } = category;

  return (
    <Link
      href={`/categories/${slug}`}
      className={cn(
        "group relative flex flex-col gap-4 rounded-2xl border border-white/10 bg-foreground/[0.03] p-6",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-foreground/[0.05] hover:shadow-lg hover:shadow-indigo-500/5",
        "focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white transition-transform duration-300 ease-out group-hover:scale-105 group-hover:rotate-3"
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>

        <span className="rounded-full border border-white/10 bg-background/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {toolCount} tools
        </span>
      </div>

      <div>
        <h3 className="text-base font-semibold text-foreground">{name}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      <span className="mt-auto flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
        Browse
        <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export default CategoryCard;
