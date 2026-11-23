import { AuthShell } from "@/features/auth/components/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      intro="Enter your email and we will send you a link to choose a new one."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
