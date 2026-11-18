// Checklist #11: the patient's list holds their bookings across clinics,
// with what the page shows, and nobody else's.
import { afterAll, describe, expect, it, vi } from "vitest";
import { bookings } from "@/features/booking/table";
import { memberships } from "@/features/clinics/table";
import { bookable, bookingRow } from "./booking-seed";
import { seedTwoClinics } from "./test-seed";
import { asUser, closeTestDb, rolledBack, type Tx } from "./test-support";

vi.mock("server-only", () => ({}));
// The test runs the query inside its own rolled-back transaction instead.
vi.mock("@/lib/db", () => ({ withRls: vi.fn() }));
const { myBookings } = await import("@/features/booking/queries");

afterAll(closeTestDb);

async function seed(tx: Tx) {
  const clinics = await seedTwoClinics(tx);
  const { a, b } = clinics;
  const inA = await bookable(tx, a);
  const inB = await bookable(tx, b);
  const inAFor = (patientId: string, startsAt: string) =>
    bookingRow({
      clinicId: a.id,
      serviceId: inA.serviceId,
      membershipId: inA.physio,
      patientId,
      startsAt,
    });
  // A hold makes the patient a member of the clinic (drizzle/0014).
  await tx
    .insert(memberships)
    .values({ clinicId: b.id, userId: a.patient, role: "patient" });
  await tx.insert(bookings).values([
    inAFor(a.patient, "2026-12-01T08:00:00Z"),
    { ...inAFor(a.patient, "2026-12-02T08:00:00Z"), status: "expired" },
    inAFor(a.otherPatient, "2026-12-03T08:00:00Z"),
    // The same patient also books in clinic B.
    bookingRow({
      clinicId: b.id,
      serviceId: inB.serviceId,
      membershipId: inB.physio,
      patientId: a.patient,
      startsAt: "2026-12-04T08:00:00Z",
    }),
  ]);
  return clinics;
}

describe("myBookings", () => {
  it("lists the patient's bookings in every clinic, never-paid holds aside", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seed(tx);
      const rows = await asUser(tx, a.patient, (db) =>
        myBookings(db, a.patient),
      );
      expect(rows.map((r) => r.clinicName).sort()).toEqual([
        "Clinic A",
        "Clinic B",
      ]);
      expect(rows.every((r) => r.status === "confirmed")).toBe(true);
      expect(rows[0]?.serviceName).toBe("Follow-up");
    });
  });

  it("returns nothing when asked for another patient's bookings", async () => {
    await rolledBack(async (tx) => {
      const { a, outsider } = await seed(tx);
      const rows = await asUser(tx, outsider, (db) =>
        myBookings(db, a.patient),
      );
      expect(rows).toEqual([]);
    });
  });
});
