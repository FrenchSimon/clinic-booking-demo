import { describe, expect, it } from "vitest";
import {
  cancellationEmail,
  confirmationEmail,
  formatSessionTime,
  reminderEmail,
} from "./email";

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

describe("cancellationEmail", () => {
  const base = {
    serviceName: "Follow-up",
    physioName: "Thomas",
    clinicName: "Maison Tilleul",
    clinicAddress: "Rue Exemple 12, 1000 Brussels",
    startsAt: new Date("2026-12-01T09:00:00Z"),
    priceCents: 4500,
    byClinic: false,
    link: "https://kinora-booking.vercel.app/bookings/b1",
  };

  it("says which session is cancelled and how much is refunded", () => {
    const email = cancellationEmail(base);
    expect(email.heading).toBe("Your session at Maison Tilleul is cancelled");
    expect(email.paragraphs).toEqual([
      "You cancelled your session: Follow-up with Thomas on Tuesday 1 December at 10:00.",
      "Your payment of €45.00 is refunded in full to your card. It usually shows on your account within 5 to 10 business days.",
    ]);
    expect(email.action?.url).toBe(base.link);
  });

  it("tells the patient when the clinic cancelled", () => {
    const email = cancellationEmail({
      ...base,
      byClinic: true,
      physioName: null,
    });
    expect(email.paragraphs[0]).toBe(
      "Maison Tilleul cancelled your session: Follow-up with your physio on Tuesday 1 December at 10:00.",
    );
  });
});

describe("reminderEmail", () => {
  const base = {
    serviceName: "Follow-up",
    physioName: "Thomas",
    clinicName: "Maison Tilleul",
    clinicAddress: "Rue Exemple 12, 1000 Brussels",
    startsAt: new Date("2026-12-01T09:00:00Z"),
    link: "https://kinora-booking.vercel.app/bookings/b1",
  };

  it("says what, when and where, and that online cancelling is closed", () => {
    const email = reminderEmail(base);
    expect(email.heading).toBe("Your session at Maison Tilleul is tomorrow");
    expect(email.paragraphs).toEqual([
      "Follow-up with Thomas on Tuesday 1 December at 10:00.",
      "Address: Rue Exemple 12, 1000 Brussels.",
      "It is too late to cancel online. If you cannot come, please contact the clinic.",
    ]);
    expect(email.action?.url).toBe(base.link);
  });

  it("still reads well when the physio has no name yet", () => {
    const email = reminderEmail({ ...base, physioName: null });
    expect(email.paragraphs[0]).toBe(
      "Follow-up with your physio on Tuesday 1 December at 10:00.",
    );
  });
});
