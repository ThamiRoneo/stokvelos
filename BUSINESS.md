# BUSINESS.md — StokvelOS

**Author:** Thami Sithole · **GitHub:** ThamiRoneo (https://github.com/ThamiRoneo/stokvelos) · **Date:** 2026-11-23 · **Status:** Draft v0.1

## 1. The problem

Stokvels (rotating savings & credit associations) are a cornerstone of South Africa's informal economy — millions of low- and middle-income households save an estimated R50bn+ per year through them. But they run on WhatsApp groups and memory: treasurers track contributions in notebooks or Excel, payouts are scheduled by hand, and there is no shared, tamper-evident record. Disputes over who paid, how much, and who is next in the rotation are frequent and erode trust. A single missed or late payout can collapse a group and cost members their savings — often money earmarked for school fees, groceries or funeral costs.

- **Who has it:** Stokvel treasurers/organizers (typically 1 person per group) and their 10–50 members.
- **How often:** Every contribution cycle (weekly/monthly) and every payout.
- **What it costs today:** Lost savings from collapsed groups, hours of manual admin per treasurer, damaged relationships, and members dropping out. Many groups simply stop because trust breaks down.

## 2. The customer

- **Primary payer (B2C SaaS):** Stokvel treasurer/organizer managing 1–5 groups. Pain: admin burden, disputes, no audit trail, member churn.
- **End user (free tier):** Members who want transparency on their own contributions and next payout.
- **Future B2B:** Stokvel associations (e.g. NASASA), burial societies and funeral parlours that want to offer a trusted savings tool to their customers.

## 3. The solution

StokvelOS is a mobile-friendly web app (PWA) that gives a stokvel a shared, tamper-evident ledger: create a group, invite members, record contributions, schedule and track payouts, and keep an immutable audit trail — so every member can see where their money is, anytime, on low data.

**One sentence:** StokvelOS is the transparent ledger and payout scheduler for stokvels, so members always know where their money is.

## 4. The impact

- Fewer disputes and collapsed groups; higher member retention; more savings kept in stokvels (vs. cash under the mattress).
- **Measures:** on-time payout rate ≥ 90%; dispute rate down ≥ 50%; member retention ≥ 85% over 6 months; treasurer admin time down ≥ 60%.

## 5. Business model (money)

| Tier | Price | Includes |
|---|---|---|
| Free | R0 | Up to 10 members, basic contribution + payout ledger, member view |
| Premium | R59–R149 / month per stokvel | Unlimited members, automated WhatsApp/SMS reminders, payout scheduling, PDF audit reports, dispute log, export |
| Transaction fee | 1% (capped) on payouts processed via PayFast/Yoco | Optional, only when payouts run through the app |
| B2B (future) | Per-seat / white-label licensing | Stokvel associations, burial societies, funeral parlours |

**Unit economics (target):** Premium ARPU ≈ R99/mo; CAC via community channels ≈ R30–R60; payback < 1 month; gross margin high (SaaS on Supabase/Vercel).

## 6. Go-to-market (first 100 customers)

1. Direct outreach to treasurers in personal network + township WhatsApp groups.
2. Partnerships with stokvel associations (NASASA) and burial societies/funeral parlours.
3. Church groups and community organisations (high trust, high stokvel density).
4. Community radio mentions + spaza shop notice boards.
5. Referral loop: 1 free month for inviting another stokvel.

**Channel hypothesis:** treasurer-led word of mouth; one treasurer brings 1 group (10–50 members), so 100 customers ≈ 2–10 treasurers convinced.

## 7. Competition

| Competitor | Strength | Weakness |
|---|---|---|
| WhatsApp + notebook/Excel | Free, familiar, ubiquitous | No audit trail, manual, error-prone, disputes unresolved |
| Stokfella and similar apps | First-mover, SA-focused | Weak UX, low trust, low adoption, heavy install friction |
| Bank stokvel products | Trust, regulation | Rigid, fees, not group-controlled, poor UX |

**Why we win:** transparency/audit trail visible to all members, low-data PWA (no install), WhatsApp share links for invites, vernacular-friendly UI, treasurer-first onboarding, and a free tier that converts via trust.

## 8. Why us (Thami Sithole / ThamiRoneo)

- Built Indlela (transport-affordability app for job seekers) — same target users, same low-data constraints, same Supabase/Next.js stack.
- Understands the township/informal-economy context first-hand.
- Ships with TDD, CI and real databases; treats this as a startup, not a school assignment.

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Treasurers won't pay / prefer free WhatsApp | Free tier + visible trust/audit value; charge only for reminders/reports |
| Low smartphone/data penetration in some groups | PWA, low-data design, offline cache, WhatsApp share (no install) |
| Trust/safety (fraud via app) | Immutable audit log, role-based permissions, organizer approval for payouts |
| Regulatory (financial services) | Position as record-keeping tool, not a bank; no custody of funds in v1 |
| Adoption/network effects | Start with 1–2 friendly stokvels; iterate on real feedback |

## 10. Must features (day one)

1. **F1 Accounts & roles** — sign up/login, organizer vs member.
2. **F2 Stokvel groups** — create group, invite via link/WhatsApp, join, member list.
3. **F3 Contributions ledger** — record who paid what/when, balances, member statement.
4. **F4 Payout schedule & tracking** — rotation order, due dates, mark paid, reminders.
5. **F5 Audit & dispute log** — immutable change log, who did what, resolve disputes.

## 11. Next steps

- Draft `docs/PRD.md` (user stories, acceptance criteria, screens, data model).
- Stitch designs → `docs/designs/`.
- `IMPLEMENTATION_PLAN.md` phased (auth → groups → contributions → payouts → audit → polish).
- Repo scaffolding: Next.js + Supabase + RLS + CI + tests (TDD).

Related: [[Home]]
