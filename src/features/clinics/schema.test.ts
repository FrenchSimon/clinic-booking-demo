import { describe, expect, it } from "vitest";
import {
  clinicFromForm,
  clinicInput,
  DEFAULT_OPENING_HOURS,
  openingHoursSchema,
  slugify,
} from "./schema";

const valid = {
  name: "Maison Tilleul",
  slug: "maison-tilleul",
  address: "Rue Exemple 1, 1000 Brussels",
  openingHours: DEFAULT_OPENING_HOURS,
};

describe("slugify", () => {
  it.each([
    ["Maison Tilleul", "maison-tilleul"],
    ["  Kiné Ixelles & Co ", "kine-ixelles-co"],
    ["Ça va -- très bien!", "ca-va-tres-bien"],
  ])("turns %s into %s", (name, slug) => {
    expect(slugify(name)).toBe(slug);
  });

  it("never ends with a dash after cutting at 60 characters", () => {
    expect(slugify(`${"a".repeat(59)} b`).endsWith("-")).toBe(false);
  });
});

describe("clinicInput", () => {
  it("accepts a complete clinic", () => {
    expect(clinicInput.safeParse(valid).success).toBe(true);
  });

  it("refuses a slug with spaces or capitals after trimming", () => {
    expect(
      clinicInput.safeParse({ ...valid, slug: "maison tilleul" }).success,
    ).toBe(false);
  });

  it("lowercases the slug", () => {
    expect(clinicInput.parse({ ...valid, slug: "Maison-Tilleul" }).slug).toBe(
      "maison-tilleul",
    );
  });
});

describe("clinicInput address", () => {
  it.each([
    ["an email", "anna@example.com"],
    ["text without a number", "beznjjnmail.com"],
  ])("refuses %s", (_label, address) => {
    expect(clinicInput.safeParse({ ...valid, address }).success).toBe(false);
  });
});

describe("openingHoursSchema", () => {
  it("refuses a day that closes before it opens", () => {
    const result = openingHoursSchema.safeParse({
      ...DEFAULT_OPENING_HOURS,
      mon: { open: true, from: "19:00", to: "08:00" },
    });
    expect(result.success).toBe(false);
  });

  it("refuses a time that is not HH:MM", () => {
    const result = openingHoursSchema.safeParse({
      ...DEFAULT_OPENING_HOURS,
      tue: { open: true, from: "8h", to: "19:00" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts a closed day without times", () => {
    expect(openingHoursSchema.safeParse(DEFAULT_OPENING_HOURS).success).toBe(
      true,
    );
  });
});

describe("clinicFromForm", () => {
  it("reads a closed Sunday and an open Monday", () => {
    const form = new FormData();
    form.set("name", "Maison Tilleul");
    form.set("mon.open", "on");
    form.set("mon.from", "08:00");
    form.set("mon.to", "19:00");
    const parsed = clinicFromForm(form) as {
      openingHours: Record<string, unknown>;
    };
    expect(parsed.openingHours.mon).toEqual({
      open: true,
      from: "08:00",
      to: "19:00",
    });
    expect(parsed.openingHours.sun).toEqual({ open: false });
  });
});
