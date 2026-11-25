# ADR-0001: StokvelOS v1 is a responsive web application

- **Status:** Accepted
- **Date:** 2026-11-25
- **Project:** StokvelOS
- **Supersedes:** implementation plan §18 C13 (Workbox read-only offline cache)
- **Related:** [PRD v0.7](../PRD.md), [Implementation plan v1.8](../../IMPLEMENTATION_PLAN.md), [Stitch project](https://stitch.google.com/projects/9928979343368528728)

## Context

The PRD and implementation plan described StokvelOS v1 as a "mobile-first, low-data web app (PWA)", with F8 Offline & low-data, US15, BR12, OP25, a Workbox read-only cache and staleness banner, and phone-shaped Stitch exports. Phase 2 shipped on Vercel as a browser application. The capstone submission and portfolio describe a web app; the hosted Supabase project has no mobile backend, install payload or offline datastore.

The human confirmed that v1 must be explicitly a **responsive, desktop-first web application** and that native mobile apps belong to a later rollout.

## Decision

1. v1 is a responsive web application in the browser, designed desktop-first at 320 / 768 / 1024 / 1440 breakpoints. Navigation shell: left sidebar at ≥1024px, compact icon rail at 768–1023px, bottom nav below 768px.
2. Installable PWA, service worker, Workbox, offline cache, staleness banner, native iOS/Android apps and app-store submission are **not in v1**. They are deferred to a later mobile rollout.
3. Low-data practices remain: minimal images, no heavy animations, exact error strings for failed requests. There is no cached-data fallback.
4. F8, US15, BR12, OP25, T-US15-1 and T-BR12-1 are removed from v1 scope; C13 is marked **superseded**, not reopened.
5. Screen designs are re-specified for responsive web in the external Stitch project; desktop-width exports replace the phone-shaped PNGs in `docs/designs/`.
6. No schema, migration, Row Level Security, API contract or permission change results from this decision. Database-enforced permissions and the Phase 3 gate ("Start Phase 3") are unchanged.

## Consequences

### Positive

- Product docs, check-in submission and the deployed app now describe the same platform.
- No new dependency, backend service or secret handling is introduced.
- Design work has explicit breakpoints and a navigation shell for desktop as well as phone.

### Negative

- Offline use and installability are unavailable until the mobile rollout; users on poor connections see error states instead of cached data.
- Existing phone-width exports are replaced, so the old mobile layouts no longer live in the repository.
- Later phases must implement the desktop shell and update responsive E2E coverage (T-NFR-3).

## Alternatives considered

1. Keep the mobile-width layout as a normal website — rejected: it is not desktop-first and weakens the capstone's web-app story.
2. Keep a read-only Workbox cache — rejected: offline/PWA belongs to the deferred mobile rollout.
3. Desktop-only web app — rejected: phone remains a supported responsive viewport.
4. Add a numbered Phase 8 for mobile now — rejected: mobile stays in the documented deferred roadmap; phases 1–7 are unchanged.

## Related

- [Home](../../README.md)
