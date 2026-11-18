import { z } from "zod";

// Shared by the form (instant feedback) and the Server Action (the real check).

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Day = (typeof DAYS)[number];

export const DAY_LABELS: Record<Day, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use the 24-hour format, like 08:30");

/** One day: closed, or open from one time to a later one. */
const dayHours = z.discriminatedUnion("open", [
  z.object({ open: z.literal(false) }),
  z
    .object({ open: z.literal(true), from: time, to: time })
    .refine((d) => d.from < d.to, {
      message: "Closing time must be after opening time",
      path: ["to"],
    }),
]);

export const openingHoursSchema = z.object({
  mon: dayHours,
  tue: dayHours,
  wed: dayHours,
  thu: dayHours,
  fri: dayHours,
  sat: dayHours,
  sun: dayHours,
});

export type OpeningHours = z.infer<typeof openingHoursSchema>;

export const DEFAULT_OPENING_HOURS: OpeningHours = {
  mon: { open: true, from: "08:00", to: "19:00" },
  tue: { open: true, from: "08:00", to: "19:00" },
  wed: { open: true, from: "08:00", to: "19:00" },
  thu: { open: true, from: "08:00", to: "19:00" },
  fri: { open: true, from: "08:00", to: "19:00" },
  sat: { open: true, from: "09:00", to: "13:00" },
  sun: { open: false },
};

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const clinicInput = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter the clinic's name")
    .max(80, "80 characters max"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "At least 3 characters")
    .max(60, "60 characters max")
    .regex(SLUG_PATTERN, "Use lowercase letters, digits and dashes"),
  address: z
    .string()
    .trim()
    .min(5, "Enter the street, postcode and city")
    .max(200, "200 characters max"),
  openingHours: openingHoursSchema,
});

export type ClinicInput = z.infer<typeof clinicInput>;

/** "Maison Tilleul" → "maison-tilleul": the address of the public booking page. */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

/** Reads the clinic form: one checkbox and two time fields per day. */
export function clinicFromForm(formData: FormData): unknown {
  const openingHours: Record<string, unknown> = {};
  for (const day of DAYS) {
    const open = formData.get(`${day}.open`) === "on";
    openingHours[day] = open
      ? {
          open,
          from: String(formData.get(`${day}.from`) ?? ""),
          to: String(formData.get(`${day}.to`) ?? ""),
        }
      : { open };
  }
  return {
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    address: formData.get("address") ?? "",
    openingHours,
  };
}
