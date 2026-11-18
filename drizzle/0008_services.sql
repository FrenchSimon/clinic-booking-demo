CREATE TABLE "service_practitioners" (
	"clinic_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	CONSTRAINT "service_practitioners_service_id_membership_id_pk" PRIMARY KEY("service_id","membership_id")
);
--> statement-breakpoint
ALTER TABLE "service_practitioners" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"price_cents" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_clinic_id_unique" UNIQUE("clinic_id","id"),
	CONSTRAINT "services_duration_range" CHECK ("services"."duration_minutes" between 10 and 240 and "services"."duration_minutes" % 5 = 0),
	CONSTRAINT "services_price_range" CHECK ("services"."price_cents" between 50 and 100000)
);
--> statement-breakpoint
ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- Before the foreign key that references it.
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_clinic_id_unique" UNIQUE("clinic_id","id");--> statement-breakpoint
ALTER TABLE "service_practitioners" ADD CONSTRAINT "service_practitioners_service_fk" FOREIGN KEY ("clinic_id","service_id") REFERENCES "public"."services"("clinic_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_practitioners" ADD CONSTRAINT "service_practitioners_membership_fk" FOREIGN KEY ("clinic_id","membership_id") REFERENCES "public"."memberships"("clinic_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "services_clinic_name_unique" ON "services" USING btree ("clinic_id",lower("name"));--> statement-breakpoint
CREATE POLICY "service_practitioners_select_member" ON "service_practitioners" AS PERMISSIVE FOR SELECT TO "authenticated" USING (private.is_member("service_practitioners"."clinic_id"));--> statement-breakpoint
CREATE POLICY "service_practitioners_insert_owner" ON "service_practitioners" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.has_role("service_practitioners"."clinic_id", array['owner']) and exists (
        select 1 from public.memberships m
        where m.id = "service_practitioners"."membership_id" and m.role = 'practitioner'));--> statement-breakpoint
CREATE POLICY "service_practitioners_delete_owner" ON "service_practitioners" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.has_role("service_practitioners"."clinic_id", array['owner']));--> statement-breakpoint
CREATE POLICY "services_select_member" ON "services" AS PERMISSIVE FOR SELECT TO "authenticated" USING (private.is_member("services"."clinic_id"));--> statement-breakpoint
CREATE POLICY "services_insert_owner" ON "services" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.has_role("services"."clinic_id", array['owner']));--> statement-breakpoint
CREATE POLICY "services_update_owner" ON "services" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.has_role("services"."clinic_id", array['owner'])) WITH CHECK (private.has_role("services"."clinic_id", array['owner']));--> statement-breakpoint
CREATE POLICY "services_delete_owner" ON "services" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.has_role("services"."clinic_id", array['owner']));