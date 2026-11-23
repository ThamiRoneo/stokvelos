# Capstone Check-ins — StokvelOS

Format per course check-ins (all times SAST). Post the relevant block in the channel at each check-in.

---

## Mon 23 Nov • 10:00 (repo + BUSINESS.md/README pitch + PRD + Stitch designs)

```
Name: Thami Sithole
Business / app name: StokvelOS
Done since last check-in: Public repo created (https://github.com/ThamiSithole/stokvelos); BUSINESS.md written; docs/PRD.md (v0.1, 16 sections) written; git history started with small commits.
Next: Stitch designs into docs/designs/; README pitch with live/Stitch links and test logins; IMPLEMENTATION_PLAN.md.
Blockers: None.
Repo link: https://github.com/ThamiSithole/stokvelos
```

Status vs. 10:00 gate: Repo created ✅ · BUSINESS.md ✅ · PRD ✅ · Stitch designs ⏳ (in progress) · README pitch ⏳ (in progress)

---

## Mon 23 Nov • 15:30 (implementation plan merged, Issues created, frontend started via PRs)

```
Name: Thami Sithole
Business / app name: StokvelOS
Done since last check-in: Stitch designs exported to docs/designs/; README pitch + links; IMPLEMENTATION_PLAN.md merged; Issues created for M1–M7; frontend scaffolding (Next.js + Tailwind/shadcn) started via PRs.
Next: Backend: Supabase project, schema + RLS migrations, auth + roles.
Blockers: None.
Repo link: https://github.com/ThamiSithole/stokvelos
```

Status vs. 15:30 gate: Implementation plan merged ⏳ · Issues created ⏳ · Frontend started via PRs ⏳

---

## Tue 24 Nov • 10:00 (backend started: hosted DB, migrations, log-in & roles, CI running)

```
Name: Thami Sithole
Business / app name: StokvelOS
Done since last check-in: Supabase project live; schema + RLS migrations applied; auth + organizer/member roles; CI (lint, typecheck, tests, build) running on PRs.
Next: Deploy to live link; first Must features (groups, contributions) working; portfolio repo created + first version deployed.
Blockers: None.
Repo link: https://github.com/ThamiSithole/stokvelos
```

Status vs. 10:00 gate: Hosted DB ✅/⏳ · Migrations ✅/⏳ · Log-in & roles ✅/⏳ · CI running ✅/⏳

---

## Tue 24 Nov • 15:30 (deployed live link + first Must features; portfolio repo created + deployed)

```
Name: Thami Sithole
Business / app name: StokvelOS
Done since last check-in: Deployed to live link with log-in, database and first Must features (groups + contributions) working; portfolio repo created and first version deployed.
Next: Remaining Must features (payouts, audit/disputes); tests; README completion; portfolio content.
Blockers: None.
Repo link: https://github.com/ThamiSithole/stokvelos
Capstone live link: <to be added>
Portfolio repo: <to be added>
Portfolio live link: <to be added>
```

Status vs. 15:30 gate: Live link ✅/⏳ · First Must features ✅/⏳ · Portfolio repo + deployed ✅/⏳

---

## Wed 25 Nov • 10:00 (all Must features on live link, tests passing, README almost complete, portfolio content added)

```
Name: Thami Sithole
Business / app name: StokvelOS
Done since last check-in: All Must features (F1–F5) working on live link; tests passing; README nearly complete; portfolio content (capstone + Indlela + best builds) added.
Next: Final polish, Loom recording, final submission at 15:30.
Blockers: None.
Repo link: https://github.com/ThamiSithole/stokvelos
```

Status vs. 10:00 gate: All Must features on live link ✅/⏳ · Tests passing ✅/⏳ · README almost complete ✅/⏳ · Portfolio content added ✅/⏳

---

## Wed 25 Nov • 15:30 — FINAL SUBMISSION

```
Name: Thami Sithole
Business / app name: StokvelOS
One-line pitch: StokvelOS is the transparent ledger and payout scheduler for stokvels, so members always know where their money is.
Capstone repo: https://github.com/ThamiSithole/stokvelos
Capstone live link: <to be added>
Loom link: <to be added>
Portfolio live link: <to be added>
Portfolio repo: <to be added>
```

Work after 15:30 Wednesday won't be counted.

---

## Detailed submission (reference — problem / customer / solution / impact / money / GTM / competition / must features)

See `BUSINESS.md` and `docs/PRD.md`. Summary:

- **Problem:** Stokvels move ~R50bn+/yr but run on WhatsApp/notebooks; disputes over contributions/payouts collapse groups.
- **Customer:** Treasurer/organizer (payer) + members (free); future B2B to stokvel associations/burial societies.
- **Solution:** Shared, tamper-evident ledger + payout scheduler (web PWA, low data); no custody of funds in v1.
- **Impact:** On-time payouts ≥ 90%; disputes down ≥ 50%; retention ≥ 85%; treasurer admin time down ≥ 60%.
- **Money:** Freemium (≤10 members free) → Premium R59–R149/mo per stokvel + optional 1% transaction fee (v2) + B2B licensing.
- **GTM first 100:** WhatsApp groups, NASASA/association partnerships, church groups, community radio, spaza boards, referral loop.
- **Competition:** WhatsApp+Excel, Stokfella (weak UX), bank stokvel products. Win on transparency/audit trail, low-data PWA, WhatsApp invites, vernacular UI.
- **Must features:** F1 Accounts & roles; F2 Stokvel groups; F3 Contributions ledger; F4 Payout schedule & tracking; F5 Audit & dispute log.
- **Roles:** Organizer (Treasurer), Member, Platform Admin.
- **Stack:** Next.js + Supabase (Postgres + RLS) + Tailwind/shadcn + Vercel; TDD + CI.
- **Prior portfolio project:** Indlela (transport-affordability app) — same target users, low-data constraints, same stack.

## Test logins (placeholder)

To be added once auth (M1) is complete:

- Organizer: `organizer@test.stokvelos.app` / `<password>`
- Member: `member@test.stokvelos.app` / `<password>`
- Platform Admin: `admin@test.stokvelos.app` / `<password>`
