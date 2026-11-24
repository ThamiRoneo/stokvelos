"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import type { Member, Stokvel } from "@/lib/api/types";

export function StokvelCard({
  stokvel,
  memberCount,
  location,
}: {
  stokvel: Stokvel;
  memberCount?: number;
  location?: string;
}) {
  return (
    <Link
      href={`/stokvels/${stokvel.id}`}
      className="block rounded-xl border border-border bg-surface p-4 hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
    >
      <h3>{stokvel.name}</h3>
      {stokvel.description && (
        <p className="mt-1 text-sm text-text-secondary">{stokvel.description}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
        <span>{memberCount ?? 0} members</span>
        {location && <span>{location}</span>}
        <span className="font-medium text-text">
          R{stokvel.contributionAmount}/{stokvel.contributionFrequency === "weekly" ? "week" : "month"}
        </span>
      </div>
    </Link>
  );
}

export function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface p-4", className)}>
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function MemberRow({
  member,
  canRemove = false,
  onRemove,
}: {
  member: Member;
  canRemove?: boolean;
  onRemove?: (member: Member) => void;
}) {
  const initials = member.fullName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
      >
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{member.fullName}</p>
          <Badge tone={member.role === "organizer" ? "primary" : "neutral"}>
            {member.role}
          </Badge>
        </div>
        <p className="text-xs text-text-secondary">
          Joined{" "}
          <time dateTime={member.joinedAt}>
            {new Date(member.joinedAt).toLocaleDateString("en-ZA")}
          </time>
        </p>
      </div>
      {canRemove && onRemove && (
        <button
          type="button"
          onClick={() => onRemove(member)}
          className="min-h-touch rounded-lg px-3 text-sm font-medium text-error hover:bg-error/5"
        >
          Remove
        </button>
      )}
    </div>
  );
}
