-- Add Google Drive sync fields to contracts table
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "drive_file_id" varchar;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "drive_link" varchar;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "drive_synced_at" timestamp;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "drive_sync_error" text;
