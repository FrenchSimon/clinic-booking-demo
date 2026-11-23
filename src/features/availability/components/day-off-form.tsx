"use client";

import { useActionState, useEffect, useState } from "react";
import { Field, FormMessage } from "@/components/field";
import { Button } from "@/components/ui/button";
import { addDayOff, type ScheduleFormState } from "../actions";

/** First and last day off, both included. One day: the same date twice. */
type DayOffStrings = {
  firstDay: string;
  lastDay: string;
  adding: string;
  addDayOff: string;
};

export function DayOffForm({ today, t }: { today: string; t: DayOffStrings }) {
  const [state, action, pending] = useActionState<ScheduleFormState, FormData>(
    addDayOff,
    {},
  );
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");

  useEffect(() => {
    if (state.message) {
      setStartsOn("");
      setEndsOn("");
    }
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="startsOn"
          label={t.firstDay}
          type="date"
          min={today}
          required
          value={startsOn}
          onChange={(e) => {
            setStartsOn(e.target.value);
            if (!endsOn || endsOn < e.target.value) setEndsOn(e.target.value);
          }}
          error={state.fieldErrors?.startsOn}
        />
        <Field
          name="endsOn"
          label={t.lastDay}
          type="date"
          min={startsOn || today}
          required
          value={endsOn}
          onChange={(e) => setEndsOn(e.target.value)}
          error={state.fieldErrors?.endsOn}
        />
      </div>
      <FormMessage error={state.error} message={state.message} />
      <Button
        type="submit"
        variant="outline"
        disabled={pending}
        className="w-full sm:w-auto sm:self-start"
      >
        {pending ? t.adding : t.addDayOff}
      </Button>
    </form>
  );
}
