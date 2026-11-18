import { Button } from "@/components/ui/button";
import { logOut } from "../actions";

export function LogoutButton() {
  return (
    <form action={logOut}>
      <Button type="submit" variant="outline" className="min-h-11">
        Log out
      </Button>
    </form>
  );
}
