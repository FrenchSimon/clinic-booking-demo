import { describe, expect, it } from "vitest";
import { brusselsToday } from "@/features/availability/schema";
import { addDays, brusselsInstant, weekday } from "@/features/booking/time";
import { DEMO_PHYSIOS, DEMO_SERVICES, demoBookings, workingDay } from "./plan";

// Every day of two weeks, at 07:00 and 21:00 in Brussels, across the end of
// daylight saving time (26 October 2031).
const NOWS = Array.from({ length: 14 }, (_, i) =>
  addDays("2031-10-20", i),
).flatMap((day) => [
  brusselsInstant(day, "07:00"),
  brusselsInstant(day, "21:00"),
]);

const wallTime = (instant: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Brussels",
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).format(instant);

describe("workingDay", () => {
  it("counts Monday to Friday only", () => {
    // Friday 24 October 2031.
    expect(workingDay("2031-10-24", 0)).toBe("2031-10-24");
    expect(workingDay("2031-10-24", 1)).toBe("2031-10-27");
    expect(workingDay("2031-10-24", -5)).toBe("2031-10-17");
  });

  it("starts from the next Monday on a weekend", () => {
    expect(workingDay("2031-10-25", 0)).toBe("2031-10-27");
    expect(workingDay("2031-10-26", -1)).toBe("2031-10-24");
  });
});

describe("demoBookings", () => {
  it.each(NOWS)("fits each physio's hours, without overlap (%s)", (now) => {
    const rows = demoBookings(now);
    for (const b of rows) {
      const day = weekday(brusselsToday(b.startsAt));
      const hours = DEMO_PHYSIOS[b.physio]?.hours[day];
      expect(hours?.open).toBe(true);
      if (!hours?.open) continue;
      expect(wallTime(b.startsAt) >= hours.from).toBe(true);
      expect(wallTime(b.endsAt) <= hours.to).toBe(true);
      expect(DEMO_SERVICES[b.service]?.physios).toContain(b.physio);
    }
    for (const a of rows) {
      for (const b of rows) {
        if (a === b || a.physio !== b.physio) continue;
        expect(a.endsAt <= b.startsAt || b.endsAt <= a.startsAt).toBe(true);
      }
    }
  });

  it.each(NOWS)("is paid and cancelled in the past (%s)", (now) => {
    for (const b of demoBookings(now)) {
      expect(b.paidAt <= now).toBe(true);
      expect(b.cancelledAt === null).toBe(b.status === "confirmed");
      if (b.cancelledAt) expect(b.paidAt <= b.cancelledAt).toBe(true);
    }
  });

  it.each(NOWS)("has past, refunded and cancellable sessions (%s)", (now) => {
    const rows = demoBookings(now);
    const dayAfter = new Date(now.getTime() + 24 * 3_600_000);
    const confirmed = rows.filter((b) => b.status === "confirmed");
    expect(confirmed.some((b) => b.startsAt < now)).toBe(true);
    expect(confirmed.some((b) => b.startsAt > dayAfter)).toBe(true);
    expect(rows.some((b) => b.status === "refunded")).toBe(true);
  });
});
