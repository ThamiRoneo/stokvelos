import { afterAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, IDS, seedPassword, signInAs } from "./helpers";
import { createInvite, joinInvite, previewInvite } from "@/lib/api/invites";
import { MESSAGES } from "@/lib/messages";

describe("Phase 2 invite integration", () => {
  const createdInviteTokens: string[] = [];

  afterAll(async () => {
    const admin = adminClient();
    if (createdInviteTokens.length > 0) {
      await admin.from("invitations").delete().in("token", createdInviteTokens);
    }
  });

  it("T-INVITE-1 organizer can create a 7-day invite link (OP10)", async () => {
    const nomsa = await signInAs("nomsa@stokvelos.app");
    const result = await createInvite(nomsa, {
      stokvelId: IDS.sowetoSavers,
      origin: "http://localhost:3000",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    createdInviteTokens.push(result.data.token);
    expect(result.data.link).toContain("/join/");
    expect(new Date(result.data.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("T-INVITE-2 previewInvite returns safe group summary (S6)", async () => {
    const nomsa = await signInAs("nomsa@stokvelos.app");
    const created = await createInvite(nomsa, {
      stokvelId: IDS.sowetoSavers,
      origin: "http://localhost:3000",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    createdInviteTokens.push(created.data.token);

    const sipho = await signInAs("sipho@stokvelos.app");
    const preview = await previewInvite(sipho, created.data.token);
    expect(preview.ok).toBe(true);
    if (preview.ok) {
      expect(preview.data.name).toBe("Soweto Savers");
      expect(preview.data.contributionAmount).toBe(250);
      expect(preview.data.memberCount).toBeGreaterThan(0);
    }
  });

  it("T-INVITE-3 joinInvite blocks reuse of a single-use invite with exact PRD copy (BR6)", async () => {
    const nomsa = await signInAs("nomsa@stokvelos.app");
    const invite = await createInvite(nomsa, {
      stokvelId: IDS.sowetoSavers,
      origin: "http://localhost:3000",
    });
    expect(invite.ok).toBe(true);
    if (!invite.ok) return;
    createdInviteTokens.push(invite.data.token);

    // Use a fresh user via the admin API so the join flow is exercised end to end.
    const admin = adminClient();
    const email = `join-${Date.now()}@stokvelos.app`;
    const { data: created } = await admin.auth.admin.createUser({
      email,
      password: seedPassword,
      email_confirm: true,
      user_metadata: { full_name: "Join Test" },
    });
    const userId = created.user?.id;
    expect(userId).toBeTruthy();

    const client = anonClient();
    await client.auth.signInWithPassword({ email, password: seedPassword });
    const first = await joinInvite(client, invite.data.token);
    expect(first.ok).toBe(true);

    const second = await joinInvite(client, invite.data.token);
    // BR6 / PRD §6.2: a single-use invite blocks the second join.
    expect(second).toEqual({ ok: false, message: MESSAGES.inviteUsed });

    if (userId) await admin.auth.admin.deleteUser(userId);
  });

  it("T-INVITE-4 expired invite returns exact PRD copy", async () => {
    const admin = adminClient();
    const nomsa = await signInAs("nomsa@stokvelos.app");
    const invite = await createInvite(nomsa, {
      stokvelId: IDS.sowetoSavers,
      origin: "http://localhost:3000",
    });
    expect(invite.ok).toBe(true);
    if (!invite.ok) return;
    createdInviteTokens.push(invite.data.token);

    await admin.from("invitations").update({ expires_at: "2000-01-01T00:00:00Z" }).eq("token", invite.data.token);
    const sipho = await signInAs("sipho@stokvelos.app");
    const result = await joinInvite(sipho, invite.data.token);
    expect(result).toEqual({ ok: false, message: MESSAGES.inviteExpired });
  });
});
