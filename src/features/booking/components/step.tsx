import type { ReactNode } from "react";

/** One numbered step of the booking page: "1 · Session". */
export function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  const id = `step-${number}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h2
        id={id}
        className="font-semibold text-oak text-sm uppercase tracking-[0.08em]"
      >
        {number} · {title}
      </h2>
      {children}
    </section>
  );
}
