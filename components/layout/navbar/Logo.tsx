import Link from "next/link";

interface LogoProps {
  onNavigate?: () => void;
}

/**
 * CodeDock wordmark + icon.
 * The icon is a rounded "dock" square holding a code caret, with a
 * slim animated cursor bar as the one signature flourish in the navbar.
 */
export function Logo({ onNavigate }: LogoProps) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="group flex items-center gap-2.5 shrink-0"
      aria-label="CodeDock home"
    >
      <span
        className="relative flex h-9 w-9 items-center justify-center rounded-lg
          bg-gradient-to-br from-indigo-500 to-cyan-400
          shadow-[0_0_0_1px_rgba(255,255,255,0.08)]
          transition-transform duration-300 ease-out
          group-hover:scale-105 group-hover:rotate-3"
      >
        <span className="font-mono text-sm font-semibold text-white">
          &gt;_
        </span>
        <span className="absolute right-1.5 bottom-1.5 h-1 w-1.5 rounded-[1px] bg-white/90 animate-pulse" />
      </span>

      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        Code<span className="text-muted-foreground">Dock</span>
      </span>
    </Link>
  );
}
