"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { NavLink } from "./NavLink";
import { ThemeToggle } from "./ThemeToggle";
import { NAV_LINKS } from "./nav-links";

/**
 * Mobile-only hamburger + slide-out panel. Reuses NAV_LINKS and NavLink
 * so mobile and desktop navigation can never fall out of sync.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 rounded-full text-foreground hover:bg-foreground/5"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[300px] border-l border-white/10 bg-background/95 backdrop-blur-xl p-0 flex flex-col"
      >
        <SheetHeader className="border-b border-white/10 px-5 py-4">
          <SheetTitle asChild>
            <Logo onNavigate={close} />
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 px-5 py-6" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              {...link}
              onNavigate={close}
              className="py-2.5 text-base"
            />
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-white/10 px-5 py-5">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              aria-label="Search tools"
              asChild
            >
              <Link href="/tools" onClick={close}>
                <Search className="h-[18px] w-[18px]" />
              </Link>
            </Button>
            <ThemeToggle />
          </div>

          <Button
            variant="outline"
            className="w-full justify-center gap-2 rounded-full border-white/15 bg-transparent"
            asChild
          >
            <a href="https://github.com" target="_blank" rel="noreferrer">
              <FaGithub className="h-4 w-4" />
              GitHub
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
