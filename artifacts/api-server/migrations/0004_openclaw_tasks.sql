CREATE TABLE "openclaw_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar NOT NULL,
	"task_type" varchar NOT NULL,
	"description" text NOT NULL,
	"priority" varchar DEFAULT 'normal',
	"status" varchar DEFAULT 'pending',
	"context" jsonb,
	"callback_url" varchar,
	"result" jsonb,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"started_at" timestamp,
	"completed_at" timestamp
);
