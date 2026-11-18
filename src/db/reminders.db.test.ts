// Checklist #15: the day-before reminder goes out once per booking, only
// for a confirmed session tomorrow (Brussels time), never for a cancelled
// one, even when the daily job runs twice at the same moment.
import { inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { authUsers } from "drizzle-orm/supabase";
import postgres from "postgres";
import { afterAll, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import { type BookingStatus, bookings } from "@/features/booking/table";
import { emails } from "@/features/email/table";
import { bookable, bookingRow } from "./booking-seed";
import { seedTwoClinics } from "./test-seed";
import { closeTestDb, rolledBack, type Tx, testDb } from "./test-support";

vi.mock("server-only", () => ({}));
const { queueTomorrowsReminders } = await import(
  "@/features/booking/reminders"
);

afterAll(closeTestDb);

const ORIGIN = "https://kinora-booking.vercel.app";
// Tuesday 5 March 2030, 11:00 in Brussels: "tomorrow" is Wednesday 6 March,
// from 2030-03-05T23:00Z to 2030-03-06T23:00Z. Far from any real booking.
const NOW = new Date("2030-03-05T10:00:00Z");

async function seed(
  tx: Tx,
  rows: { startsAt: string; status?: BookingStatus }[],
) {
  const clinics = await seedTwoClinics(tx);
  const { a } = clinics;
  const inA = await bookable(tx, a);
  const saved = await tx
    .insert(bookings)
    .values(
      rows.map((r) => ({
        ...bookingRow({
          clinicId: a.id,
          serviceId: inA.serviceId,
          membershipId: inA.physio,
          patientId: a.patient,
          startsAt: r.startsAt,
          status: r.status ?? "confirmed",
        }),
        stripePaymentIntentId: "pi_test_reminder",
      })),
    )
    .returning({ id: bookings.id, startsAt: bookings.startsAt });
  return { ...clinics, inA, saved };
}

const remindersOf = (tx: Tx, clinicId: string) =>
  tx
    .select({ dedupeKey: emails.dedupeKey, text: emails.text })
    .from(emails)
    .where(
      sql`${emails.clinicId} = ${clinicId} and ${emails.kind} = 'booking_reminder'`,
    );

describe("queueTomorrowsReminders", () => {
  it("queues one reminder per confirmed session tomorrow in Brussels", async () => {
    await rolledBack(async (tx) => {
      const { a, saved } = await seed(tx, [
        { startsAt: "2030-03-06T08:00:00Z" }, // Wed 09:00: tomorrow
        { startsAt: "2030-03-05T23:30:00Z" }, // Wed 00:30: tomorrow
        { startsAt: "2030-03-05T22:00:00Z" }, // Tue 23:00: today
        { startsAt: "2030-03-06T23:00:00Z" }, // Thu 00:00: the day after
      ]);
      const ids = await queueTomorrowsReminders(tx, NOW, ORIGIN);
      expect(ids).toHaveLength(2);

      const rows = await remindersOf(tx, a.id);
      expect(rows.map((r) => r.dedupeKey).sort()).toEqual(
        [saved[0], saved[1]].map((b) => `booking_reminder:${b?.id}`).sort(),
      );
      const wednesday = rows.find((r) => r.text.includes("09:00"));
      expect(wednesday?.text).toContain("Wednesday 6 March at 09:00");
      expect(wednesday?.text).toContain(`${ORIGIN}/bookings/${saved[0]?.id}`);
    });
  });

  it("never reminds a cancelled, refunded or unpaid booking", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seed(tx, [
        { startsAt: "2030-03-06T08:00:00Z", status: "cancelled" },
        { startsAt: "2030-03-06T09:00:00Z", status: "refunded" },
        { startsAt: "2030-03-06T10:00:00Z", status: "pending_payment" },
      ]);
      expect(await queueTomorrowsReminders(tx, NOW, ORIGIN)).toEqual([]);
      expect(await remindersOf(tx, a.id)).toEqual([]);
    });
  });

  it("queues nothing the second time", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seed(tx, [{ startsAt: "2030-03-06T08:00:00Z" }]);
      expect(await queueTomorrowsReminders(tx, NOW, ORIGIN)).toHaveLength(1);
      expect(await queueTomorrowsReminders(tx, NOW, ORIGIN)).toEqual([]);
      expect(await remindersOf(tx, a.id)).toHaveLength(1);
    });
  });
});

describe("queueTomorrowsReminders for one clinic", () => {
  it("leaves the other clinics alone", async () => {
    await rolledBack(async (tx) => {
      const { a, b } = await seed(tx, [{ startsAt: "2030-03-06T08:00:00Z" }]);
      expect(await queueTomorrowsReminders(tx, NOW, ORIGIN, b.id)).toEqual([]);
      expect(await remindersOf(tx, a.id)).toEqual([]);
      expect(await queueTomorrowsReminders(tx, NOW, ORIGIN, a.id)).toHaveLength(
        1,
      );
    });
  });
});

describe("two runs of the daily job at the same moment", () => {
  it("queue one reminder, not two", async () => {
    // Real concurrency needs two connections and committed rows, so this
    // test commits its clinic and deletes its users (and their clinic) after.
    const users: string[] = [];
    const url = process.env.DATABASE_URL ?? "";
    const clients = [0, 1].map(() =>
      postgres(url, { prepare: false, max: 1, onnotice: () => {} }),
    );
    try {
      const { a } = await testDb.transaction(async (tx) => {
        const seeded = await seed(tx, [{ startsAt: "2030-03-06T08:00:00Z" }]);
        for (const c of [seeded.a, seeded.b]) {
          users.push(c.owner, c.practitioner, c.patient, c.otherPatient);
        }
        users.push(seeded.outsider, seeded.inA.colleague);
        return seeded;
      });

      // Each run reads the due bookings, queues, then waits before
      // committing, so the two runs overlap in time.
      const runs = clients.map((client) =>
        drizzle({ client, schema }).transaction(async (tx) => {
          const ids = await queueTomorrowsReminders(tx, NOW, ORIGIN);
          await tx.execute(sql`select pg_sleep(0.5)`);
          return ids;
        }),
      );
      const queued = (await Promise.all(runs)).flat();

      expect(queued).toHaveLength(1);
      const reminders = await testDb
        .select({ id: emails.id })
        .from(emails)
        .where(
          sql`${emails.clinicId} = ${a.id} and ${emails.kind} = 'booking_reminder'`,
        );
      expect(reminders).toHaveLength(1);
    } finally {
      await Promise.all(clients.map((c) => c.end()));
      // Deleting the users deletes their clinic, and everything in it.
      if (users.length > 0) {
        await testDb.delete(authUsers).where(inArray(authUsers.id, users));
      }
    }
  });
});
