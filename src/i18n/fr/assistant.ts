import type { assistant as en } from "../en/assistant";

export const assistant: typeof en = {
  chat: {
    open: "Une question\u202f? Demandez-nous",
    back: "Retour à la réservation",
    title: "Une question pour {clinic}",
    subtitle: "Tarifs, horaires et créneaux libres",
    note: "Je réponds uniquement à partir des informations du cabinet. Je ne donne aucun avis médical et je n’ai accès à aucune réservation. Merci de ne pas partager d’informations de santé ici\u00a0: vos messages sont envoyés à un service d’IA.",
    form: "Poser une question",
    question: "Votre question",
    placeholder: "Êtes-vous ouverts le samedi\u202f?",
    send: "Envoyer",
    thinking: "Je regarde…",
    bookOnPage: "Réservez et payez sur la page de réservation",
    fallback:
      "L’assistant fait une pause, vous pouvez toujours réserver ci-dessous.",
    limit:
      "Vous avez posé toutes vos questions pour aujourd’hui. L’assistant fait une pause, vous pouvez toujours réserver ci-dessous.",
  },
  checked: {
    slot: "Le prochain créneau libre que j’ai trouvé est le {when}, avec {physio}.",
    none: "Je ne peux pas vous le dire. Tous les créneaux libres sont sur la page de réservation ci-dessous.",
  },
  when: "{date} à {time}",
  // Read by the model, so written in English like the rest of the prompt.
  language:
    "- The patient reads this page in French: always reply in French, whatever language they write in, with the formal « vous » and the words a Belgian physiotherapy clinic uses (« séance », « kiné »), in at most three short sentences of plain text, without markdown. Give dates and times exactly as the tool's `when` field.",
};
