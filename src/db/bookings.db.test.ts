// Checklist #4 and #17: a patient sees only their bookings, a physio only
// their own agenda, the owner the whole clinic. Nobody writes a booking as
// themselves: holds and confirmations go through checked server code.
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { bookings } from "@/features/booking/table";
import { bookable, bookingRow } from "./booking-seed";
import { seedTwoClinics } from "./test-seed";
import {
  asUser,
  closeTestDb,
  expectDenied,
  rolledBack,
  type Tx,
} from "./test-support";

afterAll(closeTestDb);

/** One booking per physio in clinic A, with different patients, and one in clinic B. */
async function seed(tx: Tx) {
  const clinics = await seedTwoClinics(tx);
  const { a, b } = clinics;
  const inA = await bookable(tx, a);
  const inB = await bookable(tx, b);
  await tx.insert(bookings).values([
    bookingRow({
      clinicId: a.id,
      serviceId: inA.serviceId,
      membershipId: inA.physio,
      patientId: a.patient,
      startsAt: "2026-12-01T08:00:00Z",
    }),
    bookingRow({
      clinicId: a.id,
      serviceId: inA.serviceId,
      membershipId: inA.colleaguePhysio,
      patientId: a.otherPatient,
      startsAt: "2026-12-01T08:00:00Z",
    }),
    bookingRow({
      clinicId: b.id,
      serviceId: inB.serviceId,
      membershipId: inB.physio,
      patientId: b.patient,
      startsAt: "2026-12-01T08:00:00Z",
    }),
  ]);
  return { ...clinics, inA };
}

function visible(tx: Tx, userId: string) {
  return asUser(tx, userId, async (db) =>
    (await db.select({ patientId: bookings.patientId }).from(bookings))
      .map((r) => r.patientId)
      .sort(),
  );
}

describe("reading bookings", () => {
  it("shows a patient only their own", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seed(tx);
      expect(await visible(tx, a.patient)).toEqual([a.patient]);
    });
  });

  it("shows a physio only their own agenda", async () => {
    await rolledBack(async (tx) => {
      const { a, inA } = await seed(tx);
      expect(await visible(tx, a.practitioner)).toEqual([a.patient]);
      expect(await visible(tx, inA.colleague)).toEqual([a.otherPatient]);
    });
  });

  it("shows the owner the whole clinic and nothing of another", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seed(tx);
      expect(await visible(tx, a.owner)).toEqual(
        [a.patient, a.otherPatient].sort(),
      );
    });
  });

  it("shows nothing to a user outside the clinic", async () => {
    await rolledBack(async (tx) => {
      const { outsider } = await seed(tx);
      expect(await visible(tx, outsider)).toEqual([]);
    });
  });
});

describe("writing bookings", () => {
  it("is refused to everyone, owner and patient included", async () => {
    await rolledBack(async (tx) => {
      const { a, inA } = await seed(tx);
      for (const user of [a.owner, a.practitioner, a.patient]) {
        await expectDenied(tx, user, (db) =>
          db.insert(bookings).values(
            bookingRow({
              clinicId: a.id,
              serviceId: inA.serviceId,
              membershipId: inA.physio,
              patientId: a.patient,
              startsAt: "2026-12-02T08:00:00Z",
            }),
          ),
        );
        const changed = await asUser(tx, user, async (db) => [
          ...(await db
            .update(bookings)
            .set({ status: "confirmed", priceCents: 50 })
            .where(eq(bookings.clinicId, a.id))
            .returning()),
          ...(await db
            .delete(bookings)
            .where(eq(bookings.clinicId, a.id))
            .returning()),
        ]);
        expect(changed).toEqual([]);
      }
    });
  });
});
