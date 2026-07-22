export interface NavLinkItem {
  label: string;
  href: string;
}

/**
 * Single source of truth for primary navigation.
 * Both the desktop center-nav and the mobile slide-out
 * render from this list, so links never drift out of sync.
 */
export const NAV_LINKS: NavLinkItem[] = [
  { label: "Developer Tools", href: "/developer-tools" },
  { label: "AI Tools", href: "/ai-tools" },
  { label: "Resume Tools", href: "/resume-tools" },
  { label: "Blog", href: "/blog" },
];
