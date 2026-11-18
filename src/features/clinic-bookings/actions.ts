"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { cancelAndRefund } from "@/features/booking/cancellation";
import { requireUser } from "@/server/auth";

const cancelInput = z.object({ booking: z.uuid() });

/**
 * "Cancel and refund" on the owner's booking page (checklist #13). The
 * database checks that the user owns the booking's clinic, not the page.
 */
export async function cancelClinicBooking(formData: FormData): Promise<void> {
  const parsed = cancelInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/clinic/bookings");
  const user = await requireUser();
  const id = parsed.data.booking;
  const outcome = await cancelAndRefund(user.id, id);
  redirect(
    outcome === "refunded"
      ? `/clinic/bookings/${id}`
      : `/clinic/bookings/${id}?error=${outcome}`,
  );
}
