import { dateFormat } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import { getDashboard } from "../queries";
import { StatCards } from "./stat-cards";
import { TodaySessions } from "./today-sessions";

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
  const { locale } = await getDictionary();
  // A calendar day: format its noon in UTC so no time zone moves it.
  const longDay = dateFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
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
