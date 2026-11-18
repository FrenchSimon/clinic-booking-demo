import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Every environment variable goes through here. The build fails if one is missing,
// and server values can never be imported into browser code.
export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    // Resend > API keys. Optional: without it, emails stay queued in the outbox.
    RESEND_API_KEY: z.string().startsWith("re_").optional(),
    // Without a verified domain, Resend only delivers to the account's own address.
    EMAIL_FROM: z.string().min(3).default("Kinora <onboarding@resend.dev>"),
    // Stripe > Developers > API keys, in test mode only: this demo never
    // takes a real payment. Optional: without it, booking stops before payment.
    STRIPE_SECRET_KEY: z.string().startsWith("sk_test_").optional(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
  emptyStringAsUndefined: true,
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
});
