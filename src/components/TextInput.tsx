"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  badge?: string;
};

export function TextInput({
  label,
  error,
  hint,
  id,
  className,
  leadingIcon,
  trailingIcon,
  badge,
  ...rest
}: TextInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-sm font-semibold text-[#1a1a1a]">
          {label}
        </label>
        {badge && (
          <span className="text-xs text-[#5f6368] font-medium">{badge}</span>
        )}
      </div>
      <div className="relative flex items-center">
        {leadingIcon && (
          <span className="pointer-events-none absolute left-3.5 flex items-center text-[#5f6368]">
            {leadingIcon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={cn(
            "min-h-[48px] w-full rounded-xl border bg-[#f3f4f6]/60 px-3.5 py-2.5 text-sm text-[#1a1a1a] transition-colors",
            "placeholder:text-[#9ca3af] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1b5e20]/20 focus:border-[#1b5e20]",
            leadingIcon && "pl-11",
            trailingIcon && "pr-11",
            error ? "border-[#c62828] bg-[#c62828]/5" : "border-transparent hover:border-gray-300",
            rest.disabled && "bg-gray-100 text-[#9ca3af] cursor-not-allowed",
            className,
          )}
          {...rest}
        />
        {trailingIcon && (
          <div className="absolute right-3 flex items-center text-[#5f6368]">
            {trailingIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-[#c62828]">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-[#5f6368]">
          {hint}
        </p>
      )}
    </div>
  );
}
