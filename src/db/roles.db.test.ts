// Checklist #4: inside a clinic, each role sees and changes only what it may.
// A patient sees their own data and the staff, never the other patients.
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { clinics, memberships } from "@/features/clinics/table";
import { emails } from "@/features/email/table";
import { invitations } from "@/features/invitations/table";
import { seedTwoClinics } from "./test-seed";
import {
  asUser,
  closeTestDb,
  expectDenied,
  rolledBack,
  type Tx,
} from "./test-support";

afterAll(closeTestDb);

function visibleMembers(tx: Tx, userId: string) {
  return asUser(tx, userId, async (db) =>
    (await db.select({ userId: memberships.userId }).from(memberships))
      .map((r) => r.userId)
      .sort(),
  );
}

function visibleStaffOnlyRows(tx: Tx, userId: string) {
  return asUser(tx, userId, async (db) => ({
    invitations: await db.select().from(invitations),
    emails: await db.select().from(emails),
  }));
}

describe("patient", () => {
  it("sees their clinic, themselves and the staff, not other patients", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seedTwoClinics(tx);
      const seenClinics = await asUser(tx, a.patient, (db) =>
        db.select({ id: clinics.id }).from(clinics),
      );
      expect(seenClinics).toEqual([{ id: a.id }]);
      expect(await visibleMembers(tx, a.patient)).toEqual(
        [a.owner, a.practitioner, a.patient].sort(),
      );
    });
  });

  it("sees no invitations and no emails", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seedTwoClinics(tx);
      expect(await visibleStaffOnlyRows(tx, a.patient)).toEqual({
        invitations: [],
        emails: [],
      });
    });
  });

  it("cannot change the clinic or anyone's role, their own included", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seedTwoClinics(tx);
      const changed = await asUser(tx, a.patient, async (db) => [
        ...(await db
          .update(clinics)
          .set({ name: "Mine now" })
          .where(eq(clinics.id, a.id))
          .returning()),
        ...(await db
          .update(memberships)
          .set({ role: "owner" })
          .where(eq(memberships.userId, a.patient))
          .returning()),
        ...(await db
          .delete(memberships)
          .where(eq(memberships.userId, a.practitioner))
          .returning()),
      ]);
      expect(changed).toEqual([]);
    });
  });

  it("cannot add themselves as owner", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seedTwoClinics(tx);
      await expectDenied(tx, a.patient, (db) =>
        db
          .insert(memberships)
          .values({ clinicId: a.id, userId: a.patient, role: "owner" })
          .onConflictDoUpdate({
            target: [memberships.clinicId, memberships.userId],
            set: { role: "owner" },
          }),
      );
    });
  });

  it("of one clinic sees nothing of another", async () => {
    await rolledBack(async (tx) => {
      const { a, b } = await seedTwoClinics(tx);
      const seenClinics = await asUser(tx, b.patient, (db) =>
        db.select({ id: clinics.id }).from(clinics),
      );
      expect(seenClinics).toEqual([{ id: b.id }]);
      const members = await visibleMembers(tx, b.patient);
      expect(members).not.toContain(a.owner);
      expect(members).not.toContain(a.patient);
    });
  });
});

describe("practitioner", () => {
  it("sees every member of their clinic, patients included, and no one else", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seedTwoClinics(tx);
      expect(await visibleMembers(tx, a.practitioner)).toEqual(
        [a.owner, a.practitioner, a.patient, a.otherPatient].sort(),
      );
    });
  });

  it("sees no invitations and no emails", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seedTwoClinics(tx);
      expect(await visibleStaffOnlyRows(tx, a.practitioner)).toEqual({
        invitations: [],
        emails: [],
      });
    });
  });

  it("cannot change the clinic or remove a member", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seedTwoClinics(tx);
      const changed = await asUser(tx, a.practitioner, async (db) => [
        ...(await db
          .update(clinics)
          .set({ name: "Mine now" })
          .where(eq(clinics.id, a.id))
          .returning()),
        ...(await db
          .delete(memberships)
          .where(eq(memberships.userId, a.patient))
          .returning()),
      ]);
      expect(changed).toEqual([]);
    });
  });

  it("cannot add members or invite physios", async () => {
    await rolledBack(async (tx) => {
      const { a, outsider } = await seedTwoClinics(tx);
      await expectDenied(tx, a.practitioner, (db) =>
        db
          .insert(memberships)
          .values({ clinicId: a.id, userId: outsider, role: "practitioner" }),
      );
      await expectDenied(tx, a.practitioner, (db) =>
        db.insert(invitations).values({
          clinicId: a.id,
          name: "Friend",
          email: "friend@test.kinora.invalid",
          tokenHash: "not-a-real-hash",
          invitedBy: a.practitioner,
        }),
      );
    });
  });
});
