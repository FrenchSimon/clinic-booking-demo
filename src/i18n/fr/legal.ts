import type { legal as en } from "../en/legal";
import { privacySections } from "./legal-privacy";
import { termsSections } from "./legal-terms";

export const legal: typeof en = {
  updated: "Dernière mise à jour le 18 novembre 2026",
  newTab: " (s’ouvre dans un nouvel onglet)",
  terms: { title: "Conditions d’utilisation", sections: termsSections },
  privacy: { title: "Confidentialité", sections: privacySections },
};
