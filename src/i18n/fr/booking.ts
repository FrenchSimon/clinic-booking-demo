import type { booking as en } from "../en/booking";
import { mine } from "./booking-mine";

export const booking: typeof en = {
  errors: {
    taken: "Quelqu’un vient de prendre ce créneau. Choisissez-en un autre.",
    unavailable:
      "Cette prestation ne peut plus être réservée en ligne. Choisissez-en une autre.",
    payment:
      "Le paiement en ligne n’est pas disponible pour le moment. Réessayez plus tard.",
    busy: "Trop de tentatives. Patientez une minute, puis réessayez.",
  },
  anyPhysio: "Peu importe le kiné",
  notOpen:
    "La réservation en ligne n’est pas encore ouverte chez {clinic}. Revenez bientôt.",
  steps: { session: "Prestation", physio: "Kiné", time: "Jour et heure" },
  any: "Peu importe",
  minutes: "{minutes}\u00a0min",
  noTime: "Aucun créneau libre dans les deux prochaines semaines.",
  noTimePhysio:
    "Aucun créneau libre dans les deux prochaines semaines avec ce kiné. Essayez «\u00a0Peu importe\u00a0».",
  noFreeTime: "Aucun créneau libre",
  pickTime: "Choisissez un jour et une heure",
  pay: "Continuer vers le paiement",
  holding: "Réservation du créneau…",
  testCard: "Mode test, aucun paiement réel\u00a0: payez avec la carte",
  testCardEnd: ", une date future et n’importe quel CVC.",
  held: "Créneau bloqué 15\u00a0minutes pendant le paiement · Réservation par Kinora",
  checkout: {
    when: "{day} à {time} avec {physio}",
    yourPhysio: "votre kiné",
    testMode:
      "Mode test, aucun paiement réel\u00a0: payez avec la carte 4242 4242 4242 4242, une date future et n’importe quel CVC.",
  },
  status: {
    confirmed: "Confirmée",
    pending_payment: "Paiement en attente",
    expired: "Non payée",
    cancelled: "Annulée",
    refunded: "Remboursée",
  },
  mine,
};
