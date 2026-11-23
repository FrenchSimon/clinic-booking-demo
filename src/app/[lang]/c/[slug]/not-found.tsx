import type { Metadata } from "next";
import Link from "next/link";
import { StatusPage } from "@/components/status-page";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.status.clinicNotFound.label}${t.meta.suffix}` };
}

// A booking page whose clinic does not exist: a mistyped link, or a demo
// clinic deleted after its 24 hours (checklist #19).
export default async function ClinicNotFound() {
  const { t } = await getDictionary();
  const s = t.status;
  return (
    <StatusPage
      label={s.clinicNotFound.label}
      title={s.clinicNotFound.title}
      actions={
        <Link href="/" className={buttonVariants({ size: "lg" })}>
          {s.home}
        </Link>
      }
    >
      <p>{s.clinicNotFound.text}</p>
    </StatusPage>
  );
}
