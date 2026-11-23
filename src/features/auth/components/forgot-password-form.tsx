"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage } from "@/components/field";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { type FormState, requestPasswordReset } from "../actions";

type Strings = Pick<Dictionary["auth"], "fields" | "forgot">;

export function ForgotPasswordForm({ t }: { t: Strings }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    requestPasswordReset,
    {},
  );

  if (state.message) return <FormMessage message={state.message} />;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field
        name="email"
        label={t.fields.email}
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <FormMessage error={state.error} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? t.forgot.pending : t.forgot.submit}
      </Button>
      <Link
        href="/login"
        className="inline-flex min-h-11 items-center self-start text-muted-foreground text-sm underline"
      >
        {t.forgot.back}
      </Link>
    </form>
  );
}
