// Checklist #16: the owner's dashboard reads every booking of their clinic
// in the range, a physio only their own, and nobody reads another clinic's.
import { afterAll, describe, expect, it, vi } from "vitest";
import { bookings } from "@/features/booking/table";
import { bookable, bookingRow } from "./booking-seed";
import { seedTwoClinics } from "./test-seed";
import { asUser, closeTestDb, rolledBack, type Tx } from "./test-support";

vi.mock("server-only", () => ({}));
// The test runs the query inside its own rolled-back transaction instead.
vi.mock("@/lib/db", () => ({ withRls: vi.fn() }));
const { clinicBookings } = await import("@/features/dashboard/queries");

afterAll(closeTestDb);

const RANGE = {
  from: new Date("2026-11-01T00:00:00Z"),
  to: new Date("2026-12-01T00:00:00Z"),
};

async function seed(tx: Tx) {
  const clinics = await seedTwoClinics(tx);
  const { a, b } = clinics;
  const inA = await bookable(tx, a);
  const inB = await bookable(tx, b);
  const inAWith = (membershipId: string, startsAt: string) =>
    bookingRow({
      clinicId: a.id,
      serviceId: inA.serviceId,
      membershipId,
      patientId: a.patient,
      startsAt,
    });
  await tx.insert(bookings).values([
    inAWith(inA.physio, "2026-11-18T08:00:00Z"),
    inAWith(inA.colleaguePhysio, "2026-11-18T09:00:00Z"),
    { ...inAWith(inA.physio, "2026-11-18T10:00:00Z"), status: "refunded" },
    { ...inAWith(inA.physio, "2026-11-18T11:00:00Z"), status: "expired" },
    // Outside the range.
    inAWith(inA.physio, "2026-12-02T08:00:00Z"),
    bookingRow({
      clinicId: b.id,
      serviceId: inB.serviceId,
      membershipId: inB.physio,
      patientId: b.patient,
      startsAt: "2026-11-18T08:00:00Z",
    }),
  ]);
  return clinics;
}

describe("clinicBookings", () => {
  it("gives the owner every booking of the clinic in the range, expired holds aside", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seed(tx);
      const rows = await asUser(tx, a.owner, (db) =>
        clinicBookings(db, a.id, RANGE),
      );
      expect(rows.map((r) => r.status).sort()).toEqual([
        "confirmed",
        "confirmed",
        "refunded",
      ]);
      expect(rows[0]?.serviceName).toBe("Follow-up");
    });
  });

  it("gives a physio only their own sessions", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seed(tx);
      const rows = await asUser(tx, a.practitioner, (db) =>
        clinicBookings(db, a.id, RANGE),
      );
      expect(rows).toHaveLength(2);
    });
  });

  it("gives another clinic's owner and a patient nothing", async () => {
    await rolledBack(async (tx) => {
      const { a, b } = await seed(tx);
      for (const user of [b.owner, a.otherPatient]) {
        const rows = await asUser(tx, user, (db) =>
          clinicBookings(db, a.id, RANGE),
        );
        expect(rows).toEqual([]);
      }
    });
  });
});
