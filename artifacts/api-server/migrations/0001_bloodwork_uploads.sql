-- Migration: Add bloodwork uploads table for AI-powered lab report analysis
-- Applied via: pnpm db:push (drizzle-kit push, project standard)
-- This file documents the schema additions for review purposes.

DO $$ BEGIN
  CREATE TYPE "bloodwork_upload_status" AS ENUM ('pending', 'analyzing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "bloodwork_uploads" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "member_id" varchar NOT NULL,
  "member_name" varchar,
  "doctor_id" varchar NOT NULL,
  "file_name" varchar NOT NULL,
  "file_type" varchar NOT NULL,
  "mime_type" varchar,
  "file_size" integer,
  "drive_file_id" varchar,
  "drive_web_view_link" varchar,
  "status" "bloodwork_upload_status" DEFAULT 'pending' NOT NULL,
  "ai_analyzed" boolean DEFAULT false,
  "ai_analyzed_at" timestamp,
  "analysis_error" text,
  "extracted_markers" jsonb,
  "clinical_summary" text,
  "ai_observations" jsonb,
  "protocol_alignments" jsonb,
  "abnormal_flags" jsonb,
  "confidence" varchar,
  "linked_protocol_id" integer,
  "notes" text,
  "collection_date" timestamp,
  "lab_name" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
