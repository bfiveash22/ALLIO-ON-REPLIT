import { type User, type UpsertUser, type Contract, type InsertContract, type LegalDocument, type InsertLegalDocument, type AgentTask, type InsertAgentTask, type TrainingModule, type TrainingTrack, type Quiz, type DriveDocument, type Program, type ProgramEnrollment, type InsertProgramEnrollment, type UserProgress, type InsertUserProgress, type AgentConfiguration, type InsertAgentConfiguration, type AthenaEmailApproval, type InsertAthenaEmailApproval, type AgentTaskReview, type InsertAgentTaskReview, type DivisionLead, type InsertDivisionLead, type BloodSample, type InsertBloodSample, type BloodSampleTag, type InsertBloodSampleTag, type DianeKnowledge, type Achievement, type InsertAchievement, type UserAchievement, type InsertUserAchievement, type ModuleBookmark, type InsertModuleBookmark, type DiscussionThread, type InsertDiscussionThread, type DiscussionReply, type InsertDiscussionReply, type PatientRecord, type InsertPatientRecord, type PatientUpload, type InsertPatientUpload, type PatientProtocol, type InsertPatientProtocol, type DoctorPatientMessage, type InsertDoctorPatientMessage, type Conversation, type InsertConversation, type QuizAttempt, type QuizResponse, type UiRefactorProposal, type InsertUiRefactorProposal, type Frequency, type InsertFrequency, type FrequencyCategory, type InsertFrequencyCategory, type LabOrder, type InsertLabOrder, type LabResult, type InsertLabResult, type SavedTestPanel, type InsertSavedTestPanel, users, contracts, legalDocuments, memberProfiles, agentTasks, clinics, trainingModules, trainingTracks, quizzes, quizQuestions, quizAnswers, moduleQuizzes, driveDocuments, programs, programEnrollments, userProgress, agentConfigurations, athenaEmailApprovals, agentTaskReviews, divisionLeads, userWpRoles, bloodSamples, bloodSampleTags, dianeKnowledge, achievements, userAchievements, moduleBookmarks, discussionThreads, discussionReplies, patientRecords, patientUploads, patientProtocols, doctorPatientMessages, conversations, quizAttempts, quizResponses, uiRefactorProposals, openclawMessages, frequencies, frequencyCategories, labOrders, labResults, savedTestPanels } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, inArray, sql } from "drizzle-orm";

