import Link from "next/link";
import type { ReactNode } from "react";

/** Common frame of the auth pages: the Kinora logo and a white card on the oat background. */
export function AuthShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-4 py-8 sm:py-16">
      <Link
        href="/"
        className="font-heading font-semibold text-2xl text-primary"
      >
        Kinora
      </Link>
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-[18px] border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading font-normal text-3xl">{title}</h1>
          {intro && <p className="text-muted-foreground text-sm">{intro}</p>}
        </div>
        {children}
      </div>
    </main>
  );
}
