import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { getUser } from "@/server/auth";

// Temporary home page: the real one comes with the design (R1.8) and the public clinic page (R2.5).
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-semibold text-2xl">Kinora</h1>
        <p className="text-muted-foreground">
          Online booking for small physiotherapy clinics.
        </p>
      </div>
      <Suspense fallback={null}>
        <AccountStatus />
      </Suspense>
    </main>
  );
}

async function AccountStatus() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login"
          className={buttonVariants({ className: "min-h-11" })}
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className={buttonVariants({
            variant: "outline",
            className: "min-h-11",
          })}
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">Signed in as {user.email}</p>
      <LogoutButton />
    </div>
  );
}
