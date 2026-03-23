import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../artifacts/api-server/src/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: "notif-1",
            type: "system_broadcast",
            title: "System-Wide Broadcast",
            message: "test",
            agentId: "SENTINEL",
            division: "executive",
            priority: 2,
            isRead: false,
            createdAt: new Date(),
          },
        ]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue([]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));

vi.mock("../artifacts/api-server/src/services/sentinel", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../artifacts/api-server/src/services/sentinel")>();
  return actual;
});

import {
  SentinelService,
  AGENT_DIVISIONS,
  type Division,
} from "../artifacts/api-server/src/services/sentinel";

describe("AGENT_DIVISIONS", () => {
  it("contains all expected divisions", () => {
    const expectedDivisions: Division[] = [
      "executive",
      "marketing",
      "science",
      "legal",
      "financial",
      "engineering",
      "support",
    ];
    for (const div of expectedDivisions) {
      expect(AGENT_DIVISIONS).toHaveProperty(div);
    }
  });

  it("each division has required fields", () => {
    for (const [, info] of Object.entries(AGENT_DIVISIONS)) {
      expect(info).toHaveProperty("name");
      expect(info).toHaveProperty("lead");
      expect(info).toHaveProperty("agents");
      expect(info).toHaveProperty("specialty");
      expect(Array.isArray(info.agents)).toBe(true);
    }
  });

  it("division agents have no duplicates", () => {
    for (const [div, info] of Object.entries(AGENT_DIVISIONS)) {
      const unique = new Set(info.agents);
      expect(unique.size, `Division ${div} has duplicate agents`).toBe(info.agents.length);
    }
  });

  it("lead agent is included in agents list or is a fallback", () => {
    for (const [, info] of Object.entries(AGENT_DIVISIONS)) {
      // Lead must be either in the agents list or the agents list is empty (fallback)
      if (info.agents.length > 0) {
        expect(info.agents).toContain(info.lead);
      }
    }
  });
});

describe("SentinelService.routeTaskToDivision", () => {
  let service: SentinelService;

  beforeEach(() => {
    service = new SentinelService();
  });

  it("routes video tasks to marketing division", async () => {
    const result = await service.routeTaskToDivision("video", "create promo video");
    expect(result.division).toBe("marketing");
    expect(result.routed).toBe(true);
    expect(result.lead).toBeTruthy();
  });

  it("routes blood tasks to science division", async () => {
    const result = await service.routeTaskToDivision("blood", "analyze blood sample");
    expect(result.division).toBe("science");
    expect(result.routed).toBe(true);
  });

  it("routes protocol tasks to science division", async () => {
    const result = await service.routeTaskToDivision("protocol", "generate member protocol");
    expect(result.division).toBe("science");
  });

  it("routes legal tasks to legal division", async () => {
    const result = await service.routeTaskToDivision("legal", "review compliance document");
    expect(result.division).toBe("legal");
  });

  it("routes compliance tasks to legal division", async () => {
    const result = await service.routeTaskToDivision("compliance", "audit procedures");
    expect(result.division).toBe("legal");
  });

  it("routes payment tasks to financial division", async () => {
    const result = await service.routeTaskToDivision("payment", "process member billing");
    expect(result.division).toBe("financial");
  });

  it("routes crypto tasks to financial division", async () => {
    const result = await service.routeTaskToDivision("crypto", "handle crypto payment");
    expect(result.division).toBe("financial");
  });

  it("routes api tasks to engineering division", async () => {
    const result = await service.routeTaskToDivision("api", "build API endpoint");
    expect(result.division).toBe("engineering");
  });

  it("routes member tasks to support division", async () => {
    const result = await service.routeTaskToDivision("member", "onboard new member");
    expect(result.division).toBe("support");
  });

  it("routes onboarding tasks to support division", async () => {
    const result = await service.routeTaskToDivision("onboarding", "setup new account");
    expect(result.division).toBe("support");
  });

  it("defaults to executive division for unknown task types", async () => {
    const result = await service.routeTaskToDivision("unknown-task-xyz", "some generic task");
    expect(result.division).toBe("executive");
  });

  it("uses suggestedDivision override when no keyword matches", async () => {
    const result = await service.routeTaskToDivision("random", "something", "engineering");
    expect(result.division).toBe("engineering");
  });

  it("returns routed: true for all successful routes", async () => {
    const taskTypes = ["video", "blood", "legal", "payment", "api", "member"];
    for (const taskType of taskTypes) {
      const result = await service.routeTaskToDivision(taskType, `${taskType} task details`);
      expect(result.routed).toBe(true);
    }
  });

  it("keyword match is case-insensitive (in taskType + details)", async () => {
    const result = await service.routeTaskToDivision("VIDEO", "Create Promotional Video");
    expect(result.division).toBe("marketing");
  });
});

describe("SentinelService.getAllAgents", () => {
  let service: SentinelService;

  beforeEach(() => {
    service = new SentinelService();
  });

  it("returns an array of agents", () => {
    const agents = service.getAllAgents();
    expect(Array.isArray(agents)).toBe(true);
  });

  it("each agent entry has required fields", () => {
    const agents = service.getAllAgents();
    for (const entry of agents) {
      expect(entry).toHaveProperty("agent");
      expect(entry).toHaveProperty("division");
      expect(entry).toHaveProperty("isLead");
    }
  });

  it("marks lead agents correctly", () => {
    const agents = service.getAllAgents();
    for (const [div, info] of Object.entries(AGENT_DIVISIONS)) {
      const leadEntry = agents.find(
        (a) => a.agent === info.lead && a.division === div
      );
      if (leadEntry) {
        expect(leadEntry.isLead).toBe(true);
      }
    }
  });

  it("non-lead agents have isLead: false", () => {
    const agents = service.getAllAgents();
    for (const entry of agents) {
      const divInfo = AGENT_DIVISIONS[entry.division];
      if (entry.agent !== divInfo.lead) {
        expect(entry.isLead).toBe(false);
      }
    }
  });
});

describe("SentinelService.getDivisionInfo", () => {
  let service: SentinelService;

  beforeEach(() => {
    service = new SentinelService();
  });

  it("returns correct info for each division", () => {
    const divisions: Division[] = [
      "executive", "marketing", "science", "legal",
      "financial", "engineering", "support"
    ];
    for (const div of divisions) {
      const info = service.getDivisionInfo(div);
      expect(info).toBeDefined();
      expect(info.name).toBeTruthy();
      expect(info.lead).toBeTruthy();
    }
  });
});

describe("SentinelService.coordinateCrossDivision", () => {
  let service: SentinelService;

  beforeEach(() => {
    service = new SentinelService();
  });

  it("returns a coordination ID string", async () => {
    const coordId = await service.coordinateCrossDivision(
      "marketing",
      "science",
      "task-42",
      "Need blood analysis data for campaign"
    );
    expect(typeof coordId).toBe("string");
    expect(coordId.startsWith("coord_")).toBe(true);
  });

  it("generates coordination IDs with coord_ prefix", async () => {
    const id1 = await service.coordinateCrossDivision(
      "engineering", "legal", "task-1", "Need compliance check"
    );
    expect(id1).toMatch(/^coord_\d+$/);
  });
});
