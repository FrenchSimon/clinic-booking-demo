// The demo clinic's own screens (the Outbox, the notice on the Today tab)
// and the data a new demo clinic is seeded with.

export const demo = {
  outbox: {
    title: "Outbox",
    intro:
      "No real email leaves a demo clinic. Here is every email Kinora would have sent, newest first.",
    remindersTitle: "Day-before reminders",
    remindersIntro:
      "A daily job reminds each patient of tomorrow's session. Run it now: a booking never gets two reminders, however often you click.",
    send: "Send tomorrow's reminders now",
    sending: "Sending reminders…",
    noneNew: "No new reminder: each confirmed session tomorrow gets one, once.",
    addedOne: "1 reminder added below.",
    addedMany: "{count} reminders added below.",
    empty:
      "No email yet. Book a session as a patient, cancel one, or send tomorrow's reminders: each email appears here.",
    list: "Emails",
    to: "To {email}",
    read: "Read the email",
    kinds: {
      practitioner_invite: "Invitation",
      booking_confirmation: "Confirmation",
      booking_reminder: "Reminder",
      booking_cancellation: "Cancellation",
    },
  },
  notice:
    "This demo clinic is yours alone: the team, patients and bookings are made up, and payments use Stripe's test mode. It is deleted after 24 hours, from {when}.",
  seed: {
    address: "Rue du Tilleul 14, 1050 Brussels",
    /** In the order of DEMO_SERVICES. */
    services: [
      "First consultation",
      "Follow-up session",
      "Sports rehabilitation",
    ],
  },
};
