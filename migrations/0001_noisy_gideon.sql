CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'completed', 'cancelled', 'no-show');--> statement-breakpoint
CREATE TYPE "public"."appointment_type" AS ENUM('consultation', 'follow-up', 'blood-analysis');--> statement-breakpoint
CREATE TYPE "public"."implemented_status" AS ENUM('pending_review', 'deployed_successfully', 'deployment_failed', 'rolled_back', 'ignored');--> statement-breakpoint
CREATE TABLE "doctor_appointments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"appointment_date" timestamp NOT NULL,
	"duration_minutes" integer DEFAULT 60,
	"appointment_type" "appointment_type" DEFAULT 'consultation',
	"status" "appointment_status" DEFAULT 'scheduled',
	"notes" text,
	"google_calendar_event_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "generated_protocols" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_age" integer,
	"source_type" varchar(50) NOT NULL,
	"intake_form_id" integer,
	"member_id" varchar(255),
	"patient_profile" jsonb NOT NULL,
	"protocol" jsonb NOT NULL,
	"slides_presentation_id" varchar(255),
	"slides_web_view_link" varchar(500),
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"generated_by" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "implemented_outputs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drive_file_id" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"mime_type" varchar,
	"agent_id" varchar NOT NULL,
	"category" varchar NOT NULL,
	"status" "implemented_status" DEFAULT 'pending_review',
	"target_path" varchar,
	"backup_path" varchar,
	"error_log" text,
	"reviewed_by" varchar,
	"deployed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "implemented_outputs_drive_file_id_unique" UNIQUE("drive_file_id")
);
--> statement-breakpoint
ALTER TABLE "agent_tasks" ADD COLUMN "last_error_at" timestamp;--> statement-breakpoint
ALTER TABLE "agent_tasks" ADD COLUMN "next_retry_at" timestamp;