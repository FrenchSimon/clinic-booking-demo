# Handover

Kinora is delivered as a portfolio demo: there is no client, and every account below belongs to the developer. This file says where everything is, how to run it, and what to change to run it for a real clinic.

Delivered on 18 November 2026, version `v1.0.0`.

## Where it is

- Live app: https://kinora-booking.vercel.app
- Repository: https://github.com/FrenchSimon/clinic-booking-demo
- How it works and why: [README.md](README.md), section "Technical report"
- What was built, task by task: [ROADMAP.md](ROADMAP.md)

## Accounts

| Service | Used for | Plan |
|---|---|---|
| GitHub | Repository, CI | Free |
| Vercel | Hosting, previews, the two daily crons | Hobby |
| Supabase | Postgres, Auth, row level security | Free |
| Stripe | Checkout and refunds, **test mode only** | Free |
| Resend | Emails outside demo clinics | Free |
| Groq | The assistant's model | Free |

For a real clinic, each account is created in the clinic's name, then the variables below are set in Vercel.

## Run it locally

```bash
corepack enable
pnpm install
cp .env.example .env.local   # fill in the values, see below
pnpm db:migrate
pnpm dev                     # http://localhost:3000
```

Tests: `pnpm check` (typecheck, lint, unit tests), `pnpm test:db` (row level security, concurrency, webhook replay and reminders, against the database in `DATABASE_URL`, rolled back), `pnpm e2e` (Playwright journeys on a phone viewport).

## Environment variables

Names only. Where to find each value is written in [.env.example](.env.example).

| Name | Required | What happens without it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | The app does not start |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | The app does not start |
| `DATABASE_URL` | Yes | The app does not start |
| `STRIPE_SECRET_KEY` | No | The booking page stops before payment |
| `STRIPE_WEBHOOK_SECRET` | No | Bookings are confirmed only when the patient comes back from Stripe |
| `RESEND_API_KEY` | No | Emails stay queued in the outbox |
| `EMAIL_FROM` | No | Defaults to Resend's test sender |
| `CRON_SECRET` | No | No reminder goes out; demo clinics are deleted only when a new demo starts |
| `GROQ_API_KEY` | No | The assistant shows its fallback message |

Supabase also needs "Allow anonymous sign-ins" on (Authentication > Sign In / Providers) for "Try the demo".

## Going live with real payments

Kinora refuses a live Stripe key on purpose: `src/lib/env.ts` only accepts keys starting with `sk_test_`. To take real payments:

1. Activate the clinic's Stripe account (business details, bank account).
2. In `src/lib/env.ts`, accept `sk_live_` keys, and in Vercel set the live `STRIPE_SECRET_KEY`.
3. In Stripe, live mode: add a webhook endpoint `https://<domain>/api/stripe/webhook` with the events `checkout.session.completed` and `checkout.session.async_payment_succeeded`, then set its signing secret as `STRIPE_WEBHOOK_SECRET`.
4. Remove the test-card notices: the booking bar (`src/features/booking/components/summary-bar.tsx`) and the Checkout session's custom text (`src/features/booking/checkout.ts`).
5. Set the Stripe account's public business name: Checkout shows it to patients.
6. Make one real payment of a small amount, then refund it from the booking page.

## Emails

Without a verified domain, Resend delivers only to the account's own address. For a real clinic: buy a domain, verify it in Resend, set `EMAIL_FROM` to an address on it. To send Supabase's own emails (sign-up, password reset) from the same domain, set Resend as Supabase's SMTP server (Authentication > Emails > SMTP settings).

## Legal pages

The terms of use and the privacy notice describe the demo, not a real clinic. Replace them before opening the app to the public. They are in `src/features/legal/components/terms.tsx` and `privacy.tsx`. On GitHub: open the file, click the pencil, edit the text between the tags, then "Commit changes". Vercel deploys the change in about a minute. Update `LEGAL_UPDATED` in `legal-page.tsx` at the same time.

## The demo

"Try the demo" and the demo bar (role menu, Outbox) exist for people evaluating the code. For a real clinic, remove the `PortfolioBar` from `src/app/layout.tsx` and the `/api/cron/demo-cleanup` entry from `vercel.json`. The demo's tables and triggers stay harmless: they only act on anonymous accounts.

## Delivery checklist

[docs/delivery-checklist.md](docs/delivery-checklist.md), ticked on 18 November 2026 with what was seen working on the live app.
