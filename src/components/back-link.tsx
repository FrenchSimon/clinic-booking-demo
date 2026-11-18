import { ChevronLeft } from "lucide-react";
import Link from "next/link";

/** "‹ All your bookings": the way back, top left, above the page's content. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="-ml-1.5 flex min-h-11 items-center gap-1 self-start pr-2 font-semibold text-primary"
    >
      <ChevronLeft aria-hidden className="size-5" />
      {label}
    </Link>
  );
}
