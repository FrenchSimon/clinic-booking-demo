import { describe, expect, it } from "vitest";
import {
  DEFAULT_OPENING_HOURS,
  type OpeningHours,
} from "@/features/clinics/schema";
import { freeSlots, type PhysioSchedule, type SlotQuery } from "./slots";
import { brusselsInstant } from "./time";

// Tuesday 24 November 2026, winter time (UTC+1).
const TUE = "2026-11-24";
const closedWeek: OpeningHours = {
  mon: { open: false },
  tue: { open: false },
  wed: { open: false },
  thu: { open: false },
  fri: { open: false },
  sat: { open: false },
  sun: { open: false },
};
const tuesday = (from: string, to: string): OpeningHours => ({
  ...closedWeek,
  tue: { open: true, from, to },
});

const camille: PhysioSchedule = {
  membershipId: "camille",
  weeklyHours: tuesday("09:00", "11:00"),
  daysOff: [],
};

function query(overrides: Partial<SlotQuery> = {}): SlotQuery {
  return {
    from: TUE,
    days: 1,
    durationMinutes: 30,
    clinicHours: DEFAULT_OPENING_HOURS,
    physios: [camille],
    busy: [],
    now: new Date("2026-11-01T00:00:00Z"),
    ...overrides,
  };
}

/** The slots as "who@HH:MM" in Brussels time, easy to read in a test. */
function times(q: SlotQuery): string[] {
  const format = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Brussels",
    hour: "2-digit",
    minute: "2-digit",
  });
  return freeSlots(q).map(
    (s) => `${s.membershipId}@${format.format(s.startsAt)}`,
  );
}

const at = (time: string, date = TUE) => brusselsInstant(date, time);

describe("freeSlots", () => {
  it("puts slots every 15 minutes, ending by the end of the hours", () => {
    expect(times(query())).toEqual([
      "camille@09:00",
      "camille@09:15",
      "camille@09:30",
      "camille@09:45",
      "camille@10:00",
      "camille@10:15",
      "camille@10:30",
    ]);
  });

  it("gives each slot the length of the service", () => {
    const [first] = freeSlots(query({ durationMinutes: 45 }));
    expect(first?.startsAt).toEqual(at("09:00"));
    expect(first?.endsAt).toEqual(at("09:45"));
  });

  it("finds nothing when the service is longer than the hours", () => {
    expect(times(query({ durationMinutes: 150 }))).toEqual([]);
  });

  it("keeps to the clinic's opening hours", () => {
    const clinicHours = {
      ...DEFAULT_OPENING_HOURS,
      tue: { open: true as const, from: "10:00", to: "19:00" },
    };
    expect(times(query({ clinicHours }))).toEqual([
      "camille@10:00",
      "camille@10:15",
      "camille@10:30",
    ]);
  });

  it("finds nothing on a day the clinic is closed", () => {
    expect(
      times(
        query({
          clinicHours: { ...DEFAULT_OPENING_HOURS, tue: { open: false } },
        }),
      ),
    ).toEqual([]);
  });

  it("starts on the 15-minute grid when the hours do not", () => {
    const physio = { ...camille, weeklyHours: tuesday("09:10", "10:00") };
    expect(times(query({ physios: [physio] }))).toEqual([
      "camille@09:15",
      "camille@09:30",
    ]);
  });

  it("skips a physio who has not saved their hours", () => {
    expect(
      times(query({ physios: [{ ...camille, weeklyHours: null }] })),
    ).toEqual([]);
  });

  it("skips days off, both ends included", () => {
    const off = (startsOn: string, endsOn: string) =>
      times(
        query({ physios: [{ ...camille, daysOff: [{ startsOn, endsOn }] }] }),
      );
    expect(off(TUE, TUE)).toEqual([]);
    expect(off("2026-11-20", TUE)).toEqual([]);
    expect(off(TUE, "2026-11-30")).toEqual([]);
    expect(off("2026-11-25", "2026-11-30")).toHaveLength(7);
  });

  it("skips every slot that overlaps a booking, and only that physio's", () => {
    const busy = [
      { membershipId: "camille", startsAt: at("09:45"), endsAt: at("10:30") },
      { membershipId: "thomas", startsAt: at("09:00"), endsAt: at("11:00") },
    ];
    // 09:15–09:45 ends as the booking starts, 10:30 starts as it ends: both free.
    expect(times(query({ busy }))).toEqual([
      "camille@09:00",
      "camille@09:15",
      "camille@10:30",
    ]);
  });

  it("drops slots that have already started", () => {
    expect(times(query({ now: at("10:05") }))).toEqual([
      "camille@10:15",
      "camille@10:30",
    ]);
  });

  it("lists several physios and days in time order", () => {
    const thomas: PhysioSchedule = {
      membershipId: "thomas",
      weeklyHours: {
        ...tuesday("10:00", "10:30"),
        wed: { open: true, from: "09:00", to: "09:30" },
      },
      daysOff: [],
    };
    const q = query({
      physios: [thomas, camille],
      days: 2,
      durationMinutes: 30,
    });
    expect(times(q).slice(4)).toEqual([
      "camille@10:00",
      "thomas@10:00",
      "camille@10:15",
      "camille@10:30",
      "thomas@09:00",
    ]);
    expect(freeSlots(q).at(-1)?.startsAt).toEqual(at("09:00", "2026-11-25"));
  });

  it("follows the clocks on the day they change", () => {
    // Sunday 29 March 2026: clocks go forward at 02:00, Brussels is UTC+2 after.
    const sunday = {
      ...closedWeek,
      sun: { open: true as const, from: "09:00", to: "09:30" },
    };
    const [slot] = freeSlots(
      query({
        from: "2026-03-29",
        clinicHours: sunday,
        physios: [{ ...camille, weeklyHours: sunday }],
        now: new Date("2026-03-01T00:00:00Z"),
      }),
    );
    expect(slot?.startsAt.toISOString()).toBe("2026-03-29T07:00:00.000Z");
  });
});
