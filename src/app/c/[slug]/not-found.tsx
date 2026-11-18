import type { Metadata } from "next";
import Link from "next/link";
import { StatusPage } from "@/components/status-page";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Clinic not found · Kinora" };

// A booking page whose clinic does not exist: a mistyped link, or a demo
// clinic deleted after its 24 hours (checklist #19).
export default function ClinicNotFound() {
  return (
    <StatusPage
      label="Clinic not found"
      title="No clinic books at this address"
      actions={
        <Link href="/" className={buttonVariants({ size: "lg" })}>
          Go to the home page
        </Link>
      }
    >
      <p>
        Check the link your clinic gave you: one letter is enough to change it.
        If you were trying the demo, its clinic is deleted after 24 hours, and
        you can start a new one from the bar above.
      </p>
    </StatusPage>
  );
}
