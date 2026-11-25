# Design exports

Source project: https://stitch.google.com/projects/9928979343368528728

`S1.png`–`S13.png` and `M1.png`–`M7.png` are the screen and modal exports for StokvelOS v1. They are **responsive, desktop-width web layouts**, not phone-shaped app mockups and not native mobile screens.

## Web-first rules for these exports

- Breakpoints: 320 / 768 / 1024 / 1440 px.
- Navigation shell: left sidebar at ≥1024 px, compact icon rail at 768–1023 px, bottom nav below 768 px. Five destinations: Home, Ledger, Payouts, Audit, Profile.
- Layout, labels, messages and sample content come from `../PRD.md` §§8.1, 8.2 and 9. Do not invent wording.
- No install prompt, app-store affordance, offline indicator or staleness banner: PWA and offline support are deferred to a later mobile rollout (see [`../decisions/ADR-0001-web-first-v1.md`](../decisions/ADR-0001-web-first-v1.md)).
- S2 and S3 include the "Continue with Google" button; S2's privacy checkbox links to `/privacy`.

The former `STITCH_PROMPTS.md` was removed. The web-first prompt/change spec is supplied in chat before re-exporting; this folder keeps only the PNG exports plus this note.

Related: [[Home]]
