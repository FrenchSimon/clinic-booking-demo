import Link from "next/link";
import { LegalSection } from "./legal-page";

const SOURCE_CODE = "https://github.com/FrenchSimon/clinic-booking-demo";

// Each service below receives only what it needs to do its job.
const PROCESSORS = [
  ["Supabase", "accounts, passwords (hashed) and the app's database"],
  ["Vercel", "hosting the app"],
  ["Stripe", "test payments and refunds; Kinora never sees card numbers"],
  ["Resend", "emails from clinics outside the demo"],
  ["Groq", "the questions asked to the booking page assistant"],
] as const;

/** The privacy notice of the Kinora demo: what is stored, why and for how long. */
export function Privacy() {
  return (
    <>
      <LegalSection title="In short">
        <p>
          Kinora is a portfolio demo with fictional clinics. It stores only what
          the app needs to work, uses no advertising or analytics cookies, and
          sells nothing to anyone. Please use fictional details and never enter
          health information.
        </p>
      </LegalSection>

      <LegalSection title="What is stored">
        <ul>
          <li>
            Your account: email address and password, hashed so it cannot be
            read back. A demo started with "Try the demo" asks for no email
            address: it uses made-up ones that never receive mail.
          </li>
          <li>
            What you enter: clinic details, services, opening hours, bookings,
            cancellations and the names of physios and patients.
          </li>
          <li>
            The emails the app writes about bookings, kept in the clinic's
            Outbox.
          </li>
          <li>
            For the assistant's daily limit: a one-way hash of your IP address
            and the date, never the address itself.
          </li>
        </ul>
        <p>
          Your questions to the assistant are sent to Groq to write an answer.
          Kinora does not keep the conversation.
        </p>
      </LegalSection>

      <LegalSection title="Why">
        <p>
          To run the service you asked for: log you in, take and cancel
          bookings, send their emails, and protect the app from abuse. Nothing
          is used for advertising or profiling.
        </p>
      </LegalSection>

      <LegalSection title="Who processes it">
        <ul>
          {PROCESSORS.map(([name, role]) => (
            <li key={name}>
              <strong>{name}</strong>: {role}
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="How long">
        <ul>
          <li>
            A demo is deleted, with everything in it, 24 hours after it starts.
          </li>
          <li>The assistant's daily counts are deleted the next day.</li>
          <li>
            An account created with an email address is kept until you ask for
            its deletion.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Kinora sets only the cookies that keep you logged in. They are needed
          for the app to work, so there is no cookie banner.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          You can ask to see, correct or delete your data, or object to its use,
          by opening an issue on the{" "}
          <a href={SOURCE_CODE} target="_blank" rel="noopener noreferrer">
            Kinora repository
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          . Do not write personal details in the issue: it is public, and the
          developer will reply with a private way to continue. You can also
          complain to your data protection authority.
        </p>
        <p>
          See also the <Link href="/terms">terms of use</Link>.
        </p>
      </LegalSection>
    </>
  );
}
