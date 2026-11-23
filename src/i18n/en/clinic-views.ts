// The owner's dashboard and lists, and the physio's agenda.

export const clinicViews = {
  common: {
    colon: ": ",
    staffBooking: "Staff booking",
    physio: "Physio",
  },
  dashboard: {
    today: "Today",
    thisWeek: "This week",
    revenue: "Revenue, {month}",
    paidByCard: "paid by card",
    cancelled: "Cancelled",
    refunded: "{amount} refunded",
    bookingOne: "booking",
    bookingMany: "bookings",
    sessionsTitle: "Today's sessions",
    noSession: "No session booked today.",
    columns: {
      time: "Time",
      patient: "Patient",
      session: "Session",
      physio: "Physio",
      status: "Status",
    },
  },
  agenda: {
    label: "My agenda",
    today: "Today",
    noneToday: "No session booked with you today.",
    thisWeek: "This week",
    noneThisWeek: "No other session booked with you this week.",
  },
  patients: {
    title: "Patients",
    intro: "Everyone who booked at {clinic}, with their paid sessions.",
    empty:
      "No patient yet. Patients appear here once they book a session on your booking page.",
    since: "Patient since {date}",
    columns: {
      patient: "Patient",
      sessions: "Sessions",
      last: "Last",
      next: "Next",
    },
    none: "None",
    noneBooked: "None booked",
  },
  bookings: {
    title: "Bookings",
    intro: "Every session from today on. Open one to cancel and refund it.",
    empty: "No session booked from today on.",
    back: "All bookings",
    detailTitle: "Booking",
    rows: {
      patient: "Patient",
      session: "Session",
      physio: "Physio",
      when: "When",
      price: "Price",
    },
  },
  cancel: {
    errors: {
      not_cancellable: "This booking can no longer be cancelled.",
      refund_failed:
        "The booking is cancelled, but the refund could not be made just now. Try again in a moment.",
    },
    retry: "Try the refund again",
    done: "Cancelled, {price} refunded to the patient in full.",
    open: "Cancel this booking",
    title: "Cancel this session?",
    explain:
      "The time becomes free again, and the patient gets {price} back on their card in full. It cannot be undone.",
    confirm: "Cancel and refund",
    keep: "Keep the booking",
  },
};
