import { z } from "zod";
import { membershipRole } from "@/features/clinics/table";

/** The role picked in the "View as" bar (checklist #20). */
export const viewAsInput = z.object({
  role: z.enum(membershipRole.enumValues),
});
