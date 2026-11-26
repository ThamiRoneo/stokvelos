---
date: 2026-11-26
title: Fix Double AppNav on /stokvels/new and affected screens
tags: [fix, nav, phase-2, stokvelos]
---

# Fix: Double AppNav on /stokvels/new (and affected screens)

## Summary
Removed duplicate `<AppNav />` renders from four screen components. PR addfdc9 had correctly added AppNav to `src/app/(app)/layout.tsx`, but left inline `<AppNav ... />` calls in the screen components, causing double nav rendering.

## Files changed
- src/components/screens/CreateStokvel.tsx
- src/components/screens/Members.tsx
- src/components/screens/StokvelSettings.tsx
- src/components/screens/JoinViaInvite.tsx

## Gate results
- lint: OK
- typecheck: OK
- npm run test: 75/75
- npx supabase test db: 119/119
- npm run test:integration: 48/48
- npm run build: OK

## PR & merge
- PR: https://github.com/ThamiSithole/stokvelos/pull/65
- Merge SHA: 05ab5973130974e5c6f0927b59a874550a426f8a

## Issue
https://github.com/ThamiSithole/stokvelos/issues/2 — remains open pending S11/M3 frontend gate.

## Decision
Layout-level nav is the correct pattern for all (app) routes; inline nav props (active, stokvelId) are not needed as AppNav uses usePathname() for active tab detection.
