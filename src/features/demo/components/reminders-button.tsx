"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { type RemindersState, sendDemoReminders } from "../actions";

function result(state: RemindersState): string | null {
  if (state.error) return state.error;
  if (state.queued === undefined) return null;
  if (state.queued === 0) {
    return "No new reminder: each confirmed session tomorrow gets one, once.";
  }
  return state.queued === 1
    ? "1 reminder added below."
    : `${state.queued} reminders added below.`;
}

/** Runs the day-before reminder job now, for this demo clinic (checklist #21). */
export function RemindersButton() {
  const [state, action, pending] = useActionState<RemindersState>(
    sendDemoReminders,
    {},
  );
  const message = result(state);
  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <Button type="submit" disabled={pending}>
        {pending ? "Sending reminders…" : "Send tomorrow's reminders now"}
      </Button>
      <p aria-live="polite" className="text-muted-foreground text-sm">
        {message}
      </p>
    </form>
  );
}
