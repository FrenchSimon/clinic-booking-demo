import { privacySections } from "./legal-privacy";
import { termsSections } from "./legal-terms";

export const legal = {
  /** Last time the terms or the privacy notice changed. */
  updated: "Last updated on 18 November 2026",
  newTab: " (opens in a new tab)",
  terms: { title: "Terms of use", sections: termsSections },
  privacy: { title: "Privacy", sections: privacySections },
};
