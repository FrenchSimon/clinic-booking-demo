-- The owner's patient list (checklist #16). A patient has no name in the
-- app, only the email of their account, and auth.users is not readable
-- through row level security. This SECURITY DEFINER function returns the
-- clinic's patients with their email and paid sessions, to the clinic's
-- owner only: anyone else, physios included, gets an empty list.

CREATE OR REPLACE FUNCTION private.clinic_patients(clinic uuid, at timestamptz)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id,
    'email', u.email,
    'since', m.created_at,
    'pastSessions', (
      SELECT count(*) FROM public.bookings b
      WHERE b.clinic_id = clinic AND b.patient_id = m.user_id
        AND b.status = 'confirmed' AND b.starts_at < at),
    'lastSession', (
      SELECT max(b.starts_at) FROM public.bookings b
      WHERE b.clinic_id = clinic AND b.patient_id = m.user_id
        AND b.status = 'confirmed' AND b.starts_at < at),
    'nextSession', (
      SELECT min(b.starts_at) FROM public.bookings b
      WHERE b.clinic_id = clinic AND b.patient_id = m.user_id
        AND b.status = 'confirmed' AND b.starts_at >= at)
  ) ORDER BY u.email), '[]'::jsonb)
  FROM public.memberships m
  JOIN auth.users u ON u.id = m.user_id
  WHERE m.clinic_id = clinic AND m.role = 'patient'
    AND private.has_role(clinic, array['owner']);
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION private.clinic_patients(uuid, timestamptz) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION private.clinic_patients(uuid, timestamptz) TO authenticated;
