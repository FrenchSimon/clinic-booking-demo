import type { Metadata } from "next";
import { LegalPage } from "@/features/legal/components/legal-page";
import { Privacy } from "@/features/legal/components/privacy";

export const metadata: Metadata = { title: "Privacy · Kinora" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy">
      <Privacy />
    </LegalPage>
  );
}
