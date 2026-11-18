import type { EmailContent } from "@/features/email/layout";
import { formatEuros } from "@/features/services/schema";

// "Tuesday 1 December at 10:00", always in Brussels time (one time zone).
const day = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Brussels",
});
const time = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Europe/Brussels",
});

export function formatSessionTime(startsAt: Date): string {
  return `${day.format(startsAt)} at ${time.format(startsAt)}`;
}

/** The email a patient gets once their session is paid (checklist #14). */
export function confirmationEmail(input: {
  serviceName: string;
  physioName: string | null;
  clinicName: string;
  clinicAddress: string;
  startsAt: Date;
  priceCents: number;
  link: string;
}): EmailContent {
  const physio = input.physioName ?? "your physio";
  return {
    heading: `Your session at ${input.clinicName} is booked`,
    paragraphs: [
      `${input.serviceName} with ${physio} on ${formatSessionTime(input.startsAt)}.`,
      `Address: ${input.clinicAddress}.`,
      `Paid by card: ${formatEuros(input.priceCents)}. You can cancel online up to 24 hours before for a full refund.`,
    ],
    action: { label: "View my booking", url: input.link },
    footer: `${input.clinicName} · ${input.clinicAddress}`,
  };
}
