import type { clinicViews as en } from "../en/clinic-views";

export const clinicViews: typeof en = {
  common: {
    colon: "\u00a0: ",
    staffBooking: "Réservation du cabinet",
    physio: "Kiné",
  },
  dashboard: {
    today: "Aujourd’hui",
    thisWeek: "Cette semaine",
    revenue: "Chiffre d’affaires, {month}",
    paidByCard: "payé par carte",
    cancelled: "Annulations",
    refunded: "{amount} remboursés",
    bookingOne: "réservation",
    bookingMany: "réservations",
    sessionsTitle: "Séances du jour",
    noSession: "Aucune séance réservée aujourd’hui.",
    columns: {
      time: "Heure",
      patient: "Patient",
      session: "Séance",
      physio: "Kiné",
      status: "Statut",
    },
  },
  agenda: {
    label: "Mon agenda",
    today: "Aujourd’hui",
    noneToday: "Aucune séance réservée avec vous aujourd’hui.",
    thisWeek: "Cette semaine",
    noneThisWeek: "Aucune autre séance réservée avec vous cette semaine.",
  },
  patients: {
    title: "Patients",
    intro:
      "Toutes les personnes qui ont réservé chez {clinic}, avec leurs séances payées.",
    empty:
      "Aucun patient pour l’instant. Vos patients apparaîtront ici dès qu’ils réserveront une séance sur votre page de réservation.",
    since: "Patient depuis le {date}",
    columns: {
      patient: "Patient",
      sessions: "Séances",
      last: "Dernière",
      next: "Prochaine",
    },
    none: "Aucune",
    noneBooked: "Aucune réservée",
  },
  bookings: {
    title: "Réservations",
    intro:
      "Toutes les séances à partir d’aujourd’hui. Ouvrez-en une pour l’annuler et la rembourser.",
    empty: "Aucune séance réservée à partir d’aujourd’hui.",
    back: "Toutes les réservations",
    detailTitle: "Réservation",
    rows: {
      patient: "Patient",
      session: "Séance",
      physio: "Kiné",
      when: "Quand",
      price: "Prix",
    },
  },
  cancel: {
    errors: {
      not_cancellable: "Cette réservation ne peut plus être annulée.",
      refund_failed:
        "La réservation est annulée, mais le remboursement n’a pas pu être effectué pour le moment. Réessayez dans un instant.",
    },
    retry: "Relancer le remboursement",
    done: "Annulée, {price} remboursés intégralement au patient.",
    open: "Annuler cette réservation",
    title: "Annuler cette séance\u202f?",
    explain:
      "Le créneau redevient libre et le patient est remboursé intégralement de {price} sur sa carte. Cette action est définitive.",
    confirm: "Annuler et rembourser",
    keep: "Garder la réservation",
  },
};
