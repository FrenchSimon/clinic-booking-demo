"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage } from "@/components/field";
import { Button } from "@/components/ui/button";
import { type FormState, logIn } from "../actions";

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
      <Link
        href="/forgot-password"
        className="-mt-2 self-start py-2 text-muted-foreground text-sm underline"
      >
        Forgot your password?
      </Link>
      <FormMessage error={state.error} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Logging in…" : "Log in"}
      </Button>
      <p className="text-muted-foreground text-sm">
        No account yet?{" "}
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="font-medium text-primary underline"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
