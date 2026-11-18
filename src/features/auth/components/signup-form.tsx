"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage } from "@/components/field";
import { Button } from "@/components/ui/button";
import { type FormState, signUp } from "../actions";
import { TermsCheckbox } from "./terms-checkbox";

export function SignupForm({ next }: { next: string }) {
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
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        error={state.fieldErrors?.password}
      />
      <TermsCheckbox error={state.fieldErrors?.terms} />
      <FormMessage error={state.error} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Creating your account…" : "Create account"}
      </Button>
      <p className="text-muted-foreground text-sm">
        Already have an account?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="font-medium text-primary underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
