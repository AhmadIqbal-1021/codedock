import Link from "next/link";
import type { FooterColumn as FooterColumnType } from "@/constants/footer-links";

interface FooterColumnProps {
  column: FooterColumnType;
}

/**
 * Renders one titled list of links. Used for Product, Resources, and
 * Company columns so the markup for each isn't repeated in Footer.tsx.
 */
export function FooterColumn({ column }: FooterColumnProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
      <ul className="mt-4 space-y-3">
        {column.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FooterColumn;
