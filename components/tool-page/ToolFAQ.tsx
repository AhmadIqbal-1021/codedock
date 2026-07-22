import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface ToolFAQItem {
  question: string;
  answer: string;
}

interface ToolFAQProps {
  items: ToolFAQItem[];
  title?: string;
}

/**
 * Generic FAQ accordion. Every tool page supplies its own list of
 * { question, answer } pairs — nothing here is JSON/Regex/JWT specific.
 */
export function ToolFAQ({ items, title = "Frequently asked questions" }: ToolFAQProps) {
  return (
    <section aria-labelledby="tool-faq-heading" className="flex flex-col gap-8">
      <h2
        id="tool-faq-heading"
        className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
      >
        {title}
      </h2>

      <Accordion type="single" collapsible className="rounded-2xl border border-white/10">
        {items.map((item, index) => (
          <AccordionItem
            key={item.question}
            value={`faq-${index}`}
            className="border-white/10 px-5 last:border-b-0"
          >
            <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline sm:text-base">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

export default ToolFAQ;
