// Checklist #19: a demo clinic is deleted after 24 hours, with its visitor,
// its seeded accounts and its bookings. Real accounts are never touched.
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { bookings } from "@/features/booking/table";
import { clinics } from "@/features/clinics/table";
import { demoBookings } from "@/features/demo/plan";
import { seedTwoClinics } from "./test-seed";
import { closeTestDb, rolledBack, type Tx } from "./test-support";

vi.mock("server-only", () => ({}));
const { seedDemoClinic } = await import("@/features/demo/seed");
const { deleteExpiredDemos } = await import("@/features/demo/cleanup");

afterAll(closeTestDb);

const HOUR = 3_600_000;

/** An anonymous visitor and their demo clinic, created now. */
async function demo(tx: Tx) {
  const visitor = randomUUID();
  await tx.execute(
    sql`insert into auth.users (id, aud, role, is_anonymous, created_at)
        values (${visitor}, 'authenticated', 'authenticated', true, now())`,
  );
  const rows = demoBookings(new Date()).map((b) => ({
    ...b,
    id: randomUUID(),
    paymentIntentId: null,
  }));
  return { visitor, clinicId: await seedDemoClinic(tx, visitor, rows) };
}

const count = async (tx: Tx, clinicId: string) => {
  const [c] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(clinics)
    .where(eq(clinics.id, clinicId));
  const [b] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(bookings)
    .where(eq(bookings.clinicId, clinicId));
  return { clinics: c?.n, bookings: b?.n };
};

describe("deleteExpiredDemos", () => {
  it("keeps a demo for 24 hours", async () => {
    await rolledBack(async (tx) => {
      const { clinicId } = await demo(tx);
      const later = new Date(Date.now() + 23 * HOUR);
      // Not a count of deleted accounts: real demos started more than an
      // hour ago may be in the database, and would be deleted (then rolled
      // back). Only this one must stay.
      await deleteExpiredDemos(tx, later);
      expect(await count(tx, clinicId)).toEqual({ clinics: 1, bookings: 16 });
    });
  });

  it("then deletes the visitor, the seeded accounts and the clinic", async () => {
    await rolledBack(async (tx) => {
      const { clinicId } = await demo(tx);
      // The visitor, 3 physios and 6 patients.
      const accounts = await tx.execute<{ id: string }>(
        sql`select user_id as id from public.memberships
            where clinic_id = ${clinicId}`,
      );
      expect(accounts).toHaveLength(10);

      // At least these 10: other demos may be in the database too.
      const later = new Date(Date.now() + 25 * HOUR);
      expect(await deleteExpiredDemos(tx, later)).toBeGreaterThanOrEqual(10);
      expect(await count(tx, clinicId)).toEqual({ clinics: 0, bookings: 0 });
      const ids = accounts.map((a) => a.id);
      const left = await tx.execute(
        sql`select 1 from auth.users where id in ${ids}`,
      );
      expect(left).toHaveLength(0);
    });
  });

  it("never deletes a real account, however old", async () => {
    await rolledBack(async (tx) => {
      const { a } = await seedTwoClinics(tx);
      await tx.execute(
        sql`update auth.users set created_at = now() - interval '30 days'
            where id = ${a.owner}`,
      );
      await deleteExpiredDemos(tx, new Date(Date.now() + 25 * HOUR));
      expect((await count(tx, a.id)).clinics).toBe(1);
    });
  });
});
