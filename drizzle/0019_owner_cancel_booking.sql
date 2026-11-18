-- Checklist #13: the clinic's owner cancels any paid booking of their clinic
-- with a full refund, whenever the session is. private.cancel_booking()
-- (drizzle/0018) stays the only way to cancel: it now accepts the owner as
-- well as the booking's patient, and keeps the 24-hour rule (#12) for the
-- patient only. Everything else is unchanged: the slot is free at once, the
-- payment to refund is returned, and called again on a cancelled booking
-- whose refund did not go through, it returns the same payment.
CREATE OR REPLACE FUNCTION private.cancel_booking(booking uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  b public.bookings;
  by_owner boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_signed_in' USING ERRCODE = 'P0001';
  END IF;

  -- Locks the row: two clicks, or the patient and the owner at the same
  -- time, cancel one at a time.
  SELECT * INTO b FROM public.bookings WHERE id = booking FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0001';
  END IF;
  by_owner := private.has_role(b.clinic_id, array['owner']);
  IF b.patient_id IS DISTINCT FROM auth.uid() AND NOT by_owner THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0001';
  END IF;

  IF b.status = 'cancelled' AND b.cancelled_at IS NOT NULL
    AND b.stripe_payment_intent_id IS NOT NULL THEN
    RETURN b.stripe_payment_intent_id;
  END IF;
  IF b.status <> 'confirmed' OR b.stripe_payment_intent_id IS NULL THEN
    RAISE EXCEPTION 'not_cancellable' USING ERRCODE = 'P0001';
  END IF;
  IF NOT by_owner AND b.starts_at - interval '24 hours' < now() THEN
    RAISE EXCEPTION 'too_late' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.bookings SET status = 'cancelled', cancelled_at = now()
  WHERE id = b.id;
  RETURN b.stripe_payment_intent_id;
END;
$$;
