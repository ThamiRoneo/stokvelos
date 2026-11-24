import type { ReactNode } from "react";

export function EmptyState({
  icon,
  message,
  actions,
}: {
  icon?: ReactNode;
  message: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-5 py-10 text-center">
      {icon}
      <p className="text-sm text-text-secondary">{message}</p>
      {actions && <div className="flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
