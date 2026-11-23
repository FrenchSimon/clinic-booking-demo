import { clinicViews } from "./clinic-views";

// The clinic space: its frame, the clinic form, opening hours and the Today
// tab. The dashboard, agenda, patients and bookings are in clinic-views.ts.

export const clinic = {
  shell: {
    bookingPage: "Booking page",
    /** On a phone, next to the logo and "Log out". */
    bookingPageShort: "Booking page",
    tabsLabel: "Clinic",
    tabs: {
      today: "Today",
      bookings: "Bookings",
      patients: "Patients",
      services: "Services",
      hours: "My hours",
    },
  },
  days: {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
  },
  hours: {
    legend: "Opening hours",
    closed: "Closed",
    from: "{day} from",
    until: "{day} until",
  },
  overview: {
    title: "Today",
    openingHours: "Opening hours",
    physioAt: "You are a physio at {clinic}, {address}.",
    setMyHours: "Set my hours and days off",
    bookingAddress: "Booking page address: /c/{slug}",
  },
  setup: {
    title: "Set up your clinic",
    intro:
      "Patients will see this on your booking page. You can add your physios and services next.",
    name: "Clinic name",
    slug: "Booking page address",
    slugPreview: "Patients will book at {origin}/c/{slug}",
    slugPlaceholder: "your-clinic",
    address: "Street address",
    addressHint: "Street, number, postcode and city, as patients will see it.",
    addressPlaceholder: "Rue Exemple 12, 1000 Brussels",
    submit: "Create the clinic",
    pending: "Creating your clinic…",
  },
  errors: {
    tooMany: "Too many attempts. Wait a minute and try again.",
    slugTaken: "This address is already taken. Try another.",
  },
  /** The Zod messages of clinics/schema.ts, in the visitor's language. */
  validation: {
    time: "Use the 24-hour format, like 08:30",
    closingAfterOpening: "Closing time must be after opening time",
    name: "Enter the clinic's name",
    max80: "80 characters max",
    slugMin: "At least 3 characters",
    max60: "60 characters max",
    slugPattern: "Use lowercase letters, digits and dashes",
    address: "Enter the street, number, postcode and city",
    max200: "200 characters max",
    addressNotEmail: "Enter the clinic's street address, not an email",
    addressNumber: "Add the street number and postcode",
  },
  ...clinicViews,
};
