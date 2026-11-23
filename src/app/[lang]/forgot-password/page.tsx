import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.auth.forgot.title}${t.meta.suffix}` };
}

export default async function ForgotPasswordPage() {
  const { t } = await getDictionary();
  return (
    <AuthShell title={t.auth.forgot.title} intro={t.auth.forgot.intro}>
      <ForgotPasswordForm
        t={{ fields: t.auth.fields, forgot: t.auth.forgot }}
      />
    </AuthShell>
  );
}
