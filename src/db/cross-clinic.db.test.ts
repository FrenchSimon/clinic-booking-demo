// Checklist #3: no one reads or writes another clinic's data, whatever the
// app code does. Each query runs as a signed-in user, like withRls().
import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { DEFAULT_OPENING_HOURS } from "@/features/clinics/schema";
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

// Everything a user can read, as ids per table.
function visible(tx: Tx, userId: string) {
  return asUser(tx, userId, async (db) => ({
    clinics: (await db.select({ id: clinics.id }).from(clinics)).map(
      (r) => r.id,
    ),
    memberships: (
      await db.select({ clinicId: memberships.clinicId }).from(memberships)
    ).map((r) => r.clinicId),
    invitations: (
      await db.select({ clinicId: invitations.clinicId }).from(invitations)
    ).map((r) => r.clinicId),
    emails: (await db.select({ clinicId: emails.clinicId }).from(emails)).map(
      (r) => r.clinicId,
    ),
  }));
}

describe("row level security", () => {
  it("is on for every table in the public schema", async () => {
    await rolledBack(async (tx) => {
      const rows = await tx.execute<{ name: string }>(
        sql`select relname as name from pg_class
            where relnamespace = 'public'::regnamespace
              and relkind in ('r', 'p') and not relrowsecurity`,
      );
      expect([...rows]).toEqual([]);
    });
  });
});

describe("cross-clinic reads", () => {
  it("shows an owner only their own clinic's rows", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seedTwoClinics(tx);
      const seen = await visible(tx, a.owner);
      expect(seen.clinics).toEqual([a.id]);
      expect(seen.memberships).toHaveLength(4);
      expect(new Set(seen.memberships)).toEqual(new Set([a.id]));
      expect(seen.invitations).toEqual([a.id]);
      expect(seen.emails).toEqual([a.id]);
    });
  });

  it("shows nothing to a user outside every clinic", async () => {
    await rolledBack(async (tx) => {
      const { outsider } = await seedTwoClinics(tx);
      expect(await visible(tx, outsider)).toEqual({
        clinics: [],
        memberships: [],
        invitations: [],
        emails: [],
      });
    });
  });

  it("hides another clinic even when its id is known", async () => {
    await rolledBack(async (tx) => {
      const { a, b } = await seedTwoClinics(tx);
      const rows = await asUser(tx, a.owner, (db) =>
        db.select().from(clinics).where(eq(clinics.id, b.id)),
      );
      expect(rows).toEqual([]);
    });
  });
});

describe("cross-clinic writes", () => {
  it("does not let an owner change or delete another clinic", async () => {
    await rolledBack(async (tx) => {
      const { a, b } = await seedTwoClinics(tx);
      const changed = await asUser(tx, a.owner, async (db) => [
        ...(await db
          .update(clinics)
          .set({ name: "Taken over" })
          .where(eq(clinics.id, b.id))
          .returning()),
        ...(await db.delete(clinics).where(eq(clinics.id, b.id)).returning()),
        ...(await db
          .delete(memberships)
          .where(eq(memberships.clinicId, b.id))
          .returning()),
        ...(await db
          .delete(invitations)
          .where(eq(invitations.clinicId, b.id))
          .returning()),
      ]);
      expect(changed).toEqual([]);

      const [clinicB] = await tx
        .select({ name: clinics.name })
        .from(clinics)
        .where(eq(clinics.id, b.id));
      expect(clinicB?.name).toBe("Clinic B");
    });
  });

  it("does not let an owner join another clinic", async () => {
    await rolledBack(async (tx) => {
      const { a, b } = await seedTwoClinics(tx);
      await expectDenied(tx, a.owner, (db) =>
        db
          .insert(memberships)
          .values({ clinicId: b.id, userId: a.owner, role: "owner" }),
      );
    });
  });

  it("does not let an owner move a member to another clinic", async () => {
    await rolledBack(async (tx) => {
      const { a, b } = await seedTwoClinics(tx);
      await expectDenied(tx, a.owner, (db) =>
        db
          .update(memberships)
          .set({ clinicId: b.id })
          .where(eq(memberships.userId, a.patient)),
      );
    });
  });

  it("does not let an owner invite or email for another clinic", async () => {
    await rolledBack(async (tx) => {
      const { a, b } = await seedTwoClinics(tx);
      await expectDenied(tx, a.owner, (db) =>
        db.insert(invitations).values({
          clinicId: b.id,
          name: "Intruder",
          email: "intruder@test.kinora.invalid",
          tokenHash: "not-a-real-hash",
          invitedBy: a.owner,
        }),
      );
      await expectDenied(tx, a.owner, (db) =>
        db.insert(emails).values({
          clinicId: b.id,
          kind: "practitioner_invite",
          dedupeKey: "test-intruder",
          toEmail: "intruder@test.kinora.invalid",
          subject: "Hi",
          html: "<p>Hi</p>",
          text: "Hi",
        }),
      );
    });
  });

  it("does not let anyone create a clinic in another user's name", async () => {
    await rolledBack(async (tx) => {
      const { b, outsider } = await seedTwoClinics(tx);
      await expectDenied(tx, outsider, (db) =>
        db.insert(clinics).values({
          name: "Fake clinic",
          slug: "fake-clinic-test",
          address: "Nowhere",
          openingHours: DEFAULT_OPENING_HOURS,
          createdBy: b.owner,
        }),
      );
    });
  });
});
