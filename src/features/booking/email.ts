import type { EmailContent } from "@/features/email/layout";
import { formatEuros } from "@/features/services/schema";
import { dictionaries } from "@/i18n/dictionaries";
import { dateFormat, timeFormat } from "@/i18n/format";
import { fill, type Locale } from "@/i18n/locale";

// Built where no request exists (the webhook, the reminder job), so each
// email takes the patient's language instead of reading it.

/** "Tuesday 1 December at 10:00", always in Brussels time (one time zone). */
export function formatSessionTime(
  startsAt: Date,
  locale: Locale = "en",
): string {
  const day = dateFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return fill(dictionaries[locale].emails.sessionTime, {
    day: day.format(startsAt),
    time: timeFormat(locale).format(startsAt),
  });
}

type Session = {
  serviceName: string;
  physioName: string | null;
  clinicName: string;
  clinicAddress: string;
  startsAt: Date;
  link: string;
  locale?: Locale;
};

/** "Follow-up session with Inès on Tuesday 1 December at 10:00". */
function describe(input: Session, locale: Locale): string {
  const t = dictionaries[locale].emails;
  return fill(t.session, {
    service: input.serviceName,
    physio: input.physioName ?? t.yourPhysio,
    when: formatSessionTime(input.startsAt, locale),
  });
}

/** What every booking email ends with: the link, the clinic and the language. */
function frame(input: Session, locale: Locale) {
  const t = dictionaries[locale].emails;
  return {
    action: { label: t.viewBooking, url: input.link },
    footer: fill(t.footer, {
      clinic: input.clinicName,
      address: input.clinicAddress,
    }),
    locale,
  };
}

/** The email a patient gets once their session is paid (checklist #14). */
export function confirmationEmail(
  input: Session & { priceCents: number },
): EmailContent {
  const locale = input.locale ?? "en";
  const t = dictionaries[locale].emails;
  return {
    heading: fill(t.confirmation.heading, { clinic: input.clinicName }),
    paragraphs: [
      `${describe(input, locale)}.`,
      fill(t.address, { address: input.clinicAddress }),
      fill(t.confirmation.paid, {
        price: formatEuros(input.priceCents, locale),
      }),
    ],
    ...frame(input, locale),
  };
}

/**
 * The email a patient gets once a cancelled session is refunded (checklist
 * #14), whether they cancelled it (#12) or the clinic did (#13).
 */
export function cancellationEmail(
  input: Session & { priceCents: number; byClinic: boolean },
): EmailContent {
  const locale = input.locale ?? "en";
  const t = dictionaries[locale].emails;
  const session = describe(input, locale);
  return {
    heading: fill(t.cancellation.heading, { clinic: input.clinicName }),
    paragraphs: [
      input.byClinic
        ? fill(t.cancellation.byClinic, { clinic: input.clinicName, session })
        : fill(t.cancellation.byPatient, { session }),
      fill(t.cancellation.refund, {
        price: formatEuros(input.priceCents, locale),
      }),
    ],
    ...frame(input, locale),
  };
}

/** The email a patient gets the day before their session (checklist #15). */
export function reminderEmail(input: Session): EmailContent {
  const locale = input.locale ?? "en";
  const t = dictionaries[locale].emails;
  return {
    heading: fill(t.reminder.heading, { clinic: input.clinicName }),
    paragraphs: [
      `${describe(input, locale)}.`,
      fill(t.address, { address: input.clinicAddress }),
      t.reminder.tooLate,
    ],
    ...frame(input, locale),
  };
}
