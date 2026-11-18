import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ProposedSlot } from "../next-slot";

export type Message = {
  role: "user" | "assistant";
  content: string;
  slot?: ProposedSlot | null;
  /** The fallback text: shown, but never sent back to the model. */
  fallback?: boolean;
};

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** The conversation, newest at the bottom. */
export function AssistantThread({
  messages,
  pending,
  onPickSlot,
}: {
  messages: Message[];
  pending: boolean;
  onPickSlot: () => void;
}) {
  return (
    <div aria-live="polite" className="flex flex-col gap-2.5">
      <p className="mb-1 rounded-xl bg-surface px-3 py-2.5 text-muted-foreground text-sm">
        I answer from the clinic's own information only. I can't give medical
        advice, and I can't see anyone's bookings.
      </p>
      {messages.map((m, i) =>
        m.role === "user" ? (
          <p
            // The thread only grows: an index is a stable key here.
            // biome-ignore lint/suspicious/noArrayIndexKey: append-only list
            key={i}
            className="max-w-[80%] self-end whitespace-pre-wrap break-words rounded-[18px_18px_4px_18px] bg-primary px-3.5 py-2.5 text-primary-foreground"
          >
            {m.content}
          </p>
        ) : (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: append-only list
            key={i}
            className="flex max-w-[86%] flex-col gap-2.5 self-start rounded-[18px_18px_18px_4px] border bg-card px-3.5 py-2.5"
          >
            <p className="whitespace-pre-wrap break-words">{m.content}</p>
            {m.slot && <SlotCard slot={m.slot} onPick={onPickSlot} />}
          </div>
        ),
      )}
      {pending && (
        <p className="self-start rounded-[18px_18px_18px_4px] border bg-card px-3.5 py-2.5 text-muted-foreground">
          Looking it up…
        </p>
      )}
    </div>
  );
}

/** A slot from the app's own calculation, opening the prefilled booking form. */
function SlotCard({
  slot,
  onPick,
}: {
  slot: ProposedSlot;
  onPick: () => void;
}) {
  const day = dayFormat.format(new Date(`${slot.day}T12:00:00Z`));
  const physio = slot.physio.split(" ")[0];
  return (
    <Link
      href={slot.href}
      scroll={false}
      onClick={onPick}
      className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-secondary px-3.5 py-2 text-secondary-foreground"
    >
      <span>
        <strong className="block">
          {day} · {slot.time} · {physio}
        </strong>
        <span className="text-muted-foreground text-sm">
          {slot.service} · Book and pay on the booking page
        </span>
      </span>
      <ChevronRight aria-hidden className="size-5 shrink-0 text-primary" />
    </Link>
  );
}
