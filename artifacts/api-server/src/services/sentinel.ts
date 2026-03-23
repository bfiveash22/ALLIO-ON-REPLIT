import { db } from '../db';
import { sentinelNotifications, InsertSentinelNotification, SentinelNotification, memberProfiles } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

import { agents } from '@shared/agents';
import { notificationService } from './notification-service';

// Define the core division metadata
const DIVISION_METADATA = {
  executive: {
    name: 'Executive',
    lead: 'ATHENA',
    specialty: 'Strategic oversight, priority management, Trustee communication'
  },
  marketing: {
    name: 'Marketing',
    lead: 'MUSE',
    specialty: 'Content creation, video production, campaigns, member engagement'
  },
  science: {
    name: 'Science',
    lead: 'HELIX',
    specialty: 'Blood analysis, protocol development, research, healing modalities'
  },
  legal: {
    name: 'Legal',
    lead: 'JURIS',
    specialty: 'Compliance, document management, PMA protection, privacy'
  },
  financial: {
    name: 'Financial',
    lead: 'ATLAS',
    specialty: 'Payments, crypto, member billing, financial reporting'
  },
  engineering: {
    name: 'Engineering',
    lead: 'FORGE',
    specialty: 'Platform development, integrations, automation, infrastructure'
  },
  support: {
    name: 'Support',
    lead: 'DR-TRIAGE',
    specialty: 'Member support, onboarding, community, doctor network'
  }
} satisfies Record<string, { name: string, lead: string, specialty: string }>;

export type Division = keyof typeof DIVISION_METADATA;

// Dynamically construct AGENT_DIVISIONS from the single source of truth in shared/agents.ts
export const AGENT_DIVISIONS = Object.entries(DIVISION_METADATA).reduce((acc, [key, meta]) => {
  // Find all actual agents assigned to this division in the shared array
  const divisionAgents = agents
    .filter(a => a.division === key)
    .map(a => a.id.toUpperCase());

  // Eliminate exact duplicates in the array (e.g. openclaw)
  const uniqueAgents = Array.from(new Set(divisionAgents));

  acc[key as Division] = {
    ...meta,
    // Safely assign a fallback lead agent if the intended one is missing from the list
    lead: uniqueAgents.includes(meta.lead) ? meta.lead : (uniqueAgents[0] || meta.lead),
    agents: uniqueAgents
  };
  return acc;
}, {} as Record<Division, { name: string, lead: string, agents: string[], specialty: string }>);

export class SentinelService {
  // Active coordination sessions
  private activeCoordinations: Map<string, {
    fromDivision: Division;
    toDivision: Division;
    taskId: string;
    status: 'pending' | 'in_progress' | 'completed';
    createdAt: Date;
  }> = new Map();

  // Broadcast system status to all divisions
  async broadcastSystemStatus(message: string, priority: 1 | 2 | 3 = 2): Promise<void> {
    console.log(`[SENTINEL] Broadcasting to all divisions: ${message}`);
    await this.notify({
      type: 'system_broadcast',
      title: 'System-Wide Broadcast',
      message,
      agentId: 'SENTINEL',
      division: 'executive',
      priority
    });
  }

  // Route a task to the appropriate division
  async routeTaskToDivision(
    taskType: string,
    taskDetails: string,
    suggestedDivision?: Division
  ): Promise<{ division: Division; lead: string; routed: boolean }> {
    const divisionMapping: Record<string, Division> = {
      'video': 'marketing',
      'content': 'marketing',
      'campaign': 'marketing',
      'blood': 'science',
      'analysis': 'science',
      'protocol': 'science',
      'rife': 'science',
      'legal': 'legal',
      'compliance': 'legal',
      'document': 'legal',
      'payment': 'financial',
      'crypto': 'financial',
      'billing': 'financial',
      'integration': 'engineering',
      'api': 'engineering',
      'platform': 'engineering',
      'support': 'support',
      'member': 'support',
      'onboarding': 'support'
    };

    // Find matching division
    let targetDivision: Division = suggestedDivision || 'executive';
    const taskLower = (taskType + ' ' + taskDetails).toLowerCase();

    for (const [keyword, division] of Object.entries(divisionMapping)) {
      if (taskLower.includes(keyword)) {
        targetDivision = division;
        break;
      }
    }

    const divisionInfo = AGENT_DIVISIONS[targetDivision];
    console.log(`[SENTINEL] Routing "${taskType}" to ${divisionInfo.name} (Lead: ${divisionInfo.lead})`);

    await this.notify({
      type: 'task_routed',
      title: `Task Routed: ${taskType}`,
      message: `Task "${taskDetails}" has been routed to ${divisionInfo.name} division. Lead agent ${divisionInfo.lead} will coordinate.`,
      agentId: divisionInfo.lead,
      division: targetDivision,
      priority: 2
    });

    return {
      division: targetDivision,
      lead: divisionInfo.lead,
      routed: true
    };
  }

