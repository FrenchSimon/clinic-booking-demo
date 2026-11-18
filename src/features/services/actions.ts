"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getOwnedClinic } from "@/features/clinics/queries";
import { getTeam } from "@/features/invitations/queries";
import { withRls } from "@/lib/db";
import { isUniqueViolation } from "@/lib/pg-errors";
import { requireUser } from "@/server/auth";
import { rateLimit } from "@/server/rate-limit";
import { type ServiceInput, serviceFromForm, serviceInput } from "./schema";
import { servicePractitioners, services } from "./table";

export type ServiceFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof ServiceInput, string>>;
};

/** Creates a service, or updates it when the form is bound to its id. */
export async function saveService(
  serviceId: string | null,
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const user = await requireUser();
  if (!(await rateLimit(`services:save:${user.id}`, 20))) {
    return { error: "Too many changes in a minute. Try again shortly." };
  }
  if (serviceId !== null && !z.uuid().safeParse(serviceId).success) {
    return { error: "This service does not exist." };
  }
  const parsed = serviceInput.safeParse(serviceFromForm(formData));
  if (!parsed.success) return { fieldErrors: firstErrors(parsed.error) };

  // RLS also refuses a non-owner and another clinic's physio; this gives clear messages first.
  const clinic = await getOwnedClinic(user.id);
  if (!clinic) return { error: "Only the clinic's owner can change services." };
  const { physios } = await getTeam(user.id, clinic.id);
  if (
    parsed.data.practitionerIds.some((id) => !physios.some((p) => p.id === id))
  ) {
    return { fieldErrors: { practitionerIds: "Pick physios of your clinic." } };
  }

  const failed = await writeService(user.id, clinic.id, serviceId, parsed.data);
  if (failed) return failed;

  revalidatePath("/clinic/services");
  redirect("/clinic/services");
}

function firstErrors(error: z.ZodError): ServiceFormState["fieldErrors"] {
  const fieldErrors: ServiceFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    fieldErrors[issue.path[0] as keyof ServiceInput] ??= issue.message;
  }
  return fieldErrors;
}

/** Saves the service and its physio links in one transaction. Returns the error, if any. */
async function writeService(
  userId: string,
  clinicId: string,
  serviceId: string | null,
  { practitionerIds, ...fields }: ServiceInput,
): Promise<ServiceFormState | null> {
  try {
    return await withRls(userId, async (tx) => {
      const [row] = serviceId
        ? await tx
            .update(services)
            .set(fields)
            .where(
              and(eq(services.id, serviceId), eq(services.clinicId, clinicId)),
            )
            .returning({ id: services.id })
        : await tx
            .insert(services)
            .values({ clinicId, ...fields })
            .returning({ id: services.id });
      if (!row) return { error: "This service does not exist." };
      // The checkboxes are the whole list: replace the links.
      await tx
        .delete(servicePractitioners)
        .where(eq(servicePractitioners.serviceId, row.id));
      const links = practitionerIds.map((membershipId) => ({
        clinicId,
        serviceId: row.id,
        membershipId,
      }));
      if (links.length > 0) await tx.insert(servicePractitioners).values(links);
      return null;
    });
  } catch (error) {
    if (!isUniqueViolation(error, "services_clinic_name_unique")) throw error;
    return {
      fieldErrors: { name: "You already have a service with this name." },
    };
  }
}
