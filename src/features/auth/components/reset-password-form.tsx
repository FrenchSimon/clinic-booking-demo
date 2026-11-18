"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { type FormState, updatePassword } from "../actions";
import { Field, FormMessage } from "./field";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updatePassword,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        error={state.fieldErrors?.password}
      />
      <FormMessage error={state.error} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save the new password"}
      </Button>
    </form>
  );
}
