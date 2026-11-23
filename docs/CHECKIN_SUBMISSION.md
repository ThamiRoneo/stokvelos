# Final Capstone Check-in (1/4) — StokvelOS

**Student:** Thami Sithole · **GitHub:** ThamiRoneo
**Business:** StokvelOS — transparent ledger & payout scheduler for stokvels
**Repo:** https://github.com/ThamiRoneo/stokvelos · **Status:** v0.1 draft (BUSINESS.md + PRD.md written; scaffolding next)

## Problem

Stokvels move an estimated **R50bn+ per year** for millions of low- and middle-income South African households, but they run on WhatsApp groups and memory: treasurers track contributions in notebooks or Excel, payouts are scheduled by hand, and there is no shared, tamper-evident record. Disputes over who paid, how much, and who is next in the rotation are frequent and erode trust; a single missed or late payout can collapse a group and cost members savings earmarked for school fees, groceries or funeral costs.

- **Who has it:** stokvel treasurers/organizers (1 per group) and their 10–50 members.
- **How often:** every contribution cycle (weekly/monthly) and every payout.
- **Cost today:** lost savings from collapsed groups, hours of manual admin per treasurer, damaged relationships, member churn.

## Customer

- **Primary payer (B2C SaaS):** stokvel treasurer/organizer managing 1–5 groups (10–50 members each). Pain: admin burden, disputes, no audit trail, churn.
- **End user (free tier):** members wanting transparency on their own contributions and next payout.
- **Future B2B:** stokvel associations (e.g. NASASA), burial societies and funeral parlours offering a trusted savings tool to their customers.

## Solution

StokvelOS is a **mobile-first, low-data web app (PWA)** that gives a stokvel a shared, tamper-evident ledger: create a group, invite members, record contributions, schedule and track payouts, and keep an immutable audit trail — so every member can see where their money is, anytime, on low data.

> One sentence: StokvelOS is the transparent ledger and payout scheduler for stokvels, so members always know where their money is.

No custody of funds in v1 — record-keeping and trust tool, not a bank (regulatory positioning).

## Impact

- Fewer disputes and collapsed groups; higher member retention; more savings kept in stokvels vs. cash.
- **On-time payout rate ≥ 90%**
- **Dispute rate down ≥ 50%**
- **Member retention ≥ 85% over 6 months**
- **Treasurer admin time down ≥ 60%**

## Money (business model)

| Tier | Price | Includes |
|---|---|---|
| Free | R0 | Up to 10 members, basic contribution + payout ledger, member view |
| Premium | R59–R149 / month per stokvel | Unlimited members, WhatsApp/SMS reminders, payout scheduling, PDF audit reports, dispute log, export |
| Transaction fee | 1% (capped) on payouts via PayFast/Yoco | Optional, only when payouts run through the app (v2) |
| B2B (future) | Per-seat / white-label licensing | Stokvel associations, burial societies, funeral parlours |

Unit economics (target): Premium ARPU ≈ R99/mo; CAC via community channels ≈ R30–R60; payback < 1 month; high gross margin on Supabase/Vercel.

## Go-to-market (first 100 customers)

1. Direct outreach to treasurers in personal network + township WhatsApp groups.
2. Partnerships with stokvel associations (NASASA) and burial societies/funeral parlours.
3. Church groups and community organisations (high trust, high stokvel density).
4. Community radio mentions + spaza shop notice boards.
5. Referral loop: 1 free month for inviting another stokvel.

Channel hypothesis: treasurer-led word of mouth — one treasurer brings 1 group (10–50 members), so 100 customers ≈ 2–10 treasurers convinced.

## Competition

| Competitor | Strength | Weakness |
|---|---|---|
| WhatsApp + notebook/Excel | Free, familiar, ubiquitous | No audit trail, manual, error-prone, disputes unresolved |
| Stokfella and similar apps | First-mover, SA-focused | Weak UX, low trust, low adoption, heavy install friction |
| Bank stokvel products | Trust, regulation | Rigid, fees, not group-controlled, poor UX |

**Why we win:** transparency/audit trail visible to all members, low-data PWA (no install), WhatsApp share links for invites, vernacular-friendly UI, treasurer-first onboarding, and a free tier that converts via trust.

## App must features (day one)

1. **F1 Accounts & roles** — sign up/login, organizer vs member (RLS-enforced on backend).
2. **F2 Stokvel groups** — create group, invite via link/WhatsApp, join, member list.
3. **F3 Contributions ledger** — record who paid what/when, balances, member statement.
4. **F4 Payout schedule & tracking** — rotation order, due dates, mark paid, reminders.
5. **F5 Audit & dispute log** — immutable change log, who did what, resolve disputes.

MVP = F1–F5. F6–F8 (reminders, export, offline) are polish if time.

## Stack & delivery

Next.js + Supabase (Postgres + RLS) + Tailwind/shadcn + Vercel; TDD + CI (lint, typecheck, tests, build on every PR). Prior portfolio project: Indlela (transport-affordability app for job seekers) — same target users, low-data constraints, same stack.

## Test logins (placeholder)

Test accounts will be added once scaffolding + auth (M1) is complete. Expected roles for QA:

- Organizer (Treasurer): `organizer@test.stokvelos.app` / `<password>`
- Member: `member@test.stokvelos.app` / `<password>`
- Platform Admin: `admin@test.stokvelos.app` / `<password>`

Credentials to be recorded in the repo's `.env.example` / seed script (never committed as real secrets) and updated here before final submission.<|end|><|start|>asset<|channel|>final<|message|>Now let me print it.<|end|><|start|><|start|>assistant to=shell<|channel|>analysis <|constrain|>xml<|message|><rfl:parameter name="command">
cat /home/kayron1/Work/stokvelos/docs/CHECKIN_SUBMISSION.md