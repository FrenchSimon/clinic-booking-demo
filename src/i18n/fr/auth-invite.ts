import type { invite as en } from "../en/auth-invite";

export const invite: typeof en = {
  title: "Vous êtes invité",
  signedOut:
    "Un cabinet vous invite à rejoindre Kinora en tant que kiné. Créez votre compte, ou connectez-vous, avec l’adresse e-mail qui a reçu l’invitation.",
  createAccount: "Créer mon compte",
  haveAccount: "J’ai déjà un compte",
  notValid: "Ce lien d’invitation n’est pas valide.",
  expired:
    "Cette invitation de {clinic} a expiré. Demandez au cabinet de vous en envoyer une nouvelle.",
  accepted: "Cette invitation de {clinic} a déjà été acceptée.",
  goToClinic: "Aller à mon cabinet",
  otherEmail:
    "Cette invitation a été envoyée à {invited}, mais vous êtes connecté avec {current}. Déconnectez-vous, puis connectez-vous avec l’adresse invitée.",
  open: "{clinic} vous invite à rejoindre son équipe en tant que kiné. Vous verrez vos séances dans votre propre agenda.",
  join: "Rejoindre {clinic}",
  joining: "Un instant…",
  errors: {
    invitation_not_found: "Ce lien d’invitation n’est pas valide.",
    invitation_used:
      "Cette invitation a déjà été acceptée par un autre compte.",
    invitation_expired:
      "Cette invitation a expiré. Demandez au cabinet de vous en envoyer une nouvelle.",
    invitation_email_mismatch:
      "Cette invitation a été envoyée à une autre adresse e-mail. Déconnectez-vous, puis connectez-vous avec cette adresse.",
  },
};
