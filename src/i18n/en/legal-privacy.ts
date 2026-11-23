import type { LegalSection } from "./legal-types";

/** The privacy notice of the Kinora demo: what is stored, why and for how long. */
export const privacySections: LegalSection[] = [
  {
    title: "In short",
    blocks: [
      {
        p: [
          "Kinora is a portfolio demo with fictional clinics. It stores only what the app needs to work, uses no advertising or analytics cookies, and sells nothing to anyone. Please use fictional details and never enter health information.",
        ],
      },
    ],
  },
  {
    title: "What is stored",
    blocks: [
      {
        ul: [
          [
            'Your account: email address and password, hashed so it cannot be read back. A demo started with "Try the demo" asks for no email address: it uses made-up ones that never receive mail.',
          ],
          [
            "What you enter: clinic details, services, opening hours, bookings, cancellations and the names of physios and patients.",
          ],
          [
            "The emails the app writes about bookings, kept in the clinic's Outbox.",
          ],
          [
            "For the assistant's daily limit: a one-way hash of your IP address and the date, never the address itself.",
          ],
        ],
      },
      {
        p: [
          "Your questions to the assistant are sent to Groq to write an answer. Kinora does not keep the conversation.",
        ],
      },
    ],
  },
  {
    title: "Why",
    blocks: [
      {
        p: [
          "To run the service you asked for: log you in, take and cancel bookings, send their emails, and protect the app from abuse. Nothing is used for advertising or profiling.",
        ],
      },
    ],
  },
  {
    title: "Who processes it",
    // Each service receives only what it needs to do its job.
    blocks: [
      {
        ul: [
          [
            { strong: "Supabase" },
            ": accounts, passwords (hashed) and the app's database",
          ],
          [{ strong: "Vercel" }, ": hosting the app"],
          [
            { strong: "Stripe" },
            ": test payments and refunds; Kinora never sees card numbers",
          ],
          [{ strong: "Resend" }, ": emails from clinics outside the demo"],
          [
            { strong: "Groq" },
            ": the questions asked to the booking page assistant",
          ],
        ],
      },
    ],
  },
  {
    title: "How long",
    blocks: [
      {
        ul: [
          [
            "A demo is deleted, with everything in it, 24 hours after it starts.",
          ],
          ["The assistant's daily counts are deleted the next day."],
          [
            "An account created with an email address is kept until you ask for its deletion.",
          ],
        ],
      },
    ],
  },
  {
    title: "Cookies",
    blocks: [
      {
        p: [
          "Kinora sets only the cookies that keep you logged in and remember the language you chose. They are needed for the app to work, so there is no cookie banner.",
        ],
      },
    ],
  },
  {
    title: "Your rights",
    blocks: [
      {
        p: [
          "You can ask to see, correct or delete your data, or object to its use, by opening an issue on the ",
          { link: "code", text: "Kinora repository" },
          ". Do not write personal details in the issue: it is public, and the developer will reply with a private way to continue. You can also complain to your data protection authority.",
        ],
      },
      {
        p: ["See also the ", { link: "terms", text: "terms of use" }, "."],
      },
    ],
  },
];
