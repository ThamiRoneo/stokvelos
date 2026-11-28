"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  CalendarDays,
  ScrollText,
  User,
  MoreVertical,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TabName = "Home" | "Ledger" | "Payouts" | "Audit" | "Profile";

const tabs: { label: TabName; icon: LucideIcon; stokvelPath?: string }[] = [
  { label: "Home", icon: Home },
  { label: "Ledger", icon: BookOpen, stokvelPath: "ledger" },
  { label: "Payouts", icon: CalendarDays, stokvelPath: "payouts" },
  { label: "Audit", icon: ScrollText, stokvelPath: "audit" },
  { label: "Profile", icon: User },
];

function getHref(label: TabName, stokvelPath: string | undefined, stokvelId?: string): string {
  if (label === "Home") return "/stokvels";
  if (label === "Profile") return "/profile";
  if (stokvelId && stokvelPath) return `/stokvels/${stokvelId}/${stokvelPath}`;
  return "/stokvels";
}

export function AppNav({
  active,
  stokvelId,
  userName = "N. Khumalo",
  userInitials = "NK",
  userRole = "Pool Treasurer",
}: {
  active?: TabName;
  stokvelId?: string;
  userName?: string;
  userInitials?: string;
  userRole?: string;
}) {
  const pathname = usePathname();
  const stokvelIdFromPath = pathname.match(/\/stokvels\/([^/]+)/)?.[1];
  const effectiveStokvelId = stokvelId ?? stokvelIdFromPath;

  function isActive(label: TabName): boolean {
    if (active) return label === active;
    if (label === "Home") return pathname === "/stokvels" || pathname.startsWith("/stokvels") && !pathname.includes("/ledger") && !pathname.includes("/payouts") && !pathname.includes("/audit") && !pathname.includes("/members") && !pathname.includes("/settings");
    if (label === "Ledger") return pathname.includes("/ledger");
    if (label === "Payouts") return pathname.includes("/payouts");
    if (label === "Audit") return pathname.includes("/audit");
    if (label === "Profile") return pathname === "/profile";
    return false;
  }

  return (
    <>
      {/* ── LEFT SIDEBAR ≥1024px ── */}
      <aside className="hidden lg:flex flex-col w-[220px] min-h-dvh bg-surface border-r border-border shrink-0" aria-hidden="true">
        {/* Logo block */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c8e6c9]">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <rect x="2" y="5" width="18" height="2.5" rx="1.25" fill="#1b5e20" />
              <rect x="2" y="10" width="18" height="2.5" rx="1.25" fill="#1b5e20" />
              <rect x="2" y="15" width="18" height="2.5" rx="1.25" fill="#1b5e20" />
              <rect x="14" y="3" width="4" height="16" rx="2" fill="#f9a825" opacity="0.85" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">
              <span className="text-text">Stokvel</span>
              <span className="text-primary">OS</span>
            </p>
            <p className="text-[10px] text-text-secondary leading-tight">R2-B Refined Ledger</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Sidebar navigation">
          {tabs.map(({ label, icon: Icon, stokvelPath }) => {
            const href = getHref(label, stokvelPath, effectiveStokvelId);
            const enabled = label === "Home" || label === "Profile" || Boolean(effectiveStokvelId);
            const active = isActive(label);

            if (!enabled) {
              return (
                <span
                  key={label}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-disabled cursor-not-allowed"
                  aria-disabled="true"
                >
                  <Icon size={20} aria-hidden="true" />
                  {label}
                </span>
              );
            }

            return (
              <Link
                key={label}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:bg-black/5 hover:text-text",
                )}
              >
                <Icon size={20} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="flex items-center gap-3 px-4 py-4 border-t border-border">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text truncate">{userName}</p>
            <p className="text-[11px] text-text-secondary truncate">{userRole}</p>
          </div>
          <button
            type="button"
            aria-label="More options"
            className="text-text-secondary hover:text-text"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </aside>

      {/* ── COMPACT ICON RAIL 768–1023px ── */}
      <aside className="hidden md:flex lg:hidden flex-col w-16 min-h-dvh bg-surface border-r border-border shrink-0 items-center py-4 gap-6" aria-hidden="true">
        {/* Logo icon only */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c8e6c9]">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <rect x="2" y="5" width="18" height="2.5" rx="1.25" fill="#1b5e20" />
            <rect x="2" y="10" width="18" height="2.5" rx="1.25" fill="#1b5e20" />
            <rect x="2" y="15" width="18" height="2.5" rx="1.25" fill="#1b5e20" />
            <rect x="14" y="3" width="4" height="16" rx="2" fill="#f9a825" opacity="0.85" />
          </svg>
        </div>

        {/* Icons */}
        <nav className="flex flex-col gap-2" aria-label="Icon navigation">
          {tabs.map(({ label, icon: Icon, stokvelPath }) => {
            const href = getHref(label, stokvelPath, effectiveStokvelId);
            const enabled = label === "Home" || label === "Profile" || Boolean(effectiveStokvelId);
            const active = isActive(label);

            if (!enabled) {
              return (
                <span
                  key={label}
                  aria-disabled="true"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-disabled cursor-not-allowed"
                >
                  <Icon size={20} aria-hidden="true" />
                </span>
              );
            }

            return (
              <Link
                key={label}
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-primary text-white" : "text-text-secondary hover:bg-black/5",
                )}
              >
                <Icon size={20} aria-hidden="true" />
              </Link>
            );
          })}
        </nav>

        {/* User initials */}
        <div className="mt-auto flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
          {userInitials}
        </div>
      </aside>

      {/* ── BOTTOM NAV <768px ── */}
      <nav
        aria-label="Primary"
        className="fixed bottom-0 left-0 right-0 z-10 grid grid-cols-5 border-t border-border bg-surface md:hidden"
      >
        {tabs.map(({ label, icon: Icon, stokvelPath }) => {
          const href = getHref(label, stokvelPath, effectiveStokvelId);
          const enabled = label === "Home" || label === "Profile" || Boolean(effectiveStokvelId);
          const active = isActive(label);

          if (!enabled) {
            return (
              <span
                key={label}
                aria-disabled="true"
                className="flex min-h-[56px] flex-col items-center justify-center gap-1 text-[10px] text-disabled"
              >
                <Icon size={20} aria-hidden="true" />
                {label}
              </span>
            );
          }

          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[56px] flex-col items-center justify-center gap-1 text-[10px]",
                active ? "font-semibold text-primary" : "text-text-secondary",
              )}
            >
              <Icon size={20} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
