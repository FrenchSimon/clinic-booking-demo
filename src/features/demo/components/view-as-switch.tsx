"use client";

import { useActionState } from "react";
import type { MembershipRole } from "@/features/clinics/table";
import { cn } from "@/lib/utils";
import { type DemoState, viewAs } from "../actions";

const ROLES: { role: MembershipRole; label: string }[] = [
  { role: "owner", label: "Owner" },
  { role: "practitioner", label: "Practitioner" },
  { role: "patient", label: "Patient" },
];

/**
 * "View as Owner / Practitioner / Patient" in a demo clinic (checklist #20).
 * Each button changes the visitor's real role on the server; the pressed one
 * is the role they hold now.
 */
export function ViewAsSwitch({ current }: { current: MembershipRole }) {
  const [state, action, pending] = useActionState<DemoState, FormData>(
    viewAs,
    {},
  );
  return (
    <form
      action={action}
      className="order-last flex basis-full flex-wrap items-center gap-1 pb-2 sm:order-none sm:basis-auto sm:pb-0"
    >
      <fieldset
        aria-label="View as"
        aria-busy={pending}
        className="flex items-center gap-1"
      >
        <span
          aria-hidden="true"
          className="mr-1 whitespace-nowrap text-demo-muted"
        >
          View as
        </span>
        {ROLES.map(({ role, label }) => (
          <button
            key={role}
            type="submit"
            name="role"
            value={role}
            aria-pressed={role === current}
            disabled={pending}
            className={cn(
              "min-h-11 rounded-full px-3 disabled:opacity-80 sm:px-3.5",
              role === current
                ? "bg-demo-foreground font-semibold text-demo"
                : "text-demo-foreground underline-offset-4 hover:underline",
            )}
          >
            {label}
          </button>
        ))}
      </fieldset>
      {state.error && (
        <p role="alert" className="basis-full text-demo-foreground">
          {state.error}
        </p>
      )}
    </form>
  );
}
