"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { getOwnedClinic } from "@/features/clinics/queries";
import { adminDb } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/server/auth";
import { rateLimit } from "@/server/rate-limit";
import { deleteExpiredDemos } from "./cleanup";
import { createDemoClinic } from "./create";

export type DemoState = { error?: string };

/** The visitor's anonymous account: the one they have, or a new one. */
async function visitorId(): Promise<string | null> {
  const current = await getUser();
  if (current?.is_anonymous) return current.id;
  // Replaces any other session: the demo is a separate, throwaway account.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInAnonymously();
  return error ? null : (data.user?.id ?? null);
}

/**
 * "Try the demo" (checklist #19): no form, no account. The visitor gets an
 * anonymous Supabase session and their own filled clinic, which they own,
 * so row level security applies to them like to any owner. Clicked again,
 * it opens the clinic they already have. No requireUser(): this action is
 * the sign-in, like logIn(); the rate limit guards it instead.
 */
export async function startDemo(_prev: DemoState): Promise<DemoState> {
  if (!(await rateLimit("demo:start", 3))) {
    return { error: "Too many demos started. Wait a minute and try again." };
  }
  const visitor = await visitorId();
  if (!visitor) {
    return { error: "The demo is unavailable right now. Try again later." };
  }
  if (!(await getOwnedClinic(visitor))) {
    await createDemoClinic(visitor);
    // adminDb inside: the clean-up job, run on each new visitor as well as
    // daily, so expired demos never wait long for the cron.
    after(() => deleteExpiredDemos(adminDb));
  }
  redirect("/clinic");
}
