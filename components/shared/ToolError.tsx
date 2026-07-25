import { AlertCircle } from "lucide-react";

type ToolErrorProps = {
  title?: string;
  message: string;
};

export function ToolError({
  title = "Error",
  message,
}: ToolErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-500/30 bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950/30 dark:text-red-200"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

        <div className="min-w-0">
          <p className="font-semibold">
            {title}
          </p>

          <p className="mt-1 text-red-800/80 dark:text-red-200/80">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ToolError;