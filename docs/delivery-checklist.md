# Delivery checklist

## Product

- [ ] Every point of the confirmed checklist works on the live app, ticked in `ROADMAP.md`
- [ ] Every page checked at 375 px on a real phone or the Pixel 7 viewport
- [ ] Two test accounts: neither can see the other's data
- [ ] Legal pages `/terms` and `/privacy` linked in the footer

## Quality

- [ ] CI green on `main`
- [ ] `pnpm e2e` passes
- [ ] Lighthouse mobile: performance and accessibility at 90 or more
- [ ] No `console.log`, no unused code, no `TODO` left without a roadmap task

## Handover

- [ ] `HANDOVER.md`: live URL, repository, how to run locally, environment variable names (never values)
- [ ] `README.md` up to date, with a mobile screenshot
- [ ] Every account (GitHub, Supabase, Vercel, and Sentry if used) owned by the client
- [ ] Release tagged `v1.0.0`
- [ ] Developer access removed at the end of the support period
