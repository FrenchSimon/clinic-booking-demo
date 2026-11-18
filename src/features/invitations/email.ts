import type { EmailContent } from "@/features/email/layout";

export function invitationEmail(input: {
  physioName: string;
  clinicName: string;
  clinicAddress: string;
  email: string;
  link: string;
}): EmailContent {
  return {
    heading: `Join ${input.clinicName} on Kinora`,
    paragraphs: [
      `Hello ${input.physioName},`,
      `${input.clinicName} uses Kinora for online booking and invites you to join as a physio. You will see your sessions in your own agenda.`,
      `Create your account or log in with ${input.email}. The link works for 7 days.`,
    ],
    action: { label: "Accept the invitation", url: input.link },
    footer: `${input.clinicName} · ${input.clinicAddress}`,
  };
}
