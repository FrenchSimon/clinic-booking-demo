"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { type FormState, requestPasswordReset } from "../actions";
import { Field, FormMessage } from "./field";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    requestPasswordReset,
    {},
  );

  if (state.message) return <FormMessage message={state.message} />;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field
        name="email"
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <FormMessage error={state.error} />
      <Button type="submit" disabled={pending} className="min-h-11 w-full">
        {pending ? "Sending…" : "Send the link"}
      </Button>
      <Link href="/login" className="text-muted-foreground text-sm underline">
        Back to log in
      </Link>
    </form>
  );
}
