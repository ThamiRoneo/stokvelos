import { cn } from "@/lib/utils";

export function Spinner({
  size = "sm",
  label = "Loading",
}: {
  size?: "sm" | "lg";
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
        size === "sm" ? "h-4 w-4" : "h-8 w-8",
      )}
    />
  );
}
