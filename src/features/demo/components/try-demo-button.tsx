"use client";

import { useActionState } from "react";
import { type DemoState, startDemo } from "../actions";

/** Starts the visitor's demo clinic; preparing it takes a few seconds. */
export function TryDemoButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const [state, action, pending] = useActionState<DemoState>(startDemo, {});
  return (
    <form action={action} className="contents">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center font-semibold text-demo-foreground underline underline-offset-4 disabled:no-underline disabled:opacity-80"
      >
        {pending ? pendingLabel : label}
      </button>
      {state.error && (
        <p
          role="alert"
          className="order-last basis-full pb-2 text-demo-foreground"
        >
          {state.error}
        </p>
      )}
    </form>
  );
}
