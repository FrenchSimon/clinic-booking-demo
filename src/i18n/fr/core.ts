import type {
  bar as enBar,
  footer as enFooter,
  meta as enMeta,
} from "../en/core";

export const meta: typeof enMeta = {
  title: "Kinora",
  description:
    "La réservation en ligne pour les petits cabinets de kinésithérapie : le patient réserve, paie, annule avec remboursement et reçoit un rappel.",
  suffix: " · Kinora",
};

export const bar: typeof enBar = {
  label: "À propos de cette démo",
  title: "Démo de portfolio · cabinet fictif",
  readCode: "Voir le code",
  newTab: " (s’ouvre dans un nouvel onglet)",
  languages: "Langue",
  tryDemo: "Essayer la démo",
  preparing: "Préparation de votre cabinet…",
  viewAs: "Voir la démo en tant que",
  switching: "Changement…",
  roles: { owner: "Propriétaire", practitioner: "Kiné", patient: "Patient" },
  outbox: "Boîte d’envoi",
  outboxCount: "Boîte d’envoi, {count} e-mails",
  errors: {
    tooManyDemos:
      "Trop de démos lancées. Patientez une minute, puis réessayez.",
    demoUnavailable:
      "La démo n’est pas disponible pour le moment. Réessayez plus tard.",
    demoOnly: "Ce changement ne fonctionne que dans un cabinet de démo.",
    demoEnded: "Votre cabinet de démo a expiré. Lancez-en un nouveau.",
    remindersDemoOnly: "Ce bouton ne fonctionne que dans un cabinet de démo.",
  },
};

export const footer: typeof enFooter = {
  label: "Mentions légales",
  terms: "Conditions",
  privacy: "Confidentialité",
};
