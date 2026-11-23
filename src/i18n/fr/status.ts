import type { status as en } from "../en/status";

export const status: typeof en = {
  home: "Retour à l’accueil",
  notFound: {
    label: "Page introuvable",
    title: "Cette page n’existe pas",
    text: "L’adresse contient peut-être une faute de frappe, ou la page n’existe plus. Rien n’a changé de votre côté\u00a0: vos réservations et vos paiements sont en sécurité.",
    bookings: "Vos réservations",
  },
  clinicNotFound: {
    label: "Cabinet introuvable",
    title: "Aucun cabinet ne prend de réservations à cette adresse",
    text: "Vérifiez le lien que votre cabinet vous a donné\u00a0: une seule lettre suffit à le changer. Si vous essayiez la démo, son cabinet est supprimé après 24 heures\u00a0; vous pouvez en lancer un nouveau depuis la barre ci-dessus.",
  },
  error: {
    label: "Un problème est survenu",
    title: "Cette page n’a pas pu se charger",
    text: "Le problème vient de chez nous, pas de vous. Si vous veniez de payer, ouvrez vos réservations avant de payer à nouveau\u00a0: chaque paiement accepté par Stripe est soit confirmé, soit remboursé.",
    retry: "Réessayer",
    reference: "Référence\u00a0: {digest}",
  },
  globalError: {
    title: "Un problème est survenu · Kinora",
    heading: "Kinora n’a pas pu se charger",
    text: "Le problème vient de chez nous. Vos réservations et vos paiements sont en sécurité\u00a0: réessayez dans un instant.",
    retry: "Réessayer",
  },
};
