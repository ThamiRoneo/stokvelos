# Google Stitch prompts — StokvelOS

Source: `docs/PRD.md` §8.1, §8.2, §8.3, §9 (and §2.3, §4.5, §5, §6.2, §10 for PRD-defined sample content only). Nothing outside the PRD is introduced. Paste each fenced block into Stitch as a separate prompt.
Stitch project: https://stitch.google.com/projects/9928979343368528728

---

## 0. STYLE GUIDE (paste first; apply to every prompt below)

```
Design a global style guide / design-system board for StokvelOS, a mobile-first responsive web app (PWA). Use ONLY the design values in PRD §9 and the shared components in PRD §8.3. Do not invent any other colours, fonts, spacing, icons, or components.

COLOURS (§9.1): Primary #1b5e20 (primary buttons, links, active nav tab, success); Primary light #2e7d32 (hover, secondary emphasis); Secondary #f9a825 (warm accent, highlights, reminders); Background #fafafa (screen background); Surface #ffffff (cards, inputs, modals); Text primary #1a1a1a (headings, body); Text secondary #5f6368 (captions, hints); Error #c62828 (errors, destructive); Success #2e7d32 (paid, success states); Warning #f9a825 (stale, overdue); Border #e0e0e0 (input borders, dividers); Disabled #bdbdbd (disabled elements).

TYPOGRAPHY (§9.2): Font family Inter, system-ui fallback. H1 24px/32px Bold 700 (screen titles); H2 20px/28px Semibold 600 (section headers); H3 16px/24px Semibold 600 (card titles); Body 14px/20px Regular 400; Caption 12px/16px Regular 400 (hints, timestamps); Button 14px/20px Medium 500; Input 14px/20px Regular 400.

SPACING (§9.3): xs 4px, sm 8px, md 16px, lg 24px, xl 32px; touch target minimum 44px.

ICONOGRAPHY (§9.4): Lucide / Heroicons outlined; 24px default, 20px compact; colour Text primary by default, Primary for active.

LOGO (§9.5): R2-B "Refined ledger" — three bold ruled ledger lines, one highlighted payout column, subtle inward cycle arc; one-colour, reversed-safe, works at 16px; uses #1B5E20 and #F9A825.

SHARED COMPONENTS — show every variant/state (§8.3):
- Button: primary, secondary, ghost, destructive, disabled, loading.
- TextInput: default, focused, error, disabled.
- Card: stokvel card, stat card, member row.
- Table: contributions (member × period).
- Badge: role (organizer/member), status (paid/scheduled/overdue).
- Banner: alert, info, error, success, staleness.
- Modal/Dialog: form modal, confirm modal.
- Empty state: icon + message + CTA.
- Spinner: small inline, large full-screen.
- Top app bar: title, back, optional action.
- Bottom nav: 5 tabs — Home, Ledger, Payouts, Audit, Profile.

Output one design-system board showing all tokens and all component variants/states.
```

---

## S1 — Welcome

```
Apply the StokvelOS style guide from the style-guide prompt exactly (colours, Inter type scale, 4/8/16/24/32 spacing, outlined Lucide icons, shared components, R2-B "Refined ledger" logo). Mobile-first responsive web app, low-data.

LAYOUT: Centred entry screen: R2-B Refined ledger logo, one-line pitch, two stacked buttons.

LABELS & SAMPLE CONTENT:
- Pitch (exact, PRD §1.2): "StokvelOS gives stokvels a shared, tamper-evident ledger and payout scheduler, so every member always knows where their money is."
- Buttons: "Sign up" (primary), "Log in" (secondary).

STATES:
- Normal: Logo, pitch, Sign up + Log in.
- Empty: N/A — do not design.
- Loading: N/A — do not design.
- Error: N/A — do not design.
- Offline: N/A — do not design.
- Success: N/A — do not design.
```

## S2 — Sign Up

