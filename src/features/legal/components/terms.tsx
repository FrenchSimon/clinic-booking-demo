import Link from "next/link";
import { LegalSection } from "./legal-page";

const SOURCE_CODE = "https://github.com/FrenchSimon/clinic-booking-demo";

/** The terms of use of the Kinora demo. */
export function Terms() {
  return (
    <>
      <LegalSection title="What Kinora is">
        <p>
          Kinora is a portfolio demo of an online booking app for physiotherapy
          clinics. Maison Tilleul and every clinic, physio and patient in the
          demo are fictional. Kinora is not a real clinic and provides no
          healthcare: a booking made here is never a real appointment.
        </p>
        <p>
          By creating an account or using the demo, you accept these terms and
          the <Link href="/privacy">privacy notice</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Payments are in test mode">
        <p>
          Payments go through Stripe in test mode. No real money is taken or
          refunded. Pay only with the test card 4242 4242 4242 4242, never with
          a real card.
        </p>
      </LegalSection>

      <LegalSection title="No medical advice">
        <p>
          Nothing on Kinora is medical advice, including the answers of the
          assistant on the booking page. The assistant answers from the clinic's
          information only and can be wrong. If you are in pain or worried about
          your health, see a doctor or a physiotherapist.
        </p>
      </LegalSection>

      <LegalSection title="Using Kinora fairly">
        <ul>
          <li>
            Use fictional names and details. Never enter health information.
          </li>
          <li>
            Do not try to reach other people's data, overload the service or get
            around its limits.
          </li>
          <li>
            Do not use Kinora to send emails to people who did not ask for them.
          </li>
        </ul>
        <p>Accounts that break these rules can be deleted without notice.</p>
      </LegalSection>

      <LegalSection title="Your account and your data">
        <p>
          A demo started with "Try the demo" is deleted, with everything in it,
          24 hours after it starts. An account created with an email address
          stays until you ask for its deletion. The{" "}
          <Link href="/privacy">privacy notice</Link> explains what is stored
          and why.
        </p>
      </LegalSection>

      <LegalSection title="No guarantee">
        <p>
          Kinora is provided as is, for free, to show how the app is built. It
          can change, stop or lose data at any time. To the extent the law
          allows, its developer is not liable for any loss caused by using it.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For a question about these terms, open an issue on the{" "}
          <a href={SOURCE_CODE} target="_blank" rel="noopener noreferrer">
            Kinora repository
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          .
        </p>
      </LegalSection>
    </>
  );
}
