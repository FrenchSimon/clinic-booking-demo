import type { Metadata } from "next";
import { LegalPage } from "@/features/legal/components/legal-page";
import { Terms } from "@/features/legal/components/terms";

export const metadata: Metadata = { title: "Terms of use · Kinora" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use">
      <Terms />
    </LegalPage>
  );
}
