import { executeAgentTask, getAgentTaskStatus } from './agent-executor';
import { storage } from '../storage';
import { log } from '../index';
import { sentinel, AGENT_DIVISIONS, Division } from './sentinel';
import { marketingOrchestrator } from './marketing-orchestrator';
import { autoImplementer } from './auto-implementer';
import { lockManager } from './agent-locks';
import { dispatchWebhook } from './webhook-dispatcher';

const BASE_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes baseline
const HIGH_ACTIVITY_CHECK_INTERVAL_MIN = 5 * 60 * 1000; // 5 minutes when 10+ agents
const HIGH_ACTIVITY_CHECK_INTERVAL_MAX = 7 * 60 * 1000; // 7 minutes when 10+ agents
const CROSS_DIVISION_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes for cross-division routing
const MAX_CONCURRENT_TASKS = 4; // Increased for more parallel execution
const HIGH_ACTIVITY_THRESHOLD = 10; // Number of active tasks before switching to high-activity mode

let schedulerRunning = false;
let schedulerInterval: NodeJS.Timeout | null = null;
let crossDivisionInterval: NodeJS.Timeout | null = null;
let marketingInterval: NodeJS.Timeout | null = null;
let uiReviewInterval: NodeJS.Timeout | null = null;
let ecosystemInterval: NodeJS.Timeout | null = null;
let autoImplementInterval: NodeJS.Timeout | null = null;
let wpFullSyncInterval: NodeJS.Timeout | null = null;
const MARKETING_CHECK_INTERVAL = 60 * 60 * 1000; // Run every hour
const UI_REVIEW_INTERVAL = 24 * 60 * 60 * 1000; // Run every 24 hours
const ECOSYSTEM_ENHANCEMENT_INTERVAL = 24 * 60 * 60 * 1000; // Run every 24 hours
const AUTO_IMPLEMENT_INTERVAL = 15 * 60 * 1000; // Run every 15 mins
const WP_FULL_SYNC_INTERVAL = parseInt(process.env.WP_FULL_SYNC_INTERVAL_MS || '', 10) || (6 * 60 * 60 * 1000); // Default: 6 hours
let activeExecutions = 0;
let lastCrossDivisionCheck = new Date();

interface SchedulerStatus {
  running: boolean;
  activeExecutions: number;
  lastCheck: Date | null;
  lastCrossDivisionCheck: Date | null;
  tasksProcessed: number;
  tasksFailed: number;
  checkIntervalMs: number;
  mode: 'baseline' | 'high-activity';
}

let status: SchedulerStatus = {
  running: false,
  activeExecutions: 0,
  lastCheck: null,
  lastCrossDivisionCheck: null,
  tasksProcessed: 0,
  tasksFailed: 0,
  checkIntervalMs: BASE_CHECK_INTERVAL,
  mode: 'baseline',
};


// Queue for immediate task resumption when cross-division support completes
interface ImmediateResumeItem {
  taskId: string;
  agentId: string;
  assetUrl?: string;
  supportingAgent: string;
  timestamp: number;
}

const immediateResumeQueue: ImmediateResumeItem[] = [];
let processingImmediateResume = false;
// Track tasks currently locked for immediate resume to prevent double-dispatch
const lockedForImmediateResume = new Set<string>();

async function processImmediateResumeQueue(): Promise<void> {
  if (processingImmediateResume || immediateResumeQueue.length === 0) {
    return;
  }

  processingImmediateResume = true;

  try {
    while (immediateResumeQueue.length > 0) {
      const item = immediateResumeQueue.shift();
      if (!item) continue;

      // Check if we have capacity for another execution
      if (activeExecutions >= MAX_CONCURRENT_TASKS) {
        log(`[SENTINEL] Immediate resume delayed - at max concurrent tasks (${activeExecutions}/${MAX_CONCURRENT_TASKS})`, 'agent-scheduler');
        // Put it back at the front
        immediateResumeQueue.unshift(item);
        // Schedule deferred retry to avoid queue starvation
        setTimeout(() => {
          processImmediateResumeQueue().catch(err => {
            log(`[SENTINEL] Deferred resume error: ${err.message}`, 'agent-scheduler');
          });
        }, 30000); // Retry in 30 seconds
        break;
      }

      // Get current task state
      const allTasks = await storage.getAllAgentTasks();
      const task = allTasks.find(t => t.id === item.taskId);

      if (!task) {
        log(`[SENTINEL] Immediate resume: Task ${item.taskId} not found`, 'agent-scheduler');
        lockedForImmediateResume.delete(item.taskId);
        continue;
      }

      if (task.status === 'completed' || (task.status as string) === 'cancelled') {
        log(`[SENTINEL] Immediate resume: Task ${item.taskId} already ${task.status}`, 'agent-scheduler');
        lockedForImmediateResume.delete(item.taskId);
        continue;
      }

      const agentLockId = `agent-${item.agentId.toLowerCase()}`;
      if (!lockManager.acquireLocks([agentLockId], `resume-${item.taskId}`, 10 * 60 * 1000)) {
        log(`[SENTINEL] Immediate resume delayed - agent ${item.agentId} is currently locked`, 'agent-scheduler');
        immediateResumeQueue.unshift(item);
        setTimeout(() => {
          processImmediateResumeQueue().catch(err => {
            log(`[SENTINEL] Deferred resume error: ${err.message}`, 'agent-scheduler');
          });
        }, 10000);
        break;
      }

      log(`[SENTINEL] IMMEDIATE RESUME: Executing ${item.agentId.toUpperCase()}'s task with asset from ${item.supportingAgent}`, 'agent-scheduler');

      // Execute the task immediately
      activeExecutions++;
      status.activeExecutions = activeExecutions;

      try {
        const result = await executeAgentTask(task.id);
        status.tasksProcessed++;

        if ((result as any).status === 'completed') {
          log(`[SENTINEL] Immediate resume SUCCESS: ${item.agentId.toUpperCase()} completed task after receiving asset`, 'agent-scheduler');
          await handleTaskCompletion(task, result);
        }
      } catch (error: any) {
        log(`[SENTINEL] Immediate resume error: ${error.message}`, 'agent-scheduler');
        status.tasksFailed++;
      } finally {
        lockManager.releaseLocks([agentLockId], `resume-${item.taskId}`);
        activeExecutions--;
        status.activeExecutions = activeExecutions;
        lockedForImmediateResume.delete(item.taskId);
      }
    }
  } finally {
    processingImmediateResume = false;
  }
}


function getRandomHighActivityInterval(): number {
  return Math.floor(Math.random() * (HIGH_ACTIVITY_CHECK_INTERVAL_MAX - HIGH_ACTIVITY_CHECK_INTERVAL_MIN + 1)) + HIGH_ACTIVITY_CHECK_INTERVAL_MIN;
}

