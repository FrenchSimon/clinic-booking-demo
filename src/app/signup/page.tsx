import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignupForm } from "@/features/auth/components/signup-form";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      intro="Use at least 8 characters for the password."
    >
      <SignupForm />
    </AuthShell>
  );
}
