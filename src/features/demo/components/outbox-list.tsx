import type { Dictionary } from "@/i18n/dictionaries";
import { dateFormat } from "@/i18n/format";
import { fill, type Locale } from "@/i18n/locale";
import type { OutboxEmail } from "../queries";

/** The emails of the demo Outbox, each one opened in place to read it. */
export function OutboxList({
  emails,
  locale,
  t,
}: {
  emails: OutboxEmail[];
  locale: Locale;
  t: Dictionary["demo"]["outbox"];
}) {
  if (emails.length === 0) {
    return (
      <p className="rounded-[18px] border bg-card p-5 text-muted-foreground sm:p-8">
        {t.empty}
      </p>
    );
  }
  const sentAt = dateFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return (
    <ul aria-label={t.list} className="flex flex-col gap-3">
      {emails.map((email) => (
        <li key={email.id} className="rounded-[14px] border bg-card">
          <details className="group">
            <summary className="flex min-h-11 cursor-pointer list-none flex-col gap-1 px-4 py-3.5 sm:px-5">
              <span className="flex flex-wrap items-baseline justify-between gap-x-3 text-muted-foreground text-sm">
                <span className="font-semibold text-foreground">
                  {t.kinds[email.kind]}
                </span>
                <time dateTime={email.createdAt.toISOString()}>
                  {sentAt.format(email.createdAt)}
                </time>
              </span>
              <span className="font-semibold">{email.subject}</span>
              <span className="break-all text-muted-foreground text-sm">
                {fill(t.to, { email: email.to })}
              </span>
              <span className="text-primary text-sm underline underline-offset-4 group-open:hidden">
                {t.read}
              </span>
            </summary>
            <p className="whitespace-pre-line break-words border-divider border-t px-4 py-3.5 text-sm sm:px-5">
              {email.text}
            </p>
          </details>
        </li>
      ))}
    </ul>
  );
}
