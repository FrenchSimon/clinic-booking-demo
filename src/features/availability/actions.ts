"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStaffClinic } from "@/features/clinics/queries";
import {
  openingHoursFromForm,
  openingHoursSchema,
} from "@/features/clinics/schema";
import type { Dictionary } from "@/i18n/dictionaries";
import { translateMessage } from "@/i18n/messages";
import { getRequestDictionary } from "@/i18n/server";
import { withRls } from "@/lib/db";
import { requireUser } from "@/server/auth";
import { rateLimit } from "@/server/rate-limit";
import { getMySchedule } from "./queries";
import { brusselsToday, dayOffInput, outsideOpeningHours } from "./schema";
import { daysOff, practitionerHours } from "./table";

export type ScheduleFormState = {
  error?: string;
  /** Keyed by field: "weeklyHours.mon.to", "startsOn"… */
  fieldErrors?: Partial<Record<string, string>>;
  message?: string;
};

/** The signed-in physio's clinic and membership, or an error to show. */
async function physio(userId: string, t: Dictionary["team"]) {
  if (!(await rateLimit(`availability:${userId}`, 30))) {
    return { error: t.hoursErrors.tooMany };
  }
  const mine = await getStaffClinic(userId);
  const schedule = mine && (await getMySchedule(userId, mine.clinic.id));
  if (!mine || !schedule) {
    return { error: t.hoursErrors.physioOnly };
  }
  return { clinic: mine.clinic, membershipId: schedule.membershipId };
}

export async function saveWeeklyHours(
  _prev: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const user = await requireUser();
  const { locale, t } = await getRequestDictionary();
  const me = await physio(user.id, t.team);
  if ("error" in me) return { error: me.error };

  const parsed = openingHoursSchema.safeParse(openingHoursFromForm(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[`weeklyHours.${issue.path.join(".")}`] ??= translateMessage(
        issue.message,
        locale,
        (d) => d.clinic.validation,
      );
    }
    return { fieldErrors };
  }
  const outside = outsideOpeningHours(
    parsed.data,
    me.clinic.openingHours,
    t.team,
  );
  if (Object.keys(outside).length > 0) return { fieldErrors: outside };

  await withRls(user.id, (tx) =>
    tx
      .insert(practitionerHours)
      .values({
        clinicId: me.clinic.id,
        membershipId: me.membershipId,
        weeklyHours: parsed.data,
      })
      .onConflictDoUpdate({
        target: practitionerHours.membershipId,
        set: { weeklyHours: parsed.data, updatedAt: new Date() },
      }),
  );
  revalidatePath("/clinic", "layout");
  return { message: t.team.hours.saved };
}

export async function addDayOff(
  _prev: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const user = await requireUser();
  const { locale, t } = await getRequestDictionary();
  const me = await physio(user.id, t.team);
  if ("error" in me) return { error: me.error };

  const parsed = dayOffInput(brusselsToday()).safeParse({
    startsOn: formData.get("startsOn") ?? "",
    endsOn: formData.get("endsOn") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] ??= translateMessage(
        issue.message,
        locale,
        (d) => d.team.hoursValidation,
      );
    }
    return { fieldErrors };
  }

  await withRls(user.id, (tx) =>
    tx.insert(daysOff).values({
      clinicId: me.clinic.id,
      membershipId: me.membershipId,
      ...parsed.data,
    }),
  );
  revalidatePath("/clinic/hours");
  return { message: t.team.hours.added };
}

export async function removeDayOff(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = z.uuid().safeParse(formData.get("id"));
  const { t } = await getRequestDictionary();
  if (!id.success || "error" in (await physio(user.id, t.team))) return;
  // RLS only lets a physio delete their own days off.
  await withRls(user.id, (tx) =>
    tx.delete(daysOff).where(eq(daysOff.id, id.data)),
  );
  revalidatePath("/clinic/hours");
}
