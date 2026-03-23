ALTER TABLE "agent_tasks" ADD COLUMN IF NOT EXISTS "tool_calls" text;--> statement-breakpoint
ALTER TABLE "agent_tasks" ADD COLUMN IF NOT EXISTS "agentic_iterations" integer DEFAULT 0;
