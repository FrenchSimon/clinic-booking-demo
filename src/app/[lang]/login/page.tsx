import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeNext } from "@/features/auth/schema";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.auth.login.title}${t.meta.suffix}` };
}

export default async function LoginPage({
  searchParams,
}: PageProps<"/[lang]/login">) {
  const { t } = await getDictionary();
  return (
    <AuthShell title={t.auth.login.title}>
      <Suspense fallback={null}>
        {searchParams.then((params) => (
          <LoginForm
            next={safeNext(params.next, "/start")}
            error={params.error === "link" ? t.auth.login.linkError : undefined}
            t={{ fields: t.auth.fields, login: t.auth.login }}
          />
        ))}
      </Suspense>
    </AuthShell>
  );
}
