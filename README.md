# StokvelOS

StokvelOS gives stokvels a shared, tamper-evident ledger and payout scheduler, so every member always knows where their money is.

## Links

- **Live app:** https://stokvelos-mu.vercel.app
- **Capstone repo:** https://github.com/ThamiSithole/stokvelos
- **Issues:** https://github.com/ThamiSithole/stokvelos/issues
- **Portfolio repo:** https://github.com/ThamiSithole/thami-sithole-portfolio
- **Portfolio live site:** https://thami-sithole-portfolio.vercel.app
- **Stitch designs:** https://stitch.google.com/projects/9928979343368528728 — PNG exports live in [`docs/designs/`](docs/designs/) (`M1`–`M7` flows, `S1`–`S13` screens)
- **Screenshots:** live app above; design references: [sign-up](docs/designs/S2.png) · [log-in](docs/designs/S3.png) · [my stokvels](docs/designs/S4.png) · [members](docs/designs/S10.png) · [settings](docs/designs/S12.png)

## Current status

- Hosted Supabase project is live with schema, RLS and auth migrations applied.
- Accounts/roles and groups (including invites) are live. The contributions ledger, payout scheduling and audit/disputes are tracked in [#10](https://github.com/ThamiSithole/stokvelos/issues/10), [#8](https://github.com/ThamiSithole/stokvelos/issues/8) and [#2](https://github.com/ThamiSithole/stokvelos/issues/2).
- The demo seed migration is intentionally skipped in production; production accounts are created by signing up.
- Smoke check (24 Nov): `/`, `/log-in`, `/sign-up` and `/privacy` returned HTTP 200; `/stokvels` redirects to log-in when signed out.

## Accounts

There are no shared demo logins in production. Sign up at https://stokvelos-mu.vercel.app/sign-up with your email, confirm via the link in the confirmation email, then log in at https://stokvelos-mu.vercel.app/log-in. A new account starts with no groups, so create your first stokvel to try the organizer flows. Confirmation and password-reset links currently fall back to localhost ([#39](https://github.com/ThamiSithole/stokvelos/issues/39)); until that is fixed, the email link may not return you to the live app.

For local development only, `supabase/migrations/0005_seed.sql` creates example personas with a fixed test password. Set `SEED_TEST_PASSWORD` in `.env.local` to that same value to run the integration tests. Never use those credentials against production.

## Tech stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Supabase (Postgres, Auth, RLS)
- Vitest + Playwright, with the Supabase CLI for DB tests
- Vercel (production hosting) and GitHub Actions (CI and deploys)
- Node.js 22+ recommended (CI currently uses Node 20; see [#41](https://github.com/ThamiSithole/stokvelos/issues/41))

## Architecture

Responsive, desktop-first web application (no installable PWA or native app in v1). Next.js App Router with server components; Supabase via `@supabase/ssr` helpers (`src/lib/supabase`). Data access protected by Row Level Security. Audit log written only by DB triggers. See [ADR-0001](docs/decisions/ADR-0001-web-first-v1.md) for the platform decision.

See [`docs/PRD.md`](docs/PRD.md) and [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md).

## Run locally

```bash
npm ci
cp .env.example .env.local
npx supabase start
npx supabase db reset   # applies 0001–0006; 0005 adds local-only demo personas
# copy the local URL and anon key from `npx supabase status` into .env.local
# SUPABASE_SERVICE_ROLE_KEY is server-side only; SEED_TEST_PASSWORD is local-seed only
npm run dev
```

## Test and build

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:integration   # needs local Supabase + SEED_TEST_PASSWORD
npm run test:e2e           # needs a running dev server
```

`npm run check` runs lint, typecheck, unit tests, `supabase test db`, integration tests and build. It needs the Supabase CLI, a running local database and `SEED_TEST_PASSWORD`; CI runs only lint, typecheck, unit tests and build.

## CI and deployment

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs lint, typecheck, tests and build on pushes and PRs to `main`.
- [`.github/workflows/vercel-deploy.yml`](.github/workflows/vercel-deploy.yml) deploys every push to `main` (or a manual trigger) to Vercel production with `vercel pull`, `vercel build --prod` and `vercel deploy --prebuilt --prod`. It uses the repo secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`. The Vercel project has no native Git integration linked, so there is no double deploy.

## Known issues

- [#11](https://github.com/ThamiSithole/stokvelos/issues/11) — E2E suite and final smoke tests still outstanding.
- [#39](https://github.com/ThamiSithole/stokvelos/issues/39) — sign-up and password-reset email links fall back to localhost.
- [#41](https://github.com/ThamiSithole/stokvelos/issues/41) — CI still runs on Node 20; Node 22+ is planned.
- [#42](https://github.com/ThamiSithole/stokvelos/issues/42) — npm audit advisories need triage.

## Docs

- [`BUSINESS.md`](BUSINESS.md)
- [`docs/PRD.md`](docs/PRD.md)
- [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md)
- [`docs/CHECKIN_SUBMISSION.md`](docs/CHECKIN_SUBMISSION.md)
- [`docs/designs/`](docs/designs/)
- Brand: [`BRAND_GUIDELINES.md`](docs/brand/kit/BRAND_GUIDELINES.md) · [`concepts.md`](docs/brand/concepts.md) · [`research.md`](docs/brand/research.md)
