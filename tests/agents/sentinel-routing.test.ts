import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../artifacts/api-server/src/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: 'notif-001',
            type: 'task_routed',
            title: 'Test Notification',
            message: 'Test message',
            agentId: 'TEST',
            division: 'engineering',
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
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
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

vi.mock('../../lib/shared/src/agents', async () => {
  const actual = await vi.importActual('../../lib/shared/src/agents');
  return actual;
});

import { SentinelService, AGENT_DIVISIONS } from '../../artifacts/api-server/src/services/sentinel';

describe('SentinelService - Division Metadata', () => {
  it('AGENT_DIVISIONS contains all 7 expected divisions', () => {
    const divisions = Object.keys(AGENT_DIVISIONS);
    expect(divisions).toContain('executive');
    expect(divisions).toContain('marketing');
    expect(divisions).toContain('science');
    expect(divisions).toContain('legal');
    expect(divisions).toContain('financial');
    expect(divisions).toContain('engineering');
    expect(divisions).toContain('support');
  });

  it('each division has required metadata fields', () => {
    for (const [divName, divInfo] of Object.entries(AGENT_DIVISIONS)) {
      expect(typeof divInfo.name).toBe('string', `${divName}.name should be a string`);
      expect(divInfo.name.length).toBeGreaterThan(0);
      expect(typeof divInfo.lead).toBe('string', `${divName}.lead should be a string`);
      expect(divInfo.lead.length).toBeGreaterThan(0);
      expect(Array.isArray(divInfo.agents)).toBe(true, `${divName}.agents should be an array`);
      expect(divInfo.agents.length).toBeGreaterThan(0);
      expect(typeof divInfo.specialty).toBe('string');
    }
  });

  it('each division lead agent appears in the agents list', () => {
    for (const [divName, divInfo] of Object.entries(AGENT_DIVISIONS)) {
      expect(divInfo.agents).toContain(divInfo.lead, `${divName}: lead ${divInfo.lead} not in agents list`);
    }
  });

  it('no duplicate agent IDs within a single division', () => {
    for (const [divName, divInfo] of Object.entries(AGENT_DIVISIONS)) {
      const uniqueAgents = new Set(divInfo.agents);
      expect(uniqueAgents.size).toBe(divInfo.agents.length, `${divName} has duplicate agent IDs`);
    }
  });
});

describe('SentinelService - Task Routing', () => {
  let sentinel: SentinelService;

  beforeEach(() => {
    sentinel = new SentinelService();
  });

  it('routes blood analysis tasks to science division', async () => {
    const result = await sentinel.routeTaskToDivision('blood analysis', 'Analyze member CBC panel');
    expect(result.division).toBe('science');
    expect(result.routed).toBe(true);
    expect(typeof result.lead).toBe('string');
  });

  it('routes protocol development tasks to science division', async () => {
    const result = await sentinel.routeTaskToDivision('protocol', 'Create healing protocol for member');
    expect(result.division).toBe('science');
    expect(result.routed).toBe(true);
  });

  it('routes legal compliance tasks to legal division', async () => {
    const result = await sentinel.routeTaskToDivision('legal', 'Draft member agreement');
    expect(result.division).toBe('legal');
    expect(result.routed).toBe(true);
  });

  it('routes document tasks to legal division', async () => {
    const result = await sentinel.routeTaskToDivision('document', 'Create informed consent document');
    expect(result.division).toBe('legal');
    expect(result.routed).toBe(true);
  });

  it('routes content/campaign tasks to marketing division', async () => {
    const result = await sentinel.routeTaskToDivision('content', 'Write healing testimonial campaign');
    expect(result.division).toBe('marketing');
    expect(result.routed).toBe(true);
  });

  it('routes video tasks to marketing division', async () => {
    const result = await sentinel.routeTaskToDivision('video', 'Produce healing journey video');
    expect(result.division).toBe('marketing');
    expect(result.routed).toBe(true);
  });

  it('routes payment/billing tasks to financial division', async () => {
    const result = await sentinel.routeTaskToDivision('payment', 'Process member subscription billing');
    expect(result.division).toBe('financial');
    expect(result.routed).toBe(true);
  });

  it('routes integration/api tasks to engineering division', async () => {
    const result = await sentinel.routeTaskToDivision('integration', 'Build WooCommerce API connector');
    expect(result.division).toBe('engineering');
    expect(result.routed).toBe(true);
  });

  it('routes member support/onboarding tasks to support division', async () => {
    const result = await sentinel.routeTaskToDivision('onboarding', 'Help new member setup account');
    expect(result.division).toBe('support');
    expect(result.routed).toBe(true);
  });

  it('defaults to executive division for unrecognized task types', async () => {
    const result = await sentinel.routeTaskToDivision('unknown_task_xyz', 'Some unrecognized task');
    expect(result.division).toBe('executive');
    expect(result.routed).toBe(true);
  });

  it('respects suggestedDivision override when provided', async () => {
    const result = await sentinel.routeTaskToDivision('general', 'General task', 'engineering');
    expect(result.division).toBe('engineering');
    expect(result.routed).toBe(true);
  });

  it('returns a lead agent string from the correct division', async () => {
    const result = await sentinel.routeTaskToDivision('blood', 'Blood marker analysis');
    expect(result.division).toBe('science');
    const divInfo = AGENT_DIVISIONS[result.division];
    expect(divInfo.agents).toContain(result.lead);
  });
});

