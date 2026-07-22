"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Presentation-only theme toggle. Swaps the icon on click so the
 * control feels alive in a demo, but wire this up to your actual
 * theme provider (e.g. next-themes) before shipping.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setIsDark((prev) => !prev)}
    >
      {isDark ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
    </Button>
  );
}
