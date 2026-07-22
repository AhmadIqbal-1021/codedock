import { Search } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { NavLink } from "./NavLink";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";  
import { NAV_LINKS } from "./nav-links";

/**
 * CodeDock primary navigation.
 * - Sticky + glassmorphism surface, 3-column desktop layout
 * - Collapses to a slide-out Sheet below `md`
 * - All interactive pieces are Button/Sheet from shadcn/ui, icons from lucide-react
 */
export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: logo */}
        <Logo />

        {/* Center: primary nav (desktop only) */}
        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex"
          aria-label="Primary"
        >
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5">
          <div className="hidden items-center gap-1 md:flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              aria-label="Search"
            >
              <Search className="h-[18px] w-[18px]" />
            </Button>

            <ThemeToggle />

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              aria-label="View source on GitHub"
              asChild
            >
              <a href="https://github.com" target="_blank" rel="noreferrer">
                <FaGithub className="h-[18px] w-[18px]" />
              </a>
            </Button>

            <Button
              className="ml-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 px-5 text-white shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset] transition-opacity hover:opacity-90"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile: hamburger + slide-out */}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

export default Navbar;
