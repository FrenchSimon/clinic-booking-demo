"use client";

import { startTransition, useActionState, useState } from "react";
import { Field, FormMessage } from "@/components/field";
import { Button } from "@/components/ui/button";
import { type ServiceFormState, saveService } from "../actions";
import { formatEuros } from "../schema";
import { PhysioChoices } from "./physio-choices";

type Props = {
  physios: { id: string; name: string }[];
  /** The service to edit; a new one when absent. */
  service?: {
    id: string;
    name: string;
    durationMinutes: number;
    priceCents: number;
    active: boolean;
    practitionerIds: string[];
  };
};

// Controlled fields, submitted by hand: React's automatic reset after a form
// action would untick the physio checkboxes without updating their state.
export function ServiceForm({ physios, service }: Props) {
  const [state, action, pending] = useActionState<ServiceFormState, FormData>(
    saveService.bind(null, service?.id ?? null),
    {},
  );
  const [name, setName] = useState(service?.name ?? "");
  const [duration, setDuration] = useState(
    String(service?.durationMinutes ?? 30),
  );
  const [price, setPrice] = useState(
    service ? formatEuros(service.priceCents).slice(1) : "",
  );
  const [picked, setPicked] = useState(service?.practitionerIds ?? []);
  const [active, setActive] = useState(service?.active ?? true);
  const errors = state.fieldErrors;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="flex flex-col gap-5"
      noValidate
    >
      <Field
        name="name"
        label="Session name"
        placeholder="Initial assessment"
        autoComplete="off"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors?.name}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="durationMinutes"
          label="Length in minutes"
          hint="From 10 to 240, in steps of 5."
          type="number"
          inputMode="numeric"
          min={10}
          max={240}
          step={5}
          required
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          error={errors?.durationMinutes}
        />
        <Field
          name="price"
          label="Price in euros"
          hint="Paid by card when booking."
          inputMode="decimal"
          placeholder="45.00"
          autoComplete="off"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={errors?.priceCents}
        />
      </div>
      <PhysioChoices
        physios={physios}
        picked={picked}
        onChange={setPicked}
        error={errors?.practitionerIds}
      />
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          name="active"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="size-5 accent-primary"
        />
        Patients can book it
      </label>
      <FormMessage error={state.error} />
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="w-full sm:w-auto sm:self-start"
      >
        {pending ? "Saving…" : service ? "Save the changes" : "Add the service"}
      </Button>
    </form>
  );
}
