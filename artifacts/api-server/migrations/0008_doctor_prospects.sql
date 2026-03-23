DO $$ BEGIN
  CREATE TYPE "public"."doctor_prospect_stage" AS ENUM('contacted', 'interested', 'reviewing', 'onboarded', 'declined');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "doctor_prospects" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "full_name" varchar NOT NULL,
  "email" varchar NOT NULL,
  "phone" varchar,
  "practice_name" varchar,
  "practice_type" varchar,
  "specialties" text[],
  "city" varchar,
  "state" varchar,
  "zip_code" varchar,
  "stage" "doctor_prospect_stage" DEFAULT 'contacted' NOT NULL,
  "pitch_deck_views" integer DEFAULT 0,
  "pitch_deck_last_viewed_at" timestamp,
  "pitch_deck_time_spent_seconds" integer DEFAULT 0,
  "share_token" varchar UNIQUE,
  "source" varchar DEFAULT 'manual',
  "notes" text,
  "follow_up_at" timestamp,
  "last_contacted_at" timestamp,
  "last_reminder_sent_at" timestamp,
  "added_by" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
