import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../artifacts/api-server/src/db", () => {
  const mockReturning = vi.fn();
  const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere, orderBy: vi.fn().mockResolvedValue([]) });
  const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
  const mockDelete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({ rowCount: 1 }) });

  const db = { select: mockSelect, insert: mockInsert, update: mockUpdate, delete: mockDelete };
  return { db };
});

import { DatabaseStorage } from "../artifacts/api-server/src/storage";
import { db } from "../artifacts/api-server/src/db";

function makeDb() {
  return db as typeof db & {
    select: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
}

describe("DatabaseStorage — contract methods", () => {
  let storage: DatabaseStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new DatabaseStorage();
  });

  it("getContract returns undefined when db returns empty array", async () => {
    const mdb = makeDb();
    const mockWhere = vi.fn().mockResolvedValue([]);
    mdb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: mockWhere }) });

    const result = await storage.getContract("nonexistent-id");
    expect(result).toBeUndefined();
  });

  it("getContract returns the first result when found", async () => {
    const mdb = makeDb();
    const fakeContract = { id: "c1", userId: "u1", status: "pending", templateId: "t1", doctorName: "Dr. Smith", doctorEmail: "dr@clinic.com" };
    const mockWhere = vi.fn().mockResolvedValue([fakeContract]);
    mdb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: mockWhere }) });

    const result = await storage.getContract("c1");
    expect(result).toEqual(fakeContract);
  });

  it("createContract inserts and returns the new contract", async () => {
    const mdb = makeDb();
    const insertData = { userId: "u1", clinicId: null, templateId: "t1", signNowDocumentId: null, signNowEnvelopeId: null, embeddedSigningUrl: null, doctorName: "Dr. Smith", doctorEmail: "dr@clinic.com", clinicName: null, licenseNumber: null, specialization: null, phone: null, status: "pending" as const };
    const created = { ...insertData, id: "new-c1", createdAt: new Date() };
    const mockReturning = vi.fn().mockResolvedValue([created]);
    mdb.insert.mockReturnValue({ values: vi.fn().mockReturnValue({ returning: mockReturning }) });

    const result = await storage.createContract(insertData);
    expect(result).toEqual(created);
    expect(mdb.insert).toHaveBeenCalledOnce();
  });

  it("updateContract returns undefined when no rows are updated", async () => {
    const mdb = makeDb();
    const mockReturning = vi.fn().mockResolvedValue([]);
    mdb.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: mockReturning }) }) });

    const result = await storage.updateContract("missing-id", { status: "completed" });
    expect(result).toBeUndefined();
  });

  it("updateContract returns updated contract when row is updated", async () => {
    const mdb = makeDb();
    const updated = { id: "c1", status: "completed", userId: "u1" };
    const mockReturning = vi.fn().mockResolvedValue([updated]);
    mdb.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: mockReturning }) }) });

    const result = await storage.updateContract("c1", { status: "completed" });
    expect(result).toEqual(updated);
  });

  it("getContractsByUser returns all contracts for a given user", async () => {
    const mdb = makeDb();
    const contracts = [
      { id: "c1", userId: "u1", status: "pending" },
      { id: "c2", userId: "u1", status: "completed" },
    ];
    const mockWhere = vi.fn().mockResolvedValue(contracts);
    mdb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: mockWhere }) });

    const result = await storage.getContractsByUser("u1");
    expect(result).toHaveLength(2);
    expect(result[0].userId).toBe("u1");
  });

  it("getAllContracts returns all contracts", async () => {
    const mdb = makeDb();
    const contracts = [{ id: "c1" }, { id: "c2" }, { id: "c3" }];
    mdb.select.mockReturnValue({ from: vi.fn().mockResolvedValue(contracts) });

    const result = await storage.getAllContracts();
    expect(result).toHaveLength(3);
  });
});

describe("DatabaseStorage — legal document methods", () => {
  let storage: DatabaseStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new DatabaseStorage();
  });

  it("getLegalDocument returns undefined when not found", async () => {
    const mdb = makeDb();
    const mockWhere = vi.fn().mockResolvedValue([]);
    mdb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: mockWhere }) });

    const result = await storage.getLegalDocument("not-found");
    expect(result).toBeUndefined();
  });

  it("getLegalDocument returns the first result when found", async () => {
    const mdb = makeDb();
    const doc = { id: "doc1", title: "PMA Agreement", content: "Legal content here" };
    const mockWhere = vi.fn().mockResolvedValue([doc]);
    mdb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: mockWhere }) });

    const result = await storage.getLegalDocument("doc1");
    expect(result).toEqual(doc);
  });

  it("createLegalDocument inserts and returns new doc", async () => {
    const mdb = makeDb();
    const docData = { title: "PMA Agreement", slug: "pma-agreement", content: "text" };
    const created = { ...docData, id: "new-doc", createdAt: new Date() };
    const mockReturning = vi.fn().mockResolvedValue([created]);
    mdb.insert.mockReturnValue({ values: vi.fn().mockReturnValue({ returning: mockReturning }) });

    const result = await storage.createLegalDocument(docData as any);
    expect(result).toEqual(created);
  });

  it("updateLegalDocument returns updated doc with new updatedAt", async () => {
    const mdb = makeDb();
    const updated = { id: "doc1", title: "Updated Title", updatedAt: new Date() };
    const mockReturning = vi.fn().mockResolvedValue([updated]);
    mdb.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: mockReturning }) }) });

    const result = await storage.updateLegalDocument("doc1", { title: "Updated Title" });
    expect(result).toEqual(updated);
  });

  it("deleteLegalDocument returns true after delete", async () => {
    const mdb = makeDb();
    mdb.delete.mockReturnValue({ where: vi.fn().mockResolvedValue({ rowCount: 1 }) });

    const result = await storage.deleteLegalDocument("doc1");
    expect(result).toBe(true);
  });
});

