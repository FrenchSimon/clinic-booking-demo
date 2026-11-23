import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/locale";
import { getUser } from "@/server/auth";
import { countOutbox, getDemoClinic } from "../queries";
import { RoleMenu } from "./role-menu";
import { TryDemoButton } from "./try-demo-button";

/**
 * The demo part of the portfolio bar: inside their demo clinic, the
 * visitor's role menu (#20) then the Outbox with its email count (#21);
 * "Try the demo" for everyone else (#19).
 */
export async function DemoControls({ t }: { t: Dictionary["bar"] }) {
  const user = await getUser();
  const clinic = user?.is_anonymous ? await getDemoClinic(user.id) : null;
  if (!user || !clinic) {
    return <TryDemoButton label={t.tryDemo} pendingLabel={t.preparing} />;
  }
  const emails = await countOutbox(user.id, clinic.id);
  return (
    <>
      <RoleMenu
        current={clinic.role}
        t={{ viewAs: t.viewAs, switching: t.switching, roles: t.roles }}
      />
      <Link
        href="/outbox"
        aria-label={
          emails > 0 ? fill(t.outboxCount, { count: emails }) : undefined
        }
        className="inline-flex min-h-11 items-center gap-1 font-semibold sm:gap-1.5 text-demo-foreground underline underline-offset-4"
      >
        {t.outbox}
        {emails > 0 && (
          <span
            aria-hidden="true"
            className="rounded-full bg-demo-foreground px-1.5 font-bold text-[11px] text-demo leading-4 no-underline"
          >
            {emails}
          </span>
        )}
      </Link>
    </>
  );
}
