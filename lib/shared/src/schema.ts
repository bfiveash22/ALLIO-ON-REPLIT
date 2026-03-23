import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, pgEnum, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";
import { users } from "./models/auth";

// Re-export legacy chat models (chat_threads + messages)
// DEPRECATED: Use chatRooms/chatMessages for member messaging,
// dianeConversations/dianeMessages for Diane AI, or
// supportConversations/supportMessages for support agents.
// Retained for backward compatibility with Global Agent Chat.
export * from "./models/chat";

export * from "./schema/intake";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "doctor", "clinic", "member"]);
export const pricingVisibilityEnum = pgEnum("pricing_visibility", ["always", "members_only", "hidden"]);
export const contractStatusEnum = pgEnum("contract_status", ["pending", "sent", "signed", "completed"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "processing", "shipped", "delivered", "cancelled"]);
export const programTypeEnum = pgEnum("program_type", ["iv", "peptide", "protocol"]);
export const libraryContentTypeEnum = pgEnum("library_content_type", ["document", "protocol", "training", "video", "article"]);
export const uiRefactorStatusEnum = pgEnum("ui_refactor_status", ["pending", "approved", "rejected", "deployed"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "processing", "succeeded", "failed", "refunded", "cancelled"]);

// Member profiles (extends the auth users table)
export const memberProfiles = pgTable("member_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  role: userRoleEnum("role").notNull().default("member"),
  clinicId: varchar("clinic_id"),
  sponsorId: varchar("sponsor_id"), // Doctor/referrer who sponsored this member
  wpSponsorId: varchar("wp_sponsor_id"), // WordPress sponsor user ID
  phone: varchar("phone"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  pricingVisible: boolean("pricing_visible").default(true),
  contractSigned: boolean("contract_signed").default(false),
  contractId: varchar("contract_id"),
  isActive: boolean("is_active").default(true),
  lastSyncedAt: timestamp("last_synced_at"), // Last sync from WordPress
  createdAt: timestamp("created_at").defaultNow(),
});

