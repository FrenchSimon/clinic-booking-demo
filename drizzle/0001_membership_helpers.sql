-- Helpers for row level security policies. They read public.memberships
-- (created in the next migration) as SECURITY DEFINER, so a policy on
-- memberships can call them without querying itself in a loop.
-- plpgsql: the body is only checked when called, after the table exists.

CREATE OR REPLACE FUNCTION private.is_member(clinic uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.clinic_id = clinic AND m.user_id = auth.uid()
  );
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION private.has_role(clinic uuid, roles text[])
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.clinic_id = clinic
      AND m.user_id = auth.uid()
      AND m.role::text = ANY (roles)
  );
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION private.is_member(uuid) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION private.has_role(uuid, text[]) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION private.is_member(uuid) TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION private.has_role(uuid, text[]) TO authenticated;
