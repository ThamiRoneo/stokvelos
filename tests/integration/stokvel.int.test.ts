import { afterAll, describe, expect, it } from "vitest";
import { adminClient, IDS, signInAs } from "./helpers";
import {
  createStokvel,
  deleteStokvel,
  getStokvel,
  listMembers,
  listMyStokvels,
  removeMember,
  setRotationOrder,
  updateStokvel,
} from "@/lib/api/stokvels";
import { MESSAGES } from "@/lib/messages";

describe("Phase 2 stokvel integration", () => {
  const createdStokvelIds: string[] = [];

  afterAll(async () => {
    const admin = adminClient();
    for (const id of createdStokvelIds) {
      await admin.from("stokvels").delete().eq("id", id);
    }
  });

  it("T-STOKVEL-1 creates a stokvel and makes the creator organizer (OP7)", async () => {
    const nomsa = await signInAs("nomsa@stokvelos.app");
    const result = await createStokvel(nomsa, {
      name: "Integration Stokvel",
      contributionAmount: 250,
      contributionFrequency: "weekly",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    createdStokvelIds.push(result.data.id);

    const members = await listMembers(nomsa, result.data.id);
    expect(members.ok).toBe(true);
    if (members.ok) {
      expect(members.data).toHaveLength(1);
      expect(members.data[0].role).toBe("organizer");
      expect(members.data[0].userId).toBe(IDS.nomsa);
    }
  });

  it("T-STOKVEL-2 listMyStokvels returns only the signed-in user's groups (SEC3)", async () => {
    const nomsa = await signInAs("nomsa@stokvelos.app");
    const mine = await listMyStokvels(nomsa);
    expect(mine.ok).toBe(true);
    if (mine.ok) {
      expect(mine.data.some((s) => s.id === IDS.sowetoSavers)).toBe(true);
    }
  });

  it("T-STOKVEL-3 organizer can update settings; member cannot (SEC5)", async () => {
    const nomsa = await signInAs("nomsa@stokvelos.app");
    const sipho = await signInAs("sipho@stokvelos.app");

    const denied = await updateStokvel(sipho, IDS.sowetoSavers, { name: "Nope" });
    expect(denied).toEqual({ ok: false, message: MESSAGES.onlyOrganizer });

    const ok = await updateStokvel(nomsa, IDS.sowetoSavers, { name: "Soweto Savers" });
    expect(ok.ok).toBe(true);
  });

  it("T-STOKVEL-4 setRotationOrder is organizer-only and persists (OP15)", async () => {
    const nomsa = await signInAs("nomsa@stokvelos.app");
    const sipho = await signInAs("sipho@stokvelos.app");

    const denied = await setRotationOrder(sipho, IDS.sowetoSavers, [IDS.nomsaSaversMember]);
    expect(denied).toEqual({ ok: false, message: MESSAGES.onlyOrganizer });

    const roster = await listMembers(nomsa, IDS.sowetoSavers);
    expect(roster.ok).toBe(true);
    if (!roster.ok) return;
    const ids = roster.data.map((m) => m.id);
    const reversed = [...ids].reverse();
    const saved = await setRotationOrder(nomsa, IDS.sowetoSavers, reversed);
    expect(saved.ok).toBe(true);

    const stokvel = await getStokvel(nomsa, IDS.sowetoSavers);
    expect(stokvel.ok).toBe(true);
    if (stokvel.ok) expect(stokvel.data.rotationOrder).toEqual(reversed);

    await setRotationOrder(nomsa, IDS.sowetoSavers, ids); // restore
  });

  it("T-STOKVEL-5 deleteStokvel is organizer-only (OP9)", async () => {
    const nomsa = await signInAs("nomsa@stokvelos.app");
    const sipho = await signInAs("sipho@stokvelos.app");
    const created = await createStokvel(nomsa, {
      name: "Delete Me",
      contributionAmount: 100,
      contributionFrequency: "monthly",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const denied = await deleteStokvel(sipho, created.data.id);
    expect(denied).toEqual({ ok: false, message: MESSAGES.onlyOrganizer });

    const ok = await deleteStokvel(nomsa, created.data.id);
    expect(ok.ok).toBe(true);
  });
});
