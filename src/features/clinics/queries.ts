import "server-only";
import { and, eq } from "drizzle-orm";
import { withRls } from "@/lib/db";
import { type Clinic, clinics, memberships } from "./table";

/** The clinic this user owns, or null. Read through RLS, as the user. */
export async function getOwnedClinic(userId: string): Promise<Clinic | null> {
  const rows = await withRls(userId, (tx) =>
    tx
      .select({ clinic: clinics })
      .from(clinics)
      .innerJoin(
        memberships,
        and(
          eq(memberships.clinicId, clinics.id),
          eq(memberships.userId, userId),
          eq(memberships.role, "owner"),
        ),
      )
      .orderBy(clinics.createdAt)
      .limit(1),
  );
  return rows[0]?.clinic ?? null;
}
