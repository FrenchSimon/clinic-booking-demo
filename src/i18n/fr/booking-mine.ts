import type { mine as en } from "../en/booking-mine";

export const mine: typeof en = {
  title: "Vos réservations",
  pageTitle: "Votre réservation",
  bookAt: "Réserver une séance chez {clinic}",
  upcoming: "À venir",
  upcomingEmpty:
    "Aucune séance à venir. Réservez-en une depuis la page de votre cabinet.",
  past: "Passées et annulées",
  pastEmpty: "Rien pour l’instant.",
  physio: "Kiné",
  back: "Toutes vos réservations",
  bookingBy: "Réservation par Kinora",
  headlines: {
    confirmed: {
      title: "Votre séance est réservée",
      text: "Payée par carte. Vous pouvez annuler en ligne jusqu’à 24\u00a0heures avant la séance, avec remboursement intégral.",
    },
    pending_payment: {
      title: "Nous confirmons votre paiement",
      text: "Cela prend en général quelques secondes.",
    },
    expired: {
      title: "Cette réservation n’a pas été payée à temps",
      text: "Le créneau était bloqué pendant 15\u00a0minutes. Choisissez à nouveau un horaire pour réserver.",
    },
    refunded: {
      title: "Ce créneau a été pris pendant votre paiement",
      text: "Nous vous avons remboursé intégralement. Le montant revient sur votre carte d’ici quelques jours.",
    },
    cancelled: {
      title: "Cette réservation est annulée",
      text: "Choisissez un autre horaire si vous souhaitez venir.",
    },
  },
  cancelledTitle: "Votre réservation est annulée",
  cancelledRefunded:
    "Nous vous avons remboursé {price} intégralement. Le montant revient sur votre carte d’ici quelques jours.",
  cancelledRefundPending:
    "Votre remboursement n’a pas encore abouti. Réessayez ci-dessous ou contactez le cabinet.",
  rows: {
    session: "Séance",
    physio: "Kiné",
    when: "Quand",
    where: "Où",
    price: "Prix",
  },
  reload: "Actualiser",
  bookAnother: "Réserver une autre séance",
  pickTime: "Choisir un horaire",
  cancel: {
    errors: {
      too_late:
        "Votre séance a lieu dans moins de 24\u00a0heures\u00a0: elle ne peut plus être annulée en ligne.",
      not_cancellable: "Cette réservation ne peut plus être annulée.",
      refund_failed:
        "Le remboursement n’a pas pu être effectué. Réessayez dans un instant.",
    },
    retryRefund: "Relancer le remboursement",
    tooLate:
      "Votre séance a lieu dans moins de 24\u00a0heures\u00a0: elle ne peut plus être annulée en ligne. Contactez le cabinet si vous ne pouvez pas venir.",
    link: "Annuler cette réservation",
    title: "Annuler cette séance\u202f?",
    text: "Le créneau redevient libre pour d’autres patients et {price} vous est intégralement remboursé sur votre carte. Cette action est définitive.",
    confirm: "Annuler et rembourser",
    keep: "Garder ma réservation",
  },
  email: {
    booked: "Votre e-mail de confirmation",
    cancelled: "Votre e-mail d’annulation et de remboursement",
    inOutbox: "{what} se trouve dans la boîte d’envoi.",
    noRealEmail: "Aucun véritable e-mail ne quitte un cabinet de démo.",
    openOutbox: "Ouvrir la boîte d’envoi",
    onItsWay: "{what} est en route",
    to: "vers",
  },
};
