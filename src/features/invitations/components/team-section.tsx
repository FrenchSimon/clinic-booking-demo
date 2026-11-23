import { dateFormat } from "@/i18n/format";
import { fill } from "@/i18n/locale";
import { getDictionary } from "@/i18n/server";
import { getTeam } from "../queries";
import { InviteForm } from "./invite-form";

/** Owners only: the clinic's physios, open invitations and the invite form. */
export async function TeamSection({
  userId,
  clinicId,
}: {
  userId: string;
  clinicId: string;
}) {
  const team = await getTeam(userId, clinicId);
  const empty = team.physios.length === 0 && team.pending.length === 0;
  const { locale, t } = await getDictionary();
  const p = t.team.physios;
  const until = dateFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <section
      aria-labelledby="team-title"
      className="flex flex-col gap-5 rounded-[18px] border bg-card p-5 sm:p-8"
    >
      <h2 id="team-title" className="font-heading font-semibold text-xl">
        {p.title}
      </h2>
      {empty ? (
        <p className="text-muted-foreground">{p.empty}</p>
      ) : (
        <ul className="flex flex-col">
          {team.physios.map((physio) => (
            <li
              key={physio.id}
              className="flex items-center justify-between gap-4 border-divider border-b py-3 last:border-b-0"
            >
              <span>{physio.name}</span>
              <span className="rounded-full bg-status-confirmed px-3 py-1 font-semibold text-status-confirmed-foreground text-xs">
                {p.active}
              </span>
            </li>
          ))}
          {team.pending.map((i) => (
            <li
              key={i.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-divider border-b py-3 last:border-b-0"
            >
              <span className="min-w-0">
                {i.name}{" "}
                <span className="break-all text-muted-foreground text-sm">
                  {i.email}
                </span>
              </span>
              <span className="rounded-full bg-status-pending px-3 py-1 font-semibold text-status-pending-foreground text-xs">
                {fill(p.invitedUntil, { date: until.format(i.expiresAt) })}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t pt-5">
        <h3 className="mb-3 font-semibold">{p.invite}</h3>
        <InviteForm
          t={{ name: p.name, email: p.email, sending: p.sending, send: p.send }}
        />
      </div>
    </section>
  );
}
