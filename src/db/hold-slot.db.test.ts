// Checklist #9: a slot is held for 15 minutes while the patient pays, then
// freed if not paid. private.hold_slot() (drizzle/0014) is the only way to
// create a booking; it takes the price and length from the service.
import { and, eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { practitionerHours } from "@/features/availability/table";
import { bookings } from "@/features/booking/table";
import { DEFAULT_OPENING_HOURS } from "@/features/clinics/schema";
import { memberships } from "@/features/clinics/table";
import { servicePractitioners, services } from "@/features/services/table";
import { bookable, bookingRow } from "./booking-seed";
import { seedTwoClinics } from "./test-seed";
import { asUser, closeTestDb, one, rolledBack, type Tx } from "./test-support";

afterAll(closeTestDb);

const SOON = new Date(Date.now() + 3 * 86_400_000).toISOString();

async function seed(tx: Tx) {
  const clinics = await seedTwoClinics(tx);
  const { a } = clinics;
  const inA = await bookable(tx, a);
  await tx.insert(practitionerHours).values({
    clinicId: a.id,
    membershipId: inA.physio,
    weeklyHours: DEFAULT_OPENING_HOURS,
  });
  await tx.insert(servicePractitioners).values([
    { clinicId: a.id, serviceId: inA.serviceId, membershipId: inA.physio },
    {
      clinicId: a.id,
      serviceId: inA.serviceId,
      membershipId: inA.colleaguePhysio,
    },
  ]);
  return { ...clinics, inA };
}

function hold(
  tx: Tx,
  userId: string,
  serviceId: string,
  physio: string,
  startsAt = SOON,
) {
  return asUser(tx, userId, async (db) => {
    const rows = await db.execute<{ id: string }>(
      sql`select private.hold_slot(${serviceId}, ${physio}, ${startsAt}) as id`,
    );
    return one([...rows]).id;
  });
}

/** The code raised by the function, or the SQLSTATE of a refused insert. */
async function failure(attempt: Promise<unknown>): Promise<string> {
  try {
    await attempt;
    return "none";
  } catch (error) {
    let current = error;
    while (current instanceof Error) {
      if ("code" in current && current.code === "P0001") return current.message;
      if ("code" in current && typeof current.code === "string")
        return current.code;
      current = current.cause;
    }
    return "unknown";
  }
}

async function statusOf(tx: Tx, id: string) {
  return one(
    await tx
      .select({ status: bookings.status })
      .from(bookings)
      .where(eq(bookings.id, id)),
  ).status;
}

describe("hold_slot", () => {
  it("holds the slot for 15 minutes at the service's price and length", async () => {
    await rolledBack(async (tx) => {
      const { a, inA, outsider } = await seed(tx);
      const id = await hold(tx, outsider, inA.serviceId, inA.physio);
      const booking = one(
        await tx.select().from(bookings).where(eq(bookings.id, id)),
      );
      expect(booking).toMatchObject({
        clinicId: a.id,
        patientId: outsider,
        status: "pending_payment",
        priceCents: 4500,
      });
      expect(booking.endsAt.getTime() - booking.startsAt.getTime()).toBe(
        30 * 60_000,
      );
      const left = (booking.holdExpiresAt?.getTime() ?? 0) - Date.now();
      expect(left).toBeGreaterThan(14 * 60_000);
      expect(left).toBeLessThanOrEqual(15 * 60_000);
      // The visitor became a patient of the clinic.
      const joined = await tx
        .select({ role: memberships.role })
        .from(memberships)
        .where(
          and(eq(memberships.clinicId, a.id), eq(memberships.userId, outsider)),
        );
      expect(joined).toEqual([{ role: "patient" }]);
    });
  });

  it("refuses a second patient on a held slot", async () => {
    await rolledBack(async (tx) => {
      const { a, inA } = await seed(tx);
      await hold(tx, a.patient, inA.serviceId, inA.physio);
      expect(
        await failure(hold(tx, a.otherPatient, inA.serviceId, inA.physio)),
      ).toBe("23P01");
    });
  });

  it("frees a slot whose hold has run out", async () => {
    await rolledBack(async (tx) => {
      const { a, inA } = await seed(tx);
      const [stale] = await tx
        .insert(bookings)
        .values({
          ...bookingRow({
            clinicId: a.id,
            serviceId: inA.serviceId,
            membershipId: inA.physio,
            patientId: a.patient,
            startsAt: SOON,
            status: "pending_payment",
          }),
          holdExpiresAt: new Date(Date.now() - 1000),
        })
        .returning({ id: bookings.id });
      await hold(tx, a.otherPatient, inA.serviceId, inA.physio);
      expect(await statusOf(tx, stale?.id ?? "")).toBe("expired");
    });
  });

  it("replaces the patient's previous hold", async () => {
    await rolledBack(async (tx) => {
      const { a, inA } = await seed(tx);
      const first = await hold(tx, a.patient, inA.serviceId, inA.physio);
      const later = new Date(Date.parse(SOON) + 3_600_000).toISOString();
      await hold(tx, a.patient, inA.serviceId, inA.physio, later);
      expect(await statusOf(tx, first)).toBe("expired");
    });
  });

  it("refuses a past slot, a hidden service and a physio who cannot give it", async () => {
    await rolledBack(async (tx) => {
      const { a, b, inA } = await seed(tx);
      const past = new Date(Date.now() - 60_000).toISOString();
      expect(
        await failure(hold(tx, a.patient, inA.serviceId, inA.physio, past)),
      ).toBe("slot_in_past");
      // The colleague gives the service but has not saved their hours.
      expect(
        await failure(hold(tx, a.patient, inA.serviceId, inA.colleaguePhysio)),
      ).toBe("physio_unavailable");
      const inB = await bookable(tx, b);
      expect(
        await failure(hold(tx, a.patient, inA.serviceId, inB.physio)),
      ).toBe("physio_unavailable");
      await tx
        .update(services)
        .set({ active: false })
        .where(eq(services.id, inA.serviceId));
      expect(
        await failure(hold(tx, a.patient, inA.serviceId, inA.physio)),
      ).toBe("service_unavailable");
    });
  });
});

describe("attach_checkout", () => {
  it("records the session on the patient's own hold, once", async () => {
    await rolledBack(async (tx) => {
      const { a, inA } = await seed(tx);
      const id = await hold(tx, a.patient, inA.serviceId, inA.physio);
      const attach = (userId: string, session: string) =>
        asUser(tx, userId, async (db) => {
          const rows = await db.execute<{ ok: boolean }>(
            sql`select private.attach_checkout(${id}, ${session}) as ok`,
          );
          return one([...rows]).ok;
        });
      expect(await attach(a.otherPatient, "cs_test_other")).toBe(false);
      expect(await attach(a.patient, "cs_test_1")).toBe(true);
      expect(await attach(a.patient, "cs_test_2")).toBe(false);
      const [row] = await tx
        .select({ session: bookings.stripeCheckoutSessionId })
        .from(bookings)
        .where(eq(bookings.id, id));
      expect(row?.session).toBe("cs_test_1");
    });
  });
});
