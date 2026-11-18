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
| `pnpm e2e` | Playwright journeys on a phone viewport |
| `pnpm db:generate` | Create a migration from the tables in `src/features/*/table.ts` |
| `pnpm db:migrate` | Apply migrations |

## License

This code is shared publicly as a portfolio sample. No license is granted: you may read it, but you may not copy, modify, distribute or reuse it, in whole or in part, without written permission.
