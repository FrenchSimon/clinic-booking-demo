import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { getUser } from "@/server/auth";

// Written for the clinic owner: what Kinora changes in their day.
// The technical guarantees behind them belong in the README.
const FEATURES = [
  {
    title: "Fewer no-shows",
    text: "Patients pay when they book, so they come. No more chasing payments at the desk.",
  },
  {
    title: "Cancellations sort themselves out",
    text: "A patient who cancels the day before gets their money back, and the slot opens up for someone else.",
  },
  {
    title: "A reminder the day before",
    text: "Every patient gets an email the evening before their session. You don't have to call anyone.",
  },
];

// Kinora home, from the approved mockup (DESIGN.md, screen 1). The links for
// people evaluating the demo live in the portfolio bar, not in the product.
export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-8 sm:py-5">
          <Link
            href="/"
            className="font-heading font-semibold text-2xl text-primary"
          >
            Kinora
          </Link>
          <nav aria-label="Main" className="flex items-center gap-2 sm:gap-6">
            <Suspense fallback={null}>
              <AccountLinks />
            </Suspense>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-8 sm:py-20">
          <p className="font-semibold text-oak text-sm uppercase tracking-[0.08em]">
            For small physiotherapy clinics
          </p>
          <h1 className="max-w-3xl font-heading font-normal text-4xl leading-[1.05] sm:text-6xl">
            Patients book and pay online. You get your evenings back.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed sm:text-xl">
            Services, physios and free slots on one page. Cancellations refund
            themselves, reminders go out the day before.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Create a clinic account
            </Link>
          </div>
        </section>

        <section aria-label="What Kinora does" className="mt-auto border-t">
          <ul className="mx-auto grid w-full max-w-5xl grid-cols-1 sm:grid-cols-3">
            {FEATURES.map((feature) => (
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

async function AccountLinks() {
  const user = await getUser();

  if (!user) {
    return (
      <Link href="/login" className={buttonVariants()}>
        Log in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/clinic" className={buttonVariants()}>
        My clinic
      </Link>
      <LogoutButton />
    </div>
  );
}
