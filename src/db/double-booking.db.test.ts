// Checklist #7: two patients can never book the same physio at the same
// time. Postgres refuses the overlap itself (drizzle/0011), so the rule
// holds even when two requests arrive together.
import { eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { authUsers } from "drizzle-orm/supabase";
import postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { type BookingStatus, bookings } from "@/features/booking/table";
import { bookable, bookingRow, type NewBooking } from "./booking-seed";
import { seedTwoClinics } from "./test-seed";
import { closeTestDb, rolledBack, type Tx, testDb } from "./test-support";

afterAll(closeTestDb);

const TEN = "2026-12-01T09:00:00Z";

async function seed(tx: Tx) {
  const { a } = await seedTwoClinics(tx);
  const inA = await bookable(tx, a);
  const at = (
    startsAt: string,
    more: Partial<NewBooking> = {},
  ): NewBooking => ({
    clinicId: a.id,
    serviceId: inA.serviceId,
    membershipId: inA.physio,
    patientId: a.patient,
    startsAt,
    ...more,
  });
  return { a, inA, at };
}

/** The SQLSTATE of a refused insert: 23P01 is an exclusion violation. */
async function insertCode(tx: Tx, row: NewBooking): Promise<string | null> {
  try {
    await tx.transaction((sp) => sp.insert(bookings).values(bookingRow(row)));
    return null;
  } catch (error) {
    return sqlState(error) ?? "unknown";
  }
}

function sqlState(error: unknown): string | undefined {
  let current = error;
  while (current instanceof Error) {
    if ("code" in current && typeof current.code === "string")
      return current.code;
    current = current.cause;
  }
  return undefined;
}

describe("overlapping bookings", () => {
  it("refuses a second booking that overlaps the first, even by a minute", async () => {
    await rolledBack(async (tx) => {
      const { at, a } = await seed(tx);
      expect(await insertCode(tx, at(TEN))).toBeNull();
      expect(await insertCode(tx, at(TEN, { patientId: a.otherPatient }))).toBe(
        "23P01",
      );
      expect(await insertCode(tx, at("2026-12-01T09:29:00Z"))).toBe("23P01");
      expect(
        await insertCode(
          tx,
          at("2026-12-01T08:00:00Z", { endsAt: "2026-12-01T11:00:00Z" }),
        ),
      ).toBe("23P01");
    });
  });

  it("accepts back-to-back sessions and other physios at the same time", async () => {
    await rolledBack(async (tx) => {
      const { at, inA } = await seed(tx);
      expect(await insertCode(tx, at(TEN))).toBeNull();
      expect(await insertCode(tx, at("2026-12-01T09:30:00Z"))).toBeNull();
      expect(await insertCode(tx, at("2026-12-01T08:30:00Z"))).toBeNull();
      expect(
        await insertCode(tx, at(TEN, { membershipId: inA.colleaguePhysio })),
      ).toBeNull();
    });
  });

  it.each<BookingStatus>([
    "expired",
    "cancelled",
    "refunded",
  ])("frees the slot when a booking is %s", async (status) => {
    await rolledBack(async (tx) => {
      const { at } = await seed(tx);
      expect(await insertCode(tx, at(TEN, { status }))).toBeNull();
      expect(await insertCode(tx, at(TEN))).toBeNull();
    });
  });

  it("refuses to bring an expired hold back over a newer booking", async () => {
    await rolledBack(async (tx) => {
      const { at } = await seed(tx);
      await insertCode(tx, at(TEN, { status: "expired" }));
      await insertCode(tx, at(TEN));
      const revive = tx.transaction((sp) =>
        sp
          .update(bookings)
          .set({ status: "pending_payment" })
          .where(eq(bookings.status, "expired")),
      );
      await expect(revive.catch(sqlState)).resolves.toBe("23P01");
    });
  });
});

describe("two patients booking at the same moment", () => {
  it("lets exactly one of them through", async () => {
    // Real concurrency needs two connections and committed rows, so this
    // test commits its clinic and deletes its users (and their clinic) after.
    const users: string[] = [];
    const url = process.env.DATABASE_URL ?? "";
    const clients = [0, 1].map(() =>
      postgres(url, { prepare: false, max: 1, onnotice: () => {} }),
    );
    try {
      const { a, inA } = await testDb.transaction(async (tx) => {
        const seeded = await seedTwoClinics(tx);
        const extra = await bookable(tx, seeded.a);
        for (const c of [seeded.a, seeded.b]) {
          users.push(c.owner, c.practitioner, c.patient, c.otherPatient);
        }
        users.push(seeded.outsider, extra.colleague);
        return { a: seeded.a, inA: extra };
      });

      // Each patient inserts, then waits before committing, so the two
      // transactions overlap in time.
      const attempts = [a.patient, a.otherPatient].map((patientId, i) =>
        drizzle({ client: clients[i] as postgres.Sql, schema }).transaction(
          async (tx) => {
            await tx.insert(bookings).values(
              bookingRow({
                clinicId: a.id,
                serviceId: inA.serviceId,
                membershipId: inA.physio,
                patientId,
                startsAt: TEN,
                status: "pending_payment",
              }),
            );
            await tx.execute(sql`select pg_sleep(0.5)`);
          },
        ),
      );
      const results = await Promise.allSettled(attempts);

      const failed = results.filter((r) => r.status === "rejected");
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(failed.map((r) => sqlState(r.reason))).toEqual(["23P01"]);
      const saved = await testDb
        .select({ id: bookings.id })
        .from(bookings)
        .where(eq(bookings.clinicId, a.id));
      expect(saved).toHaveLength(1);
    } finally {
      await Promise.all(clients.map((c) => c.end()));
      // Deleting the users deletes their clinic, and everything in it.
      if (users.length > 0) {
        await testDb.delete(authUsers).where(inArray(authUsers.id, users));
      }
    }
  });
});
