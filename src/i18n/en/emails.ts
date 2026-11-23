// The emails Kinora sends, written in the patient's language (or, for an
// invitation, the inviting owner's). Built outside any request: the email
// code picks `dictionaries[locale].emails` itself.

export const emails = {
  /** "Tuesday 1 December at 10:00". */
  sessionTime: "{day} at {time}",
  yourPhysio: "your physio",
  session: "{service} with {physio} on {when}",
  address: "Address: {address}.",
  viewBooking: "View my booking",
  footer: "{clinic} · {address}",
  confirmation: {
    heading: "Your session at {clinic} is booked",
    paid: "Paid by card: {price}. You can cancel online up to 24 hours before for a full refund.",
  },
  cancellation: {
    heading: "Your session at {clinic} is cancelled",
    byClinic: "{clinic} cancelled your session: {session}.",
    byPatient: "You cancelled your session: {session}.",
    refund:
      "Your payment of {price} is refunded in full to your card. It usually shows on your account within 5 to 10 business days.",
  },
  reminder: {
    heading: "Your session at {clinic} is tomorrow",
    tooLate:
      "It is too late to cancel online. If you cannot come, please contact the clinic.",
  },
  invitation: {
    heading: "Join {clinic} on Kinora",
    hello: "Hello {name},",
    invites:
      "{clinic} uses Kinora for online booking and invites you to join as a physio. You will see your sessions in your own agenda.",
    account:
      "Create your account or log in with {email}. The link works for 7 days.",
    accept: "Accept the invitation",
  },
};
