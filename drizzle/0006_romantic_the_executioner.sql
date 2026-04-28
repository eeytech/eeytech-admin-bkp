DO $$
BEGIN
  CREATE TYPE "public"."ticket_message_source" AS ENUM('user', 'support');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "core"."ticket_messages" ADD COLUMN IF NOT EXISTS "source" "ticket_message_source" DEFAULT 'user' NOT NULL;
