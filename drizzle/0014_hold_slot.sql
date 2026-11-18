-- Checklist #9: a slot is held for 15 minutes while the patient pays.
-- Nobody inserts a booking as themselves (no write policy, see table.ts):
-- this function is the only way in. It takes the price and the length from
-- the service, never from the caller, and the exclusion constraint
-- (drizzle/0011) still refuses an overlap. The app checks the physio's hours
-- with freeSlots() before calling it. Errors are stable codes the app turns
-- into messages.
CREATE OR REPLACE FUNCTION private.hold_slot(
  service uuid,
  physio uuid,
  starts timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  s public.services;
  booking_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_signed_in' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO s FROM public.services WHERE id = service AND active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'service_unavailable' USING ERRCODE = 'P0001';
  END IF;
  -- The physio gives this service and has saved their hours.
  IF NOT EXISTS (
    SELECT 1 FROM public.service_practitioners sp
    JOIN public.practitioner_hours ph ON ph.membership_id = sp.membership_id
    WHERE sp.service_id = service AND sp.membership_id = physio
  ) THEN
    RAISE EXCEPTION 'physio_unavailable' USING ERRCODE = 'P0001';
  END IF;
  IF starts <= now() THEN
    RAISE EXCEPTION 'slot_in_past' USING ERRCODE = 'P0001';
  END IF;

  -- One hold per patient: a new choice replaces the previous one.
  UPDATE public.bookings SET status = 'expired'
  WHERE patient_id = auth.uid() AND status = 'pending_payment';
  -- Holds whose 15 minutes have passed free their slot.
  UPDATE public.bookings SET status = 'expired'
  WHERE membership_id = physio AND status = 'pending_payment'
    AND hold_expires_at <= now();

  -- The patient joins the clinic; staff who book for themselves keep their role.
  INSERT INTO public.memberships (clinic_id, user_id, role)
  VALUES (s.clinic_id, auth.uid(), 'patient')
  ON CONFLICT (clinic_id, user_id) DO NOTHING;

  INSERT INTO public.bookings (
    clinic_id, service_id, membership_id, patient_id,
    starts_at, ends_at, price_cents, status, hold_expires_at
  )
  VALUES (
    s.clinic_id, s.id, physio, auth.uid(),
    starts, starts + make_interval(mins => s.duration_minutes),
    s.price_cents, 'pending_payment', now() + interval '15 minutes'
  )
  RETURNING id INTO booking_id;
  RETURN booking_id;
END;
$$;
--> statement-breakpoint
-- Records the Stripe Checkout session of the patient's own live hold, once.
CREATE OR REPLACE FUNCTION private.attach_checkout(booking uuid, session text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.bookings SET stripe_checkout_session_id = session
  WHERE id = booking AND patient_id = auth.uid()
    AND status = 'pending_payment' AND stripe_checkout_session_id IS NULL;
  RETURN FOUND;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION private.hold_slot(uuid, uuid, timestamptz) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION private.attach_checkout(uuid, text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION private.hold_slot(uuid, uuid, timestamptz) TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION private.attach_checkout(uuid, text) TO authenticated;
