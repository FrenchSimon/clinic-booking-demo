import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary } from "@/i18n/server";
import { hasServices } from "../queries";

/** Owners only: shown on Today until the clinic has its first service. */
export async function FirstServiceHint({
  userId,
  clinicId,
}: {
  userId: string;
  clinicId: string;
}) {
  if (await hasServices(userId, clinicId)) return null;
  const { t } = await getDictionary();
  return (
    <section
      aria-labelledby="first-service-title"
      className="flex flex-col gap-3 rounded-[18px] border bg-accent p-5 sm:p-8"
    >
      <h2
        id="first-service-title"
        className="font-heading font-semibold text-xl"
      >
        {t.team.services.firstTitle}
      </h2>
      <p>{t.team.services.firstText}</p>
      <Link
        href="/clinic/services/new"
        className={buttonVariants({ className: "self-start" })}
      >
        {t.team.services.add}
      </Link>
    </section>
  );
}
