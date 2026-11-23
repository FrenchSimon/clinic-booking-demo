import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignupForm } from "@/features/auth/components/signup-form";
import { safeNext } from "@/features/auth/schema";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.auth.signup.title}${t.meta.suffix}` };
}

export default async function SignupPage({
  searchParams,
}: PageProps<"/[lang]/signup">) {
  const { t } = await getDictionary();
  return (
    <AuthShell title={t.auth.signup.title} intro={t.auth.signup.intro}>
      <Suspense fallback={null}>
        {searchParams.then((params) => (
          <SignupForm
            next={safeNext(params.next, "/start")}
            t={{ fields: t.auth.fields, signup: t.auth.signup }}
          />
        ))}
      </Suspense>
    </AuthShell>
  );
}
