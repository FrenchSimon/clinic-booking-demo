import { describe, expect, it } from "vitest";
import {
  addDays,
  brusselsInstant,
  fromMinutes,
  toMinutes,
  weekday,
} from "./time";

describe("brusselsInstant", () => {
  it.each([
    // Winter: UTC+1.
    ["2026-11-24", "09:30", "2026-11-24T08:30:00.000Z"],
    // Summer: UTC+2.
    ["2026-07-01", "09:30", "2026-07-01T07:30:00.000Z"],
    // Clocks go forward at 02:00 on 29 March 2026.
    ["2026-03-28", "09:00", "2026-03-28T08:00:00.000Z"],
    ["2026-03-29", "09:00", "2026-03-29T07:00:00.000Z"],
    ["2026-03-29", "01:30", "2026-03-29T00:30:00.000Z"],
    // Clocks go back at 03:00 on 25 October 2026.
    ["2026-10-24", "09:00", "2026-10-24T07:00:00.000Z"],
    ["2026-10-25", "09:00", "2026-10-25T08:00:00.000Z"],
    // Just after midnight: the UTC day is still the day before.
    ["2026-11-24", "00:15", "2026-11-23T23:15:00.000Z"],
  ])("%s at %s is %s", (date, time, iso) => {
    expect(brusselsInstant(date, time).toISOString()).toBe(iso);
  });
});

describe("calendar days", () => {
  it("gives the weekday", () => {
    expect(weekday("2026-11-24")).toBe("tue");
    expect(weekday("2026-11-29")).toBe("sun");
  });

  it("adds days across months, years and DST changes", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("minutes", () => {
  it("converts both ways", () => {
    expect(toMinutes("09:30")).toBe(570);
    expect(fromMinutes(570)).toBe("09:30");
    expect(fromMinutes(toMinutes("00:05"))).toBe("00:05");
  });
});
