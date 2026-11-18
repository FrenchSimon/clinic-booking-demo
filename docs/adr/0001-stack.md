# 1. Stack

Date: 2026-11-18 · Status: accepted

## Context

The app must be secure, fast on phones, easy to change and quick to build, with one developer and a fixed budget.

## Decision

- **Next.js App Router with Server Components and Server Actions.** One codebase for pages and backend. Pages render on the server, so phones get little JavaScript. No separate API to maintain.
- **Supabase** for Postgres and authentication, with **row level security** on every table: data isolation is enforced by the database, not only by the code.
- **Drizzle ORM** for typed queries and versioned migrations. Queries for a user run inside `withRls()`, as the `authenticated` role, so the policies apply.
- **Zod** validates every input on the server and shares its schema with the forms.
- **Tailwind CSS and shadcn/ui**: the components live in the repository and can be changed freely.
- **Biome, Vitest, Playwright, Husky, commitlint** keep the code formatted, tested and the history readable, without manual effort.
- **Vercel** with a preview link for every pull request.

## Consequences

- Each new table needs its policies in `table.ts` and a migration.
- Code that must bypass row level security (webhooks, jobs) uses `adminDb` explicitly, which keeps it easy to review.
- The stack is kept small on purpose: a new dependency needs a written reason.
