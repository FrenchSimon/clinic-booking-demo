import { describe, expect, it } from "vitest";
import type { BookingStatus } from "@/features/booking/table";
import { dashboardFigures, dashboardPeriods, readRange } from "./figures";

describe("dashboardPeriods", () => {
  it("runs today, Monday to Sunday and the month in Brussels time", () => {
    const p = dashboardPeriods("2026-11-18");
    expect(p.today.from.toISOString()).toBe("2026-11-17T23:00:00.000Z");
    expect(p.today.to.toISOString()).toBe("2026-11-18T23:00:00.000Z");
    expect(p.week.from.toISOString()).toBe("2026-11-15T23:00:00.000Z");
    expect(p.week.to.toISOString()).toBe("2026-11-22T23:00:00.000Z");
    expect(p.month.from.toISOString()).toBe("2026-10-31T23:00:00.000Z");
    expect(p.month.to.toISOString()).toBe("2026-11-30T23:00:00.000Z");
  });

  it("starts the week on Monday when today is Sunday", () => {
    const p = dashboardPeriods("2026-11-22");
    expect(p.week.from.toISOString()).toBe("2026-11-15T23:00:00.000Z");
  });

  it("rolls December over to January", () => {
    const p = dashboardPeriods("2026-12-31");
    expect(p.month.to.toISOString()).toBe("2026-12-31T23:00:00.000Z");
  });

  it("reads a week that spans two months", () => {
    // Monday 30 November to Sunday 6 December.
    const range = readRange(dashboardPeriods("2026-12-02"));
    expect(range.from.toISOString()).toBe("2026-11-29T23:00:00.000Z");
    expect(range.to.toISOString()).toBe("2026-12-31T23:00:00.000Z");
  });
});

const NOW = new Date("2026-11-18T10:00:00Z");
const PERIODS = dashboardPeriods("2026-11-18");

function row(
  startsAt: string,
  status: BookingStatus = "confirmed",
  holdExpiresAt: string | null = null,
) {
  const start = new Date(startsAt);
  return {
    startsAt: start,
    endsAt: new Date(start.getTime() + 30 * 60_000),
    status,
    holdExpiresAt: holdExpiresAt ? new Date(holdExpiresAt) : null,
    priceCents: 4500,
  };
}

describe("dashboardFigures", () => {
  const rows = [
    row("2026-11-18T14:00:00Z"),
    row("2026-11-18T08:00:00Z"),
    // A hold still being paid, and one whose 15 minutes are over.
    row("2026-11-18T09:00:00Z", "pending_payment", "2026-11-18T10:05:00Z"),
    row("2026-11-18T11:00:00Z", "pending_payment", "2026-11-18T09:55:00Z"),
    row("2026-11-18T12:00:00Z", "expired"),
    row("2026-11-18T13:00:00Z", "refunded"),
    // Later this week, earlier this month, next week.
    row("2026-11-20T08:00:00Z"),
    row("2026-11-03T08:00:00Z"),
    row("2026-11-04T08:00:00Z", "cancelled"),
    row("2026-11-24T08:00:00Z"),
    // December: outside every period.
    row("2026-12-01T08:00:00Z"),
  ];
  const f = dashboardFigures(rows, PERIODS, NOW);

  it("counts paid bookings today and this week", () => {
    expect(f.todayCount).toBe(2);
    expect(f.weekCount).toBe(3);
  });

  it("adds up this month's paid sessions", () => {
    expect(f.revenueCents).toBe(5 * 4500);
  });

  it("counts this month's cancellations and what was refunded", () => {
    expect(f.cancelledCount).toBe(2);
    expect(f.refundedCents).toBe(4500);
  });

  it("lists today's sessions by time, unpaid holds aside", () => {
    expect(
      f.todaySessions.map((s) => [s.startsAt.toISOString(), s.status]),
    ).toEqual([
      ["2026-11-18T08:00:00.000Z", "confirmed"],
      ["2026-11-18T09:00:00.000Z", "pending_payment"],
      ["2026-11-18T13:00:00.000Z", "refunded"],
      ["2026-11-18T14:00:00.000Z", "confirmed"],
    ]);
  });
});
