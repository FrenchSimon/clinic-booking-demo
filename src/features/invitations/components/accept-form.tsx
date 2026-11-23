"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/field";
import { Button } from "@/components/ui/button";
import { fill } from "@/i18n/locale";
import { type AcceptState, acceptInvitation } from "../accept";

export function AcceptForm({
  token,
  clinicName,
  t,
}: {
  token: string;
  clinicName: string;
  t: { join: string; joining: string };
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
        {pending ? t.joining : fill(t.join, { clinic: clinicName })}
      </Button>
    </form>
  );
}
