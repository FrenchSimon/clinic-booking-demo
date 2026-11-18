-- Checklist #21: no real email leaves a demo clinic. A demo clinic is one
-- created by an anonymous visitor ("Try the demo", R5.1). Every email queued
-- for it is stored as "held" instead of "pending", and deliverEmail() only
-- sends pending emails, so nothing in the app can send it. Addresses under
-- the reserved .example domain (the demo's made-up team and patients, and an
-- anonymous visitor booking as a patient) are held too, wherever they come
-- from. Done in the database so no code path can forget it.
CREATE OR REPLACE FUNCTION private.is_demo_clinic(clinic uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.clinics c
    JOIN auth.users u ON u.id = c.created_by
    WHERE c.id = clinic AND u.is_anonymous
  );
END;
$$;
--> statement-breakpoint
-- The visitor who started this demo clinic, whatever role "View as" (R5.2)
-- gave them since: they read its Outbox as owner, practitioner or patient.
CREATE OR REPLACE FUNCTION private.is_demo_visitor(clinic uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.clinics c
    JOIN auth.users u ON u.id = c.created_by
    WHERE c.id = clinic AND c.created_by = auth.uid() AND u.is_anonymous
  );
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION private.hold_demo_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF private.is_demo_clinic(NEW.clinic_id)
    OR lower(NEW.to_email) LIKE '%.example' THEN
    NEW.status := 'held';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION private.is_demo_clinic(uuid) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION private.is_demo_visitor(uuid) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION private.hold_demo_email() FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION private.is_demo_visitor(uuid) TO authenticated;
--> statement-breakpoint
CREATE TRIGGER emails_hold_demo
  BEFORE INSERT ON public.emails
  FOR EACH ROW EXECUTE FUNCTION private.hold_demo_email();
--> statement-breakpoint
CREATE POLICY "emails_select_demo_visitor" ON "emails" AS PERMISSIVE FOR SELECT TO "authenticated" USING (private.is_demo_visitor("emails"."clinic_id"));
