import type { Metadata } from "next";
import Link from "next/link";
import { StatusPage } from "@/components/status-page";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.status.notFound.label}${t.meta.suffix}` };
}

// Any address that matches no page, and every notFound() without a closer
// not-found file: an unknown booking, service or invitation.
export default async function NotFound() {
  const { t } = await getDictionary();
  const s = t.status;
  return (
    <StatusPage
      label={s.notFound.label}
      title={s.notFound.title}
      actions={
        <>
          <Link href="/" className={buttonVariants({ size: "lg" })}>
            {s.home}
          </Link>
          <Link
            href="/bookings"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            {s.notFound.bookings}
          </Link>
        </>
      }
    >
      <p>{s.notFound.text}</p>
    </StatusPage>
  );
}
