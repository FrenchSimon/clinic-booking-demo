import type { auth as en } from "../en/auth";
import { invite } from "./auth-invite";

export const auth: typeof en = {
  fields: {
    email: "E-mail",
    password: "Mot de passe",
    newPassword: "Nouveau mot de passe",
  },
  login: {
    title: "Connexion",
    linkError:
      "Ce lien n’est pas valide ou a expiré. Connectez-vous ou demandez-en un nouveau.",
    forgot: "Mot de passe oublié\u202f?",
    submit: "Se connecter",
    pending: "Connexion…",
    noAccount: "Pas encore de compte\u202f?",
    signUp: "Créer un compte",
  },
  signup: {
    title: "Créez votre compte",
    intro: "Choisissez un mot de passe d’au moins 8 caractères.",
    submit: "Créer le compte",
    pending: "Création du compte…",
    haveAccount: "Vous avez déjà un compte\u202f?",
    logIn: "Se connecter",
    termsBefore: "J’accepte les ",
    termsLink: "conditions d’utilisation",
    termsMiddle: " et la ",
    privacyLink: "politique de confidentialité",
    termsAfter: ".",
    newTab: " (s’ouvre dans un nouvel onglet)",
  },
  forgot: {
    title: "Mot de passe oublié\u202f?",
    intro:
      "Indiquez votre adresse e-mail\u00a0: nous vous enverrons un lien pour en choisir un nouveau.",
    submit: "Envoyer le lien",
    pending: "Envoi…",
    back: "Retour à la connexion",
  },
  reset: {
    title: "Choisissez un nouveau mot de passe",
    intro: "Au moins 8 caractères.",
    submit: "Enregistrer le mot de passe",
    pending: "Enregistrement…",
  },
  logOut: "Déconnexion",
  errors: {
    tooMany: "Trop de tentatives. Patientez une minute, puis réessayez.",
    notConfirmed:
      "Confirmez d’abord votre adresse e-mail\u00a0: ouvrez le lien que nous vous avons envoyé.",
    wrongCredentials: "E-mail ou mot de passe incorrect.",
    signUpFailed:
      "Nous n’avons pas pu créer le compte. Réessayez dans un instant.",
    samePassword: "Choisissez un mot de passe que vous n’avez jamais utilisé.",
    updateFailed:
      "Nous n’avons pas pu modifier le mot de passe. Demandez un nouveau lien, puis réessayez.",
  },
  messages: {
    confirmSent:
      "Plus qu’une étape\u00a0: nous avons envoyé un lien de confirmation à {email}.",
    resetSent:
      "Si un compte existe pour {email}, nous y avons envoyé un lien pour choisir un nouveau mot de passe.",
  },
  validation: {
    emailInvalid: "Indiquez une adresse e-mail valide",
    passwordShort: "Utilisez au moins 8 caractères",
    passwordLong: "Utilisez 72 caractères au maximum",
    passwordMissing: "Indiquez votre mot de passe",
    termsRequired: "Acceptez les conditions pour créer un compte",
  },
  invite,
};
