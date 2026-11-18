import "server-only";
import { and, eq } from "drizzle-orm";
import {
  clinics,
  type MembershipRole,
  memberships,
} from "@/features/clinics/table";
import { withRls } from "@/lib/db";

/**
 * The visitor's role in the demo clinic they started, or null when they have
 * none. Found by its creator, not by the owner's role: after "View as" the
 * visitor may be a practitioner or a patient there. Read through RLS.
 */
export async function getDemoRole(
  visitorId: string,
): Promise<MembershipRole | null> {
  const rows = await withRls(visitorId, (tx) =>
    tx
      .select({ role: memberships.role })
      .from(clinics)
      .innerJoin(
        memberships,
        and(
          eq(memberships.clinicId, clinics.id),
          eq(memberships.userId, visitorId),
        ),
      )
      .where(eq(clinics.createdBy, visitorId)),
  );
  return rows[0]?.role ?? null;
}
