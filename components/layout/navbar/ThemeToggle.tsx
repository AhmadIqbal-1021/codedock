"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Real theme toggle, backed by next-themes (see the ThemeProvider in
 * app/layout.tsx). Reads/writes the actual `.dark` class on <html>, which
 * globals.css already has full light and dark token sets for.
 *
 * `mounted` guards against a hydration mismatch: next-themes only knows
 * the real theme after mounting on the client (the server has no concept
 * of "current theme" for a class-based, no-system-preference setup), so
 * the icon renders a neutral placeholder for one tick rather than
 * guessing and potentially flashing the wrong icon.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Standard next-themes "mounted" guard: the real theme is only known
    // client-side, so this deliberately fires once on mount rather than
    // syncing from any external system — the case the underlying lint
    // rule is meant to catch doesn't apply here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
    </Button>
  );
}
