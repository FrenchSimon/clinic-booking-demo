"use server";

import { and, eq, isNull, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getOwnedClinic } from "@/features/clinics/queries";
import { deliverEmail, queueEmail } from "@/features/email/outbox";
import { fill } from "@/i18n/locale";
import { translateMessage } from "@/i18n/messages";
import { getRequestDictionary } from "@/i18n/server";
import { withRls } from "@/lib/db";
import { isUniqueViolation } from "@/lib/pg-errors";
import { requireUser } from "@/server/auth";
import { rateLimit } from "@/server/rate-limit";
import { siteOrigin } from "@/server/site-origin";
import { invitationEmail } from "./email";
import { inviteInput } from "./schema";
import { invitations } from "./table";
import { newInviteToken } from "./token";

export type InviteFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email", string>>;
  message?: string;
};

export async function invitePractitioner(
  _prev: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const user = await requireUser();
  const { locale, t } = await getRequestDictionary();
  const e = t.team.inviteErrors;
  if (!(await rateLimit(`invitations:create:${user.id}`, 10))) {
    return { error: e.tooMany };
  }
  const parsed = inviteInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: InviteFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "name" | "email";
      fieldErrors[key] ??= translateMessage(
        issue.message,
        locale,
        (d) => d.team.inviteValidation,
      );
    }
    return { fieldErrors };
  }

  // RLS also refuses a non-owner; this gives a clear message first.
  const clinic = await getOwnedClinic(user.id);
  if (!clinic) return { error: e.ownerOnly };

  const { name, email } = parsed.data;
  const { token, hash } = newInviteToken();
  const link = `${await siteOrigin()}/invite/${token}`;

  let emailId: string | null;
  try {
    // One transaction: the invitation exists if and only if its email is queued.
    emailId = await withRls(user.id, async (tx) => {
      // An expired invitation to the same address makes room for a new one.
      await tx
        .delete(invitations)
        .where(
          and(
            eq(invitations.clinicId, clinic.id),
            eq(invitations.email, email),
            isNull(invitations.acceptedAt),
            lt(invitations.expiresAt, new Date()),
          ),
        );
      const [invitation] = await tx
        .insert(invitations)
        .values({ clinicId: clinic.id, name, email, tokenHash: hash })
        .returning({ id: invitations.id });
      if (!invitation) throw new Error("Invitation not saved");
      return queueEmail(tx, {
        clinicId: clinic.id,
        kind: "practitioner_invite",
        dedupeKey: `practitioner_invite:${invitation.id}`,
        to: email,
        content: invitationEmail({
          physioName: name,
          clinicName: clinic.name,
          clinicAddress: clinic.address,
          email,
          link,
        }),
      });
    });
  } catch (error) {
    if (isUniqueViolation(error, "invitations_open_email_unique")) {
      return { fieldErrors: { email: e.alreadyInvited } };
    }
    throw error;
  }

  // Send after the response: the owner does not wait for Resend.
  if (emailId) after(() => deliverEmail(emailId));
  revalidatePath("/clinic");
  return { message: fill(t.team.physios.sent, { name, email }) };
}
