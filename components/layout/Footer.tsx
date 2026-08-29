import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import { Container } from "@/components/shared/Container";
import { FooterColumn } from "./FooterColumn";
import { FOOTER_COLUMNS, LEGAL_LINKS, SOCIAL_LINKS } from "@/constants/footer-links";

const ICONS = {
  GitHub: FaGithub,
} as const;

/**
 * Site footer: brand + 3 link columns on desktop (4 total), stacked
 * on mobile. All links come from footer-links.ts — nothing here is
 * hardcoded except the brand description and copyright year logic.
 */
export function Footer() {
 const year = 2026;

  return (
    <footer className="border-t border-white/10 bg-background/60">
      <Container className="py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
          {/* Brand column */}
          <div>
            <Link href="/" className="flex items-center gap-2.5" aria-label="CodeDock home">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400">
                <span className="font-mono text-sm font-semibold text-white">
                  &gt;_
                </span>
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-foreground">
                Code<span className="text-muted-foreground">Dock</span>
              </span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Every developer tool you need, docked in one clean, fast
              workspace.
            </p>

            <div className="mt-5 flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = ICONS[social.label as keyof typeof ICONS];
                return (
                  <a
                    key={social.href}
                    href={social.href}
                    target={social.external ? "_blank" : undefined}
                    rel={social.external ? "noreferrer" : undefined}
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors duration-200 hover:border-white/20 hover:text-foreground"
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : social.label}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((column) => (
            <FooterColumn key={column.title} column={column} />
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col-reverse items-center gap-4 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; {year} CodeDock. All rights reserved.
          </p>

          {LEGAL_LINKS.length > 0 && (
            <nav aria-label="Legal" className="flex items-center gap-6">
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
