"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

export function TopAppBar({
  title,
  onBack,
  action,
}: {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 flex min-h-touch items-center gap-3 border-b border-border bg-surface px-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-touch w-touch items-center justify-center rounded-lg text-text hover:bg-text/5"
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </button>
      )}
      <h1 className="flex-1 truncate text-lg font-bold">{title}</h1>
      {action}
    </header>
  );
}
