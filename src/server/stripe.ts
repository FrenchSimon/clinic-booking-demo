import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

let client: Stripe | null = null;

/** The Stripe client in test mode, or null when no key is set. */
export function stripe(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  client ??= new Stripe(env.STRIPE_SECRET_KEY);
  return client;
}
