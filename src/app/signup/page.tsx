import { Suspense } from "react";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignupForm } from "@/features/auth/components/signup-form";
import { safeNext } from "@/features/auth/schema";

export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  return (
    <AuthShell
      title="Create your account"
      intro="Use at least 8 characters for the password."
    >
      <Suspense fallback={null}>
        {searchParams.then((params) => (
          <SignupForm next={safeNext(params.next, "/clinic")} />
        ))}
      </Suspense>
    </AuthShell>
  );
}
