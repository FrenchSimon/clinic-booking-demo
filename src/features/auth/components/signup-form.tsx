"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage } from "@/components/field";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { type FormState, signUp } from "../actions";
import { TermsCheckbox } from "./terms-checkbox";

type Strings = Pick<Dictionary["auth"], "fields" | "signup">;

export function SignupForm({ next, t }: { next: string; t: Strings }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    signUp,
    {},
  );

  if (state.message) return <FormMessage message={state.message} />;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
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
      <Field
        name="password"
        label={t.fields.password}
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        error={state.fieldErrors?.password}
      />
      <TermsCheckbox error={state.fieldErrors?.terms} t={t.signup} />
      <FormMessage error={state.error} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? t.signup.pending : t.signup.submit}
      </Button>
      <p className="text-muted-foreground text-sm">
        {t.signup.haveAccount}{" "}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="font-medium text-primary underline"
        >
          {t.signup.logIn}
        </Link>
      </p>
    </form>
  );
}