```
Apply the StokvelOS style guide from the style-guide prompt exactly. Mobile-first responsive web app.

LAYOUT: Top app bar (title "Sign Up", back). Centred form card on Surface #ffffff: TextInput Email, TextInput Password, age confirmation checkbox, privacy checkbox, primary Button "Register". Body text minimum 14px; inputs labelled.

LABELS & SAMPLE CONTENT:
- Email (TextInput), Password (TextInput).
- Age confirmation checkbox (18+).
- Privacy checkbox.
- Password rule hint (exact, PRD §5): "At least 8 characters, including at least 1 number".
- Button: "Register".

STATES:
- Normal: Form valid → button enabled.
- Empty: N/A — do not design.
- Loading: Spinner on button.
- Error: "This email already has an account."; red border on password rules ("At least 8 characters, including at least 1 number").
- Offline: "No connection."
- Success: Created → S3 banner.
```

## S3 — Log In

```
Apply the StokvelOS style guide from the style-guide prompt exactly. Mobile-first responsive web app.

LAYOUT: Top app bar (title "Log In", back). Centred form card: TextInput Email, TextInput Password, "forgot password link", primary Button "Log in". Inputs labelled.

LABELS & SAMPLE CONTENT:
- Email (TextInput), Password (TextInput).
- "forgot password link" (exact PRD §8.1 label).
- Button: "Log in".

STATES:
- Normal: Form.
- Empty: N/A — do not design.
- Loading: Spinner.
- Error: "Invalid credentials." / "Please verify email."
- Offline: "No connection."
- Success: Verified → S4.
```

## S4 — My Stokvels

```
Apply the StokvelOS style guide from the style-guide prompt exactly. Mobile-first responsive web app. Bottom nav (Home, Ledger, Payouts, Audit, Profile) with Home active.

LAYOUT: Top app bar (title "My Stokvels"). List of Stokvel cards (§8.3); primary action Open / Create; Create + Join CTAs.

LABELS & SAMPLE CONTENT (from PRD §2.3 personas only):
- Two stokvels belonging to Nomsa Dlamini: one with 15 members, one with 28 members, in Soweto.
- CTAs: "Create one" and "join with a link" (per exact empty-state copy below).

STATES:
- Normal: List of stokvel cards.
- Empty: "You're not in any stokvel yet. Create one or join with a link." + 2 CTAs.
- Loading: Spinner.
- Error: "Couldn't load. Try again."
- Offline: Cached list + staleness banner.
- Success: N/A — do not design.
```

## S5 — Create Stokvel

```
Apply the StokvelOS style guide from the style-guide prompt exactly. Mobile-first responsive web app.

LAYOUT: Top app bar (title "Create Stokvel", back). Form card: TextInput Name, TextInput description, TextInput amount, frequency control (weekly/monthly), rotation default control, primary Button "Create". Inputs labelled.

LABELS & SAMPLE CONTENT:
- Fields: Name, description, amount, frequency, rotation default (exact PRD §8.1 names).
- Frequency options (PRD §10): weekly / monthly.
- Button: "Create".

STATES:
- Normal: Form.
- Empty: N/A — do not design.
- Loading: Spinner on Create.
- Error: Validation errors inline.
- Offline: "No connection."
- Success: Created → S7.
```

## S6 — Join via Invite

```
Apply the StokvelOS style guide from the style-guide prompt exactly. Mobile-first responsive web app.

LAYOUT: Top app bar (title "Join via Invite", back). Stokvel preview card (§8.3) + primary Button "Join".

LABELS & SAMPLE CONTENT:
- Preview card: stokvel preview.
- Button: "Join".
- Invite edge messages (exact, PRD §6.2): "This invite has expired. Ask the organizer for a new link." / "This invite has already been used."

STATES:
- Normal: Preview card + Join.
- Empty: "Invite expired/used".
- Loading: Spinner.
- Error: "Couldn't join. Try again."
- Offline: "No connection."
- Success: Joined → S7.
```

## S7 — Stokvel Home

