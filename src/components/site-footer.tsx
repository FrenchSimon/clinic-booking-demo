import Link from "next/link";

/** Footer of every page: the legal pages, reachable from anywhere. */
export function SiteFooter() {
  return (
    <footer className="border-t">
      <nav
        aria-label="Legal"
        className="mx-auto flex w-full max-w-5xl items-center justify-center gap-6 px-4 py-2 text-muted-foreground text-sm sm:px-8"
      >
        <Link
          href="/terms"
          className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
        >
          Terms
        </Link>
        <Link
          href="/privacy"
          className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
        >
          Privacy
        </Link>
      </nav>
    </footer>
  );
}
