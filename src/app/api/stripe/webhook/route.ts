import { handleStripeWebhook } from "@/features/booking/webhook";

// Stripe calls this when a Checkout session is paid (checklist #10). No
// requireUser(): there is no signed-in user, Stripe's signature is the check.
export function POST(request: Request): Promise<Response> {
  return handleStripeWebhook(request);
}
