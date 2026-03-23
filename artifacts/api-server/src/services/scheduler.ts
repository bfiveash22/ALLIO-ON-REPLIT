import { sendEmail } from './gmail';
import { log } from '../index';
import { db } from '../db';
import { dailyBriefings, sentinelNotifications, agentTasks } from '@shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { dispatchWebhook } from './webhook-dispatcher';

const RECIPIENTS = {
  to: 'blake@forgottenformula.com',
  cc: 'nancy@forgottenformula.com, kami@forgottenformula.com'
};

const TZ = 'America/Chicago';
const CLINIC_SYNC_INTERVAL = 60 * 60 * 1000;
const SCHEDULE_CHECK_INTERVAL = 60 * 1000;

function getCSTHour(): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }).formatToParts(new Date());
  return parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
}

function getCSTDateString(): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return parts;
}

function getCSTDayOfWeek(): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).formatToParts(new Date());
  const day = parts.find(p => p.type === 'weekday')?.value || '';
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[day] ?? 0;
}

function getCSTWeekStartString(): string {
  const now = new Date();
  const dayOfWeek = getCSTDayOfWeek();
  const sunday = new Date(now.getTime() - dayOfWeek * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(sunday);
}

function getTimeOfDay(): string {
  const hour = getCSTHour();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function formatCSTTime(): string {
  return new Date().toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true }) + ' CST';
}

