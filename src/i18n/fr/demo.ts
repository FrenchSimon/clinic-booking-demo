import type { demo as en } from "../en/demo";

export const demo: typeof en = {
  outbox: {
    title: "Boîte d’envoi",
    intro:
      "Aucun véritable e-mail ne quitte un cabinet de démo. Voici tous les e-mails que Kinora aurait envoyés, du plus récent au plus ancien.",
    remindersTitle: "Rappels de la veille",
    remindersIntro:
      "Chaque jour, une tâche automatique rappelle aux patients leur séance du lendemain. Lancez-la maintenant\u00a0: une réservation ne reçoit jamais deux rappels, même si vous cliquez plusieurs fois.",
    send: "Envoyer les rappels de demain",
    sending: "Envoi des rappels…",
    noneNew:
      "Aucun nouveau rappel\u00a0: chaque séance confirmée demain en reçoit un, une seule fois.",
    addedOne: "1\u00a0rappel ajouté ci-dessous.",
    addedMany: "{count}\u00a0rappels ajoutés ci-dessous.",
    empty:
      "Aucun e-mail pour l’instant. Réservez une séance en tant que patient, annulez-en une ou envoyez les rappels de demain\u00a0: chaque e-mail apparaît ici.",
    list: "E-mails",
    to: "À {email}",
    read: "Lire l’e-mail",
    kinds: {
      practitioner_invite: "Invitation",
      booking_confirmation: "Confirmation",
      booking_reminder: "Rappel",
      booking_cancellation: "Annulation",
    },
  },
  notice:
    "Ce cabinet de démo n’appartient qu’à vous\u00a0: l’équipe, les patients et les réservations sont fictifs, et les paiements passent par le mode test de Stripe. Il sera supprimé au bout de 24\u00a0heures, le {when}.",
  seed: {
    address: "Rue du Tilleul 14, 1050 Bruxelles",
    services: ["Premier bilan", "Séance de suivi", "Rééducation sportive"],
  },
};
