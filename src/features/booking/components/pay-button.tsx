"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/** Submits the booking form; says so while the hold and Stripe are on their way. */
export function PayButton({
  disabled,
  label,
  pendingLabel,
}: {
  disabled: boolean;
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      disabled={disabled || pending}
      className="w-full"
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
