import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionProps {
 children: ReactNode;
 className?: string;
 id?: string;
}
/**
 * Vertical rhythm wrapper for page sections. Handles consistent
 * top/bottom spacing so individual sections don't each reinvent it;
 * pass className to extend or override (e.g. background, id).
 */
export function Section({ children, className, id }: SectionProps) {
  return (
    <section id={id} className={cn("py-16 sm:py-20 lg:py-16", className)}>
      {children}
    </section>
  );
}

export default Section;
