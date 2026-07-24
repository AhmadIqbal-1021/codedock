import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ToolAction {
  /** Button label, also used as the default accessible name. */
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  /** Any shadcn Button variant — inherited from Button so the two never drift apart. */
  variant?: ComponentProps<typeof Button>["variant"];
}

interface ToolToolbarProps {
  actions: ToolAction[];
  /** Extra controls (e.g. a segmented option toggle) rendered after the
   *  actions and pushed to the end of the row. Purely a layout slot —
   *  ToolToolbar has no opinion on what goes here. */
  children?: ReactNode;
  className?: string;
}

/**
 * Generic action bar for any tool page (JSON Formatter, Regex Tester,
 * JWT Decoder, ...). Renders a row of buttons from `actions` — no
 * tool-specific logic lives here, only presentation and layout.
 * Wraps on small screens and stays a single row from `sm:` up.
 */
export function ToolToolbar({ actions, children, className }: ToolToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Tool actions"
      className={cn("flex flex-wrap items-center gap-3", className)}
    >
      {actions.map(({ label, icon: Icon, onClick, disabled, variant = "default" }) => (
        <Button
          key={label}
          type="button"
          variant={variant}
          onClick={onClick}
          disabled={disabled}
          aria-disabled={disabled}
          className={cn(
            "rounded-full",
            variant === "default" &&
              "bg-gradient-to-r from-indigo-500 to-cyan-400 text-white hover:opacity-90",
            variant === "outline" && "border-white/15 bg-transparent"
          )}
        >
          {Icon && <Icon className="mr-1.5 h-4 w-4" aria-hidden />}
          {label}
        </Button>
      ))}

      {children && <div className="ml-auto flex items-center gap-3">{children}</div>}
    </div>
  );
}

export default ToolToolbar;
