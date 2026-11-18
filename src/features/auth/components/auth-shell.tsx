import Link from "next/link";
import type { ReactNode } from "react";

/** Common frame of the auth pages. The real look comes with DESIGN.md (R1.8). */
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
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-10">
      <Link href="/" className="font-semibold">
        Kinora
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl">{title}</h1>
        {intro && <p className="text-muted-foreground text-sm">{intro}</p>}
      </div>
      {children}
    </main>
  );
}
