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
 * The three link columns (Product, Resources, Company). Footer.tsx
 * only maps over this array — add, remove, or reorder links here.
 */
export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      {
 label: "Developer Tools",
 href: "/tools/developer-tools",
},
{
 label: "AI Tools",
 href: "/tools/ai-tools",
},
{
 label: "Resume Tools",
 href: "/tools/resume-tools",
},
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Documentation", href: "/docs" },
      { label: "Changelog", href: "/changelog" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
      { label: "Status", href: "/status" },
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
