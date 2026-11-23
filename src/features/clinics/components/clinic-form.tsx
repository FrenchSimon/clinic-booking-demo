"use client";

import { startTransition, useActionState, useState } from "react";
import { Field, FormMessage } from "@/components/field";
import { Button } from "@/components/ui/button";
import { fill } from "@/i18n/locale";
import { type ClinicFormState, createClinic } from "../actions";
import { DEFAULT_OPENING_HOURS, type OpeningHours, slugify } from "../schema";
import { type HoursStrings, OpeningHoursFields } from "./opening-hours-fields";

export type ClinicFormStrings = {
  name: string;
  slug: string;
  slugPreview: string;
  slugPlaceholder: string;
  address: string;
  addressHint: string;
  addressPlaceholder: string;
  submit: string;
  pending: string;
};

// Controlled fields, submitted by hand: an owner who made one mistake should
// not retype the whole clinic, and React's automatic reset after a form
// action would put the day checkboxes back without updating their state.
export function ClinicForm({
  origin,
  t,
  hours: hoursStrings,
}: {
  origin: string;
  t: ClinicFormStrings;
  hours: HoursStrings;
}) {
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
        label={t.name}
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
          label={t.slug}
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
          {fill(t.slugPreview, { origin, slug: slug || t.slugPlaceholder })}
        </p>
      </div>
      <Field
        name="address"
        label={t.address}
        hint={t.addressHint}
        autoComplete="street-address"
        placeholder={t.addressPlaceholder}
        required
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        error={errors?.address}
      />
      <OpeningHoursFields
        value={hours}
        onChange={setHours}
        errors={errors}
        strings={hoursStrings}
      />
      <FormMessage error={state.error} />
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="w-full sm:w-auto"
      >
        {pending ? t.pending : t.submit}
      </Button>
    </form>
  );
}
