# Kinora

![CI](https://github.com/FrenchSimon/clinic-booking-demo/actions/workflows/ci.yml/badge.svg)

Kinora is an online booking app for small physiotherapy clinics: patients book and pay a session, cancel with an automatic refund and get a reminder the day before. The demo clinic is Maison Tilleul, a fictional practice in Brussels.

**Live app: https://kinora-booking.vercel.app**

<!-- Mobile screenshot: docs/mobile.png, 375 px wide -->

## Features

- Clinics with three roles: owner, practitioner and patient, enforced by row level security
- Services, weekly hours, days off and free-slot calculation, with no double booking
- Booking paid with Stripe Checkout (test mode), confirmed by an idempotent webhook
- Cancellation up to 24 hours before, with an automatic full refund
- Confirmation, reminder and refund emails, each sent exactly once
- Dashboards for the owner and the practitioner
- An assistant that answers patient questions from the clinic's own data
- A no-sign-up demo: your own seeded clinic and a "View as" bar to switch roles

Progress, task by task: [ROADMAP.md](ROADMAP.md).

## Stack

Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS 4 and shadcn/ui · Supabase (Postgres, Auth, row level security) · Drizzle ORM · Zod · Vercel

## How it is built

- **Mobile first.** Every screen is designed at 375 px, then widened. Pages render on the server, so phones download little JavaScript.
- **Security lives in the database.** Row level security on every table: a user can never read another user's data, even by calling the API directly.
- **Every input is validated on the server** with Zod, and every action checks the signed-in user.
- **One folder per feature** in `src/features/`, so a new feature does not touch the others.
- **Small, readable commits**, each tied to a roadmap task. CI runs the typecheck, lint, tests, build and a secret scan on every push.

## Run it locally

```bash
corepack enable
pnpm install
cp .env.example .env.local   # fill in the values
pnpm db:migrate
pnpm dev
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Local server on http://localhost:3000 |
| `pnpm check` | Typecheck, lint, unit tests |
| `pnpm test:db` | Row level security tests against the database in `DATABASE_URL`, rolled back after each test |
| `pnpm e2e` | Playwright journeys on a phone viewport |
| `pnpm db:generate` | Create a migration from the tables in `src/features/*/table.ts` |
| `pnpm db:migrate` | Apply migrations |

## Day-before reminders

A Vercel cron (`vercel.json`) calls `/api/cron/reminders` every day at 16:00 UTC, that is 17:00 in Brussels in winter and 18:00 in summer. It emails every patient whose confirmed session is the next day. Each booking gets one reminder at most: the email's dedupe key is unique in the database, so two runs at the same moment still send one. Set `CRON_SECRET` in Vercel, then try it by hand:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://kinora-booking.vercel.app/api/cron/reminders
```

## Try the demo

"Try the demo", in the bar above every page, signs the visitor in with an anonymous Supabase account and creates their own copy of Maison Tilleul: three physios, three services, six patients and two weeks of paid and refunded sessions. The visitor owns that clinic, so row level security treats them like any owner. Sessions from today on are paid with real Stripe test payments, so cancelling one makes a real test refund.

"View as Owner / Practitioner / Patient" then replaces the button. It changes the visitor's real role, not just the screens: the visitor swaps places with Camille Peeters (a physio) or Nora Benali (a patient), memberships and bookings included, so row level security shows them exactly what that person sees. They get the owner's place back before each switch, so at most one seeded account is out of place.

No real email leaves a demo clinic. A database trigger (`drizzle/0020`) stores every email of a clinic an anonymous visitor started, and every email to a reserved `.example` address, as "held", and only pending emails are ever sent. The "Outbox" link in the bar shows them to the visitor in every role, with a "Send tomorrow's reminders now" button that runs the reminder job for their clinic: clicked twice, it still queues one reminder per booking. Stripe runs in test mode only, so the booking bar and Stripe Checkout both show the test card 4242 4242 4242 4242.

It needs anonymous sign-ins: Supabase > Authentication > Sign In / Providers > "Allow anonymous sign-ins". A second Vercel cron, `/api/cron/demo-cleanup` at 03:00 UTC, deletes anonymous accounts older than 24 hours with the accounts seeded for them; their clinic and bookings go with them. Each new demo also runs that clean-up. Real accounts are never deleted: the job only matches anonymous accounts and the ones the seed marks in `app_metadata`, which users cannot change.

## License

This code is shared publicly as a portfolio sample. No license is granted: you may read it, but you may not copy, modify, distribute or reuse it, in whole or in part, without written permission.
