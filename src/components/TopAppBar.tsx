"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";

export function TopAppBar({
  title,
  onBack,
  action,
  showUser = true,
}: {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
  showUser?: boolean;
}) {
  return (
    <header className="sticky top-0 z-10 flex min-h-[56px] items-center gap-3 bg-white px-4 py-2 border-b border-border/40">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#1a1a1a] hover:bg-black/5"
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </button>
      ) : (
        <div className="w-2" />
      )}
      <h1 className="flex-1 text-center text-lg font-bold text-[#1a1a1a]">{title}</h1>
      {action ? (
        action
      ) : showUser ? (
        <Link
          href="/profile"
          aria-label="Profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1b5e20] text-white hover:opacity-90"
        >
          <User aria-hidden="true" size={18} />
        </Link>
      ) : (
        <div className="w-9" />
      )}
    </header>
  );
}
