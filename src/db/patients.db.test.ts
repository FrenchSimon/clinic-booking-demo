// Checklist #16: the owner sees the clinic's patients with their email and
// paid sessions. A physio, a patient or another clinic's owner sees nobody.
import { afterAll, describe, expect, it, vi } from "vitest";
import { bookings } from "@/features/booking/table";
import { bookable, bookingRow, membershipId } from "./booking-seed";
import { seedTwoClinics } from "./test-seed";
import { asUser, closeTestDb, rolledBack, type Tx } from "./test-support";

vi.mock("server-only", () => ({}));
// The test runs the query inside its own rolled-back transaction instead.
vi.mock("@/lib/db", () => ({ withRls: vi.fn() }));
const { clinicPatients } = await import("@/features/patients/queries");

afterAll(closeTestDb);

const AT = new Date("2026-11-18T12:00:00Z");

async function seed(tx: Tx) {
  const clinics = await seedTwoClinics(tx);
  const { a } = clinics;
  const inA = await bookable(tx, a);
  const row = (startsAt: string, status?: "cancelled" | "expired") => ({
    ...bookingRow({
      clinicId: a.id,
      serviceId: inA.serviceId,
      membershipId: inA.physio,
      patientId: a.patient,
      startsAt,
    }),
    ...(status ? { status } : {}),
  });
  await tx
    .insert(bookings)
    .values([
      row("2026-11-04T08:00:00Z"),
      row("2026-11-11T08:00:00Z"),
      row("2026-11-12T08:00:00Z", "cancelled"),
      row("2026-11-25T08:00:00Z"),
      row("2026-11-20T08:00:00Z", "expired"),
    ]);
  return clinics;
}

describe("clinicPatients", () => {
  it("gives the owner each patient with their paid sessions", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seed(tx);
      const list = await asUser(tx, a.owner, (db) =>
        clinicPatients(db, a.id, AT),
      );
      expect(list).toHaveLength(2);
      const patient = list.find(
        (p) => p.email === `${a.patient}@test.kinora.invalid`,
      );
      expect(patient).toMatchObject({
        id: await membershipId(tx, a.id, a.patient),
        pastSessions: 2,
        lastSession: new Date("2026-11-11T08:00:00Z"),
        nextSession: new Date("2026-11-25T08:00:00Z"),
      });
      const other = list.find((p) => p.id !== patient?.id);
      expect(other).toMatchObject({
        pastSessions: 0,
        lastSession: null,
        nextSession: null,
      });
    });
  });

  it("never lists staff as patients", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seed(tx);
      const list = await asUser(tx, a.owner, (db) =>
        clinicPatients(db, a.id, AT),
      );
      const emails = list.map((p) => p.email);
      expect(emails).not.toContain(`${a.owner}@test.kinora.invalid`);
      expect(emails).not.toContain(`${a.practitioner}@test.kinora.invalid`);
    });
  });

  it("gives a physio, a patient, another owner and an outsider nobody", async () => {
    await rolledBack(async (tx) => {
      const { a, b, outsider } = await seed(tx);
      for (const user of [a.practitioner, a.patient, b.owner, outsider]) {
        const list = await asUser(tx, user, (db) =>
          clinicPatients(db, a.id, AT),
        );
        expect(list).toEqual([]);
      }
    });
  });
});
