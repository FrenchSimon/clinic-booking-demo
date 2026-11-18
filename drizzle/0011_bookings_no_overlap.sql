-- Checklist #7: two patients can never book the same physio at the same
-- time. The app checks free slots first, but two requests can pass that
-- check together; this constraint makes Postgres refuse the second insert
-- (SQLSTATE 23P01), whatever the timing.
-- Ranges are [start, end): a session ending at 10:00 does not overlap one
-- starting at 10:00. Expired, cancelled and refunded bookings free the slot.
-- btree_gist lets one GiST index compare the physio (=) and the range (&&).

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (
    "membership_id" WITH =,
    tstzrange("starts_at", "ends_at", '[)') WITH &&
  )
  WHERE ("status" IN ('pending_payment', 'confirmed'));
