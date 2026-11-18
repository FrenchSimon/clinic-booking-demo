import Link from "next/link";
import { getUser } from "@/server/auth";
import { getDemoRole } from "../queries";
import { TryDemoButton } from "./try-demo-button";
import { ViewAsSwitch } from "./view-as-switch";

/**
 * The demo part of the portfolio bar: the Outbox (#21) and "View as" (#20)
 * for a visitor inside their demo clinic, "Try the demo" for everyone else
 * (#19).
 */
export async function DemoControls() {
  const user = await getUser();
  const role = user?.is_anonymous ? await getDemoRole(user.id) : null;
  if (!role) return <TryDemoButton />;
  return (
    <>
      <Link
        href="/outbox"
        className="inline-flex min-h-11 items-center font-semibold text-demo-foreground underline underline-offset-4"
      >
        Outbox
      </Link>
      <ViewAsSwitch current={role} />
    </>
  );
}