type MemberProfile = typeof memberProfiles.$inferSelect;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  getContract(id: string): Promise<Contract | undefined>;
  getContractsByUser(userId: string): Promise<Contract[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, updates: Partial<Contract>): Promise<Contract | undefined>;
  getContractBySignNowId(signNowDocumentId: string): Promise<Contract | undefined>;
  getAllContracts(): Promise<Contract[]>;
  // Members
  getAllMembers(): Promise<MemberProfile[]>;
  getAllMembersWithUsers(): Promise<(MemberProfile & { user?: { email?: string; firstName?: string; lastName?: string; wpUsername?: string; wpRoles?: string } })[]>;
  // Legal Documents
  getLegalDocument(id: string): Promise<LegalDocument | undefined>;
  getAllLegalDocuments(): Promise<LegalDocument[]>;
  createLegalDocument(doc: InsertLegalDocument): Promise<LegalDocument>;
  updateLegalDocument(id: string, updates: Partial<LegalDocument>): Promise<LegalDocument | undefined>;
  deleteLegalDocument(id: string): Promise<boolean>;
  // Agent Tasks
  getAllAgentTasks(): Promise<AgentTask[]>;
  getAgentTask(id: string): Promise<AgentTask | undefined>;
  getAgentTasksByDivision(division: string): Promise<AgentTask[]>;
  getAgentTasksByAgent(agentId: string): Promise<AgentTask[]>;
  createAgentTask(task: InsertAgentTask): Promise<AgentTask>;
  updateAgentTask(id: string, updates: Partial<AgentTask>): Promise<AgentTask | undefined>;
  deleteAgentTask(id: string): Promise<boolean>;
  // Training Modules
  getTrainingModules(): Promise<TrainingModule[]>;
  getTrainingModuleBySlug(slug: string): Promise<TrainingModule | undefined>;
  // Training Tracks
  getTrainingTracks(): Promise<TrainingTrack[]>;
  getTrainingTrackBySlug(slug: string): Promise<TrainingTrack | undefined>;
  // Quizzes
  getQuizzes(): Promise<(Quiz & { questionsCount: number })[]>;
  getQuizBySlug(slug: string): Promise<Quiz | undefined>;
  // Drive Documents
  getDriveDocuments(): Promise<DriveDocument[]>;
  // Programs
  getPrograms(): Promise<Program[]>;
  getProgramBySlug(slug: string): Promise<Program | undefined>;
  // Program Enrollments
  getProgramEnrollment(userId: string, programId: string): Promise<ProgramEnrollment | undefined>;
  createProgramEnrollment(enrollment: InsertProgramEnrollment): Promise<ProgramEnrollment>;
  updateProgramEnrollmentProgress(userId: string, programId: string, progress: number): Promise<ProgramEnrollment | undefined>;
  getUserProgramEnrollments(userId: string): Promise<ProgramEnrollment[]>;
  // User Progress
  getUserProgress(userId: string, contentType: string, contentId: string): Promise<UserProgress | undefined>;
  getUserProgressByType(userId: string, contentType: string): Promise<UserProgress[]>;
  upsertUserProgress(data: InsertUserProgress): Promise<UserProgress>;
  completeUserProgress(userId: string, contentType: string, contentId: string): Promise<UserProgress | undefined>;
  // Quiz methods
  getQuizByModuleId(moduleId: string): Promise<Quiz | undefined>;
  getQuizQuestions(quizId: string): Promise<Array<{ id: string; questionText: string; explanation: string | null; sortOrder: number | null; points?: number | null; answers: Array<{ id: string; answerText: string; isCorrect: boolean | null; sortOrder: number | null }> }>>;
  getQuiz(quizId: string): Promise<Quiz | undefined>;
  getQuizAnswers(questionId: string): Promise<Array<{ id: string; answerText: string; isCorrect: boolean | null; sortOrder: number | null }>>;
  // Quiz Attempts
  createQuizAttempt(data: { userId: string; quizId: string }): Promise<QuizAttempt>;
  getQuizAttempt(attemptId: string): Promise<QuizAttempt | undefined>;
  getQuizAttempts(userId: string, quizId?: string): Promise<QuizAttempt[]>;
  updateQuizAttempt(attemptId: string, data: Partial<QuizAttempt>): Promise<QuizAttempt | undefined>;
  createQuizResponse(data: { attemptId: string; questionId: string; selectedAnswerId: string; isCorrect: boolean; pointsEarned: number }): Promise<QuizResponse>;
  // WordPress Roles
  getUserWpRoles(userId: string): Promise<Array<{ wpRoleSlug: string; isPrimary: boolean | null }>>;
  // Blood Sample Library
  getBloodSamples(filters?: { organismType?: string; category?: string; search?: string; tags?: string[] }): Promise<BloodSample[]>;
  getBloodSampleById(id: string): Promise<BloodSample | undefined>;
  createBloodSample(sample: InsertBloodSample): Promise<BloodSample>;
  updateBloodSample(id: string, updates: Partial<BloodSample>): Promise<BloodSample | undefined>;
  deleteBloodSample(id: string): Promise<boolean>;
  getBloodSampleTags(sampleId: string): Promise<BloodSampleTag[]>;
  addBloodSampleTag(tag: InsertBloodSampleTag): Promise<BloodSampleTag>;
  getAllBloodSampleTags(): Promise<string[]>;
  searchBloodSamplesForAI(query: string, limit?: number): Promise<BloodSample[]>;
  // Diane Knowledge Base
  getDianeKnowledge(): Promise<DianeKnowledge[]>;
  // Member Engagement - Achievements
  getAchievements(): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getUserAchievements(userId: string): Promise<(UserAchievement & { achievement?: Achievement })[]>;
  awardAchievement(userId: string, achievementId: string, metadata?: Record<string, unknown>): Promise<UserAchievement>;
  // Member Engagement - Bookmarks
  getUserBookmarks(userId: string): Promise<ModuleBookmark[]>;
  addBookmark(bookmark: InsertModuleBookmark): Promise<ModuleBookmark>;
  removeBookmark(userId: string, moduleId: string): Promise<boolean>;
  isBookmarked(userId: string, moduleId: string): Promise<boolean>;
  // Member Engagement - Discussions
  getDiscussionThreads(moduleId?: string): Promise<DiscussionThread[]>;
  getDiscussionThread(id: string): Promise<DiscussionThread | undefined>;
  createDiscussionThread(thread: InsertDiscussionThread): Promise<DiscussionThread>;
  getDiscussionReplies(threadId: string): Promise<DiscussionReply[]>;
  createDiscussionReply(reply: InsertDiscussionReply): Promise<DiscussionReply>;
  // Doctor Dashboard - Patient Records
  getPatientRecords(doctorId: string): Promise<PatientRecord[]>;
  getPatientRecord(id: string): Promise<PatientRecord | undefined>;
  createPatientRecord(record: InsertPatientRecord): Promise<PatientRecord>;
  updatePatientRecord(id: string, updates: Partial<PatientRecord>): Promise<PatientRecord | undefined>;
  deletePatientRecord(id: string): Promise<boolean>;
  // Doctor Dashboard - Patient Uploads
  getPatientUploads(patientRecordId: string): Promise<PatientUpload[]>;
  createPatientUpload(upload: InsertPatientUpload): Promise<PatientUpload>;
  updatePatientUpload(id: string, updates: Partial<PatientUpload>): Promise<PatientUpload | undefined>;
  // Doctor Dashboard - Patient Protocols
  getPatientProtocols(patientRecordId: string): Promise<PatientProtocol[]>;
  getDoctorProtocols(doctorId: string): Promise<PatientProtocol[]>;
  createPatientProtocol(protocol: InsertPatientProtocol): Promise<PatientProtocol>;
  updatePatientProtocol(id: string, updates: Partial<PatientProtocol>): Promise<PatientProtocol | undefined>;
  // Doctor Dashboard - Messaging
  getConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getMessages(conversationId: string): Promise<DoctorPatientMessage[]>;
  createMessage(message: InsertDoctorPatientMessage): Promise<DoctorPatientMessage>;
  markMessageRead(id: string): Promise<DoctorPatientMessage | undefined>;
  // UI Refactor Proposals
  getUiRefactorProposals(status?: string): Promise<UiRefactorProposal[]>;
  getUiRefactorProposal(id: string): Promise<UiRefactorProposal | undefined>;
  createUiRefactorProposal(proposal: InsertUiRefactorProposal): Promise<UiRefactorProposal>;
  updateUiRefactorProposal(id: string, updates: Partial<UiRefactorProposal>): Promise<UiRefactorProposal | undefined>;
  // AI Model Evaluations
  getAiModelEvaluations(status?: string): Promise<any[]>;
  getAiModelEvaluation(id: number): Promise<any | undefined>;
  updateAiModelEvaluation(id: number, updates: any): Promise<any | undefined>;
  // Bloodwork & Labs
  getLabOrders(doctorId: string): Promise<LabOrder[]>;
  getLabOrder(id: string): Promise<LabOrder | undefined>;
  createLabOrder(order: InsertLabOrder): Promise<LabOrder>;
  updateLabOrder(id: string, updates: Partial<LabOrder>): Promise<LabOrder | undefined>;
  deleteLabOrder(id: string): Promise<boolean>;
  getLabResults(memberId: string): Promise<LabResult[]>;
  getLabResultsByDoctor(doctorId: string): Promise<LabResult[]>;
  getLabResult(id: string): Promise<LabResult | undefined>;
  createLabResult(result: InsertLabResult): Promise<LabResult>;
  createLabResults(results: InsertLabResult[]): Promise<LabResult[]>;
  updateLabResult(id: string, updates: Partial<LabResult>): Promise<LabResult | undefined>;
  deleteLabResult(id: string): Promise<boolean>;
  getSavedTestPanels(doctorId: string): Promise<SavedTestPanel[]>;
  getSavedTestPanel(id: string): Promise<SavedTestPanel | undefined>;
  createSavedTestPanel(panel: InsertSavedTestPanel): Promise<SavedTestPanel>;
  updateSavedTestPanel(id: string, updates: Partial<SavedTestPanel>): Promise<SavedTestPanel | undefined>;
  deleteSavedTestPanel(id: string): Promise<boolean>;
}