describe("DatabaseStorage — agent task methods", () => {
  let storage: DatabaseStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new DatabaseStorage();
  });

  it("getAgentTask returns undefined when not found", async () => {
    const mdb = makeDb();
    const mockWhere = vi.fn().mockResolvedValue([]);
    mdb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: mockWhere }) });

    const result = await storage.getAgentTask("missing-task");
    expect(result).toBeUndefined();
  });

  it("getAgentTask returns the task when found", async () => {
    const mdb = makeDb();
    const task = { id: "task1", title: "Research Task", division: "HELIX", status: "pending" };
    const mockWhere = vi.fn().mockResolvedValue([task]);
    mdb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: mockWhere }) });

    const result = await storage.getAgentTask("task1");
    expect(result).toEqual(task);
  });

  it("createAgentTask inserts and returns new task", async () => {
    const mdb = makeDb();
    const taskData = { title: "New Task", division: "HELIX", agentId: "agent-1", priority: "high" as const, status: "pending" as const };
    const created = { ...taskData, id: "new-task", createdAt: new Date() };
    const mockReturning = vi.fn().mockResolvedValue([created]);
    mdb.insert.mockReturnValue({ values: vi.fn().mockReturnValue({ returning: mockReturning }) });

    const result = await storage.createAgentTask(taskData as any);
    expect(result).toEqual(created);
    expect(mdb.insert).toHaveBeenCalledOnce();
  });

  it("updateAgentTask returns undefined when task not found", async () => {
    const mdb = makeDb();
    const mockReturning = vi.fn().mockResolvedValue([]);
    mdb.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: mockReturning }) }) });

    const result = await storage.updateAgentTask("missing", { status: "completed" });
    expect(result).toBeUndefined();
  });

  it("updateAgentTask returns updated task when found", async () => {
    const mdb = makeDb();
    const updated = { id: "task1", status: "completed", completedAt: new Date() };
    const mockReturning = vi.fn().mockResolvedValue([updated]);
    mdb.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: mockReturning }) }) });

    const result = await storage.updateAgentTask("task1", { status: "completed" });
    expect(result).toEqual(updated);
  });

  it("deleteAgentTask returns true after delete", async () => {
    const mdb = makeDb();
    mdb.delete.mockReturnValue({ where: vi.fn().mockResolvedValue({ rowCount: 1 }) });

    const result = await storage.deleteAgentTask("task1");
    expect(result).toBe(true);
  });

  it("getAgentTasksByDivision returns tasks filtered by division", async () => {
    const mdb = makeDb();
    const tasks = [
      { id: "t1", division: "HELIX", title: "Research" },
      { id: "t2", division: "HELIX", title: "Analysis" },
    ];
    const mockWhere = vi.fn().mockReturnValue({ orderBy: vi.fn().mockResolvedValue(tasks) });
    mdb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: mockWhere }) });

    const result = await storage.getAgentTasksByDivision("HELIX");
    expect(result).toHaveLength(2);
    expect(result.every(t => t.division === "HELIX")).toBe(true);
  });
});

describe("DatabaseStorage — member profile methods", () => {
  let storage: DatabaseStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new DatabaseStorage();
  });

  it("getAllMembers returns ordered list of member profiles", async () => {
    const mdb = makeDb();
    const profiles = [
      { id: "m1", userId: "u1", role: "member", createdAt: new Date() },
      { id: "m2", userId: "u2", role: "member", createdAt: new Date() },
    ];
    mdb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ orderBy: vi.fn().mockResolvedValue(profiles) }) });

    const result = await storage.getAllMembers();
    expect(result).toHaveLength(2);
    expect(mdb.select).toHaveBeenCalledOnce();
  });

  it("getAllMembers returns empty array when no members", async () => {
    const mdb = makeDb();
    mdb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ orderBy: vi.fn().mockResolvedValue([]) }) });

    const result = await storage.getAllMembers();
    expect(result).toEqual([]);
  });
});

describe("DatabaseStorage — user methods", () => {
  let storage: DatabaseStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new DatabaseStorage();
  });

  it("getUser returns undefined when user not found", async () => {
    const mdb = makeDb();
    const mockWhere = vi.fn().mockResolvedValue([]);
    mdb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: mockWhere }) });

    const result = await storage.getUser("non-existent");
    expect(result).toBeUndefined();
  });

  it("getUser returns the found user", async () => {
    const mdb = makeDb();
    const user = { id: "u1", email: "user@example.com", firstName: "John" };
    const mockWhere = vi.fn().mockResolvedValue([user]);
    mdb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: mockWhere }) });

    const result = await storage.getUser("u1");
    expect(result).toEqual(user);
  });

  it("createUser inserts a new user and returns it", async () => {
    const mdb = makeDb();
    const userData = { id: "new-user", email: "new@example.com", firstName: "Jane" };
    const mockReturning = vi.fn().mockResolvedValue([userData]);
    mdb.insert.mockReturnValue({ values: vi.fn().mockReturnValue({ returning: mockReturning }) });

    const result = await storage.createUser(userData as any);
    expect(result).toEqual(userData);
    expect(mdb.insert).toHaveBeenCalledOnce();
  });
});
