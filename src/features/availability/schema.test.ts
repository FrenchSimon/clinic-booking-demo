import { describe, expect, it } from "vitest";
import { DEFAULT_OPENING_HOURS } from "@/features/clinics/schema";
import { brusselsToday, dayOffInput, outsideOpeningHours } from "./schema";

describe("brusselsToday", () => {
  it("uses the Brussels date, not the UTC one", () => {
    // 23:30 UTC on 18 November is already 19 November in Brussels.
    expect(brusselsToday(new Date("2026-11-18T23:30:00Z"))).toBe("2026-11-19");
    expect(brusselsToday(new Date("2026-11-18T12:00:00Z"))).toBe("2026-11-18");
  });
});

describe("outsideOpeningHours", () => {
  const clinic = DEFAULT_OPENING_HOURS; // Mon–Fri 08:00–19:00, Sat 09:00–13:00, Sun closed

  it("accepts hours inside the opening hours, and days not worked", () => {
    expect(
      outsideOpeningHours(
        {
          ...clinic,
          mon: { open: true, from: "08:00", to: "19:00" },
          tue: { open: true, from: "10:00", to: "16:00" },
          sat: { open: false },
        },
        clinic,
      ),
    ).toEqual({});
  });

  it("refuses a day the clinic is closed", () => {
    expect(
      outsideOpeningHours(
        { ...clinic, sun: { open: true, from: "10:00", to: "12:00" } },
        clinic,
      ),
    ).toEqual({ "weeklyHours.sun.from": "The clinic is closed on Sunday" });
  });

  it("refuses hours that start before or end after the clinic's", () => {
    expect(
      outsideOpeningHours(
        {
          ...clinic,
          mon: { open: true, from: "07:30", to: "12:00" },
          sat: { open: true, from: "09:00", to: "14:00" },
        },
        clinic,
      ),
    ).toEqual({
      "weeklyHours.mon.from": "The clinic is open 08:00–19:00 on Monday",
      "weeklyHours.sat.from": "The clinic is open 09:00–13:00 on Saturday",
    });
  });
});

describe("dayOffInput", () => {
  const schema = dayOffInput("2026-11-18");

  it("accepts one day, today included", () => {
    expect(
      schema.safeParse({ startsOn: "2026-11-18", endsOn: "2026-11-18" })
        .success,
    ).toBe(true);
  });

  it.each([
    [
      { startsOn: "2026-11-17", endsOn: "2026-11-20" },
      "Pick today or a later day",
    ],
    [
      { startsOn: "2026-11-20", endsOn: "2026-11-19" },
      "The last day must be on or after the first",
    ],
    [{ startsOn: "2026-11-20", endsOn: "2027-12-01" }, "One year max"],
    [{ startsOn: "", endsOn: "2026-11-20" }, "Pick a day"],
    [{ startsOn: "2026-02-30", endsOn: "2026-03-01" }, "Pick a day"],
  ])("refuses %o", (input, message) => {
    expect(schema.safeParse(input).error?.issues[0]?.message).toBe(message);
  });
});
