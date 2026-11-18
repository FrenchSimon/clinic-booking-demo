CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by" uuid DEFAULT auth.uid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone DEFAULT now() + interval '7 days' NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by" uuid,
	CONSTRAINT "invitations_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "invitations_email_lowercase" CHECK ("invitations"."email" = lower("invitations"."email"))
);
--> statement-breakpoint
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_open_email_unique" ON "invitations" USING btree ("clinic_id","email") WHERE "invitations"."accepted_at" is null;--> statement-breakpoint
CREATE POLICY "invitations_select_owner" ON "invitations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (private.has_role("invitations"."clinic_id", array['owner']));--> statement-breakpoint
CREATE POLICY "invitations_insert_owner" ON "invitations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.has_role("invitations"."clinic_id", array['owner']) and "invitations"."invited_by" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "invitations_delete_owner" ON "invitations" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.has_role("invitations"."clinic_id", array['owner']));