async function determineCheckInterval(): Promise<number> {
  const allTasks = await storage.getAllAgentTasks();
  const activeTasks = allTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');

  if (activeTasks.length >= HIGH_ACTIVITY_THRESHOLD) {
    status.mode = 'high-activity';
    const interval = getRandomHighActivityInterval();
    log(`[SENTINEL] High activity mode: ${activeTasks.length} active tasks. Check interval: ${Math.round(interval / 60000)} minutes`, 'agent-scheduler');
    return interval;
  } else {
    status.mode = 'baseline';
    log(`[SENTINEL] Baseline mode: ${activeTasks.length} active tasks. Check interval: 10 minutes`, 'agent-scheduler');
    return BASE_CHECK_INTERVAL;
  }
}

async function checkAndExecuteTasks(): Promise<void> {
  if (activeExecutions >= MAX_CONCURRENT_TASKS) {
    log(`[Scheduler] At max capacity (${activeExecutions}/${MAX_CONCURRENT_TASKS}). Waiting...`, 'agent-scheduler');
    return;
  }

  status.lastCheck = new Date();

  try {
    const allTasks = await storage.getAllAgentTasks();

    // Handle stuck tasks - reset in_progress tasks older than 2 hours
    // EXCLUDE: video/audio production tasks which may legitimately take longer
    const STUCK_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours
    const LONG_RUNNING_KEYWORDS = ['video', 'audio', 'render', 'presentation', 'compilation', 'export', 'urgent'];
    const now = Date.now();
    const stuckTasks = allTasks.filter(t => {
      if (t.status !== 'in_progress') return false;
      const updatedAt = t.updatedAt ? new Date(t.updatedAt).getTime() : 0;
      if ((now - updatedAt) <= STUCK_THRESHOLD_MS) return false;
      if ((t.progress || 0) >= 100) return false;

      // Exclude legitimately long-running tasks
      const titleLower = (t.title || '').toLowerCase();
      const isLongRunning = LONG_RUNNING_KEYWORDS.some(kw => titleLower.includes(kw));
      if (isLongRunning && (t.progress || 0) > 0) {
        // Only exclude if they've made some progress (not completely stuck at 0)
        return false;
      }

      return true;
    });

    for (const stuckTask of stuckTasks) {
      log(`[SENTINEL] Resetting stuck task: ${stuckTask.agentId} - "${stuckTask.title}" (stuck for 2+ hours with 0 progress)`, 'agent-scheduler');
      await storage.updateAgentTask(stuckTask.id, {
        status: 'pending',
        progress: 0,
        description: (stuckTask.description || '') + `\n\n[SENTINEL AUTO-RESET: Task was stuck in_progress for over 2 hours at ${new Date().toISOString()}]`
      });
    }

    if (stuckTasks.length > 0) {
      log(`[SENTINEL] Reset ${stuckTasks.length} stuck tasks`, 'agent-scheduler');
    }

    const eligibleTasks = allTasks.filter(t => {
      // Skip tasks locked for immediate resume (prevents double-dispatch)
      if (lockedForImmediateResume.has(t.id)) return false;
      return t.status === 'pending' ||
        (t.status === 'in_progress' && (t.progress || 0) < 100);
    });

    if (eligibleTasks.length === 0) {
      log('[Scheduler] No pending tasks. SENTINEL standing by.', 'agent-scheduler');
      return;
    }

    log(`[SENTINEL] Found ${eligibleTasks.length} eligible tasks. Active executions: ${activeExecutions}/${MAX_CONCURRENT_TASKS}`, 'agent-scheduler');

    const sortedTasks = eligibleTasks.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      const aPriority = a.priority !== undefined && a.priority !== null ? a.priority : 2;
      const bPriority = b.priority !== undefined && b.priority !== null ? b.priority : 2;
      const priorityDiff = aPriority - bPriority;
      if (priorityDiff !== 0) return priorityDiff;
      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aCreated - bCreated;
    });

    const tasksToExecute = sortedTasks.slice(0, MAX_CONCURRENT_TASKS - activeExecutions);

    for (const task of tasksToExecute) {
      const agentLockId = `agent-${task.agentId.toLowerCase()}`;
      if (!lockManager.acquireLocks([agentLockId], `scheduler-${task.id}`, 10 * 60 * 1000)) {
        log(`[SENTINEL] Deferring task ${task.id} - ${task.agentId} is locked by another process`, 'agent-scheduler');
        continue;
      }

      activeExecutions++;
      status.activeExecutions = activeExecutions;

      log(`[SENTINEL] Dispatching: ${task.agentId.toUpperCase()} â†’ "${task.title}"`, 'agent-scheduler');

      executeAgentTask(task.id)
        .then(async result => {
          if (result.success) {
            status.tasksProcessed++;
            log(`[SENTINEL] âœ“ Task completed: ${task.title}`, 'agent-scheduler');

            await handleTaskCompletion(task, result);
          } else {
            status.tasksFailed++;
            log(`[SENTINEL] âœ— Task failed: ${task.title} - ${result.error}`, 'agent-scheduler');
          }
        })
        .catch(error => {
          status.tasksFailed++;
          log(`[SENTINEL] âœ— Task error: ${task.title} - ${error.message}`, 'agent-scheduler');
        })
        .finally(() => {
          lockManager.releaseLocks([agentLockId], `scheduler-${task.id}`);
          activeExecutions--;
          status.activeExecutions = activeExecutions;
        });
    }
  } catch (error: any) {
    log(`[Scheduler] Error checking tasks: ${error.message}`, 'agent-scheduler');
  }
}

