import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create Enums if they don't exist using DO block
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "proposal_category" AS ENUM('ui-ux', 'architecture', 'content', 'protocol', 'optimization', 'security', 'performance', 'other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "proposal_risk_level" AS ENUM('low', 'medium', 'high');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "proposal_impact" AS ENUM('minor', 'moderate', 'major');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "proposal_status" AS ENUM('pending', 'approved', 'rejected', 'implemented', 'verified', 'archived');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "implementation_status" AS ENUM('queued', 'in_progress', 'completed', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "feedback_type" AS ENUM('approval', 'rejection', 'revision_request', 'implementation_issue');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "agent_proposals" (
        "id" varchar PRIMARY KEY DEFAULT 'proposal_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16) NOT NULL,
        "agent_id" varchar NOT NULL,
        "task_id" varchar,
        "title" text NOT NULL,
        "description" text NOT NULL,
        "category" "proposal_category" NOT NULL,
        "risk_level" "proposal_risk_level" NOT NULL,
        "impact" "proposal_impact",
        "target_files" text[],
        "changes_summary" text,
        "rationale" text,
        "details" jsonb DEFAULT '{}'::jsonb,
        "status" "proposal_status" DEFAULT 'pending' NOT NULL,
        "priority" integer DEFAULT 0,
        "reviewed_by" varchar,
        "reviewed_at" timestamp,
        "rejection_reason" text,
        "implemented_by" varchar,
        "implemented_at" timestamp,
        "implementation_notes" text,
        "verification_status" varchar,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "implementation_queue" (
        "id" varchar PRIMARY KEY DEFAULT 'impl_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16) NOT NULL,
        "proposal_id" varchar NOT NULL,
        "agent_id" varchar NOT NULL,
        "status" "implementation_status" DEFAULT 'queued' NOT NULL,
        "priority" integer DEFAULT 0,
        "started_at" timestamp,
        "completed_at" timestamp,
        "error_log" text,
        "result_summary" text,
        "commit_hash" varchar,
        "branch_name" varchar,
        "pr_url" varchar,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "proposal_feedback" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "proposal_id" varchar NOT NULL,
        "type" "feedback_type" NOT NULL,
        "notes" text NOT NULL,
        "provider_id" varchar,
        "created_at" timestamp DEFAULT now()
      );
    `);

    await client.query('COMMIT');
    console.log('Successfully created missing tables for agent_proposals and implementation_queue!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error:', e);
  } finally {
    client.release();
    pool.end();
  }
}
fix();
