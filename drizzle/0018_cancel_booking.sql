ALTER TABLE "bookings" ADD COLUMN "cancelled_at" timestamp with time zone;
--> statement-breakpoint
-- Checklist #12: a patient cancels a paid booking up to 24 hours before the
-- session. Nobody updates a booking as themselves (no write policy, see
-- table.ts): this function is the only way, and the 24-hour rule is checked
-- here, on the database's clock, whatever the page showed. The cancelled
-- booking frees the slot at once (drizzle/0011 only counts held and paid
-- bookings). It returns the payment to refund; the app then refunds it with
-- Stripe and marks the booking refunded. Called again on a booking the
-- patient cancelled whose refund did not go through, it returns the same
-- payment so the refund can be tried again. Errors are stable codes the app
-- turns into messages.
CREATE OR REPLACE FUNCTION private.cancel_booking(booking uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  b public.bookings;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_signed_in' USING ERRCODE = 'P0001';
  END IF;

  -- Locks the row: two clicks cancel one at a time.
  SELECT * INTO b FROM public.bookings
  WHERE id = booking AND patient_id = auth.uid()
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0001';
  END IF;

  IF b.status = 'cancelled' AND b.cancelled_at IS NOT NULL
    AND b.stripe_payment_intent_id IS NOT NULL THEN
    RETURN b.stripe_payment_intent_id;
  END IF;
  IF b.status <> 'confirmed' OR b.stripe_payment_intent_id IS NULL THEN
    RAISE EXCEPTION 'not_cancellable' USING ERRCODE = 'P0001';
  END IF;
  IF b.starts_at - interval '24 hours' < now() THEN
    RAISE EXCEPTION 'too_late' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.bookings SET status = 'cancelled', cancelled_at = now()
  WHERE id = b.id;
  RETURN b.stripe_payment_intent_id;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION private.cancel_booking(uuid) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION private.cancel_booking(uuid) TO authenticated;
