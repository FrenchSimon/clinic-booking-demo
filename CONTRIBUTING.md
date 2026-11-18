# Contributing

## Setup

```bash
corepack enable
pnpm install
cp .env.example .env.local   # fill in the values
pnpm db:migrate
pnpm dev
```

## Workflow

1. Pick a task in `ROADMAP.md`. If there is none for your change, add it first.
2. Branch from `main`: `feat/<task>` or `fix/<task>`.
3. Commit in small steps. Each commit builds, passes `pnpm check` and references its task:
   ```
   feat(booking): add slot picker [R2.3]
   fix(auth): keep the session after a password reset [R1.2]
   docs: explain the Stripe test mode
   ```
4. Open a pull request with the template. Vercel posts a preview link: check it on a phone.
5. Merge without squash once CI is green.

## Commit types

| Type | Use | Task reference |
|---|---|---|
| `feat` | New behavior for the user | Required |
| `fix` | Bug fix | Required |
| `refactor` | Code change with no behavior change | Required |
| `test` | Tests only | Required |
| `perf` | Faster, same behavior | Required |
| `docs`, `chore`, `ci`, `build`, `style` | Everything else | Optional |

Git hooks (Husky) format staged files, run the typecheck and unit tests, and check the commit message.
