import { Suspense } from "react";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeNext } from "@/features/auth/schema";

const LINK_ERROR =
  "That link is invalid or has expired. Log in or ask for a new one.";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthShell title="Log in">
      <Suspense fallback={null}>
        {searchParams.then((params) => (
          <LoginForm
            next={safeNext(params.next, "/clinic")}
            error={params.error === "link" ? LINK_ERROR : undefined}
          />
        ))}
      </Suspense>
    </AuthShell>
  );
}
