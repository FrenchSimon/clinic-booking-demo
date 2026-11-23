// The frame around every page: page titles, the portfolio bar and the footer.

export const meta = {
  title: "Kinora",
  description:
    "Online booking for small physiotherapy clinics: book, pay, cancel with a refund and get a reminder.",
  /** Appended to every page title: "Log in · Kinora". */
  suffix: " · Kinora",
};

export const bar = {
  label: "About this demo",
  title: "Portfolio demo · fictional clinic",
  readCode: "Read the code",
  newTab: " (opens in a new tab)",
  languages: "Language",
  tryDemo: "Try the demo",
  preparing: "Preparing your clinic…",
  viewAs: "View the demo as",
  switching: "Switching…",
  roles: { owner: "Owner", practitioner: "Practitioner", patient: "Patient" },
  outbox: "Outbox",
  outboxCount: "Outbox, {count} emails",
  errors: {
    tooManyDemos: "Too many demos started. Wait a minute and try again.",
    demoUnavailable: "The demo is unavailable right now. Try again later.",
    demoOnly: "This switch only works in a demo clinic.",
    demoEnded: "Your demo clinic has ended. Start a new one.",
    remindersDemoOnly: "This button only works in a demo clinic.",
  },
};

export const footer = {
  label: "Legal",
  terms: "Terms",
  privacy: "Privacy",
};
