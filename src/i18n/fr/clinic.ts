import type { clinic as en } from "../en/clinic";
import { clinicViews } from "./clinic-views";

export const clinic: typeof en = {
  shell: {
    bookingPage: "Page de réservation",
    bookingPageShort: "Réservation",
    tabsLabel: "Cabinet",
    tabs: {
      today: "Aujourd’hui",
      bookings: "Réservations",
      patients: "Patients",
      services: "Séances",
      hours: "Mes horaires",
    },
  },
  days: {
    mon: "Lundi",
    tue: "Mardi",
    wed: "Mercredi",
    thu: "Jeudi",
    fri: "Vendredi",
    sat: "Samedi",
    sun: "Dimanche",
  },
  hours: {
    legend: "Heures d’ouverture",
    closed: "Fermé",
    from: "{day}, de",
    until: "{day}, jusqu’à",
  },
  overview: {
    title: "Aujourd’hui",
    openingHours: "Heures d’ouverture",
    physioAt: "Vous êtes kiné chez {clinic}, {address}.",
    setMyHours: "Définir mes horaires et mes congés",
    bookingAddress: "Adresse de la page de réservation\u00a0: /c/{slug}",
  },
  setup: {
    title: "Créez votre cabinet",
    intro:
      "Vos patients verront ces informations sur votre page de réservation. Vous pourrez ensuite ajouter vos kinés et vos séances.",
    name: "Nom du cabinet",
    slug: "Adresse de la page de réservation",
    slugPreview: "Vos patients réserveront sur {origin}/c/{slug}",
    slugPlaceholder: "votre-cabinet",
    address: "Adresse postale",
    addressHint:
      "Rue, numéro, code postal et ville, tels que vos patients les verront.",
    addressPlaceholder: "Rue Exemple 12, 1000 Bruxelles",
    submit: "Créer le cabinet",
    pending: "Création de votre cabinet…",
  },
  errors: {
    tooMany: "Trop de tentatives. Patientez une minute, puis réessayez.",
    slugTaken: "Cette adresse est déjà prise. Essayez-en une autre.",
  },
  validation: {
    time: "Utilisez le format 24\u00a0heures, par exemple 08:30",
    closingAfterOpening:
      "L’heure de fermeture doit être après l’heure d’ouverture",
    name: "Indiquez le nom du cabinet",
    max80: "80\u00a0caractères maximum",
    slugMin: "Au moins 3\u00a0caractères",
    max60: "60\u00a0caractères maximum",
    slugPattern: "Utilisez des minuscules, des chiffres et des tirets",
    address: "Indiquez la rue, le numéro, le code postal et la ville",
    max200: "200\u00a0caractères maximum",
    addressNotEmail:
      "Indiquez l’adresse postale du cabinet, pas une adresse e-mail",
    addressNumber: "Ajoutez le numéro et le code postal",
  },
  ...clinicViews,
};
