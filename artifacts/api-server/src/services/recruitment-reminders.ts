import { db } from '../db';
import { doctorProspects, sentinelNotifications, type InsertSentinelNotification } from '@shared/schema';
import { and, lte, notInArray, isNotNull, or, isNull, sql } from 'drizzle-orm';
import { log } from '../index';
import { sendEmail } from './gmail';

const ADMIN_EMAIL = 'blake@forgottenformula.com';
const REMINDER_COOLDOWN_HOURS = 24;

export async function checkRecruitmentFollowUps(): Promise<{ checked: number; reminders: number }> {
  try {
    const now = new Date();
    const cooldownCutoff = new Date(now.getTime() - REMINDER_COOLDOWN_HOURS * 60 * 60 * 1000);

    const overdue = await db.select().from(doctorProspects).where(
      and(
        isNotNull(doctorProspects.followUpAt),
        lte(doctorProspects.followUpAt, now),
        notInArray(doctorProspects.stage, ['onboarded', 'declined']),
        or(
          isNull(doctorProspects.lastReminderSentAt),
          lte(doctorProspects.lastReminderSentAt, cooldownCutoff)
        )
      )
    );

    if (overdue.length === 0) {
      return { checked: 0, reminders: 0 };
    }

    let reminders = 0;
    for (const prospect of overdue) {
      try {
        const subject = `Follow-up due: ${prospect.fullName} (${prospect.stage})`;
        const body = [
          `Doctor recruitment follow-up reminder:`,
          ``,
          `Name: ${prospect.fullName}`,
          `Email: ${prospect.email}`,
          `Practice: ${prospect.practiceName || 'N/A'}`,
          `Location: ${[prospect.city, prospect.state].filter(Boolean).join(', ') || 'N/A'}`,
          `Current stage: ${prospect.stage}`,
          `Follow-up was due: ${prospect.followUpAt?.toLocaleString() || 'N/A'}`,
          ``,
          `Pitch deck views: ${prospect.pitchDeckViews || 0}`,
          `Time spent on deck: ${Math.round((prospect.pitchDeckTimeSpentSeconds || 0) / 60)} minutes`,
          ``,
          `Notes: ${prospect.notes || 'None'}`,
          ``,
          `Please follow up and update the prospect stage in the Recruitment Pipeline.`,
        ].join('\n');

        await sendEmail(ADMIN_EMAIL, subject, body);

        const notification: InsertSentinelNotification = {
          type: 'system_alert',
          title: `Follow-up Due: ${prospect.fullName}`,
          message: `${prospect.fullName} (${prospect.practiceType || 'practitioner'}) in ${prospect.city || 'unknown'}, ${prospect.stage} stage — follow-up overdue.`,
          agentId: 'recruitment-scheduler',
          division: 'recruitment',
          priority: 2,
          isRead: false,
        };
        await db.insert(sentinelNotifications).values(notification);

        await db.update(doctorProspects)
          .set({ lastReminderSentAt: now, updatedAt: now })
          .where(sql`${doctorProspects.id} = ${prospect.id}`);

        reminders++;
      } catch (err: any) {
        log(`[recruitment-reminders] Failed to send reminder for ${prospect.fullName}: ${err.message}`, 'recruitment');
      }
    }

    log(`[recruitment-reminders] Checked ${overdue.length} overdue follow-ups, sent ${reminders} reminders`, 'recruitment');
    return { checked: overdue.length, reminders };
  } catch (err: any) {
    log(`[recruitment-reminders] Check failed: ${err.message}`, 'recruitment');
    return { checked: 0, reminders: 0 };
  }
}

let reminderIntervalId: ReturnType<typeof setInterval> | null = null;

const REMINDER_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

export function startRecruitmentReminderScheduler(): void {
  if (reminderIntervalId) return;
  log('[recruitment-reminders] Starting follow-up reminder scheduler (every 4h, 24h dedup)', 'recruitment');
  reminderIntervalId = setInterval(async () => {
    await checkRecruitmentFollowUps();
  }, REMINDER_CHECK_INTERVAL_MS);

  setTimeout(async () => {
    await checkRecruitmentFollowUps();
  }, 30000);
}

export function stopRecruitmentReminderScheduler(): void {
  if (reminderIntervalId) {
    clearInterval(reminderIntervalId);
    reminderIntervalId = null;
  }
}
