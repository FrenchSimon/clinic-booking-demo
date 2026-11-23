import type { LegalSection } from "./legal-types";

/** The terms of use of the Kinora demo. */
export const termsSections: LegalSection[] = [
  {
    title: "What Kinora is",
    blocks: [
      {
        p: [
          "Kinora is a portfolio demo of an online booking app for physiotherapy clinics. Maison Tilleul and every clinic, physio and patient in the demo are fictional. Kinora is not a real clinic and provides no healthcare: a booking made here is never a real appointment.",
        ],
      },
      {
        p: [
          "By creating an account or using the demo, you accept these terms and the ",
          { link: "privacy", text: "privacy notice" },
          ".",
        ],
      },
    ],
  },
  {
    title: "Payments are in test mode",
    blocks: [
      {
        p: [
          "Payments go through Stripe in test mode. No real money is taken or refunded. Pay only with the test card 4242 4242 4242 4242, never with a real card.",
        ],
      },
    ],
  },
  {
    title: "No medical advice",
    blocks: [
      {
        p: [
          "Nothing on Kinora is medical advice, including the answers of the assistant on the booking page. The assistant answers from the clinic's information only and can be wrong. If you are in pain or worried about your health, see a doctor or a physiotherapist.",
        ],
      },
    ],
  },
  {
    title: "Using Kinora fairly",
    blocks: [
      {
        ul: [
          ["Use fictional names and details. Never enter health information."],
          [
            "Do not try to reach other people's data, overload the service or get around its limits.",
          ],
          [
            "Do not use Kinora to send emails to people who did not ask for them.",
          ],
        ],
      },
      { p: ["Accounts that break these rules can be deleted without notice."] },
    ],
  },
  {
    title: "Your account and your data",
    blocks: [
      {
        p: [
          'A demo started with "Try the demo" is deleted, with everything in it, 24 hours after it starts. An account created with an email address stays until you ask for its deletion. The ',
          { link: "privacy", text: "privacy notice" },
          " explains what is stored and why.",
        ],
      },
    ],
  },
  {
    title: "No guarantee",
    blocks: [
      {
        p: [
          "Kinora is provided as is, for free, to show how the app is built. It can change, stop or lose data at any time. To the extent the law allows, its developer is not liable for any loss caused by using it.",
        ],
      },
    ],
  },
  {
    title: "Contact",
    blocks: [
      {
        p: [
          "For a question about these terms, open an issue on the ",
          { link: "code", text: "Kinora repository" },
          ".",
        ],
      },
    ],
  },
];
