import type { Metadata } from "next";
import Link from "next/link";
import { StatusPage } from "@/components/status-page";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found · Kinora" };

// Any address that matches no page, and every notFound() without a closer
// not-found file: an unknown booking, service or invitation.
export default function NotFound() {
  return (
    <StatusPage
      label="Page not found"
      title="This page does not exist"
      actions={
        <>
          <Link href="/" className={buttonVariants({ size: "lg" })}>
            Go to the home page
          </Link>
          <Link
            href="/bookings"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Your bookings
          </Link>
        </>
      }
    >
      <p>
        The address may be mistyped, or the page is no longer here. Nothing has
        changed on your side: your bookings and payments are safe.
      </p>
    </StatusPage>
  );
}
