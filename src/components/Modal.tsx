"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-lg"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-touch w-touch items-center justify-center rounded-lg text-text-secondary hover:bg-text/5"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