async function handleTaskCompletion(task: any, result: any): Promise<void> {
  if (task.description?.toLowerCase().includes('cross-division support for')) {
    await handleCrossDivisionSupportCompletion(task, result);
  }

  await checkProductionPipeline(task, result);

  try {
    await dispatchWebhook('task.completed', {
      taskId: task.id,
      title: task.title,
      agentId: task.agentId,
      division: task.division,
      outputUrl: result?.outputUrl || null,
      completedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    log(`[SENTINEL] Failed to dispatch task.completed webhook: ${err.message}`, 'agent-scheduler');
  }
}

async function handleCrossDivisionSupportCompletion(task: any, result: any): Promise<void> {
  const requestingAgent = task.crossDivisionFrom || task.description?.match(/cross-division support for (\w+)/i)?.[1];
  if (!requestingAgent) return;

  const receivingAgent = requestingAgent.toLowerCase();
  log(`[SENTINEL] Cross-division support complete: ${task.agentId.toUpperCase()} â†’ ${receivingAgent.toUpperCase()}`, 'agent-scheduler');

  let receiverTask = null;

  if (task.parentTaskId) {
    const allTasks = await storage.getAllAgentTasks();
    receiverTask = allTasks.find(t => t.id === task.parentTaskId);
  }

  if (!receiverTask) {
    const allTasks = await storage.getAllAgentTasks();
    receiverTask = allTasks.find(t =>
      t.agentId.toLowerCase() === receivingAgent &&
      t.status === 'in_progress'
    );
  }

  if (receiverTask) {
    const assetNote = `\n\n[CROSS-DIVISION ASSET RECEIVED from ${task.agentId.toUpperCase()}: ${result.outputUrl || 'Asset ready in Drive'}]`;
    const updatedDescription = (receiverTask.description || '') + assetNote;

    await storage.updateAgentTask(receiverTask.id, {
      description: updatedDescription,
      progress: Math.min((receiverTask.progress || 0) + 15, 90)
    });

    log(`[SENTINEL] Asset delivered to ${receivingAgent.toUpperCase()}'s task: "${receiverTask.title}"`, 'agent-scheduler');

    await sentinel.notify({
      type: 'cross_division_coordination',
      title: `Cross-Division Asset Ready`,
      message: `${task.agentId.toUpperCase()} completed support for ${receivingAgent.toUpperCase()}: ${task.title}`,
      agentId: receivingAgent,
      division: receiverTask.division as Division,
      taskId: receiverTask.id,
      priority: 2,
    });

    // IMMEDIATE RESUMPTION: Resume the original task immediately instead of waiting for next scheduler cycle
    // Only enqueue if task is in_progress (not pending - those are handled by normal scheduler)
    if (receiverTask.status === 'in_progress') {
      log(`[SENTINEL] IMMEDIATE RESUMPTION: Triggering ${receivingAgent.toUpperCase()}'s task to continue with new asset`, 'agent-scheduler');

      // Lock the task to prevent scheduler from picking it up
      lockedForImmediateResume.add(receiverTask.id);

      // Add to execution queue with high priority
      immediateResumeQueue.push({
        taskId: receiverTask.id,
        agentId: receiverTask.agentId,
        assetUrl: result.outputUrl,
        supportingAgent: task.agentId.toUpperCase(),
        timestamp: Date.now()
      });

      // Trigger immediate execution (don't await - let it run async)
      processImmediateResumeQueue().catch(err => {
        log(`[SENTINEL] Error in immediate resume: ${err.message}`, 'agent-scheduler');
        lockedForImmediateResume.delete(receiverTask.id);
      });
    } else {
      log(`[SENTINEL] Cross-division complete: ${receivingAgent.toUpperCase()}'s task is ${receiverTask.status}, scheduler will pick it up`, 'agent-scheduler');
    }
  } else {
    log(`[SENTINEL] Warning: Could not find parent task for cross-division support from ${task.agentId}`, 'agent-scheduler');
  }
}

async function checkProductionPipeline(task: any, result: any): Promise<void> {
  const isMarketingOutput = task.division === 'marketing' ||
    ['PIXEL', 'PRISM', 'MUSE', 'AURORA', 'HERALD', 'SPARK', 'CANVAS', 'ECHO'].includes(task.agentId.toUpperCase());

  if (!isMarketingOutput) return;

  const taskTitle = task.title?.toLowerCase() || '';
  const isCreativeOutput = taskTitle.includes('video') ||
    taskTitle.includes('promo') ||
    taskTitle.includes('logo') ||
    taskTitle.includes('campaign') ||
    taskTitle.includes('audio') ||
    taskTitle.includes('launch');

  if (!isCreativeOutput) return;

  const needsForgeReview = !task.description?.includes('[FORGE_APPROVED]');
  const needsMuseReview = !task.description?.includes('[MUSE_APPROVED]');

  if (needsForgeReview && task.agentId.toUpperCase() !== 'FORGE') {
    log(`[SENTINEL] Production Pipeline: Routing to FORGE for technical review`, 'agent-scheduler');
    await createProductionPipelineTask(task, result, 'FORGE', 'Technical Review');
  } else if (needsMuseReview && task.agentId.toUpperCase() !== 'MUSE' && task.description?.includes('[FORGE_APPROVED]')) {
    log(`[SENTINEL] Production Pipeline: Routing to MUSE for final polish`, 'agent-scheduler');
    await createProductionPipelineTask(task, result, 'MUSE', 'Final Polish');
  } else if (task.description?.includes('[FORGE_APPROVED]') && task.description?.includes('[MUSE_APPROVED]')) {
    log(`[SENTINEL] Production Pipeline: âœ“ Output approved by FORGE and MUSE - ready for final folder`, 'agent-scheduler');
  }
}

async function createProductionPipelineTask(originalTask: any, result: any, reviewerAgent: string, reviewType: string): Promise<void> {
  const reviewTask = {
    agentId: reviewerAgent,
    division: (reviewerAgent === 'FORGE' ? 'engineering' : 'marketing') as 'executive' | 'marketing' | 'financial' | 'legal' | 'engineering' | 'science' | 'support',
    title: `${reviewType}: ${originalTask.title}`,
    description: `PRODUCTION PIPELINE REVIEW

Original Agent: ${originalTask.agentId.toUpperCase()}
Original Task: ${originalTask.title}
Output URL: ${result.outputUrl}

${reviewerAgent === 'FORGE' ? `
FORGE REVIEW CHECKLIST:
- [ ] Technical quality verified
- [ ] Audio follows FORGE Audio Design (528Hz base, 396Hz/639Hz layers)
- [ ] Voice tone is deep and grounding (NOT soft/feminine)
- [ ] Brand colors correct (deep blue/cyan/gold - NO pink)
- [ ] No spelling errors
- [ ] Ready for MUSE final polish

After approval, add [FORGE_APPROVED] to the task description.
` : `
MUSE REVIEW CHECKLIST:
- [ ] Brand alignment verified
- [ ] Messaging matches FFPMA mission
- [ ] Visual polish complete
- [ ] Copy is compelling and error-free
- [ ] Ready for final folder

After approval, add [MUSE_APPROVED] to the task description.
Move to agent's final/ folder when approved.
`}

Cross-division production pipeline review for ${originalTask.agentId.toUpperCase()}`,
    priority: 5,
  };

  try {
    const created = await storage.createAgentTask(reviewTask);
    log(`[SENTINEL] Created ${reviewerAgent} review task: ${created.id}`, 'agent-scheduler');

    await sentinel.notify({
      type: 'cross_division_coordination',
      title: `Production Pipeline: ${reviewerAgent} Review Required`,
      message: `${originalTask.agentId.toUpperCase()}'s output "${originalTask.title}" requires ${reviewerAgent} review before going to final folder.`,
      agentId: reviewerAgent,
      division: reviewerAgent === 'FORGE' ? 'engineering' : 'marketing',
      priority: 3,
    });
  } catch (error: any) {
    log(`[SENTINEL] Error creating pipeline task: ${error.message}`, 'agent-scheduler');
  }
}

async function checkCrossDivisionRequests(): Promise<void> {
  status.lastCrossDivisionCheck = new Date();
  lastCrossDivisionCheck = new Date();

  log('[SENTINEL] Running cross-division request check...', 'agent-scheduler');

  try {
    const allTasks = await storage.getAllAgentTasks();
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress');

    for (const task of inProgressTasks) {
      const description = (task.description || '').toLowerCase();

      // Prevent infinite loop: do not trigger support from a support task
      if (description.includes('cross-division support request')) {
        continue;
      }

      const crossDivisionNeeds = detectCrossDivisionNeeds(description, task.agentId);

      for (const need of crossDivisionNeeds) {
        const existingSupport = allTasks.find(t =>
          t.agentId.toLowerCase() === need.targetAgent.toLowerCase() &&
          t.description?.includes(`cross-division support for ${task.agentId}`) &&
          (t.status === 'pending' || t.status === 'in_progress')
        );

        if (!existingSupport) {
          log(`[SENTINEL] Creating cross-division support: ${need.targetAgent} â†’ ${task.agentId}`, 'agent-scheduler');
          await createCrossDivisionSupportTask(task, need);
        }
      }
    }

    log('[SENTINEL] Cross-division check complete.', 'agent-scheduler');
  } catch (error: any) {
    log(`[SENTINEL] Cross-division check error: ${error.message}`, 'agent-scheduler');
  }
}

interface CrossDivisionNeed {
  targetAgent: string;
  targetDivision: Division;
  requirement: string;
  priority: number;
}

function detectCrossDivisionNeeds(description: string, sourceAgent: string): CrossDivisionNeed[] {
  const needs: CrossDivisionNeed[] = [];
  const sourceAgentUpper = sourceAgent.toUpperCase();

  if (description.includes('need') || description.includes('require') || description.includes('waiting for')) {
    if ((description.includes('logo') || description.includes('design') || description.includes('visual')) && sourceAgentUpper !== 'PIXEL') {
      needs.push({
        targetAgent: 'PIXEL',
        targetDivision: 'marketing',
        requirement: 'Visual/design assets needed',
        priority: 4
      });
    }

    if ((description.includes('video') || description.includes('footage') || description.includes('animation')) && sourceAgentUpper !== 'PRISM') {
      needs.push({
        targetAgent: 'PRISM',
        targetDivision: 'marketing',
        requirement: 'Video production support needed',
        priority: 4
      });
    }

    if ((description.includes('audio') || description.includes('music') || description.includes('sound') || description.includes('frequency')) && sourceAgentUpper !== 'FORGE') {
      needs.push({
        targetAgent: 'FORGE',
        targetDivision: 'engineering',
        requirement: 'Audio/frequency design needed (FORGE Audio Design standards)',
        priority: 5
      });
    }

    if ((description.includes('legal') || description.includes('compliance') || description.includes('pma')) && sourceAgentUpper !== 'JURIS') {
      needs.push({
        targetAgent: 'JURIS',
        targetDivision: 'legal',
        requirement: 'Legal review/compliance check needed',
        priority: 5
      });
    }

    if ((description.includes('protocol') || description.includes('healing') || description.includes('science')) && sourceAgentUpper !== 'HELIX' && sourceAgentUpper !== 'PROMETHEUS') {
      needs.push({
        targetAgent: 'HELIX',
        targetDivision: 'science',
        requirement: 'Scientific/protocol validation needed',
        priority: 4
      });
    }

    if ((description.includes('copy') || description.includes('marketing') || description.includes('messaging')) && sourceAgentUpper !== 'MUSE') {
      needs.push({
        targetAgent: 'MUSE',
        targetDivision: 'marketing',
        requirement: 'Marketing copy/messaging support needed',
        priority: 4
      });
    }
  }

  return needs;
}

async function createCrossDivisionSupportTask(sourceTask: any, need: CrossDivisionNeed): Promise<void> {
  const supportTask = {
    agentId: need.targetAgent,
    division: need.targetDivision,
    title: `Cross-Division Support: ${need.requirement}`,
    description: `CROSS-DIVISION SUPPORT REQUEST

Requesting Agent: ${sourceTask.agentId.toUpperCase()}
Requesting Division: ${sourceTask.division}
Original Task: ${sourceTask.title}

Requirement: ${need.requirement}

Please provide the requested support and upload to your output folder.
The requesting agent's task will be updated with the asset link upon completion.

This is cross-division support for ${sourceTask.agentId.toUpperCase()}`,
    priority: need.priority,
    crossDivisionFrom: sourceTask.agentId.toUpperCase(),
    crossDivisionTo: need.targetAgent.toUpperCase(),
    parentTaskId: sourceTask.id,
  };

  try {
    const created = await storage.createAgentTask(supportTask);
    log(`[SENTINEL] Created support task: ${need.targetAgent} â†’ ${sourceTask.agentId}`, 'agent-scheduler');

    await sentinel.coordinateCrossDivision(
      sourceTask.division as 'executive' | 'marketing' | 'financial' | 'legal' | 'engineering' | 'science' | 'support',
      need.targetDivision,
      created.id,
      need.requirement
    );
  } catch (error: any) {
    log(`[SENTINEL] Error creating support task: ${error.message}`, 'agent-scheduler');
  }
}

export async function startAgentScheduler(): Promise<void> {
  if (schedulerRunning) {
    log('[Scheduler] Already running', 'agent-scheduler');
    return;
  }

  schedulerRunning = true;
  status.running = true;

  const initialInterval = await determineCheckInterval();
  status.checkIntervalMs = initialInterval;

  log('[SENTINEL] â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•', 'agent-scheduler');
  log('[SENTINEL] Agent Network Scheduler Starting...', 'agent-scheduler');
  log(`[SENTINEL] Dynamic Monitoring Mode: ${status.mode}`, 'agent-scheduler');
  log(`[SENTINEL] Task Check Interval: ${Math.round(initialInterval / 60000)} minutes`, 'agent-scheduler');
  log(`[SENTINEL] Cross-Division Check: Every 10 minutes`, 'agent-scheduler');
  log(`[SENTINEL] Max Concurrent Tasks: ${MAX_CONCURRENT_TASKS}`, 'agent-scheduler');
  log(`[SENTINEL] High Activity Threshold: ${HIGH_ACTIVITY_THRESHOLD}+ tasks â†’ 5-7 min checks`, 'agent-scheduler');
  log('[SENTINEL] â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•', 'agent-scheduler');

  checkAndExecuteTasks().catch(err => log(`[SENTINEL] Initial task check error: ${err.message}`, 'agent-scheduler'));
  checkCrossDivisionRequests().catch(err => log(`[SENTINEL] Initial cross-division check error: ${err.message}`, 'agent-scheduler'));

  schedulerInterval = setInterval(async () => {
    try {
      await checkAndExecuteTasks();

      const newInterval = await determineCheckInterval();
      if (newInterval !== status.checkIntervalMs) {
        status.checkIntervalMs = newInterval;
        log(`[SENTINEL] Interval adjusted to ${Math.round(newInterval / 60000)} minutes`, 'agent-scheduler');

        if (schedulerInterval) {
          clearInterval(schedulerInterval);
          schedulerInterval = setInterval(async () => {
            try {
              await checkAndExecuteTasks();
              const interval = await determineCheckInterval();
              status.checkIntervalMs = interval;
            } catch (err: any) {
              log(`[SENTINEL] Scheduler error: ${err.message}`, 'agent-scheduler');
            }
          }, newInterval);
        }
      }
    } catch (err: any) {
      log(`[SENTINEL] Scheduler error: ${err.message}`, 'agent-scheduler');
    }
  }, initialInterval);

  crossDivisionInterval = setInterval(async () => {
    try {
      await checkCrossDivisionRequests();
    } catch (err: any) {
      log(`[SENTINEL] Cross-division check error: ${err.message}`, 'agent-scheduler');
    }
  }, CROSS_DIVISION_CHECK_INTERVAL);

  // UI Evolution Review Loop
  uiReviewInterval = setInterval(async () => {
    try {
      await scheduleDailyUIReview();
    } catch (err: any) {
      log(`[UI-REVIEW] Scheduled review error: ${err.message}`, 'agent-scheduler');
    }
  }, UI_REVIEW_INTERVAL);

  // Marketing Enhancement Loop - DISABLED PER USER
  marketingInterval = setInterval(async () => {
    try {
      // await marketingOrchestrator.runDailyProductEnhancement(3);
    } catch (err: any) {
      log(`[MARKETING] Enhancement check error: ${err.message}`, 'agent-scheduler');
    }
  }, MARKETING_CHECK_INTERVAL);

  // Ecosystem Auto-Enhancement Loop - DISABLED PER USER
  ecosystemInterval = setInterval(async () => {
    try {
      // await scheduleDailyEcosystemEnhancement();
    } catch (err: any) {
      log(`[ECOSYSTEM] Scheduled enhancement error: ${err.message}`, 'agent-scheduler');
    }
  }, ECOSYSTEM_ENHANCEMENT_INTERVAL);

  // Auto-Implementation Backlog Loop - Re-enabled with OAuth check
  const oauthCheck = autoImplementer.checkGoogleOAuthSecrets();
  if (!oauthCheck.valid) {
    log(`[AUTO-IMPLEMENTER] Pipeline DISABLED - missing Google OAuth secrets: ${oauthCheck.missing.join(", ")}`, "agent-scheduler");
    try {
      const { sendToTrustee: notifyTrustee } = await import("./openclaw");
      await notifyTrustee("SENTINEL", `Auto-Implementer pipeline cannot start. Missing Google OAuth secrets: ${oauthCheck.missing.join(", ")}. Please configure these environment variables.`, "urgent");
    } catch (e) {}
  } else {
    log("[AUTO-IMPLEMENTER] Google OAuth secrets verified. Pipeline enabled.", "agent-scheduler");
  }

  autoImplementInterval = setInterval(async () => {
    try {
      if (oauthCheck.valid) {
        await autoImplementer.runRetroactiveProcessing();
      }
    } catch (err: any) {
      log(`[AUTO-IMPLEMENTER] Scheduled processing error: ${err.message}`, "agent-scheduler");
    }
  }, AUTO_IMPLEMENT_INTERVAL);

  // Medical Auto-Enhancement Loop
  setInterval(async () => {
    try {
      await scheduleWeeklyMedicalEnhancement();
    } catch (err: any) {
      log(`[MEDICAL] Scheduled enhancement error: ${err.message}`, 'agent-scheduler');
    }
  }, 7 * 24 * 60 * 60 * 1000); // Weekly

  // Kick off first run
  setTimeout(() => {
    // marketingOrchestrator.runDailyProductEnhancement(1).catch(e => console.error(e));
  }, 30000); // 30 seconds after boot

  // Kick off first UI review (KEPT)
  setTimeout(() => {
    scheduleDailyUIReview().catch(e => console.error(e));
  }, 40000); // 40 seconds after boot

  // Kick off first Ecosystem Enhancement (DISABLED)
  setTimeout(() => {
    // scheduleDailyEcosystemEnhancement().catch(e => console.error(e));
  }, 50000); // 50 seconds after boot

  // Kick off first Medical Enhancement (KEPT - but trimmed internally)
  setTimeout(() => {
    scheduleWeeklyMedicalEnhancement().catch(e => console.error(e));
  }, 60000); // 60 seconds after boot

  // Kick off first Auto-Implementation Retroactive Backlog process
  setTimeout(() => {
    if (oauthCheck.valid) {
      autoImplementer.runRetroactiveProcessing().catch(e => console.error(e));
    }
  }, 70000); // 70 seconds after boot

  // WordPress Full Sync: products, categories, library — configurable interval (default: 6 hours)
  wpFullSyncInterval = setInterval(async () => {
    try {
      log('[WP-SYNC] Running scheduled full WordPress sync (products, categories, library)...', 'agent-scheduler');
      const { syncFromWordPress } = await import('./wordpress-sync');
      const result = await syncFromWordPress();
      log(`[WP-SYNC] Full WordPress sync complete: categories=${result.categories}, products=${result.products}, libraryItems=${result.libraryItems}`, 'agent-scheduler');
    } catch (err: any) {
      log(`[WP-SYNC] Scheduled full sync error: ${err.message}`, 'agent-scheduler');
    }
  }, WP_FULL_SYNC_INTERVAL);

  // Kick off first full WordPress sync shortly after startup
  setTimeout(async () => {
    try {
      log('[WP-SYNC] Running initial full WordPress sync on startup (products, categories, library)...', 'agent-scheduler');
      const { syncFromWordPress } = await import('./wordpress-sync');
      const result = await syncFromWordPress();
      log(`[WP-SYNC] Initial full WordPress sync complete: categories=${result.categories}, products=${result.products}, libraryItems=${result.libraryItems}`, 'agent-scheduler');
    } catch (err: any) {
      log(`[WP-SYNC] Initial full sync error: ${err.message}`, 'agent-scheduler');
    }
  }, 30000); // 30 seconds after boot

  // Log WordPress/WooCommerce sync schedule for operator visibility
  const wpUrl = process.env.WORDPRESS_URL || process.env.WP_URL || '(not configured)';
  const wpSecretConfigured = !!(process.env.WP_WEBHOOK_SECRET);
  const wpCredConfigured = !!(process.env.WP_PASSWORD || process.env.WP_APPLICATION_PASSWORD);
  log('[WP-SYNC] ═══════════════════════════════════════════════════════', 'agent-scheduler');
  log(`[WP-SYNC] WordPress/WooCommerce Configuration Status`, 'agent-scheduler');
  log(`[WP-SYNC]   Site URL        : ${wpUrl}`, 'agent-scheduler');
  log(`[WP-SYNC]   API Credentials : ${wpCredConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}`, 'agent-scheduler');
  log(`[WP-SYNC]   Webhook Secret  : ${wpSecretConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}`, 'agent-scheduler');
  log('[WP-SYNC]   Sync Schedule   : Clinic sync - every 1 hour (immediate on startup)', 'agent-scheduler');
  log(`[WP-SYNC]   Sync Schedule   : Full sync (products/categories/library) - every ${Math.round(WP_FULL_SYNC_INTERVAL / 3600000)}h (env: WP_FULL_SYNC_INTERVAL_MS, immediate on startup)`, 'agent-scheduler');
  log('[WP-SYNC] ═══════════════════════════════════════════════════════', 'agent-scheduler');

  log('[SENTINEL] Agent scheduler started successfully', 'agent-scheduler');
}

export function stopAgentScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
  if (crossDivisionInterval) {
    clearInterval(crossDivisionInterval);
    crossDivisionInterval = null;
  }
  if (marketingInterval) {
    clearInterval(marketingInterval);
    marketingInterval = null;
  }
  if (uiReviewInterval) {
    clearInterval(uiReviewInterval);
    uiReviewInterval = null;
  }
  if (ecosystemInterval) {
    clearInterval(ecosystemInterval);
    ecosystemInterval = null;
  }
  if (autoImplementInterval) {
    clearInterval(autoImplementInterval);
    autoImplementInterval = null;
  }
  if (wpFullSyncInterval) {
    clearInterval(wpFullSyncInterval);
    wpFullSyncInterval = null;
  }
  schedulerRunning = false;
  status.running = false;
  log('[SENTINEL] Agent scheduler stopped', 'agent-scheduler');
}

export function getSchedulerStatus(): SchedulerStatus {
  return { ...status };
}

export async function triggerImmediateExecution(count: number = 3): Promise<{
  triggered: number;
  tasks: Array<{ id: string; title: string; agent: string }>;
}> {
  log(`[SENTINEL] Manual trigger: Executing up to ${count} tasks immediately`, 'agent-scheduler');

  const allTasks = await storage.getAllAgentTasks();

  const eligibleTasks = allTasks.filter(t => {
    // Skip tasks locked for immediate resume (prevents double-dispatch)
    if (lockedForImmediateResume.has(t.id)) return false;
    return t.status === 'pending' ||
      (t.status === 'in_progress' && (t.progress || 0) < 100);
  });

  const sortedTasks = eligibleTasks.sort((a, b) => {
    const progressDiff = (b.progress || 0) - (a.progress || 0);
    if (progressDiff !== 0) return progressDiff;
    return (b.priority || 1) - (a.priority || 1);
  });

  const tasksToTrigger = sortedTasks.slice(0, count);
  const triggered: Array<{ id: string; title: string; agent: string }> = [];

  for (const task of tasksToTrigger) {
    triggered.push({ id: task.id, title: task.title, agent: task.agentId });
    log(`[SENTINEL] Dispatching: ${task.agentId} â†’ "${task.title}"`, 'agent-scheduler');

    executeAgentTask(task.id)
      .then(async result => {
        if (result.success) {
          log(`[SENTINEL] âœ“ Manual task completed: ${task.title}`, 'agent-scheduler');
          await handleTaskCompletion(task, result);
        } else {
          log(`[SENTINEL] âœ— Manual task failed: ${task.title}`, 'agent-scheduler');
        }
      })
      .catch(error => {
        log(`[SENTINEL] âœ— Manual task error: ${error.message}`, 'agent-scheduler');
      });
  }

  return { triggered: triggered.length, tasks: triggered };
}

export async function seedInitialTasks(): Promise<{ created: number; tasks: string[] }> {
  const existingTasks = await storage.getAllAgentTasks();

  if (existingTasks.length >= 5) {
    return { created: 0, tasks: [] };
  }

  const seedTasks = [
    {
      agentId: 'PIXEL',
      division: 'marketing' as const,
      title: 'Allio Brand Logo - Unified Healing Symbol',
      description: 'Create the official Allio logo featuring unified healing energy. Incorporate DNA helix, flowing energy patterns, and colors: deep blue (wisdom), cyan (healing), gold (enlightenment). The logo should represent neither male nor female but wholeness - a bridge between AI and human wisdom.',
      priority: 5,
    },
    {
      agentId: 'AURORA',
      division: 'marketing' as const,
      title: 'Frequency Healing Visualization - 528Hz Love Frequency',
      description: 'Create a mystical visualization of the 528Hz healing frequency. Show sacred geometry, bio-resonance patterns, and ethereal energy waves. Colors should blend teals and golds representing cellular regeneration.',
      priority: 4,
    },
    {
      agentId: 'PROMETHEUS',
      division: 'science' as const,
      title: 'Live Blood Analysis Training Protocol v1',
      description: 'Create a comprehensive training document for new practitioners learning Live Blood Analysis. Include methodology, equipment requirements, sample interpretation guidelines, and common patterns to identify. Reference the FFPMA mission of curing over profits.',
      priority: 5,
    },
    {
      agentId: 'JURIS',
      division: 'legal' as const,
      title: 'PMA Membership Agreement Template',
      description: 'Draft a comprehensive Private Membership Association agreement template that protects both the organization and members. Include consent provisions, liability limitations, healing philosophy acknowledgments, and member sovereignty clauses.',
      priority: 5,
    },
    {
      agentId: 'ATLAS',
      division: 'financial' as const,
      title: 'Q1 2026 Financial Sustainability Report',
      description: 'Generate a financial sustainability analysis for Q1 2026. Include projections for member growth, product revenue from WooCommerce integration, operational costs, and recommendations for circular economy initiatives aligned with FFPMA values.',
      priority: 3,
    },
    {
      agentId: 'PIXEL',
      division: 'marketing' as const,
      title: 'Social Media Banner - March 2026 Launch',
      description: 'Design a compelling social media banner announcing the April 1, 2026 full launch. Feature the Allio brand, healing ecosystem messaging, and call-to-action for new members. Optimized for Twitter/X, Facebook, and LinkedIn.',
      priority: 4,
    },
    {
      agentId: 'DAEDALUS',
      division: 'engineering' as const,
      title: 'Technical Architecture Document - Allio v1',
      description: 'Create a comprehensive technical architecture document for Allio v1. Include system diagrams, API specifications, database schema overview, security protocols, and integration points (WooCommerce, WordPress, SignNow, Google Workspace).',
      priority: 4,
    },
    {
      agentId: 'LEXICON',
      division: 'legal' as const,
      title: 'Doctor Practitioner Agreement',
      description: 'Draft a practitioner agreement for doctors joining the FFPMA network. Include scope of practice within PMA framework, liability provisions, patient privacy requirements, and alignment with FFPMA healing philosophy.',
      priority: 4,
    },
  ];

  const createdTasks: string[] = [];

  for (const taskData of seedTasks) {
    try {
      const task = await storage.createAgentTask(taskData);
      createdTasks.push(`${taskData.agentId}: ${taskData.title}`);
      log(`[Seed] Created task: ${taskData.title}`, 'agent-scheduler');
    } catch (error: any) {
      log(`[Seed] Error creating task: ${error.message}`, 'agent-scheduler');
    }
  }

  await sentinel.notify({
    type: 'task_completed',
    title: 'Initial Tasks Seeded',
    message: `${createdTasks.length} initial tasks have been created and are ready for execution. The agent network is prepared to begin producing real outputs.`,
    agentId: 'SENTINEL',
    division: 'executive',
    priority: 3,
  });

  return { created: createdTasks.length, tasks: createdTasks };
}

export async function scheduleDailyUIReview(): Promise<void> {
  log('[SENTINEL] Scheduling daily UI review for FORGE and SYNTHESIS', 'agent-scheduler');
  const files = ['client/src/pages/landing.tsx', 'client/src/pages/member-dashboard.tsx'];

  try {
    const allTasks = await storage.getAllAgentTasks();
    const uiTaskExists = allTasks.some(t => t.title === 'Daily UI/UX Flow Optimization' && (t.status === 'pending' || t.status === 'in_progress'));

    if (uiTaskExists) {
      log('[SENTINEL] UI review tasks already exist. Skipping duplicate generation.', 'agent-scheduler');
      return;
    }

    // FORGE task
    await storage.createAgentTask({
      agentId: 'FORGE',
      division: 'engineering',
      title: 'Daily UI/UX Flow Optimization',
      description: `Review highly trafficked files for UI/UX improvements and queue proposals in the UI Refactor Proposals table.\n\nTarget files:\n${files.join('\n')}\n\nFocus on aesthetic enhancements, interactive flows, and modern design principles.`,
      priority: 3,
    });

    // SYNTHESIS task
    await storage.createAgentTask({
      agentId: 'SYNTHESIS',
      division: 'science',
      title: 'Daily UI/UX Refactor and Component Analysis',
      description: `Review highly trafficked files for component refactoring and aesthetic improvements. Queue proposals in the UI Refactor Proposals table.\n\nTarget files:\n${files.join('\n')}\n\nFocus on React best practices, CSS modularity, and unifying the visual design language.`,
      priority: 3,
    });

    log('[SENTINEL] UI review tasks created successfully.', 'agent-scheduler');
  } catch (error: any) {
    log(`[SENTINEL] Error scheduling UI review: ${error.message}`, 'agent-scheduler');
  }
}

export async function scheduleDailyEcosystemEnhancement(): Promise<void> {
  log('[SENTINEL] Scheduling daily ecosystem enhancement tasks across all divisions', 'agent-scheduler');
  const now = new Date().toISOString().split('T')[0];

  try {
    const allTasks = await storage.getAllAgentTasks();
    const existingEcosystemTask = allTasks.some(t => t.title.includes(`Daily Medical Protocol & Graph Scan (${now})`) && (t.status === 'pending' || t.status === 'in_progress'));

    if (existingEcosystemTask) {
      log(`[SENTINEL] Ecosystem enhancement tasks for ${now} already exist. Skipping duplicate generation.`, 'agent-scheduler');
      return;
    }

    // A. Science Division
    await storage.createAgentTask({
      agentId: 'PROMETHEUS',
      division: 'science',
      title: `Daily Medical Protocol & Graph Scan (${now})`,
      description: `Query the OpenAlex/Semantic Scholar APIs for newly published research related to cancer, peptides, or frequency healing. Summarize findings for the Trustee to keep the FFPMA protocols cutting-edge.`,
      priority: 3,
    });

    // B. Legal Division
    await storage.createAgentTask({
      agentId: 'JURIS',
      division: 'legal',
      title: `Daily PMA Sovereignty & Compliance Audit (${now})`,
      description: `Review recently generated member contracts, assess any flagged communications for public vs. private language, and generate a daily legal health report to ensure strict PMA sovereignty.`,
      priority: 3,
    });

    // C. Financial Division
    await storage.createAgentTask({
      agentId: 'ATLAS',
      division: 'financial',
      title: `Daily Treasury & Sustainability Check (${now})`,
      description: `Analyze overarching API data/trends for the past 24 hours. Identify revenue spikes or drops, and propose circular economy reinvestments that align with fading out fiat reliance.`,
      priority: 3,
    });

    // D. Marketing Division
    await storage.createAgentTask({
      agentId: 'MUSE',
      division: 'marketing',
      title: `Daily Content Generation Flow (${now})`,
      description: `Generate 1 new piece of compelling social media copy reflecting FFPMA values, formulate 1 visual asset request (needs cross-division support from PIXEL), and outline 1 concept for PRISM video production.`,
      priority: 3,
    });

    // E. Quantum Division (Mapped to Science)
    await storage.createAgentTask({
      agentId: 'RESONANCE',
      division: 'science',
      title: `Daily Frequency & Resonance Calibration (${now})`,
      description: `Assess the platform's visual/audio technical integration plans to ensure they align with the 528Hz/396Hz design standards. Generate a quick report on plasma/frequency tech integrations.`,
      priority: 3,
    });

    // F. Engineering Division
    await storage.createAgentTask({
      agentId: 'ARCHITECT',
      division: 'engineering',
      title: `Daily Infrastructure & Architecture Audit (${now})`,
      description: `Check simulated API error rates, monitor system throughput, and propose backend optimizations or database refactoring. Formulate the next phase of technical evolution.`,
      priority: 3,
    });

    // G. Support Division (Formulas)
    await storage.createAgentTask({
      agentId: 'DR-FORMULA',
      division: 'science',
      title: `Daily Patient Intake Refinement (${now})`,
      description: `Review anonymized patterns from recent patient intake flows (Reduce, Rebalance, Reactivate, Restore, Revitalize). Suggest improvements to the protocol intake design to maximize healing efficiency.`,
      priority: 3,
    });

    // G2. Support Division (Structural)
    await storage.createAgentTask({
      agentId: 'CHIRO',
      division: 'support',
      title: `Daily Structural Alignment Protocol Review (${now})`,
      description: `Review the integration of structural and spinal alignment methodologies within the patient protocol generation system. Suggest specific enhancements to pair frequency medicine with physical adjustment theory.`,
      priority: 3,
    });

    // G3. Security Division (TITAN mapped to payment/fraud shield agent RONIN)
    await storage.createAgentTask({
      agentId: 'RONIN',
      division: 'engineering',
      title: `Daily Cyber-Sovereignty Audit (${now})`,
      description: `Review incoming traffic patterns and system activity for the past 24 hours. Ensure PMA digital sovereignty is maintained and flag any anomalous or non-member interactions.`,
      priority: 3,
    });

    // H. Executive Division
    await storage.createAgentTask({
      agentId: 'SENTINEL',
      division: 'executive',
      title: `Daily Network State Report & Morning Briefing (${now})`,
      description: `Wait for the other daily division reports to complete, then gather the outputs of all daily tasks and generate a single, unified "Morning Briefing" for the Trustee. Identify any critical bottlenecks.`,
      priority: 4,
    });

    log('[SENTINEL] Ecosystem enhancement tasks successfully deployed to all 8 divisions.', 'agent-scheduler');
  } catch (error: any) {
    log(`[SENTINEL] Error scheduling daily ecosystem enhancement: ${error.message}`, 'agent-scheduler');
  }
}
export async function scheduleWeeklyMedicalEnhancement(): Promise<void> {
  log('[SENTINEL] Scheduling weekly medical autonomous enhancement tasks (Trimmed)', 'agent-scheduler');
  const now = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    const allTasks = await storage.getAllAgentTasks();

    // 1. Blood Analysis Tool (KEPT)
    const recentBloodTask = allTasks.some(t => 
      t.title.includes('Weekly Blood AI Enhancement Review') && 
      t.createdAt && new Date(t.createdAt) > sevenDaysAgo
    );

    if (!recentBloodTask) {
      await storage.createAgentTask({
        agentId: 'DR-FORMULA',
        division: 'science',
        title: `Weekly Blood AI Enhancement Review (${now})`,
        description: `Review the results and anomalies from the Blood Microscopy Analysis tool over the past 7 days. Compare against PubMed and Semantic Scholar for new clinical markers, then propose logic node updates to improve accuracy and suggest new data points for analysis.`,
        priority: 3,
      });
    }

    // 2. X-Ray Tool (DISABLED PER USER REQUEST)
    /*
    await storage.createAgentTask({
      agentId: 'HIPPOCRATES',
      division: 'science',
      title: `Weekly X-Ray Auto-Enhancement (${now})`,
      description: `Run an automated self-audit on the Dental/Vertebral X-Ray diagnostic model. Evaluate accuracy based on recent data from HuggingFace and literature. Propose calibration adjustments for structural identification.`,
      priority: 3,
    });
    */

    // 3. ECS Calculator (KEPT)
    const recentEcsTask = allTasks.some(t => 
      t.title.includes('Weekly ECS Calculator Auto-Enhancement') && 
      t.createdAt && new Date(t.createdAt) > sevenDaysAgo
    );

    if (!recentEcsTask) {
      await storage.createAgentTask({
        agentId: 'PARACELSUS',
        division: 'science',
        title: `Weekly ECS Calculator Auto-Enhancement (${now})`,
        description: `Query latest clinical trials regarding the Endocannabinoid System (ECS) tone and deficiencies. Recommend new variable weights for the ECS Calculator tool to improve formulation protocols.`,
        priority: 3,
      });
    }

    // 4. Skin Cancer Detection Auto-Enhancement
    const recentSkinCancerTask = allTasks.some(t =>
      t.title.includes('Weekly Skin Cancer AI Auto-Enhancement') &&
      t.createdAt && new Date(t.createdAt) > sevenDaysAgo
    );

    if (!recentSkinCancerTask) {
      await storage.createAgentTask({
        agentId: 'DR-TRIAGE',
        division: 'support',
        title: `Weekly Skin Cancer AI Auto-Enhancement (${now})`,
        description: `Audit the recent outputs of the Melanoma/Skin anomaly detection model (VRJBro/skin-cancer-detection). Check for the latest medical journals on dermatological imaging features to enhance the diagnostic confidence threshold. Review ABCDE criteria annotations for accuracy.`,
        priority: 3,
      });
    }

    log('[SENTINEL] Medical auto-enhancement tasks successfully deployed to Science and Support agents.', 'agent-scheduler');
  } catch (error: any) {
    log(`[SENTINEL] Error scheduling weekly medical enhancement: ${error.message}`, 'agent-scheduler');
  }
}

