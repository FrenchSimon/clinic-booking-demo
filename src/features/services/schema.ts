import { z } from "zod";

// Shared by the form (instant feedback) and the Server Action (the real check).
// The limits match the checks on the services table.

/** "45", "45.5", "45,50" or "€45.00" → 4550 cents. */
export function parseEuros(value: string): number | null {
  const match = value
    .trim()
    .replace(/^€\s*/, "")
    .match(/^(\d{1,4})(?:[.,](\d{1,2}))?$/);
  if (!match) return null;
  const [, euros = "0", cents = ""] = match;
  return Number(euros) * 100 + Number(cents.padEnd(2, "0"));
}

/** 4550 → "€45.00", the format of every price list. */
export function formatEuros(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export const serviceInput = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter the session's name")
    .max(60, "60 characters max"),
  durationMinutes: z.coerce
    .number<string>("Enter the length in minutes")
    .int("Enter whole minutes")
    .min(10, "At least 10 minutes")
    .max(240, "4 hours max")
    .multipleOf(5, "Use steps of 5 minutes"),
  priceCents: z
    .string()
    .transform((v, ctx) => {
      const cents = parseEuros(v);
      if (cents === null) {
        ctx.addIssue({ code: "custom", message: "Enter a price like 45.00" });
        return z.NEVER;
      }
      return cents;
    })
    .pipe(
      z
        .number()
        .min(50, "Card payments start at €0.50")
        .max(100000, "€1,000.00 max"),
    ),
  practitionerIds: z.array(z.uuid()).max(50),
  active: z.boolean(),
});

export type ServiceInput = z.infer<typeof serviceInput>;

/** Reads the service form: one checkbox per physio, one for "shown". */
export function serviceFromForm(formData: FormData): unknown {
  return {
    name: formData.get("name") ?? "",
    durationMinutes: formData.get("durationMinutes") ?? "",
    priceCents: formData.get("price") ?? "",
    practitionerIds: formData.getAll("practitionerIds").map(String),
    active: formData.get("active") === "on",
  };
}
