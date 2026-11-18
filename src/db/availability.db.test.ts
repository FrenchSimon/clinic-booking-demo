// Checklist #6 and #17: each physio sets their own hours and days off. The
// owner reads them; other physios, patients and other clinics see nothing.
import { and, eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { daysOff, practitionerHours } from "@/features/availability/table";
import { DEFAULT_OPENING_HOURS } from "@/features/clinics/schema";
import { memberships } from "@/features/clinics/table";
import { createUser, seedTwoClinics } from "./test-seed";
import {
  asUser,
  closeTestDb,
  expectDenied,
  one,
  rolledBack,
  type Tx,
} from "./test-support";

afterAll(closeTestDb);

async function membershipId(tx: Tx, clinicId: string, userId: string) {
  return one(
    await tx
      .select({ id: memberships.id })
      .from(memberships)
      .where(
        and(eq(memberships.clinicId, clinicId), eq(memberships.userId, userId)),
      ),
  ).id;
}

/** Two clinics; clinic A gets a second physio. Each physio has hours and a day off. */
async function seed(tx: Tx) {
  const clinics = await seedTwoClinics(tx);
  const colleague = await createUser(tx);
  await tx.insert(memberships).values({
    clinicId: clinics.a.id,
    userId: colleague,
    role: "practitioner",
  });
  const physios = [
    [clinics.a.id, clinics.a.practitioner],
    [clinics.a.id, colleague],
    [clinics.b.id, clinics.b.practitioner],
  ] as const;
  for (const [clinicId, user] of physios) {
    const id = await membershipId(tx, clinicId, user);
    await tx.insert(practitionerHours).values({
      clinicId,
      membershipId: id,
      weeklyHours: DEFAULT_OPENING_HOURS,
    });
    await tx.insert(daysOff).values({
      clinicId,
      membershipId: id,
      startsOn: "2026-12-24",
      endsOn: "2026-12-26",
    });
  }
  return { ...clinics, colleague };
}

function visible(tx: Tx, userId: string) {
  return asUser(tx, userId, async (db) => ({
    hours: (
      await db
        .select({ id: practitionerHours.membershipId })
        .from(practitionerHours)
    ).length,
    daysOff: (await db.select({ id: daysOff.id }).from(daysOff)).length,
  }));
}

describe("reading hours and days off", () => {
  it("shows a physio only their own", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seed(tx);
      expect(await visible(tx, a.practitioner)).toEqual({
        hours: 1,
        daysOff: 1,
      });
    });
  });

  it("shows the owner every physio of their clinic, no other clinic", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seed(tx);
      expect(await visible(tx, a.owner)).toEqual({ hours: 2, daysOff: 2 });
    });
  });

  it("shows nothing to patients and outsiders", async () => {
    await rolledBack(async (tx) => {
      const { a, outsider } = await seed(tx);
      for (const user of [a.patient, outsider]) {
        expect(await visible(tx, user)).toEqual({ hours: 0, daysOff: 0 });
      }
    });
  });
});

describe("changing hours and days off", () => {
  it("lets a physio change their hours and add or remove a day off", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seed(tx);
      const mine = await membershipId(tx, a.id, a.practitioner);
      await asUser(tx, a.practitioner, async (db) => {
        await db
          .update(practitionerHours)
          .set({
            weeklyHours: { ...DEFAULT_OPENING_HOURS, mon: { open: false } },
          })
          .where(eq(practitionerHours.membershipId, mine));
        await db.insert(daysOff).values({
          clinicId: a.id,
          membershipId: mine,
          startsOn: "2027-01-02",
          endsOn: "2027-01-02",
        });
        await db.delete(daysOff).where(eq(daysOff.startsOn, "2026-12-24"));
      });
      const rows = await tx
        .select({ startsOn: daysOff.startsOn })
        .from(daysOff)
        .where(eq(daysOff.membershipId, mine));
      expect(rows).toEqual([{ startsOn: "2027-01-02" }]);
    });
  });

  it("does not let a physio touch a colleague's hours or days off", async () => {
    await rolledBack(async (tx) => {
      const { a, colleague } = await seed(tx);
      const theirs = await membershipId(tx, a.id, colleague);
      await expectDenied(tx, a.practitioner, (db) =>
        db.insert(daysOff).values({
          clinicId: a.id,
          membershipId: theirs,
          startsOn: "2027-01-02",
          endsOn: "2027-01-02",
        }),
      );
      const changed = await asUser(tx, a.practitioner, async (db) => [
        ...(await db
          .update(practitionerHours)
          .set({ weeklyHours: DEFAULT_OPENING_HOURS })
          .where(eq(practitionerHours.membershipId, theirs))
          .returning()),
        ...(await db
          .delete(daysOff)
          .where(eq(daysOff.membershipId, theirs))
          .returning()),
      ]);
      expect(changed).toEqual([]);
    });
  });

  it("does not let the owner or a patient write a physio's schedule", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seed(tx);
      const physio = await membershipId(tx, a.id, a.practitioner);
      for (const user of [a.owner, a.patient]) {
        await expectDenied(tx, user, (db) =>
          db.insert(daysOff).values({
            clinicId: a.id,
            membershipId: physio,
            startsOn: "2027-01-02",
            endsOn: "2027-01-02",
          }),
        );
        const changed = await asUser(tx, user, (db) =>
          db
            .delete(daysOff)
            .where(eq(daysOff.membershipId, physio))
            .returning(),
        );
        expect(changed).toEqual([]);
      }
    });
  });

  it("refuses a day off that ends before it starts", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seed(tx);
      const mine = await membershipId(tx, a.id, a.practitioner);
      await expect(
        asUser(tx, a.practitioner, (db) =>
          db.insert(daysOff).values({
            clinicId: a.id,
            membershipId: mine,
            startsOn: "2027-01-05",
            endsOn: "2027-01-02",
          }),
        ),
      ).rejects.toThrow();
    });
  });
});