  // Coordinate cross-division work
  async coordinateCrossDivision(
    fromDivision: Division,
    toDivision: Division,
    taskId: string,
    requirement: string
  ): Promise<string> {
    const coordId = `coord_${Date.now()}`;
    const fromInfo = AGENT_DIVISIONS[fromDivision];
    const toInfo = AGENT_DIVISIONS[toDivision];

    this.activeCoordinations.set(coordId, {
      fromDivision,
      toDivision,
      taskId,
      status: 'pending',
      createdAt: new Date()
    });

    console.log(`[SENTINEL] Cross-division coordination: ${fromInfo.name} → ${toInfo.name}`);
    console.log(`[SENTINEL] Requirement: ${requirement}`);

    await this.notify({
      type: 'cross_division_coordination',
      title: `${fromInfo.lead} → ${toInfo.lead}: Coordination Request`,
      message: `${fromInfo.name} division requires support from ${toInfo.name}: ${requirement}`,
      agentId: fromInfo.lead,
      division: fromDivision,
      taskId,
      priority: 2
    });

    return coordId;
  }

  // Get division status
  getDivisionInfo(division: Division) {
    return AGENT_DIVISIONS[division];
  }

  // List all agents across divisions
  getAllAgents(): Array<{ agent: string; division: Division; isLead: boolean }> {
    const agents: Array<{ agent: string; division: Division; isLead: boolean }> = [];

    for (const [division, info] of Object.entries(AGENT_DIVISIONS)) {
      for (const agent of info.agents) {
        agents.push({
          agent,
          division: division as Division,
          isLead: agent === info.lead
        });
      }
    }

    return agents;
  }
  async notify(notification: InsertSentinelNotification): Promise<SentinelNotification> {
    const [created] = await db.insert(sentinelNotifications).values(notification).returning();
    console.log(`[SENTINEL] ${notification.type}: ${notification.title}`);
    return created;
  }

  async notifyTaskCompleted(agentId: string, division: string, taskTitle: string, outputUrl: string, taskId: string): Promise<void> {
    await this.notify({
      type: 'task_completed',
      title: `${agentId} completed: ${taskTitle}`,
      message: `The ${agentId} agent in ${division} division has completed their task. Output is available in Google Drive.`,
      agentId,
      division,
      taskId,
      outputUrl,
      priority: 1,
    });
  }

  async notifyResearchUpdate(agentId: string, title: string, message: string, outputUrl?: string): Promise<void> {
    await this.notify({
      type: 'research_update',
      title,
      message,
      agentId,
      division: 'science',
      outputUrl,
      priority: 2,
    });
    try {
      const admins = await db.select({ userId: memberProfiles.userId }).from(memberProfiles).where(eq(memberProfiles.role, 'admin'));
      await Promise.all(admins.map((a: { userId: string }) => notificationService.createForUser(a.userId, 'research_update', title, message, outputUrl ? { url: outputUrl, agentId } : { agentId }).catch(() => {})));
    } catch {}
  }

  async notifyModuleUpdate(moduleName: string, updateType: string): Promise<void> {
    await this.notify({
      type: 'module_update',
      title: `Module Update: ${moduleName}`,
      message: `${updateType} has been applied to the ${moduleName} module.`,
      priority: 1,
    });
  }

  async notifyTrainingUpdate(trackName: string, description: string): Promise<void> {
    await this.notify({
      type: 'training_update',
      title: `Training Update: ${trackName}`,
      message: description,
      priority: 1,
    });
  }

  async notifyRifeUpdate(frequencySet: string, description: string): Promise<void> {
    await this.notify({
      type: 'rife_update',
      title: `Rife Frequency Update: ${frequencySet}`,
      message: description,
      division: 'science',
      priority: 2,
    });
  }

  async notifyBloodAnalysis(patientId: string, analysisResult: string, outputUrl?: string): Promise<void> {
    await this.notify({
      type: 'blood_analysis',
      title: `Blood Analysis Complete`,
      message: analysisResult,
      division: 'science',
      outputUrl,
      priority: 2,
    });
  }

  async notifyProductUpdate(productName: string, updateType: string): Promise<void> {
    await this.notify({
      type: 'product_update',
      title: `Product Update: ${productName}`,
      message: `${updateType} for ${productName}.`,
      priority: 1,
    });
  }

  async notifyCrossDivisionRequest(fromAgent: string, fromDivision: string, toAgent: string, toDivision: string, request: string): Promise<void> {
    await this.notify({
      type: 'cross_division_request',
      title: `${fromAgent} → ${toAgent}: Asset Request`,
      message: `${fromAgent} (${fromDivision}) has requested ${request} from ${toAgent} (${toDivision}).`,
      agentId: fromAgent,
      division: fromDivision,
      priority: 2,
    });
  }

  async getNotifications(limit: number = 50): Promise<SentinelNotification[]> {
    return db.select().from(sentinelNotifications)
      .orderBy(desc(sentinelNotifications.createdAt))
      .limit(limit);
  }

  async getUnreadNotifications(): Promise<SentinelNotification[]> {
    return db.select().from(sentinelNotifications)
      .where(eq(sentinelNotifications.isRead, false))
      .orderBy(desc(sentinelNotifications.createdAt));
  }

  async markAsRead(id: string): Promise<void> {
    await db.update(sentinelNotifications).set({ isRead: true }).where(eq(sentinelNotifications.id, id));
  }

  async markAllAsRead(): Promise<void> {
    await db.update(sentinelNotifications).set({ isRead: true }).where(eq(sentinelNotifications.isRead, false));
  }

  async getUnreadCount(): Promise<number> {
    const unread = await this.getUnreadNotifications();
    return unread.length;
  }
}

export const sentinel = new SentinelService();
