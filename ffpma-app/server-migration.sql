CREATE TYPE "public"."achievement_type" AS ENUM('module_complete', 'track_complete', 'quiz_master', 'streak', 'community_contributor', 'first_analysis', 'certification_earned', 'milestone');--> statement-breakpoint
CREATE TYPE "public"."agent_division" AS ENUM('executive', 'marketing', 'financial', 'legal', 'engineering', 'science', 'support');--> statement-breakpoint
CREATE TYPE "public"."agent_task_status" AS ENUM('pending', 'in_progress', 'completed', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."blood_sample_category" AS ENUM('pathogen', 'morphology', 'nutritional_marker', 'toxicity_indicator', 'immune_response', 'oxidative_stress', 'coagulation', 'reference_normal');--> statement-breakpoint
CREATE TYPE "public"."blood_sample_organism_type" AS ENUM('virus', 'bacteria', 'parasite', 'fungus', 'cell_abnormality', 'blood_cell_morphology', 'artifact', 'crystal', 'protein_pattern');--> statement-breakpoint
CREATE TYPE "public"."blood_sample_stain" AS ENUM('unstained', 'wright_giemsa', 'gram_stain', 'acid_fast', 'periodic_acid_schiff', 'dark_field', 'phase_contrast', 'electron_microscopy');--> statement-breakpoint
CREATE TYPE "public"."certification_status" AS ENUM('pending', 'in_progress', 'passed', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."certification_type" AS ENUM('module', 'track', 'program', 'specialist');--> statement-breakpoint
CREATE TYPE "public"."content_source" AS ENUM('wordpress', 'drive', 'manual');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('pending', 'sent', 'signed', 'completed');--> statement-breakpoint
CREATE TYPE "public"."diane_knowledge_category" AS ENUM('therapy_protocol', 'recipe', 'supplement', 'detox', 'diet_plan', 'healing_modality', 'research', 'case_study');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('approval', 'rejection', 'revision_request', 'implementation_issue');--> statement-breakpoint
CREATE TYPE "public"."implementation_status" AS ENUM('queued', 'in_progress', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."legal_doc_status" AS ENUM('draft', 'review', 'pending_signature', 'filed', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."legal_doc_type" AS ENUM('trademark', 'patent', 'agreement', 'filing', 'compliance');--> statement-breakpoint
CREATE TYPE "public"."library_content_type" AS ENUM('document', 'protocol', 'training', 'video', 'article');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('sent', 'delivered', 'read', 'archived');--> statement-breakpoint
CREATE TYPE "public"."onboarding_status" AS ENUM('started', 'document_sent', 'document_signed', 'payment_pending', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."patient_record_status" AS ENUM('active', 'inactive', 'archived', 'pending_review');--> statement-breakpoint
CREATE TYPE "public"."pricing_visibility" AS ENUM('always', 'members_only', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."program_type" AS ENUM('iv', 'peptide', 'protocol');--> statement-breakpoint
CREATE TYPE "public"."proposal_category" AS ENUM('ui-ux', 'architecture', 'content', 'protocol', 'optimization', 'security', 'performance', 'other');--> statement-breakpoint
CREATE TYPE "public"."proposal_impact" AS ENUM('minor', 'moderate', 'major');--> statement-breakpoint
CREATE TYPE "public"."proposal_risk_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('pending', 'approved', 'rejected', 'implemented', 'verified', 'archived');--> statement-breakpoint
CREATE TYPE "public"."protocol_status" AS ENUM('draft', 'active', 'paused', 'completed', 'discontinued');--> statement-breakpoint
CREATE TYPE "public"."quiz_difficulty" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."record_type" AS ENUM('blood_work', 'x_ray', 'mri', 'ct_scan', 'ultrasound', 'skin_analysis', 'intake_form', 'questionnaire', 'lab_report', 'consultation_notes', 'other');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('pending', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."research_source" AS ENUM('openalex', 'pubmed', 'semantic_scholar', 'arxiv');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'rejected', 'needs_changes');--> statement-breakpoint
CREATE TYPE "public"."sentinel_notification_type" AS ENUM('task_completed', 'research_update', 'module_update', 'training_update', 'rife_update', 'blood_analysis', 'product_update', 'system_alert', 'cross_division_request', 'system_broadcast', 'task_routed', 'cross_division_coordination');--> statement-breakpoint
CREATE TYPE "public"."support_agent_type" AS ENUM('diane', 'pete', 'sam', 'pat', 'corporate', 'diagnostics', 'minerals');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."sync_type" AS ENUM('users', 'products', 'categories', 'roles', 'full');--> statement-breakpoint
CREATE TYPE "public"."training_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."ui_refactor_status" AS ENUM('pending', 'approved', 'rejected', 'deployed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'doctor', 'clinic', 'member');--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"type" "achievement_type" NOT NULL,
	"icon" varchar DEFAULT 'trophy',
	"color" varchar DEFAULT 'gold',
	"points" integer DEFAULT 10,
	"criteria" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_configurations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar NOT NULL,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"autonomy_level" integer DEFAULT 0,
	"requires_approval_for_important" boolean DEFAULT true,
	"trust_challenge" varchar,
	"trust_answer" varchar,
	"last_activity_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "agent_configurations_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "agent_proposals" (
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
--> statement-breakpoint
CREATE TABLE "agent_registry" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"title" varchar NOT NULL,
	"division" "agent_division" NOT NULL,
	"specialty" text,
	"is_active" boolean DEFAULT true,
	"is_lead" boolean DEFAULT false,
	"ai_model" varchar,
	"model_provider" varchar,
	"capabilities" text[],
	"current_task_id" varchar,
	"pending_tasks" integer DEFAULT 0,
	"completed_tasks" integer DEFAULT 0,
	"last_activity_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "agent_registry_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "agent_research_collections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar NOT NULL,
	"agent_name" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"paper_ids" text[],
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_research_queries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar NOT NULL,
	"agent_name" varchar NOT NULL,
	"query" text NOT NULL,
	"sources" text[],
	"results_count" integer DEFAULT 0,
	"top_paper_ids" text[],
	"purpose" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agent_task_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" varchar NOT NULL,
	"requesting_agent_id" varchar NOT NULL,
	"requesting_division" "agent_division" NOT NULL,
	"reviewer_agent_id" varchar,
	"reviewer_division" "agent_division",
	"status" "review_status" DEFAULT 'pending',
	"review_notes" text,
	"feedback" text,
	"requested_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "agent_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar NOT NULL,
	"division" "agent_division" NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"status" "agent_task_status" DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 1,
	"progress" integer DEFAULT 0,
	"output_url" varchar,
	"output_drive_file_id" varchar,
	"assigned_by" varchar,
	"due_date" timestamp,
	"completed_at" timestamp,
	"evidence_required" boolean DEFAULT true,
	"evidence_type" varchar,
	"evidence_verified" boolean DEFAULT false,
	"evidence_verified_at" timestamp,
	"evidence_notes" text,
	"cross_division_from" varchar,
	"cross_division_to" varchar,
	"parent_task_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_analysis_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_upload_id" varchar NOT NULL,
	"requested_by" varchar NOT NULL,
	"analysis_type" varchar NOT NULL,
	"model" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"result" jsonb,
	"confidence" numeric,
	"processing_time_ms" integer,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "api_audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"method" varchar(10) NOT NULL,
	"path" varchar NOT NULL,
	"source_type" varchar(20) NOT NULL,
	"source_id" varchar,
	"status_code" integer,
	"response_time_ms" integer,
	"ip_address" varchar,
	"user_agent" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"key_prefix" varchar(16) NOT NULL,
	"key_hash" varchar NOT NULL,
	"permissions" text[] DEFAULT ARRAY['read']::text[] NOT NULL,
	"created_by" varchar NOT NULL,
	"last_used_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "athena_email_approvals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_thread_id" varchar,
	"from_email" varchar NOT NULL,
	"subject" varchar NOT NULL,
	"summary" text,
	"suggested_response" text,
	"importance" varchar DEFAULT 'normal',
	"status" varchar DEFAULT 'pending',
	"trustee_notes" text,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blood_analysis_samples" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"patient_id" varchar,
	"analysis_type" varchar DEFAULT 'live-blood' NOT NULL,
	"drive_file_id" varchar,
	"file_name" varchar,
	"mime_type" varchar,
	"web_view_link" varchar,
	"thumbnail_link" varchar,
	"observed_findings" text[],
	"patient_context" text,
	"ai_analysis" text,
	"potential_conditions" text[],
	"recommended_tests" text[],
	"clinical_notes" text,
	"confidence" varchar,
	"model_used" varchar,
	"analyzed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blood_sample_relations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sample_id" varchar NOT NULL,
	"related_sample_id" varchar NOT NULL,
	"relation_type" varchar NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "blood_sample_tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sample_id" varchar NOT NULL,
	"tag" varchar NOT NULL,
	"tag_category" varchar
);
--> statement-breakpoint
CREATE TABLE "blood_samples" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"scientific_name" varchar,
	"common_name" varchar,
	"organism_type" "blood_sample_organism_type" NOT NULL,
	"category" "blood_sample_category" NOT NULL,
	"description" text NOT NULL,
	"clinical_significance" text,
	"diagnostic_criteria" text,
	"differential_diagnosis" text,
	"magnification" varchar,
	"stain_type" "blood_sample_stain" DEFAULT 'unstained',
	"sample_type" varchar,
	"preparation_method" text,
	"morphology_description" text,
	"size_range" varchar,
	"shape_characteristics" text,
	"color_characteristics" text,
	"associated_conditions" text[],
	"symptoms" text[],
	"transmission_route" varchar,
	"prevalence" varchar,
	"image_url" varchar,
	"thumbnail_url" varchar,
	"additional_images" text[],
	"identification_keywords" text[],
	"ai_prompt_context" text,
	"confidence_factors" text,
	"source_citation" text,
	"source_url" varchar,
	"last_verified_date" timestamp,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"description" text,
	"image_url" varchar,
	"parent_id" varchar,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"wc_category_id" integer,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"content" text NOT NULL,
	"message_type" varchar DEFAULT 'text',
	"is_edited" boolean DEFAULT false,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_participants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"joined_at" timestamp DEFAULT now(),
	"last_read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "chat_rooms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar,
	"type" varchar DEFAULT 'direct',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clinics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wp_clinic_id" integer,
	"owner_id" varchar,
	"name" varchar NOT NULL,
	"slug" varchar,
	"description" text,
	"address" text,
	"city" varchar,
	"state" varchar,
	"zip_code" varchar,
	"phone" varchar,
	"email" varchar,
	"website" varchar,
	"logo_url" varchar,
	"signup_url" varchar,
	"wc_membership_product_id" integer,
	"wc_doctor_product_id" integer,
	"signnow_template_id" varchar,
	"signnow_doctor_link" varchar,
	"signnow_member_link" varchar,
	"doctor_name" varchar,
	"practice_type" varchar,
	"onboarded_by" varchar,
	"onboarding_date" varchar,
	"on_map" boolean DEFAULT false,
	"pricing_visibility" "pricing_visibility" DEFAULT 'members_only',
	"is_active" boolean DEFAULT true,
	"pma_name" varchar,
	"pma_status" varchar DEFAULT 'pending',
	"pma_ein" varchar,
	"parent_pma_id" varchar,
	"pma_agreement_date" varchar,
	"pma_type" varchar DEFAULT 'child',
	"contact_status" varchar DEFAULT 'pending',
	"portal_id" integer,
	"portal_url" varchar,
	"ein_status" varchar DEFAULT 'needs_ein',
	"articles_status" varchar DEFAULT 'not_filed',
	"bylaws_status" varchar DEFAULT 'not_filed',
	"form_8832_status" varchar DEFAULT 'not_filed',
	"form_1120_status" varchar DEFAULT 'not_filed',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "clinics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"clinic_id" varchar,
	"template_id" varchar,
	"signnow_document_id" varchar,
	"signnow_envelope_id" varchar,
	"embedded_signing_url" varchar,
	"doctor_name" varchar,
	"doctor_email" varchar,
	"clinic_name" varchar,
	"license_number" varchar,
	"specialization" varchar,
	"phone" varchar,
	"status" "contract_status" DEFAULT 'pending',
	"signed_at" timestamp,
	"fee_paid" boolean DEFAULT false,
	"fee_amount" numeric(10, 2) DEFAULT '10.00',
	"contract_url" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_record_id" varchar,
	"participant_ids" text[] NOT NULL,
	"participant_names" text[],
	"subject" varchar,
	"last_message_at" timestamp DEFAULT now(),
	"last_message_preview" text,
	"unread_count" integer DEFAULT 0,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_briefings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(20) NOT NULL,
	"date" varchar(10) NOT NULL,
	"subject" varchar NOT NULL,
	"body" text NOT NULL,
	"email_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "diane_conversations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "diane_conversations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar NOT NULL,
	"user_name" varchar,
	"title" varchar DEFAULT 'New Conversation' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "diane_knowledge" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "diane_knowledge_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"category" "diane_knowledge_category" NOT NULL,
	"title" varchar(500) NOT NULL,
	"summary" text,
	"content" text NOT NULL,
	"source_document" varchar(500),
	"drive_file_id" varchar,
	"tags" text[],
	"related_products" text[],
	"related_genes" text[],
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "diane_messages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "diane_messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"conversation_id" integer NOT NULL,
	"role" varchar NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "discussion_replies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" varchar NOT NULL,
	"content" text NOT NULL,
	"author_id" varchar NOT NULL,
	"author_name" varchar,
	"parent_reply_id" varchar,
	"upvotes" integer DEFAULT 0,
	"is_edited" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "discussion_threads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" varchar,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"author_id" varchar NOT NULL,
	"author_name" varchar,
	"is_pinned" boolean DEFAULT false,
	"is_locked" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"reply_count" integer DEFAULT 0,
	"last_activity_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "division_leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"division" "agent_division" NOT NULL,
	"lead_agent_id" varchar NOT NULL,
	"reports_to" varchar DEFAULT 'sentinel',
	"launch_deadline" timestamp,
	"progress_percent" integer DEFAULT 0,
	"status" varchar DEFAULT 'active',
	"last_status_update" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "division_leads_division_unique" UNIQUE("division")
);
--> statement-breakpoint
CREATE TABLE "doctor_onboarding" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"full_name" varchar NOT NULL,
	"clinic_name" varchar,
	"license_number" varchar,
	"practice_type" varchar,
	"phone" varchar,
	"status" "onboarding_status" DEFAULT 'started',
	"signnow_document_id" varchar,
	"signnow_template_id" varchar,
	"signing_url" varchar,
	"document_signed_at" timestamp,
	"wp_user_id" integer,
	"clinic_id" varchar,
	"doctor_code" varchar,
	"member_signup_url" varchar,
	"wc_order_id" integer,
	"payment_completed_at" timestamp,
	"referred_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "doctor_onboarding_doctor_code_unique" UNIQUE("doctor_code")
);
--> statement-breakpoint
CREATE TABLE "doctor_patient_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"sender_role" varchar NOT NULL,
	"sender_name" varchar,
	"recipient_id" varchar NOT NULL,
	"recipient_role" varchar NOT NULL,
	"recipient_name" varchar,
	"subject" varchar,
	"content" text NOT NULL,
	"status" "message_status" DEFAULT 'sent',
	"attachments" jsonb,
	"is_urgent" boolean DEFAULT false,
	"read_at" timestamp,
	"parent_message_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drive_assets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drive_file_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"mime_type" varchar NOT NULL,
	"path" text,
	"division" varchar,
	"agent" varchar,
	"category" varchar,
	"tags" text[],
	"description" text,
	"thumbnail_link" text,
	"web_view_link" text,
	"file_size" varchar,
	"parent_folder_id" varchar,
	"modified_time" timestamp,
	"indexed_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	CONSTRAINT "drive_assets_drive_file_id_unique" UNIQUE("drive_file_id")
);
--> statement-breakpoint
CREATE TABLE "drive_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drive_file_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"description" text,
	"mime_type" varchar,
	"content_type" "library_content_type" DEFAULT 'document',
	"web_view_link" varchar,
	"web_content_link" varchar,
	"thumbnail_link" varchar,
	"file_size" varchar,
	"folder_path" varchar,
	"module_id" varchar,
	"view_count" integer DEFAULT 0,
	"download_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"requires_membership" boolean DEFAULT true,
	"role_access" text[],
	"synced_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "drive_documents_drive_file_id_unique" UNIQUE("drive_file_id"),
	CONSTRAINT "drive_documents_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "implementation_queue" (
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
--> statement-breakpoint
CREATE TABLE "legal_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"doc_type" "legal_doc_type" NOT NULL,
	"status" "legal_doc_status" DEFAULT 'draft',
	"description" text,
	"content" text,
	"filing_number" varchar,
	"jurisdiction" varchar DEFAULT 'United States',
	"assigned_agent" varchar,
	"drive_file_id" varchar,
	"drive_url" varchar,
	"signnow_doc_id" varchar,
	"priority" varchar DEFAULT 'normal',
	"due_date" timestamp,
	"filed_date" timestamp,
	"approved_date" timestamp,
	"notes" text,
	"created_by" varchar DEFAULT 'JURIS',
	"reviewed_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "library_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"content_type" "library_content_type" DEFAULT 'article' NOT NULL,
	"content" text,
	"excerpt" text,
	"image_url" varchar,
	"category_slug" varchar,
	"tags" text[],
	"author_name" varchar,
	"wp_post_id" integer,
	"view_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"requires_membership" boolean DEFAULT true,
	"role_access" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "library_items_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "member_enrollment" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"full_name" varchar NOT NULL,
	"phone" varchar,
	"doctor_code" varchar NOT NULL,
	"status" "onboarding_status" DEFAULT 'started',
	"signnow_document_id" varchar,
	"signing_url" varchar,
	"document_signed_at" timestamp,
	"wp_user_id" integer,
	"wc_order_id" integer,
	"payment_completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "member_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"clinic_id" varchar,
	"sponsor_id" varchar,
	"wp_sponsor_id" varchar,
	"phone" varchar,
	"address" text,
	"city" varchar,
	"state" varchar,
	"zip_code" varchar,
	"pricing_visible" boolean DEFAULT true,
	"contract_signed" boolean DEFAULT false,
	"contract_id" varchar,
	"is_active" boolean DEFAULT true,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "member_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "module_bookmarks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"module_id" varchar NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "module_content" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" varchar NOT NULL,
	"content_type" varchar NOT NULL,
	"content_id" varchar NOT NULL,
	"sort_order" integer DEFAULT 0,
	"is_required" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "module_quizzes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" varchar NOT NULL,
	"quiz_id" varchar NOT NULL,
	"sort_order" integer DEFAULT 0,
	"is_required" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "network_doctors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dr_name" varchar NOT NULL,
	"clinic_name" varchar,
	"phone_number" varchar,
	"onboarding_date" varchar,
	"onboarded_by" varchar,
	"practice_type" varchar,
	"address" text,
	"city" varchar,
	"state" varchar,
	"zip_code" varchar,
	"on_map" boolean DEFAULT false,
	"email" varchar,
	"signup_link" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "openclaw_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_agent" varchar NOT NULL,
	"to_recipient" varchar DEFAULT 'trustee' NOT NULL,
	"message" text NOT NULL,
	"priority" varchar DEFAULT 'normal' NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"sent_at" timestamp,
	"delivered_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"clinic_id" varchar,
	"status" "order_status" DEFAULT 'pending',
	"subtotal" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2) DEFAULT '0',
	"shipping" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"shipping_address" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "patient_protocols" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_record_id" varchar NOT NULL,
	"doctor_id" varchar NOT NULL,
	"protocol_name" varchar NOT NULL,
	"protocol_type" varchar,
	"description" text,
	"status" "protocol_status" DEFAULT 'draft',
	"products" jsonb,
	"schedule" jsonb,
	"duration" varchar,
	"start_date" timestamp,
	"end_date" timestamp,
	"progress_notes" jsonb,
	"current_week" integer DEFAULT 1,
	"compliance_score" integer,
	"expected_outcomes" text[],
	"actual_outcomes" text[],
	"side_effects" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "patient_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" varchar NOT NULL,
	"member_id" varchar NOT NULL,
	"member_name" varchar NOT NULL,
	"member_email" varchar,
	"phone" varchar,
	"date_of_birth" timestamp,
	"status" "patient_record_status" DEFAULT 'active',
	"primary_concerns" text[],
	"symptom_timeline" jsonb,
	"environmental_factors" jsonb,
	"nutritional_deficiencies" jsonb,
	"toxicity_assessment" jsonb,
	"lifestyle_factors" jsonb,
	"family_history" jsonb,
	"previous_treatments" jsonb,
	"current_medications" text[],
	"allergies" text[],
	"notes" text,
	"last_visit_at" timestamp,
	"next_appointment_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "patient_uploads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_record_id" varchar NOT NULL,
	"uploaded_by" varchar NOT NULL,
	"uploaded_by_role" varchar DEFAULT 'doctor',
	"record_type" "record_type" NOT NULL,
	"file_name" varchar NOT NULL,
	"file_url" varchar,
	"drive_file_id" varchar,
	"mime_type" varchar,
	"file_size" integer,
	"ai_analyzed" boolean DEFAULT false,
	"ai_analysis_result" jsonb,
	"ai_analyzed_at" timestamp,
	"ai_model" varchar,
	"description" text,
	"notes" text,
	"is_reviewed" boolean DEFAULT false,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "practice_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"total_patients" integer DEFAULT 0,
	"new_patients" integer DEFAULT 0,
	"active_protocols" integer DEFAULT 0,
	"completed_protocols" integer DEFAULT 0,
	"consultations" integer DEFAULT 0,
	"messages_sent" integer DEFAULT 0,
	"uploads_reviewed" integer DEFAULT 0,
	"ai_analyses_run" integer DEFAULT 0,
	"successful_outcomes" integer DEFAULT 0,
	"average_compliance_score" numeric,
	"referral_revenue" numeric,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_role_prices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"variation_id" varchar,
	"role" varchar NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"price_visible" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "product_variations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"wc_variation_id" integer,
	"name" varchar NOT NULL,
	"sku" varchar,
	"retail_price" numeric(10, 2) NOT NULL,
	"wholesale_price" numeric(10, 2),
	"doctor_price" numeric(10, 2),
	"attributes" text,
	"image_url" varchar,
	"in_stock" boolean DEFAULT true,
	"stock_quantity" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"description" text,
	"short_description" text,
	"category_id" varchar,
	"image_url" varchar,
	"images" text[],
	"retail_price" numeric(10, 2) NOT NULL,
	"wholesale_price" numeric(10, 2),
	"doctor_price" numeric(10, 2),
	"sku" varchar,
	"stock_quantity" integer DEFAULT 0,
	"in_stock" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"has_coa" boolean DEFAULT false,
	"coa_url" varchar,
	"requires_membership" boolean DEFAULT true,
	"product_type" varchar,
	"dosage_info" text,
	"protocol_info" text,
	"wc_product_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "program_enrollments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"program_id" varchar NOT NULL,
	"clinic_id" varchar,
	"status" varchar DEFAULT 'active',
	"progress" integer DEFAULT 0,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"type" "program_type" NOT NULL,
	"description" text,
	"short_description" text,
	"image_url" varchar,
	"price" numeric(10, 2),
	"duration" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "programs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "proposal_feedback" (
	"id" varchar PRIMARY KEY DEFAULT 'feedback_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16) NOT NULL,
	"proposal_id" varchar NOT NULL,
	"feedback_type" "feedback_type" NOT NULL,
	"feedback_text" text,
	"reviewer_id" varchar,
	"learned_preference" text,
	"applies_to_category" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quiz_answers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" varchar NOT NULL,
	"answer_text" text NOT NULL,
	"is_correct" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"quiz_id" varchar NOT NULL,
	"score" integer,
	"max_score" integer,
	"percentage" integer,
	"passed" boolean,
	"time_spent" integer,
	"completed_at" timestamp,
	"started_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" varchar NOT NULL,
	"question_text" text NOT NULL,
	"question_type" varchar DEFAULT 'multiple_choice',
	"image_url" varchar,
	"explanation" text,
	"sort_order" integer DEFAULT 0,
	"points" integer DEFAULT 1,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "quiz_responses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" varchar NOT NULL,
	"question_id" varchar NOT NULL,
	"selected_answer_id" varchar,
	"is_correct" boolean,
	"points_earned" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"description" text,
	"image_url" varchar,
	"difficulty" "quiz_difficulty" DEFAULT 'beginner',
	"category_slug" varchar,
	"product_id" varchar,
	"program_id" varchar,
	"passing_score" integer DEFAULT 70,
	"max_attempts" integer DEFAULT 3,
	"time_limit" integer,
	"questions_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"requires_membership" boolean DEFAULT true,
	"role_access" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "quizzes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" varchar NOT NULL,
	"referred_user_id" varchar,
	"referral_code" varchar NOT NULL,
	"referred_email" varchar,
	"referred_name" varchar,
	"status" "referral_status" DEFAULT 'pending',
	"signup_date" timestamp,
	"total_purchases" numeric(10, 2) DEFAULT '0',
	"commission_earned" numeric(10, 2) DEFAULT '0',
	"commission_rate" numeric(5, 2) DEFAULT '10.00',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "referrals_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "research_papers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" varchar NOT NULL,
	"source" "research_source" NOT NULL,
	"title" text NOT NULL,
	"authors" text[],
	"abstract" text,
	"publication_date" varchar,
	"journal" varchar,
	"doi" varchar,
	"url" varchar,
	"citation_count" integer,
	"tldr" text,
	"keywords" text[],
	"full_text_url" varchar,
	"cached_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sentinel_notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "sentinel_notification_type" NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"agent_id" varchar,
	"division" varchar,
	"task_id" varchar,
	"output_url" varchar,
	"priority" integer DEFAULT 1,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_conversations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "support_conversations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar NOT NULL,
	"user_name" varchar,
	"agent_type" "support_agent_type" DEFAULT 'corporate' NOT NULL,
	"title" varchar DEFAULT 'New Conversation' NOT NULL,
	"status" varchar DEFAULT 'active',
	"priority" varchar DEFAULT 'normal',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "support_messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"conversation_id" integer NOT NULL,
	"role" varchar NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sync_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar,
	"event_type" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar,
	"wp_entity_id" varchar,
	"status" varchar DEFAULT 'success',
	"details" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sync_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sync_type" "sync_type" NOT NULL,
	"status" "sync_status" DEFAULT 'pending',
	"started_at" timestamp,
	"completed_at" timestamp,
	"total_items" integer DEFAULT 0,
	"processed_items" integer DEFAULT 0,
	"success_items" integer DEFAULT 0,
	"failed_items" integer DEFAULT 0,
	"error_log" text,
	"triggered_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "track_enrollments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"track_id" varchar NOT NULL,
	"status" "training_status" DEFAULT 'not_started',
	"progress_percent" integer DEFAULT 0,
	"modules_completed" integer DEFAULT 0,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "track_modules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"track_id" varchar NOT NULL,
	"module_id" varchar NOT NULL,
	"sort_order" integer DEFAULT 0,
	"is_required" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "training_certifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"certification_type" "certification_type" NOT NULL,
	"reference_id" varchar NOT NULL,
	"reference_title" varchar NOT NULL,
	"status" "certification_status" DEFAULT 'pending',
	"score" integer,
	"passing_score" integer DEFAULT 80,
	"attempts_used" integer DEFAULT 0,
	"max_attempts" integer DEFAULT 3,
	"certificate_number" varchar,
	"issued_at" timestamp,
	"expires_at" timestamp,
	"verification_code" varchar,
	"pdf_url" varchar,
	"drive_file_id" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "training_certifications_certificate_number_unique" UNIQUE("certificate_number")
);
--> statement-breakpoint
CREATE TABLE "training_module_key_points" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" varchar NOT NULL,
	"point" text NOT NULL,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "training_module_sections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_modules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"description" text,
	"image_url" varchar,
	"category" varchar,
	"sort_order" integer DEFAULT 0,
	"duration" varchar,
	"difficulty" "quiz_difficulty" DEFAULT 'beginner',
	"is_active" boolean DEFAULT true,
	"requires_membership" boolean DEFAULT true,
	"role_access" text[],
	"video_url" varchar,
	"audio_url" varchar,
	"transcript_url" varchar,
	"drive_file_id" varchar,
	"pdf_url" varchar,
	"presentation_url" varchar,
	"presentation_file_id" varchar,
	"additional_materials" jsonb,
	"instructor_name" varchar,
	"instructor_title" varchar,
	"instructor_avatar_url" varchar,
	"instructor_bio" text,
	"is_interactive" boolean DEFAULT false,
	"has_quiz" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "training_modules_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "training_quizzes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"questions" jsonb NOT NULL,
	"passing_score" integer DEFAULT 80,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_tracks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"description" text,
	"image_url" varchar,
	"total_modules" integer DEFAULT 0,
	"estimated_duration" varchar,
	"difficulty" "quiz_difficulty" DEFAULT 'beginner',
	"is_active" boolean DEFAULT true,
	"requires_membership" boolean DEFAULT true,
	"role_access" text[],
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "training_tracks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ui_refactor_proposals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar NOT NULL,
	"target_file" varchar NOT NULL,
	"proposed_diff" text NOT NULL,
	"description" text,
	"status" "ui_refactor_status" DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"achievement_id" varchar NOT NULL,
	"earned_at" timestamp DEFAULT now(),
	"progress" integer DEFAULT 100,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"content_type" varchar NOT NULL,
	"content_id" varchar NOT NULL,
	"status" "training_status" DEFAULT 'not_started',
	"progress_percent" integer DEFAULT 0,
	"time_spent" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"last_viewed_at" timestamp,
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_progress_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"module_id" varchar NOT NULL,
	"status" varchar DEFAULT 'in_progress',
	"progress_percentage" integer DEFAULT 0,
	"last_accessed_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_quiz_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"quiz_id" varchar NOT NULL,
	"score" integer NOT NULL,
	"passed" boolean NOT NULL,
	"answers" jsonb,
	"attempted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_wp_roles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"wp_role_slug" varchar NOT NULL,
	"is_primary" boolean DEFAULT false,
	"synced_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoints" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" varchar NOT NULL,
	"events" text[] NOT NULL,
	"secret" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_delivery_at" timestamp,
	"last_delivery_status" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wp_role_definitions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wp_role_slug" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	"description" text,
	"source" varchar DEFAULT 'wordpress',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "wp_role_definitions_wp_role_slug_unique" UNIQUE("wp_role_slug")
);
--> statement-breakpoint
CREATE TABLE "wp_role_mappings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wp_role_slug" varchar NOT NULL,
	"app_role" "user_role" DEFAULT 'member' NOT NULL,
	"price_tier" varchar DEFAULT 'retail' NOT NULL,
	"can_view_pricing" boolean DEFAULT true,
	"can_purchase" boolean DEFAULT true,
	"can_access_member_content" boolean DEFAULT true,
	"priority" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wp_webhooks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic" varchar NOT NULL,
	"webhook_id" varchar,
	"secret" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_triggered_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"wp_user_id" varchar,
	"wp_username" varchar,
	"wp_roles" varchar,
	"auth_provider" varchar DEFAULT 'replit',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_wp_user_id_unique" UNIQUE("wp_user_id")
);
--> statement-breakpoint
CREATE TABLE "chat_threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_proposals" ADD CONSTRAINT "agent_proposals_agent_id_agent_registry_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent_registry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_proposals" ADD CONSTRAINT "agent_proposals_task_id_agent_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."agent_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blood_sample_relations" ADD CONSTRAINT "blood_sample_relations_sample_id_blood_samples_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."blood_samples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blood_sample_relations" ADD CONSTRAINT "blood_sample_relations_related_sample_id_blood_samples_id_fk" FOREIGN KEY ("related_sample_id") REFERENCES "public"."blood_samples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blood_sample_tags" ADD CONSTRAINT "blood_sample_tags_sample_id_blood_samples_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."blood_samples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "implementation_queue" ADD CONSTRAINT "implementation_queue_proposal_id_agent_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."agent_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "implementation_queue" ADD CONSTRAINT "implementation_queue_agent_id_agent_registry_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent_registry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_feedback" ADD CONSTRAINT "proposal_feedback_proposal_id_agent_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."agent_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_chat_threads_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");