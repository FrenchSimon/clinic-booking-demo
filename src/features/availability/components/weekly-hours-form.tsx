"use client";

import { startTransition, useActionState, useState } from "react";
import { FormMessage } from "@/components/field";
import { Button } from "@/components/ui/button";
import { OpeningHoursFields } from "@/features/clinics/components/opening-hours-fields";
import type { OpeningHours } from "@/features/clinics/schema";
import { type ScheduleFormState, saveWeeklyHours } from "../actions";

// Submitted by hand: React's automatic reset after a form action would
// untick the day checkboxes without updating their state.
export function WeeklyHoursForm({ initial }: { initial: OpeningHours }) {
  const [state, action, pending] = useActionState<ScheduleFormState, FormData>(
    saveWeeklyHours,
    {},
  );
  const [hours, setHours] = useState(initial);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="flex flex-col gap-4"
      noValidate
    >
      <OpeningHoursFields
        value={hours}
        onChange={setHours}
        errors={state.fieldErrors}
        errorPrefix="weeklyHours"
        legend="Days and hours you see patients"
        closedLabel="Not working"
      />
      <FormMessage error={state.error} message={state.message} />
      <Button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto sm:self-start"
      >
        {pending ? "Saving…" : "Save my hours"}
      </Button>
    </form>
  );
}
