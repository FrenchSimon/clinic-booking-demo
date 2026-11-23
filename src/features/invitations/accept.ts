"use server";

import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getRequestDictionary } from "@/i18n/server";
import { withRls } from "@/lib/db";
import { requireUser } from "@/server/auth";
import { rateLimit } from "@/server/rate-limit";
import { TOKEN_PATTERN } from "./schema";

export type AcceptState = { error?: string };

function errorCode(error: unknown): string | undefined {
  const cause = (error as { cause?: { message?: string } })?.cause;
  return cause?.message;
}

export async function acceptInvitation(
  _prev: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  const user = await requireUser();
  const { t } = await getRequestDictionary();
  // The codes raised by private.accept_invitation() (drizzle/0007).
  const messages: Record<string, string> = t.auth.invite.errors;
  if (!(await rateLimit(`invitations:accept:${user.id}`, 10))) {
    return { error: t.auth.errors.tooMany };
  }
  const token = String(formData.get("token") ?? "");
  if (!TOKEN_PATTERN.test(token))
    return { error: messages.invitation_not_found };

  try {
    // Checks the token, the expiry and the email, then adds the membership.
    await withRls(user.id, (tx) =>
      tx.execute(sql`select private.accept_invitation(${token})`),
    );
  } catch (error) {
    const message = messages[errorCode(error) ?? ""];
    if (message) return { error: message };
    throw error;
  }
  redirect("/clinic");
}