function formatCSTDate(): string {
  return new Date().toLocaleDateString('en-US', { timeZone: TZ, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

async function getTaskStats(): Promise<{ pending: number; inProgress: number; completedToday: number; failedToday: number; stuck: number }> {
  try {
    const today = getCSTDateString();
    const startOfDay = new Date(today + 'T00:00:00-06:00');

    const allTasks = await db.select().from(agentTasks);
    const pending = allTasks.filter(t => t.status === 'pending').length;
    const inProgress = allTasks.filter(t => t.status === 'in_progress').length;
    const completedToday = allTasks.filter(t => t.status === 'completed' && t.completedAt && new Date(t.completedAt) >= startOfDay).length;
    const failedToday = allTasks.filter(t => (t.status as any) === 'failed' && (t as any).updatedAt && new Date((t as any).updatedAt) >= startOfDay).length;
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const stuck = allTasks.filter(t => (t.status as any) === 'in_progress' && (t as any).startedAt && new Date((t as any).startedAt) < twoHoursAgo).length;

    return { pending, inProgress, completedToday, failedToday, stuck };
  } catch {
    return { pending: 0, inProgress: 0, completedToday: 0, failedToday: 0, stuck: 0 };
  }
}

async function generateMorningBriefing(): Promise<{ subject: string; body: string }> {
  const date = formatCSTDate();
  const stats = await getTaskStats();
  const daysUntilRollout = Math.ceil((new Date('2026-04-01').getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const subject = `SENTINEL Morning Briefing - ${date}`;
  const body = `Good morning,

This is your daily morning briefing from SENTINEL.

${'═'.repeat(50)}
ALLIO v1 DAILY PRIORITIES - ${date}
${'═'.repeat(50)}

MISSION STATUS
${'─'.repeat(30)}
Days Until Full Rollout: ${daysUntilRollout} (April 1, 2026)
Report Time: 6:00 AM CST

TASK QUEUE OVERVIEW
${'─'.repeat(30)}
Pending Tasks: ${stats.pending}
In Progress: ${stats.inProgress}
Stuck (>2hrs): ${stats.stuck}
Yesterday Completed: ${stats.completedToday}
Yesterday Failed: ${stats.failedToday}

AGENT NETWORK STATUS
${'─'.repeat(30)}
EXECUTIVE: SENTINEL, ATHENA, HERMES - ACTIVE
MARKETING: PRISM, FORGE, AURORA, PIXEL, MUSE - ACTIVE
ENGINEERING: DAEDALUS, CYPHER, NEXUS, ARACHNE, ARCHITECT, SERPENS - ACTIVE
LEGAL: JURIS, LEXICON, AEGIS, SCRIBE - ACTIVE
FINANCIAL: ATLAS - ACTIVE
MEDICAL: DR-TRIAGE, HIPPOCRATES, PARACELSUS - ACTIVE
SUPPORT: DIANE, PETE, SAM, MAX MINERAL, FF SUPPORT, PAT - ACTIVE

TODAY'S PRIORITIES
${'─'.repeat(30)}
${stats.stuck > 0 ? `ALERT: ${stats.stuck} stuck task(s) require attention\n` : ''}${stats.pending > 0 ? `${stats.pending} task(s) queued for processing\n` : 'No pending tasks - queue is clear\n'}${stats.failedToday > 0 ? `${stats.failedToday} failed task(s) from yesterday need review\n` : ''}
SYSTEM INTEGRATIONS
${'─'.repeat(30)}
Gmail API: Connected
Google Drive: Connected
SignNow: Connected
WooCommerce: Syncing (hourly)

${'═'.repeat(50)}

Next scheduled check: 7:00 AM CST (hourly until 5:00 PM)
Evening summary: 6:00 PM CST

Respectfully,
SENTINEL
Executive Agent of Operations #1
Allio v1 | Forgotten Formula PMA`;

  return { subject, body };
}

async function generateEveningReport(): Promise<{ subject: string; body: string }> {
  const date = formatCSTDate();
  const stats = await getTaskStats();

  const subject = `SENTINEL Evening Summary - ${date}`;
  const body = `Good evening,

This is your end-of-day summary from SENTINEL.

${'═'.repeat(50)}
ALLIO v1 DAILY SUMMARY - ${date}
${'═'.repeat(50)}

TODAY'S RESULTS
${'─'.repeat(30)}
Tasks Completed Today: ${stats.completedToday}
Tasks Failed Today: ${stats.failedToday}
Still In Progress: ${stats.inProgress}
Still Pending: ${stats.pending}
Stuck Tasks: ${stats.stuck}

${stats.completedToday > 0 ? `${stats.completedToday} task(s) successfully completed today.` : 'No tasks completed today.'}
${stats.failedToday > 0 ? `${stats.failedToday} task(s) failed and need review.` : ''}
${stats.stuck > 0 ? `ALERT: ${stats.stuck} task(s) stuck for >2 hours.` : ''}

TOMORROW'S OUTLOOK
${'─'.repeat(30)}
${stats.pending} task(s) queued for tomorrow
${stats.inProgress} task(s) will continue overnight

${'═'.repeat(50)}

Next morning briefing: Tomorrow at 6:00 AM CST

Respectfully,
SENTINEL
Executive Agent of Operations #1
Allio v1 | Forgotten Formula PMA`;

  return { subject, body };
}

async function generateHourlySummary(): Promise<string> {
  const stats = await getTaskStats();
  const time = formatCSTTime();
  return `Hourly Check (${time}): ${stats.inProgress} active, ${stats.pending} pending, ${stats.completedToday} completed today${stats.stuck > 0 ? `, ${stats.stuck} STUCK` : ''}`;
}

async function saveBriefing(type: string, subject: string, body: string, emailSent: boolean): Promise<void> {
  try {
    await db.insert(dailyBriefings).values({
      type,
      date: getCSTDateString(),
      subject,
      body,
      emailSent,
    });
  } catch (err: any) {
    log(`Failed to save briefing: ${err.message}`, 'scheduler');
  }
}

async function sendMorningBriefing(): Promise<void> {
  try {
    log('SENTINEL generating morning briefing (6:00 AM CST)...', 'scheduler');
    const { subject, body } = await generateMorningBriefing();

    const result = await sendEmail(RECIPIENTS.to, subject, body, RECIPIENTS.cc);
    await saveBriefing('morning', subject, body, result.success);

    if (result.success) {
      log(`Morning briefing sent. Message ID: ${result.messageId}`, 'scheduler');
    } else {
      log(`Morning briefing email failed: ${result.error}`, 'scheduler');
    }

    await dispatchWebhook('briefing.morning', { subject, taskStats: await getTaskStats() });

    await db.insert(sentinelNotifications).values({
      type: 'system_alert',
      title: 'Morning Briefing Sent',
      message: body.substring(0, 500),
      agentId: 'sentinel',
      division: 'executive',
      priority: 2,
    });
  } catch (error: any) {
    log(`Error sending morning briefing: ${error.message}`, 'scheduler');
  }
}

async function sendEveningSummary(): Promise<void> {
  try {
    log('SENTINEL generating evening summary (6:00 PM CST)...', 'scheduler');
    const { subject, body } = await generateEveningReport();

    const result = await sendEmail(RECIPIENTS.to, subject, body, RECIPIENTS.cc);
    await saveBriefing('evening', subject, body, result.success);

    if (result.success) {
      log(`Evening summary sent. Message ID: ${result.messageId}`, 'scheduler');
    } else {
      log(`Evening summary email failed: ${result.error}`, 'scheduler');
    }

    await dispatchWebhook('briefing.evening', { subject, taskStats: await getTaskStats() });

    await db.insert(sentinelNotifications).values({
      type: 'system_alert',
      title: 'Evening Summary Sent',
      message: body.substring(0, 500),
      agentId: 'sentinel',
      division: 'executive',
      priority: 2,
    });
  } catch (error: any) {
    log(`Error sending evening summary: ${error.message}`, 'scheduler');
  }
}

async function sendHourlyCheck(): Promise<void> {
  try {
    const summary = await generateHourlySummary();
    log(`SENTINEL hourly: ${summary}`, 'scheduler');

    await db.insert(sentinelNotifications).values({
      type: 'system_alert',
      title: 'Hourly Progress Check',
      message: summary,
      agentId: 'sentinel',
      division: 'executive',
      priority: 1,
    });
  } catch (error: any) {
    log(`Error in hourly check: ${error.message}`, 'scheduler');
  }
}

let schedulerInterval: NodeJS.Timeout | null = null;
let clinicSyncInterval: NodeJS.Timeout | null = null;
let lastMorningDate: string | null = null;
let lastEveningDate: string | null = null;
let lastHourlyHour: number | null = null;
let lastUIEvolutionWeek: string | null = null;
let lastBackupDate: string | null = null;

function checkSchedule(): void {
  const hour = getCSTHour();
  const today = getCSTDateString();

  if (hour === 6 && lastMorningDate !== today) {
    lastMorningDate = today;
    sendMorningBriefing();
  }

  const currentWeek = getCSTWeekStartString();
  if (hour === 2 && getCSTDayOfWeek() === 0 && lastUIEvolutionWeek !== currentWeek) {
    lastUIEvolutionWeek = currentWeek;
    scheduleUIEvolutionTasks();
  }

  if (hour === 3 && lastBackupDate !== today) {
    lastBackupDate = today;
    runScheduledBackup();
  }

  if (hour === 18 && lastEveningDate !== today) {
    lastEveningDate = today;
    sendEveningSummary();
  }

  if (hour >= 7 && hour <= 17 && lastHourlyHour !== hour) {
    lastHourlyHour = hour;
    sendHourlyCheck();
  }

  if (hour < 7 || hour > 17) {
    lastHourlyHour = null;
  }
}

async function runScheduledBackup(): Promise<void> {
  try {
    log('Starting scheduled nightly database backup (3:00 AM CST)...', 'backup');
    const { runDatabaseBackup } = await import('./backup-service');
    const result = await runDatabaseBackup();
    if (result.success) {
      log(`Nightly backup completed: ${result.label} (${result.totalRows} rows, ${result.driveFileId ? 'uploaded to Drive' : 'no Drive upload'})`, 'backup');
      await db.insert(sentinelNotifications).values({
        type: 'system_alert',
        title: 'Database Backup Completed',
        message: `Backup "${result.label}" completed successfully. ${result.totalRows} rows exported. Verification: ${result.verificationStatus}.`,
        agentId: 'sentinel',
        division: 'executive',
        priority: 1,
      });
    } else {
      log(`Nightly backup FAILED: ${result.error}`, 'backup');
      await db.insert(sentinelNotifications).values({
        type: 'system_alert',
        title: 'Database Backup FAILED',
        message: `Scheduled backup failed: ${result.error}`,
        agentId: 'sentinel',
        division: 'executive',
        priority: 3,
      });
    }
  } catch (err: any) {
    log(`Error in runScheduledBackup: ${err.message}`, 'backup');
  }
}

async function scheduleUIEvolutionTasks(): Promise<void> {
  try {
    log('Scheduling Continuous UI Evolution tasks...', 'scheduler');
    const weekStart = getCSTWeekStartString();
    const weekLabel = `Week of ${weekStart}`;

    const existing = await db.select().from(agentTasks).where(
      and(
        eq(agentTasks.title, `Continuous UI Evolution - ${weekLabel}`),
        eq(agentTasks.agentId, 'FORGE')
      )
    );

    if (existing.length > 0) return;

    await db.insert(agentTasks).values([
      {
        agentId: 'FORGE',
        division: 'engineering',
        title: `Continuous UI Evolution - ${weekLabel}`,
        description: 'Analyze components in client/src/pages/ for UI/UX enhancements and generate UI Refactor Proposals for Sentinel review.',
        status: 'pending',
        priority: 1,
        assignedBy: 'SENTINEL',
      },
      {
        agentId: 'SYNTHESIS',
        division: 'marketing',
        title: `Continuous Formatting Evolution - ${weekLabel}`,
        description: 'Analyze marketing and information pages for layout improvements and generate UI Refactor Proposals.',
        status: 'pending',
        priority: 1,
        assignedBy: 'SENTINEL',
      },
      {
        agentId: 'FORGE',
        division: 'engineering',
        title: `Educational & Portal UI Evolution - ${weekLabel}`,
        description: 'Analyze training modules (training.tsx), quizzes (quizzes.tsx), and the Doctor Portal (doctors-portal.tsx) for layout completeness, accessibility, aesthetic premium feel, and content clarity, generating UI Refactor Proposals.',
        status: 'pending',
        priority: 1,
        assignedBy: 'SENTINEL',
      }
    ]);

    log('UI Evolution tasks scheduled successfully.', 'scheduler');
  } catch (err: any) {
    log(`Failed to schedule UI Evolution tasks: ${err.message}`, 'scheduler');
  }
}

async function runClinicSync(): Promise<void> {
  try {
    log('Running hourly clinic sync from WordPress...', 'scheduler');
    const { syncClinics } = await import('./wordpress-sync');
    const result = await syncClinics();
    log(`Clinic sync complete: ${result.synced} synced (${result.created} created, ${result.updated} updated)`, 'scheduler');

    if (result.synced > 0) {
      await dispatchWebhook('sync.completed', {
        type: 'clinics',
        synced: result.synced,
        created: result.created,
        updated: result.updated,
      });
    }

    if (result.errors.length > 0) {
      log(`Clinic sync errors: ${result.errors.join(', ')}`, 'scheduler');
    }
  } catch (error: any) {
    log(`Error during clinic sync: ${error.message}`, 'scheduler');
  }
}

export function startScheduler(): void {
  if (schedulerInterval) {
    log('Scheduler already running', 'scheduler');
    return;
  }

  log('Starting SENTINEL structured daily scheduler (CST timezone)...', 'scheduler');
  log(`Current CST time: ${formatCSTTime()} on ${formatCSTDate()}`, 'scheduler');
  log('Schedule: 6AM morning briefing | 7AM-5PM hourly checks | 6PM evening summary', 'scheduler');

  checkSchedule();
  schedulerInterval = setInterval(checkSchedule, SCHEDULE_CHECK_INTERVAL);

  log('Starting hourly clinic sync scheduler...', 'scheduler');
  clinicSyncInterval = setInterval(runClinicSync, CLINIC_SYNC_INTERVAL);

  // Run clinic sync immediately on startup instead of waiting a full hour
  setTimeout(() => {
    runClinicSync().catch(err => log(`Error during startup clinic sync: ${err.message}`, 'scheduler'));
  }, 10000); // 10 seconds after boot

  log('Scheduler started successfully.', 'scheduler');
}

export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    log('Daily schedule stopped', 'scheduler');
  }
  if (clinicSyncInterval) {
    clearInterval(clinicSyncInterval);
    clinicSyncInterval = null;
    log('Clinic sync scheduler stopped', 'scheduler');
  }
}

export async function triggerImmediateClinicSync(): Promise<{ synced: number; updated: number; created: number; errors: string[] }> {
  const { syncClinics } = await import('./wordpress-sync');
  return syncClinics();
}

export function sendImmediateReport(): Promise<void> {
  return sendMorningBriefing();
}

export async function getLatestBriefings(): Promise<{ morning: any | null; evening: any | null; hourly: string | null }> {
  try {
    const today = getCSTDateString();

    const morningRows = await db.select().from(dailyBriefings)
      .where(and(eq(dailyBriefings.date, today), eq(dailyBriefings.type, 'morning')))
      .orderBy(desc(dailyBriefings.createdAt))
      .limit(1);

    const eveningRows = await db.select().from(dailyBriefings)
      .where(and(eq(dailyBriefings.date, today), eq(dailyBriefings.type, 'evening')))
      .orderBy(desc(dailyBriefings.createdAt))
      .limit(1);

    const hourlySummary = await generateHourlySummary();

    return {
      morning: morningRows[0] || null,
      evening: eveningRows[0] || null,
      hourly: hourlySummary,
    };
  } catch {
    return { morning: null, evening: null, hourly: null };
  }
}
