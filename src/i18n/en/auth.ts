import { invite } from "./auth-invite";

// Log in, sign up, password reset, and the Zod messages of their forms.

export const auth = {
  fields: {
    email: "Email",
    password: "Password",
    newPassword: "New password",
  },
  login: {
    title: "Log in",
    linkError:
      "That link is invalid or has expired. Log in or ask for a new one.",
    forgot: "Forgot your password?",
    submit: "Log in",
    pending: "Logging in…",
    noAccount: "No account yet?",
    signUp: "Sign up",
  },
  signup: {
    title: "Create your account",
    intro: "Use at least 8 characters for the password.",
    submit: "Create account",
    pending: "Creating your account…",
    haveAccount: "Already have an account?",
    logIn: "Log in",
    termsBefore: "I accept the ",
    termsLink: "terms of use",
    termsMiddle: " and the ",
    privacyLink: "privacy notice",
    termsAfter: ".",
    newTab: " (opens in a new tab)",
  },
  forgot: {
    title: "Forgot your password?",
    intro: "Enter your email and we will send you a link to choose a new one.",
    submit: "Send the link",
    pending: "Sending…",
    back: "Back to log in",
  },
  reset: {
    title: "Choose a new password",
    intro: "Use at least 8 characters.",
    submit: "Save the new password",
    pending: "Saving…",
  },
  logOut: "Log out",
  errors: {
    tooMany: "Too many attempts. Wait a minute and try again.",
    notConfirmed: "Confirm your email first: open the link we sent you.",
    wrongCredentials: "Email or password is incorrect.",
    signUpFailed: "We could not create the account. Try again in a moment.",
    samePassword: "Choose a password you have not used before.",
    updateFailed:
      "We could not update the password. Ask for a new link and try again.",
  },
  messages: {
    confirmSent: "Almost there: we sent a confirmation link to {email}.",
    resetSent:
      "If an account exists for {email}, we sent a link to choose a new password.",
  },
  validation: {
    emailInvalid: "Enter a valid email address",
    passwordShort: "Use at least 8 characters",
    passwordLong: "Use 72 characters or fewer",
    passwordMissing: "Enter your password",
    termsRequired: "Accept the terms to create an account",
  },
  invite,
};
