import type { Metadata } from "next";
import { LegalPage } from "@/features/legal/components/legal-page";
import { LegalText } from "@/features/legal/components/legal-text";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.legal.terms.title}${t.meta.suffix}` };
}

export default async function TermsPage() {
  const { t } = await getDictionary();
  return (
    <LegalPage title={t.legal.terms.title} updated={t.legal.updated}>
      <LegalText sections={t.legal.terms.sections} newTab={t.legal.newTab} />
    </LegalPage>
  );
}
