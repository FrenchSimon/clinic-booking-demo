CREATE TYPE "public"."membership_role" AS ENUM('owner', 'practitioner', 'patient');--> statement-breakpoint
CREATE TABLE "clinics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_by" uuid DEFAULT auth.uid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clinics_slug_unique" UNIQUE("slug"),
	CONSTRAINT "clinics_slug_format" CHECK ("clinics"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length("clinics"."slug") <= 60)
);
--> statement-breakpoint
ALTER TABLE "clinics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "membership_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_clinic_user_unique" UNIQUE("clinic_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "memberships_user_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE POLICY "clinics_select_member" ON "clinics" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("clinics"."created_by" = (select auth.uid()) or private.is_member("clinics"."id"));--> statement-breakpoint
CREATE POLICY "clinics_insert_self" ON "clinics" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("clinics"."created_by" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "clinics_update_owner" ON "clinics" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.has_role("clinics"."id", array['owner'])) WITH CHECK (private.has_role("clinics"."id", array['owner']));--> statement-breakpoint
CREATE POLICY "clinics_delete_owner" ON "clinics" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.has_role("clinics"."id", array['owner']));--> statement-breakpoint
CREATE POLICY "memberships_select" ON "memberships" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("memberships"."user_id" = (select auth.uid())
        or private.has_role("memberships"."clinic_id", array['owner', 'practitioner'])
        or ("memberships"."role" <> 'patient' and private.is_member("memberships"."clinic_id")));--> statement-breakpoint
CREATE POLICY "memberships_insert_owner" ON "memberships" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.has_role("memberships"."clinic_id", array['owner']));--> statement-breakpoint
CREATE POLICY "memberships_update_owner" ON "memberships" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.has_role("memberships"."clinic_id", array['owner'])) WITH CHECK (private.has_role("memberships"."clinic_id", array['owner']));--> statement-breakpoint
CREATE POLICY "memberships_delete_owner" ON "memberships" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.has_role("memberships"."clinic_id", array['owner']));