-- The physio's agenda (checklist #17) shows who comes to each session. A
-- patient has no name in the app, only the email of their account, and
-- auth.users is not readable through row level security. This SECURITY
-- DEFINER function returns the email of each patient who has a booking with
-- the calling physio in this clinic, and nobody else's: the sessions
-- themselves are still read through the bookings policy.

CREATE OR REPLACE FUNCTION private.agenda_patients(clinic uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'userId', u.id,
    'email', u.email
  ) ORDER BY u.email), '[]'::jsonb)
  FROM auth.users u
  WHERE u.id IN (
    SELECT b.patient_id FROM public.bookings b
    JOIN public.memberships m ON m.id = b.membership_id
    WHERE b.clinic_id = clinic
      AND m.clinic_id = clinic
      AND m.user_id = (SELECT auth.uid())
      AND m.role IN ('owner', 'practitioner'));
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION private.agenda_patients(uuid) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION private.agenda_patients(uuid) TO authenticated;
