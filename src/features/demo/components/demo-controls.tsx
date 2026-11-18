import { getUser } from "@/server/auth";
import { getDemoRole } from "../queries";
import { TryDemoButton } from "./try-demo-button";
import { ViewAsSwitch } from "./view-as-switch";

/**
 * The demo part of the portfolio bar: "View as" for a visitor inside their
 * demo clinic (#20), "Try the demo" for everyone else (#19).
 */
export async function DemoControls() {
  const user = await getUser();
  const role = user?.is_anonymous ? await getDemoRole(user.id) : null;
  return role ? <ViewAsSwitch current={role} /> : <TryDemoButton />;
}
