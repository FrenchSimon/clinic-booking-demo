ALTER TABLE "clinics" ADD COLUMN "address" text NOT NULL;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "opening_hours" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_opening_hours_days" CHECK (jsonb_typeof("clinics"."opening_hours") = 'object' and "clinics"."opening_hours" ?& array['mon','tue','wed','thu','fri','sat','sun']);