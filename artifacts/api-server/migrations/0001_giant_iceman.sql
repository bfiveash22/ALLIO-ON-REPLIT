CREATE TYPE "public"."lab_order_status" AS ENUM('draft', 'pending', 'submitted', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."lab_result_status" AS ENUM('normal', 'low', 'high', 'critical_low', 'critical_high');--> statement-breakpoint
CREATE TYPE "public"."vitality_assessment_status" AS ENUM('draft', 'completed');--> statement-breakpoint
CREATE TABLE "lab_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" varchar NOT NULL,
	"member_name" varchar,
	"doctor_id" varchar NOT NULL,
	"status" "lab_order_status" DEFAULT 'draft' NOT NULL,
	"panels" jsonb DEFAULT '[]'::jsonb,
	"rupa_order_id" varchar,
	"rupa_order_url" varchar,
	"notes" text,
	"ordered_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lab_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" varchar NOT NULL,
	"member_name" varchar,
	"doctor_id" varchar NOT NULL,
	"lab_order_id" varchar,
	"test_name" varchar NOT NULL,
	"category" varchar NOT NULL,
	"value" numeric(12, 4) NOT NULL,
	"unit" varchar NOT NULL,
	"reference_min" numeric(12, 4),
	"reference_max" numeric(12, 4),
	"status" "lab_result_status" DEFAULT 'normal' NOT NULL,
	"result_date" timestamp DEFAULT now(),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saved_test_panels" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"test_list" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vitality_assessments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" varchar NOT NULL,
	"member_name" varchar,
	"doctor_id" varchar NOT NULL,
	"status" "vitality_assessment_status" DEFAULT 'completed',
	"overall_score" integer,
	"cellular_health_score" integer,
	"detox_score" integer,
	"systemic_health_score" integer,
	"diet_nutrition_score" integer,
	"environmental_score" integer,
	"stress_emotional_score" integer,
	"physical_activity_score" integer,
	"cellular_health_data" jsonb,
	"detox_data" jsonb,
	"systemic_health_data" jsonb,
	"diet_nutrition_data" jsonb,
	"environmental_data" jsonb,
	"stress_emotional_data" jsonb,
	"physical_activity_data" jsonb,
	"recommendations" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "legal_documents" ADD COLUMN "signnow_template_id" varchar;--> statement-breakpoint
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_lab_order_id_lab_orders_id_fk" FOREIGN KEY ("lab_order_id") REFERENCES "public"."lab_orders"("id") ON DELETE set null ON UPDATE no action;