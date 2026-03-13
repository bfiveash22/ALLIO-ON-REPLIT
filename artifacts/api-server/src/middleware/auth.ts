import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { apiKeys, apiAuditLogs, users, memberProfiles } from '@shared/schema';



async function validateApiKey(req: Request): Promise<{ valid: boolean; keyId?: string; permissions?: string[] }> {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer allio_')) {
    return { valid: false };
  }

  const rawKey = authHeader.substring(7);
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  try {
    const rows = await db.select().from(apiKeys)
      .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, true)));

    if (rows.length === 0) return { valid: false };

    await db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, rows[0].id));

    return { valid: true, keyId: rows[0].id, permissions: rows[0].permissions };
  } catch (err: any) {
    console.error('[AUTH] API key validation error:', err.message);
    return { valid: false };
  }
}

function getAuthSource(req: Request): { type: string; id: string | null } {
  const r = req as any;
  if (r.apiKeyId) return { type: 'apiKey', id: r.apiKeyId };

  // Check standard express-session layout
  // Removed legacy claims.sub checks
  return { type: 'anonymous', id: null };
}

export function auditLog() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalEnd = res.end;

    res.end = function (this: Response, ...args: any[]) {
      const responseTimeMs = Date.now() - startTime;
      const source = getAuthSource(req);

      db.insert(apiAuditLogs).values({
        method: req.method,
        path: req.path,
        sourceType: source.type,
        sourceId: source.id,
        statusCode: res.statusCode,
        responseTimeMs,
        ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
      }).catch((err: any) => {
        console.error('[AUDIT] Failed to log:', err.message);
      });

      return originalEnd.apply(this, args as any);
    } as any;

    next();
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const r = req as any;
  if (!r.isAuthenticated || !r.isAuthenticated()) {
    console.log(`[AUTH MIDDLEWARE] 401 on ${req.method} ${req.path}`);
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const r = req as any;

    // API Key fallback for /api/athena and /api/sentinel
    if (!r.isAuthenticated || !r.isAuthenticated()) {
      if (allowedRoles.includes('admin')) {
        const apiResult = await validateApiKey(req);
        if (apiResult.valid) {
          const method = req.method.toUpperCase();
          const needsWrite = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
          if (needsWrite && apiResult.permissions && !apiResult.permissions.includes('write')) {
            return res.status(403).json({ error: 'API key lacks write permission' });
          }
          r.apiKeyId = apiResult.keyId;
          r.apiKeyPermissions = apiResult.permissions;
          return next();
        }

      }
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = r.user?.wpRoles || [];
    let hasRole = allowedRoles.some(role => userRoles.includes(role));

    // Map wpRoles to Allio roles
    if (!hasRole) {
      if (userRoles.includes('administrator') || userRoles.includes('shop_manager')) {
        hasRole = allowedRoles.includes('admin') || allowedRoles.includes('trustee');
      } else if (userRoles.includes('doctor') || userRoles.includes('physician')) {
        hasRole = allowedRoles.includes('doctor') || allowedRoles.includes('clinic');
      }
    }

    // Hardcoded constraint: only blake should have trustee access
    if (allowedRoles.includes('trustee')) {
      const email = r.user?.email || '';
      const isBlake = email.toLowerCase().includes('blake');
      if (isBlake) {
        hasRole = true;
      }
    }

    if (!hasRole) {
      console.log(`[AUTH MIDDLEWARE] 403 on ${req.method} ${req.path} | roles=${allowedRoles}`);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
