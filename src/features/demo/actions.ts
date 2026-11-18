"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { landingPath } from "@/features/auth/landing";
import { queueTomorrowsReminders } from "@/features/booking/reminders";
import { adminDb } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { getUser, requireUser } from "@/server/auth";
import { rateLimit } from "@/server/rate-limit";
import { siteOrigin } from "@/server/site-origin";
import { deleteExpiredDemos } from "./cleanup";
import { createDemoClinic } from "./create";
import { getDemoClinic, getDemoRole } from "./queries";
import { viewAsInput } from "./schema";
import { switchDemoRole } from "./view-as";

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
 * it opens the clinic they already have, in the role they last picked in
 * "View as". No requireUser(): this action is
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
  const role = await getDemoRole(visitor);
  if (!role) {
    await createDemoClinic(visitor);
    // adminDb inside: the clean-up job, run on each new visitor as well as
    // daily, so expired demos never wait long for the cron.
    after(() => deleteExpiredDemos(adminDb));
  }
  redirect(landingPath([role ?? "owner"]));
}

/**
 * "View as owner / practitioner / patient" (checklist #20): changes the
 * visitor's real role in their demo clinic, then opens that role's home.
 * Only an anonymous visitor can switch, and only in the clinic they started.
 */
export async function viewAs(
  _prev: DemoState,
  formData: FormData,
): Promise<DemoState> {
  const user = await requireUser();
  const parsed = viewAsInput.safeParse({ role: formData.get("role") });
  if (!user.is_anonymous || !parsed.success) {
    return { error: "This switch only works in a demo clinic." };
  }
  const { role } = parsed.data;
  // adminDb: the switch moves memberships and bookings between the visitor
  // and a seeded account, which no policy lets a user write. switchDemoRole
  // only touches the clinic this visitor created.
  const done = await adminDb.transaction((tx) =>
    switchDemoRole(tx, user.id, role),
  );
  if (!done) return { error: "Your demo clinic has ended. Start a new one." };
  // The bar lives in the root layout, which a redirect does not re-render.
  refresh();
  redirect(landingPath([role]));
}

export type RemindersState = { queued?: number; error?: string };

/**
 * "Send tomorrow's reminders now" in the Outbox (checklist #21): runs the
 * daily reminder job (R4.4) for the visitor's demo clinic only. Its dedupe
 * key keeps it at one reminder per booking, however often it is clicked,
 * and the database holds them in the Outbox instead of sending them.
 */
export async function sendDemoReminders(
  _prev: RemindersState,
): Promise<RemindersState> {
  const user = await requireUser();
  const clinic = user.is_anonymous ? await getDemoClinic(user.id) : null;
  if (!clinic) return { error: "This button only works in a demo clinic." };
  const origin = await siteOrigin();
  // adminDb: like the daily job, it reads the patients' addresses, which no
  // policy shows a visitor, and queues as the clinic whatever the visitor's
  // role. It is limited to the clinic this visitor started, found above
  // through RLS.
  const ids = await adminDb.transaction((tx) =>
    queueTomorrowsReminders(tx, new Date(), origin, clinic.id),
  );
  refresh();
  return { queued: ids.length };
}
