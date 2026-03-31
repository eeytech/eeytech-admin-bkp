CREATE TYPE "public"."ticket_message_source" AS ENUM('user', 'support');--> statement-breakpoint
ALTER TABLE "core"."ticket_messages" ADD COLUMN "source" "ticket_message_source" DEFAULT 'user' NOT NULL;
