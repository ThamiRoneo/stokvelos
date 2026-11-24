"use client";

import Link from "next/link";
import {
  CalendarDays,
  Home,
  ReceiptText,
  ScrollText,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TabName = "Home" | "Ledger" | "Payouts" | "Audit" | "Profile";

const tabs: { label: TabName; icon: LucideIcon; stokvelPath?: string }[] = [
  { label: "Home", icon: Home },
  { label: "Ledger", icon: ReceiptText, stokvelPath: "ledger" },
  { label: "Payouts", icon: CalendarDays, stokvelPath: "payouts" },
  { label: "Audit", icon: ScrollText, stokvelPath: "audit" },
  { label: "Profile", icon: User },
];

export function BottomNav({
  active,
  stokvelId,
}: {
  active: TabName;
  stokvelId?: string;
}) {
  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-10 grid grid-cols-5 border-t border-border bg-surface"
    >
      {tabs.map(({ label, icon: Icon, stokvelPath }) => {
        const isActive = label === active;
        const href =
          label === "Home"
            ? "/stokvels"
            : label === "Profile"
              ? stokvelId
                ? `/stokvels/${stokvelId}/members`
                : "/stokvels"
              : stokvelId
                ? `/stokvels/${stokvelId}/${stokvelPath}`
                : "/stokvels";
        const enabled = label === "Home" || Boolean(stokvelId);

        if (!enabled) {
          return (
            <span
              key={label}
              aria-disabled="true"
              className="flex min-h-touch flex-col items-center justify-center gap-1 text-xs text-disabled"
            >
              <Icon aria-hidden="true" size={20} />
              {label}
            </span>
          );
        }

        return (
          <Link
            key={label}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-touch flex-col items-center justify-center gap-1 text-xs",
              isActive ? "font-medium text-primary" : "text-text-secondary",
            )}
          >
            <Icon aria-hidden="true" size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
