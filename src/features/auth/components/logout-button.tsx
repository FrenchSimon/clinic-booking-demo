import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n/server";
import { logOut } from "../actions";

export async function LogoutButton() {
  const { t } = await getDictionary();
  return (
    <form action={logOut}>
      <Button type="submit" variant="outline">
        {t.auth.logOut}
      </Button>
    </form>
  );
}
