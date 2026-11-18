import "server-only";
import { sql } from "drizzle-orm";
import { withRls } from "@/lib/db";

export type InvitationPreview = {
  clinicName: string;
  email: string;
  status: "open" | "expired" | "accepted";
};

/** What the invite page may show to a signed-in user holding the token. */
export async function previewInvitation(
  userId: string,
  token: string,
): Promise<InvitationPreview | null> {
  const rows = await withRls(userId, (tx) =>
    tx.execute(
      sql`select clinic_name, email, status from private.invitation_preview(${token})`,
    ),
  );
  const row = rows[0] as
    | {
        clinic_name: string;
        email: string;
        status: InvitationPreview["status"];
      }
    | undefined;
  return row
    ? { clinicName: row.clinic_name, email: row.email, status: row.status }
    : null;
}