```
Apply the StokvelOS style guide from the style-guide prompt exactly. Mobile-first responsive web app. Bottom nav (Home, Ledger, Payouts, Audit, Profile) with Home active.

LAYOUT: Top app bar (title "Stokvel Home", optional action). Stat cards (§8.3): Balance, next payout, recent activity, quick actions.

LABELS & SAMPLE CONTENT:
- Stat cards: Balance, next payout, recent activity, quick actions (exact PRD §8.1 names).
- In-app notification banner (exact, PRD §4.5): "[Member] has not contributed for [Period]."

STATES:
- Normal: Summary cards.
- Empty: N/A (group exists) — do not design.
- Loading: Spinner.
- Error: "Couldn't load. Try again."
- Offline: Cached summary + staleness.
- Success: N/A — do not design.
```

## S8 — Contributions Ledger

```
Apply the StokvelOS style guide from the style-guide prompt exactly. Mobile-first responsive web app. Bottom nav (Home, Ledger, Payouts, Audit, Profile) with Ledger active.

LAYOUT: Top app bar (title "Contributions Ledger", optional action). Table (§8.3): contributions by member × period, with totals; member filter; primary action "Record contribution".

LABELS & SAMPLE CONTENT (PRD-defined only):
- Table axes: member × period; totals row.
- Member filter.
- Amount rule hint (exact, PRD §6.2): "Amount must be between R0.01 and R1,000,000."
- Members from PRD §2.3 personas: Nomsa Dlamini, Sipho Nkosi.
- Action label: "Record".

STATES:
- Normal: Table + totals.
- Empty: "No contributions yet. Record the first one."
- Loading: Spinner.
- Error: "Couldn't load. Try again."
- Offline: Cached ledger + staleness.
- Success: "Contribution recorded."
```

## S9 — Payouts

```
Apply the StokvelOS style guide from the style-guide prompt exactly. Mobile-first responsive web app. Bottom nav (Home, Ledger, Payouts, Audit, Profile) with Payouts active.

LAYOUT: Top app bar (title "Payouts", optional action). Rotation order (list), upcoming payouts, payout history; status Badges paid/scheduled/overdue; primary action "Schedule payout"; "Mark paid" action.

LABELS & SAMPLE CONTENT (PRD-defined only):
- Sections: Rotation order, Upcoming, History.
- Badges (§8.3): paid, scheduled, overdue.
- In-app notification banner (exact, PRD §4.5): "Payout due for [Member] on [Date]."
- Actions: "Schedule", "Mark paid".

STATES:
- Normal: Rotation + upcoming + history.
- Empty: "No payouts scheduled yet."
- Loading: Spinner.
- Error: "Couldn't load. Try again."
- Offline: Cached + staleness.
- Success: "Payout scheduled/marked paid."
```

## S10 — Members

```
Apply the StokvelOS style guide from the style-guide prompt exactly. Mobile-first responsive web app. Bottom nav (Home, Ledger, Payouts, Audit, Profile) with Profile active.

LAYOUT: Top app bar (title "Members", optional action). Member list using member-row Card (§8.3) with role Badges (organizer/member) and join dates; actions "Invite" and "Remove" (organizer only).

LABELS & SAMPLE CONTENT (PRD-defined only):
- Roles (§8.3): organizer, member.
- Members from PRD §2.3 personas: Nomsa Dlamini (organizer), Sipho Nkosi (member).
- Removal rule message (exact, PRD §6.2): "Cannot remove: [Member] has an unpaid payout. Reassign first."
- Actions: "Invite", "Remove".

STATES:
- Normal: Member list.
- Empty: "No members yet. Invite someone."
- Loading: Spinner.
- Error: "Couldn't load. Try again."
- Offline: Cached + staleness.
- Success: "Member joined/removed."
```

## S11 — Audit Log

```
Apply the StokvelOS style guide from the style-guide prompt exactly. Mobile-first responsive web app. Bottom nav (Home, Ledger, Payouts, Audit, Profile) with Audit active.

LAYOUT: Top app bar (title "Audit Log"). Chronological feed of immutable entries showing actor, action, before/after, timestamp; "Raise dispute" action per entry.

LABELS & SAMPLE CONTENT (PRD-defined only):
- Entry fields (§6.1 US11, §10): actor, action, before/after, created_at (timestamp).
- Action label: "Raise dispute".

STATES:
- Normal: Chronological feed.
- Empty: "No activity yet."
- Loading: Spinner.
- Error: "Couldn't load. Try again."
- Offline: Cached + staleness.
- Success: N/A — do not design.
```

