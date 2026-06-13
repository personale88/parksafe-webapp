CREATE TABLE IF NOT EXISTS "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"family_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_encrypted" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_sessions_user_idx" ON "auth_sessions" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_sessions_refresh_hash_idx" ON "auth_sessions" ("refresh_token_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_sessions_family_idx" ON "auth_sessions" ("family_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_events_reporter_user_idx" ON "contact_events" ("reporter_user_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
