import { db } from '../db';
import { agentRegistry, agentTasks } from '@shared/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { agents } from '@shared/agents';
import { getAvailableProviders } from './ai-fallback';

export interface AgentHealthStatus {
  agentId: string;
  name: string;
  division: string;
  status: 'healthy' | 'degraded' | 'offline';
  isActive: boolean;
  lastActivityAt: string | null;
  pendingTasks: number;
  completedTasks: number;
  errorCount: number;
  aiProvider: string | null;
}

export interface SystemHealthReport {
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  totalAgents: number;
  activeAgents: number;
  healthyAgents: number;
  degradedAgents: number;
  offlineAgents: number;
  totalPendingTasks: number;
  totalCompletedTasks: number;
  totalFailedTasks: number;
  availableAIProviders: string[];
  agents: AgentHealthStatus[];
  divisions: Record<string, {
    name: string;
    agentCount: number;
    healthyCount: number;
    pendingTasks: number;
  }>;
}

export async function getAgentHealthReport(): Promise<SystemHealthReport> {
  let registeredAgents: any[] = [];
  try {
    registeredAgents = await db.select().from(agentRegistry).orderBy(agentRegistry.division, agentRegistry.name);
  } catch {
    registeredAgents = [];
  }

  let failedTaskCount = 0;
  try {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(agentTasks)
      .where(eq(agentTasks.status, 'failed'));
    failedTaskCount = Number(result[0]?.count || 0);
  } catch {
    failedTaskCount = 0;
  }

  const now = new Date();
  const staleThreshold = 24 * 60 * 60 * 1000;

  const agentStatuses: AgentHealthStatus[] = [];

  if (registeredAgents.length > 0) {
    for (const agent of registeredAgents) {
      const lastActivity = agent.lastActivityAt ? new Date(agent.lastActivityAt) : null;
      const isStale = lastActivity ? (now.getTime() - lastActivity.getTime() > staleThreshold) : true;

      let status: AgentHealthStatus['status'] = 'healthy';
      if (!agent.isActive) {
        status = 'offline';
      } else if (isStale && (agent.pendingTasks || 0) > 0) {
        status = 'degraded';
      }

      agentStatuses.push({
        agentId: agent.agentId,
        name: agent.name,
        division: agent.division,
        status,
        isActive: agent.isActive,
        lastActivityAt: agent.lastActivityAt?.toISOString() || null,
        pendingTasks: agent.pendingTasks || 0,
        completedTasks: agent.completedTasks || 0,
        errorCount: 0,
        aiProvider: agent.modelProvider || null,
      });
    }
  } else {
    for (const agent of agents) {
      agentStatuses.push({
        agentId: agent.id.toUpperCase(),
        name: agent.name,
        division: agent.division,
        status: 'healthy',
        isActive: true,
        lastActivityAt: null,
        pendingTasks: 0,
        completedTasks: 0,
        errorCount: 0,
        aiProvider: null,
      });
    }
  }

  const healthyCount = agentStatuses.filter(a => a.status === 'healthy').length;
  const degradedCount = agentStatuses.filter(a => a.status === 'degraded').length;
  const offlineCount = agentStatuses.filter(a => a.status === 'offline').length;
  const activeCount = agentStatuses.filter(a => a.isActive).length;
  const totalPending = agentStatuses.reduce((s, a) => s + a.pendingTasks, 0);
  const totalCompleted = agentStatuses.reduce((s, a) => s + a.completedTasks, 0);

  let overallStatus: SystemHealthReport['overallStatus'] = 'healthy';
  if (offlineCount > agentStatuses.length * 0.5) {
    overallStatus = 'critical';
  } else if (degradedCount > 0 || offlineCount > 0) {
    overallStatus = 'degraded';
  }

  const divisions: Record<string, any> = {};
  for (const agent of agentStatuses) {
    if (!divisions[agent.division]) {
      divisions[agent.division] = {
        name: agent.division.charAt(0).toUpperCase() + agent.division.slice(1),
        agentCount: 0,
        healthyCount: 0,
        pendingTasks: 0,
      };
    }
    divisions[agent.division].agentCount++;
    if (agent.status === 'healthy') divisions[agent.division].healthyCount++;
    divisions[agent.division].pendingTasks += agent.pendingTasks;
  }

  let availableProviders: string[] = [];
  try {
    availableProviders = getAvailableProviders();
  } catch {
    availableProviders = [];
  }

  return {
    timestamp: now.toISOString(),
    overallStatus,
    totalAgents: agentStatuses.length,
    activeAgents: activeCount,
    healthyAgents: healthyCount,
    degradedAgents: degradedCount,
    offlineAgents: offlineCount,
    totalPendingTasks: totalPending,
    totalCompletedTasks: totalCompleted,
    totalFailedTasks: failedTaskCount,
    availableAIProviders: availableProviders,
    agents: agentStatuses,
    divisions,
  };
}
