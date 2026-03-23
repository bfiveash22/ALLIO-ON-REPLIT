DO $$ BEGIN
  CREATE TYPE "pipeline_stage" AS ENUM ('intake', 'analysis', 'assembly', 'presentation', 'delivery');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "pipeline_status" AS ENUM ('pending', 'in_progress', 'completed', 'completed_with_warnings', 'failed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TYPE "pipeline_status" ADD VALUE IF NOT EXISTS 'completed_with_warnings';
EXCEPTION WHEN others THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pipeline_runs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "protocol_id" integer,
  "intake_form_id" integer,
  "member_id" varchar,
  "doctor_id" varchar,
  "initiated_by" varchar,
  "current_stage" "pipeline_stage" DEFAULT 'intake',
  "overall_status" "pipeline_status" DEFAULT 'pending',
  "stages" jsonb DEFAULT '[]',
  "drive_file_url" varchar,
  "drive_folder_id" varchar,
  "trustee_notified" boolean DEFAULT false,
  "error_message" text,
  "started_at" timestamp DEFAULT now(),
  "completed_at" timestamp,
  "updated_at" timestamp DEFAULT now()
);
