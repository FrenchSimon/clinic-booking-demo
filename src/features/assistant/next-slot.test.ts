import { describe, expect, it } from "vitest";
import type { BookingPage } from "@/features/booking/public";
import type { PhysioSchedule } from "@/features/booking/slots";
import { brusselsInstant } from "@/features/booking/time";
import { DEFAULT_OPENING_HOURS } from "@/features/clinics/schema";
import { clinicFacts } from "./facts";
import { nextFreeSlot } from "./next-slot";

const INES = "00000000-0000-4000-8000-000000000001";
const TOM = "00000000-0000-4000-8000-000000000002";
const SERVICE = "00000000-0000-4000-8000-000000000003";

const page: BookingPage = {
  id: "00000000-0000-4000-8000-000000000009",
  name: "Maison Tilleul",
  slug: "maison-tilleul",
  address: "Rue du Tilleul 12, Brussels",
  openingHours: DEFAULT_OPENING_HOURS,
  services: [
    {
      id: SERVICE,
      name: "Initial assessment",
      durationMinutes: 45,
      priceCents: 6000,
      physioIds: [INES, TOM],
    },
  ],
  physios: [
    { id: INES, name: "Inès Dubois" },
    { id: TOM, name: "Tom Peeters" },
  ],
};

const works = (id: string, from: string): PhysioSchedule => ({
  membershipId: id,
  weeklyHours: {
    ...DEFAULT_OPENING_HOURS,
    tue: { open: true, from, to: "12:00" },
    wed: { open: true, from, to: "12:00" },
  },
  daysOff: [],
});

// Tuesday 24 November 2026, 07:00 in Brussels.
const now = brusselsInstant("2026-11-24", "07:00");
const schedules = [works(INES, "09:00"), works(TOM, "08:00")];

describe("nextFreeSlot", () => {
  it("returns the first free slot of any physio, with a prefilled link", () => {
    const result = nextFreeSlot(
      page,
      { schedules, busy: [] },
      { service: "initial assessment" },
      now,
    );
    expect(result).toEqual({
      found: true,
      slot: {
        day: "2026-11-24",
        when: "Tuesday, 24 November 2026 at 08:00",
        time: "08:00",
        physio: "Tom Peeters",
        service: "Initial assessment",
        href: `/c/maison-tilleul?service=${SERVICE}&physio=${TOM}&day=2026-11-24&at=08%3A00`,
      },
    });
  });

  it("skips busy times and keeps to the physio asked for", () => {
    const busy = [
      {
        membershipId: INES,
        startsAt: brusselsInstant("2026-11-24", "09:00"),
        endsAt: brusselsInstant("2026-11-24", "10:00"),
      },
    ];
    const result = nextFreeSlot(
      page,
      { schedules, busy },
      { service: "Initial assessment", physio: "Inès" },
      now,
    );
    expect(result.found && result.slot.time).toBe("10:00");
  });

  it("starts the search on the day asked for", () => {
    const result = nextFreeSlot(
      page,
      { schedules, busy: [] },
      { service: "Initial assessment", from: "2026-11-25" },
      now,
    );
    expect(result.found && result.slot.day).toBe("2026-11-25");
  });

  it("refuses an unknown session or physio instead of guessing", () => {
    const avail = { schedules, busy: [] };
    expect(nextFreeSlot(page, avail, { service: "Massage" }, now).found).toBe(
      false,
    );
    expect(
      nextFreeSlot(
        page,
        avail,
        { service: "Initial assessment", physio: "Anna" },
        now,
      ).found,
    ).toBe(false);
  });

  it("finds nothing beyond the 14 bookable days", () => {
    const result = nextFreeSlot(
      page,
      { schedules, busy: [] },
      { service: "Initial assessment", from: "2026-12-20" },
      now,
    );
    expect(result.found).toBe(false);
  });
});

describe("clinicFacts", () => {
  it("lists hours, prices and physios, and nothing else", () => {
    const facts = clinicFacts(page, "2026-11-24");
    expect(facts).toContain("Today: Tuesday, 24 November 2026 (2026-11-24)");
    expect(facts).toContain("- Sunday: closed");
    expect(facts).toContain(
      "- Initial assessment: 45 min, €60.00, with Inès Dubois, Tom Peeters",
    );
  });
});
