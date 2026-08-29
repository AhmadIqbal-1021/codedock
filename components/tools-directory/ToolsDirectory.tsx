"use client";

import { useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ToolCard } from "@/components/home/ToolCard";
import { getLiveTools } from "@/constants/all-tools";
import { CATEGORIES } from "@/constants/categories";

type CategoryFilter = "all" | (typeof CATEGORIES)[number]["slug"];

const LIVE_TOOLS = getLiveTools();

/**
 * Client-side search + category filtering over the live tools list. The
 * full tool set is small (a few dozen, even well into Phase D) and
 * already loaded, so filtering as-you-type locally is simpler and
 * snappier than a server round-trip per keystroke — no backend needed.
 */
function ToolsDirectoryInner() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return LIVE_TOOLS.filter((tool) => {
      if (category !== "all" && tool.category !== category) return false;
      if (!q) return true;

      return (
        tool.name.toLowerCase().includes(q) ||
        tool.shortDescription.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.keywords?.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [query, category]);

  const hasFilters = query.trim() !== "" || category !== "all";

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
  };

  return (
    <>
      <header className="flex flex-col gap-3 text-center sm:text-left">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">All Tools</h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground sm:mx-0">
          {LIVE_TOOLS.length} free, 100% client-side developer tools — search or browse by
          category.
        </p>
      </header>

      {/* Search */}
      <div className="mt-8 flex items-center gap-2 rounded-full border border-white/10 bg-background/60 p-1.5 shadow-lg shadow-black/5 backdrop-blur-xl transition-colors focus-within:border-indigo-400/40">
        <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tools by name or keyword..."
          aria-label="Search tools"
          className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category filter chips */}
      <div
        role="group"
        aria-label="Filter by category"
        className="mt-5 flex flex-wrap items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setCategory("all")}
          aria-pressed={category === "all"}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 ${
            category === "all"
              ? "border-transparent bg-foreground text-background"
              : "border-white/10 text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => setCategory(cat.slug)}
            aria-pressed={category === cat.slug}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 ${
              category === cat.slug
                ? "border-transparent bg-foreground text-background"
                : "border-white/10 text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool) => (
            <li key={tool.slug}>
              <ToolCard tool={tool} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10 rounded-2xl border border-white/10 bg-foreground/[0.03] px-6 py-16 text-center">
          <p className="text-base text-muted-foreground">
            No tools match{query.trim() ? ` "${query.trim()}"` : " these filters"}.
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-sm font-medium text-indigo-400 hover:text-cyan-400"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </>
  );
}

/** useSearchParams() requires a Suspense boundary in the App Router. */
export function ToolsDirectory() {
  return (
    <Suspense fallback={null}>
      <ToolsDirectoryInner />
    </Suspense>
  );
}

export default ToolsDirectory;
