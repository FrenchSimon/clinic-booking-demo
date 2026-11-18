import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Assistant } from "@/features/assistant/components/assistant";
import { brusselsToday } from "@/features/availability/schema";
import { PhysioStep } from "@/features/booking/components/physio-step";
import { ServiceStep } from "@/features/booking/components/service-step";
import { SlotStep } from "@/features/booking/components/slot-step";
import { SummaryBar } from "@/features/booking/components/summary-bar";
import { getAvailability, getBookingPage } from "@/features/booking/public";
import { BOOKING_DAYS, readSelection } from "@/features/booking/selection";
import { freeSlots } from "@/features/booking/slots";
import { addDays, brusselsInstant } from "@/features/booking/time";
import { SLUG_PATTERN } from "@/features/clinics/schema";

// What the booking action sends back in ?error= (features/booking/actions.ts).
const BOOKING_ERRORS: Record<string, string> = {
  taken: "Someone just took this time. Pick another one.",
  unavailable: "This session can no longer be booked online. Pick another one.",
  payment: "Online payment is not available right now. Try again later.",
  busy: "Too many attempts. Wait a minute and try again.",
};

// The clinic's public booking page (checklist #8). Every choice is a link
// that changes the address, so the page works without client JavaScript.
export default function ClinicBookingPage({
  params,
  searchParams,
}: PageProps<"/c/[slug]">) {
  return (
    <Suspense fallback={null}>
      {Promise.all([params, searchParams]).then(([{ slug }, raw]) => (
        <Booking slug={slug} raw={raw} />
      ))}
    </Suspense>
  );
}

async function Booking({
  slug,
  raw,
}: {
  slug: string;
  raw: Record<string, string | string[] | undefined>;
}) {
  if (!SLUG_PATTERN.test(slug)) notFound();
  const page = await getBookingPage(slug);
  if (!page) notFound();

  const today = brusselsToday();
  const { schedules, busy } = await getAvailability(
    page.id,
    brusselsInstant(today, "00:00"),
    brusselsInstant(addDays(today, BOOKING_DAYS), "00:00"),
  );
  const now = new Date();
  const selection = readSelection(raw, page.services, (service) =>
    freeSlots({
      from: today,
      days: BOOKING_DAYS,
      durationMinutes: service.durationMinutes,
      clinicHours: page.openingHours,
      physios: schedules.filter((s) =>
        service.physioIds.includes(s.membershipId),
      ),
      busy,
      now,
    }),
  );
  const physios = page.physios.filter((p) =>
    selection.service?.physioIds.includes(p.id),
  );
  const physioName =
    physios.find((p) => p.id === selection.physio)?.name ?? "Any physio";

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-1 px-4 py-5">
          <h1 className="font-heading font-semibold text-3xl text-primary">
            {page.name}
          </h1>
          <p className="text-muted-foreground text-sm">{page.address}</p>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 pt-5 pb-76">
        {selection.service ? (
          <>
            <ServiceStep
              slug={slug}
              services={page.services}
              selection={selection}
            />
            <PhysioStep slug={slug} physios={physios} selection={selection} />
            <SlotStep
              slug={slug}
              selection={selection}
              times={selection.times}
              today={today}
              days={BOOKING_DAYS}
            />
          </>
        ) : (
          <p className="rounded-[14px] border bg-card p-5">
            Online booking is not open yet at {page.name}. Please come back
            soon.
          </p>
        )}
      </main>
      <SummaryBar
        slug={slug}
        selection={selection}
        physioName={physioName}
        error={BOOKING_ERRORS[String(raw.error)]}
        floating={<Assistant slug={slug} clinic={page.name} />}
      />
    </div>
  );
}
