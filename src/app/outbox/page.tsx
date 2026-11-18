import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ClinicShell } from "@/features/clinics/components/clinic-shell";
import { OutboxList } from "@/features/demo/components/outbox-list";
import { RemindersButton } from "@/features/demo/components/reminders-button";
import { getDemoClinic, getOutbox } from "@/features/demo/queries";
import { requireUser } from "@/server/auth";

// The demo clinic's Outbox (checklist #21): no email leaves a demo clinic,
// they are all shown here instead. Its visitor sees it in every role.
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

  return (
    <ClinicShell clinicName={clinic.name}>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading font-normal text-3xl sm:text-4xl">
          Outbox
        </h1>
        <p className="text-muted-foreground">
          No real email leaves a demo clinic. Here is every email Kinora would
          have sent, newest first.
        </p>
      </div>
      <section
        aria-labelledby="reminders-title"
        className="flex flex-col gap-3 rounded-[18px] border bg-card p-5 sm:p-8"
      >
        <h2 id="reminders-title" className="font-heading font-semibold text-xl">
          Day-before reminders
        </h2>
        <p className="text-muted-foreground">
          A daily job reminds each patient of tomorrow's session. Run it now: a
          booking never gets two reminders, however often you click.
        </p>
        <RemindersButton />
      </section>
      <OutboxList emails={emails} />
    </ClinicShell>
  );
}
