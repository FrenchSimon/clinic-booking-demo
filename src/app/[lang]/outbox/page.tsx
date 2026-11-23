import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ClinicShell } from "@/features/clinics/components/clinic-shell";
import { OutboxList } from "@/features/demo/components/outbox-list";
import { RemindersButton } from "@/features/demo/components/reminders-button";
import { getDemoClinic, getOutbox } from "@/features/demo/queries";
import { getDictionary } from "@/i18n/server";
import { requireUser } from "@/server/auth";

// The demo clinic's Outbox (checklist #21): no email leaves a demo clinic,
// they are all shown here instead. Its visitor sees it in every role.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.demo.outbox.title + t.meta.suffix };
}

export default function OutboxPage() {
  return (
    <Suspense fallback={null}>
      <Outbox />
    </Suspense>
  );
}

async function Outbox() {
  const user = await requireUser();
  const clinic = user.is_anonymous ? await getDemoClinic(user.id) : null;
  if (!clinic) notFound();
  const emails = await getOutbox(user.id, clinic.id);
  const { locale, t } = await getDictionary();
  const o = t.demo.outbox;

  return (
    <ClinicShell clinic={clinic}>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading font-normal text-3xl sm:text-4xl">
          {o.title}
        </h1>
        <p className="text-muted-foreground">{o.intro}</p>
      </div>
      <section
        aria-labelledby="reminders-title"
        className="flex flex-col gap-3 rounded-[18px] border bg-card p-5 sm:p-8"
      >
        <h2 id="reminders-title" className="font-heading font-semibold text-xl">
          {o.remindersTitle}
        </h2>
        <p className="text-muted-foreground">{o.remindersIntro}</p>
        <RemindersButton
          t={{
            send: o.send,
            sending: o.sending,
            noneNew: o.noneNew,
            addedOne: o.addedOne,
            addedMany: o.addedMany,
          }}
        />
      </section>
      <OutboxList emails={emails} locale={locale} t={o} />
    </ClinicShell>
  );
}