// Clinics
export const clinics = pgTable("clinics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  wpClinicId: integer("wp_clinic_id"), // WordPress/WooCommerce clinic ID from signup URL
  ownerId: varchar("owner_id"), // Nullable until doctor account is linked
  name: varchar("name").notNull(),
  slug: varchar("slug").unique(), // URL-friendly slug for /join/:slug links
  description: text("description"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  phone: varchar("phone"),
  email: varchar("email"),
  website: varchar("website"),
  logoUrl: varchar("logo_url"),
  signupUrl: varchar("signup_url"), // https://forgottenformula.com/member-signup-clinic?clinic_id=XXX
  wcMembershipProductId: integer("wc_membership_product_id"), // WooCommerce product ID for $10 membership
  wcDoctorProductId: integer("wc_doctor_product_id"), // WooCommerce product ID for $5k doctor signup
  signNowTemplateId: varchar("signnow_template_id"), // SignNow template for member agreements
  signNowDoctorLink: varchar("signnow_doctor_link"), // Reusable SignNow link for doctor signups
  signNowMemberLink: varchar("signnow_member_link"), // Reusable SignNow link for member signups
  doctorName: varchar("doctor_name"), // Primary doctor/practitioner name
  practiceType: varchar("practice_type"), // DC, R.N., Nutrition Store, etc.
  onboardedBy: varchar("onboarded_by"), // Who onboarded this clinic
  onboardingDate: varchar("onboarding_date"),
  onMap: boolean("on_map").default(false), // Whether clinic is on the map
  pricingVisibility: pricingVisibilityEnum("pricing_visibility").default("members_only"),
  isActive: boolean("is_active").default(true),
  pmaName: varchar("pma_name"),
  pmaStatus: varchar("pma_status").default("pending"),
  pmaEin: varchar("pma_ein"),
  parentPmaId: varchar("parent_pma_id"),
  pmaAgreementDate: varchar("pma_agreement_date"),
  pmaType: varchar("pma_type").default("child"),
  contactStatus: varchar("contact_status").default("pending"),
  portalId: integer("portal_id"),
  portalUrl: varchar("portal_url"),
  einStatus: varchar("ein_status").default("needs_ein"),
  articlesStatus: varchar("articles_status").default("not_filed"),
  bylawsStatus: varchar("bylaws_status").default("not_filed"),
  form8832Status: varchar("form_8832_status").default("not_filed"),
  form1120Status: varchar("form_1120_status").default("not_filed"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pmaOfficers = pgTable("pma_officers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull(),
  fullName: varchar("full_name").notNull(),
  role: varchar("role").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pmaFilingDocuments = pgTable("pma_filing_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").notNull(),
  documentType: varchar("document_type").notNull(),
  title: varchar("title").notNull(),
  content: text("content"),
  driveFileId: varchar("drive_file_id"),
  driveWebViewLink: varchar("drive_web_view_link"),
  status: varchar("status").default("draft"),
  generatedBy: varchar("generated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Doctor onboarding records - tracks the SignNow signing process
export const onboardingStatusEnum = pgEnum("onboarding_status", ["started", "document_sent", "document_signed", "payment_pending", "completed", "cancelled"]);

export const doctorOnboarding = pgTable("doctor_onboarding", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  fullName: varchar("full_name").notNull(),
  clinicName: varchar("clinic_name"),
  licenseNumber: varchar("license_number"),
  practiceType: varchar("practice_type"), // DC, R.N., MD, etc.
  phone: varchar("phone"),
  status: onboardingStatusEnum("status").default("started"),
  // SignNow integration
  signNowDocumentId: varchar("signnow_document_id"),
  signNowTemplateId: varchar("signnow_template_id"),
  signingUrl: varchar("signing_url"),
  documentSignedAt: timestamp("document_signed_at"),
  // WordPress integration
  wpUserId: integer("wp_user_id"),
  clinicId: varchar("clinic_id"), // Link to clinics table after creation
  // Unique doctor ID for member signups
  doctorCode: varchar("doctor_code").unique(), // e.g., "DR-ABC123"
  memberSignupUrl: varchar("member_signup_url"), // /join/:doctorCode
  // Payment tracking
  wcOrderId: integer("wc_order_id"),
  paymentCompletedAt: timestamp("payment_completed_at"),
  // Metadata
  referredBy: varchar("referred_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDoctorOnboardingSchema = createInsertSchema(doctorOnboarding).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  doctorCode: true,
  memberSignupUrl: true,
});
export type InsertDoctorOnboarding = z.infer<typeof insertDoctorOnboardingSchema>;
export type DoctorOnboarding = typeof doctorOnboarding.$inferSelect;

// Member enrollment records - tracks member signup through doctor
export const memberEnrollment = pgTable("member_enrollment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  fullName: varchar("full_name").notNull(),
  phone: varchar("phone"),
  doctorCode: varchar("doctor_code").notNull(), // Links to doctor who referred them
  status: onboardingStatusEnum("status").default("started"),
  // SignNow integration
  signNowDocumentId: varchar("signnow_document_id"),
  signingUrl: varchar("signing_url"),
  documentSignedAt: timestamp("document_signed_at"),
  // WordPress integration
  wpUserId: integer("wp_user_id"),
  // Payment tracking
  wcOrderId: integer("wc_order_id"),
  paymentCompletedAt: timestamp("payment_completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMemberEnrollmentSchema = createInsertSchema(memberEnrollment).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMemberEnrollment = z.infer<typeof insertMemberEnrollmentSchema>;
export type MemberEnrollment = typeof memberEnrollment.$inferSelect;

// Product categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  parentId: varchar("parent_id"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  wcCategoryId: integer("wc_category_id"),
});

// Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  shortDescription: text("short_description"),
  categoryId: varchar("category_id"),
  imageUrl: varchar("image_url"),
  images: text("images").array(),
  retailPrice: decimal("retail_price", { precision: 10, scale: 2 }).notNull(),
  wholesalePrice: decimal("wholesale_price", { precision: 10, scale: 2 }),
  doctorPrice: decimal("doctor_price", { precision: 10, scale: 2 }),
  sku: varchar("sku"),
  stockQuantity: integer("stock_quantity").default(0),
  inStock: boolean("in_stock").default(true),
  isActive: boolean("is_active").default(true),
  hasCoa: boolean("has_coa").default(false),
  coaUrl: varchar("coa_url"),
  requiresMembership: boolean("requires_membership").default(true),
  productType: varchar("product_type"),
  dosageInfo: text("dosage_info"),
  protocolInfo: text("protocol_info"),
  wcProductId: integer("wc_product_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product Variations (for variable products from WooCommerce)
export const productVariations = pgTable("product_variations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  wcVariationId: integer("wc_variation_id"),
  name: varchar("name").notNull(),
  sku: varchar("sku"),
  retailPrice: decimal("retail_price", { precision: 10, scale: 2 }).notNull(),
  wholesalePrice: decimal("wholesale_price", { precision: 10, scale: 2 }),
  doctorPrice: decimal("doctor_price", { precision: 10, scale: 2 }),
  attributes: text("attributes"), // JSON string of variation attributes
  imageUrl: varchar("image_url"),
  inStock: boolean("in_stock").default(true),
  stockQuantity: integer("stock_quantity").default(0),
});

// Role-based pricing (synced from WooCommerce role pricing plugins)
export const productRolePrices = pgTable("product_role_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  variationId: varchar("variation_id"), // null for main product
  role: varchar("role").notNull(), // admin, doctor, clinic, member, guest
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  priceVisible: boolean("price_visible").default(true), // whether this role can see pricing
});

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  clinicId: varchar("clinic_id"),
  status: orderStatusEnum("status").default("pending"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  shipping: decimal("shipping", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  shippingAddress: text("shipping_address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  productId: varchar("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  orderId: varchar("order_id"),
  stripeSessionId: varchar("stripe_session_id").unique(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  status: paymentStatusEnum("payment_status").default("pending"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("usd"),
  description: text("description"),
  customerEmail: varchar("customer_email"),
  metadata: jsonb("metadata"),
  receiptUrl: varchar("receipt_url"),
  failureMessage: text("failure_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

// Programs (IV, Peptide, Protocol)
export const programs = pgTable("programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  type: programTypeEnum("type").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  imageUrl: varchar("image_url"),
  price: decimal("price", { precision: 10, scale: 2 }),
  duration: varchar("duration"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Program enrollments
export const programEnrollments = pgTable("program_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  programId: varchar("program_id").notNull(),
  clinicId: varchar("clinic_id"),
  status: varchar("status").default("active"),
  progress: integer("progress").default(0),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Library items (synced from WordPress posts/pages)
export const libraryItems = pgTable("library_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  slug: varchar("slug").notNull().unique(),
  contentType: libraryContentTypeEnum("content_type").notNull().default("article"),
  content: text("content"),
  excerpt: text("excerpt"),
  imageUrl: varchar("image_url"),
  categorySlug: varchar("category_slug"),
  tags: text("tags").array(),
  authorName: varchar("author_name"),
  wpPostId: integer("wp_post_id"),
  driveFileId: varchar("drive_file_id"),
  driveWebViewLink: varchar("drive_web_view_link"),
  driveFolderId: varchar("drive_folder_id"),
  fileMimeType: varchar("file_mime_type"),
  fileSize: varchar("file_size"),
  viewCount: integer("view_count").default(0),
  isActive: boolean("is_active").default(true),
  requiresMembership: boolean("requires_membership").default(true),
  roleAccess: text("role_access").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quiz difficulty enum
export const quizDifficultyEnum = pgEnum("quiz_difficulty", ["beginner", "intermediate", "advanced"]);

// Training module status enum
export const trainingStatusEnum = pgEnum("training_status", ["not_started", "in_progress", "completed"]);

// Content source enum
export const contentSourceEnum = pgEnum("content_source", ["wordpress", "drive", "manual"]);

// Quizzes
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  difficulty: quizDifficultyEnum("difficulty").default("beginner"),
  categorySlug: varchar("category_slug"),
  productId: varchar("product_id"),
  programId: varchar("program_id"),
  passingScore: integer("passing_score").default(70),
  maxAttempts: integer("max_attempts").default(3),
  timeLimit: integer("time_limit"),
  questionsCount: integer("questions_count").default(0),
  isActive: boolean("is_active").default(true),
  requiresMembership: boolean("requires_membership").default(true),
  roleAccess: text("role_access").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quiz questions
export const quizQuestions = pgTable("quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull(),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type").default("multiple_choice"),
  imageUrl: varchar("image_url"),
  explanation: text("explanation"),
  sortOrder: integer("sort_order").default(0),
  points: integer("points").default(1),
  isActive: boolean("is_active").default(true),
});

// Quiz answers (for multiple choice questions)
export const quizAnswers = pgTable("quiz_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull(),
  answerText: text("answer_text").notNull(),
  isCorrect: boolean("is_correct").default(false),
  sortOrder: integer("sort_order").default(0),
});

// Quiz attempts (user quiz sessions)
export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  quizId: varchar("quiz_id").notNull(),
  score: integer("score"),
  maxScore: integer("max_score"),
  percentage: integer("percentage"),
  passed: boolean("passed"),
  timeSpent: integer("time_spent"),
  completedAt: timestamp("completed_at"),
  startedAt: timestamp("started_at").defaultNow(),
});

// Quiz responses (individual question answers)
export const quizResponses = pgTable("quiz_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: varchar("attempt_id").notNull(),
  questionId: varchar("question_id").notNull(),
  selectedAnswerId: varchar("selected_answer_id"),
  isCorrect: boolean("is_correct"),
  pointsEarned: integer("points_earned").default(0),
});

// Training modules (organizational units for content)
export const trainingModules = pgTable("training_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  category: varchar("category"),
  sortOrder: integer("sort_order").default(0),
  duration: varchar("duration"),
  difficulty: quizDifficultyEnum("difficulty").default("beginner"),
  isActive: boolean("is_active").default(true),
  requiresMembership: boolean("requires_membership").default(true),
  roleAccess: text("role_access").array(),
  videoUrl: varchar("video_url"),
  audioUrl: varchar("audio_url"),
  transcriptUrl: varchar("transcript_url"),
  driveFileId: varchar("drive_file_id"),
  pdfUrl: varchar("pdf_url"),
  presentationUrl: varchar("presentation_url"),
  presentationFileId: varchar("presentation_file_id"),
  additionalMaterials: jsonb("additional_materials"),
  instructorName: varchar("instructor_name"),
  instructorTitle: varchar("instructor_title"),
  instructorAvatarUrl: varchar("instructor_avatar_url"),
  instructorBio: text("instructor_bio"),
  isInteractive: boolean("is_interactive").default(false),
  hasQuiz: boolean("has_quiz").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training tracks (learning paths bundling modules)
export const trainingTracks = pgTable("training_tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  totalModules: integer("total_modules").default(0),
  estimatedDuration: varchar("estimated_duration"),
  difficulty: quizDifficultyEnum("difficulty").default("beginner"),
  isActive: boolean("is_active").default(true),
  requiresMembership: boolean("requires_membership").default(true),
  roleAccess: text("role_access").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Track-Module junction (which modules are in which tracks)
export const trackModules = pgTable("track_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackId: varchar("track_id").notNull(),
  moduleId: varchar("module_id").notNull(),
  sortOrder: integer("sort_order").default(0),
  isRequired: boolean("is_required").default(true),
});

export const trainingModuleSections = pgTable("training_module_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").notNull(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trainingModuleKeyPoints = pgTable("training_module_key_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").notNull(),
  point: text("point").notNull(),
  sortOrder: integer("sort_order").default(0),
});

export type TrainingModuleSection = typeof trainingModuleSections.$inferSelect;
export type TrainingModuleKeyPoint = typeof trainingModuleKeyPoints.$inferSelect;

// Google Drive documents
export const driveDocuments = pgTable("drive_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driveFileId: varchar("drive_file_id").notNull().unique(),
  title: varchar("title").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  mimeType: varchar("mime_type"),
  contentType: libraryContentTypeEnum("content_type").default("document"),
  webViewLink: varchar("web_view_link"),
  webContentLink: varchar("web_content_link"),
  thumbnailLink: varchar("thumbnail_link"),
  fileSize: varchar("file_size"),
  folderPath: varchar("folder_path"),
  moduleId: varchar("module_id"),
  viewCount: integer("view_count").default(0),
  downloadCount: integer("download_count").default(0),
  isActive: boolean("is_active").default(true),
  requiresMembership: boolean("requires_membership").default(true),
  roleAccess: text("role_access").array(),
  syncedAt: timestamp("synced_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User training progress
export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  contentType: varchar("content_type").notNull(),
  contentId: varchar("content_id").notNull(),
  status: trainingStatusEnum("status").default("not_started"),
  progressPercent: integer("progress_percent").default(0),
  timeSpent: integer("time_spent").default(0),
  viewCount: integer("view_count").default(0),
  lastViewedAt: timestamp("last_viewed_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User track enrollments
export const trackEnrollments = pgTable("track_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  trackId: varchar("track_id").notNull(),
  status: trainingStatusEnum("status").default("not_started"),
  progressPercent: integer("progress_percent").default(0),
  modulesCompleted: integer("modules_completed").default(0),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Module-Quiz junction (which quizzes belong to which modules)
export const moduleQuizzes = pgTable("module_quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").notNull(),
  quizId: varchar("quiz_id").notNull(),
  sortOrder: integer("sort_order").default(0),
  isRequired: boolean("is_required").default(true),
});

// Module-Content junction (which content items belong to which modules)
export const moduleContent = pgTable("module_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").notNull(),
  contentType: varchar("content_type").notNull(),
  contentId: varchar("content_id").notNull(),
  sortOrder: integer("sort_order").default(0),
  isRequired: boolean("is_required").default(true),
});

// Referral status enum
export const referralStatusEnum = pgEnum("referral_status", ["pending", "active", "completed", "cancelled"]);

// Doctor referrals/downline tracking
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull(), // The doctor who made the referral
  referredUserId: varchar("referred_user_id"), // User who signed up via referral (null until signup)
  referralCode: varchar("referral_code").notNull().unique(), // Unique referral code
  referredEmail: varchar("referred_email"), // Email of person being referred
  referredName: varchar("referred_name"), // Name of person being referred
  status: referralStatusEnum("status").default("pending"),
  signupDate: timestamp("signup_date"), // When the referred user signed up
  totalPurchases: decimal("total_purchases", { precision: 10, scale: 2 }).default("0"),
  commissionEarned: decimal("commission_earned", { precision: 10, scale: 2 }).default("0"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("10.00"), // Percentage
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WordPress Role Definitions - tracks all roles discovered from WordPress
export const wpRoleDefinitions = pgTable("wp_role_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  wpRoleSlug: varchar("wp_role_slug").notNull().unique(), // e.g., "healer", "ff_doctor", "holtorf_group"
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  source: varchar("source").default("wordpress"), // wordpress, woocommerce, manual
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Role Mappings - maps WordPress roles to app pricing tiers and access
export const wpRoleMappings = pgTable("wp_role_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  wpRoleSlug: varchar("wp_role_slug").notNull(), // FK to wp_role_definitions
  appRole: userRoleEnum("app_role").notNull().default("member"), // maps to app enum
  priceTier: varchar("price_tier").notNull().default("retail"), // retail, wholesale, doctor, custom
  canViewPricing: boolean("can_view_pricing").default(true),
  canPurchase: boolean("can_purchase").default(true),
  canAccessMemberContent: boolean("can_access_member_content").default(true),
  priority: integer("priority").default(0), // for users with multiple roles, higher = more access
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User WordPress Roles - tracks actual WP roles per user (normalized from wpRoles string)
export const userWpRoles = pgTable("user_wp_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  wpRoleSlug: varchar("wp_role_slug").notNull(),
  isPrimary: boolean("is_primary").default(false),
  syncedAt: timestamp("synced_at").defaultNow(),
});

// Sync status enum
export const syncStatusEnum = pgEnum("sync_status", ["pending", "running", "completed", "failed"]);
export const syncTypeEnum = pgEnum("sync_type", ["users", "products", "categories", "roles", "full"]);

// Sync Jobs - tracks sync operations for monitoring
export const syncJobs = pgTable("sync_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  syncType: syncTypeEnum("sync_type").notNull(),
  status: syncStatusEnum("status").default("pending"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  totalItems: integer("total_items").default(0),
  processedItems: integer("processed_items").default(0),
  successItems: integer("success_items").default(0),
  failedItems: integer("failed_items").default(0),
  errorLog: text("error_log"),
  triggeredBy: varchar("triggered_by"), // userId or "webhook" or "scheduled"
  createdAt: timestamp("created_at").defaultNow(),
});

// Sync Events - detailed log of sync activities
export const syncEvents = pgTable("sync_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id"),
  eventType: varchar("event_type").notNull(), // user_created, user_updated, product_synced, etc.
  entityType: varchar("entity_type").notNull(), // user, product, category
  entityId: varchar("entity_id"),
  wpEntityId: varchar("wp_entity_id"),
  status: varchar("status").default("success"), // success, error, skipped
  details: text("details"), // JSON details
  createdAt: timestamp("created_at").defaultNow(),
});

// WordPress Webhook Configuration
export const wpWebhooks = pgTable("wp_webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topic: varchar("topic").notNull(), // user.created, user.updated, order.created, etc.
  webhookId: varchar("webhook_id"), // WooCommerce webhook ID
  secret: varchar("secret").notNull(), // Secret for signature verification
  isActive: boolean("is_active").default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contracts
export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  clinicId: varchar("clinic_id"),
  templateId: varchar("template_id"),
  signNowDocumentId: varchar("signnow_document_id"),
  signNowEnvelopeId: varchar("signnow_envelope_id"),
  embeddedSigningUrl: varchar("embedded_signing_url"),
  doctorName: varchar("doctor_name"),
  doctorEmail: varchar("doctor_email"),
  clinicName: varchar("clinic_name"),
  licenseNumber: varchar("license_number"),
  specialization: varchar("specialization"),
  phone: varchar("phone"),
  status: contractStatusEnum("status").default("pending"),
  signedAt: timestamp("signed_at"),
  feePaid: boolean("fee_paid").default(false),
  feeAmount: decimal("fee_amount", { precision: 10, scale: 2 }).default("10.00"),
  contractUrl: varchar("contract_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Legal Document Types
export const legalDocTypeEnum = pgEnum("legal_doc_type", ["trademark", "patent", "agreement", "filing", "compliance"]);
export const legalDocStatusEnum = pgEnum("legal_doc_status", ["draft", "review", "pending_signature", "filed", "approved", "rejected"]);

// Legal Documents (for trademarks, patents, agreements)
export const legalDocuments = pgTable("legal_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  docType: legalDocTypeEnum("doc_type").notNull(),
  status: legalDocStatusEnum("status").default("draft"),
  description: text("description"),
  content: text("content"), // Full document content/draft
  filingNumber: varchar("filing_number"), // USPTO number, etc.
  jurisdiction: varchar("jurisdiction").default("United States"),
  assignedAgent: varchar("assigned_agent"), // Which AI agent drafted/owns this
  driveFileId: varchar("drive_file_id"), // Google Drive file reference
  driveUrl: varchar("drive_url"),
  signNowDocId: varchar("signnow_doc_id"), // If needs signature
  signNowTemplateId: varchar("signnow_template_id"), // SignNow template ID for this document
  priority: varchar("priority").default("normal"), // urgent, high, normal, low
  dueDate: timestamp("due_date"),
  filedDate: timestamp("filed_date"),
  approvedDate: timestamp("approved_date"),
  notes: text("notes"),
  createdBy: varchar("created_by").default("JURIS"),
  reviewedBy: varchar("reviewed_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLegalDocumentSchema = createInsertSchema(legalDocuments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLegalDocument = z.infer<typeof insertLegalDocumentSchema>;
export type LegalDocument = typeof legalDocuments.$inferSelect;

// Chat rooms (for group chats or direct messages)
export const chatRooms = pgTable("chat_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name"),
  type: varchar("type").default("direct"), // direct, group, support
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat room participants
export const chatParticipants = pgTable("chat_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  userId: varchar("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastReadAt: timestamp("last_read_at"),
});

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  content: text("content").notNull(),
  messageType: varchar("message_type").default("text"), // text, image, file
  isEdited: boolean("is_edited").default(false),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Doctor Scheduling Appointments
export const appointmentTypeEnum = pgEnum("appointment_type", ["consultation", "follow-up", "blood-analysis"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["scheduled", "completed", "cancelled", "no-show"]);

export const doctorAppointments = pgTable("doctor_appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id").notNull(),
  patientId: varchar("patient_id").notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  durationMinutes: integer("duration_minutes").default(60),
  appointmentType: appointmentTypeEnum("appointment_type").default("consultation"),
  status: appointmentStatusEnum("status").default("scheduled"),
  notes: text("notes"),
  googleCalendarEventId: varchar("google_calendar_event_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const clinicsRelations = relations(clinics, ({ many }) => ({
  members: many(memberProfiles),
  orders: many(orders),
  contracts: many(contracts),
  enrollments: many(programEnrollments),
}));

export const memberProfilesRelations = relations(memberProfiles, ({ one }) => ({
  clinic: one(clinics, {
    fields: [memberProfiles.clinicId],
    references: [clinics.id],
  }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  products: many(products),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  clinic: one(clinics, {
    fields: [orders.clinicId],
    references: [clinics.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const programsRelations = relations(programs, ({ many }) => ({
  enrollments: many(programEnrollments),
  quizzes: many(quizzes),
}));

export const quizzesRelations = relations(quizzes, ({ many, one }) => ({
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
  product: one(products, {
    fields: [quizzes.productId],
    references: [products.id],
  }),
  program: one(programs, {
    fields: [quizzes.programId],
    references: [programs.id],
  }),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ many, one }) => ({
  quiz: one(quizzes, {
    fields: [quizQuestions.quizId],
    references: [quizzes.id],
  }),
  answers: many(quizAnswers),
  responses: many(quizResponses),
}));

export const quizAnswersRelations = relations(quizAnswers, ({ one }) => ({
  question: one(quizQuestions, {
    fields: [quizAnswers.questionId],
    references: [quizQuestions.id],
  }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ many, one }) => ({
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
  responses: many(quizResponses),
}));

export const quizResponsesRelations = relations(quizResponses, ({ one }) => ({
  attempt: one(quizAttempts, {
    fields: [quizResponses.attemptId],
    references: [quizAttempts.id],
  }),
  question: one(quizQuestions, {
    fields: [quizResponses.questionId],
    references: [quizQuestions.id],
  }),
}));

export const programEnrollmentsRelations = relations(programEnrollments, ({ one }) => ({
  program: one(programs, {
    fields: [programEnrollments.programId],
    references: [programs.id],
  }),
  clinic: one(clinics, {
    fields: [programEnrollments.clinicId],
    references: [clinics.id],
  }),
}));

export const contractsRelations = relations(contracts, ({ one }) => ({
  clinic: one(clinics, {
    fields: [contracts.clinicId],
    references: [clinics.id],
  }),
}));

// Agent Tasks - Track work assignments for AI divisions
export const agentTaskStatusEnum = pgEnum("agent_task_status", ["pending", "in_progress", "completed", "blocked", "failed", "needs_retry"]);
export const agentDivisionEnum = pgEnum("agent_division", ["executive", "marketing", "financial", "legal", "engineering", "science", "support"]);

export const agentTasks = pgTable("agent_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull(),
  division: agentDivisionEnum("division").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  status: agentTaskStatusEnum("status").notNull().default("pending"),
  priority: integer("priority").default(1),
  progress: integer("progress").default(0),
  retryCount: integer("retry_count").default(0),
  lastErrorAt: timestamp("last_error_at"),
  nextRetryAt: timestamp("next_retry_at"),
  errorLog: text("error_log"),
  outputUrl: varchar("output_url"),
  outputDriveFileId: varchar("output_drive_file_id"),
  assignedBy: varchar("assigned_by"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  evidenceRequired: boolean("evidence_required").default(true),
  evidenceType: varchar("evidence_type"),
  evidenceVerified: boolean("evidence_verified").default(false),
  evidenceVerifiedAt: timestamp("evidence_verified_at"),
  evidenceNotes: text("evidence_notes"),
  crossDivisionFrom: varchar("cross_division_from"),
  crossDivisionTo: varchar("cross_division_to"),
  parentTaskId: varchar("parent_task_id"),
  toolCalls: text("tool_calls"),
  agenticIterations: integer("agentic_iterations").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const agentRegistry = pgTable("agent_registry", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().unique(),
  name: varchar("name").notNull(),
  title: varchar("title").notNull(),
  division: agentDivisionEnum("division").notNull(),
  specialty: text("specialty"),
  isActive: boolean("is_active").default(true),
  isLead: boolean("is_lead").default(false),
  aiModel: varchar("ai_model"),
  modelProvider: varchar("model_provider"),
  capabilities: text("capabilities").array(),
  currentTaskId: varchar("current_task_id"),
  pendingTasks: integer("pending_tasks").default(0),
  completedTasks: integer("completed_tasks").default(0),
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAgentRegistrySchema = createInsertSchema(agentRegistry).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAgentRegistry = z.infer<typeof insertAgentRegistrySchema>;
export type AgentRegistry = typeof agentRegistry.$inferSelect;

export const insertAgentTaskSchema = createInsertSchema(agentTasks).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAgentTask = z.infer<typeof insertAgentTaskSchema>;
export type AgentTask = typeof agentTasks.$inferSelect;

// User Notifications - Real-time notifications for members, doctors, and trustees
export const userNotificationTypeEnum = pgEnum("user_notification_type", [
  "protocol_update", "new_message", "training_milestone", "member_enrolled",
  "protocol_approval_request", "agent_task_completed", "research_update", "system_alert"
]);

export const userNotifications = pgTable("user_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: userNotificationTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserNotificationSchema = createInsertSchema(userNotifications).omit({ id: true, createdAt: true });
export type InsertUserNotification = z.infer<typeof insertUserNotificationSchema>;
export type UserNotification = typeof userNotifications.$inferSelect;

export const userNotificationPreferences = pgTable("user_notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  protocolUpdate: boolean("protocol_update").default(true),
  newMessage: boolean("new_message").default(true),
  trainingMilestone: boolean("training_milestone").default(true),
  memberEnrolled: boolean("member_enrolled").default(true),
  protocolApprovalRequest: boolean("protocol_approval_request").default(true),
  agentTaskCompleted: boolean("agent_task_completed").default(true),
  researchUpdate: boolean("research_update").default(true),
  systemAlert: boolean("system_alert").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserNotificationPreferencesSchema = createInsertSchema(userNotificationPreferences).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserNotificationPreferences = z.infer<typeof insertUserNotificationPreferencesSchema>;
export type UserNotificationPreferences = typeof userNotificationPreferences.$inferSelect;

// Sentinel Notifications - Track alerts to the Trustee
export const sentinelNotificationTypeEnum = pgEnum("sentinel_notification_type", [
  "task_completed", "research_update", "module_update", "training_update",
  "rife_update", "blood_analysis", "product_update", "system_alert", "cross_division_request",
  "system_broadcast", "task_routed", "cross_division_coordination"
]);

export const sentinelNotifications = pgTable("sentinel_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: sentinelNotificationTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  agentId: varchar("agent_id"),
  division: varchar("division"),
  taskId: varchar("task_id"),
  outputUrl: varchar("output_url"),
  priority: integer("priority").default(1),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSentinelNotificationSchema = createInsertSchema(sentinelNotifications).omit({ id: true, createdAt: true });
export type InsertSentinelNotification = z.infer<typeof insertSentinelNotificationSchema>;
export type SentinelNotification = typeof sentinelNotifications.$inferSelect;

// Agent Configuration - Trust verification and autonomy settings
export const agentConfigurations = pgTable("agent_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().unique(),
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  autonomyLevel: integer("autonomy_level").default(0), // 0=disabled, 1=ask first, 2=notify after, 3=fully autonomous
  requiresApprovalForImportant: boolean("requires_approval_for_important").default(true),
  trustChallenge: varchar("trust_challenge"), // The question to ask
  trustAnswer: varchar("trust_answer"), // Expected answer (hashed)
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAgentConfigurationSchema = createInsertSchema(agentConfigurations).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAgentConfiguration = z.infer<typeof insertAgentConfigurationSchema>;
export type AgentConfiguration = typeof agentConfigurations.$inferSelect;

// Athena Email Approvals - Track emails pending Trustee approval
export const athenaEmailApprovals = pgTable("athena_email_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailThreadId: varchar("email_thread_id"),
  fromEmail: varchar("from_email").notNull(),
  subject: varchar("subject").notNull(),
  summary: text("summary"),
  suggestedResponse: text("suggested_response"),
  importance: varchar("importance").default("normal"), // low, normal, high, urgent
  status: varchar("status").default("pending"), // pending, approved, rejected, auto_handled
  trusteeNotes: text("trustee_notes"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAthenaEmailApprovalSchema = createInsertSchema(athenaEmailApprovals).omit({ id: true, createdAt: true });
export type InsertAthenaEmailApproval = z.infer<typeof insertAthenaEmailApprovalSchema>;
export type AthenaEmailApproval = typeof athenaEmailApprovals.$inferSelect;

// Agent Task Reviews - Cross-division review requests
export const reviewStatusEnum = pgEnum("review_status", ["pending", "approved", "rejected", "needs_changes"]);

export const agentTaskReviews = pgTable("agent_task_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull(),
  requestingAgentId: varchar("requesting_agent_id").notNull(),
  requestingDivision: agentDivisionEnum("requesting_division").notNull(),
  reviewerAgentId: varchar("reviewer_agent_id"),
  reviewerDivision: agentDivisionEnum("reviewer_division"),
  status: reviewStatusEnum("status").default("pending"),
  reviewNotes: text("review_notes"),
  feedback: text("feedback"),
  requestedAt: timestamp("requested_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertAgentTaskReviewSchema = createInsertSchema(agentTaskReviews).omit({ id: true, requestedAt: true });
export const updateAgentTaskReviewSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "needs_changes"]).optional(),
  feedback: z.string().optional(),
  reviewNotes: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});
export type InsertAgentTaskReview = z.infer<typeof insertAgentTaskReviewSchema>;
export type UpdateAgentTaskReview = z.infer<typeof updateAgentTaskReviewSchema>;
export type AgentTaskReview = typeof agentTaskReviews.$inferSelect;

// Division Leadership - Track division leads and project coordination
export const divisionLeads = pgTable("division_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  division: agentDivisionEnum("division").notNull().unique(),
  leadAgentId: varchar("lead_agent_id").notNull(),
  reportsTo: varchar("reports_to").default("sentinel"), // All report to SENTINEL
  launchDeadline: timestamp("launch_deadline"),
  progressPercent: integer("progress_percent").default(0),
  status: varchar("status").default("active"), // active, blocked, ahead, behind
  lastStatusUpdate: timestamp("last_status_update"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDivisionLeadSchema = createInsertSchema(divisionLeads).omit({ id: true, createdAt: true, updatedAt: true });
export const updateDivisionLeadSchema = z.object({
  progressPercent: z.number().min(0).max(100).optional(),
  status: z.enum(["active", "blocked", "ahead", "behind"]).optional(),
  notes: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});
export type InsertDivisionLead = z.infer<typeof insertDivisionLeadSchema>;
export type UpdateDivisionLead = z.infer<typeof updateDivisionLeadSchema>;
export type DivisionLead = typeof divisionLeads.$inferSelect;

// Insert schemas
export const insertMemberProfileSchema = createInsertSchema(memberProfiles).omit({ id: true, createdAt: true });
export const insertClinicSchema = createInsertSchema(clinics).omit({ id: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertProductVariationSchema = createInsertSchema(productVariations).omit({ id: true });
export const insertProductRolePriceSchema = createInsertSchema(productRolePrices).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProgramSchema = createInsertSchema(programs).omit({ id: true, createdAt: true });
export const insertProgramEnrollmentSchema = createInsertSchema(programEnrollments).omit({ id: true, startedAt: true });
export const insertContractSchema = createInsertSchema(contracts).omit({ id: true, createdAt: true });
export const insertLibraryItemSchema = createInsertSchema(libraryItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({ id: true });
export const insertQuizAnswerSchema = createInsertSchema(quizAnswers).omit({ id: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true, startedAt: true });
export const insertQuizResponseSchema = createInsertSchema(quizResponses).omit({ id: true });
export const insertTrainingModuleSchema = createInsertSchema(trainingModules).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrainingTrackSchema = createInsertSchema(trainingTracks).omit({ id: true, createdAt: true });
export const insertTrackModuleSchema = createInsertSchema(trackModules).omit({ id: true });
export const insertDriveDocumentSchema = createInsertSchema(driveDocuments).omit({ id: true, createdAt: true, updatedAt: true, syncedAt: true });
export const insertUserProgressSchema = createInsertSchema(userProgress).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrackEnrollmentSchema = createInsertSchema(trackEnrollments).omit({ id: true, startedAt: true });
export const insertModuleQuizSchema = createInsertSchema(moduleQuizzes).omit({ id: true });
export const insertModuleContentSchema = createInsertSchema(moduleContent).omit({ id: true });
export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWpRoleDefinitionSchema = createInsertSchema(wpRoleDefinitions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWpRoleMappingSchema = createInsertSchema(wpRoleMappings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserWpRoleSchema = createInsertSchema(userWpRoles).omit({ id: true, syncedAt: true });
export const insertSyncJobSchema = createInsertSchema(syncJobs).omit({ id: true, createdAt: true });
export const insertSyncEventSchema = createInsertSchema(syncEvents).omit({ id: true, createdAt: true });
export const insertWpWebhookSchema = createInsertSchema(wpWebhooks).omit({ id: true, createdAt: true });
export const insertChatRoomSchema = createInsertSchema(chatRooms).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChatParticipantSchema = createInsertSchema(chatParticipants).omit({ id: true, joinedAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type InsertMemberProfile = z.infer<typeof insertMemberProfileSchema>;
export type MemberProfile = typeof memberProfiles.$inferSelect;
export type InsertClinic = z.infer<typeof insertClinicSchema>;
export type Clinic = typeof clinics.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProductVariation = z.infer<typeof insertProductVariationSchema>;
export type ProductVariation = typeof productVariations.$inferSelect;
export type InsertProductRolePrice = z.infer<typeof insertProductRolePriceSchema>;
export type ProductRolePrice = typeof productRolePrices.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programs.$inferSelect;
export type InsertProgramEnrollment = z.infer<typeof insertProgramEnrollmentSchema>;
export type ProgramEnrollment = typeof programEnrollments.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertLibraryItem = z.infer<typeof insertLibraryItemSchema>;
export type LibraryItem = typeof libraryItems.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizAnswer = z.infer<typeof insertQuizAnswerSchema>;
export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizResponse = z.infer<typeof insertQuizResponseSchema>;
export type QuizResponse = typeof quizResponses.$inferSelect;
export type InsertTrainingModule = z.infer<typeof insertTrainingModuleSchema>;
export type TrainingModule = typeof trainingModules.$inferSelect;
export type InsertTrainingTrack = z.infer<typeof insertTrainingTrackSchema>;
export type TrainingTrack = typeof trainingTracks.$inferSelect;
export type InsertTrackModule = z.infer<typeof insertTrackModuleSchema>;
export type TrackModule = typeof trackModules.$inferSelect;
export type InsertDriveDocument = z.infer<typeof insertDriveDocumentSchema>;
export type DriveDocument = typeof driveDocuments.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertTrackEnrollment = z.infer<typeof insertTrackEnrollmentSchema>;
export type TrackEnrollment = typeof trackEnrollments.$inferSelect;
export type InsertModuleQuiz = z.infer<typeof insertModuleQuizSchema>;
export type ModuleQuiz = typeof moduleQuizzes.$inferSelect;
export type InsertModuleContent = z.infer<typeof insertModuleContentSchema>;
export type ModuleContent = typeof moduleContent.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertWpRoleDefinition = z.infer<typeof insertWpRoleDefinitionSchema>;
export type WpRoleDefinition = typeof wpRoleDefinitions.$inferSelect;
export type InsertWpRoleMapping = z.infer<typeof insertWpRoleMappingSchema>;
export type WpRoleMapping = typeof wpRoleMappings.$inferSelect;
export type InsertUserWpRole = z.infer<typeof insertUserWpRoleSchema>;
export type UserWpRole = typeof userWpRoles.$inferSelect;
export type InsertSyncJob = z.infer<typeof insertSyncJobSchema>;
export type SyncJob = typeof syncJobs.$inferSelect;
export type InsertSyncEvent = z.infer<typeof insertSyncEventSchema>;
export type SyncEvent = typeof syncEvents.$inferSelect;
export type InsertWpWebhook = z.infer<typeof insertWpWebhookSchema>;
export type WpWebhook = typeof wpWebhooks.$inferSelect;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatParticipant = z.infer<typeof insertChatParticipantSchema>;
export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// User role type
export type UserRole = "admin" | "trustee" | "doctor" | "clinic" | "member";
export type PricingVisibility = "always" | "members_only" | "hidden";

// Diane AI Conversations
export const dianeConversations = pgTable("diane_conversations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  userName: varchar("user_name"),
  title: varchar("title").notNull().default("New Conversation"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dianeMessages = pgTable("diane_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversation_id").notNull(),
  role: varchar("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDianeConversationSchema = createInsertSchema(dianeConversations).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertDianeMessageSchema = createInsertSchema(dianeMessages).omit({
  createdAt: true,
});

export type DianeConversation = typeof dianeConversations.$inferSelect;
export type InsertDianeConversation = z.infer<typeof insertDianeConversationSchema>;
export type DianeMessage = typeof dianeMessages.$inferSelect;
export type InsertDianeMessage = z.infer<typeof insertDianeMessageSchema>;

// Diane Knowledge Base - Therapy Protocols, Recipes, and Healing Knowledge
export const dianeKnowledgeCategoryEnum = pgEnum("diane_knowledge_category", [
  "therapy_protocol",
  "recipe",
  "supplement",
  "detox",
  "diet_plan",
  "healing_modality",
  "research",
  "case_study"
]);

export const dianeKnowledge = pgTable("diane_knowledge", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  category: dianeKnowledgeCategoryEnum("category").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  summary: text("summary"),
  content: text("content").notNull(),
  sourceDocument: varchar("source_document", { length: 500 }),
  driveFileId: varchar("drive_file_id"),
  tags: text("tags").array(),
  relatedProducts: text("related_products").array(),
  relatedGenes: text("related_genes").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDianeKnowledgeSchema = createInsertSchema(dianeKnowledge).omit({
  createdAt: true,
  updatedAt: true,
});

export type DianeKnowledge = typeof dianeKnowledge.$inferSelect;
export type InsertDianeKnowledge = z.infer<typeof insertDianeKnowledgeSchema>;

// Support Agent Types
export const supportAgentTypeEnum = pgEnum("support_agent_type", [
  "diane", "pete", "sam", "pat", "corporate", "diagnostics", "minerals"
]);

// Support Conversations (generalized for all agents)
export const supportConversations = pgTable("support_conversations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  userName: varchar("user_name"),
  agentType: supportAgentTypeEnum("agent_type").notNull().default("corporate"),
  title: varchar("title").notNull().default("New Conversation"),
  status: varchar("status").default("active"),
  priority: varchar("priority").default("normal"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const supportMessages = pgTable("support_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversation_id").notNull(),
  role: varchar("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSupportConversationSchema = createInsertSchema(supportConversations).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({
  createdAt: true,
});

export type SupportConversation = typeof supportConversations.$inferSelect;
export type InsertSupportConversation = z.infer<typeof insertSupportConversationSchema>;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;
export type SupportAgentType = "diane" | "pete" | "sam" | "pat" | "corporate" | "diagnostics" | "minerals";

// =====================================================
// BLOOD MICROSCOPY SAMPLE LIBRARY
// Comprehensive reference database for blood analysis AI
// =====================================================

export const bloodSampleOrganismTypeEnum = pgEnum("blood_sample_organism_type", [
  "virus",
  "bacteria",
  "parasite",
  "fungus",
  "cell_abnormality",
  "blood_cell_morphology",
  "artifact",
  "crystal",
  "protein_pattern"
]);

export const bloodSampleCategoryEnum = pgEnum("blood_sample_category", [
  "pathogen",
  "morphology",
  "nutritional_marker",
  "toxicity_indicator",
  "immune_response",
  "oxidative_stress",
  "coagulation",
  "reference_normal"
]);

export const bloodSampleStainEnum = pgEnum("blood_sample_stain", [
  "unstained",
  "wright_giemsa",
  "gram_stain",
  "acid_fast",
  "periodic_acid_schiff",
  "dark_field",
  "phase_contrast",
  "electron_microscopy"
]);

// Main blood samples table
export const bloodSamples = pgTable("blood_samples", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  scientificName: varchar("scientific_name"),
  commonName: varchar("common_name"),
  organismType: bloodSampleOrganismTypeEnum("organism_type").notNull(),
  category: bloodSampleCategoryEnum("category").notNull(),

  // Detailed descriptions for AI context
  description: text("description").notNull(),
  clinicalSignificance: text("clinical_significance"),
  diagnosticCriteria: text("diagnostic_criteria"),
  differentialDiagnosis: text("differential_diagnosis"),

  // Microscopy details
  magnification: varchar("magnification"), // e.g., "1000x", "10000x"
  stainType: bloodSampleStainEnum("stain_type").default("unstained"),
  sampleType: varchar("sample_type"), // whole blood, buffy coat, plasma, serum
  preparationMethod: text("preparation_method"),

  // Visual identification features
  morphologyDescription: text("morphology_description"),
  sizeRange: varchar("size_range"), // e.g., "100-200nm", "5-10μm"
  shapeCharacteristics: text("shape_characteristics"),
  colorCharacteristics: text("color_characteristics"),

  // Clinical context
  associatedConditions: text("associated_conditions").array(),
  symptoms: text("symptoms").array(),
  transmissionRoute: varchar("transmission_route"),
  prevalence: varchar("prevalence"),

  // Media assets
  imageUrl: varchar("image_url"),
  thumbnailUrl: varchar("thumbnail_url"),
  additionalImages: text("additional_images").array(),

  // AI training metadata
  identificationKeywords: text("identification_keywords").array(),
  aiPromptContext: text("ai_prompt_context"), // Pre-written context for AI analysis
  confidenceFactors: text("confidence_factors"), // What makes identification certain

  // Source and citations
  sourceCitation: text("source_citation"),
  sourceUrl: varchar("source_url"),
  lastVerifiedDate: timestamp("last_verified_date"),

  // Metadata
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tags for searchability and categorization
export const bloodSampleTags = pgTable("blood_sample_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sampleId: varchar("sample_id").notNull().references(() => bloodSamples.id, { onDelete: "cascade" }),
  tag: varchar("tag").notNull(),
  tagCategory: varchar("tag_category"), // e.g., "symptom", "location", "severity"
});

// Related samples for differential diagnosis
export const bloodSampleRelations = pgTable("blood_sample_relations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sampleId: varchar("sample_id").notNull().references(() => bloodSamples.id, { onDelete: "cascade" }),
  relatedSampleId: varchar("related_sample_id").notNull().references(() => bloodSamples.id, { onDelete: "cascade" }),
  relationType: varchar("relation_type").notNull(), // "similar_appearance", "co-infection", "differential"
  notes: text("notes"),
});

// Insert schemas and types
export const insertBloodSampleSchema = createInsertSchema(bloodSamples).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBloodSample = z.infer<typeof insertBloodSampleSchema>;
export type BloodSample = typeof bloodSamples.$inferSelect;

export const insertBloodSampleTagSchema = createInsertSchema(bloodSampleTags).omit({
  id: true,
});
export type InsertBloodSampleTag = z.infer<typeof insertBloodSampleTagSchema>;
export type BloodSampleTag = typeof bloodSampleTags.$inferSelect;

export const insertBloodSampleRelationSchema = createInsertSchema(bloodSampleRelations).omit({
  id: true,
});
export type InsertBloodSampleRelation = z.infer<typeof insertBloodSampleRelationSchema>;
export type BloodSampleRelation = typeof bloodSampleRelations.$inferSelect;

export type BloodSampleOrganismType = "virus" | "bacteria" | "parasite" | "fungus" | "cell_abnormality" | "blood_cell_morphology" | "artifact" | "crystal" | "protein_pattern";
export type BloodSampleCategory = "pathogen" | "morphology" | "nutritional_marker" | "toxicity_indicator" | "immune_response" | "oxidative_stress" | "coagulation" | "reference_normal";
export type BloodSampleStain = "unstained" | "wright_giemsa" | "gram_stain" | "acid_fast" | "periodic_acid_schiff" | "dark_field" | "phase_contrast" | "electron_microscopy";

// Network Doctors - Doctor/Clinic network for ALLIO debut
export const networkDoctors = pgTable("network_doctors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  drName: varchar("dr_name").notNull(),
  clinicName: varchar("clinic_name"),
  phoneNumber: varchar("phone_number"),
  onboardingDate: varchar("onboarding_date"),
  onboardedBy: varchar("onboarded_by"),
  practiceType: varchar("practice_type"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  onMap: boolean("on_map").default(false),
  email: varchar("email"),
  signupLink: varchar("signup_link"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNetworkDoctorSchema = createInsertSchema(networkDoctors).omit({ id: true, createdAt: true });
export type InsertNetworkDoctor = z.infer<typeof insertNetworkDoctorSchema>;
export type NetworkDoctor = typeof networkDoctors.$inferSelect;

// Drive Assets Catalog - Index of all marketing and agent assets
export const driveAssets = pgTable("drive_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driveFileId: varchar("drive_file_id").notNull().unique(),
  name: varchar("name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  path: text("path"),
  division: varchar("division"),
  agent: varchar("agent"),
  category: varchar("category"),
  tags: text("tags").array(),
  description: text("description"),
  thumbnailLink: text("thumbnail_link"),
  webViewLink: text("web_view_link"),
  fileSize: varchar("file_size"),
  parentFolderId: varchar("parent_folder_id"),
  modifiedTime: timestamp("modified_time"),
  indexedAt: timestamp("indexed_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const insertDriveAssetSchema = createInsertSchema(driveAssets).omit({ id: true, indexedAt: true });
export type InsertDriveAsset = z.infer<typeof insertDriveAssetSchema>;
export type DriveAsset = typeof driveAssets.$inferSelect;

// Training Certifications - Track completed certifications for members
export const certificationStatusEnum = pgEnum("certification_status", ["pending", "in_progress", "passed", "failed", "expired"]);
export const certificationTypeEnum = pgEnum("certification_type", ["module", "track", "program", "specialist"]);

export const trainingCertifications = pgTable("training_certifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  certificationType: certificationTypeEnum("certification_type").notNull(),
  referenceId: varchar("reference_id").notNull(),
  referenceTitle: varchar("reference_title").notNull(),
  status: certificationStatusEnum("status").default("pending"),
  score: integer("score"),
  passingScore: integer("passing_score").default(80),
  attemptsUsed: integer("attempts_used").default(0),
  maxAttempts: integer("max_attempts").default(3),
  certificateNumber: varchar("certificate_number").unique(),
  issuedAt: timestamp("issued_at"),
  expiresAt: timestamp("expires_at"),
  verificationCode: varchar("verification_code"),
  pdfUrl: varchar("pdf_url"),
  driveFileId: varchar("drive_file_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTrainingCertificationSchema = createInsertSchema(trainingCertifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  certificateNumber: true,
  verificationCode: true,
});
export type InsertTrainingCertification = z.infer<typeof insertTrainingCertificationSchema>;
export type TrainingCertification = typeof trainingCertifications.$inferSelect;

// Blood Analysis Samples - Track uploaded blood samples with AI analysis
export const bloodAnalysisSamples = pgTable("blood_analysis_samples", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  patientId: varchar("patient_id"),
  analysisType: varchar("analysis_type").notNull().default("live-blood"),
  driveFileId: varchar("drive_file_id"),
  fileName: varchar("file_name"),
  mimeType: varchar("mime_type"),
  webViewLink: varchar("web_view_link"),
  thumbnailLink: varchar("thumbnail_link"),
  observedFindings: text("observed_findings").array(),
  patientContext: text("patient_context"),
  aiAnalysis: text("ai_analysis"),
  potentialConditions: text("potential_conditions").array(),
  recommendedTests: text("recommended_tests").array(),
  clinicalNotes: text("clinical_notes"),
  confidence: varchar("confidence"),
  modelUsed: varchar("model_used"),
  analyzedAt: timestamp("analyzed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBloodAnalysisSampleSchema = createInsertSchema(bloodAnalysisSamples).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBloodAnalysisSample = z.infer<typeof insertBloodAnalysisSampleSchema>;
export type BloodAnalysisSample = typeof bloodAnalysisSamples.$inferSelect;

// ============================================
// RESEARCH API - Scientific Database Integration
// ============================================

// Research source enum
export const researchSourceEnum = pgEnum("research_source", ["openalex", "pubmed", "semantic_scholar", "arxiv"]);

// Research papers cache - stores papers from external APIs
export const researchPapers = pgTable("research_papers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  externalId: varchar("external_id").notNull(),
  source: researchSourceEnum("source").notNull(),
  title: text("title").notNull(),
  authors: text("authors").array(),
  abstract: text("abstract"),
  publicationDate: varchar("publication_date"),
  journal: varchar("journal"),
  doi: varchar("doi"),
  url: varchar("url"),
  citationCount: integer("citation_count"),
  tldr: text("tldr"),
  keywords: text("keywords").array(),
  fullTextUrl: varchar("full_text_url"),
  cachedAt: timestamp("cached_at").defaultNow(),
});

// Agent research queries - tracks what agents searched for
export const agentResearchQueries = pgTable("agent_research_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull(),
  agentName: varchar("agent_name").notNull(),
  query: text("query").notNull(),
  sources: text("sources").array(),
  resultsCount: integer("results_count").default(0),
  topPaperIds: text("top_paper_ids").array(),
  purpose: text("purpose"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent research collections - saved research for agents
export const agentResearchCollections = pgTable("agent_research_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull(),
  agentName: varchar("agent_name").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  paperIds: text("paper_ids").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertResearchPaperSchema = createInsertSchema(researchPapers).omit({
  id: true,
  cachedAt: true,
});
export type InsertResearchPaper = z.infer<typeof insertResearchPaperSchema>;
export type ResearchPaper = typeof researchPapers.$inferSelect;

export const insertAgentResearchQuerySchema = createInsertSchema(agentResearchQueries).omit({
  id: true,
  createdAt: true,
});
export type InsertAgentResearchQuery = z.infer<typeof insertAgentResearchQuerySchema>;
export type AgentResearchQuery = typeof agentResearchQueries.$inferSelect;

// ============================================
// MEMBER ENGAGEMENT - Achievements, Bookmarks, Discussions
// ============================================

// Achievement type enum
export const achievementTypeEnum = pgEnum("achievement_type", [
  "module_complete",
  "track_complete",
  "quiz_master",
  "streak",
  "community_contributor",
  "first_analysis",
  "certification_earned",
  "milestone"
]);

// Achievements/Badges - Define available achievements
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  type: achievementTypeEnum("type").notNull(),
  icon: varchar("icon").default("trophy"),
  color: varchar("color").default("gold"),
  points: integer("points").default(10),
  criteria: jsonb("criteria"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true, createdAt: true });
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

// User Achievements - Track earned achievements
export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  achievementId: varchar("achievement_id").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
  progress: integer("progress").default(100),
  metadata: jsonb("metadata"),
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({ id: true, earnedAt: true });
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;

// ============================================
// INTERACTIVE HEALING - Quizzes & Progress
// ============================================

export const trainingQuizzes = pgTable("training_quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  questions: jsonb("questions").notNull(), // Array of { question, options, correctAnswerIndex, explanation }
  passingScore: integer("passing_score").default(80),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTrainingQuizSchema = createInsertSchema(trainingQuizzes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTrainingQuiz = z.infer<typeof insertTrainingQuizSchema>;
export type TrainingQuiz = typeof trainingQuizzes.$inferSelect;

export const userQuizResults = pgTable("user_quiz_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  quizId: varchar("quiz_id").notNull(),
  score: integer("score").notNull(),
  passed: boolean("passed").notNull(),
  answers: jsonb("answers"), // Array of { questionId/Index, selectedOptionIndex }
  attemptedAt: timestamp("attempted_at").defaultNow(),
});

export const insertUserQuizResultSchema = createInsertSchema(userQuizResults).omit({ id: true, attemptedAt: true });
export type InsertUserQuizResult = z.infer<typeof insertUserQuizResultSchema>;
export type UserQuizResult = typeof userQuizResults.$inferSelect;

export const userProgressTracking = pgTable("user_progress_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  moduleId: varchar("module_id").notNull(),
  status: varchar("status").default("in_progress"), // started, completed
  progressPercentage: integer("progress_percentage").default(0),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertUserProgressTrackingSchema = createInsertSchema(userProgressTracking).omit({ id: true });
export type InsertUserProgressTracking = z.infer<typeof insertUserProgressTrackingSchema>;
export type UserProgressTracking = typeof userProgressTracking.$inferSelect;

// Module Bookmarks - Members can bookmark favorite modules
export const moduleBookmarks = pgTable("module_bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  moduleId: varchar("module_id").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertModuleBookmarkSchema = createInsertSchema(moduleBookmarks).omit({ id: true, createdAt: true });
export type InsertModuleBookmark = z.infer<typeof insertModuleBookmarkSchema>;
export type ModuleBookmark = typeof moduleBookmarks.$inferSelect;

// Discussion Threads - Community discussions on modules
export const discussionThreads = pgTable("discussion_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id"),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull(),
  authorName: varchar("author_name"),
  isPinned: boolean("is_pinned").default(false),
  isLocked: boolean("is_locked").default(false),
  viewCount: integer("view_count").default(0),
  replyCount: integer("reply_count").default(0),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDiscussionThreadSchema = createInsertSchema(discussionThreads).omit({ id: true, createdAt: true, updatedAt: true, lastActivityAt: true });
export type InsertDiscussionThread = z.infer<typeof insertDiscussionThreadSchema>;
export type DiscussionThread = typeof discussionThreads.$inferSelect;

// Discussion Replies
export const discussionReplies = pgTable("discussion_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull(),
  authorName: varchar("author_name"),
  parentReplyId: varchar("parent_reply_id"),
  upvotes: integer("upvotes").default(0),
  isEdited: boolean("is_edited").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDiscussionReplySchema = createInsertSchema(discussionReplies).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDiscussionReply = z.infer<typeof insertDiscussionReplySchema>;
export type DiscussionReply = typeof discussionReplies.$inferSelect;

// ========================
// DOCTOR DASHBOARD SCHEMA
// ========================

// Patient Record Status Enum
export const patientRecordStatusEnum = pgEnum("patient_record_status", [
  "active", "inactive", "archived", "pending_review"
]);

// Record Type Enum
export const recordTypeEnum = pgEnum("record_type", [
  "blood_work", "x_ray", "mri", "ct_scan", "ultrasound", "skin_analysis",
  "intake_form", "questionnaire", "lab_report", "consultation_notes", "other"
]);

// Protocol Status Enum
export const protocolStatusEnum = pgEnum("protocol_status", [
  "draft", "active", "paused", "completed", "discontinued"
]);

// Message Status Enum
export const messageStatusEnum = pgEnum("message_status", [
  "sent", "delivered", "read", "archived"
]);

// Patient Records - Core patient data for doctors
export const patientRecords = pgTable("patient_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id").notNull(),
  memberId: varchar("member_id").notNull(),
  memberName: varchar("member_name").notNull(),
  memberEmail: varchar("member_email"),
  phone: varchar("phone"),
  dateOfBirth: timestamp("date_of_birth"),
  status: patientRecordStatusEnum("status").default("active"),
  // Root Cause Analysis Fields
  primaryConcerns: text("primary_concerns").array(),
  symptomTimeline: jsonb("symptom_timeline"), // When symptoms started, progression
  environmentalFactors: jsonb("environmental_factors"), // Toxins, mold, etc.
  nutritionalDeficiencies: jsonb("nutritional_deficiencies"),
  toxicityAssessment: jsonb("toxicity_assessment"),
  lifestyleFactors: jsonb("lifestyle_factors"), // Sleep, stress, exercise
  familyHistory: jsonb("family_history"),
  previousTreatments: jsonb("previous_treatments"),
  currentMedications: text("current_medications").array(),
  allergies: text("allergies").array(),
  notes: text("notes"),
  lastVisitAt: timestamp("last_visit_at"),
  nextAppointmentAt: timestamp("next_appointment_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPatientRecordSchema = createInsertSchema(patientRecords).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPatientRecord = z.infer<typeof insertPatientRecordSchema>;
export type PatientRecord = typeof patientRecords.$inferSelect;

// Patient Uploads - Files uploaded for patients (bloodwork, imaging, etc.)
export const patientUploads = pgTable("patient_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientRecordId: varchar("patient_record_id").notNull(),
  uploadedBy: varchar("uploaded_by").notNull(), // Doctor or patient ID
  uploadedByRole: varchar("uploaded_by_role").default("doctor"), // doctor, patient, admin
  recordType: recordTypeEnum("record_type").notNull(),
  fileName: varchar("file_name").notNull(),
  fileUrl: varchar("file_url"), // Google Drive URL
  driveFileId: varchar("drive_file_id"), // Google Drive file ID
  mimeType: varchar("mime_type"),
  fileSize: integer("file_size"),
  // AI Analysis Results
  aiAnalyzed: boolean("ai_analyzed").default(false),
  aiAnalysisResult: jsonb("ai_analysis_result"),
  aiAnalyzedAt: timestamp("ai_analyzed_at"),
  aiModel: varchar("ai_model"), // Which HuggingFace model was used
  // Metadata
  description: text("description"),
  notes: text("notes"),
  isReviewed: boolean("is_reviewed").default(false),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPatientUploadSchema = createInsertSchema(patientUploads).omit({ id: true, createdAt: true });
export type InsertPatientUpload = z.infer<typeof insertPatientUploadSchema>;
export type PatientUpload = typeof patientUploads.$inferSelect;

// Patient Protocols - Assigned protocols/products to patients
export const patientProtocols = pgTable("patient_protocols", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientRecordId: varchar("patient_record_id").notNull(),
  doctorId: varchar("doctor_id").notNull(),
  protocolName: varchar("protocol_name").notNull(),
  protocolType: varchar("protocol_type"), // peptide, supplement, lifestyle, diet
  description: text("description"),
  status: protocolStatusEnum("status").default("draft"),
  // Protocol Details
  products: jsonb("products"), // Array of products with dosages
  schedule: jsonb("schedule"), // Dosing schedule
  duration: varchar("duration"), // e.g., "12 weeks"
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  // Progress Tracking
  progressNotes: jsonb("progress_notes"), // Array of progress updates
  currentWeek: integer("current_week").default(1),
  complianceScore: integer("compliance_score"), // 0-100
  // Outcomes
  expectedOutcomes: text("expected_outcomes").array(),
  actualOutcomes: text("actual_outcomes").array(),
  sideEffects: text("side_effects").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPatientProtocolSchema = createInsertSchema(patientProtocols).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPatientProtocol = z.infer<typeof insertPatientProtocolSchema>;
export type PatientProtocol = typeof patientProtocols.$inferSelect;

// Doctor-Patient Messages - Secure messaging
export const doctorPatientMessages = pgTable("doctor_patient_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(), // Groups messages
  senderId: varchar("sender_id").notNull(),
  senderRole: varchar("sender_role").notNull(), // doctor, patient, admin
  senderName: varchar("sender_name"),
  recipientId: varchar("recipient_id").notNull(),
  recipientRole: varchar("recipient_role").notNull(),
  recipientName: varchar("recipient_name"),
  subject: varchar("subject"),
  content: text("content").notNull(),
  status: messageStatusEnum("status").default("sent"),
  // Attachments
  attachments: jsonb("attachments"), // Array of file references
  // Metadata
  isUrgent: boolean("is_urgent").default(false),
  readAt: timestamp("read_at"),
  parentMessageId: varchar("parent_message_id"), // For threading
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDoctorPatientMessageSchema = createInsertSchema(doctorPatientMessages).omit({ id: true, createdAt: true });
export type InsertDoctorPatientMessage = z.infer<typeof insertDoctorPatientMessageSchema>;
export type DoctorPatientMessage = typeof doctorPatientMessages.$inferSelect;

// Conversations - Track message threads
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientRecordId: varchar("patient_record_id"),
  participantIds: text("participant_ids").array().notNull(),
  participantNames: text("participant_names").array(),
  subject: varchar("subject"),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  lastMessagePreview: text("last_message_preview"),
  unreadCount: integer("unread_count").default(0),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true });
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// AI Analysis Requests - Track HuggingFace API usage
export const aiAnalysisRequests = pgTable("ai_analysis_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientUploadId: varchar("patient_upload_id").notNull(),
  requestedBy: varchar("requested_by").notNull(),
  analysisType: varchar("analysis_type").notNull(), // xray, skin, blood
  model: varchar("model").notNull(), // HuggingFace model ID
  status: varchar("status").default("pending"), // pending, processing, completed, failed
  result: jsonb("result"),
  confidence: decimal("confidence"),
  processingTimeMs: integer("processing_time_ms"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertAiAnalysisRequestSchema = createInsertSchema(aiAnalysisRequests).omit({ id: true, createdAt: true });
export type InsertAiAnalysisRequest = z.infer<typeof insertAiAnalysisRequestSchema>;
export type AiAnalysisRequest = typeof aiAnalysisRequests.$inferSelect;

// AI Model Evaluations - Used by the ARCHITECT agent to propose HuggingFace upgrades
export const aiModelEvaluations = pgTable("ai_model_evaluations", {
  id: serial("id").primaryKey(),
  modelId: varchar("model_id").notNull(), // HuggingFace model ID (e.g., Qwen/Qwen1.5-7B)
  category: varchar("category").notNull(), // "medical-vision", "text-classification", "diagnostics"
  proposedByAgent: varchar("proposed_by_agent").notNull(), // usually ARCHITECT
  downloads: integer("downloads").default(0),
  rationale: text("rationale").notNull(), // Why architecture thinks we should switch
  status: varchar("status").default("pending"), // "pending", "approved", "rejected"
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertAiModelEvaluationSchema = createInsertSchema(aiModelEvaluations).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
});

export type InsertAiModelEvaluation = z.infer<typeof insertAiModelEvaluationSchema>;
export type AiModelEvaluation = typeof aiModelEvaluations.$inferSelect;

// Practice Analytics - Track doctor practice metrics
export const practiceAnalytics = pgTable("practice_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id").notNull(),
  date: timestamp("date").notNull(),
  // Patient Metrics
  totalPatients: integer("total_patients").default(0),
  newPatients: integer("new_patients").default(0),
  activeProtocols: integer("active_protocols").default(0),
  completedProtocols: integer("completed_protocols").default(0),
  // Engagement Metrics
  consultations: integer("consultations").default(0),
  messagesSent: integer("messages_sent").default(0),
  uploadsReviewed: integer("uploads_reviewed").default(0),
  aiAnalysesRun: integer("ai_analyses_run").default(0),
  // Outcomes
  successfulOutcomes: integer("successful_outcomes").default(0),
  averageComplianceScore: decimal("average_compliance_score"),
  // Revenue (optional)
  referralRevenue: decimal("referral_revenue"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPracticeAnalyticsSchema = createInsertSchema(practiceAnalytics).omit({ id: true, createdAt: true });
export type InsertPracticeAnalytics = z.infer<typeof insertPracticeAnalyticsSchema>;
export type PracticeAnalytics = typeof practiceAnalytics.$inferSelect;

// API Keys - External authentication for API access
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  keyPrefix: varchar("key_prefix", { length: 16 }).notNull(),
  keyHash: varchar("key_hash").notNull(),
  permissions: text("permissions").array().notNull().default(sql`ARRAY['read']::text[]`),
  createdBy: varchar("created_by").notNull(),
  lastUsedAt: timestamp("last_used_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true, lastUsedAt: true });
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

// API Audit Logs - Track all admin/sentinel API access
export const apiAuditLogs = pgTable("api_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  method: varchar("method", { length: 10 }).notNull(),
  path: varchar("path").notNull(),
  sourceType: varchar("source_type", { length: 20 }).notNull(),
  sourceId: varchar("source_id"),
  statusCode: integer("status_code"),
  responseTimeMs: integer("response_time_ms"),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertApiAuditLogSchema = createInsertSchema(apiAuditLogs).omit({ id: true, createdAt: true });
export type InsertApiAuditLog = z.infer<typeof insertApiAuditLogSchema>;
export type ApiAuditLog = typeof apiAuditLogs.$inferSelect;

// Webhook Endpoints - Outbound event notifications
export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: varchar("url").notNull(),
  events: text("events").array().notNull(),
  secret: varchar("secret").notNull(),
  isActive: boolean("is_active").default(true),
  lastDeliveryAt: timestamp("last_delivery_at"),
  lastDeliveryStatus: integer("last_delivery_status"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWebhookEndpointSchema = createInsertSchema(webhookEndpoints).omit({ id: true, createdAt: true, lastDeliveryAt: true, lastDeliveryStatus: true });
export type InsertWebhookEndpoint = z.infer<typeof insertWebhookEndpointSchema>;
export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;

// Daily Briefings - Structured SENTINEL morning/evening reports
export const dailyBriefings = pgTable("daily_briefings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 20 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  subject: varchar("subject").notNull(),
  body: text("body").notNull(),
  emailSent: boolean("email_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDailyBriefingSchema = createInsertSchema(dailyBriefings).omit({ id: true, createdAt: true });
export type InsertDailyBriefing = z.infer<typeof insertDailyBriefingSchema>;
export type DailyBriefing = typeof dailyBriefings.$inferSelect;

export const uiRefactorProposals = pgTable("ui_refactor_proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull(),
  targetFile: varchar("target_file").notNull(),
  proposedDiff: text("proposed_diff").notNull(),
  previewImageUrl: varchar("preview_image_url"),
  description: text("description"),
  status: uiRefactorStatusEnum("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUiRefactorProposalSchema = createInsertSchema(uiRefactorProposals).omit({ id: true, createdAt: true });
export type InsertUiRefactorProposal = z.infer<typeof insertUiRefactorProposalSchema>;
export type UiRefactorProposal = typeof uiRefactorProposals.$inferSelect;

export const openclawMessages = pgTable("openclaw_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromAgent: varchar("from_agent").notNull(),
  toRecipient: varchar("to_recipient").default("trustee"),
  message: text("message").notNull(),
  direction: varchar("direction").default("outbound"),
  priority: varchar("priority").default("normal"),
  status: varchar("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at")
});

export const insertOpenclawMessageSchema = createInsertSchema(openclawMessages).omit({ id: true, createdAt: true, sentAt: true, deliveredAt: true });
export type InsertOpenclawMessage = z.infer<typeof insertOpenclawMessageSchema>;
export type OpenclawMessage = typeof openclawMessages.$inferSelect;

export const openclawTasks = pgTable("openclaw_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull(),
  taskType: varchar("task_type").notNull(),
  description: text("description").notNull(),
  priority: varchar("priority").default("normal"),
  status: varchar("status").default("pending"),
  context: jsonb("context"),
  callbackUrl: varchar("callback_url"),
  result: jsonb("result"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const insertOpenclawTaskSchema = createInsertSchema(openclawTasks).omit({ id: true, createdAt: true, updatedAt: true, startedAt: true, completedAt: true });
export type InsertOpenclawTask = z.infer<typeof insertOpenclawTaskSchema>;
export type OpenclawTask = typeof openclawTasks.$inferSelect;

// Clinic Nodes - Distributed Allio Architecture (Enhanced for global expansion)

export const implementedStatusEnum = pgEnum("implemented_status", ["pending_review", "deployed_successfully", "deployment_failed", "rolled_back", "ignored"]);

export const implementedOutputs = pgTable("implemented_outputs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driveFileId: varchar("drive_file_id").notNull().unique(),
  fileName: varchar("file_name").notNull(),
  mimeType: varchar("mime_type"),
  agentId: varchar("agent_id").notNull(),
  category: varchar("category").notNull(), // code, copy, marketing, legal, financial, member_data
  status: implementedStatusEnum("status").default("pending_review"),
  targetPath: varchar("target_path"), // where on disk or DB it was deployed
  backupPath: varchar("backup_path"), // rollback .backup path
  errorLog: text("error_log"),
  reviewedBy: varchar("reviewed_by"), // ID of Trustee if manual review was required
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertImplementedOutputSchema = createInsertSchema(implementedOutputs).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertImplementedOutput = z.infer<typeof insertImplementedOutputSchema>;
export type ImplementedOutput = typeof implementedOutputs.$inferSelect;


export const generatedProtocols = pgTable("generated_protocols", {
  id: serial("id").primaryKey(),
  patientName: varchar("patient_name", { length: 255 }).notNull(),
  patientAge: integer("patient_age"),
  sourceType: varchar("source_type", { length: 50 }).notNull(),
  intakeFormId: integer("intake_form_id"),
  memberId: varchar("member_id", { length: 255 }),
  doctorId: varchar("doctor_id", { length: 255 }),
  patientProfile: jsonb("patient_profile").notNull(),
  protocol: jsonb("protocol").notNull(),
  slidesPresentationId: varchar("slides_presentation_id", { length: 255 }),
  slidesWebViewLink: varchar("slides_web_view_link", { length: 500 }),
  pdfDriveFileId: varchar("pdf_drive_file_id", { length: 255 }),
  pdfDriveWebViewLink: varchar("pdf_drive_web_view_link", { length: 500 }),
  dailySchedulePdfFileId: varchar("daily_schedule_pdf_file_id", { length: 255 }),
  dailySchedulePdfWebViewLink: varchar("daily_schedule_pdf_web_view_link", { length: 500 }),
  peptideSchedulePdfFileId: varchar("peptide_schedule_pdf_file_id", { length: 255 }),
  peptideSchedulePdfWebViewLink: varchar("peptide_schedule_pdf_web_view_link", { length: 500 }),
  status: varchar("status", { length: 50 }).default("draft").notNull(),
  generatedBy: varchar("generated_by", { length: 255 }),
  reviewedBy: varchar("reviewed_by", { length: 255 }),
  reviewedAt: timestamp("reviewed_at", { mode: 'date' }),
  reviewNotes: text("review_notes"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow().notNull(),
});

export const insertGeneratedProtocolSchema = createInsertSchema(generatedProtocols).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGeneratedProtocol = z.infer<typeof insertGeneratedProtocolSchema>;
export type GeneratedProtocol = typeof generatedProtocols.$inferSelect;

export const frequencyCategoryEnum = pgEnum("frequency_category", [
  "healing", "longevity", "dna_repair", "pain_relief", "relaxation",
  "solfeggio", "rife", "binaural", "schumann", "custom"
]);

export const waveformTypeEnum = pgEnum("waveform_type", ["sine", "square", "triangle", "sawtooth"]);

export const frequencyCategories = pgTable("frequency_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  icon: varchar("icon"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const frequencies = pgTable("frequencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  frequencyHz: decimal("frequency_hz", { precision: 12, scale: 4 }).notNull(),
  waveformType: waveformTypeEnum("waveform_type").default("sine"),
  durationSeconds: integer("duration_seconds").default(300),
  category: varchar("category").notNull(),
  purpose: text("purpose"),
  sourceAgent: varchar("source_agent"),
  audioUrl: varchar("audio_url"),
  audioBase64: text("audio_base64"),
  driveFileId: varchar("drive_file_id"),
  tags: text("tags").array(),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  playCount: integer("play_count").default(0),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFrequencySchema = createInsertSchema(frequencies).omit({ id: true, createdAt: true, updatedAt: true, playCount: true });
export type InsertFrequency = z.infer<typeof insertFrequencySchema>;
export type Frequency = typeof frequencies.$inferSelect;

export const insertFrequencyCategorySchema = createInsertSchema(frequencyCategories).omit({ id: true, createdAt: true });
export type InsertFrequencyCategory = z.infer<typeof insertFrequencyCategorySchema>;
export type FrequencyCategory = typeof frequencyCategories.$inferSelect;

export const syncDirectionEnum = pgEnum("sync_direction", ["pull", "push", "bidirectional"]);

export const wpSyncTracking = pgTable("wp_sync_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type").notNull(),
  entityId: varchar("entity_id"),
  wpEntityId: varchar("wp_entity_id"),
  lastPulledAt: timestamp("last_pulled_at"),
  lastPushedAt: timestamp("last_pushed_at"),
  localChecksum: varchar("local_checksum"),
  remoteChecksum: varchar("remote_checksum"),
  syncDirection: syncDirectionEnum("sync_direction").default("pull"),
  isConflict: boolean("is_conflict").default(false),
  conflictDetails: text("conflict_details"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWpSyncTrackingSchema = createInsertSchema(wpSyncTracking).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWpSyncTracking = z.infer<typeof insertWpSyncTrackingSchema>;
export type WpSyncTracking = typeof wpSyncTracking.$inferSelect;

export const labOrderStatusEnum = pgEnum("lab_order_status", [
  "draft", "pending", "submitted", "in_progress", "completed", "cancelled"
]);

export const labResultStatusEnum = pgEnum("lab_result_status", [
  "normal", "low", "high", "critical_low", "critical_high"
]);

export const labOrders = pgTable("lab_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull(),
  memberName: varchar("member_name"),
  doctorId: varchar("doctor_id").notNull(),
  status: labOrderStatusEnum("status").default("draft").notNull(),
  panels: jsonb("panels").$type<string[]>().default([]),
  rupaOrderId: varchar("rupa_order_id"),
  rupaOrderUrl: varchar("rupa_order_url"),
  notes: text("notes"),
  orderedAt: timestamp("ordered_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const labResults = pgTable("lab_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull(),
  memberName: varchar("member_name"),
  doctorId: varchar("doctor_id").notNull(),
  labOrderId: varchar("lab_order_id").references(() => labOrders.id, { onDelete: "set null" }),
  testName: varchar("test_name").notNull(),
  category: varchar("category").notNull(),
  value: decimal("value", { precision: 12, scale: 4 }).notNull(),
  unit: varchar("unit").notNull(),
  referenceMin: decimal("reference_min", { precision: 12, scale: 4 }),
  referenceMax: decimal("reference_max", { precision: 12, scale: 4 }),
  status: labResultStatusEnum("status").default("normal").notNull(),
  resultDate: timestamp("result_date").defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const savedTestPanels = pgTable("saved_test_panels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  testList: jsonb("test_list").$type<Array<{ testName: string; category: string; unit: string; referenceMin?: number; referenceMax?: number }>>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLabOrderSchema = createInsertSchema(labOrders).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLabOrder = z.infer<typeof insertLabOrderSchema>;
export type LabOrder = typeof labOrders.$inferSelect;

export const insertLabResultSchema = createInsertSchema(labResults).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLabResult = z.infer<typeof insertLabResultSchema>;
export type LabResult = typeof labResults.$inferSelect;

export const insertSavedTestPanelSchema = createInsertSchema(savedTestPanels).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSavedTestPanel = z.infer<typeof insertSavedTestPanelSchema>;
export type SavedTestPanel = typeof savedTestPanels.$inferSelect;

// Bloodwork Uploads - PDFs and images of lab reports uploaded by doctors
export const bloodworkUploadStatusEnum = pgEnum("bloodwork_upload_status", [
  "pending", "analyzing", "completed", "failed"
]);

export const bloodworkUploads = pgTable("bloodwork_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull(),
  memberName: varchar("member_name"),
  doctorId: varchar("doctor_id").notNull(),
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type").notNull(), // pdf, image
  mimeType: varchar("mime_type"),
  fileSize: integer("file_size"),
  driveFileId: varchar("drive_file_id"),
  driveWebViewLink: varchar("drive_web_view_link"),
  status: bloodworkUploadStatusEnum("status").default("pending").notNull(),
  // AI Analysis Results
  aiAnalyzed: boolean("ai_analyzed").default(false),
  aiAnalyzedAt: timestamp("ai_analyzed_at"),
  analysisError: text("analysis_error"),
  // Structured biomarker extraction
  extractedMarkers: jsonb("extracted_markers").$type<Array<{
    testName: string;
    category: string;
    value: number;
    unit: string;
    referenceMin?: number;
    referenceMax?: number;
    status: "normal" | "low" | "high" | "critical_low" | "critical_high";
    confidence: number;
    notes?: string;
  }>>(),
  // AI summary
  clinicalSummary: text("clinical_summary"),
  aiObservations: jsonb("ai_observations").$type<string[]>(),
  protocolAlignments: jsonb("protocol_alignments").$type<string[]>(),
  abnormalFlags: jsonb("abnormal_flags").$type<string[]>(),
  confidence: varchar("confidence"), // high, moderate, low
  // Linkage to protocol
  linkedProtocolId: integer("linked_protocol_id"),
  notes: text("notes"),
  collectionDate: timestamp("collection_date"),
  labName: varchar("lab_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBloodworkUploadSchema = createInsertSchema(bloodworkUploads).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBloodworkUpload = z.infer<typeof insertBloodworkUploadSchema>;
export type BloodworkUpload = typeof bloodworkUploads.$inferSelect;

export const vitalityAssessmentStatusEnum = pgEnum("vitality_assessment_status", ["draft", "completed"]);

export const vitalityAssessments = pgTable("vitality_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull(),
  memberName: varchar("member_name"),
  doctorId: varchar("doctor_id").notNull(),
  status: vitalityAssessmentStatusEnum("status").default("completed"),
  overallScore: integer("overall_score"),
  cellularHealthScore: integer("cellular_health_score"),
  detoxScore: integer("detox_score"),
  systemicHealthScore: integer("systemic_health_score"),
  dietNutritionScore: integer("diet_nutrition_score"),
  environmentalScore: integer("environmental_score"),
  stressEmotionalScore: integer("stress_emotional_score"),
  physicalActivityScore: integer("physical_activity_score"),
  cellularHealthData: jsonb("cellular_health_data"),
  detoxData: jsonb("detox_data"),
  systemicHealthData: jsonb("systemic_health_data"),
  dietNutritionData: jsonb("diet_nutrition_data"),
  environmentalData: jsonb("environmental_data"),
  stressEmotionalData: jsonb("stress_emotional_data"),
  physicalActivityData: jsonb("physical_activity_data"),
  recommendations: jsonb("recommendations"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVitalityAssessmentSchema = createInsertSchema(vitalityAssessments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVitalityAssessment = z.infer<typeof insertVitalityAssessmentSchema>;
export type VitalityAssessment = typeof vitalityAssessments.$inferSelect;

export const indexingStatusEnum = pgEnum("indexing_status", ["pending", "processing", "indexed", "failed"]);

export const agentLibraryChunks = pgTable("agent_library_chunks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentName: varchar("agent_name").notNull(),
  driveFileId: varchar("drive_file_id").notNull(),
  fileName: varchar("file_name").notNull(),
  mimeType: varchar("mime_type"),
  chunkIndex: integer("chunk_index").notNull(),
  totalChunks: integer("total_chunks").notNull(),
  content: text("content").notNull(),
  chunkTitle: varchar("chunk_title"),
  indexingStatus: indexingStatusEnum("indexing_status").default("indexed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const agentLibraryFiles = pgTable("agent_library_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentName: varchar("agent_name").notNull(),
  driveFileId: varchar("drive_file_id").notNull().unique(),
  fileName: varchar("file_name").notNull(),
  mimeType: varchar("mime_type"),
  fileSize: integer("file_size"),
  indexingStatus: indexingStatusEnum("indexing_status").default("pending"),
  totalChunks: integer("total_chunks").default(0),
  errorMessage: text("error_message"),
  indexedAt: timestamp("indexed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AgentLibraryChunk = typeof agentLibraryChunks.$inferSelect;
export type AgentLibraryFile = typeof agentLibraryFiles.$inferSelect;

export const clinicNodeStatusEnum = pgEnum("clinic_node_status", ["online", "degraded", "offline", "provisioning", "decommissioned"]);
export const replicationStateEnum = pgEnum("replication_state", ["synced", "syncing", "stale", "error"]);
export const jurisdictionStatusEnum = pgEnum("jurisdiction_status", ["active", "researching", "approved", "restricted", "blocked"]);

export const clinicNodes = pgTable("clinic_nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicId: varchar("clinic_id").references(() => clinics.id),
  nodeIdentifier: varchar("node_identifier").notNull().unique(),
  displayName: varchar("display_name").notNull(),
  status: clinicNodeStatusEnum("status").default("provisioning"),
  region: varchar("region").notNull(),
  jurisdictionId: varchar("jurisdiction_id"),
  endpoint: varchar("endpoint"),
  internalIp: varchar("internal_ip"),
  externalIp: varchar("external_ip"),
  version: varchar("version"),
  lastHeartbeatAt: timestamp("last_heartbeat_at"),
  lastSyncAt: timestamp("last_sync_at"),
  replicationState: replicationStateEnum("replication_state").default("stale"),
  replicationLag: integer("replication_lag").default(0),
  cpuUsage: decimal("cpu_usage", { precision: 5, scale: 2 }),
  memoryUsage: decimal("memory_usage", { precision: 5, scale: 2 }),
  diskUsage: decimal("disk_usage", { precision: 5, scale: 2 }),
  activeConnections: integer("active_connections").default(0),
  memberCount: integer("member_count").default(0),
  failoverPriority: integer("failover_priority").default(100),
  failoverTargetId: varchar("failover_target_id"),
  isPrimary: boolean("is_primary").default(false),
  canAcceptFailover: boolean("can_accept_failover").default(true),
  sslCertExpiry: timestamp("ssl_cert_expiry"),
  configHash: varchar("config_hash"),
  metadata: jsonb("metadata"),
  provisionedAt: timestamp("provisioned_at"),
  decommissionedAt: timestamp("decommissioned_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clinicNodeEvents = pgTable("clinic_node_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nodeId: varchar("node_id").notNull().references(() => clinicNodes.id),
  eventType: varchar("event_type").notNull(),
  severity: varchar("severity").notNull().default("info"),
  message: text("message").notNull(),
  details: jsonb("details"),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedBy: varchar("acknowledged_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const globalJurisdictions = pgTable("global_jurisdictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  countryCode: varchar("country_code").notNull(),
  countryName: varchar("country_name").notNull(),
  legalSystem: varchar("legal_system").notNull(),
  constitutionalBasis: text("constitutional_basis"),
  associationFreedom: varchar("association_freedom"),
  healthFreedomScore: integer("health_freedom_score"),
  pmaViability: varchar("pma_viability"),
  status: jurisdictionStatusEnum("jurisdiction_status").default("researching"),
  keyStatutes: jsonb("key_statutes"),
  caseReferences: jsonb("case_references"),
  riskFactors: jsonb("risk_factors"),
  expansionNotes: text("expansion_notes"),
  primaryLanguage: varchar("primary_language"),
  timezone: varchar("timezone"),
  regulatoryBodies: jsonb("regulatory_bodies"),
  dataPrivacyLaw: varchar("data_privacy_law"),
  crossBorderDataRules: text("cross_border_data_rules"),
  researchedBy: varchar("researched_by"),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const nodeReplicationLogs = pgTable("node_replication_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceNodeId: varchar("source_node_id").notNull(),
  targetNodeId: varchar("target_node_id").notNull(),
  tableName: varchar("table_name").notNull(),
  recordCount: integer("record_count").default(0),
  bytesTransferred: integer("bytes_transferred").default(0),
  status: varchar("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export type ClinicNode = typeof clinicNodes.$inferSelect;
export type InsertClinicNode = typeof clinicNodes.$inferInsert;
export type ClinicNodeEvent = typeof clinicNodeEvents.$inferSelect;
export type GlobalJurisdiction = typeof globalJurisdictions.$inferSelect;
export type NodeReplicationLog = typeof nodeReplicationLogs.$inferSelect;

// Database Backup Records
export const backupStatusEnum = pgEnum("backup_status", ["pending", "running", "completed", "failed"]);
export const backupTypeEnum = pgEnum("backup_type", ["daily", "weekly", "monthly", "manual"]);

export const databaseBackups = pgTable("database_backups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  backupType: backupTypeEnum("backup_type").notNull().default("daily"),
  status: backupStatusEnum("status").notNull().default("pending"),
  label: varchar("label").notNull(),
  tablesExported: text("tables_exported").array(),
  totalRows: integer("total_rows").default(0),
  fileSizeBytes: integer("file_size_bytes").default(0),
  driveFileId: varchar("drive_file_id"),
  driveWebViewLink: varchar("drive_web_view_link"),
  driveFolderId: varchar("drive_folder_id"),
  verificationStatus: varchar("verification_status").default("pending"),
  verificationDetails: jsonb("verification_details"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type DatabaseBackup = typeof databaseBackups.$inferSelect;
export type InsertDatabaseBackup = typeof databaseBackups.$inferInsert;
