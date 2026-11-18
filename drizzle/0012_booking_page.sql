-- The public booking page is open to visitors who are not signed in. Row
-- level security gives them nothing, and an "anon" policy would expose the
-- tables through the Supabase Data API. These two SECURITY DEFINER
-- functions return only what the page shows: no patient, no email, and
-- bookings only as busy time ranges. They live in "private", which the
-- Data API does not expose, so only the app's server calls them.

-- The clinic, its bookable services and the physios who can be booked: a
-- service shows when it is active and at least one physio who offers it has
-- saved their hours.
CREATE OR REPLACE FUNCTION private.booking_page(clinic_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH bookable AS (
    SELECT sp.service_id, sp.membership_id
    FROM public.service_practitioners sp
    JOIN public.practitioner_hours ph ON ph.membership_id = sp.membership_id
  )
  SELECT jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'slug', c.slug,
    'address', c.address,
    'openingHours', c.opening_hours,
    'services', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'durationMinutes', s.duration_minutes,
        'priceCents', s.price_cents,
        'physioIds', (SELECT jsonb_agg(b.membership_id ORDER BY b.membership_id)
                      FROM bookable b WHERE b.service_id = s.id)
      ) ORDER BY s.name)
      FROM public.services s
      WHERE s.clinic_id = c.id AND s.active
        AND EXISTS (SELECT 1 FROM bookable b WHERE b.service_id = s.id)
    ), '[]'::jsonb),
    'physios', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', m.id,
        'name', coalesce(m.display_name, 'Physio')
      ) ORDER BY m.display_name)
      FROM public.memberships m
      WHERE m.clinic_id = c.id AND m.role = 'practitioner'
        AND EXISTS (SELECT 1 FROM bookable b WHERE b.membership_id = m.id)
    ), '[]'::jsonb)
  )
  FROM public.clinics c
  WHERE c.slug = clinic_slug;
$$;
--> statement-breakpoint
-- What the free-slot calculation (R2.3) needs between two instants: each
-- physio's hours and days off, and the time their bookings take. A hold
-- whose 15 minutes have passed no longer counts.
CREATE OR REPLACE FUNCTION private.booking_availability(
  clinic uuid,
  range_start timestamptz,
  range_end timestamptz
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'schedules', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'membershipId', ph.membership_id,
        'weeklyHours', ph.weekly_hours,
        'daysOff', coalesce((
          SELECT jsonb_agg(jsonb_build_object(
            'startsOn', d.starts_on, 'endsOn', d.ends_on))
          FROM public.days_off d
          WHERE d.membership_id = ph.membership_id
            AND d.ends_on >= (range_start AT TIME ZONE 'Europe/Brussels')::date
            AND d.starts_on <= (range_end AT TIME ZONE 'Europe/Brussels')::date
        ), '[]'::jsonb)
      ))
      FROM public.practitioner_hours ph
      WHERE ph.clinic_id = clinic
    ), '[]'::jsonb),
    'busy', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'membershipId', b.membership_id,
        'startsAt', b.starts_at,
        'endsAt', b.ends_at
      ))
      FROM public.bookings b
      WHERE b.clinic_id = clinic
        AND b.starts_at < range_end AND b.ends_at > range_start
        AND (b.status = 'confirmed'
          OR (b.status = 'pending_payment' AND b.hold_expires_at > now()))
    ), '[]'::jsonb)
  );
$$;
--> statement-breakpoint
GRANT USAGE ON SCHEMA private TO anon;
--> statement-breakpoint
REVOKE ALL ON FUNCTION private.booking_page(text) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION private.booking_availability(uuid, timestamptz, timestamptz) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION private.booking_page(text) TO anon, authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION private.booking_availability(uuid, timestamptz, timestamptz) TO anon, authenticated;
