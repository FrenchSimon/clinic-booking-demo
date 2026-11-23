import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DayOffForm } from "@/features/availability/components/day-off-form";
import { DaysOffList } from "@/features/availability/components/days-off-list";
import { WeeklyHoursForm } from "@/features/availability/components/weekly-hours-form";
import { getMySchedule } from "@/features/availability/queries";
import { brusselsToday } from "@/features/availability/schema";
import { ClinicShell } from "@/features/clinics/components/clinic-shell";
import { getStaffClinic } from "@/features/clinics/queries";
import { requireUser } from "@/server/auth";

export default function HoursPage() {
  return (
    <Suspense fallback={null}>
      <Hours />
    </Suspense>
  );
}

async function Hours() {
  const user = await requireUser();
  const mine = await getStaffClinic(user.id);
  const schedule = mine && (await getMySchedule(user.id, mine.clinic.id));
  if (!mine || !schedule) redirect("/clinic");
  const { clinic } = mine;

  return (
    <ClinicShell
      clinic={clinic}
      tabs={{ current: "hours", role: "practitioner" }}
    >
      <div className="flex flex-col gap-1">
        <h1 className="font-heading font-normal text-3xl sm:text-4xl">
          My hours
        </h1>
        <p className="text-muted-foreground">
          Patients can only book you on these hours, within the clinic's opening
          hours.
        </p>
      </div>
      <section
        aria-labelledby="week-title"
        className="flex flex-col gap-3 rounded-[18px] border bg-card p-5 sm:p-8"
      >
        <h2 id="week-title" className="font-heading font-semibold text-xl">
          Every week
        </h2>
        {!schedule.weeklyHours && (
          <p className="rounded-[14px] bg-status-pending px-4 py-3 text-status-pending-foreground">
            Not saved yet: patients cannot book you until you save your hours.
            The clinic's opening hours are filled in to start from.
          </p>
        )}
        <WeeklyHoursForm
          initial={schedule.weeklyHours ?? clinic.openingHours}
        />
      </section>
      <section
        aria-labelledby="off-title"
        className="flex flex-col gap-4 rounded-[18px] border bg-card p-5 sm:p-8"
      >
        <h2 id="off-title" className="font-heading font-semibold text-xl">
          Days off
        </h2>
        <DaysOffList days={schedule.daysOff} />
        <div className="border-t pt-4">
          <DayOffForm today={brusselsToday()} />
        </div>
      </section>
    </ClinicShell>
  );
}
