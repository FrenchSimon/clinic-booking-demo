"use server";

import { redirect } from "next/navigation";
import { translateMessage } from "@/i18n/messages";
import { getRequestDictionary } from "@/i18n/server";
import { withRls } from "@/lib/db";
import { isUniqueViolation } from "@/lib/pg-errors";
import { requireUser } from "@/server/auth";
import { rateLimit } from "@/server/rate-limit";
import { getOwnedClinic } from "./queries";
import { clinicFromForm, clinicInput } from "./schema";
import { clinics } from "./table";

export type ClinicFormState = {
  error?: string;
  /** Keyed by field path: "name", "slug", "openingHours.mon.to"… */
  fieldErrors?: Partial<Record<string, string>>;
};

export async function createClinic(
  _prev: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  const user = await requireUser();
  const { locale, t } = await getRequestDictionary();
  if (!(await rateLimit(`clinics:create:${user.id}`, 5))) {
    return { error: t.clinic.errors.tooMany };
  }

  const parsed = clinicInput.safeParse(clinicFromForm(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] ??= translateMessage(
        issue.message,
        locale,
        (d) => d.clinic.validation,
      );
    }
    return { fieldErrors };
  }

  // One clinic per owner in this version.
  if (await getOwnedClinic(user.id)) redirect("/clinic");

  try {
    // created_by defaults to auth.uid(); the trigger in drizzle/0003 makes the user its owner.
    await withRls(user.id, (tx) => tx.insert(clinics).values(parsed.data));
  } catch (error) {
    if (isUniqueViolation(error, "clinics_slug_unique")) {
      return {
        fieldErrors: { slug: t.clinic.errors.slugTaken },
      };
    }
    throw error;
  }

  redirect("/clinic");
}
