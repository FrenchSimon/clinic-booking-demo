import type { MembershipRole } from "@/features/clinics/table";

/**
 * Where a signed-in user goes when no page asked for them: staff to their
 * clinic, a patient to their bookings, someone with no role yet to create a
 * clinic (they came from "Create a clinic account").
 */
export function landingPath(roles: readonly MembershipRole[]): string {
  if (roles.includes("owner") || roles.includes("practitioner")) {
    return "/clinic";
  }
  if (roles.includes("patient")) return "/bookings";
  return "/clinic/new";
}
