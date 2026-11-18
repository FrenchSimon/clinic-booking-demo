"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStaffClinic } from "@/features/clinics/queries";
import {
  openingHoursFromForm,
  openingHoursSchema,
} from "@/features/clinics/schema";
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
async function physio(userId: string) {
  if (!(await rateLimit(`availability:${userId}`, 30))) {
    return { error: "Too many changes in a minute. Try again shortly." };
  }
  const mine = await getStaffClinic(userId);
  const schedule = mine && (await getMySchedule(userId, mine.clinic.id));
  if (!mine || !schedule) {
    return { error: "Only physios set working hours." };
  }
  return { clinic: mine.clinic, membershipId: schedule.membershipId };
}

export async function saveWeeklyHours(
  _prev: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const user = await requireUser();
  const me = await physio(user.id);
  if ("error" in me) return { error: me.error };

  const parsed = openingHoursSchema.safeParse(openingHoursFromForm(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[`weeklyHours.${issue.path.join(".")}`] ??= issue.message;
    }
    return { fieldErrors };
  }
  const outside = outsideOpeningHours(parsed.data, me.clinic.openingHours);
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
  return { message: "Your hours are saved." };
}

export async function addDayOff(
  _prev: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const user = await requireUser();
  const me = await physio(user.id);
  if ("error" in me) return { error: me.error };

  const parsed = dayOffInput(brusselsToday()).safeParse({
    startsOn: formData.get("startsOn") ?? "",
    endsOn: formData.get("endsOn") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] ??= issue.message;
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
  return { message: "Day off added." };
}

export async function removeDayOff(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success || "error" in (await physio(user.id))) return;
  // RLS only lets a physio delete their own days off.
  await withRls(user.id, (tx) =>
    tx.delete(daysOff).where(eq(daysOff.id, id.data)),
  );
  revalidatePath("/clinic/hours");
}