describe('SentinelService - Notifications', () => {
  let sentinel: SentinelService;

  beforeEach(() => {
    sentinel = new SentinelService();
  });

  it('broadcastSystemStatus creates a system_broadcast notification', async () => {
    const { db } = await import('../../artifacts/api-server/src/db');
    const result = await sentinel.broadcastSystemStatus('System maintenance in 5 minutes', 1);
    expect(db.insert).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('notifyTaskCompleted stores task completion notification', async () => {
    const { db } = await import('../../artifacts/api-server/src/db');
    await sentinel.notifyTaskCompleted(
      'HELIX', 'science', 'Blood Panel Analysis', 'https://drive.google.com/file/123', 'task-001'
    );
    expect(db.insert).toHaveBeenCalled();
  });

  it('notifyResearchUpdate stores research update notification', async () => {
    const { db } = await import('../../artifacts/api-server/src/db');
    await sentinel.notifyResearchUpdate(
      'PARACELSUS',
      'Peptide Research Update',
      'New BPC-157 healing data available'
    );
    expect(db.insert).toHaveBeenCalled();
  });
});

describe('SentinelService - Agent Listing', () => {
  let sentinel: SentinelService;

  beforeEach(() => {
    sentinel = new SentinelService();
  });

  it('getAllAgents returns array of agents across all divisions', () => {
    const agentList = sentinel.getAllAgents();
    expect(Array.isArray(agentList)).toBe(true);
    expect(agentList.length).toBeGreaterThan(0);
  });

  it('getAllAgents entries have required fields', () => {
    const agentList = sentinel.getAllAgents();
    for (const entry of agentList) {
      expect(typeof entry.agent).toBe('string');
      expect(entry.agent.length).toBeGreaterThan(0);
      expect(typeof entry.division).toBe('string');
      expect(typeof entry.isLead).toBe('boolean');
    }
  });

  it('each division has exactly one lead agent in getAllAgents', () => {
    const agentList = sentinel.getAllAgents();
    const leadsByDivision = new Map<string, string[]>();

    for (const entry of agentList) {
      if (entry.isLead) {
        const leads = leadsByDivision.get(entry.division) || [];
        leads.push(entry.agent);
        leadsByDivision.set(entry.division, leads);
      }
    }

    for (const [div, leads] of leadsByDivision.entries()) {
      expect(leads.length).toBe(1, `Division ${div} should have exactly 1 lead but has ${leads.length}`);
    }
  });

  it('getDivisionInfo returns correct info for science division', () => {
    const info = sentinel.getDivisionInfo('science');
    expect(info.name).toBe('Science');
    expect(typeof info.lead).toBe('string');
    expect(Array.isArray(info.agents)).toBe(true);
    expect(info.agents.length).toBeGreaterThan(0);
  });
});

describe('SentinelService - Cross Division Coordination', () => {
  let sentinel: SentinelService;

  beforeEach(() => {
    sentinel = new SentinelService();
  });

  it('coordinateCrossDivision returns a coordination ID string', async () => {
    const coordId = await sentinel.coordinateCrossDivision(
      'science', 'legal', 'task-001',
      'Need legal review of research protocol'
    );
    expect(typeof coordId).toBe('string');
    expect(coordId).toMatch(/^coord_/);
  });

  it('coordinateCrossDivision stores notification in database', async () => {
    const { db } = await import('../../artifacts/api-server/src/db');
    await sentinel.coordinateCrossDivision(
      'marketing', 'engineering', 'task-002',
      'Need API integration for campaign tracking'
    );
    expect(db.insert).toHaveBeenCalled();
  });
});
