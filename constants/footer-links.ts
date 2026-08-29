export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

/**
 * Footer link columns. Deliberately trimmed to real, working
 * destinations only. There used to be Resources (Blog/Docs/Changelog/
 * Support) and Company (About/Careers/Contact/Status) columns here,
 * but none of those pages exist yet — a footer link that 404s does
 * more damage to trust (and to how Google reads the site) than a
 * short footer. Add columns back as the real pages ship.
 */
export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Explore",
    links: [
      { label: "All Tools", href: "/tools" },
      { label: "Categories", href: "/#categories" },
    ],
  },
];

/** Legal links shown in the footer's bottom bar. */
export const LEGAL_LINKS: FooterLink[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

/** External/social links, e.g. GitHub, shown in the brand column. */
export const SOCIAL_LINKS: FooterLink[] = [
  { label: "GitHub", href: "https://github.com/codedock", external: true },
];
