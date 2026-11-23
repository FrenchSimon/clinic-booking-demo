import { z } from "zod";
import { team } from "@/i18n/en/team";
import { moneyFormat } from "@/i18n/format";
import type { Locale } from "@/i18n/locale";

const v = team.serviceValidation;

// Shared by the form (instant feedback) and the Server Action (the real check).
// The limits match the checks on the services table.

/** "45", "45.5", "45,50", "€45.00" or "45,00 €" → 4550 cents. */
export function parseEuros(value: string): number | null {
  const match = value
    .trim()
    .replace(/^€\s*/, "")
    .replace(/\s*€$/, "")
    .match(/^(\d{1,4})(?:[.,](\d{1,2}))?$/);
  if (!match) return null;
  const [, euros = "0", cents = ""] = match;
  return Number(euros) * 100 + Number(cents.padEnd(2, "0"));
}

/** 4550 → "€45.00" (or "45,00 €" in French), the format of every price list. */
export function formatEuros(cents: number, locale: Locale = "en"): string {
  if (locale === "en") return `€${(cents / 100).toFixed(2)}`;
  return moneyFormat(locale).format(cents / 100);
}

export const serviceInput = z.object({
  name: z.string().trim().min(2, v.nameMissing).max(60, v.nameTooLong),
  durationMinutes: z.coerce
    .number<string>(v.lengthMissing)
    .int(v.lengthWhole)
    .min(10, v.lengthMin)
    .max(240, v.lengthMax)
    .multipleOf(5, v.lengthStep),
  priceCents: z
    .string()
    .transform((input, ctx) => {
      const cents = parseEuros(input);
      if (cents === null) {
        ctx.addIssue({ code: "custom", message: v.priceInvalid });
        return z.NEVER;
      }
      return cents;
    })
    .pipe(z.number().min(50, v.priceMin).max(100000, v.priceMax)),
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
