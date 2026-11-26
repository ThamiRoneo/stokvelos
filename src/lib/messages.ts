/**
 * Exact user-facing copy from docs/PRD.md and IMPLEMENTATION_PLAN.md §10.
 * Do not reword these strings: component and integration tests assert them.
 */
export const MESSAGES = {
  // Accounts (OP1–OP4, PRD §5)
  accountExists: "This email already has an account.",
  invalidCredentials: "Invalid credentials.",
  verifyEmail: "Please verify email.",
  resetSent: "If an account exists, a reset link has been sent.",
  consentRequired:
    "Confirm that you are 18 or older and accept the Privacy Policy.",
  passwordRule: "At least 8 characters, including at least 1 number",
  // S2 checkbox label is exactly "I accept the Privacy Policy" (Stitch decision 4).
  privacyPrefix: "I accept the ",
  privacyLinkText: "Privacy Policy",
  privacyLink: "/privacy",
  ageCheckbox: "I confirm that I am 18 or older",
  accountCreated: "Account created.",

  // Connectivity / session
  noConnection: "No connection.",
  pleaseLoginAgain: "Please log in again.",
  couldNotLoad: "Couldn't load. Try again.",
  couldNotSave: "Couldn't save.",
  couldNotJoin: "Couldn't join. Try again.",
  saved: "Saved.",

  // Groups and members (BR1, BR2, BR6, BR7, BR13)
  onlyOrganizer: "Only the organizer can do this.",
  onlyMembersDispute: "Only members can raise a dispute.",
  inviteExpired: "This invite has expired. Ask the organizer for a new link.",
  inviteUsed: "This invite has already been used.",
  emptyStokvels: "You're not in any stokvel yet. Create one or join with a link.",
  noMembers: "No members yet. Invite someone.",
  memberJoined: "Member joined.",
  memberRemoved: "Member removed.",
  memberRemoveUnpaid: (name: string) =>
    `Cannot remove: ${name} has an unpaid payout. Reassign first.`,
  deleteGroupConfirm: (name: string) =>
    `Delete ${name}? All contributions, payouts and disputes will be removed. This cannot be undone.`,
  stokvelNameRequired: "Enter a stokvel name.",
  amountRange: "Amount must be between R0.01 and R1,000,000.",
  frequencyRequired: "Choose weekly or monthly.",
  // T-BR5-1 — exact copy from supabase/migrations/0003_functions.sql.
  payoutAmountRange: "Payout amount must be between R0.01 and R10,000,000.",

  // Contributions (BR4, OP16, OP17, S7/S8)
  noContributions: "No contributions yet. Record the first one.",
  contributionRecorded: "Contribution recorded.",
  duplicateContribution: (name: string, period: string) =>
    `A contribution for ${name} for ${period} already exists. Edit instead?`,

  // S12 destructive action (Stitch decision 7)
  deleteGroupButton: "Delete stokvel",
  cancelButton: "Cancel",
} as const;

export type MessageKey = keyof typeof MESSAGES;
