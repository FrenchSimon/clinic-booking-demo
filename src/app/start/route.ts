import { redirect } from "next/navigation";
import { landingPath } from "@/features/auth/landing";
import { listMyRoles } from "@/features/clinics/queries";
import { requireUser } from "@/server/auth";

// Where logging in, signing up and email links go when no page asked for the
// user: staff to their clinic, a patient to their bookings (R2.11).
export async function GET() {
  const user = await requireUser();
  redirect(landingPath(await listMyRoles(user.id)));
}
