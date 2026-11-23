import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import { PortfolioBar } from "@/components/portfolio-bar";
import { SiteFooter } from "@/components/site-footer";
import { LocaleProvider } from "@/i18n/client";
import { LOCALES } from "@/i18n/locale";
import { getDictionary, getLocale } from "@/i18n/server";
import "../globals.css";

// Fonts from DESIGN.md: Newsreader for headings and numbers, Inter for the interface.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  axes: ["opsz"],
});

// One prerender per language: the proxy picks it from the `lang` cookie.
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.meta.title, description: t.meta.description };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${inter.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider locale={locale}>
          <PortfolioBar />
          {children}
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
