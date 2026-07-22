import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Vertical rhythm wrapper for page sections. Handles consistent
 * top/bottom spacing so individual sections don't each reinvent it;
 * pass className to extend or override (e.g. background, id).
 */
export function Section({ children, className }: SectionProps) {
  return (
    <section className={cn("py-16 sm:py-20 lg:py-24", className)}>
      {children}
    </section>
  );
}

export default Section;
