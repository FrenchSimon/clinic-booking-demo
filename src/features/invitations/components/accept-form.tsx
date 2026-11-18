"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/field";
import { Button } from "@/components/ui/button";
import { type AcceptState, acceptInvitation } from "../accept";

export function AcceptForm({
  token,
  clinicName,
}: {
  token: string;
  clinicName: string;
}) {
  const [state, action, pending] = useActionState<AcceptState, FormData>(
    acceptInvitation,
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <FormMessage error={state.error} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Joining…" : `Join ${clinicName}`}
      </Button>
    </form>
  );
}
