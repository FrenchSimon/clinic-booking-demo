"use client";

import { startTransition, useActionState, useState } from "react";
import { Field, FormMessage } from "@/components/field";
import { Button } from "@/components/ui/button";
import { type ClinicFormState, createClinic } from "../actions";
import { DEFAULT_OPENING_HOURS, type OpeningHours, slugify } from "../schema";
import { OpeningHoursFields } from "./opening-hours-fields";

// Controlled fields, submitted by hand: an owner who made one mistake should
// not retype the whole clinic, and React's automatic reset after a form
// action would put the day checkboxes back without updating their state.
export function ClinicForm({ origin }: { origin: string }) {
  const [state, action, pending] = useActionState<ClinicFormState, FormData>(
    createClinic,
    {},
  );
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [address, setAddress] = useState("");
  const [hours, setHours] = useState<OpeningHours>(DEFAULT_OPENING_HOURS);
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
        label="Clinic name"
        autoComplete="organization"
        required
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (!slugEdited) setSlug(slugify(e.target.value));
        }}
        error={errors?.name}
      />
      <div className="flex flex-col gap-1.5">
        <Field
          name="slug"
          label="Booking page address"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          value={slug}
          onChange={(e) => {
            setSlugEdited(true);
            setSlug(e.target.value);
          }}
          error={errors?.slug}
        />
        <p className="break-all text-muted-foreground text-sm">
          Patients will book at {origin}/c/{slug || "your-clinic"}
        </p>
      </div>
      <Field
        name="address"
        label="Street address"
        hint="Street, number, postcode and city, as patients will see it."
        autoComplete="street-address"
        placeholder="Rue Exemple 12, 1000 Brussels"
        required
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        error={errors?.address}
      />
      <OpeningHoursFields value={hours} onChange={setHours} errors={errors} />
      <FormMessage error={state.error} />
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="w-full sm:w-auto"
      >
        {pending ? "Creating your clinic…" : "Create the clinic"}
      </Button>
    </form>
  );
}
