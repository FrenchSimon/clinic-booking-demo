import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/components/logout-button";
import type { Dictionary } from "@/i18n/dictionaries";
import { getDictionary } from "@/i18n/server";
import { getUser } from "@/server/auth";

// Kinora home, from the approved mockup (DESIGN.md, screen 1). The links for
// people evaluating the demo live in the portfolio bar, not in the product.
export default async function Home() {
  const { t } = await getDictionary();
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-8 sm:py-5">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center font-heading font-semibold text-2xl text-primary"
          >
            Kinora
          </Link>
          <nav
            aria-label={t.home.nav}
            className="flex items-center gap-2 sm:gap-6"
          >
            <Suspense fallback={null}>
              <AccountLinks t={t.home} />
            </Suspense>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-8 sm:py-20">
          <p className="font-semibold text-oak text-sm uppercase tracking-[0.08em]">
            {t.home.eyebrow}
          </p>
          <h1 className="max-w-3xl font-heading font-normal text-4xl leading-[1.05] sm:text-6xl">
            {t.home.title}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed sm:text-xl">
            {t.home.intro}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              {t.home.cta}
            </Link>
          </div>
        </section>

        <section aria-label={t.home.featuresLabel} className="mt-auto border-t">
          <ul className="mx-auto grid w-full max-w-5xl grid-cols-1 sm:grid-cols-3">
            {t.home.features.map((feature) => (
              <li
                key={feature.title}
                className="flex flex-col gap-2 border-b px-4 py-6 last:border-b-0 sm:border-r sm:border-b-0 sm:px-8 sm:py-8 sm:last:border-r-0"
              >
                <span
                  aria-hidden="true"
                  className="h-1 w-8 rounded-full bg-oak-decor"
                />
                <h2 className="font-heading font-semibold text-xl">
                  {feature.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.text}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

async function AccountLinks({ t }: { t: Dictionary["home"] }) {
  const user = await getUser();

  if (!user) {
    return (
      <Link href="/login" className={buttonVariants()}>
        {t.logIn}
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link href="/bookings" className={buttonVariants({ variant: "ghost" })}>
        {t.myBookings}
      </Link>
      <Link href="/clinic" className={buttonVariants()}>
        {t.myClinic}
      </Link>
      {/* On a phone, log out from your bookings or the clinic space. */}
      <div className="hidden sm:block">
        <LogoutButton />
      </div>
    </div>
  );
}
