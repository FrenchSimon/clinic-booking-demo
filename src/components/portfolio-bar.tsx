import { ArrowUpRight } from "lucide-react";
import { Suspense } from "react";
import { DemoControls } from "@/features/demo/components/demo-controls";

const SOURCE_CODE = "https://github.com/FrenchSimon/clinic-booking-demo";

/**
 * Thin bar above every page, for people evaluating this demo. It frames the
 * product without being part of it: Kinora and Maison Tilleul are fictional.
 * "Try the demo" opens the visitor's own demo clinic (R5.1); inside it, the
 * "View as" switch takes its place (R5.2). It depends on who is signed in,
 * so it streams in after the rest of the page.
 */
export function PortfolioBar() {
  return (
    <aside
      aria-label="About this demo"
      className="bg-demo text-demo-foreground text-sm"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 px-4 sm:gap-x-6 sm:px-8">
        <p className="mr-auto py-2 text-demo-muted">
          Portfolio demo
          <span className="hidden sm:inline"> · fictional clinic</span>
        </p>
        <Suspense fallback={null}>
          <DemoControls />
        </Suspense>
        <a
          href={SOURCE_CODE}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1 font-semibold text-demo-foreground underline underline-offset-4"
        >
          Read the code
          {/* The arrow says the link leaves the site; screen readers get the text. */}
          <ArrowUpRight aria-hidden="true" className="size-4" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </aside>
  );
}