let membersCache: { data: any, timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.wpUsername, username));
    return user || undefined;
  }

  async createUser(insertUser: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getContract(id: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract || undefined;
  }

  async getContractsByUser(userId: string): Promise<Contract[]> {
    return await db.select().from(contracts).where(eq(contracts.userId, userId));
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const [newContract] = await db
      .insert(contracts)
      .values(contract)
      .returning();
    return newContract;
  }

  async updateContract(id: string, updates: Partial<Contract>): Promise<Contract | undefined> {
    const [updated] = await db
      .update(contracts)
      .set(updates)
      .where(eq(contracts.id, id))
      .returning();
    return updated || undefined;
  }

  async getContractBySignNowId(signNowDocumentId: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.signNowDocumentId, signNowDocumentId));
    return contract || undefined;
  }

  async getAllContracts(): Promise<Contract[]> {
    return await db.select().from(contracts);
  }

  // Members
  async getAllMembers(): Promise<MemberProfile[]> {
    return await db.select().from(memberProfiles).orderBy(desc(memberProfiles.createdAt));
  }

  async getAllMembersWithUsers(): Promise<(MemberProfile & { user?: { email?: string; firstName?: string; lastName?: string; wpUsername?: string; wpRoles?: string } })[]> {
    const now = Date.now();
    if (membersCache && now - membersCache.timestamp < CACHE_TTL) {
      return membersCache.data;
    }

    try {
      const members = await db.select().from(memberProfiles).orderBy(desc(memberProfiles.createdAt));
      // Optimize N+1 query: Fetch all users at once instead of inside the loop
      const allUsers = await db.select().from(users);
      const userMap = new Map(allUsers.map(u => [u.id, u]));

      const result = members.map(member => {
        const user = userMap.get(member.userId);
        return {
          ...member,
          user: user ? {
            email: user.email || undefined,
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
            wpUsername: user.wpUsername || undefined,
            wpRoles: user.wpRoles || undefined,
          } : undefined
        };
      });

      membersCache = { data: result, timestamp: now };
      return result;
    } catch (error: any) {
      console.error("[getAllMembersWithUsers] Member Cache Database error:", error.message);
      throw error;
    }
  }

  // Legal Documents
  async getLegalDocument(id: string): Promise<LegalDocument | undefined> {
    const [doc] = await db.select().from(legalDocuments).where(eq(legalDocuments.id, id));
    return doc || undefined;
  }

  async getAllLegalDocuments(): Promise<LegalDocument[]> {
    return await db.select().from(legalDocuments).orderBy(desc(legalDocuments.createdAt));
  }

  async createLegalDocument(doc: InsertLegalDocument): Promise<LegalDocument> {
    const [newDoc] = await db.insert(legalDocuments).values(doc).returning();
    return newDoc;
  }

  async updateLegalDocument(id: string, updates: Partial<LegalDocument>): Promise<LegalDocument | undefined> {
    const [updated] = await db.update(legalDocuments).set({ ...updates, updatedAt: new Date() }).where(eq(legalDocuments.id, id)).returning();
    return updated || undefined;
  }

  async deleteLegalDocument(id: string): Promise<boolean> {
    const result = await db.delete(legalDocuments).where(eq(legalDocuments.id, id));
    return true;
  }

  // Agent Tasks
  async getAllAgentTasks(): Promise<AgentTask[]> {
    return await db.select().from(agentTasks).orderBy(desc(agentTasks.createdAt));
  }

  async getAgentTask(id: string): Promise<AgentTask | undefined> {
    const [task] = await db.select().from(agentTasks).where(eq(agentTasks.id, id));
    return task || undefined;
  }

  async getAgentTasksByDivision(division: string): Promise<AgentTask[]> {
    return await db.select().from(agentTasks).where(eq(agentTasks.division, division as any)).orderBy(desc(agentTasks.createdAt));
  }

  async getAgentTasksByAgent(agentId: string): Promise<AgentTask[]> {
    return await db.select().from(agentTasks).where(eq(agentTasks.agentId, agentId)).orderBy(desc(agentTasks.createdAt));
  }

  async createAgentTask(task: InsertAgentTask): Promise<AgentTask> {
    const [newTask] = await db.insert(agentTasks).values(task).returning();
    return newTask;
  }

  async updateAgentTask(id: string, updates: Partial<AgentTask>): Promise<AgentTask | undefined> {
    const [updated] = await db.update(agentTasks).set({ ...updates, updatedAt: new Date() }).where(eq(agentTasks.id, id)).returning();
    return updated || undefined;
  }

  async deleteAgentTask(id: string): Promise<boolean> {
    await db.delete(agentTasks).where(eq(agentTasks.id, id));
    return true;
  }

  // Clinics
  async getAllClinics() {
    return await db.select().from(clinics).orderBy(clinics.name);
  }

  async getClinic(id: string) {
    const [clinic] = await db.select().from(clinics).where(eq(clinics.id, id));
    return clinic || undefined;
  }

  async getClinicByWpId(wpClinicId: number) {
    const [clinic] = await db.select().from(clinics).where(eq(clinics.wpClinicId, wpClinicId));
    return clinic || undefined;
  }

  async updateClinic(id: string, updates: Partial<typeof clinics.$inferInsert>) {
    const [updated] = await db.update(clinics).set(updates).where(eq(clinics.id, id)).returning();
    return updated || undefined;
  }

  async upsertClinic(clinic: typeof clinics.$inferInsert) {
    if (clinic.wpClinicId) {
      const existing = await this.getClinicByWpId(clinic.wpClinicId);
      if (existing) {
        const [updated] = await db.update(clinics).set(clinic).where(eq(clinics.id, existing.id)).returning();
        return updated;
      }
    }
    const [newClinic] = await db.insert(clinics).values(clinic).returning();
    return newClinic;
  }

  // Training Modules
  async getTrainingModules(): Promise<TrainingModule[]> {
    return await db.select().from(trainingModules).orderBy(trainingModules.sortOrder);
  }

  async getTrainingModuleBySlug(slug: string): Promise<TrainingModule | undefined> {
    const [module] = await db.select().from(trainingModules).where(eq(trainingModules.slug, slug));
    return module || undefined;
  }

  // Training Tracks
  async getTrainingTracks(): Promise<TrainingTrack[]> {
    return await db.select().from(trainingTracks).orderBy(trainingTracks.title);
  }

  async getTrainingTrackBySlug(slug: string): Promise<TrainingTrack | undefined> {
    const [track] = await db.select().from(trainingTracks).where(eq(trainingTracks.slug, slug));
    return track || undefined;
  }

  // Quizzes
  async getQuizzes(): Promise<(Quiz & { questionsCount: number })[]> {
    const allQuizzes = await db.select().from(quizzes).orderBy(desc(quizzes.createdAt));

    const quizzesWithCounts = await Promise.all(
      allQuizzes.map(async (quiz) => {
        const questions = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quiz.id));
        return { ...quiz, questionsCount: questions.length };
      })
    );

    return quizzesWithCounts;
  }

  async getQuizBySlug(slug: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.slug, slug));
    return quiz || undefined;
  }

  // Drive Documents
  async getDriveDocuments(): Promise<DriveDocument[]> {
    return await db.select().from(driveDocuments).orderBy(desc(driveDocuments.createdAt));
  }

  // Programs
  async getPrograms(): Promise<Program[]> {
    return await db.select().from(programs).orderBy(programs.name);
  }

  async getProgramBySlug(slug: string): Promise<Program | undefined> {
    const [program] = await db.select().from(programs).where(eq(programs.slug, slug));
    return program || undefined;
  }

  // Program Enrollments
  async getProgramEnrollment(userId: string, programId: string): Promise<ProgramEnrollment | undefined> {
    const [enrollment] = await db.select().from(programEnrollments)
      .where(and(eq(programEnrollments.userId, userId), eq(programEnrollments.programId, programId)));
    return enrollment || undefined;
  }

  async createProgramEnrollment(enrollment: InsertProgramEnrollment): Promise<ProgramEnrollment> {
    const [newEnrollment] = await db.insert(programEnrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async updateProgramEnrollmentProgress(userId: string, programId: string, progress: number): Promise<ProgramEnrollment | undefined> {
    const completedAt = progress >= 100 ? new Date() : null;
    const [updated] = await db.update(programEnrollments)
      .set({ progress, completedAt })
      .where(and(eq(programEnrollments.userId, userId), eq(programEnrollments.programId, programId)))
      .returning();
    return updated || undefined;
  }

  async getUserProgramEnrollments(userId: string): Promise<ProgramEnrollment[]> {
    return await db.select().from(programEnrollments)
      .where(eq(programEnrollments.userId, userId))
      .orderBy(desc(programEnrollments.startedAt));
  }

  // User Progress (for training modules)
  async getUserProgress(userId: string, contentType: string, contentId: string): Promise<UserProgress | undefined> {
    const [progress] = await db.select().from(userProgress)
      .where(and(
        eq(userProgress.userId, userId),
        eq(userProgress.contentType, contentType),
        eq(userProgress.contentId, contentId)
      ));
    return progress || undefined;
  }

  async getUserProgressByType(userId: string, contentType: string): Promise<UserProgress[]> {
    return await db.select().from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.contentType, contentType)))
      .orderBy(desc(userProgress.updatedAt));
  }

  async upsertUserProgress(data: InsertUserProgress): Promise<UserProgress> {
    const existing = await this.getUserProgress(data.userId, data.contentType, data.contentId);
    if (existing) {
      const [updated] = await db.update(userProgress)
        .set({ ...data, updatedAt: new Date(), viewCount: (existing.viewCount || 0) + 1, lastViewedAt: new Date() })
        .where(eq(userProgress.id, existing.id))
        .returning();
      return updated;
    }
    const [newProgress] = await db.insert(userProgress).values({ ...data, viewCount: 1, lastViewedAt: new Date() }).returning();
    return newProgress;
  }

  async completeUserProgress(userId: string, contentType: string, contentId: string): Promise<UserProgress | undefined> {
    const existing = await this.getUserProgress(userId, contentType, contentId);
    if (!existing) return undefined;
    const [updated] = await db.update(userProgress)
      .set({ status: "completed", progressPercent: 100, completedAt: new Date(), updatedAt: new Date() })
      .where(eq(userProgress.id, existing.id))
      .returning();
    return updated;
  }

  // Quiz methods
  async getQuizByModuleId(moduleId: string): Promise<Quiz | undefined> {
    const [link] = await db.select().from(moduleQuizzes).where(eq(moduleQuizzes.moduleId, moduleId));
    if (!link) return undefined;
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, link.quizId));
    return quiz || undefined;
  }

  async getQuizQuestions(quizId: string): Promise<Array<{ id: string; questionText: string; explanation: string | null; sortOrder: number | null; points: number; answers: Array<{ id: string; answerText: string; isCorrect: boolean | null; sortOrder: number | null }> }>> {
    const questions = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId)).orderBy(quizQuestions.sortOrder);
    const result = [];
    for (const q of questions) {
      const answers = await db.select().from(quizAnswers).where(eq(quizAnswers.questionId, q.id)).orderBy(quizAnswers.sortOrder);
      result.push({
        id: q.id,
        questionText: q.questionText,
        explanation: q.explanation,
        sortOrder: q.sortOrder,
        points: 1,
        answers: answers.map(a => ({ id: a.id, answerText: a.answerText, isCorrect: a.isCorrect, sortOrder: a.sortOrder }))
      });
    }
    return result;
  }

  async getQuiz(quizId: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId));
    return quiz || undefined;
  }

  async getQuizAnswers(questionId: string): Promise<Array<{ id: string; answerText: string; isCorrect: boolean | null; sortOrder: number | null }>> {
    const answers = await db.select().from(quizAnswers).where(eq(quizAnswers.questionId, questionId)).orderBy(quizAnswers.sortOrder);
    return answers.map(a => ({ id: a.id, answerText: a.answerText, isCorrect: a.isCorrect, sortOrder: a.sortOrder }));
  }

  async createQuizAttempt(data: { userId: string; quizId: string }): Promise<QuizAttempt> {
    const id = `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const [attempt] = await db.insert(quizAttempts).values({
      id,
      userId: data.userId,
      quizId: data.quizId,
      startedAt: new Date(),
    }).returning();
    return attempt;
  }

  async getQuizAttempt(attemptId: string): Promise<QuizAttempt | undefined> {
    const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, attemptId));
    return attempt || undefined;
  }

  async getQuizAttempts(userId: string, quizId?: string): Promise<QuizAttempt[]> {
    if (quizId) {
      return await db.select().from(quizAttempts).where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId))).orderBy(desc(quizAttempts.startedAt));
    }
    return await db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId)).orderBy(desc(quizAttempts.startedAt));
  }

  async updateQuizAttempt(attemptId: string, data: Partial<QuizAttempt>): Promise<QuizAttempt | undefined> {
    const [updated] = await db.update(quizAttempts).set(data).where(eq(quizAttempts.id, attemptId)).returning();
    return updated || undefined;
  }

  async createQuizResponse(data: { attemptId: string; questionId: string; selectedAnswerId: string; isCorrect: boolean; pointsEarned: number }): Promise<QuizResponse> {
    const id = `response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const [response] = await db.insert(quizResponses).values({
      id,
      attemptId: data.attemptId,
      questionId: data.questionId,
      selectedAnswerId: data.selectedAnswerId,
      isCorrect: data.isCorrect,
      pointsEarned: data.pointsEarned,
    }).returning();
    return response;
  }

  // Agent Configurations
  async getAgentConfiguration(agentId: string): Promise<AgentConfiguration | undefined> {
    const [config] = await db.select().from(agentConfigurations).where(eq(agentConfigurations.agentId, agentId));
    return config || undefined;
  }

  async getAllAgentConfigurations(): Promise<AgentConfiguration[]> {
    return await db.select().from(agentConfigurations).orderBy(agentConfigurations.agentId);
  }

  async upsertAgentConfiguration(config: InsertAgentConfiguration): Promise<AgentConfiguration> {
    const existing = await this.getAgentConfiguration(config.agentId);
    if (existing) {
      const [updated] = await db
        .update(agentConfigurations)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(agentConfigurations.agentId, config.agentId))
        .returning();
      return updated;
    }
    const [newConfig] = await db.insert(agentConfigurations).values(config).returning();
    return newConfig;
  }

  async verifyAgentTrust(agentId: string, verified: boolean): Promise<AgentConfiguration | undefined> {
    const [updated] = await db
      .update(agentConfigurations)
      .set({
        isVerified: verified,
        verifiedAt: verified ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(agentConfigurations.agentId, agentId))
      .returning();
    return updated || undefined;
  }

  // Athena Email Approvals
  async getAthenaEmailApprovals(status?: string): Promise<AthenaEmailApproval[]> {
    if (status) {
      return await db.select().from(athenaEmailApprovals)
        .where(eq(athenaEmailApprovals.status, status))
        .orderBy(desc(athenaEmailApprovals.createdAt));
    }
    return await db.select().from(athenaEmailApprovals).orderBy(desc(athenaEmailApprovals.createdAt));
  }

  async createEmailApproval(approval: InsertAthenaEmailApproval): Promise<AthenaEmailApproval> {
    const [newApproval] = await db.insert(athenaEmailApprovals).values(approval).returning();
    return newApproval;
  }

  async updateEmailApproval(id: string, updates: Partial<AthenaEmailApproval>): Promise<AthenaEmailApproval | undefined> {
    const [updated] = await db
      .update(athenaEmailApprovals)
      .set(updates)
      .where(eq(athenaEmailApprovals.id, id))
      .returning();
    return updated || undefined;
  }

  // Agent Task Reviews
  async getTaskReviews(taskId?: string): Promise<AgentTaskReview[]> {
    if (taskId) {
      return await db.select().from(agentTaskReviews)
        .where(eq(agentTaskReviews.taskId, taskId))
        .orderBy(desc(agentTaskReviews.requestedAt));
    }
    return await db.select().from(agentTaskReviews).orderBy(desc(agentTaskReviews.requestedAt));
  }

  async getPendingReviews(): Promise<AgentTaskReview[]> {
    return await db.select().from(agentTaskReviews)
      .where(eq(agentTaskReviews.status, "pending"))
      .orderBy(desc(agentTaskReviews.requestedAt));
  }

  async createTaskReview(review: InsertAgentTaskReview): Promise<AgentTaskReview> {
    const [newReview] = await db.insert(agentTaskReviews).values(review).returning();
    return newReview;
  }

  async updateTaskReview(id: string, updates: Partial<AgentTaskReview>): Promise<AgentTaskReview | undefined> {
    const updateData: Partial<AgentTaskReview> = { ...updates };
    if (updates.status && updates.status !== "pending") {
      updateData.reviewedAt = new Date();
    }
    const [updated] = await db
      .update(agentTaskReviews)
      .set(updateData)
      .where(eq(agentTaskReviews.id, id))
      .returning();
    return updated || undefined;
  }

  // Division Leadership
  async getDivisionLeads(): Promise<DivisionLead[]> {
    return await db.select().from(divisionLeads).orderBy(divisionLeads.division);
  }

  async getDivisionLead(division: string): Promise<DivisionLead | undefined> {
    const [lead] = await db.select().from(divisionLeads).where(eq(divisionLeads.division, division as any));
    return lead || undefined;
  }

  async updateDivisionLead(division: string, updates: Partial<DivisionLead>): Promise<DivisionLead | undefined> {
    const [updated] = await db
      .update(divisionLeads)
      .set({ ...updates, updatedAt: new Date(), lastStatusUpdate: new Date() })
      .where(eq(divisionLeads.division, division as any))
      .returning();
    return updated || undefined;
  }

  // WordPress Roles
  async getUserWpRoles(userId: string): Promise<Array<{ wpRoleSlug: string; isPrimary: boolean | null }>> {
    const roles = await db.select({
      wpRoleSlug: userWpRoles.wpRoleSlug,
      isPrimary: userWpRoles.isPrimary
    }).from(userWpRoles).where(eq(userWpRoles.userId, userId));
    return roles;
  }

  // Blood Sample Library
  async getBloodSamples(filters?: { organismType?: string; category?: string; search?: string; tags?: string[] }): Promise<BloodSample[]> {
    let conditions: any[] = [eq(bloodSamples.isActive, true)];

    if (filters?.organismType) {
      conditions.push(eq(bloodSamples.organismType, filters.organismType as any));
    }
    if (filters?.category) {
      conditions.push(eq(bloodSamples.category, filters.category as any));
    }
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(bloodSamples.title, searchTerm),
          ilike(bloodSamples.scientificName, searchTerm),
          ilike(bloodSamples.commonName, searchTerm),
          ilike(bloodSamples.description, searchTerm)
        )
      );
    }

    let samples = await db.select().from(bloodSamples)
      .where(and(...conditions))
      .orderBy(bloodSamples.sortOrder, bloodSamples.title);

    if (filters?.tags && filters.tags.length > 0) {
      const sampleIdsWithTags = await db.select({ sampleId: bloodSampleTags.sampleId })
        .from(bloodSampleTags)
        .where(inArray(bloodSampleTags.tag, filters.tags));
      const taggedIds = new Set(sampleIdsWithTags.map(t => t.sampleId));
      samples = samples.filter(s => taggedIds.has(s.id));
    }

    return samples;
  }

  async getBloodSampleById(id: string): Promise<BloodSample | undefined> {
    const [sample] = await db.select().from(bloodSamples).where(eq(bloodSamples.id, id));
    return sample || undefined;
  }

  async createBloodSample(sample: InsertBloodSample): Promise<BloodSample> {
    const [newSample] = await db.insert(bloodSamples).values(sample).returning();
    return newSample;
  }

  async updateBloodSample(id: string, updates: Partial<BloodSample>): Promise<BloodSample | undefined> {
    const [updated] = await db.update(bloodSamples)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bloodSamples.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBloodSample(id: string): Promise<boolean> {
    const result = await db.delete(bloodSamples).where(eq(bloodSamples.id, id));
    return true;
  }

  async getBloodSampleTags(sampleId: string): Promise<BloodSampleTag[]> {
    return await db.select().from(bloodSampleTags).where(eq(bloodSampleTags.sampleId, sampleId));
  }

  async addBloodSampleTag(tag: InsertBloodSampleTag): Promise<BloodSampleTag> {
    const [newTag] = await db.insert(bloodSampleTags).values(tag).returning();
    return newTag;
  }

  async getAllBloodSampleTags(): Promise<string[]> {
    const tags = await db.selectDistinct({ tag: bloodSampleTags.tag }).from(bloodSampleTags);
    return tags.map(t => t.tag);
  }

  async searchBloodSamplesForAI(query: string, limit: number = 10): Promise<BloodSample[]> {
    const searchTerm = `%${query}%`;
    return await db.select().from(bloodSamples)
      .where(and(
        eq(bloodSamples.isActive, true),
        or(
          ilike(bloodSamples.title, searchTerm),
          ilike(bloodSamples.scientificName, searchTerm),
          ilike(bloodSamples.commonName, searchTerm),
          ilike(bloodSamples.description, searchTerm),
          ilike(bloodSamples.clinicalSignificance, searchTerm),
          ilike(bloodSamples.morphologyDescription, searchTerm)
        )
      ))
      .limit(limit);
  }

  async getDianeKnowledge(): Promise<DianeKnowledge[]> {
    return await db.select().from(dianeKnowledge).where(eq(dianeKnowledge.isActive, true));
  }

  // Member Engagement - Achievements
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.isActive, true));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db.insert(achievements).values(achievement).returning();
    return newAchievement;
  }

  async getUserAchievements(userId: string): Promise<(UserAchievement & { achievement?: Achievement })[]> {
    const userAchievementsList = await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
    const achievementsList = await db.select().from(achievements);
    const achievementsMap = new Map(achievementsList.map(a => [a.id, a]));
    return userAchievementsList.map(ua => ({
      ...ua,
      achievement: achievementsMap.get(ua.achievementId)
    }));
  }

  async awardAchievement(userId: string, achievementId: string, metadata?: Record<string, unknown>): Promise<UserAchievement> {
    const existing = await db.select().from(userAchievements).where(and(
      eq(userAchievements.userId, userId),
      eq(userAchievements.achievementId, achievementId)
    ));
    if (existing.length > 0) return existing[0];
    const [newUserAchievement] = await db.insert(userAchievements).values({ userId, achievementId, metadata }).returning();
    return newUserAchievement;
  }

  // Member Engagement - Bookmarks
  async getUserBookmarks(userId: string): Promise<ModuleBookmark[]> {
    return await db.select().from(moduleBookmarks).where(eq(moduleBookmarks.userId, userId)).orderBy(desc(moduleBookmarks.createdAt));
  }

  async addBookmark(bookmark: InsertModuleBookmark): Promise<ModuleBookmark> {
    const existing = await db.select().from(moduleBookmarks).where(and(
      eq(moduleBookmarks.userId, bookmark.userId),
      eq(moduleBookmarks.moduleId, bookmark.moduleId)
    ));
    if (existing.length > 0) return existing[0];
    const [newBookmark] = await db.insert(moduleBookmarks).values(bookmark).returning();
    return newBookmark;
  }

  async removeBookmark(userId: string, moduleId: string): Promise<boolean> {
    await db.delete(moduleBookmarks).where(and(
      eq(moduleBookmarks.userId, userId),
      eq(moduleBookmarks.moduleId, moduleId)
    ));
    return true;
  }

  async isBookmarked(userId: string, moduleId: string): Promise<boolean> {
    const result = await db.select().from(moduleBookmarks).where(and(
      eq(moduleBookmarks.userId, userId),
      eq(moduleBookmarks.moduleId, moduleId)
    ));
    return result.length > 0;
  }

  // Member Engagement - Discussions
  async getDiscussionThreads(moduleId?: string): Promise<DiscussionThread[]> {
    if (moduleId) {
      return await db.select().from(discussionThreads).where(eq(discussionThreads.moduleId, moduleId)).orderBy(desc(discussionThreads.lastActivityAt));
    }
    return await db.select().from(discussionThreads).orderBy(desc(discussionThreads.lastActivityAt));
  }

  async getDiscussionThread(id: string): Promise<DiscussionThread | undefined> {
    const [thread] = await db.select().from(discussionThreads).where(eq(discussionThreads.id, id));
    return thread;
  }

  async createDiscussionThread(thread: InsertDiscussionThread): Promise<DiscussionThread> {
    const [newThread] = await db.insert(discussionThreads).values(thread).returning();
    return newThread;
  }

  async getDiscussionReplies(threadId: string): Promise<DiscussionReply[]> {
    return await db.select().from(discussionReplies).where(eq(discussionReplies.threadId, threadId)).orderBy(discussionReplies.createdAt);
  }

  async createDiscussionReply(reply: InsertDiscussionReply): Promise<DiscussionReply> {
    const [newReply] = await db.insert(discussionReplies).values(reply).returning();
    await db.update(discussionThreads).set({ replyCount: (await db.select().from(discussionReplies).where(eq(discussionReplies.threadId, reply.threadId))).length, lastActivityAt: new Date() }).where(eq(discussionThreads.id, reply.threadId));
    return newReply;
  }

  // Doctor Dashboard - Patient Records
  async getPatientRecords(doctorId: string): Promise<PatientRecord[]> {
    return await db.select().from(patientRecords).where(eq(patientRecords.doctorId, doctorId)).orderBy(desc(patientRecords.updatedAt));
  }

  // AI Model Evaluations
  async getAiModelEvaluations(status?: string): Promise<any[]> {
    const { aiModelEvaluations } = await import("@shared/schema");
    if (status) {
      return await db.select().from(aiModelEvaluations).where(eq(aiModelEvaluations.status, status)).orderBy(desc(aiModelEvaluations.createdAt));
    }
    return await db.select().from(aiModelEvaluations).orderBy(desc(aiModelEvaluations.createdAt));
  }

  async getAiModelEvaluation(id: number): Promise<any | undefined> {
    const { aiModelEvaluations } = await import("@shared/schema");
    const [evals] = await db.select().from(aiModelEvaluations).where(eq(aiModelEvaluations.id, id));
    return evals || undefined;
  }

  async updateAiModelEvaluation(id: number, updates: any): Promise<any | undefined> {
    const { aiModelEvaluations } = await import("@shared/schema");
    const [updated] = await db.update(aiModelEvaluations)
      .set({ ...updates })
      .where(eq(aiModelEvaluations.id, id))
      .returning();
    return updated || undefined;
  }

  async getPatientRecord(id: string): Promise<PatientRecord | undefined> {
    const [record] = await db.select().from(patientRecords).where(eq(patientRecords.id, id));
    return record;
  }

  async createPatientRecord(record: InsertPatientRecord): Promise<PatientRecord> {
    const [newRecord] = await db.insert(patientRecords).values(record).returning();
    return newRecord;
  }

  async updatePatientRecord(id: string, updates: Partial<PatientRecord>): Promise<PatientRecord | undefined> {
    const [updated] = await db.update(patientRecords).set({ ...updates, updatedAt: new Date() }).where(eq(patientRecords.id, id)).returning();
    return updated;
  }

  async deletePatientRecord(id: string): Promise<boolean> {
    await db.delete(patientRecords).where(eq(patientRecords.id, id));
    return true;
  }

  // Doctor Dashboard - Patient Uploads
  async getPatientUploads(patientRecordId: string): Promise<PatientUpload[]> {
    return await db.select().from(patientUploads).where(eq(patientUploads.patientRecordId, patientRecordId)).orderBy(desc(patientUploads.createdAt));
  }

  async createPatientUpload(upload: InsertPatientUpload): Promise<PatientUpload> {
    const [newUpload] = await db.insert(patientUploads).values(upload).returning();
    return newUpload;
  }

  async updatePatientUpload(id: string, updates: Partial<PatientUpload>): Promise<PatientUpload | undefined> {
    const [updated] = await db.update(patientUploads).set(updates).where(eq(patientUploads.id, id)).returning();
    return updated;
  }

  // Doctor Dashboard - Patient Protocols
  async getPatientProtocols(patientRecordId: string): Promise<PatientProtocol[]> {
    return await db.select().from(patientProtocols).where(eq(patientProtocols.patientRecordId, patientRecordId)).orderBy(desc(patientProtocols.updatedAt));
  }

  async getDoctorProtocols(doctorId: string): Promise<PatientProtocol[]> {
    return await db.select().from(patientProtocols).where(eq(patientProtocols.doctorId, doctorId)).orderBy(desc(patientProtocols.updatedAt));
  }

  async createPatientProtocol(protocol: InsertPatientProtocol): Promise<PatientProtocol> {
    const [newProtocol] = await db.insert(patientProtocols).values(protocol).returning();
    return newProtocol;
  }

  async updatePatientProtocol(id: string, updates: Partial<PatientProtocol>): Promise<PatientProtocol | undefined> {
    const [updated] = await db.update(patientProtocols).set({ ...updates, updatedAt: new Date() }).where(eq(patientProtocols.id, id)).returning();
    return updated;
  }

  // Doctor Dashboard - Messaging
  async getConversations(userId: string): Promise<Conversation[]> {
    const allConversations = await db.select().from(conversations).orderBy(desc(conversations.lastMessageAt));
    return allConversations.filter(c => c.participantIds?.includes(userId));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db.insert(conversations).values(conversation).returning();
    return newConversation;
  }

  async getMessages(conversationId: string): Promise<DoctorPatientMessage[]> {
    return await db.select().from(doctorPatientMessages).where(eq(doctorPatientMessages.conversationId, conversationId)).orderBy(doctorPatientMessages.createdAt);
  }

  async createMessage(message: InsertDoctorPatientMessage): Promise<DoctorPatientMessage> {
    const [newMessage] = await db.insert(doctorPatientMessages).values(message).returning();
    await db.update(conversations).set({
      lastMessageAt: new Date(),
      lastMessagePreview: message.content.substring(0, 100)
    }).where(eq(conversations.id, message.conversationId));
    return newMessage;
  }

  async markMessageRead(id: string): Promise<DoctorPatientMessage | undefined> {
    const [updated] = await db.update(doctorPatientMessages).set({ status: 'read', readAt: new Date() }).where(eq(doctorPatientMessages.id, id)).returning();
    return updated;
  }

  // UI Refactor Proposals
  async getUiRefactorProposals(status?: string): Promise<UiRefactorProposal[]> {
    if (status) {
      return await db.select().from(uiRefactorProposals).where(eq(uiRefactorProposals.status, status as any)).orderBy(desc(uiRefactorProposals.createdAt));
    }
    return await db.select().from(uiRefactorProposals).orderBy(desc(uiRefactorProposals.createdAt));
  }

  async getUiRefactorProposal(id: string): Promise<UiRefactorProposal | undefined> {
    const [proposal] = await db.select().from(uiRefactorProposals).where(eq(uiRefactorProposals.id, id));
    return proposal || undefined;
  }

  async createUiRefactorProposal(proposal: InsertUiRefactorProposal): Promise<UiRefactorProposal> {
    const [newProposal] = await db.insert(uiRefactorProposals).values(proposal).returning();

    // Notify Trustee via OpenClaw WhatsApp Integration
    try {
      await db.insert(openclawMessages).values({
        fromAgent: proposal.agentId,
        message: `New UI Evolution Proposal from ${proposal.agentId}\nFile: ${proposal.targetFile}\nDesc: ${proposal.description}\n\nPlease review and approve in the Sentinel Dashboard.`,
        priority: 'high',
        status: 'pending'
      });
    } catch (err) {
      console.error("Failed to queue OpenClaw notification for UI Proposal:", err);
    }

    return newProposal;
  }

  async updateUiRefactorProposal(id: string, updates: Partial<UiRefactorProposal>): Promise<UiRefactorProposal | undefined> {
    const [updated] = await db.update(uiRefactorProposals).set(updates).where(eq(uiRefactorProposals.id, id)).returning();
    return updated || undefined;
  }

  async getFrequencies(filters?: { category?: string; search?: string; featured?: boolean }): Promise<Frequency[]> {
    const conditions = [eq(frequencies.isActive, true)];
    if (filters?.category) {
      conditions.push(eq(frequencies.category, filters.category));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(frequencies.title, `%${filters.search}%`),
          ilike(frequencies.description, `%${filters.search}%`),
          ilike(frequencies.purpose, `%${filters.search}%`)
        )!
      );
    }
    if (filters?.featured) {
      conditions.push(eq(frequencies.isFeatured, true));
    }
    return await db.select().from(frequencies).where(and(...conditions)).orderBy(desc(frequencies.isFeatured), frequencies.title);
  }

  async getFrequency(id: string): Promise<Frequency | undefined> {
    const [freq] = await db.select().from(frequencies).where(eq(frequencies.id, id));
    return freq || undefined;
  }

  async createFrequency(data: InsertFrequency): Promise<Frequency> {
    const [freq] = await db.insert(frequencies).values(data).returning();
    return freq;
  }

  async updateFrequency(id: string, updates: Partial<Frequency>): Promise<Frequency | undefined> {
    const [updated] = await db.update(frequencies).set({ ...updates, updatedAt: new Date() }).where(eq(frequencies.id, id)).returning();
    return updated || undefined;
  }

  async deleteFrequency(id: string): Promise<boolean> {
    const [deleted] = await db.update(frequencies).set({ isActive: false }).where(eq(frequencies.id, id)).returning();
    return !!deleted;
  }

  async incrementFrequencyPlayCount(id: string): Promise<void> {
    await db.update(frequencies).set({ playCount: sql`${frequencies.playCount} + 1` }).where(eq(frequencies.id, id));
  }

  async getFrequencyCategories(): Promise<FrequencyCategory[]> {
    return await db.select().from(frequencyCategories).where(eq(frequencyCategories.isActive, true)).orderBy(frequencyCategories.sortOrder);
  }

  async createFrequencyCategory(data: InsertFrequencyCategory): Promise<FrequencyCategory> {
    const [cat] = await db.insert(frequencyCategories).values(data).returning();
    return cat;
  }

  async getLabOrders(doctorId: string): Promise<LabOrder[]> {
    return await db.select().from(labOrders).where(eq(labOrders.doctorId, doctorId)).orderBy(desc(labOrders.createdAt));
  }

  async getLabOrder(id: string): Promise<LabOrder | undefined> {
    const [order] = await db.select().from(labOrders).where(eq(labOrders.id, id));
    return order || undefined;
  }

  async createLabOrder(order: InsertLabOrder): Promise<LabOrder> {
    const [newOrder] = await db.insert(labOrders).values(order).returning();
    return newOrder;
  }

  async updateLabOrder(id: string, updates: Partial<LabOrder>): Promise<LabOrder | undefined> {
    const [updated] = await db.update(labOrders).set({ ...updates, updatedAt: new Date() }).where(eq(labOrders.id, id)).returning();
    return updated || undefined;
  }

  async deleteLabOrder(id: string): Promise<boolean> {
    await db.delete(labOrders).where(eq(labOrders.id, id));
    return true;
  }

  async getLabResults(memberId: string): Promise<LabResult[]> {
    return await db.select().from(labResults).where(eq(labResults.memberId, memberId)).orderBy(desc(labResults.resultDate));
  }

  async getLabResultsByDoctor(doctorId: string): Promise<LabResult[]> {
    return await db.select().from(labResults).where(eq(labResults.doctorId, doctorId)).orderBy(desc(labResults.resultDate));
  }

  async getLabResult(id: string): Promise<LabResult | undefined> {
    const [result] = await db.select().from(labResults).where(eq(labResults.id, id));
    return result || undefined;
  }

  async createLabResult(result: InsertLabResult): Promise<LabResult> {
    const [newResult] = await db.insert(labResults).values(result).returning();
    return newResult;
  }

  async createLabResults(results: InsertLabResult[]): Promise<LabResult[]> {
    if (results.length === 0) return [];
    return await db.insert(labResults).values(results).returning();
  }

  async updateLabResult(id: string, updates: Partial<LabResult>): Promise<LabResult | undefined> {
    const [updated] = await db.update(labResults).set({ ...updates, updatedAt: new Date() }).where(eq(labResults.id, id)).returning();
    return updated || undefined;
  }

  async deleteLabResult(id: string): Promise<boolean> {
    await db.delete(labResults).where(eq(labResults.id, id));
    return true;
  }

  async getSavedTestPanels(doctorId: string): Promise<SavedTestPanel[]> {
    return await db.select().from(savedTestPanels).where(and(eq(savedTestPanels.doctorId, doctorId), eq(savedTestPanels.isActive, true))).orderBy(desc(savedTestPanels.createdAt));
  }

  async getSavedTestPanel(id: string): Promise<SavedTestPanel | undefined> {
    const [panel] = await db.select().from(savedTestPanels).where(eq(savedTestPanels.id, id));
    return panel || undefined;
  }

  async createSavedTestPanel(panel: InsertSavedTestPanel): Promise<SavedTestPanel> {
    const [newPanel] = await db.insert(savedTestPanels).values(panel).returning();
    return newPanel;
  }

  async updateSavedTestPanel(id: string, updates: Partial<SavedTestPanel>): Promise<SavedTestPanel | undefined> {
    const [updated] = await db.update(savedTestPanels).set({ ...updates, updatedAt: new Date() }).where(eq(savedTestPanels.id, id)).returning();
    return updated || undefined;
  }

  async deleteSavedTestPanel(id: string): Promise<boolean> {
    const [deleted] = await db.update(savedTestPanels).set({ isActive: false }).where(eq(savedTestPanels.id, id)).returning();
    return !!deleted;
  }
}

export const storage = new DatabaseStorage();
