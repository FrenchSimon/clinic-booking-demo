# Roadmap

Every task maps to a point of the confirmed checklist. One task is one commit, sometimes two.
A task is ticked in the commit that finishes it. Commits reference their task: `feat(scope): message [R2.1]`.

Checklist confirmed on: 2026-11-18

## R1. Foundations (~15 %)

- [x] R1.1 Project setup: Next.js, starter kit, CI green, first Vercel preview
- [ ] R1.2 Supabase auth: sign up, log in, log out, password reset by email (checklist #1)
- [ ] R1.3 Clinics and memberships tables, roles owner / practitioner / patient, row level security and migrations (checklist #3, #4)
- [ ] R1.4 Owner creates a clinic: name, address, opening hours (checklist #2)
- [ ] R1.5 Email outbox: every email is stored as a row, unique per booking and kind, then sent with Resend (checklist #14, #15)
- [ ] R1.6 Owner invites a practitioner by email, invitation accepted on sign-up (checklist #2, #14)
- [ ] R1.7 Isolation tests: no cross-clinic read or write, a patient sees only their own data (checklist #3, #4)
- [ ] R1.8 `DESIGN.md` turned into theme variables (after the design is approved)

## R2. Main journey: book and pay (~30 %)

- [ ] R2.1 Owner manages services: name, duration, price, practitioners who offer it (checklist #5)
- [ ] R2.2 Practitioner sets weekly hours and days off (checklist #6)
- [ ] R2.3 Free-slot calculation from hours, days off, service duration and bookings, with unit tests (checklist #7)
- [ ] R2.4 No double booking: database exclusion constraint on the practitioner's time range, concurrency test (checklist #7)
- [ ] R2.5 Public clinic page: choose a service, a practitioner or "any", then a free slot (checklist #8)
- [ ] R2.6 Slot held for 15 minutes, Stripe Checkout session in test mode; expired holds free the slot (checklist #9)
- [ ] R2.7 Stripe webhook confirms the booking, idempotent on the event id, replay test (checklist #10)
- [ ] R2.8 Return page checks the Checkout session, so a paid booking shows even if the webhook is late (checklist #10)
- [ ] R2.9 Booking confirmation email (checklist #14)
- [ ] R2.10 Patient sees upcoming and past bookings (checklist #11)

## R3. Dashboards (~10 %)

- [ ] R3.1 Owner dashboard: today's and this week's bookings, revenue of the month, cancellations and refunds (checklist #16)
- [ ] R3.2 Owner sees the patient list (checklist #16)
- [ ] R3.3 Practitioner agenda for the day and the week, limited to their own bookings by row level security (checklist #17)

## R4. Second journey: cancel, refund and remind (~20 %)

- [ ] R4.1 Patient cancels up to 24 hours before: full Stripe refund, slot freed, the 24-hour rule checked on the server (checklist #12)
- [ ] R4.2 Owner cancels any booking with a full refund (checklist #13)
- [ ] R4.3 Cancellation and refund email (checklist #14)
- [ ] R4.4 Day-before reminder job, daily Vercel cron: sent once per booking, never for a cancelled one, test with two runs at the same time (checklist #15)

## R5. Demo mode, assistant and polish (~25 %)

- [ ] R5.1 "Try the demo": anonymous session, own clinic seeded with practitioners, patients, services and paid, cancelled and refunded bookings, deleted after 24 hours (checklist #19)
- [ ] R5.2 "View as owner / practitioner / patient" bar that changes the visitor's real role in their demo clinic (checklist #20)
- [ ] R5.3 Outbox page instead of real emails in demo clinics, "Send tomorrow's reminders now" button, test card 4242 shown at checkout (checklist #21)
- [ ] R5.4 Assistant on the public page with Groq: answers from the clinic's data only, next free slot through a tool call to R2.3, no medical advice (checklist #18)
- [ ] R5.5 Assistant limits: 15 questions per visitor per day checked on the server, fallback message when the quota is reached or Groq fails (checklist #18)
- [ ] R5.6 Legal pages `/terms` and `/privacy`, terms checkbox at sign-up
- [ ] R5.7 Mobile pass at 375 px on every page (checklist #22)
- [ ] R5.8 README written as a short technical report: isolation, double booking, webhook replay, single reminder, assistant limits

## Out of scope

Requested but not part of the confirmed checklist. Listed here so nothing is forgotten, built only through a new order.

- SMS reminders
- Google Calendar sync
- Patient medical notes (health data)
- Payment at the clinic, partial deposit, waiting list
- Several time zones (everything runs in Europe/Brussels)
- Mobile app, custom domain
