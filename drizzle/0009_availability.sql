CREATE TABLE "days_off" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "days_off_range" CHECK ("days_off"."ends_on" >= "days_off"."starts_on" and "days_off"."ends_on" - "days_off"."starts_on" < 366)
);
--> statement-breakpoint
ALTER TABLE "days_off" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "practitioner_hours" (
	"membership_id" uuid PRIMARY KEY NOT NULL,
	"clinic_id" uuid NOT NULL,
	"weekly_hours" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "practitioner_hours_days" CHECK (jsonb_typeof("practitioner_hours"."weekly_hours") = 'object' and "practitioner_hours"."weekly_hours" ?& array['mon','tue','wed','thu','fri','sat','sun'])
);
--> statement-breakpoint
ALTER TABLE "practitioner_hours" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "days_off" ADD CONSTRAINT "days_off_membership_fk" FOREIGN KEY ("clinic_id","membership_id") REFERENCES "public"."memberships"("clinic_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practitioner_hours" ADD CONSTRAINT "practitioner_hours_membership_fk" FOREIGN KEY ("clinic_id","membership_id") REFERENCES "public"."memberships"("clinic_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "days_off_membership_idx" ON "days_off" USING btree ("membership_id","ends_on");--> statement-breakpoint
CREATE POLICY "days_off_select" ON "days_off" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from public.memberships m
    where m.id = "days_off"."membership_id" and m.clinic_id = "days_off"."clinic_id"
      and m.user_id = (select auth.uid()) and m.role = 'practitioner') or private.has_role("days_off"."clinic_id", array['owner']));--> statement-breakpoint
CREATE POLICY "days_off_insert_self" ON "days_off" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (select 1 from public.memberships m
    where m.id = "days_off"."membership_id" and m.clinic_id = "days_off"."clinic_id"
      and m.user_id = (select auth.uid()) and m.role = 'practitioner'));--> statement-breakpoint
CREATE POLICY "days_off_delete_self" ON "days_off" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (select 1 from public.memberships m
    where m.id = "days_off"."membership_id" and m.clinic_id = "days_off"."clinic_id"
      and m.user_id = (select auth.uid()) and m.role = 'practitioner'));--> statement-breakpoint
CREATE POLICY "practitioner_hours_select" ON "practitioner_hours" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from public.memberships m
    where m.id = "practitioner_hours"."membership_id" and m.clinic_id = "practitioner_hours"."clinic_id"
      and m.user_id = (select auth.uid()) and m.role = 'practitioner') or private.has_role("practitioner_hours"."clinic_id", array['owner']));--> statement-breakpoint
CREATE POLICY "practitioner_hours_insert_self" ON "practitioner_hours" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (select 1 from public.memberships m
    where m.id = "practitioner_hours"."membership_id" and m.clinic_id = "practitioner_hours"."clinic_id"
      and m.user_id = (select auth.uid()) and m.role = 'practitioner'));--> statement-breakpoint
CREATE POLICY "practitioner_hours_update_self" ON "practitioner_hours" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (select 1 from public.memberships m
    where m.id = "practitioner_hours"."membership_id" and m.clinic_id = "practitioner_hours"."clinic_id"
      and m.user_id = (select auth.uid()) and m.role = 'practitioner')) WITH CHECK (exists (select 1 from public.memberships m
    where m.id = "practitioner_hours"."membership_id" and m.clinic_id = "practitioner_hours"."clinic_id"
      and m.user_id = (select auth.uid()) and m.role = 'practitioner'));