"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { type FormState, signUp } from "../actions";
import { Field, FormMessage } from "./field";

export function SignupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    signUp,
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
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        error={state.fieldErrors?.password}
      />
      <FormMessage error={state.error} />
      <Button type="submit" disabled={pending} className="min-h-11 w-full">
        {pending ? "Creating your account…" : "Create account"}
      </Button>
      <p className="text-muted-foreground text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
