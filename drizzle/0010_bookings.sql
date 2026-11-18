CREATE TYPE "public"."booking_status" AS ENUM('pending_payment', 'confirmed', 'expired', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"price_cents" integer NOT NULL,
	"status" "booking_status" DEFAULT 'pending_payment' NOT NULL,
	"hold_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_time_order" CHECK ("bookings"."ends_at" > "bookings"."starts_at"),
	CONSTRAINT "bookings_price_range" CHECK ("bookings"."price_cents" between 50 and 100000),
	CONSTRAINT "bookings_hold_expiry" CHECK ("bookings"."status" <> 'pending_payment' or "bookings"."hold_expires_at" is not null)
);
--> statement-breakpoint
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_fk" FOREIGN KEY ("clinic_id","service_id") REFERENCES "public"."services"("clinic_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_membership_fk" FOREIGN KEY ("clinic_id","membership_id") REFERENCES "public"."memberships"("clinic_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_clinic_starts_idx" ON "bookings" USING btree ("clinic_id","starts_at");--> statement-breakpoint
CREATE INDEX "bookings_patient_idx" ON "bookings" USING btree ("patient_id");--> statement-breakpoint
CREATE POLICY "bookings_select" ON "bookings" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("bookings"."patient_id" = (select auth.uid())
        or exists (select 1 from public.memberships m
          where m.id = "bookings"."membership_id" and m.user_id = (select auth.uid()))
        or private.has_role("bookings"."clinic_id", array['owner']));