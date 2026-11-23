import { ArrowUpRight } from "lucide-react";
import { Suspense } from "react";
import { DemoControls } from "@/features/demo/components/demo-controls";
import { getDictionary } from "@/i18n/server";
import { LanguageSwitch } from "./language-switch";

const SOURCE_CODE = "https://github.com/FrenchSimon/clinic-booking-demo";

/**
 * Dark bar above every page, for people evaluating this demo. It frames the
 * product without being part of it: Kinora and Maison Tilleul are fictional.
 * Two lines at every width (DESIGN.md): what this is with the language
 * switch, then "Read the code" and the demo controls, which depend on who is
 * signed in and so stream in after the rest of the page.
 */
export async function PortfolioBar() {
  const { locale, t } = await getDictionary();
  return (
    <aside
      aria-label={t.bar.label}
      className="bg-demo text-demo-foreground text-sm"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 pt-0.5 pb-1.5 sm:px-8">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <p className="text-demo-muted">{t.bar.title}</p>
          <LanguageSwitch current={locale} label={t.bar.languages} />
        </div>
        <div className="flex flex-wrap items-center gap-x-1.5 sm:gap-x-3">
          <a
            href={SOURCE_CODE}
            target="_blank"
            rel="noopener noreferrer"
            className="mr-auto inline-flex min-h-11 items-center gap-1 font-semibold text-demo-foreground underline underline-offset-4"
          >
            {t.bar.readCode}
            {/* The arrow says the link leaves the site; screen readers get the text. */}
            <ArrowUpRight aria-hidden="true" className="size-4" />
            <span className="sr-only">{t.bar.newTab}</span>
          </a>
          <Suspense fallback={null}>
            <DemoControls t={t.bar} />
          </Suspense>
        </div>
      </div>
    </aside>
  );
}
