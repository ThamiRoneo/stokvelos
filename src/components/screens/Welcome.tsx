import Link from "next/link";

import { Logo } from "@/components/Logo";

const PITCH =
  "StokvelOS gives stokvels a shared, tamper-evident ledger and payout scheduler, so every member always knows where their money is.";

/** S1 — Welcome (PRD §8.1). Logged out only. */
export function Welcome() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <Logo />
      <p className="text-base leading-6 text-text-secondary">{PITCH}</p>
      <div className="flex w-full flex-col gap-3">
        <Link
          href="/sign-up"
          className="inline-flex min-h-touch items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface hover:bg-primary-light"
        >
          Sign up
        </Link>
        <Link
          href="/log-in"
          className="inline-flex min-h-touch items-center justify-center rounded-lg border border-primary bg-surface px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
