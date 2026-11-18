import { AuthShell } from "@/features/auth/components/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

// Reached from the email link, which signs the user in for this step.
// The proxy sends visitors without a session to /login, and the action checks again.
export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" intro="Use at least 8 characters.">
      <ResetPasswordForm />
    </AuthShell>
  );
}
