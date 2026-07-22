"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavLinkItem } from "./nav-links";

interface NavLinkProps extends NavLinkItem {
  onNavigate?: () => void;
  className?: string;
}

/**
 * Single nav link used by both the desktop center nav and the
 * mobile slide-out. Active route gets a solid underline; inactive
 * routes get an underline that grows in from the center on hover.
 */
export function NavLink({ label, href, onNavigate, className }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative text-sm font-medium transition-colors duration-200",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {label}
      <span
        className={cn(
          "pointer-events-none absolute -bottom-1 left-1/2 h-[1.5px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300 ease-out",
          isActive ? "w-full" : "w-0 group-hover:w-full"
        )}
      />
    </Link>
  );
}
