# Implementation Plan — StokvelOS

Phased delivery. Each phase follows TDD: write failing test → implement → refactor → commit. Acceptance criteria are listed per phase.

## M1 — Setup (scaffolding) — ⏳ this PR
- Next.js 15 App Router + TS + Tailwind + shadcn/ui
- Supabase client helpers (`src/lib/supabase/client.ts`, `server.ts`)
- Vitest + Playwright configs + sample tests
- CI workflow (lint, typecheck, test, build)
- README, docs, GitHub issues
- **Acceptance:** `npm run lint && npm run typecheck && npm run test && npm run build` all pass; CI green on PR.

## M2 — Groups + RLS
- Supabase schema: `profiles`, `stokvels`, `stokvel_members`, `invites`
- RLS policies: members see only their groups; organizer-only writes
- Auth flows (sign up/in/out), profile, create stokvel, invite link, join
- TDD: unit tests for validators; e2e for create/join
- **Acceptance:** user can sign up, create stokvel, invite, join; RLS prevents cross-group reads.

## M3 — Contributions
- Schema: `contributions` (member, amount, period, unique per member+period)
- Record contribution, group ledger, member statement, balances per cycle
- Audit trigger on insert
- TDD: validators (amount 0.01–1,000,000), duplicate-period handling
- **Acceptance:** organizer records contribution; audit entry created; member sees statement.

## M4 — Payouts
- Schema: `payouts` (member, amount, scheduled_date, paid_at, status)
- Rotation order, schedule, mark paid, upcoming payouts
- TDD: amount validation (≤10,000,000), BR7 removal block
- **Acceptance:** schedule + mark paid records paid_at + audit entry.

## M5 — Audit + Disputes
- Schema: `audit_log` (immutable, trigger-written), `disputes`
- View audit log, raise/resolve dispute
- DB-level immutability (no UPDATE/DELETE)
- TDD: immutability tests, dispute lifecycle
- **Acceptance:** audit log read-only; dispute resolved by organizer only.

## M6 — Polish
- Reminders/notifications (in-app), export CSV/PDF, offline cache + staleness
- Accessibility, performance, low-data

## M7 — Test & Deploy
- Full e2e suite, Supabase prod project, Vercel deploy, smoke tests
- **Acceptance:** live URL works; check-in submission updated with live link.

---

## Design & Stitch (cross-cutting, M1)
- Design tokens (colors, typography, spacing, icons) per PRD §9; implement as Tailwind theme + CSS variables.
- Stitch exports saved to `docs/designs/` (user produces in Stitch; tracked in repo).
- Responsive mobile + desktop; low-data (minimal images, cached data).
- Accessibility (PRD §8.4): WCAG AA contrast, ≥44px targets, labels, reduced-motion.

## RLS policy table (M2)
| Table | Read | Write |
|---|---|---|
| profiles | own row only | own row only |
| stokvels | members of that stokvel | organizer only |
| stokvel_members | members of that stokvel | organizer only (BR7 guard on remove) |
| invitations | organizer | organizer; join via RPC validating token+expiry (BR6) |
| contributions | members of that stokvel | organizer only |
| payouts | members of that stokvel | organizer only |
| disputes | members of that stokvel | any member (insert); organizer only (resolve) (BR10) |
| audit_log | members of that stokvel | none from app (triggers only, BR9); immutable (BR8) |

## Screens & UI states (PRD §8)
- S1 Welcome, S2 Sign Up, S3 Log In, S4 My Stokvels, S5 Create Stokvel, S6 Join via Invite, S7 Stokvel Home, S8 Contributions Ledger, S9 Payouts, S10 Members, S11 Audit Log, S12 Stokvel Settings, S13 Profile/Settings.
- Modals M1–M7 (Record Contribution, Schedule Payout, Raise Dispute, Delete Account, Invite Member, Mark Payout Paid, Remove Member).
- Each screen implements Normal/Empty/Loading/Error/Offline/Success states; shared components (Button, TextInput, Card, Table, Badge, Banner, Modal, EmptyState, Spinner, TopAppBar, BottomNav).

## Notifications (in-app) (M4/M5)
- Payout due within 3 days → organizer + recipient.
- Contribution overdue → organizer + member.
- New member joined → organizer.
- Dispute raised → organizer.
- Dispute resolved → raising member.

## Edge cases (PRD §6.2)
- Invite expired/used (BR6); duplicate contribution for same period; member removal blocked on unpaid payout (BR7); invalid amounts (BR4/BR5); offline with/without cache; stale cache >24h (BR12); non-organizer 403; audit tamper blocked (BR8).

## Metrics & instrumentation (M7)
- Track on-time payout rate, dispute rate, member retention, treasurer admin time (survey), active stokvels (PRD §3.1 G1–G5).
- Post-use survey with ≥5 treasurers for G4.

## Open questions (PRD §14) — resolved/deferred
- Payment gateway for transaction fees (v2): PayFast vs Yoco — **deferred to v2**.
- Offline cache strategy: Workbox service worker — **decide in M6**.
- Vernacular language support (isiZulu/Setswana): **deferred to v2**; ship English v1, i18n-ready structure.

## Feature → goal mapping (PRD §4.1)
- F1 Accounts & roles → G3, G5
- F2 Stokvel groups → G5
- F3 Contributions ledger → G1, G2, G4
- F4 Payout schedule & tracking → G2, G4
- F5 Audit & dispute log → G1, G3
- F6 Reminders → G2, G4
- F7 Export & reports → G4
- F8 Offline & low-data → G5

## Testing strategy
- Unit tests: validators (amounts, BRs), pure functions.
- Integration: Supabase RLS + triggers (audit immutability).
- E2E (Playwright): auth, create/join, contribution, payout, dispute, audit read-only.
- Coverage target: ≥80% on `src/lib` and `src/app` server actions.
