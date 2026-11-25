import { describe, expect, it } from "vitest";
import { signInAs } from "./helpers";
import { getAdminStats } from "@/lib/api/admin";
import { MESSAGES } from "@/lib/messages";

describe("Phase 2 admin integration (SEC21)", () => {
  it("T-ADMIN-1 admin gets aggregate counts only", async () => {
    const admin = await signInAs("admin@stokvelos.app");
    const result = await getAdminStats(admin);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.totalStokvels).toBeGreaterThanOrEqual(3);
      expect(result.data.totalMembers).toBeGreaterThanOrEqual(5);
      expect(Object.keys(result.data).sort()).toEqual(["totalMembers", "totalStokvels"]);
    }
  });

  it("T-ADMIN-2 non-admin is denied", async () => {
    const nomsa = await signInAs("nomsa@stokvelos.app");
    const result = await getAdminStats(nomsa);
    expect(result).toEqual({ ok: false, message: MESSAGES.onlyOrganizer });
  });
});