export async function scheduleDailyResourceOptimization(): Promise<void> {
  log('[SENTINEL] Scheduling daily resource optimization for DIANE and SAM', 'agent-scheduler');
  const now = new Date().toISOString().split('T')[0];

  try {
    // DIANE - Clinical Knowledge updates
    await storage.createAgentTask({
      agentId: 'DIANE',
      division: 'support',
      title: `Daily Clinical Resource Review (${now})`,
      description: `Review the newest protocols generated from the Science Division today. Analyze the 'diane_knowledge' table and propose draft revisions to patient-facing material (PDFs, healing guides, dietary programs). Ensure resources are up-to-date with FFPMA findings.`,
      priority: 3,
    });

    // SAM - Operational/Support updates
    await storage.createAgentTask({
      agentId: 'SAM',
      division: 'support',
      title: `Daily Logistics & Intake Review (${now})`,
      description: `Audit recent patient intake completions and WooCommerce supplement fulfillment timelines. Propose automated workflow optimizations to decrease turnaround time for patient protocol delivery.`,
      priority: 3,
    });

    log('[SENTINEL] Daily resource optimization tasks scheduled successfully.', 'agent-scheduler');
  } catch (error: any) {
    log(`[SENTINEL] Error scheduling daily resource optimization: ${error.message}`, 'agent-scheduler');
  }
}

export async function scheduleWeeklyModelEvolution(): Promise<void> {
  log('[SENTINEL] Scheduling weekly AI model evolution audit', 'agent-scheduler');
  const now = new Date().toISOString().split('T')[0];

  try {
    await storage.createAgentTask({
      agentId: 'ARCHITECT',
      division: 'engineering',
      title: `Weekly HuggingFace AI Model Evolution (${now})`,
      description: `Scan the HuggingFace Hub using our internal API evaluator for trending/highly downloaded 'medical' or 'classification' models. Analyze the top performing models, benchmark them structurally, and propose hot-swapping our existing vision/multimodal pipelines in the 'ai_model_evaluations' table for the Trustee.`,
      priority: 4,
    });
    log('[SENTINEL] Weekly AI model evolution task scheduled successfully.', 'agent-scheduler');
  } catch (error: any) {
    log(`[SENTINEL] Error scheduling weekly model evolution: ${error.message}`, 'agent-scheduler');
  }
}
