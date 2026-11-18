import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import { PortfolioBar } from "@/components/portfolio-bar";
import "./globals.css";

// Fonts from DESIGN.md: Newsreader for headings and numbers, Inter for the interface.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Kinora",
  description:
    "Online booking for small physiotherapy clinics: book, pay, cancel with a refund and get a reminder.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PortfolioBar />
        {children}
      </body>
    </html>
  );
}
