// Checklist #8 and #4: a visitor who is not signed in reads the clinic's
// public booking page through two functions (drizzle/0012), and nothing
// else: no patient, no email, bookings only as busy time ranges.
import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { practitionerHours } from "@/features/availability/table";
import { bookings } from "@/features/booking/table";
import { DEFAULT_OPENING_HOURS } from "@/features/clinics/schema";
import { clinics } from "@/features/clinics/table";
import { servicePractitioners, services } from "@/features/services/table";
import { bookable, bookingRow } from "./booking-seed";
import { seedTwoClinics } from "./test-seed";
import { closeTestDb, one, rolledBack, type Tx } from "./test-support";

afterAll(closeTestDb);

/** Runs a query as the "anon" role, like withAnon(), inside a savepoint. */
function asVisitor<T>(tx: Tx, run: (tx: Tx) => Promise<T>): Promise<T> {
  return tx.transaction(async (sp) => {
    await sp.execute(sql`set local role anon`);
    const result = await run(sp);
    await sp.execute(sql`reset role`);
    return result;
  });
}

async function page(tx: Tx, slug: string) {
  const rows = await asVisitor(tx, (db) =>
    db.execute<{ page: Record<string, unknown> | null }>(
      sql`select private.booking_page(${slug}) as page`,
    ),
  );
  return rows[0]?.page ?? null;
}

async function availability(tx: Tx, clinicId: string) {
  const rows = await asVisitor(tx, (db) =>
    db.execute<{ data: { schedules: unknown[]; busy: unknown[] } }>(
      sql`select private.booking_availability(${clinicId}, '2026-12-01T00:00Z', '2026-12-08T00:00Z') as data`,
    ),
  );
  return one([...rows]).data;
}

/** Clinic A: a service offered by a physio with hours, and one by a physio without. */
async function seed(tx: Tx) {
  const clinicsSeed = await seedTwoClinics(tx);
  const { a } = clinicsSeed;
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
  const [clinic] = await tx
    .select({ slug: clinics.slug })
    .from(clinics)
    .where(eq(clinics.id, a.id));
  return { ...clinicsSeed, inA, slug: clinic?.slug ?? "" };
}

describe("booking page", () => {
  it("is null for an unknown address", async () => {
    await rolledBack(async (tx) => {
      expect(await page(tx, "no-such-clinic")).toBeNull();
    });
  });

  it("shows bookable services and only physios who saved their hours", async () => {
    await rolledBack(async (tx) => {
      const { slug, inA } = await seed(tx);
      const shown = await page(tx, slug);
      expect(Object.keys(shown ?? {}).sort()).toEqual([
        "address",
        "id",
        "name",
        "openingHours",
        "physios",
        "services",
        "slug",
      ]);
      expect(shown?.services).toEqual([
        {
          id: inA.serviceId,
          name: "Follow-up",
          durationMinutes: 30,
          priceCents: 4500,
          physioIds: [inA.physio],
        },
      ]);
      expect(shown?.physios).toEqual([{ id: inA.physio, name: "Physio" }]);
    });
  });

  it("hides a service that is hidden or that nobody can give", async () => {
    await rolledBack(async (tx) => {
      const { a, slug, inA } = await seed(tx);
      await tx.insert(services).values({
        clinicId: a.id,
        name: "No physio yet",
        durationMinutes: 30,
        priceCents: 4000,
      });
      await tx
        .update(services)
        .set({ active: false })
        .where(eq(services.id, inA.serviceId));
      expect((await page(tx, slug))?.services).toEqual([]);
    });
  });
});

describe("booking availability", () => {
  it("gives busy ranges for paid bookings and live holds only, with no patient", async () => {
    await rolledBack(async (tx) => {
      const { a, b, inA } = await seed(tx);
      const inB = await bookable(tx, b);
      const base = {
        clinicId: a.id,
        serviceId: inA.serviceId,
        membershipId: inA.physio,
        patientId: a.patient,
      };
      await tx.insert(bookings).values([
        bookingRow({ ...base, startsAt: "2026-12-01T08:00:00Z" }),
        bookingRow({
          ...base,
          startsAt: "2026-12-01T09:00:00Z",
          status: "pending_payment",
        }),
        {
          ...bookingRow({
            ...base,
            startsAt: "2026-12-01T10:00:00Z",
            status: "pending_payment",
          }),
          // An hour ago: inside the test transaction, Postgres' now() is
          // the time the transaction began, not the current clock.
          holdExpiresAt: new Date(Date.now() - 3_600_000),
        },
        bookingRow({
          ...base,
          startsAt: "2026-12-01T11:00:00Z",
          status: "cancelled",
        }),
        bookingRow({
          clinicId: b.id,
          serviceId: inB.serviceId,
          membershipId: inB.physio,
          patientId: b.patient,
          startsAt: "2026-12-01T08:00:00Z",
        }),
      ]);

      const data = await availability(tx, a.id);
      expect(data.busy).toEqual([
        expect.objectContaining({ startsAt: "2026-12-01T08:00:00+00:00" }),
        expect.objectContaining({ startsAt: "2026-12-01T09:00:00+00:00" }),
      ]);
      for (const busy of data.busy) {
        expect(Object.keys(busy as object).sort()).toEqual([
          "endsAt",
          "membershipId",
          "startsAt",
        ]);
      }
      expect(data.schedules).toHaveLength(1);
    });
  });
});

describe("a visitor", () => {
  it("reads nothing from the tables themselves", async () => {
    await rolledBack(async (tx) => {
      await seed(tx);
      const seen = await asVisitor(tx, async (db) => ({
        clinics: await db.select().from(clinics),
        services: await db.select().from(services),
        bookings: await db.select().from(bookings),
      }));
      expect(seen).toEqual({ clinics: [], services: [], bookings: [] });
    });
  });
});
