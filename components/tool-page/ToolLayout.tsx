import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Section } from "@/components/shared/Section";
import { Container } from "@/components/shared/Container";
import { ToolHeader } from "./ToolHeader";

interface ToolLayoutProps {
  icon: LucideIcon;
  title: string;
  description: string;
  category?: string;
  children: ReactNode;
}

/**
 * Shared shell for every tool page (JSON Formatter, Regex Tester,
 * JWT Decoder, ...). Renders the ToolHeader, then stacks whatever
 * the page passes in as children — the tool's own working UI,
 * ToolFeatures, ToolFAQ, RelatedTools, in whatever order/combination
 * that page needs. This component only owns layout, never tool logic.
 *
 * Usage:
 * <ToolLayout icon={Braces} title="JSON Formatter" description="..." category="Developer Tools">
 *   <JsonFormatter />
 *   <ToolFeatures features={...} />
 *   <ToolFAQ items={...} />
 *   <RelatedTools tools={...} />
 * </ToolLayout>
 */
export function ToolLayout({ icon, title, description, category, children }: ToolLayoutProps) {
  return (
    <div className="py-8 sm:py-10">
      <Container className="flex flex-col gap-16">
        <ToolHeader icon={icon} title={title} description={description} category={category} />
        {children}
      </Container>
    </div>
  );
}

export default ToolLayout;
