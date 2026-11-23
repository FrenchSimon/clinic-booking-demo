import type { home as en } from "../en/home";

export const home: typeof en = {
  nav: "Navigation principale",
  logIn: "Se connecter",
  myBookings: "Mes réservations",
  myClinic: "Mon cabinet",
  eyebrow: "Pour les petits cabinets de kinésithérapie",
  title:
    "Vos patients réservent et paient en ligne. Vous retrouvez vos soirées.",
  intro:
    "Les prestations, les kinés et les créneaux libres sur une seule page. Les annulations se remboursent toutes seules, les rappels partent la veille.",
  cta: "Créer un compte cabinet",
  featuresLabel: "Ce que fait Kinora",
  features: [
    {
      title: "Moins de rendez-vous manqués",
      text: "Le patient paie en réservant, alors il vient. Fini de courir après les paiements à l’accueil.",
    },
    {
      title: "Les annulations se gèrent toutes seules",
      text: "Le patient qui annule la veille est remboursé, et le créneau se libère pour quelqu’un d’autre.",
    },
    {
      title: "Un rappel la veille",
      text: "Chaque patient reçoit un e-mail la veille de sa séance. Vous n’avez plus personne à appeler.",
    },
  ],
};
