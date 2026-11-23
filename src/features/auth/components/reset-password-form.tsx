"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/field";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { type FormState, updatePassword } from "../actions";

type Strings = Pick<Dictionary["auth"], "fields" | "reset">;

export function ResetPasswordForm({ t }: { t: Strings }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updatePassword,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field
        name="password"
        label={t.fields.newPassword}
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        error={state.fieldErrors?.password}
      />
      <FormMessage error={state.error} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? t.reset.pending : t.reset.submit}
      </Button>
    </form>
  );
}
