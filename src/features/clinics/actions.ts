"use server";

import { redirect } from "next/navigation";
import { withRls } from "@/lib/db";
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

function isUniqueViolation(error: unknown, constraint: string): boolean {
  const cause = (
    error as { cause?: { code?: string; constraint_name?: string } }
  )?.cause;
  return cause?.code === "23505" && cause.constraint_name === constraint;
}

export async function createClinic(
  _prev: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  const user = await requireUser();
  if (!(await rateLimit(`clinics:create:${user.id}`, 5))) {
    return { error: "Too many attempts. Wait a minute and try again." };
  }

  const parsed = clinicInput.safeParse(clinicFromForm(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] ??= issue.message;
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
        fieldErrors: { slug: "This address is already taken. Try another." },
      };
    }
    throw error;
  }

  redirect("/clinic");
}
