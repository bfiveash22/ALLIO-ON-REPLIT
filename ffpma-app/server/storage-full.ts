// @ts-nocheck
import { 
  type User, 
  type InsertUser,
  type Product,
  type InsertProduct,
  type ProductVariation,
  type Category,
  type InsertCategory,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Program,
  type InsertProgram,
  type ProgramEnrollment,
  type InsertProgramEnrollment,
  type Clinic,
  type InsertClinic,
  type MemberProfile,
  type InsertMemberProfile,
  type Contract,
  type InsertContract,
  type LibraryItem,
  type InsertLibraryItem,
  type Quiz,
  type InsertQuiz,
  type QuizQuestion,
  type InsertQuizQuestion,
  type QuizAnswer,
  type InsertQuizAnswer,
  type QuizAttempt,
  type InsertQuizAttempt,
  type QuizResponse,
  type InsertQuizResponse,
  type TrainingModule,
  type InsertTrainingModule,
  type TrainingTrack,
  type InsertTrainingTrack,
  type DriveDocument,
  type InsertDriveDocument,
  type UserProgress,
  type InsertUserProgress,
  type TrackEnrollment,
  type InsertTrackEnrollment,
  type Referral,
  type InsertReferral,
  type ChatRoom,
  type InsertChatRoom,
  type ChatParticipant,
  type InsertChatParticipant,
  type ChatMessage,
  type InsertChatMessage,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { dbStorage } from "./db-storage";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  getProductVariations(productId: string): Promise<ProductVariation[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  
  // Orders
  getOrders(userId?: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  
  // Order Items
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  
  // Programs
  getPrograms(): Promise<Program[]>;
  getProgram(id: string): Promise<Program | undefined>;
  getProgramBySlug(slug: string): Promise<Program | undefined>;
  createProgram(program: InsertProgram): Promise<Program>;
  
  // Program Enrollments
  getProgramEnrollments(userId: string): Promise<ProgramEnrollment[]>;
  createProgramEnrollment(enrollment: InsertProgramEnrollment): Promise<ProgramEnrollment>;
  
  // Clinics
  getClinics(): Promise<Clinic[]>;
  getClinic(id: string): Promise<Clinic | undefined>;
  getClinicBySlug(slug: string): Promise<Clinic | undefined>;
  getClinicByWpId(wpClinicId: number): Promise<Clinic | undefined>;
  getClinicByOwner(ownerId: string): Promise<Clinic | undefined>;
  createClinic(clinic: InsertClinic): Promise<Clinic>;
  updateClinic(id: string, clinic: Partial<InsertClinic>): Promise<Clinic | undefined>;
  deleteClinic(id: string): Promise<void>;
  
  // Member Profiles
  getMemberProfiles(clinicId?: string): Promise<MemberProfile[]>;
  getMemberProfile(id: string): Promise<MemberProfile | undefined>;
  getMemberProfileByUserId(userId: string): Promise<MemberProfile | undefined>;
  createMemberProfile(profile: InsertMemberProfile): Promise<MemberProfile>;
  updateMemberProfile(id: string, profile: Partial<InsertMemberProfile>): Promise<MemberProfile | undefined>;
  
  // Contracts
  getContracts(userId?: string): Promise<Contract[]>;
  getContract(id: string): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  
  // Library Items
  getLibraryItems(): Promise<LibraryItem[]>;
  getLibraryItem(id: string): Promise<LibraryItem | undefined>;
  getLibraryItemBySlug(slug: string): Promise<LibraryItem | undefined>;
  createLibraryItem(item: InsertLibraryItem): Promise<LibraryItem>;
  
  // Quizzes
  getQuizzes(): Promise<Quiz[]>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  getQuizBySlug(slug: string): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: string, quiz: Partial<InsertQuiz>): Promise<Quiz | undefined>;
  
  // Quiz Questions
  getQuizQuestions(quizId: string): Promise<QuizQuestion[]>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  
  // Quiz Answers
  getQuizAnswers(questionId: string): Promise<QuizAnswer[]>;
  createQuizAnswer(answer: InsertQuizAnswer): Promise<QuizAnswer>;
  
  // Quiz Attempts
  getQuizAttempts(userId: string, quizId?: string): Promise<QuizAttempt[]>;
  getQuizAttempt(id: string): Promise<QuizAttempt | undefined>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  updateQuizAttempt(id: string, attempt: Partial<InsertQuizAttempt>): Promise<QuizAttempt | undefined>;
  
  // Quiz Responses
  getQuizResponses(attemptId: string): Promise<QuizResponse[]>;
  createQuizResponse(response: InsertQuizResponse): Promise<QuizResponse>;
  
  // Training Modules
  getTrainingModules(): Promise<TrainingModule[]>;
  getTrainingModule(id: string): Promise<TrainingModule | undefined>;
  getTrainingModuleBySlug(slug: string): Promise<TrainingModule | undefined>;
  createTrainingModule(module: InsertTrainingModule): Promise<TrainingModule>;
  updateTrainingModule(id: string, module: Partial<InsertTrainingModule>): Promise<TrainingModule | undefined>;
  
  // Training Tracks
  getTrainingTracks(): Promise<TrainingTrack[]>;
  getTrainingTrack(id: string): Promise<TrainingTrack | undefined>;
  getTrainingTrackBySlug(slug: string): Promise<TrainingTrack | undefined>;
  createTrainingTrack(track: InsertTrainingTrack): Promise<TrainingTrack>;
  
  // Drive Documents
  getDriveDocuments(): Promise<DriveDocument[]>;
  getDriveDocument(id: string): Promise<DriveDocument | undefined>;
  getDriveDocumentByDriveId(driveFileId: string): Promise<DriveDocument | undefined>;
  getDriveDocumentBySlug(slug: string): Promise<DriveDocument | undefined>;
  createDriveDocument(doc: InsertDriveDocument): Promise<DriveDocument>;
  updateDriveDocument(id: string, doc: Partial<InsertDriveDocument>): Promise<DriveDocument | undefined>;
  
  // User Progress
  getUserProgress(userId: string, contentType?: string): Promise<UserProgress[]>;
  getUserProgressForContent(userId: string, contentType: string, contentId: string): Promise<UserProgress | undefined>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(id: string, progress: Partial<InsertUserProgress>): Promise<UserProgress | undefined>;
  
  // Track Enrollments
  getTrackEnrollments(userId: string): Promise<TrackEnrollment[]>;
  getTrackEnrollment(userId: string, trackId: string): Promise<TrackEnrollment | undefined>;
  createTrackEnrollment(enrollment: InsertTrackEnrollment): Promise<TrackEnrollment>;
  updateTrackEnrollment(id: string, enrollment: Partial<InsertTrackEnrollment>): Promise<TrackEnrollment | undefined>;
  
  // Referrals
  getReferrals(referrerId: string): Promise<Referral[]>;
  getReferralByCode(code: string): Promise<Referral | undefined>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  updateReferral(id: string, referral: Partial<InsertReferral>): Promise<Referral | undefined>;

  // Chat
  getChatRooms(userId: string): Promise<ChatRoom[]>;
  getChatRoom(id: string): Promise<ChatRoom | undefined>;
  createChatRoom(room: InsertChatRoom): Promise<ChatRoom>;
  getChatParticipants(roomId: string): Promise<ChatParticipant[]>;
  addChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant>;
  getChatMessages(roomId: string, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getOrCreateDirectRoom(userId1: string, userId2: string): Promise<ChatRoom>;

  // Admin Stats
  getAdminStats(): Promise<{
    totalMembers: number;
    totalDoctors: number;
    totalClinics: number;
    totalOrders: number;
    totalProducts: number;
    totalModules: number;
    totalQuizzes: number;
    recentSignups: number;
    activeUsers: number;
  }>;
  getRecentMembers(days: number): Promise<Array<{
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string;
    createdAt: string;
  }>>;

  // Admin Members Roster
  getAllMembersWithDetails(filters?: { role?: string; clinicId?: string; source?: string }): Promise<Array<{
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string;
    clinicId: string | null;
    clinicName: string | null;
    sponsorId: string | null;
    sponsorName: string | null;
    wpUsername: string | null;
    wpRoles: string | null;
    source: string;
    createdAt: string;
  }>>;

  getMemberStatsByRole(): Promise<{
    byRole: Record<string, number>;
    bySource: Record<string, number>;
    byClinic: Array<{ clinicId: string; clinicName: string; count: number }>;
  }>;

  getAllContracts(): Promise<Contract[]>;

  // WordPress Role Definitions
  getWpRoleDefinitions(): Promise<any[]>;
  upsertWpRoleDefinition(role: { wpRoleSlug: string; displayName: string; source?: string }): Promise<any>;
  
  // WordPress Role Mappings
  getWpRoleMappings(): Promise<any[]>;
  getWpRoleMappingBySlug(wpRoleSlug: string): Promise<any | undefined>;
  createWpRoleMapping(mapping: any): Promise<any>;
  updateWpRoleMapping(id: string, mapping: any): Promise<any>;
  deleteWpRoleMapping(id: string): Promise<boolean>;
  
  // Sync Jobs
  getSyncJobs(limit?: number): Promise<any[]>;
  createSyncJob(job: any): Promise<any>;
  updateSyncJob(id: string, job: any): Promise<any>;
  
  // Doctor Downline
  getDoctorDownline(doctorId: string): Promise<any[]>;
  
  // User WordPress Roles
  getUserWpRoles(userId: string): Promise<any[]>;
  setUserWpRoles(userId: string, roles: string[]): Promise<void>;
  
  // Product Role Prices
  getProductRolePrice(productId: string, role: string, variationId?: string | null): Promise<{ price: string; priceVisible: boolean } | null>;
  getProductRolePrices(productId: string, variationId?: string | null): Promise<Array<{ role: string; price: string; priceVisible: boolean }>>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private products: Map<string, Product>;
  private categories: Map<string, Category>;
  private orders: Map<string, Order>;
  private orderItems: Map<string, OrderItem>;
  private programs: Map<string, Program>;
  private programEnrollments: Map<string, ProgramEnrollment>;
  private clinics: Map<string, Clinic>;
  private memberProfiles: Map<string, MemberProfile>;
  private contracts: Map<string, Contract>;
  private libraryItems: Map<string, LibraryItem>;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.categories = new Map();
    this.orders = new Map();
    this.libraryItems = new Map();
    this.orderItems = new Map();
    this.programs = new Map();
    this.programEnrollments = new Map();
    this.clinics = new Map();
    this.memberProfiles = new Map();
    this.contracts = new Map();
    
    this.seedData();
  }

  private seedData() {
    // Seed categories
    const categories: Category[] = [
      { id: "cat-1", name: "Peptides & Bioregulators", slug: "peptides", description: "Injectable and oral peptides for cellular regeneration", imageUrl: null, parentId: null, sortOrder: 1, isActive: true },
      { id: "cat-2", name: "Exosomes", slug: "exosomes", description: "100 Billion exosomes for regenerative therapy", imageUrl: null, parentId: null, sortOrder: 2, isActive: true },
      { id: "cat-3", name: "Vitamins & Minerals", slug: "vitamins", description: "Whole plant vitamins and trace minerals", imageUrl: null, parentId: null, sortOrder: 3, isActive: true },
      { id: "cat-4", name: "IV Supplies", slug: "iv-supplies", description: "Professional-grade IV therapy supplies", imageUrl: null, parentId: null, sortOrder: 4, isActive: true },
      { id: "cat-5", name: "Protocols", slug: "protocols", description: "Comprehensive treatment protocols", imageUrl: null, parentId: null, sortOrder: 5, isActive: true },
    ];
    categories.forEach(c => this.categories.set(c.id, c));

    // Seed products
    const products: Product[] = [
      { id: "prod-1", name: "BPC-157 Injectable", slug: "bpc-157-injectable", description: "Body Protection Compound-157 for healing and recovery. This peptide has been shown to accelerate wound healing and tissue repair.", shortDescription: "Premium healing peptide for tissue repair", categoryId: "cat-1", imageUrl: null, retailPrice: "89.00", wholesalePrice: "65.00", doctorPrice: "55.00", sku: "BPC-157-INJ", stockQuantity: 150, isActive: true, hasCoa: true, coaUrl: null, requiresMembership: true, productType: "Injectable Peptide", dosageInfo: "Standard dosing is 250-500mcg daily", protocolInfo: "Typically used for 4-8 weeks", createdAt: new Date() },
      { id: "prod-2", name: "Thymosin Alpha-1", slug: "thymosin-alpha-1", description: "Immune-modulating peptide for enhanced immunity and cellular health.", shortDescription: "Immune support peptide", categoryId: "cat-1", imageUrl: null, retailPrice: "145.00", wholesalePrice: "105.00", doctorPrice: "85.00", sku: "TA1-001", stockQuantity: 75, isActive: true, hasCoa: true, coaUrl: null, requiresMembership: true, productType: "Injectable Peptide", dosageInfo: "1.6mg twice weekly", protocolInfo: "Ongoing protocol for immune support", createdAt: new Date() },
      { id: "prod-3", name: "Exosome Solution - 100B", slug: "exosome-100b", description: "100 Billion exosomes for advanced regenerative therapy. Sourced from young, healthy donors.", shortDescription: "Premium exosome solution for regeneration", categoryId: "cat-2", imageUrl: null, retailPrice: "3500.00", wholesalePrice: "2800.00", doctorPrice: "2400.00", sku: "EXO-100B", stockQuantity: 25, isActive: true, hasCoa: true, coaUrl: null, requiresMembership: true, productType: "Regenerative", dosageInfo: "As directed by practitioner", protocolInfo: "Single or multi-session protocols available", createdAt: new Date() },
      { id: "prod-4", name: "Liposomal Vitamin C", slug: "liposomal-vitamin-c", description: "High-absorption liposomal vitamin C for optimal immune support and antioxidant protection.", shortDescription: "High-absorption vitamin C", categoryId: "cat-3", imageUrl: null, retailPrice: "45.00", wholesalePrice: "32.00", doctorPrice: "28.00", sku: "LVC-001", stockQuantity: 200, isActive: true, hasCoa: true, coaUrl: null, requiresMembership: false, productType: "Oral Supplement", dosageInfo: "1-2 packets daily", protocolInfo: "Daily supplementation recommended", createdAt: new Date() },
      { id: "prod-5", name: "Full Mineral Complex", slug: "full-mineral-complex", description: "Complete trace mineral complex from whole plant sources for optimal cellular function.", shortDescription: "Complete trace mineral support", categoryId: "cat-3", imageUrl: null, retailPrice: "38.00", wholesalePrice: "28.00", doctorPrice: "24.00", sku: "FMC-001", stockQuantity: 180, isActive: true, hasCoa: true, coaUrl: null, requiresMembership: false, productType: "Oral Supplement", dosageInfo: "2 capsules daily with food", protocolInfo: "Daily mineral support protocol", createdAt: new Date() },
      { id: "prod-6", name: "IV Starter Kit", slug: "iv-starter-kit", description: "Professional-grade IV administration kit including catheter, tubing, and accessories.", shortDescription: "Complete IV administration kit", categoryId: "cat-4", imageUrl: null, retailPrice: "25.00", wholesalePrice: "18.00", doctorPrice: "15.00", sku: "IVK-001", stockQuantity: 300, isActive: true, hasCoa: false, coaUrl: null, requiresMembership: true, productType: "Medical Supply", dosageInfo: null, protocolInfo: "For trained practitioners only", createdAt: new Date() },
      { id: "prod-7", name: "NAD+ Injectable", slug: "nad-injectable", description: "Nicotinamide Adenine Dinucleotide for cellular energy and longevity support.", shortDescription: "Cellular energy peptide", categoryId: "cat-1", imageUrl: null, retailPrice: "195.00", wholesalePrice: "145.00", doctorPrice: "125.00", sku: "NAD-001", stockQuantity: 60, isActive: true, hasCoa: true, coaUrl: null, requiresMembership: true, productType: "Injectable", dosageInfo: "250-500mg IV infusion", protocolInfo: "Weekly or bi-weekly protocols", createdAt: new Date() },
      { id: "prod-8", name: "Glutathione Push", slug: "glutathione-push", description: "High-dose glutathione for detoxification and antioxidant support.", shortDescription: "Master antioxidant solution", categoryId: "cat-4", imageUrl: null, retailPrice: "55.00", wholesalePrice: "40.00", doctorPrice: "35.00", sku: "GLU-001", stockQuantity: 120, isActive: true, hasCoa: true, coaUrl: null, requiresMembership: true, productType: "IV Solution", dosageInfo: "1000-2000mg IV push", protocolInfo: "Weekly detox protocol", createdAt: new Date() },
    ];
    products.forEach(p => this.products.set(p.id, p));

    // Seed programs
    const programs: Program[] = [
      { id: "prog-1", name: "IV Therapy Certification", slug: "iv-therapy-certification", type: "iv", description: "Complete IV therapy training and certification program for practitioners. Learn proper administration techniques, protocols, and patient care.", shortDescription: "Professional IV therapy training", imageUrl: null, price: "2500.00", duration: "4 weeks", isActive: true, createdAt: new Date() },
      { id: "prog-2", name: "Peptide Protocol Mastery", slug: "peptide-protocol-mastery", type: "peptide", description: "Master the art of peptide therapy. Comprehensive training on dosing, stacking, and patient protocols.", shortDescription: "Advanced peptide therapy training", imageUrl: null, price: "1800.00", duration: "6 weeks", isActive: true, createdAt: new Date() },
      { id: "prog-3", name: "Root Cause Protocol", slug: "root-cause-protocol", type: "protocol", description: "Learn the foundational protocols for addressing root cause health issues including mineral balancing, detoxification, and cellular support.", shortDescription: "Foundational healing protocols", imageUrl: null, price: "995.00", duration: "8 weeks", isActive: true, createdAt: new Date() },
      { id: "prog-4", name: "Advanced Detox Program", slug: "advanced-detox-program", type: "protocol", description: "Comprehensive detoxification program combining IV therapy, peptides, and lifestyle protocols.", shortDescription: "Full-body detoxification", imageUrl: null, price: "3500.00", duration: "12 weeks", isActive: true, createdAt: new Date() },
    ];
    programs.forEach(p => this.programs.set(p.id, p));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.isActive);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(p => p.slug === slug);
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      p => p.categoryId === categoryId && p.isActive
    );
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const newProduct: Product = { ...product, id, createdAt: new Date() };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...product };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(c => c.isActive);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(c => c.slug === slug);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const existing = this.categories.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...category };
    this.categories.set(id, updated);
    return updated;
  }

  // Orders
  async getOrders(userId?: string): Promise<Order[]> {
    const orders = Array.from(this.orders.values());
    if (userId) {
      return orders.filter(o => o.userId === userId);
    }
    return orders;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const newOrder: Order = { ...order, id, createdAt: new Date(), updatedAt: new Date() };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const existing = this.orders.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, status: status as any, updatedAt: new Date() };
    this.orders.set(id, updated);
    return updated;
  }

  // Order Items
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(i => i.orderId === orderId);
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const id = randomUUID();
    const newItem: OrderItem = { ...item, id };
    this.orderItems.set(id, newItem);
    return newItem;
  }

  // Programs
  async getPrograms(): Promise<Program[]> {
    return Array.from(this.programs.values()).filter(p => p.isActive);
  }

  async getProgram(id: string): Promise<Program | undefined> {
    return this.programs.get(id);
  }

  async getProgramBySlug(slug: string): Promise<Program | undefined> {
    return Array.from(this.programs.values()).find(p => p.slug === slug);
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    const id = randomUUID();
    const newProgram: Program = { ...program, id, createdAt: new Date() };
    this.programs.set(id, newProgram);
    return newProgram;
  }

  // Program Enrollments
  async getProgramEnrollments(userId: string): Promise<ProgramEnrollment[]> {
    return Array.from(this.programEnrollments.values()).filter(e => e.userId === userId);
  }

  async createProgramEnrollment(enrollment: InsertProgramEnrollment): Promise<ProgramEnrollment> {
    const id = randomUUID();
    const newEnrollment: ProgramEnrollment = { ...enrollment, id, startedAt: new Date() };
    this.programEnrollments.set(id, newEnrollment);
    return newEnrollment;
  }

  // Clinics
  async getClinics(): Promise<Clinic[]> {
    return Array.from(this.clinics.values()).filter(c => c.isActive);
  }

  async getClinic(id: string): Promise<Clinic | undefined> {
    return this.clinics.get(id);
  }

  async getClinicBySlug(slug: string): Promise<Clinic | undefined> {
    return Array.from(this.clinics.values()).find(c => c.slug === slug);
  }

  async getClinicByWpId(wpClinicId: number): Promise<Clinic | undefined> {
    return Array.from(this.clinics.values()).find(c => c.wpClinicId === wpClinicId);
  }

  async getClinicByOwner(ownerId: string): Promise<Clinic | undefined> {
    return Array.from(this.clinics.values()).find(c => c.ownerId === ownerId);
  }

  async createClinic(clinic: InsertClinic): Promise<Clinic> {
    const id = randomUUID();
    const newClinic: Clinic = { ...clinic, id, createdAt: new Date() };
    this.clinics.set(id, newClinic);
    return newClinic;
  }

  async updateClinic(id: string, clinic: Partial<InsertClinic>): Promise<Clinic | undefined> {
    const existing = this.clinics.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...clinic };
    this.clinics.set(id, updated);
    return updated;
  }

  async deleteClinic(id: string): Promise<void> {
    this.clinics.delete(id);
  }

  // Member Profiles
  async getMemberProfiles(clinicId?: string): Promise<MemberProfile[]> {
    const profiles = Array.from(this.memberProfiles.values());
    if (clinicId) {
      return profiles.filter(p => p.clinicId === clinicId);
    }
    return profiles;
  }

  async getMemberProfile(id: string): Promise<MemberProfile | undefined> {
    return this.memberProfiles.get(id);
  }

  async getMemberProfileByUserId(userId: string): Promise<MemberProfile | undefined> {
    return Array.from(this.memberProfiles.values()).find(p => p.userId === userId);
  }

  async createMemberProfile(profile: InsertMemberProfile): Promise<MemberProfile> {
    const id = randomUUID();
    const newProfile: MemberProfile = { ...profile, id, createdAt: new Date() };
    this.memberProfiles.set(id, newProfile);
    return newProfile;
  }

  async updateMemberProfile(id: string, profile: Partial<InsertMemberProfile>): Promise<MemberProfile | undefined> {
    const existing = this.memberProfiles.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...profile };
    this.memberProfiles.set(id, updated);
    return updated;
  }

  // Contracts
  async getContracts(userId?: string): Promise<Contract[]> {
    const contracts = Array.from(this.contracts.values());
    if (userId) {
      return contracts.filter(c => c.userId === userId);
    }
    return contracts;
  }

  async getContract(id: string): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const id = randomUUID();
    const newContract: Contract = { ...contract, id, createdAt: new Date() };
    this.contracts.set(id, newContract);
    return newContract;
  }

  async updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined> {
    const existing = this.contracts.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...contract };
    this.contracts.set(id, updated);
    return updated;
  }

  // Library Items
  async getLibraryItems(): Promise<LibraryItem[]> {
    return Array.from(this.libraryItems.values()).filter(item => item.isActive);
  }

  async getLibraryItem(id: string): Promise<LibraryItem | undefined> {
    return this.libraryItems.get(id);
  }

  async getLibraryItemBySlug(slug: string): Promise<LibraryItem | undefined> {
    return Array.from(this.libraryItems.values()).find(item => item.slug === slug);
  }

  async createLibraryItem(item: InsertLibraryItem): Promise<LibraryItem> {
    const id = randomUUID();
    const newItem: LibraryItem = { ...item, id, createdAt: new Date(), updatedAt: new Date(), viewCount: 0 };
    this.libraryItems.set(id, newItem);
    return newItem;
  }

  // Stub implementations for quiz and training methods (database-only features)
  async getQuizzes(): Promise<Quiz[]> { return []; }
  async getQuiz(id: string): Promise<Quiz | undefined> { return undefined; }
  async getQuizBySlug(slug: string): Promise<Quiz | undefined> { return undefined; }
  async createQuiz(quiz: InsertQuiz): Promise<Quiz> { throw new Error("Quizzes require database"); }
  async updateQuiz(id: string, quiz: Partial<InsertQuiz>): Promise<Quiz | undefined> { return undefined; }
  async getQuizQuestions(quizId: string): Promise<QuizQuestion[]> { return []; }
  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> { throw new Error("Quizzes require database"); }
  async getQuizAnswers(questionId: string): Promise<QuizAnswer[]> { return []; }
  async createQuizAnswer(answer: InsertQuizAnswer): Promise<QuizAnswer> { throw new Error("Quizzes require database"); }
  async getQuizAttempts(userId: string, quizId?: string): Promise<QuizAttempt[]> { return []; }
  async getQuizAttempt(id: string): Promise<QuizAttempt | undefined> { return undefined; }
  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> { throw new Error("Quizzes require database"); }
  async updateQuizAttempt(id: string, attempt: Partial<InsertQuizAttempt>): Promise<QuizAttempt | undefined> { return undefined; }
  async getQuizResponses(attemptId: string): Promise<QuizResponse[]> { return []; }
  async createQuizResponse(response: InsertQuizResponse): Promise<QuizResponse> { throw new Error("Quizzes require database"); }
  async getTrainingModules(): Promise<TrainingModule[]> { return []; }
  async getTrainingModule(id: string): Promise<TrainingModule | undefined> { return undefined; }
  async getTrainingModuleBySlug(slug: string): Promise<TrainingModule | undefined> { return undefined; }
  async createTrainingModule(module: InsertTrainingModule): Promise<TrainingModule> { throw new Error("Training requires database"); }
  async updateTrainingModule(id: string, module: Partial<InsertTrainingModule>): Promise<TrainingModule | undefined> { return undefined; }
  async getTrainingTracks(): Promise<TrainingTrack[]> { return []; }
  async getTrainingTrack(id: string): Promise<TrainingTrack | undefined> { return undefined; }
  async getTrainingTrackBySlug(slug: string): Promise<TrainingTrack | undefined> { return undefined; }
  async createTrainingTrack(track: InsertTrainingTrack): Promise<TrainingTrack> { throw new Error("Training requires database"); }
  async getDriveDocuments(): Promise<DriveDocument[]> { return []; }
  async getDriveDocument(id: string): Promise<DriveDocument | undefined> { return undefined; }
  async getDriveDocumentByDriveId(driveFileId: string): Promise<DriveDocument | undefined> { return undefined; }
  async getDriveDocumentBySlug(slug: string): Promise<DriveDocument | undefined> { return undefined; }
  async createDriveDocument(doc: InsertDriveDocument): Promise<DriveDocument> { throw new Error("Drive sync requires database"); }
  async updateDriveDocument(id: string, doc: Partial<InsertDriveDocument>): Promise<DriveDocument | undefined> { return undefined; }
  async getUserProgress(userId: string, contentType?: string): Promise<UserProgress[]> { return []; }
  async getUserProgressForContent(userId: string, contentType: string, contentId: string): Promise<UserProgress | undefined> { return undefined; }
  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> { throw new Error("Progress tracking requires database"); }
  async updateUserProgress(id: string, progress: Partial<InsertUserProgress>): Promise<UserProgress | undefined> { return undefined; }
  async getTrackEnrollments(userId: string): Promise<TrackEnrollment[]> { return []; }
  async getTrackEnrollment(userId: string, trackId: string): Promise<TrackEnrollment | undefined> { return undefined; }
  async createTrackEnrollment(enrollment: InsertTrackEnrollment): Promise<TrackEnrollment> { throw new Error("Track enrollment requires database"); }
  async updateTrackEnrollment(id: string, enrollment: Partial<InsertTrackEnrollment>): Promise<TrackEnrollment | undefined> { return undefined; }
  async getReferrals(referrerId: string): Promise<Referral[]> { return []; }
  async getReferralByCode(code: string): Promise<Referral | undefined> { return undefined; }
  async createReferral(referral: InsertReferral): Promise<Referral> { throw new Error("Referrals require database"); }
  async updateReferral(id: string, referral: Partial<InsertReferral>): Promise<Referral | undefined> { return undefined; }
  async getChatRooms(userId: string): Promise<ChatRoom[]> { return []; }
  async getChatRoom(id: string): Promise<ChatRoom | undefined> { return undefined; }
  async createChatRoom(room: InsertChatRoom): Promise<ChatRoom> { throw new Error("Chat requires database"); }
  async getChatParticipants(roomId: string): Promise<ChatParticipant[]> { return []; }
  async addChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant> { throw new Error("Chat requires database"); }
  async getChatMessages(roomId: string, limit?: number): Promise<ChatMessage[]> { return []; }
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> { throw new Error("Chat requires database"); }
  async getOrCreateDirectRoom(userId1: string, userId2: string): Promise<ChatRoom> { throw new Error("Chat requires database"); }
  async getAdminStats(): Promise<{ totalMembers: number; totalDoctors: number; totalClinics: number; totalOrders: number; totalProducts: number; totalModules: number; totalQuizzes: number; recentSignups: number; activeUsers: number; }> { return { totalMembers: 0, totalDoctors: 0, totalClinics: 0, totalOrders: 0, totalProducts: 0, totalModules: 0, totalQuizzes: 0, recentSignups: 0, activeUsers: 0 }; }
  async getRecentMembers(days: number): Promise<Array<{ id: string; email: string | null; firstName: string | null; lastName: string | null; role: string; createdAt: string; }>> { return []; }
}

// Use database storage for production, MemStorage as fallback
export const storage: IStorage = process.env.DATABASE_URL ? dbStorage : new MemStorage();