## S12 — Stokvel Settings

```
Apply the StokvelOS style guide from the style-guide prompt exactly. Mobile-first responsive web app.

LAYOUT: Top app bar (title "Stokvel Settings", back). Form card: TextInput Name, TextInput amount, frequency control, rotation control, destructive action "delete group"; primary Button "Save".

LABELS & SAMPLE CONTENT:
- Fields (PRD §8.1): Name, amount, frequency, rotation.
- Destructive action: "delete group".
- Button: "Save".

STATES:
- Normal: Form.
- Empty: N/A — do not design.
- Loading: Spinner on Save.
- Error: Validation errors.
- Offline: "No connection."
- Success: "Saved."
```

## S13 — Profile/Settings

```
Apply the StokvelOS style guide from the style-guide prompt exactly. Mobile-first responsive web app. Bottom nav (Home, Ledger, Payouts, Audit, Profile) with Profile active.

LAYOUT: Top app bar (title "Profile/Settings"). Settings card: TextInput Name, TextInput phone, export action, log out action, destructive action "Delete account"; primary Button "Save".

LABELS & SAMPLE CONTENT:
- Fields (PRD §8.1): Name, phone.
- Export action (§6.1 US14): PDF/CSV download of contributions + payouts for the stokvel.
- Actions: "export", "Log out", "Delete account".
- In-app notifications (exact, PRD §4.5): "New dispute raised in [Stokvel]." / "Your dispute in [Stokvel] was resolved."

STATES:
- Normal: Settings.
- Empty: N/A — do not design.
- Loading: Spinner on Save.
- Error: "Couldn't save."
- Offline: "No connection."
- Success: "Saved."
```

---

## M1 — Record Contribution

```
Apply the StokvelOS style guide from the style-guide prompt exactly. Form modal (§8.3), triggered from S8 → "Record".

LAYOUT: Centred Modal/Dialog on dimmed surface: three TextInputs + one TextInput note, primary Button submit, secondary cancel.

LABELS & SAMPLE CONTENT (PRD §8.1 / §6.2):
- Fields: member, amount, period, note.
- Validation message: "Amount must be between R0.01 and R1,000,000."
- Duplicate message: "A contribution for [Member] for [Period] already exists. Edit instead?"

STATES:
- Normal: Form.
- Empty: N/A — do not design.
- Loading: Spinner on submit.
- Error: Inline errors.
- Offline: "No connection."
- Success: Success toast → close.
```

## M2 — Schedule Payout

```
Apply the StokvelOS style guide from the style-guide prompt exactly. Form modal (§8.3), triggered from S9 → "Schedule".

LAYOUT: Centred Modal/Dialog: three TextInputs + one TextInput note, primary Button submit, secondary cancel.

LABELS & SAMPLE CONTENT (PRD §8.1):
- Fields: member, amount, date, note.

STATES:
- Normal: Form.
- Empty: N/A — do not design.
- Loading: Spinner on submit.
- Error: Inline errors.
- Offline: "No connection."
- Success: Success toast → close.
```

## M3 — Raise Dispute

```
Apply the StokvelOS style guide from the style-guide prompt exactly. Form modal (§8.3), triggered from S11 → "Raise dispute".

LAYOUT: Centred Modal/Dialog: one TextInput subject, one TextInput description, primary Button submit, secondary cancel.

LABELS & SAMPLE CONTENT (PRD §8.1):
- Fields: subject, description.

STATES:
- Normal: Form.
- Empty: N/A — do not design.
- Loading: Spinner on submit.
- Error: Inline errors.
- Offline: "No connection."
- Success: Success toast → close.
```

## M4 — Delete Account

```
Apply the StokvelOS style guide from the style-guide prompt exactly. Confirm modal (§8.3), triggered from S13 → "Delete account".

LAYOUT: Centred confirm Modal/Dialog: permanent-deletion confirmation text, destructive Button, secondary cancel.

LABELS & SAMPLE CONTENT (PRD §5):
- Trigger: "Delete account".
- Effect: removes profile; audit log retained anonymised.

STATES:
- Normal: Form (confirmation).
- Empty: N/A — do not design.
- Loading: Spinner on submit.
- Error: Inline errors.
- Offline: "No connection."
- Success: Success toast → close.
```

