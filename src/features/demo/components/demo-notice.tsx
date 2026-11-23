import { formatSessionTime } from "@/features/booking/email";
import { fill } from "@/i18n/locale";
import { getDictionary } from "@/i18n/server";

/**
 * Tells a demo visitor the clinic is theirs alone and when it goes away
 * (checklist #19). The clean-up job deletes it with their anonymous account,
 * 24 hours after the account was created (cleanup.ts).
 */
export async function DemoNotice({ startedAt }: { startedAt: string }) {
  const { locale, t } = await getDictionary();
  const deletedAt = new Date(new Date(startedAt).getTime() + 24 * 3_600_000);
  return (
    <p className="rounded-[18px] border border-dashed p-5 text-muted-foreground text-sm sm:p-8">
      {fill(t.demo.notice, { when: formatSessionTime(deletedAt, locale) })}
    </p>
  );
}
