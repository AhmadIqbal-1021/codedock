export interface NavLinkItem {
  label: string;
  href: string;
}

/**
 * Single source of truth for primary navigation.
 * Both the desktop center-nav and the mobile slide-out
 * render from this list, so links never drift out of sync.
 *
 * Deliberately kept to real, working destinations only — a nav item to a
 * route that 404s is worse for trust than a short nav. "Tools" now points
 * at the real /tools directory (search + category filtering), added in
 * Phase C; "Categories" still anchors to the homepage's category grid,
 * which is itself real, working content.
 */
export const NAV_LINKS: NavLinkItem[] = [
  { label: "Tools", href: "/tools" },
  { label: "Categories", href: "/#categories" },
];
