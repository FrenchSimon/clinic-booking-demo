// Checklist #20: "View as" changes the visitor's real role in their demo
// clinic, so row level security shows them what that role sees, and nothing
// more. Switching back gives everyone their place again.
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { bookings } from "@/features/booking/table";
import { memberships } from "@/features/clinics/table";
import {
  DEMO_PATIENTS,
  DEMO_PHYSIOS,
  demoBookings,
} from "@/features/demo/plan";
import { createUser } from "./test-seed";
import { asUser, closeTestDb, rolledBack, type Tx } from "./test-support";

vi.mock("server-only", () => ({}));
const { seedDemoClinic } = await import("@/features/demo/seed");
const { switchDemoRole } = await import("@/features/demo/view-as");

afterAll(closeTestDb);

const NOW = new Date("2030-03-05T10:00:00Z");
const CAMILLE = DEMO_PHYSIOS.findIndex((p) => p.key === "camille");
const NORA = DEMO_PATIENTS.indexOf("nora.benali");

async function seed(tx: Tx) {
  const visitor = await createUser(tx);
  const rows = demoBookings(NOW).map((b) => ({
    ...b,
    id: randomUUID(),
    paymentIntentId: null,
  }));
  const clinicId = await seedDemoClinic(tx, visitor, rows);
  return { visitor, clinicId, rows };
}

/** Who holds which membership, and who booked what. */
async function places(tx: Tx, clinicId: string) {
  return {
    memberships: await tx
      .select({ id: memberships.id, userId: memberships.userId })
      .from(memberships)
      .where(eq(memberships.clinicId, clinicId))
      .orderBy(memberships.id),
    bookings: await tx
      .select({ id: bookings.id, patientId: bookings.patientId })
      .from(bookings)
      .where(eq(bookings.clinicId, clinicId))
      .orderBy(bookings.id),
  };
}

const seenBy = (tx: Tx, userId: string) =>
  asUser(tx, userId, async (as) => ({
    roles: await as
      .select({ role: memberships.role, name: memberships.displayName })
      .from(memberships)
      .where(eq(memberships.userId, userId)),
    bookings: (await as.select({ id: bookings.id }).from(bookings)).map(
      (b) => b.id,
    ),
  }));

describe("switchDemoRole", () => {
  it("makes the visitor Camille, who sees her agenda only", async () => {
    await rolledBack(async (tx) => {
      const { visitor, rows } = await seed(tx);
      expect(await switchDemoRole(tx, visitor, "practitioner")).toBe(true);

      const seen = await seenBy(tx, visitor);
      expect(seen.roles).toEqual([
        { role: "practitioner", name: "Camille Peeters" },
      ]);
      const hers = rows.filter((b) => b.physio === CAMILLE).map((b) => b.id);
      expect(seen.bookings.sort()).toEqual(hers.sort());
      expect(hers.length).toBeLessThan(rows.length);
    });
  });

  it("makes the visitor Nora, who sees her own bookings only", async () => {
    await rolledBack(async (tx) => {
      const { visitor, rows } = await seed(tx);
      await switchDemoRole(tx, visitor, "practitioner");
      await switchDemoRole(tx, visitor, "patient");

      const seen = await seenBy(tx, visitor);
      expect(seen.roles).toEqual([{ role: "patient", name: null }]);
      const hers = rows.filter((b) => b.patient === NORA).map((b) => b.id);
      expect(seen.bookings.sort()).toEqual(hers.sort());
      expect(
        rows.some((b) => b.patient === NORA && b.status === "refunded"),
      ).toBe(true);
    });
  });

  it("gives everyone their place back as owner", async () => {
    await rolledBack(async (tx) => {
      const { visitor, clinicId, rows } = await seed(tx);
      const before = await places(tx, clinicId);
      for (const role of ["patient", "practitioner", "patient"] as const) {
        await switchDemoRole(tx, visitor, role);
      }
      await switchDemoRole(tx, visitor, "owner");

      expect(await places(tx, clinicId)).toEqual(before);
      const seen = await seenBy(tx, visitor);
      expect(seen.roles).toEqual([{ role: "owner", name: null }]);
      expect(seen.bookings).toHaveLength(rows.length);
    });
  });

  it("does nothing for someone without a demo clinic", async () => {
    await rolledBack(async (tx) => {
      const stranger = await createUser(tx);
      expect(await switchDemoRole(tx, stranger, "patient")).toBe(false);
    });
  });
});
