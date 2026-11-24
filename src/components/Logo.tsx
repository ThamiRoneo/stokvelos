import { cn } from "@/lib/utils";

/** R2-B "Refined ledger" — three ruled lines, one highlighted payout column,
 *  a subtle inward cycle arc. One-colour and reversed-safe. */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        role="img"
        aria-label="StokvelOS refined ledger logo"
      >
        <g fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round">
          <path d="M8 13h32M8 24h32M8 35h32" />
          <path d="M34 10v28" stroke="var(--color-secondary)" strokeWidth="5" />
          <path d="M10 36a16 16 0 0 1 20-24" strokeWidth="2" opacity="0.7" />
        </g>
      </svg>
      {showWordmark && <span className="text-2xl font-bold tracking-tight">StokvelOS</span>}
    </span>
  );
}
