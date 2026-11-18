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
    // Stripe > Developers > Webhooks > the endpoint's signing secret, or
    // `stripe listen` locally. Without it, the webhook answers 503.
    STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
    // Vercel sends it as "Authorization: Bearer <CRON_SECRET>" when it calls
    // the daily jobs (reminders, demo cleanup). Without it, they answer 503.
    CRON_SECRET: z.string().min(16).optional(),
    // Groq > API keys (starts with gsk_), free tier. Optional: without it,
    // the assistant on the booking page shows its fallback message.
    GROQ_API_KEY: z.string().startsWith("gsk_").optional(),
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
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
  emptyStringAsUndefined: true,
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
});
