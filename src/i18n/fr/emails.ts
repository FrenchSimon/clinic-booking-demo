import type { emails as en } from "../en/emails";

export const emails: typeof en = {
  sessionTime: "{day} à {time}",
  yourPhysio: "votre kiné",
  session: "{service} avec {physio} le {when}",
  address: "Adresse\u00a0: {address}.",
  viewBooking: "Voir ma réservation",
  footer: "{clinic} · {address}",
  confirmation: {
    heading: "Votre séance chez {clinic} est réservée",
    paid: "Payé par carte\u00a0: {price}. Vous pouvez annuler en ligne jusqu’à 24\u00a0heures avant la séance, avec remboursement intégral.",
  },
  cancellation: {
    heading: "Votre séance chez {clinic} est annulée",
    byClinic: "{clinic} a annulé votre séance\u00a0: {session}.",
    byPatient: "Vous avez annulé votre séance\u00a0: {session}.",
    refund:
      "Votre paiement de {price} vous est intégralement remboursé sur votre carte. Le remboursement apparaît généralement sur votre compte sous 5 à 10\u00a0jours ouvrables.",
  },
  reminder: {
    heading: "Votre séance chez {clinic} a lieu demain",
    tooLate:
      "Il est trop tard pour annuler en ligne. Si vous ne pouvez pas venir, merci de contacter le cabinet.",
  },
  invitation: {
    heading: "Rejoignez {clinic} sur Kinora",
    hello: "Bonjour {name},",
    invites:
      "{clinic} utilise Kinora pour la réservation en ligne et vous invite à rejoindre l’équipe en tant que kiné. Vous verrez vos séances dans votre propre agenda.",
    account:
      "Créez votre compte ou connectez-vous avec {email}. Le lien est valable 7\u00a0jours.",
    accept: "Accepter l’invitation",
  },
};
