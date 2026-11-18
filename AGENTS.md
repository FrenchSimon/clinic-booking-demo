<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Kinora

Kinora is an online booking app for small physiotherapy clinics: patients book and pay a session, cancel with an automatic refund and get a reminder the day before. The demo clinic is Maison Tilleul, a fictional practice in Brussels.

- Client: none, portfolio demo (fictional clinic: Maison Tilleul, Brussels)
- Live app: https://kinora-booking.vercel.app
- Contract: the confirmed checklist, split into tasks in `ROADMAP.md`

## Languages

All repository content is written in English: code, comments, commit messages, docs, pull requests and default UI copy. When talking to Simon in the terminal, answer in French.

## Commands

- `pnpm dev`: local server on http://localhost:3000
- `pnpm check`: typecheck, lint and unit tests. Run it before every commit.
- `pnpm e2e`: Playwright journeys on a mobile viewport
- `pnpm db:generate` then `pnpm db:migrate`: create and apply a migration

## Stack (fixed)

Next.js 16 (App Router, Server Actions, `src/proxy.ts`), React 19, TypeScript strict, Tailwind CSS 4 with shadcn/ui, Supabase (Postgres, Auth), Drizzle ORM, Zod, react-hook-form, `@t3-oss/env-nextjs`, Biome, Vitest, Playwright, Vercel, pnpm. Sentry only if the client asked for error tracking.

Do not add a dependency unless the pull request explains why the stack cannot do it. Prefer the platform and the code already here.

## Roadmap first

- No code without a task in `ROADMAP.md`. If the work you are asked to do has no task, add it to the roadmap first and tell Simon. If it is not in the confirmed checklist, it goes under "Out of scope" and is not built.
- Before starting a task, announce how you will split it into commits (usually 1 to 3).
- Tick the task in the commit that finishes it.

## Code

- TypeScript strict. No `any`, no `@ts-ignore`, no non-null `!` on environment variables: read them from `src/lib/env.ts`.
- Server Components by default. Add `"use client"` only for interaction, and keep client components small.
- One folder per feature in `src/features/<feature>/`: `schema.ts` (Zod), `table.ts` (Drizzle), `actions.ts` (Server Actions), `queries.ts` (reads), `components/`. Routes in `src/app/` stay thin and call the feature.
- Files under 200 lines, functions under 40. Split when it grows, not before.
- Styling uses the shadcn theme variables in `src/app/globals.css` (`bg-primary`, `text-muted-foreground`), never hard-coded colors.

## Mobile first

- Write the mobile classes first, then add `sm:`, `md:`, `lg:`. Check every screen at 375 px wide.
- Touch targets at least 44 px (`min-h-11`). Nothing may rely on hover only.
- Images through `next/image`, fonts through `next/font`. No client library over 30 kB gzipped without a reason in the pull request.
- Forms: correct `type` and `inputMode`, `autoComplete`, labels on every field, errors next to the field.

## Security

- Every input is parsed with a Zod schema on the server, even if the form already validated it.
- Every Server Action and route handler checks the user with `requireUser()` from `src/server/auth.ts`. Hiding a button is never access control.
- User data is read and written through `withRls()` from `src/lib/db.ts`, so Postgres row level security applies. `adminDb` bypasses RLS: use it only for migrations, webhooks and jobs, with a comment saying why.
- Every table has RLS enabled and its policies defined next to the table in `table.ts`.
- No raw SQL built from strings. Use Drizzle or the `sql` template tag.
- Secrets stay on the server. Only `NEXT_PUBLIC_*` variables reach the browser, and no secret ever has that prefix.
- Public forms (sign-up, contact, login) go through `rateLimit()` from `src/server/rate-limit.ts`.
- Security headers are set in `next.config.ts`. Do not loosen them without a reason in the pull request.

## Commits

- Conventional Commits with a scope and the roadmap task: `feat(booking): add slot picker [R2.3]`. Types: `feat`, `fix`, `refactor`, `test`, `perf` need a task. `docs`, `chore`, `ci`, `build`, `style` may skip it.
- One commit, one logical change. It builds and passes `pnpm check` on its own.
- Never mix a refactor and a feature. Never commit `wip`, commented-out code or `console.log`.
- The git hooks (Husky, commitlint) refuse commits that break these rules. Do not bypass them with `--no-verify`.

## Workflow

- Branch `feat/<task>` or `fix/<task>` from `main`. Pull request with the template, merged without squash so the history stays readable.
- Never push, open a pull request or merge without Simon's explicit go-ahead.

## Done means

- `pnpm check` and `pnpm e2e` pass.
- Seen working at 375 px on the Vercel preview.
- `ROADMAP.md` ticked, and `README.md` and `.env.example` updated if a command or variable changed.

## Do not

- Build abstractions, helpers or options "for later".
- Add a state manager, a separate API layer, Docker or a monorepo.
- Rewrite code that works to match a preference.
