"use client";

import { startTransition, useActionState, useState } from "react";
import { Field, FormMessage } from "@/components/field";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locale";
import { type ServiceFormState, saveService } from "../actions";
import { PhysioChoices } from "./physio-choices";

type Props = {
  locale: Locale;
  t: Dictionary["team"]["serviceForm"];
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

/** 4550 → "45.00", or "45,00" in French: what the price field shows. */
function priceInput(cents: number, locale: Locale): string {
  const value = (cents / 100).toFixed(2);
  return locale === "fr" ? value.replace(".", ",") : value;
}

// Controlled fields, submitted by hand: React's automatic reset after a form
// action would untick the physio checkboxes without updating their state.
export function ServiceForm({ locale, t, physios, service }: Props) {
  const [state, action, pending] = useActionState<ServiceFormState, FormData>(
    saveService.bind(null, service?.id ?? null),
    {},
  );
  const [name, setName] = useState(service?.name ?? "");
  const [duration, setDuration] = useState(
    String(service?.durationMinutes ?? 30),
  );
  const [price, setPrice] = useState(
    service ? priceInput(service.priceCents, locale) : "",
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
        label={t.name}
        placeholder={t.namePlaceholder}
        autoComplete="off"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors?.name}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="durationMinutes"
          label={t.length}
          hint={t.lengthHint}
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
          label={t.price}
          hint={t.priceHint}
          inputMode="decimal"
          placeholder={t.pricePlaceholder}
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
        legend={t.physios}
        empty={t.noPhysios}
      />
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          name="active"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="size-5 accent-primary"
        />
        {t.active}
      </label>
      <FormMessage error={state.error} />
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="w-full sm:w-auto sm:self-start"
      >
        {pending ? t.saving : service ? t.save : t.create}
      </Button>
    </form>
  );
}
