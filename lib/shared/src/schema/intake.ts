import { pgTable, text, serial, integer, jsonb, timestamp, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const intakeForms = pgTable("intake_forms", {
  id: serial("id").primaryKey(),
  patientName: varchar("patient_name", { length: 255 }).notNull(),
  patientEmail: varchar("patient_email", { length: 255 }).notNull(),
  patientPhone: varchar("patient_phone", { length: 50 }),
  dateOfBirth: date("date_of_birth", { mode: 'date' }),
  age: integer("age"),

  formData: jsonb("form_data").notNull(),
  
  googleSheetId: varchar("google_sheet_id", { length: 255 }),
  
  // 'draft', 'submitted', 'reviewed', 'processed'
  status: varchar("status", { length: 50 }).default("draft").notNull(),
  
  submittedAt: timestamp("submitted_at", { mode: 'date' }),
  reviewedAt: timestamp("reviewed_at", { mode: 'date' }),
  reviewedBy: varchar("reviewed_by", { length: 255 }),
  
  createdAt: timestamp("created_at", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow().notNull(),
});

export const insertIntakeFormSchema = createInsertSchema(intakeForms);
export const selectIntakeFormSchema = createSelectSchema(intakeForms);
export type IntakeForm = typeof intakeForms.$inferSelect;
export type InsertIntakeForm = typeof intakeForms.$inferInsert;
