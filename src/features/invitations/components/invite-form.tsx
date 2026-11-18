"use client";

import { useActionState, useEffect, useState } from "react";
import { Field, FormMessage } from "@/components/field";
import { Button } from "@/components/ui/button";
import { type InviteFormState, invitePractitioner } from "../actions";

// Controlled fields: kept after an error, cleared after a sent invitation.
export function InviteForm() {
  const [state, action, pending] = useActionState<InviteFormState, FormData>(
    invitePractitioner,
    {},
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (state.message) {
      setName("");
      setEmail("");
    }
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="name"
          label="Physio's name"
          autoComplete="off"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={state.fieldErrors?.name}
        />
        <Field
          name="email"
          label="Their email"
          type="email"
          inputMode="email"
          autoComplete="off"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={state.fieldErrors?.email}
        />
      </div>
      <FormMessage error={state.error} message={state.message} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Sending…" : "Send the invitation"}
      </Button>
    </form>
  );
}
