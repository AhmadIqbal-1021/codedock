import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getToolBySlug,
  getRelatedTools,
  getLiveTools,
} from "@/constants/all-tools";
import { getCategoryName } from "@/constants/categories";
import { SITE_URL, SITE_NAME } from "@/lib/site";

import { TOOL_RENDERERS } from "@/constants/tool-renderers";

import ToolLayout from "@/components/tool-page/ToolLayout";
import ToolFeatures from "@/components/tool-page/ToolFeatures";
import ToolFAQ from "@/components/tool-page/ToolFAQ";
import RelatedTools from "@/components/tool-page/RelatedTools";

interface ToolPageParams {
  params: Promise<{ slug: string }>;
}

/** Pre-renders every live tool page at build time; new tools just need a registry entry. */
export function generateStaticParams() {
  return getLiveTools().map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageParams): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return {};
  }

  const title = tool.seo?.title ?? `${tool.name} - Free Online Tool`;
  const description = tool.seo?.description ?? tool.shortDescription;
  const url = `${SITE_URL}/tools/${tool.slug}`;

  return {
    title,
    description,
    keywords: tool.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ToolPage({ params }: ToolPageParams) {
  const { slug } = await params;

  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const ToolComponent =
    TOOL_RENDERERS[tool.slug as keyof typeof TOOL_RENDERERS];

  if (!ToolComponent) {
    // A "live" tool with no matching TOOL_RENDERERS entry is always a bug
    // (a slug typo/mismatch between the two registries — see CodeDock.md
    // §3), never an intentional state. Failing the build loudly here beats
    // silently shipping a "Coming Soon" page for a tool that's supposedly
    // live: generateStaticParams() already builds this page for every live
    // tool, so this throws at build time, not in front of a real visitor.
    if (tool.status === "live") {
      throw new Error(
        `Registry mismatch: "${tool.slug}" is marked status: "live" in ALL_TOOLS but has no matching key in TOOL_RENDERERS. Add it to constants/tool-renderers.ts, or the slugs don't match exactly.`
      );
    }

    return <div>Coming Soon</div>;
  }

  const url = `${SITE_URL}/tools/${tool.slug}`;

  // SoftwareApplication schema for every live tool. No aggregateRating/
  // review fields — CodeDock has no real reviews yet, and fabricating
  // ratings is exactly the kind of thing that gets a site penalized.
  const softwareAppLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.seo?.description ?? tool.description,
    url,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (runs in browser)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  const faqLd =
    tool.faqs && tool.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: tool.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null;

  return (
    <ToolLayout
      icon={tool.icon}
      title={tool.name}
      description={tool.description}
      category={getCategoryName(tool.category)}
    >
      {/* Structured data — own trusted object, not user input. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}

      <ToolComponent />

      {tool.features && tool.features.length > 0 && (
        <ToolFeatures features={tool.features} />
      )}

      {tool.faqs && tool.faqs.length > 0 && (
        <ToolFAQ items={tool.faqs} />
      )}

      <RelatedTools
        tools={getRelatedTools(tool.slug)}
      />
    </ToolLayout>
  );
}
