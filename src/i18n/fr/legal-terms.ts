import type { termsSections as en } from "../en/legal-terms";

// "\u00a0" before ":" and inside « »: French typography.
export const termsSections: typeof en = [
  {
    title: "Ce qu’est Kinora",
    blocks: [
      {
        p: [
          "Kinora est une démo de portfolio\u00a0: une application de réservation en ligne pour cabinets de kinésithérapie. Maison Tilleul, comme tous les cabinets, kinés et patients de la démo, est fictive. Kinora n’est pas un vrai cabinet et ne fournit aucun soin\u00a0: une réservation faite ici n’est jamais un vrai rendez-vous.",
        ],
      },
      {
        p: [
          "En créant un compte ou en utilisant la démo, vous acceptez ces conditions et la ",
          { link: "privacy", text: "politique de confidentialité" },
          ".",
        ],
      },
    ],
  },
  {
    title: "Les paiements sont en mode test",
    blocks: [
      {
        p: [
          "Les paiements passent par Stripe en mode test. Aucun argent réel n’est débité ni remboursé. Payez uniquement avec la carte de test 4242 4242 4242 4242, jamais avec une vraie carte.",
        ],
      },
    ],
  },
  {
    title: "Aucun avis médical",
    blocks: [
      {
        p: [
          "Rien sur Kinora ne constitue un avis médical, y compris les réponses de l’assistant de la page de réservation. L’assistant répond uniquement à partir des informations du cabinet et peut se tromper. Si vous avez mal ou si votre santé vous inquiète, consultez un médecin ou un kinésithérapeute.",
        ],
      },
    ],
  },
  {
    title: "Utiliser Kinora loyalement",
    blocks: [
      {
        ul: [
          [
            "Utilisez des noms et des coordonnées fictifs. N’indiquez jamais d’informations de santé.",
          ],
          [
            "N’essayez pas d’accéder aux données d’autres personnes, de surcharger le service ni de contourner ses limites.",
          ],
          [
            "N’utilisez pas Kinora pour envoyer des e-mails à des personnes qui ne les ont pas demandés.",
          ],
        ],
      },
      {
        p: [
          "Les comptes qui enfreignent ces règles peuvent être supprimés sans préavis.",
        ],
      },
    ],
  },
  {
    title: "Votre compte et vos données",
    blocks: [
      {
        p: [
          "Une démo lancée avec «\u00a0Essayer la démo\u00a0» est supprimée, avec tout son contenu, 24\u00a0heures après son lancement. Un compte créé avec une adresse e-mail est conservé jusqu’à ce que vous demandiez sa suppression. La ",
          { link: "privacy", text: "politique de confidentialité" },
          " explique ce qui est conservé et pourquoi.",
        ],
      },
    ],
  },
  {
    title: "Aucune garantie",
    blocks: [
      {
        p: [
          "Kinora est fourni tel quel, gratuitement, pour montrer comment l’application est construite. Le service peut changer, s’arrêter ou perdre des données à tout moment. Dans les limites autorisées par la loi, son développeur n’est pas responsable des pertes causées par son utilisation.",
        ],
      },
    ],
  },
  {
    title: "Contact",
    blocks: [
      {
        p: [
          "Pour toute question sur ces conditions, ouvrez une issue sur le ",
          { link: "code", text: "dépôt GitHub de Kinora" },
          ".",
        ],
      },
    ],
  },
];
