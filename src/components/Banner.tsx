import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "info" | "alert" | "error" | "success" | "staleness";

const variants: Record<Variant, string> = {
  info: "border-primary/30 bg-primary/5 text-text",
  alert: "border-warning bg-warning/10 text-text",
  error: "border-error bg-error/5 text-error",
  success: "border-success bg-success/5 text-success",
  staleness: "border-warning bg-warning/10 text-text",
};

export function Banner({
  children,
  variant = "info",
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <div
      role={variant === "error" || variant === "alert" ? "alert" : "status"}
      className={cn("rounded-lg border px-3 py-2 text-sm", variants[variant])}
    >
      {children}
    </div>
  );
}
