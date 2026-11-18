import { describe, expect, it } from "vitest";
import { confirmationEmail, formatSessionTime } from "./email";

describe("formatSessionTime", () => {
  it("writes the time in Brussels, winter and summer", () => {
    expect(formatSessionTime(new Date("2026-12-01T09:00:00Z"))).toBe(
      "Tuesday 1 December at 10:00",
    );
    expect(formatSessionTime(new Date("2026-07-07T07:30:00Z"))).toBe(
      "Tuesday 7 July at 09:30",
    );
  });
});

describe("confirmationEmail", () => {
  const base = {
    serviceName: "Follow-up",
    physioName: "Thomas",
    clinicName: "Maison Tilleul",
    clinicAddress: "Rue Exemple 12, 1000 Brussels",
    startsAt: new Date("2026-12-01T09:00:00Z"),
    priceCents: 4500,
    link: "https://kinora-booking.vercel.app/bookings/b1",
  };

  it("says what, when, where, the price and how to cancel", () => {
    const email = confirmationEmail(base);
    expect(email.heading).toBe("Your session at Maison Tilleul is booked");
    expect(email.paragraphs).toEqual([
      "Follow-up with Thomas on Tuesday 1 December at 10:00.",
      "Address: Rue Exemple 12, 1000 Brussels.",
      "Paid by card: €45.00. You can cancel online up to 24 hours before for a full refund.",
    ]);
    expect(email.action).toEqual({
      label: "View my booking",
      url: "https://kinora-booking.vercel.app/bookings/b1",
    });
  });

  it("still reads well when the physio has no name yet", () => {
    const email = confirmationEmail({ ...base, physioName: null });
    expect(email.paragraphs[0]).toBe(
      "Follow-up with your physio on Tuesday 1 December at 10:00.",
    );
  });
});
