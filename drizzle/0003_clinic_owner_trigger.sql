-- Whoever creates a clinic becomes its owner, in the same transaction.
-- Done in the database so no code path can create a clinic without an owner.
-- SECURITY DEFINER: the new owner cannot insert memberships yet (only owners can).

CREATE OR REPLACE FUNCTION private.add_clinic_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.memberships (clinic_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION private.add_clinic_owner() FROM PUBLIC;
--> statement-breakpoint
CREATE TRIGGER clinics_add_owner
  AFTER INSERT ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION private.add_clinic_owner();
