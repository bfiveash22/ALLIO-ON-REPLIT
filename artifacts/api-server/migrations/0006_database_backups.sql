DO $$ BEGIN
  CREATE TYPE "backup_status" AS ENUM ('pending', 'running', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "backup_type" AS ENUM ('daily', 'weekly', 'monthly', 'manual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "database_backups" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "backup_type" "backup_type" NOT NULL DEFAULT 'daily',
  "status" "backup_status" NOT NULL DEFAULT 'pending',
  "label" varchar NOT NULL,
  "tables_exported" text[],
  "total_rows" integer DEFAULT 0,
  "file_size_bytes" integer DEFAULT 0,
  "drive_file_id" varchar,
  "drive_web_view_link" varchar,
  "drive_folder_id" varchar,
  "verification_status" varchar DEFAULT 'pending',
  "verification_details" jsonb,
  "error_message" text,
  "started_at" timestamp DEFAULT now(),
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now()
);
