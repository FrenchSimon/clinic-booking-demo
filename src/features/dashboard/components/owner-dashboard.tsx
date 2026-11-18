import { getDashboard } from "../queries";
import { StatCards } from "./stat-cards";
import { TodaySessions } from "./today-sessions";

const longDay = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** The owner's Today tab (checklist #16): the date, four figures, today's sessions. */
export async function OwnerDashboard({
  userId,
  clinicId,
}: {
  userId: string;
  clinicId: string;
}) {
  const { today, todaySessions, ...figures } = await getDashboard(
    userId,
    clinicId,
  );
  return (
    <>
      <h1 className="font-heading font-normal text-3xl sm:text-4xl">
        {longDay.format(new Date(`${today}T12:00:00Z`))}
      </h1>
      <StatCards today={today} {...figures} />
      <TodaySessions sessions={todaySessions} />
    </>
  );
}
