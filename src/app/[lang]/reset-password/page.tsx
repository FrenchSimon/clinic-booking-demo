import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.auth.reset.title}${t.meta.suffix}` };
}

// Reached from the email link, which signs the user in for this step.
// The proxy sends visitors without a session to /login, and the action checks again.
export default async function ResetPasswordPage() {
  const { t } = await getDictionary();
  return (
    <AuthShell title={t.auth.reset.title} intro={t.auth.reset.intro}>
      <ResetPasswordForm t={{ fields: t.auth.fields, reset: t.auth.reset }} />
    </AuthShell>
  );
}