## M5 — Invite Member

```
Apply the StokvelOS style guide from the style-guide prompt exactly. Form modal (§8.3), triggered from S10 → "Invite".

LAYOUT: Centred Modal/Dialog: invite link display, WhatsApp share action, copy action.

LABELS & SAMPLE CONTENT (PRD §8.1):
- Contents: link, WhatsApp share, copy.

STATES:
- Normal: Form.
- Empty: N/A — do not design.
- Loading: Spinner on submit.
- Error: Inline errors.
- Offline: "No connection."
- Success: Success toast → close.
```

## M6 — Mark Payout Paid

```
Apply the StokvelOS style guide from the style-guide prompt exactly. Confirm modal (§8.3), triggered from S9 → "Mark paid".

LAYOUT: Centred confirm Modal/Dialog: confirmation, paid_at field, note field, primary Button submit, secondary cancel.

LABELS & SAMPLE CONTENT (PRD §8.1):
- Contents: Confirm + paid_at + note.

STATES:
- Normal: Form.
- Empty: N/A — do not design.
- Loading: Spinner on submit.
- Error: Inline errors.
- Offline: "No connection."
- Success: Success toast → close.
```

## M7 — Remove Member

```
Apply the StokvelOS style guide from the style-guide prompt exactly. Confirm modal (§8.3), triggered from S10 → "Remove".

LAYOUT: Centred confirm Modal/Dialog: confirmation, destructive Button, secondary cancel.

LABELS & SAMPLE CONTENT (PRD §6.2):
- Blocked message: "Cannot remove: [Member] has an unpaid payout. Reassign first."

STATES:
- Normal: Form (confirmation).
- Empty: N/A — do not design.
- Loading: Spinner on submit.
- Error: Inline errors.
- Offline: "No connection."
- Success: Success toast → close.
```

---

## Questions (missing or unclear in the PRD — not guessed above)

1. What are the exact field labels and layout for the **Stokvel card**, **stat card**, and **member row** (§8.3 names them but gives no fields/content)?
2. What exact **sample contribution amounts, period labels** (e.g. week/month identifiers), and **payout dates** should appear in S8/S9 tables and M1/M2? PRD only defines limits (R0.01–R1,000,000; ≤R10,000,000) and placeholders `[Member]`, `[Period]`, `[Date]`.
3. What are the exact **stokvel names** for the sample cards in S4/S6? PRD §2.3 gives member counts (15, 28, 20) and locations (Soweto, Tembisa) but no names.
4. What is the **privacy checkbox label/link** on S2? §8.1 lists a "privacy checkbox" but §8.1 has no privacy-policy screen.
5. What is the exact **"forgot password" label and destination** on S3? §8.1 says "forgot password link" but no screen is listed.
6. What are the exact **validation-error messages** for S5 and S12 forms and for M2's payout amount? PRD only says "Validation errors inline".
7. What is the **delete-group confirmation** text/button on S12? No modal is listed for it (M4 is delete account only).
8. What is the exact **confirmation text and button labels** for M4 Delete Account? PRD gives the effect, not the copy.
9. What exact **audit action labels** and **before/after formatting** should the S11 feed show? PRD lists fields (actor, action, before/after, created_at) but no sample values.
10. What is the exact **rotation-order control** on S5/S9/S12 (drag handles, numbering, etc.)? PRD says "set rotation order / order members" but specifies no control.
11. What is the exact **success banner text** for S2 ("Created → S3 banner" — message not specified)?
12. Where exactly should the §4.5 notification banners appear (assigned to S7/S9/S13 above based on their "Opens" target) — is that placement correct?
13. Which specific **icons** should be used for the "Icon + message + CTA" empty states (§8.3) and the Bottom nav tabs? PRD specifies style/size but not glyphs.
14. Should S13's **export** offer both PDF and CSV as two separate actions, or one "Export" action with a format choice? PRD says "export CSV/PDF" and "PDF/CSV download".
