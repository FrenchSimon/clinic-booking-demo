// Checklist #3, #4 and #5: everyone in a clinic reads its services, only its
// owner changes them, and a service only lists physios of the same clinic.
import { and, eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { memberships } from "@/features/clinics/table";
import { servicePractitioners, services } from "@/features/services/table";
import { seedTwoClinics } from "./test-seed";
import {
  asUser,
  closeTestDb,
  expectDenied,
  one,
  rolledBack,
  type Tx,
} from "./test-support";

afterAll(closeTestDb);

const massage = { name: "Massage", durationMinutes: 30, priceCents: 4000 };

async function membershipId(tx: Tx, clinicId: string, userId: string) {
  const row = one(
    await tx
      .select({ id: memberships.id })
      .from(memberships)
      .where(
        and(eq(memberships.clinicId, clinicId), eq(memberships.userId, userId)),
      ),
  );
  return row.id;
}

/** Two clinics, each with one service offered by its physio. */
async function seed(tx: Tx) {
  const clinics = await seedTwoClinics(tx);
  for (const c of [clinics.a, clinics.b]) {
    const service = one(
      await tx
        .insert(services)
        .values({ clinicId: c.id, ...massage })
        .returning({ id: services.id }),
    );
    await tx.insert(servicePractitioners).values({
      clinicId: c.id,
      serviceId: service.id,
      membershipId: await membershipId(tx, c.id, c.practitioner),
    });
  }
  return clinics;
}

function visible(tx: Tx, userId: string) {
  return asUser(tx, userId, async (db) => ({
    services: (await db.select({ c: services.clinicId }).from(services)).map(
      (r) => r.c,
    ),
    links: (
      await db
        .select({ c: servicePractitioners.clinicId })
        .from(servicePractitioners)
    ).map((r) => r.c),
  }));
}

describe("reading services", () => {
  it("shows every member their own clinic's services only", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seed(tx);
      for (const user of [a.owner, a.practitioner, a.patient]) {
        expect(await visible(tx, user)).toEqual({
          services: [a.id],
          links: [a.id],
        });
      }
    });
  });

  it("shows nothing to a user outside the clinic", async () => {
    await rolledBack(async (tx) => {
      const { outsider } = await seed(tx);
      expect(await visible(tx, outsider)).toEqual({ services: [], links: [] });
    });
  });
});

describe("changing services", () => {
  it("lets the owner add a service offered by their physio", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seed(tx);
      const physio = await membershipId(tx, a.id, a.practitioner);
      await asUser(tx, a.owner, async (db) => {
        const service = one(
          await db
            .insert(services)
            .values({ clinicId: a.id, ...massage, name: "Dry needling" })
            .returning({ id: services.id }),
        );
        await db.insert(servicePractitioners).values({
          clinicId: a.id,
          serviceId: service.id,
          membershipId: physio,
        });
      });
      expect((await visible(tx, a.owner)).links).toHaveLength(2);
    });
  });

  it("does not let physios or patients add, change or delete one", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seed(tx);
      for (const user of [a.practitioner, a.patient]) {
        await expectDenied(tx, user, (db) =>
          db.insert(services).values({ clinicId: a.id, ...massage, name: "X" }),
        );
        const changed = await asUser(tx, user, async (db) => [
          ...(await db
            .update(services)
            .set({ priceCents: 50 })
            .where(eq(services.clinicId, a.id))
            .returning()),
          ...(await db
            .delete(servicePractitioners)
            .where(eq(servicePractitioners.clinicId, a.id))
            .returning()),
        ]);
        expect(changed).toEqual([]);
      }
    });
  });

  it("does not let an owner touch another clinic's services", async () => {
    await rolledBack(async (tx) => {
      const { a, b } = await seed(tx);
      await expectDenied(tx, a.owner, (db) =>
        db.insert(services).values({ clinicId: b.id, ...massage, name: "X" }),
      );
      const changed = await asUser(tx, a.owner, async (db) => [
        ...(await db
          .update(services)
          .set({ priceCents: 50 })
          .where(eq(services.clinicId, b.id))
          .returning()),
        ...(await db
          .delete(services)
          .where(eq(services.clinicId, b.id))
          .returning()),
      ]);
      expect(changed).toEqual([]);
    });
  });

  it("only lists physios of the clinic as offering a service", async () => {
    await rolledBack(async (tx) => {
      const { a, b } = await seed(tx);
      const service = one(
        await tx
          .select({ id: services.id })
          .from(services)
          .where(eq(services.clinicId, a.id)),
      );
      // The owner and patients are not physios; clinic B's physio is not theirs.
      for (const [clinicId, user] of [
        [a.id, a.owner],
        [a.id, a.patient],
        [b.id, b.practitioner],
      ] as const) {
        const target = await membershipId(tx, clinicId, user);
        await expect(
          asUser(tx, a.owner, (db) =>
            db.insert(servicePractitioners).values({
              clinicId: a.id,
              serviceId: service.id,
              membershipId: target,
            }),
          ),
        ).rejects.toThrow();
      }
    });
  });
});
