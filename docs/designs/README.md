# Design exports

Source project: https://stitch.google.com/projects/9928979343368528728

`S1.png`–`S13.png` and `M1.png`–`M7.png` are the screen and modal exports for StokvelOS v1. They are **responsive, desktop-width web layouts**, not phone-shaped app mockups and not native mobile screens.

## Current export

Re-exported 2026-11-25 from the 20 final Stitch screens at full desktop canvas width (2560 px, height varies by content). All use the identical R2-B “Refined ledger” mark and wordmark.

| File | Stitch screen | Canvas |
| --- | --- | --- |
| `S1.png` | Welcome | 2560 × 2048 |
| `S2.png` | Sign Up | 2560 × 2114 |
| `S3.png` | Log In | 2560 × 2048 |
| `S4.png` | My Stokvels | 2560 × 2048 |
| `S5.png` | Create Stokvel | 2560 × 2048 |
| `S6.png` | Join via Invite | 2560 × 2048 |
| `S7.png` | Stokvel Home | 2560 × 2422 |
| `S8.png` | Contributions Ledger | 2560 × 2578 |
| `S9.png` | Payouts | 2560 × 2048 |
| `S10.png` | Members | 2560 × 2904 |
| `S11.png` | Audit Log | 2560 × 2928 |
| `S12.png` | Stokvel Settings | 2560 × 2880 |
| `S13.png` | Profile/Settings | 2560 × 2584 |
| `M1.png` | Record Contribution Modal | 2560 × 2048 |
| `M2.png` | Schedule Payout Modal | 2560 × 2048 |
| `M3.png` | Mark Payout Paid Modal | 2560 × 2048 |
| `M4.png` | Delete Account Modal | 2560 × 2048 |
| `M5.png` | Invite Member Modal | 2560 × 2048 |
| `M6.png` | Remove Member Modal | 2560 × 2048 |
| `M7.png` | Raise Dispute Modal | 2560 × 2048 |

## Web-first rules for these exports

- Breakpoints: 320 / 768 / 1024 / 1440 px.
- Navigation shell: left sidebar at ≥1024 px, compact icon rail at 768–1023 px, bottom nav below 768 px. Five destinations: Home, Ledger, Payouts, Audit, Profile.
- Layout, labels, messages and sample content come from `../PRD.md` §§8.1, 8.2 and 9. Do not invent wording.
- No install prompt, app-store affordance, offline indicator or staleness banner: PWA and offline support are deferred to a later mobile rollout (see [`../decisions/ADR-0001-web-first-v1.md`](../decisions/ADR-0001-web-first-v1.md)).
- S2 and S3 include the "Continue with Google" button; S2's privacy checkbox links to `/privacy`.

The former `STITCH_PROMPTS.md` was removed. The web-first prompt/change spec is supplied in chat before re-exporting; this folder keeps only the PNG exports plus this note.

Related: [[Home]]
