// Checklist #17: a physio's agenda holds their own sessions and the email of
// their own patients, never a colleague's, and nobody reads another clinic's.
import { afterAll, describe, expect, it, vi } from "vitest";
import { bookings } from "@/features/booking/table";
import { bookable, bookingRow } from "./booking-seed";
import { seedTwoClinics } from "./test-seed";
import { asUser, closeTestDb, rolledBack, type Tx } from "./test-support";

vi.mock("server-only", () => ({}));
// The test runs the query inside its own rolled-back transaction instead.
vi.mock("@/lib/db", () => ({ withRls: vi.fn() }));
const { agendaBookings, agendaPatientEmails } = await import(
  "@/features/agenda/queries"
);

afterAll(closeTestDb);

const WEEK = {
  from: new Date("2026-11-15T23:00:00Z"),
  to: new Date("2026-11-22T23:00:00Z"),
};

const email = (userId: string) => `${userId}@test.kinora.invalid`;

async function seed(tx: Tx) {
  const clinics = await seedTwoClinics(tx);
  const { a, b } = clinics;
  const inA = await bookable(tx, a);
  const inB = await bookable(tx, b);
  const inAWith = (membershipId: string, patientId: string, startsAt: string) =>
    bookingRow({
      clinicId: a.id,
      serviceId: inA.serviceId,
      membershipId,
      patientId,
      startsAt,
    });
  await tx.insert(bookings).values([
    inAWith(inA.physio, a.patient, "2026-11-18T08:00:00Z"),
    {
      ...inAWith(inA.physio, a.patient, "2026-11-19T08:00:00Z"),
      status: "cancelled",
    },
    {
      ...inAWith(inA.physio, a.patient, "2026-11-20T08:00:00Z"),
      status: "expired",
    },
    // Next week: outside the range.
    inAWith(inA.physio, a.patient, "2026-11-24T08:00:00Z"),
    inAWith(inA.colleaguePhysio, a.otherPatient, "2026-11-18T09:00:00Z"),
    bookingRow({
      clinicId: b.id,
      serviceId: inB.serviceId,
      membershipId: inB.physio,
      patientId: b.patient,
      startsAt: "2026-11-18T08:00:00Z",
    }),
  ]);
  return { ...clinics, colleague: inA.colleague };
}

describe("agendaBookings", () => {
  it("gives a physio their own sessions of the week, expired holds aside", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seed(tx);
      const rows = await asUser(tx, a.practitioner, (db) =>
        agendaBookings(db, a.practitioner, a.id, WEEK),
      );
      expect(rows.map((r) => r.status).sort()).toEqual([
        "cancelled",
        "confirmed",
      ]);
      expect(rows.every((r) => r.patientId === a.patient)).toBe(true);
    });
  });

  it("never gives a physio a colleague's sessions, even when asked for them", async () => {
    await rolledBack(async (tx) => {
      const { a, colleague } = await seed(tx);
      const rows = await asUser(tx, a.practitioner, (db) =>
        agendaBookings(db, colleague, a.id, WEEK),
      );
      expect(rows).toEqual([]);
    });
  });

  it("gives another clinic's physio and a patient nothing", async () => {
    await rolledBack(async (tx) => {
      const { a, b } = await seed(tx);
      for (const user of [b.practitioner, a.otherPatient]) {
        const rows = await asUser(tx, user, (db) =>
          agendaBookings(db, a.practitioner, a.id, WEEK),
        );
        expect(rows).toEqual([]);
      }
    });
  });
});

describe("agendaPatientEmails", () => {
  it("gives a physio the email of their own patients only", async () => {
    await rolledBack(async (tx) => {
      const { a, colleague } = await seed(tx);
      const mine = await asUser(tx, a.practitioner, (db) =>
        agendaPatientEmails(db, a.id),
      );
      expect(mine).toEqual([{ userId: a.patient, email: email(a.patient) }]);
      const theirs = await asUser(tx, colleague, (db) =>
        agendaPatientEmails(db, a.id),
      );
      expect(theirs.map((p) => p.userId)).toEqual([a.otherPatient]);
    });
  });

  it("gives another clinic's physio, an owner without sessions and a patient nobody", async () => {
    await rolledBack(async (tx) => {
      const { a, b } = await seed(tx);
      for (const user of [b.practitioner, a.owner, a.patient]) {
        const list = await asUser(tx, user, (db) =>
          agendaPatientEmails(db, a.id),
        );
        expect(list).toEqual([]);
      }
    });
  });
});
