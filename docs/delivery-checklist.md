# Delivery checklist

Checked on 18 November 2026. A box is ticked only for what was seen working; the notes say how.

## Product

- [x] Every point of the confirmed checklist works on the live app, ticked in `ROADMAP.md`. Seen on https://kinora-booking.vercel.app in a demo clinic at 375 px: dashboard, bookings, a Stripe test payment confirmed, a patient's cancellation and an owner's cancellation both refunded, the 24-hour rule, a practitioner's agenda and day off, the role menu, the Outbox, reminders sent once over two clicks, the assistant's slot and its refusal of medical advice. Account creation and invitations are covered by `pnpm test:db` and `pnpm e2e`, not repeated live.
- [x] Every page checked at 375 px on a real phone or the Pixel 7 viewport: `e2e/mobile-pass.spec.ts` opens every page at 375 px and finds no side scroll; the main screens were also checked by eye.
- [x] Two test accounts: neither can see the other's data. A QA owner and a QA patient of another clinic get the not-found page on the demo clinic's bookings; `src/db/cross-clinic.db.test.ts` and `roles.db.test.ts` pass (`pnpm test:db`: 109 tests in 22 files).
- [x] Legal pages `/terms` and `/privacy` linked in the footer, and sign-up is refused by the server without the terms box ticked.

## Quality

- [x] CI green on `main`
- [x] `pnpm e2e` passes: every file passes; in a full local run the dev server's first compiles can time out the two longest journeys, which then pass on their own (CI is green).
- [x] Lighthouse mobile: performance and accessibility at 90 or more. PageSpeed Insights, mobile, 18 November 2026: 100 in performance, accessibility, best practices and SEO on both the home page (LCP 0.9 s, TBT 40 ms, CLS 0) and a demo clinic's booking page (LCP 0.9 s, TBT 10 ms, CLS 0).
- [x] No `console.log`, no unused code, no `TODO` left without a roadmap task

## Handover

- [x] `HANDOVER.md`: live URL, repository, how to run locally, environment variable names (never values)
- [x] `README.md` up to date, with a mobile screenshot
- [ ] Every account (GitHub, Supabase, Vercel, and Sentry if used) owned by the client. Not applicable: portfolio demo, every account is the developer's.
- [x] Release tagged `v1.0.0`
- [ ] Developer access removed at the end of the support period. Not applicable: portfolio demo.
