import { notFound } from "next/navigation";

import {
  getToolBySlug,
  getRelatedTools,
} from "@/constants/all-tools";

import { TOOL_RENDERERS } from "@/constants/tool-renderers";

import ToolLayout from "@/components/tool-page/ToolLayout";
import ToolFeatures from "@/components/tool-page/ToolFeatures";
import ToolFAQ from "@/components/tool-page/ToolFAQ";
import RelatedTools from "@/components/tool-page/RelatedTools";

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const ToolComponent =
    TOOL_RENDERERS[tool.slug as keyof typeof TOOL_RENDERERS];

  if (!ToolComponent) {
    return <div>Coming Soon</div>;
  }

  return (
    <ToolLayout
      icon={tool.icon}
      title={tool.name}
      description={tool.description}
      category={tool.category}
    >
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