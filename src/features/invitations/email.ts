import type { EmailContent } from "@/features/email/layout";
import { dictionaries } from "@/i18n/dictionaries";
import { fill, type Locale } from "@/i18n/locale";

/** The invitation a new physio gets, in the inviting owner's language. */
export function invitationEmail(input: {
  physioName: string;
  clinicName: string;
  clinicAddress: string;
  email: string;
  link: string;
  locale?: Locale;
}): EmailContent {
  const locale = input.locale ?? "en";
  const t = dictionaries[locale].emails;
  const clinic = input.clinicName;
  return {
    heading: fill(t.invitation.heading, { clinic }),
    paragraphs: [
      fill(t.invitation.hello, { name: input.physioName }),
      fill(t.invitation.invites, { clinic }),
      fill(t.invitation.account, { email: input.email }),
    ],
    action: { label: t.invitation.accept, url: input.link },
    footer: fill(t.footer, { clinic, address: input.clinicAddress }),
    locale,
  };
}
