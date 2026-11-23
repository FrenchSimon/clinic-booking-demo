// The 404 and error pages. Plain strings only: the error pages are client
// components and import this file directly.

export const status = {
  home: "Go to the home page",
  notFound: {
    label: "Page not found",
    title: "This page does not exist",
    text: "The address may be mistyped, or the page is no longer here. Nothing has changed on your side: your bookings and payments are safe.",
    bookings: "Your bookings",
  },
  clinicNotFound: {
    label: "Clinic not found",
    title: "No clinic books at this address",
    text: "Check the link your clinic gave you: one letter is enough to change it. If you were trying the demo, its clinic is deleted after 24 hours, and you can start a new one from the bar above.",
  },
  error: {
    label: "Something went wrong",
    title: "This page could not load",
    text: "The problem is on our side, not something you did. If you had just paid, open your bookings before paying again: every payment Stripe accepts is either confirmed or refunded.",
    retry: "Try again",
    reference: "Reference: {digest}",
  },
  globalError: {
    title: "Something went wrong · Kinora",
    heading: "Kinora could not load",
    text: "The problem is on our side. Your bookings and payments are safe: try again in a moment.",
    retry: "Try again",
  },
};
