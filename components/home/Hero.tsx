"use client";

import { useState } from "react";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/shared/Container";
import Link from "next/link";
import { useRouter } from "next/navigation";

const POPULAR_TOOLS = [
  { label: "JSON Formatter", href: "/developer-tools/json-formatter" },
  { label: "Regex Tester", href: "/developer-tools/regex-tester" },
  { label: "Resume Builder", href: "/resume-tools/builder" },
  { label: "Prompt Optimizer", href: "/ai-tools/prompt-optimizer" },
];

/**
 * Primary landing hero: headline, subheading, search, dual CTAs,
 * and a row of popular-tool shortcuts. Search is presentation-only
 * here — wire onSubmit up to your real search route/handler.
 */
export function Hero() {
  const [query, setQuery] = useState("");

    const router = useRouter()

  return (
    <section className="relative overflow-hidden">
      {/* Ambient gradient glow, purely decorative */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center blur-3xl"
      >
        <div className="h-[420px] w-[720px] rounded-full bg-gradient-to-br from-indigo-500/30 to-cyan-400/20" />
      </div>

      <Container className="flex flex-col items-center py-20 text-center sm:py-28">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-foreground/5 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          Now with AI-powered tools
        </span>

        <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        Developer tools that just work.{" "}
          <span className="bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">
           AI when you need it.
          </span>
        </h1>

        <p className="mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          Fast, free developer tools with AI-powered features when you need them.
        </p>

        {/* Search bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/search?q=${query}`);
          }}
          className="mt-9 flex w-full max-w-xl items-center gap-2 rounded-full border border-white/10 bg-background/60 p-1.5 shadow-lg shadow-black/5 backdrop-blur-xl transition-colors focus-within:border-indigo-400/40"
        >
          <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
          
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search developer tools..."
            aria-label="Search tools"
            className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button
            type="submit"
            disabled={!query.trim()}
            className="h-11 shrink-0 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 px-5 text-white hover:opacity-90"
          >
            Find Tool
          </Button>
        </form>

        {/* Popular tools
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm text-muted-foreground">
          <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
            Popular:
          </span>
          {POPULAR_TOOLS.map((tool, i) => (
            <span key={tool.href} className="flex items-center gap-2">
              <Link
                href={tool.href}
                className="rounded-full transition-colors hover:text-foreground"
              >
                {tool.label}
              </Link>
              {i < POPULAR_TOOLS.length - 1 && (
                <span aria-hidden className="text-muted-foreground/30">
                  &middot;
                </span>
              )}
            </span>
          ))}
        </div> */}

        {/* CTAs */}
        <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:w-auto sm:flex-row">
          <Button
            size="lg"
            className="rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 px-7 text-white hover:opacity-90"
            asChild
          >
            <Link href="/developer-tools">
              Explore Tools
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-white/15 bg-transparent px-7"
            asChild
          >
            <Link href="/ai-tools">
              <Sparkles className="mr-1.5 h-4 w-4" />
              AI Tools
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}

export default Hero;
