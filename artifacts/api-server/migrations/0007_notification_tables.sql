-- Migration: User notification system (SSE)
-- Adds user_notifications and user_notification_preferences tables

DO $$ BEGIN
  CREATE TYPE "user_notification_type" AS ENUM (
    'protocol_update',
    'new_message',
    'training_milestone',
    'member_enrolled',
    'protocol_approval_request',
    'agent_task_completed',
    'research_update',
    'system_alert'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "user_notifications" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" "user_notification_type" NOT NULL,
  "title" varchar NOT NULL,
  "message" text NOT NULL,
  "is_read" boolean DEFAULT false,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "user_notifications_user_id_idx" ON "user_notifications" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_notifications_is_read_idx" ON "user_notifications" ("user_id", "is_read");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_notifications_created_at_idx" ON "user_notifications" ("created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "user_notification_preferences" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
  "user_id" varchar NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "protocol_update" boolean DEFAULT true,
  "new_message" boolean DEFAULT true,
  "training_milestone" boolean DEFAULT true,
  "member_enrolled" boolean DEFAULT true,
  "protocol_approval_request" boolean DEFAULT true,
  "agent_task_completed" boolean DEFAULT true,
  "research_update" boolean DEFAULT true,
  "system_alert" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "user_notification_preferences_user_id_idx" ON "user_notification_preferences" ("user_id");
