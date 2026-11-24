"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "outline";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

const variants: Record<Variant, string> = {
  primary: "bg-[#1b5e20] text-white hover:bg-[#2e7d32] shadow-sm",
  secondary: "border border-gray-200 bg-white text-[#1a1a1a] hover:bg-gray-50 shadow-xs",
  outline: "border border-[#1b5e20] bg-white text-[#1b5e20] hover:bg-[#1b5e20]/5",
  ghost: "bg-transparent text-[#1a1a1a] hover:bg-black/5",
  destructive: "bg-[#c62828] text-white hover:bg-[#c62828]/90 shadow-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", loading = false, disabled, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={rest.type ?? "button"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold",
        "transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b5e20] focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        variants[variant],
        className,
      )}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
});
