"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { fill } from "@/i18n/locale";
import { type RemindersState, sendDemoReminders } from "../actions";

type Strings = {
  send: string;
  sending: string;
  noneNew: string;
  addedOne: string;
  addedMany: string;
};

function result(state: RemindersState, t: Strings): string | null {
  if (state.error) return state.error;
  if (state.queued === undefined) return null;
  if (state.queued === 0) return t.noneNew;
  return state.queued === 1
    ? t.addedOne
    : fill(t.addedMany, { count: state.queued });
}

/** Runs the day-before reminder job now, for this demo clinic (checklist #21). */
export function RemindersButton({ t }: { t: Strings }) {
  const [state, action, pending] = useActionState<RemindersState>(
    sendDemoReminders,
    {},
  );
  const message = result(state, t);
  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <Button type="submit" disabled={pending}>
        {pending ? t.sending : t.send}
      </Button>
      <p aria-live="polite" className="text-muted-foreground text-sm">
        {message}
      </p>
    </form>
  );
}
