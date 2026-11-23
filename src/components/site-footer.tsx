import Link from "next/link";
import { getDictionary } from "@/i18n/server";

/** Footer of every page: the legal pages, reachable from anywhere. */
export async function SiteFooter() {
  const { t } = await getDictionary();
  return (
    <footer className="border-t">
      <nav
        aria-label={t.footer.label}
        className="mx-auto flex w-full max-w-5xl items-center justify-center gap-6 px-4 py-2 text-muted-foreground text-sm sm:px-8"
      >
        <Link
          href="/terms"
          className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
        >
          {t.footer.terms}
        </Link>
        <Link
          href="/privacy"
          className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
        >
          {t.footer.privacy}
        </Link>
      </nav>
    </footer>
  );
}
