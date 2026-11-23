# StokvelOS

StokvelOS gives stokvels a shared, tamper-evident ledger and payout scheduler, so every member always knows where their money is.

## Links

- **Live app:** _placeholder (Vercel deploy pending)_
- **Stitch designs:** https://stitch.google.com/projects/9928979343368528728 (exported assets to be added in `docs/designs/`)
- **Test logins:** _placeholder_
- **Screenshots:** _placeholder_

## Tech stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Supabase (Postgres, Auth, RLS)
- Vitest + Playwright
- Vercel (deploy)

## Architecture

Mobile-first PWA. Next.js App Router with server components; Supabase via `@supabase/ssr` helpers (`src/lib/supabase`). Data access protected by Row Level Security. Audit log written only by DB triggers.

See `docs/PRD.md` and `IMPLEMENTATION_PLAN.md`.

## Run locally

```bash
npm install
cp .env.example .env.local
# fill in Supabase keys
npm run dev
```

## Run tests

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

## Known issues

- Supabase project not yet created; env vars empty.
- Stitch design exports not yet added (project link above).
- Vercel deploy pending.

## Docs

- `BUSINESS.md`
- `docs/PRD.md`
- `IMPLEMENTATION_PLAN.md`
- `docs/CHECKIN_SUBMISSION.md`
