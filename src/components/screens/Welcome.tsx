import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/Badge";
import { Logo } from "@/components/Logo";

const PITCH =
  "StokvelOS gives stokvels a shared, tamper-evident ledger and payout scheduler, so every member always knows where their money is.";

/** S1 — Welcome (PRD §8.1). Logged out only. */
export function Welcome() {
  return (
    <main className="mx-auto flex min-h-dvh w-full flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/15">
          <Logo showWordmark={false} />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-text">
          Stokvel <span className="text-primary">OS</span>
        </h1>
        <p className="mt-1 text-xs font-medium tracking-[0.2em] text-text-secondary uppercase">
          COLLECTIVE WEALTH PROTOCOL
        </p>
      </div>

      <section className="mt-8 w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <p className="text-center text-base leading-6 text-text">{PITCH}</p>

        <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-4 py-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary"
            />
            <div className="text-left">
              <p className="text-xs text-text-secondary">Consensus Layer</p>
              <p className="text-sm font-semibold text-text">
                Dual-Audited Rotation Engine
              </p>
            </div>
          </div>
          <Badge tone="primary">Live Verifier</Badge>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/sign-up"
            className="inline-flex min-h-touch w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-primary-light"
          >
            Sign up
          </Link>
          <Link
            href="/log-in"
            className="inline-flex min-h-touch w-full items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
          >
            Log in
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 border-t border-border pt-5 text-xs text-text-secondary">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>End-to-End Cryptographic Ledger</span>
        </div>
      </section>

      <p className="mt-6 text-center text-xs text-text-secondary">
        Engineered for rotational credit unions, burial societies, and investment pools.
      </p>
    </main>
  );
}
