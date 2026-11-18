"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { type FormState, logIn } from "../actions";
import { Field, FormMessage } from "./field";

export function LoginForm({ next, error }: { next: string; error?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(logIn, {
    error,
  });

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
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />
      <FormMessage error={state.error} />
      <Button type="submit" disabled={pending} className="min-h-11 w-full">
        {pending ? "Logging in…" : "Log in"}
      </Button>
      <p className="text-muted-foreground text-sm">
        No account yet?{" "}
        <Link href="/signup" className="text-foreground underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
