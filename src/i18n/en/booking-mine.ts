// The patient's side: their bookings, one booking, and cancelling it.

export const mine = {
  title: "Your bookings",
  pageTitle: "Your booking",
  bookAt: "Book a session at {clinic}",
  upcoming: "Upcoming",
  upcomingEmpty: "No session to come. Book one from your clinic's page.",
  past: "Past and cancelled",
  pastEmpty: "Nothing here yet.",
  physio: "Physio",
  back: "All your bookings",
  bookingBy: "Booking by Kinora",
  headlines: {
    confirmed: {
      title: "Your session is booked",
      text: "Paid by card. You can cancel online up to 24 hours before for a full refund.",
    },
    pending_payment: {
      title: "We are confirming your payment",
      text: "This usually takes a few seconds.",
    },
    expired: {
      title: "This booking was not paid in time",
      text: "The time was held for 15 minutes. Pick a time again to book.",
    },
    refunded: {
      title: "This time was taken while you paid",
      text: "We refunded your payment in full. It reaches your card in a few days.",
    },
    cancelled: {
      title: "This booking is cancelled",
      text: "Pick another time if you would like to come in.",
    },
  },
  cancelledTitle: "Your booking is cancelled",
  cancelledRefunded:
    "We refunded {price} in full. It reaches your card in a few days.",
  cancelledRefundPending:
    "Your refund has not gone through yet. Try again below, or contact the clinic.",
  rows: {
    session: "Session",
    physio: "Physio",
    when: "When",
    where: "Where",
    price: "Price",
  },
  reload: "Reload",
  bookAnother: "Book another session",
  pickTime: "Pick a time",
  cancel: {
    errors: {
      too_late:
        "Your session is now less than 24 hours away: it can no longer be cancelled online.",
      not_cancellable: "This booking can no longer be cancelled.",
      refund_failed:
        "The refund could not be made just now. Try again in a moment.",
    } as Record<string, string>,
    retryRefund: "Try the refund again",
    tooLate:
      "Your session is less than 24 hours away: it can no longer be cancelled online. Contact the clinic if you cannot come.",
    link: "Cancel this booking",
    title: "Cancel this session?",
    text: "The time becomes free for other patients, and {price} goes back to your card in full. It cannot be undone.",
    confirm: "Cancel and refund",
    keep: "Keep my booking",
  },
  email: {
    booked: "Your confirmation email",
    cancelled: "Your cancellation and refund email",
    inOutbox: "{what} is in the Outbox.",
    noRealEmail: "No real email leaves a demo clinic.",
    openOutbox: "Open the Outbox",
    onItsWay: "{what} is on its way",
    to: "to",
  },
};
