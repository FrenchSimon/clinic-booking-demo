// The invitation landing page and its "Join" button (R1.6).

export const invite = {
  title: "You're invited",
  signedOut:
    "A clinic invited you to join Kinora as a physio. Create your account, or log in, with the email address the invitation was sent to.",
  createAccount: "Create my account",
  haveAccount: "I already have an account",
  notValid: "This invitation link is not valid.",
  expired:
    "This invitation from {clinic} has expired. Ask the clinic to send a new one.",
  accepted: "This invitation from {clinic} was already accepted.",
  goToClinic: "Go to my clinic",
  otherEmail:
    "This invitation was sent to {invited}, and you are signed in as {current}. Log out, then sign in with the invited address.",
  open: "{clinic} invites you to join as a physio. You will see your sessions in your own agenda.",
  join: "Join {clinic}",
  joining: "Joining…",
  /** The codes raised by private.accept_invitation() (drizzle/0007). */
  errors: {
    invitation_not_found: "This invitation link is not valid.",
    invitation_used: "This invitation was already accepted by another account.",
    invitation_expired:
      "This invitation has expired. Ask the clinic to send a new one.",
    invitation_email_mismatch:
      "This invitation was sent to another email address. Log out and sign in with that address.",
  },
};
