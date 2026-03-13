import type { Request, Response, NextFunction } from 'express';

const CLINIC_SCOPED_TABLES = [
  'member_profiles',
  'intake_forms',
  'orders',
  'program_enrollments',
];

export interface ClinicScopedRequest extends Request {
  clinicId?: string;
  clinicIsolationEnforced?: boolean;
}

function getAuthenticatedClinicId(req: ClinicScopedRequest): string | undefined {
  const user = req.user as any;
  if (!user) return undefined;
  return user.clinicId || user.clinic_id || undefined;
}

export function requireClinicScope(req: ClinicScopedRequest, res: Response, next: NextFunction) {
  const user = req.user as any;

  if (!user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Clinic-scoped endpoints require an authenticated user.',
    });
  }

  const authenticatedClinicId = getAuthenticatedClinicId(req);

  if (!authenticatedClinicId) {
    console.warn(`[Clinic Isolation] User ${user.id || 'unknown'} has no clinic_id in their auth claims. Request to ${req.path} blocked.`);
    return res.status(403).json({
      error: 'Clinic scope required',
      message: 'Your account is not associated with a clinic. Contact your administrator.',
    });
  }

  const requestedClinicId = req.headers['x-clinic-id'] as string || req.query.clinicId as string;
  if (requestedClinicId && requestedClinicId !== authenticatedClinicId) {
    console.error(`[Clinic Isolation] User ${user.id || 'unknown'} (clinic ${authenticatedClinicId}) attempted to access clinic ${requestedClinicId}. BLOCKED.`);
    return res.status(403).json({
      error: 'Clinic scope mismatch',
      message: 'You do not have permission to access data for this clinic.',
    });
  }

  req.clinicId = authenticatedClinicId;
  req.clinicIsolationEnforced = true;
  next();
}

export function clinicScopeMiddleware(req: ClinicScopedRequest, _res: Response, next: NextFunction) {
  const authenticatedClinicId = getAuthenticatedClinicId(req);

  if (authenticatedClinicId) {
    req.clinicId = authenticatedClinicId;
    req.clinicIsolationEnforced = true;
  }

  next();
}

export function buildClinicScopedQuery(
  baseConditions: any[],
  clinicId: string | undefined,
  clinicIdColumn: any
) {
  if (!clinicId) {
    console.error('[Clinic Isolation] Attempted to build query without clinic_id — blocking.');
    throw new Error('clinic_id is required for member data queries. Data isolation policy enforced.');
  }

  const { eq } = require('drizzle-orm');
  return [...baseConditions, eq(clinicIdColumn, clinicId)];
}

export function validateClinicScope(clinicId: string | undefined, operationName: string): void {
  if (!clinicId) {
    const msg = `[Clinic Isolation] Operation "${operationName}" attempted without clinic_id scope. Blocked.`;
    console.error(msg);
    throw new Error(msg);
  }
}

export function isTrusteeOrAdmin(user: any): boolean {
  if (!user) return false;
  const roles: string[] = Array.isArray(user.wpRoles)
    ? user.wpRoles
    : typeof user.wpRoles === 'string'
      ? user.wpRoles.split(',').map((r: string) => r.trim())
      : [];

  return roles.includes('administrator') || roles.includes('trustee')
    || user.role === 'admin' || user.role === 'trustee';
}

export function requireClinicScopeUnlessTrustee(req: ClinicScopedRequest, res: Response, next: NextFunction) {
  if (isTrusteeOrAdmin(req.user)) {
    req.clinicIsolationEnforced = false;
    return next();
  }
  return requireClinicScope(req, res, next);
}
