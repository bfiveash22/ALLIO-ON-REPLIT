import { log } from '../index';

export interface Lock {
  resourceId: string;
  ownerId: string;
  expiresAt: number;
}

class AgentLockManager {
  private locks: Map<string, Lock> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  private startCleanupInterval() {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleLocks();
    }, 60000); // Check every minute
  }

  private cleanupStaleLocks() {
    const now = Date.now();
    let cleaned = 0;
    this.locks.forEach((lock, resourceId) => {
      if (lock.expiresAt < now) {
        this.locks.delete(resourceId);
        cleaned++;
      }
    });
    if (cleaned > 0) {
      log(`[LOCK] Cleaned up ${cleaned} stale locks`, 'agent-locks');
    }
  }

  /**
   * Attempts to acquire mutually exclusive locks for a set of resources.
   * Either ALL locks are acquired or NONE are.
   */
  public acquireLocks(resourceIds: string[], ownerId: string, timeoutMs: number = 5 * 60 * 1000): boolean {
    const now = Date.now();
    this.cleanupStaleLocks(); 
    
    // Check if any requested resource is currently locked by someone else
    for (const resourceId of resourceIds) {
      const existingLock = this.locks.get(resourceId);
      if (existingLock && existingLock.ownerId !== ownerId && existingLock.expiresAt > now) {
        log(`[LOCK] Failed to acquire lock for ${resourceId} - currently held by ${existingLock.ownerId}`, 'agent-locks');
        return false;
      }
    }

    // All clear, acquire all locks
    const expiresAt = now + timeoutMs;
    for (const resourceId of resourceIds) {
      this.locks.set(resourceId, {
        resourceId,
        ownerId,
        expiresAt
      });
      log(`[LOCK] ${ownerId} acquired lock on ${resourceId}`, 'agent-locks');
    }
    
    return true;
  }

  public releaseLocks(resourceIds: string[], ownerId: string) {
    for (const resourceId of resourceIds) {
      const lock = this.locks.get(resourceId);
      if (lock && lock.ownerId === ownerId) {
        this.locks.delete(resourceId);
        log(`[LOCK] ${ownerId} released lock on ${resourceId}`, 'agent-locks');
      }
    }
  }

  public getAllLocks(): Lock[] {
    return Array.from(this.locks.values());
  }
  
  public forceReleaseLock(resourceId: string): boolean {
    if (this.locks.has(resourceId)) {
        this.locks.delete(resourceId);
        log(`[LOCK] Force released lock on ${resourceId}`, 'agent-locks');
        return true;
    }
    return false;
  }
}

export const lockManager = new AgentLockManager();
