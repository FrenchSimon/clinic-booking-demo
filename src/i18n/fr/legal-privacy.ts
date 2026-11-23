import type { privacySections as en } from "../en/legal-privacy";

// "\u00a0" before ":" and inside « », "\u202f" before ";": French typography.
export const privacySections: typeof en = [
  {
    title: "En bref",
    blocks: [
      {
        p: [
          "Kinora est une démo de portfolio avec des cabinets fictifs. Elle ne conserve que ce dont l’application a besoin pour fonctionner, n’utilise aucun cookie publicitaire ou de mesure d’audience et ne vend rien à personne. Utilisez des coordonnées fictives et n’indiquez jamais d’informations de santé.",
        ],
      },
    ],
  },
  {
    title: "Ce qui est conservé",
    blocks: [
      {
        ul: [
          [
            "Votre compte\u00a0: adresse e-mail et mot de passe, haché pour ne jamais pouvoir être relu. Une démo lancée avec «\u00a0Essayer la démo\u00a0» ne demande aucune adresse e-mail\u00a0: elle utilise des adresses inventées qui ne reçoivent jamais de courrier.",
          ],
          [
            "Ce que vous saisissez\u00a0: les informations du cabinet, les séances proposées, les horaires, les réservations, les annulations et les noms des kinés et des patients.",
          ],
          [
            "Les e-mails que l’application rédige au sujet des réservations, conservés dans la boîte d’envoi du cabinet.",
          ],
          [
            "Pour la limite quotidienne de l’assistant\u00a0: une empreinte irréversible de votre adresse IP et de la date, jamais l’adresse elle-même.",
          ],
        ],
      },
      {
        p: [
          "Vos questions à l’assistant sont envoyées à Groq pour rédiger une réponse. Kinora ne conserve pas la conversation.",
        ],
      },
    ],
  },
  {
    title: "Pourquoi",
    blocks: [
      {
        p: [
          "Pour fournir le service que vous avez demandé\u00a0: vous connecter, enregistrer et annuler des réservations, envoyer les e-mails qui s’y rapportent et protéger l’application contre les abus. Rien n’est utilisé à des fins publicitaires ou de profilage.",
        ],
      },
    ],
  },
  {
    title: "Qui traite ces données",
    blocks: [
      {
        ul: [
          [
            { strong: "Supabase" },
            "\u00a0: les comptes, les mots de passe (hachés) et la base de données de l’application",
          ],
          [{ strong: "Vercel" }, "\u00a0: l’hébergement de l’application"],
          [
            { strong: "Stripe" },
            "\u00a0: les paiements et remboursements de test\u202f; Kinora ne voit jamais les numéros de carte",
          ],
          [{ strong: "Resend" }, "\u00a0: les e-mails des cabinets hors démo"],
          [
            { strong: "Groq" },
            "\u00a0: les questions posées à l’assistant de la page de réservation",
          ],
        ],
      },
    ],
  },
  {
    title: "Combien de temps",
    blocks: [
      {
        ul: [
          [
            "Une démo est supprimée, avec tout son contenu, 24\u00a0heures après son lancement.",
          ],
          [
            "Les compteurs quotidiens de l’assistant sont supprimés le lendemain.",
          ],
          [
            "Un compte créé avec une adresse e-mail est conservé jusqu’à ce que vous demandiez sa suppression.",
          ],
        ],
      },
    ],
  },
  {
    title: "Cookies",
    blocks: [
      {
        p: [
          "Kinora ne dépose que les cookies qui vous gardent connecté et retiennent la langue choisie. Ils sont nécessaires au fonctionnement de l’application, c’est pourquoi il n’y a pas de bandeau cookies.",
        ],
      },
    ],
  },
  {
    title: "Vos droits",
    blocks: [
      {
        p: [
          "Vous pouvez demander à consulter, corriger ou supprimer vos données, ou vous opposer à leur utilisation, en ouvrant une issue sur le ",
          { link: "code", text: "dépôt GitHub de Kinora" },
          ". N’y écrivez aucune donnée personnelle\u00a0: l’issue est publique, et le développeur vous répondra avec un moyen de poursuivre en privé. Vous pouvez aussi introduire une plainte auprès de l’autorité de protection des données de votre pays (en Belgique, l’Autorité de protection des données).",
        ],
      },
      {
        p: [
          "Voir aussi les ",
          { link: "terms", text: "conditions d’utilisation" },
          ".",
        ],
      },
    ],
  },
];
