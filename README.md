# StokvelOS

StokvelOS gives stokvels a shared, tamper-evident ledger and payout scheduler, so every member always knows where their money is.

## Links

- **Live app:** https://stokvelos-mu.vercel.app
- **Capstone repo:** https://github.com/ThamiSithole/stokvelos
- **Portfolio repo:** https://github.com/ThamiSithole/thami-sithole-portfolio
- **Portfolio live site:** https://thami-sithole-portfolio.vercel.app
- **Stitch designs:** https://stitch.google.com/projects/9928979343368528728 — PNG exports live in [`docs/designs/`](docs/designs/) (`M1`–`M7` flows, `S1`–`S13` screens)
- **Screenshots:** No static capture yet — see the live app above and the design exports for the intended UI.

## Current status

- Hosted Supabase project is live with schema, RLS and auth migrations applied.
- Accounts/roles and groups (including invites) are live. The contributions ledger, payout scheduling and audit/disputes are tracked in [#10](https://github.com/ThamiSithole/stokvelos/issues/10), [#8](https://github.com/ThamiSithole/stokvelos/issues/8) and [#2](https://github.com/ThamiSithole/stokvelos/issues/2).
- The demo seed migration is intentionally skipped in production; production accounts are created by signing up.

## Accounts

There are no shared demo logins in production. Sign up at https://stokvelos-mu.vercel.app/sign-up with your email, confirm via the link in the confirmation email, then log in at https://stokvelos-mu.vercel.app/log-in. A new account starts with no groups, so create your first stokvel to try the organizer flows.

For local development only, `supabase/migrations/0005_seed.sql` creates example personas; the password comes from `SEED_TEST_PASSWORD` in your local `.env.local`. Never use those credentials against production.

## Tech stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Supabase (Postgres, Auth, RLS)
- Vitest + Playwright, with the Supabase CLI for DB tests
- Vercel (production hosting) and GitHub Actions (CI and deploys)
- Node.js 22+ recommended (CI currently uses Node 20; see [#41](https://github.com/ThamiSithole/stokvelos/issues/41))

## Architecture

Mobile-first PWA. Next.js App Router with server components; Supabase via `@supabase/ssr` helpers (`src/lib/supabase`). Data access protected by Row Level Security. Audit log written only by DB triggers.

See [`docs/PRD.md`](docs/PRD.md) and [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md).

## Run locally

```bash
npm ci
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and
# SUPABASE_SERVICE_ROLE_KEY (server-side only); SEED_TEST_PASSWORD is local-seed only
npm run dev
```

## Test and build

```bash
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:e2e
npm run build
```

`npm run check` additionally runs `supabase test db` (requires the Supabase CLI and a local database).

## CI and deployment

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs lint, typecheck, tests and build on pushes and PRs to `main`.
- [`.github/workflows/vercel-deploy.yml`](.github/workflows/vercel-deploy.yml) deploys every push to `main` (or a manual trigger) to Vercel production with `vercel pull`, `vercel build --prod` and `vercel deploy --prebuilt --prod`. It uses the repo secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`. The Vercel project has no native Git integration linked, so there is no double deploy.

## Known issues

- [#39](https://github.com/ThamiSithole/stokvelos/issues/39) — sign-up and password-reset email links fall back to localhost.
- [#41](https://github.com/ThamiSithole/stokvelos/issues/41) — CI still runs on Node 20; Node 22+ is planned.
- [#42](https://github.com/ThamiSithole/stokvelos/issues/42) — npm audit advisories need triage.

## Docs

- [`BUSINESS.md`](BUSINESS.md)
- [`docs/PRD.md`](docs/PRD.md)
- [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md)
- [`docs/CHECKIN_SUBMISSION.md`](docs/CHECKIN_SUBMISSION.md)
- [`docs/designs/`](docs/designs/)
