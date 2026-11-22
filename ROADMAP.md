# Roadmap

Every task maps to a point of the confirmed checklist. One task is one commit, sometimes two.
A task is ticked in the commit that finishes it. Commits reference their task: `feat(scope): message [R2.1]`.

Checklist confirmed on: 2026-11-18

## R1. Foundations (~15 %)

- [x] R1.1 Project setup: Next.js, starter kit, CI green, first Vercel preview
- [x] R1.2 Supabase auth: sign up, log in, log out, password reset by email (checklist #1)
- [x] R1.3 Clinics and memberships tables, roles owner / practitioner / patient, row level security and migrations (checklist #3, #4)
- [x] R1.4 Owner creates a clinic: name, address, opening hours (checklist #2)
- [x] R1.5 Email outbox: every email is stored as a row, unique per booking and kind, then sent with Resend (checklist #14, #15)
- [x] R1.6 Owner invites a practitioner by email, invitation accepted on sign-up (checklist #2, #14)
- [x] R1.7 Isolation tests: no cross-clinic read or write, a patient sees only their own data (checklist #3, #4)
- [x] R1.8 `DESIGN.md` turned into theme variables (after the design is approved)

## R2. Main journey: book and pay (~30 %)

- [x] R2.1 Owner manages services: name, duration, price, practitioners who offer it (checklist #5)
- [x] R2.2 Practitioner sets weekly hours and days off (checklist #6)
- [x] R2.3 Free-slot calculation from hours, days off, service duration and bookings, with unit tests (checklist #7)
- [x] R2.4 No double booking: database exclusion constraint on the practitioner's time range, concurrency test (checklist #7)
- [x] R2.5 Public clinic page: choose a service, a practitioner or "any", then a free slot (checklist #8)
- [x] R2.6 Slot held for 15 minutes, Stripe Checkout session in test mode; expired holds free the slot (checklist #9)
- [x] R2.7 Stripe webhook confirms the booking, idempotent on the event id, replay test (checklist #10)
- [x] R2.8 Return page checks the Checkout session, so a paid booking shows even if the webhook is late (checklist #10)
- [x] R2.9 Booking confirmation email (checklist #14)
- [x] R2.10 Patient sees upcoming and past bookings (checklist #11)
- [x] R2.11 After logging in without a page to return to, a patient lands on their bookings and staff on their clinic, instead of every user being sent to create a clinic (checklist #1, #11, asked by Simon on 2026-11-18)
- [x] R2.12 Right after paying or cancelling, the booking page says a confirmation email is on its way to the patient's address (checklist #14, asked by Simon on 2026-11-18)

## R3. Dashboards (~10 %)

- [x] R3.1 Owner dashboard: today's and this week's bookings, revenue of the month, cancellations and refunds (checklist #16)
- [x] R3.2 Owner sees the patient list (checklist #16)
- [x] R3.3 Practitioner agenda for the day and the week, limited to their own bookings by row level security (checklist #17)

## R4. Second journey: cancel, refund and remind (~20 %)

- [x] R4.1 Patient cancels up to 24 hours before: full Stripe refund, slot freed, the 24-hour rule checked on the server (checklist #12)
- [x] R4.2 Owner cancels any booking with a full refund (checklist #13)
- [x] R4.3 Cancellation and refund email (checklist #14)
- [x] R4.4 Day-before reminder job, daily Vercel cron: sent once per booking, never for a cancelled one, test with two runs at the same time (checklist #15)

## R5. Demo mode, assistant and polish (~25 %)

- [x] R5.1 "Try the demo": anonymous session, own clinic seeded with practitioners, patients, services and paid, cancelled and refunded bookings, deleted after 24 hours (checklist #19)
- [x] R5.2 "View as owner / practitioner / patient" bar that changes the visitor's real role in their demo clinic (checklist #20)
- [x] R5.3 Outbox page instead of real emails in demo clinics, "Send tomorrow's reminders now" button, test card 4242 shown at checkout, and the booking page points to the Outbox instead of saying an email is on its way (checklist #21)
- [x] R5.4 Assistant on the public page with Groq: answers from the clinic's data only, next free slot through a tool call to R2.3, no medical advice (checklist #18)
- [x] R5.5 Assistant limits: 15 questions per visitor per day checked on the server, fallback message when the quota is reached or Groq fails (checklist #18)
- [x] R5.6 Legal pages `/terms` and `/privacy`, terms checkbox at sign-up
- [x] R5.7 Mobile pass at 375 px on every page (checklist #22)
- [x] R5.8 README written as a short technical report: isolation, double booking, webhook replay, single reminder, assistant limits
- [x] R5.9 Error pages in the design: a 404 page for unknown addresses and clinics, and an error page that keeps the app usable when something fails (asked by Simon on 2026-11-18)
- [x] R5.10 After paying or cancelling, the email notice is a visible callout under the title, with a button to the Outbox in a demo clinic, instead of a grey line (checklist #14, #21, asked by Simon on 2026-11-18)
- [x] R5.11 A demo visitor's Stripe Checkout shows their demo address, prefilled, the one their emails go to in the Outbox (checklist #21, asked by Simon on 2026-11-18)
- [x] R5.12 Demo bar on two lines: "Portfolio demo · fictional clinic", then "Read the code" and, on the right, a role menu and the Outbox with its email count; the clinic name hidden on a phone (checklist #19, #20, #21, spec in header-spec.md, asked by Simon on 2026-11-18)
- [x] R5.13 On a booking's page, "All your bookings" (or "All bookings" for the owner) is a back link above the card on the left, and the cancel buttons are red (checklist #12, #13, asked by Simon on 2026-11-18)
- [x] R5.14 Links to the clinic's public booking page: "Booking page" in the clinic space's top bar for the owner and the physios, and "Book a session" on the patient's bookings (checklist #8, #11, asked by Simon on 2026-11-18)
- [x] R5.15 The assistant's opening note asks patients not to share health details, since their messages are sent to Groq (checklist #18, asked by Simon on 2026-11-18)
- [x] R5.16 The e2e tests wait for each role switch, reminders run and footer link to finish, so they no longer fail when the dev server is slow (checklist #20, #21, asked by Simon on 2026-11-18)

## R6. After delivery

- [x] R6.1 CI runs the database tests (`pnpm test:db`) on every push, against a local Supabase started in the job, so the isolation, webhook replay and double booking proofs are visible on GitHub (asked by Simon on 2026-11-22)

## Out of scope

Requested but not part of the confirmed checklist. Listed here so nothing is forgotten, built only through a new order.

- SMS reminders
- Google Calendar sync
- Patient medical notes (health data)
- Payment at the clinic, partial deposit, waiting list
- Several time zones (everything runs in Europe/Brussels)
- Mobile app, custom domain
