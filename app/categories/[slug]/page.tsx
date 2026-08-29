import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/shared/Container";
import { ToolCard } from "@/components/home/ToolCard";
import { CATEGORIES } from "@/constants/categories";
import { getLiveTools } from "@/constants/all-tools";
import { SITE_URL } from "@/lib/site";

interface CategoryPageParams {
  params: Promise<{ slug: string }>;
}

/** Pre-renders every category page at build time — there are only a handful. */
export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageParams): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);

  if (!category) {
    return {};
  }

  const title = `${category.name} Tools`;
  const url = `${SITE_URL}/categories/${category.slug}`;

  return {
    title,
    description: category.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description: category.description,
      url,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageParams) {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  // Filtered explicitly to live tools here, rather than trusting a shared
  // helper to already do it — this page is the first real consumer of
  // per-category tool listing, and an unfinished tool must never be
  // reachable before it's ready (see CodeDock.md §4 on getLiveTools()).
  const tools = getLiveTools().filter((tool) => tool.category === category.slug);
  const Icon = category.icon;

  return (
    <>
      <Navbar />

      <main className="py-16 sm:py-20">
        <Container>
          <header className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-background/60 text-indigo-400"
                aria-hidden
              >
                <Icon className="h-6 w-6" />
              </span>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{category.name}</h1>
            </div>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {category.description}
            </p>
          </header>

          {tools.length > 0 ? (
            <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <li key={tool.slug}>
                  <ToolCard tool={tool} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-12 rounded-2xl border border-white/10 bg-foreground/[0.03] px-6 py-16 text-center">
              <p className="text-base text-muted-foreground">
                No tools in this category yet — check back soon.
              </p>
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </>
  );
}
