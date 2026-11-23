import { notFound } from "next/navigation";

// With the root layout under [lang], an address that matches no page needs
// a route of its own to show not-found.tsx inside the layout. Nothing to
// navigate to instantly: it is a 404.
export const instant = false;

export default function Missing() {
  notFound();
}
