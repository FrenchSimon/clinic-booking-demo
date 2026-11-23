"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage } from "@/components/field";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import { type FormState, logIn } from "../actions";

type Strings = Pick<Dictionary["auth"], "fields" | "login">;

export function LoginForm({
  next,
  error,
  t,
}: {
  next: string;
  error?: string;
  t: Strings;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(logIn, {
    error,
  });

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
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />
      <Link
        href="/forgot-password"
        className="-mt-2 inline-flex min-h-11 items-center self-start text-muted-foreground text-sm underline"
      >
        {t.login.forgot}
      </Link>
      <FormMessage error={state.error} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? t.login.pending : t.login.submit}
      </Button>
      <p className="text-muted-foreground text-sm">
        {t.login.noAccount}{" "}
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="font-medium text-primary underline"
        >
          {t.login.signUp}
        </Link>
      </p>
    </form>
  );
}
