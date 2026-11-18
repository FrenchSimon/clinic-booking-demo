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

/**
 * The email a patient gets once a cancelled session is refunded (checklist
 * #14), whether they cancelled it (#12) or the clinic did (#13).
 */
export function cancellationEmail(input: {
  serviceName: string;
  physioName: string | null;
  clinicName: string;
  clinicAddress: string;
  startsAt: Date;
  priceCents: number;
  byClinic: boolean;
  link: string;
}): EmailContent {
  const physio = input.physioName ?? "your physio";
  const session = `${input.serviceName} with ${physio} on ${formatSessionTime(input.startsAt)}`;
  return {
    heading: `Your session at ${input.clinicName} is cancelled`,
    paragraphs: [
      input.byClinic
        ? `${input.clinicName} cancelled your session: ${session}.`
        : `You cancelled your session: ${session}.`,
      `Your payment of ${formatEuros(input.priceCents)} is refunded in full to your card. It usually shows on your account within 5 to 10 business days.`,
    ],
    action: { label: "View my booking", url: input.link },
    footer: `${input.clinicName} · ${input.clinicAddress}`,
  };
}

/** The email a patient gets the day before their session (checklist #15). */
export function reminderEmail(input: {
  serviceName: string;
  physioName: string | null;
  clinicName: string;
  clinicAddress: string;
  startsAt: Date;
  link: string;
}): EmailContent {
  const physio = input.physioName ?? "your physio";
  return {
    heading: `Your session at ${input.clinicName} is tomorrow`,
    paragraphs: [
      `${input.serviceName} with ${physio} on ${formatSessionTime(input.startsAt)}.`,
      `Address: ${input.clinicAddress}.`,
      "It is too late to cancel online. If you cannot come, please contact the clinic.",
    ],
    action: { label: "View my booking", url: input.link },
    footer: `${input.clinicName} · ${input.clinicAddress}`,
  };
}
