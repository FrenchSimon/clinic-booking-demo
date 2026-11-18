import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { withRls } from "@/lib/db";
import {
  type Clinic,
  clinics,
  type MembershipRole,
  memberships,
} from "./table";

/** The clinic this user owns, or null. Read through RLS, as the user. */
export async function getOwnedClinic(userId: string): Promise<Clinic | null> {
  const mine = await getStaffClinic(userId);
  return mine?.role === "owner" ? mine.clinic : null;
}

/**
 * The clinic this user works in, as owner or physio, or null. An owner's own
 * clinic comes first. Read through RLS, as the user.
 */
export async function getStaffClinic(
  userId: string,
): Promise<{ clinic: Clinic; role: MembershipRole } | null> {
  const rows = await withRls(userId, (tx) =>
    tx
      .select({ clinic: clinics, role: memberships.role })
      .from(clinics)
      .innerJoin(
        memberships,
        and(
          eq(memberships.clinicId, clinics.id),
          eq(memberships.userId, userId),
          inArray(memberships.role, ["owner", "practitioner"]),
        ),
      )
      .orderBy(memberships.role, clinics.createdAt),
  );
  return rows[0] ?? null;
}

/** Every role this user holds, in any clinic. Read through RLS, as the user. */
export async function listMyRoles(userId: string): Promise<MembershipRole[]> {
  const rows = await withRls(userId, (tx) =>
    tx
      .selectDistinct({ role: memberships.role })
      .from(memberships)
      .where(eq(memberships.userId, userId)),
  );
  return rows.map((row) => row.role);
}
