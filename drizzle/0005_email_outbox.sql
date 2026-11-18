CREATE TYPE "public"."email_kind" AS ENUM('practitioner_invite', 'booking_confirmation', 'booking_reminder', 'booking_cancellation');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('pending', 'sending', 'sent', 'failed', 'held');--> statement-breakpoint
CREATE TABLE "emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"kind" "email_kind" NOT NULL,
	"dedupe_key" text NOT NULL,
	"to_email" text NOT NULL,
	"subject" text NOT NULL,
	"html" text NOT NULL,
	"text" text NOT NULL,
	"status" "email_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"provider_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	CONSTRAINT "emails_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
ALTER TABLE "emails" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "emails_clinic_created_idx" ON "emails" USING btree ("clinic_id","created_at");--> statement-breakpoint
CREATE INDEX "emails_status_idx" ON "emails" USING btree ("status");--> statement-breakpoint
CREATE POLICY "emails_select_owner" ON "emails" AS PERMISSIVE FOR SELECT TO "authenticated" USING (private.has_role("emails"."clinic_id", array['owner']));--> statement-breakpoint
CREATE POLICY "emails_insert_owner" ON "emails" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.has_role("emails"."clinic_id", array['owner']));