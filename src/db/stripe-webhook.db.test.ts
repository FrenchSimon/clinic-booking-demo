// Checklist #10: a booking becomes "confirmed" only when Stripe says it is
// paid, and an event received twice changes nothing the second time.
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { authUsers } from "drizzle-orm/supabase";
import postgres from "postgres";
import { afterAll, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import {
  type PaidCheckout,
  settlePaidCheckout,
} from "@/features/booking/payment";
import { bookings, stripeEvents } from "@/features/booking/table";
import { bookable, bookingRow, type NewBooking } from "./booking-seed";
import { seedTwoClinics } from "./test-seed";
import { closeTestDb, one, rolledBack, type Tx, testDb } from "./test-support";

afterAll(closeTestDb);

const START = "2026-12-01T09:00:00Z";
const paid = (eventId: string, sessionId = "cs_test_1"): PaidCheckout => ({
  eventId,
  eventType: "checkout.session.completed",
  sessionId,
  paymentIntentId: "pi_test_1",
});

/** A held booking paid through Checkout session cs_test_1. */
async function seed(tx: Tx, more: Partial<NewBooking> = {}) {
  const { a } = await seedTwoClinics(tx);
  const inA = await bookable(tx, a);
  const base = {
    clinicId: a.id,
    serviceId: inA.serviceId,
    membershipId: inA.physio,
    patientId: a.patient,
    startsAt: START,
  };
  const booking = one(
    await tx
      .insert(bookings)
      .values({
        ...bookingRow({ ...base, status: "pending_payment", ...more }),
        stripeCheckoutSessionId: "cs_test_1",
      })
      .returning({ id: bookings.id }),
  );
  return { a, base, bookingId: booking.id };
}

async function booking(tx: Tx, id: string) {
  return one(await tx.select().from(bookings).where(eq(bookings.id, id)));
}

describe("settlePaidCheckout", () => {
  it("confirms a held booking once, however often the event comes", async () => {
    await rolledBack(async (tx) => {
      const { bookingId } = await seed(tx);
      const refund = vi.fn();
      expect(await settlePaidCheckout(tx, paid("evt_1"), refund)).toBe(
        "confirmed",
      );
      expect(await settlePaidCheckout(tx, paid("evt_1"), refund)).toBe(
        "duplicate",
      );
      expect(await settlePaidCheckout(tx, paid("evt_2"), refund)).toBe(
        "already_settled",
      );
      const row = await booking(tx, bookingId);
      expect(row.status).toBe("confirmed");
      expect(row.stripePaymentIntentId).toBe("pi_test_1");
      expect(row.paidAt).not.toBeNull();
      expect(refund).not.toHaveBeenCalled();
    });
  });

  it("confirms a payment that came after the hold ran out, if the slot is free", async () => {
    await rolledBack(async (tx) => {
      const { bookingId } = await seed(tx, { status: "expired" });
      expect(await settlePaidCheckout(tx, paid("evt_1"), vi.fn())).toBe(
        "confirmed",
      );
      expect((await booking(tx, bookingId)).status).toBe("confirmed");
    });
  });

  it("refunds a late payment when someone else took the slot", async () => {
    await rolledBack(async (tx) => {
      const { a, base, bookingId } = await seed(tx, { status: "expired" });
      await tx
        .insert(bookings)
        .values(bookingRow({ ...base, patientId: a.otherPatient }));
      const refund = vi.fn().mockResolvedValue(undefined);
      expect(await settlePaidCheckout(tx, paid("evt_1"), refund)).toBe(
        "refunded",
      );
      expect(refund).toHaveBeenCalledExactlyOnceWith(bookingId, "pi_test_1");
      expect((await booking(tx, bookingId)).status).toBe("refunded");
      // The replayed event does not refund twice.
      expect(await settlePaidCheckout(tx, paid("evt_1"), refund)).toBe(
        "duplicate",
      );
      expect(refund).toHaveBeenCalledTimes(1);
    });
  });

  it("records the event only when the booking is settled", async () => {
    await rolledBack(async (tx) => {
      const { a, base } = await seed(tx, { status: "expired" });
      await tx
        .insert(bookings)
        .values(bookingRow({ ...base, patientId: a.otherPatient }));
      const failing = vi.fn().mockRejectedValue(new Error("Stripe is down"));
      await expect(
        tx.transaction((sp) => settlePaidCheckout(sp, paid("evt_1"), failing)),
      ).rejects.toThrow("Stripe is down");
      // Stripe will retry: the event is not marked as handled.
      expect(
        await tx
          .select()
          .from(stripeEvents)
          .where(eq(stripeEvents.id, "evt_1")),
      ).toEqual([]);
    });
  });

  it("ignores a session that is not a Kinora booking", async () => {
    await rolledBack(async (tx) => {
      await seed(tx);
      expect(
        await settlePaidCheckout(tx, paid("evt_1", "cs_test_other"), vi.fn()),
      ).toBe("unknown_session");
    });
  });
});

describe("the same event delivered twice at the same moment", () => {
  it("confirms the booking once", async () => {
    // Two connections and committed rows, like two webhook calls running at
    // once; the test deletes its users, and with them their clinic, after.
    const users: string[] = [];
    const url = process.env.DATABASE_URL ?? "";
    const clients = [0, 1].map(() =>
      postgres(url, { prepare: false, max: 1, onnotice: () => {} }),
    );
    const eventId = `evt_test_${Date.now()}`;
    const sessionId = `cs_test_${Date.now()}`;
    try {
      const bookingId = await testDb.transaction(async (tx) => {
        const seeded = await seedTwoClinics(tx);
        const extra = await bookable(tx, seeded.a);
        for (const c of [seeded.a, seeded.b]) {
          users.push(c.owner, c.practitioner, c.patient, c.otherPatient);
        }
        users.push(seeded.outsider, extra.colleague);
        const row = bookingRow({
          clinicId: seeded.a.id,
          serviceId: extra.serviceId,
          membershipId: extra.physio,
          patientId: seeded.a.patient,
          startsAt: START,
          status: "pending_payment",
        });
        return one(
          await tx
            .insert(bookings)
            .values({ ...row, stripeCheckoutSessionId: sessionId })
            .returning({ id: bookings.id }),
        ).id;
      });

      const results = await Promise.all(
        clients.map((client) =>
          drizzle({ client, schema }).transaction((tx) =>
            settlePaidCheckout(tx, paid(eventId, sessionId), vi.fn()),
          ),
        ),
      );
      expect(results.sort()).toEqual(["confirmed", "duplicate"]);
      const [row] = await testDb
        .select({ status: bookings.status })
        .from(bookings)
        .where(eq(bookings.id, bookingId));
      expect(row?.status).toBe("confirmed");
    } finally {
      await Promise.all(clients.map((c) => c.end()));
      await testDb.delete(stripeEvents).where(eq(stripeEvents.id, eventId));
      if (users.length > 0) {
        await testDb.delete(authUsers).where(inArray(authUsers.id, users));
      }
    }
  });
});
