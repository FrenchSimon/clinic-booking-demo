"use server";

import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { withRls } from "@/lib/db";
import { requireUser } from "@/server/auth";
import { rateLimit } from "@/server/rate-limit";
import { TOKEN_PATTERN } from "./schema";

export type AcceptState = { error?: string };

// The codes raised by private.accept_invitation() (drizzle/0007).
const MESSAGES: Record<string, string> = {
  invitation_not_found: "This invitation link is not valid.",
  invitation_used: "This invitation was already accepted by another account.",
  invitation_expired:
    "This invitation has expired. Ask the clinic to send a new one.",
  invitation_email_mismatch:
    "This invitation was sent to another email address. Log out and sign in with that address.",
};

function errorCode(error: unknown): string | undefined {
  const cause = (error as { cause?: { message?: string } })?.cause;
  return cause?.message;
}

export async function acceptInvitation(
  _prev: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  const user = await requireUser();
  if (!(await rateLimit(`invitations:accept:${user.id}`, 10))) {
    return { error: "Too many attempts. Wait a minute and try again." };
  }
  const token = String(formData.get("token") ?? "");
  if (!TOKEN_PATTERN.test(token))
    return { error: MESSAGES.invitation_not_found };

  try {
    // Checks the token, the expiry and the email, then adds the membership.
    await withRls(user.id, (tx) =>
      tx.execute(sql`select private.accept_invitation(${token})`),
    );
  } catch (error) {
    const message = MESSAGES[errorCode(error) ?? ""];
    if (message) return { error: message };
    throw error;
  }
  redirect("/clinic");
}
