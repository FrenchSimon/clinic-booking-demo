import { mine } from "./booking-mine";

// The clinic's public booking page, and the status labels of a booking.

export const booking = {
  errors: {
    taken: "Someone just took this time. Pick another one.",
    unavailable:
      "This session can no longer be booked online. Pick another one.",
    payment: "Online payment is not available right now. Try again later.",
    busy: "Too many attempts. Wait a minute and try again.",
  } as Record<string, string>,
  anyPhysio: "Any physio",
  notOpen: "Online booking is not open yet at {clinic}. Please come back soon.",
  steps: { session: "Session", physio: "Physio", time: "Day and time" },
  any: "Any",
  minutes: "{minutes} min",
  noTime: "No free time in the next two weeks.",
  noTimePhysio: "No free time in the next two weeks with this physio. Try Any.",
  noFreeTime: "No free time",
  pickTime: "Pick a day and a time",
  pay: "Continue to payment",
  holding: "Holding your slot…",
  testCard: "Test mode, no real payment: pay with card",
  testCardEnd: ", any future date and any CVC.",
  held: "Your slot is held for 15 minutes while you pay · Booking by Kinora",
  checkout: {
    when: "{day} at {time} with {physio}",
    yourPhysio: "your physio",
    testMode:
      "Test mode, no real payment: pay with card 4242 4242 4242 4242, any future date and any CVC.",
  },
  status: {
    confirmed: "Confirmed",
    pending_payment: "Pending payment",
    expired: "Not paid",
    cancelled: "Cancelled",
    refunded: "Refunded",
  },
  mine,
};
