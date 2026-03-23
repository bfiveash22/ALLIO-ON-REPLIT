import { db } from '../db';
import { userNotifications, InsertUserNotification, UserNotification, userNotificationTypeEnum, userNotificationPreferences, UserNotificationPreferences } from '@shared/schema';
import { eq, desc, and, count } from 'drizzle-orm';
import { Response } from 'express';

export type NotificationType = typeof userNotificationTypeEnum.enumValues[number];

const PREF_KEY_MAP: Record<NotificationType, keyof Omit<UserNotificationPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = {
  protocol_update: 'protocolUpdate',
  new_message: 'newMessage',
  training_milestone: 'trainingMilestone',
  member_enrolled: 'memberEnrolled',
  protocol_approval_request: 'protocolApprovalRequest',
  agent_task_completed: 'agentTaskCompleted',
  research_update: 'researchUpdate',
  system_alert: 'systemAlert',
};

class NotificationService {
  private clients: Map<string, Response[]> = new Map();

  subscribe(userId: string, res: Response): void {
    const existing = this.clients.get(userId) || [];
    existing.push(res);
    this.clients.set(userId, existing);

    res.on('close', () => {
      this.unsubscribe(userId, res);
    });
  }

  unsubscribe(userId: string, res: Response): void {
    const existing = this.clients.get(userId) || [];
    const updated = existing.filter(r => r !== res);
    if (updated.length === 0) {
      this.clients.delete(userId);
    } else {
      this.clients.set(userId, updated);
    }
  }

  private push(userId: string, notification: UserNotification): void {
    const clients = this.clients.get(userId);
    if (!clients || clients.length === 0) return;

    const data = `data: ${JSON.stringify(notification)}\n\n`;
    for (const client of clients) {
      try {
        client.write(data);
      } catch {
      }
    }
  }

  private async isTypeEnabled(userId: string, type: NotificationType): Promise<boolean> {
    try {
      const [prefs] = await db.select().from(userNotificationPreferences)
        .where(eq(userNotificationPreferences.userId, userId))
        .limit(1);
      if (!prefs) return true;
      const prefKey = PREF_KEY_MAP[type];
      return (prefs[prefKey] as boolean) !== false;
    } catch {
      return true;
    }
  }

  async create(data: InsertUserNotification): Promise<UserNotification> {
    const [notification] = await db.insert(userNotifications).values(data).returning();
    this.push(data.userId, notification);
    return notification;
  }

  async createForUser(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<UserNotification | null> {
    const enabled = await this.isTypeEnabled(userId, type);
    if (!enabled) return null;
    return this.create({ userId, type, title, message, metadata: metadata ?? null });
  }

  async getForUser(userId: string, limit = 50): Promise<UserNotification[]> {
    return db.select().from(userNotifications)
      .where(eq(userNotifications.userId, userId))
      .orderBy(desc(userNotifications.createdAt))
      .limit(limit);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(userNotifications)
      .where(and(
        eq(userNotifications.userId, userId),
        eq(userNotifications.isRead, false)
      ));
    return result?.count ?? 0;
  }

  async markRead(id: string, userId: string): Promise<void> {
    await db.update(userNotifications)
      .set({ isRead: true })
      .where(and(
        eq(userNotifications.id, id),
        eq(userNotifications.userId, userId)
      ));
  }

  async markAllRead(userId: string): Promise<void> {
    await db.update(userNotifications)
      .set({ isRead: true })
      .where(and(
        eq(userNotifications.userId, userId),
        eq(userNotifications.isRead, false)
      ));
  }

  async getPreferences(userId: string): Promise<UserNotificationPreferences | null> {
    const [prefs] = await db.select().from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, userId))
      .limit(1);
    return prefs || null;
  }

  async upsertPreferences(userId: string, updates: Partial<Omit<UserNotificationPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<UserNotificationPreferences> {
    const existing = await this.getPreferences(userId);
    if (existing) {
      const [updated] = await db.update(userNotificationPreferences)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userNotificationPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userNotificationPreferences)
        .values({ userId, ...updates })
        .returning();
      return created;
    }
  }
}

export const notificationService = new NotificationService();
