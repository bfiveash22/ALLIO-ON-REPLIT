import { db } from '../db';
import { pool } from '../db';
import { log } from '../index';
import { databaseBackups, DatabaseBackup } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getGoogleDriveClient } from './google-drive-full';
import { Readable } from 'stream';
import crypto from 'crypto';

const BACKUP_TABLES = [
  'users',
  'member_profiles',
  'contracts',
  'legal_documents',
  'agent_tasks',
  'api_audit_logs',
  'patient_records',
  'patient_protocols',
  'clinics',
  'sentinel_notifications',
] as const;

type BackupTableName = typeof BACKUP_TABLES[number];

const RESTORE_TABLES: BackupTableName[] = [
  'users',
  'member_profiles',
  'contracts',
  'legal_documents',
  'agent_tasks',
  'api_audit_logs',
  'patient_records',
  'patient_protocols',
  'clinics',
];

const BACKUP_FOLDER_NAME = 'FFPMA-DB-Backups';

const TABLE_COLUMN_ALLOWLIST: Record<BackupTableName, string[]> = {
  users: [
    'id','email','first_name','last_name','profile_image_url',
    'wp_user_id','wp_username','wp_roles','auth_provider','created_at','updated_at',
  ],
  member_profiles: [
    'id','user_id','role','clinic_id','sponsor_id','wp_sponsor_id',
    'phone','address','city','state','zip_code','pricing_visible',
    'contract_signed','contract_id','is_active','last_synced_at','created_at',
  ],
  contracts: [
    'id','user_id','clinic_id','template_id','signnow_document_id','signnow_envelope_id',
    'embedded_signing_url','doctor_name','doctor_email','clinic_name','license_number',
    'specialization','phone','status','signed_at','fee_paid','fee_amount',
    'contract_url','created_at',
  ],
  legal_documents: [
    'id','title','doc_type','status','description','content','filing_number',
    'jurisdiction','assigned_agent','drive_file_id','drive_url','signnow_doc_id',
    'priority','due_date','filed_date','approved_date','notes','created_by',
    'reviewed_by','created_at','updated_at','signnow_template_id',
  ],
  agent_tasks: [
    'id','agent_id','division','title','description','status','priority','progress',
    'retry_count','last_error_at','next_retry_at','error_log','output_url',
    'output_drive_file_id','assigned_by','due_date','completed_at','evidence_required',
    'evidence_type','evidence_verified','evidence_verified_at','evidence_notes',
    'cross_division_from','cross_division_to','parent_task_id',
    'created_at','updated_at','tool_calls','agentic_iterations',
  ],
  api_audit_logs: [
    'id','method','path','source_type','source_id','status_code',
    'response_time_ms','ip_address','user_agent','created_at',
  ],
  patient_records: [
    'id','doctor_id','member_id','member_name','member_email','phone','date_of_birth',
    'status','primary_concerns','symptom_timeline','environmental_factors',
    'nutritional_deficiencies','toxicity_assessment','lifestyle_factors','family_history',
    'previous_treatments','current_medications','allergies','notes',
    'last_visit_at','next_appointment_at','created_at','updated_at',
  ],
  patient_protocols: [
    'id','patient_record_id','doctor_id','protocol_name','protocol_type','description',
    'status','products','schedule','duration','start_date','end_date',
    'progress_notes','current_week','compliance_score','expected_outcomes',
    'actual_outcomes','side_effects','created_at','updated_at',
  ],
  clinics: [
    'id','wp_clinic_id','owner_id','name','slug','description','address','city','state',
    'zip_code','phone','email','website','logo_url','signup_url',
    'wc_membership_product_id','wc_doctor_product_id','signnow_template_id',
    'signnow_doctor_link','signnow_member_link','doctor_name','practice_type',
    'onboarded_by','onboarding_date','on_map','pricing_visibility','is_active',
    'pma_name','pma_status','pma_ein','parent_pma_id','pma_agreement_date','pma_type',
    'contact_status','portal_id','portal_url','ein_status','articles_status',
    'bylaws_status','form_8832_status','form_1120_status','notes','created_at',
  ],
  sentinel_notifications: [
    'id','type','title','message','agent_id','division','task_id',
    'output_url','priority','is_read','created_at',
  ],
};

async function getOrCreateBackupFolder(driveClient: { files: { list: Function; create: Function } }): Promise<string> {
  const res = await driveClient.files.list({
    q: `name = '${BACKUP_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    pageSize: 1,
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id as string;
  }

  const folder = await driveClient.files.create({
    requestBody: {
      name: BACKUP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });

  return folder.data.id as string;
}

function getBackupLabel(type: 'daily' | 'weekly' | 'monthly' | 'manual'): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
  return `${type}-backup-${ts}`;
}

function determineBackupType(now: Date): 'daily' | 'weekly' | 'monthly' {
  const dayOfMonth = now.getUTCDate();
  const dayOfWeek = now.getUTCDay();
  if (dayOfMonth === 1) return 'monthly';
  if (dayOfWeek === 0) return 'weekly';
  return 'daily';
}

interface TableExportResult {
  rows: Record<string, unknown>[];
  rowCount: number;
  sourceCount: number;
  failed: boolean;
  errorMessage?: string;
}

interface VerificationResult {
  allCriticalTablesExported: boolean;
  checksumSHA256: string;
  tableCounts: Record<string, { exported: number; source: number; match: boolean }>;
  failedExports: string[];
  emptyTables: string[];
}

export interface BackupResult {
  success: boolean;
  backupId?: string;
  label?: string;
  totalRows?: number;
  fileSizeBytes?: number;
  driveFileId?: string;
  driveWebViewLink?: string;
  verificationStatus?: string;
  error?: string;
}

async function exportTable(tableName: string): Promise<{ rows: Record<string, unknown>[]; sourceCount: number; failed: boolean; errorMessage?: string }> {
  let sourceCount = -1;
  try {
    const countRes = await pool.query(`SELECT COUNT(*) FROM "${tableName}"`);
    sourceCount = parseInt(countRes.rows[0].count, 10);
  } catch {
    sourceCount = -1;
  }

  try {
    const allRows: Record<string, unknown>[] = [];
    const batchSize = 10000;
    let offset = 0;

    while (true) {
      const result = await pool.query(`SELECT * FROM "${tableName}" ORDER BY created_at LIMIT $1 OFFSET $2`, [batchSize, offset]);
      if (result.rows.length === 0) break;
      allRows.push(...result.rows);
      offset += batchSize;
      if (result.rows.length < batchSize) break;
    }

    return { rows: allRows, sourceCount, failed: false };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { rows: [], sourceCount, failed: true, errorMessage: message };
  }
}

export async function runDatabaseBackup(
  type?: 'daily' | 'weekly' | 'monthly' | 'manual'
): Promise<BackupResult> {
  const backupType = type || determineBackupType(new Date());
  const label = getBackupLabel(backupType);

  log(`Starting database backup: ${label}`, 'backup');

  const [backupRecord] = await db.insert(databaseBackups).values({
    backupType,
    status: 'running',
    label,
    tablesExported: [],
    totalRows: 0,
    fileSizeBytes: 0,
    startedAt: new Date(),
  }).returning();

  const backupId = backupRecord.id;

  try {
    const tableResults: Record<string, TableExportResult> = {};
    const failedExports: string[] = [];
    let totalRows = 0;

    for (const tableName of BACKUP_TABLES) {
      const exported = await exportTable(tableName);
      tableResults[tableName] = { ...exported, rowCount: exported.rows.length };

      if (exported.failed) {
        log(`Failed to export table ${tableName}: ${exported.errorMessage}`, 'backup');
        failedExports.push(tableName);
      } else {
        totalRows += exported.rows.length;
        log(`Exported ${exported.rows.length}/${exported.sourceCount < 0 ? '?' : exported.sourceCount} rows from ${tableName}`, 'backup');
      }
    }

    const exportedData: Record<string, Record<string, unknown>[]> = {};
    for (const [t, r] of Object.entries(tableResults)) {
      exportedData[t] = r.rows;
    }

    const tableCounts: Record<string, { exported: number; source: number; match: boolean }> = {};
    for (const [t, r] of Object.entries(tableResults)) {
      tableCounts[t] = {
        exported: r.rowCount,
        source: r.sourceCount,
        match: r.sourceCount >= 0 && r.rowCount === r.sourceCount,
      };
    }

    const backupPayload = {
      meta: {
        label,
        type: backupType,
        exportedAt: new Date().toISOString(),
        tables: BACKUP_TABLES as unknown as string[],
        totalRows,
      },
      data: exportedData,
    };

    const jsonContent = JSON.stringify(backupPayload, null, 2);
    const fileSizeBytes = Buffer.byteLength(jsonContent, 'utf8');
    const checksumSHA256 = crypto.createHash('sha256').update(jsonContent).digest('hex');

    const verificationDetails: VerificationResult = {
      allCriticalTablesExported: failedExports.length === 0,
      checksumSHA256,
      tableCounts,
      failedExports,
      emptyTables: Object.entries(tableResults)
        .filter(([, r]) => !r.failed && r.rowCount === 0)
        .map(([t]) => t),
    };

    if (failedExports.length > 0) {
      const errorMsg = `Export failed for tables: ${failedExports.join(', ')}`;
      await db.update(databaseBackups).set({
        status: 'failed',
        tablesExported: BACKUP_TABLES as unknown as string[],
        totalRows,
        fileSizeBytes,
        verificationStatus: 'failed',
        verificationDetails: verificationDetails as unknown as Record<string, unknown>,
        errorMessage: errorMsg,
        completedAt: new Date(),
      }).where(eq(databaseBackups.id, backupId));

      log(`Backup failed due to export errors: ${errorMsg}`, 'backup');
      return { success: false, backupId, label, error: errorMsg };
    }

    let driveFileId: string;
    let driveWebViewLink: string;
    let driveFolderId: string;

    try {
      const driveClient = await getGoogleDriveClient();
      driveFolderId = await getOrCreateBackupFolder(driveClient as unknown as { files: { list: Function; create: Function } });
      const stream = Readable.from([jsonContent]);

      const driveRes = await driveClient.files.create({
        requestBody: {
          name: `${label}.json`,
          parents: [driveFolderId],
          description: `FFPMA backup: ${label} | ${totalRows} rows | SHA256: ${checksumSHA256.substring(0, 16)}...`,
        },
        media: {
          mimeType: 'application/json',
          body: stream,
        },
        fields: 'id, webViewLink',
      });

      driveFileId = driveRes.data.id as string;
      driveWebViewLink = driveRes.data.webViewLink as string;
      log(`Backup uploaded to Drive: ${driveFileId}`, 'backup');
    } catch (driveErr: unknown) {
      const message = driveErr instanceof Error ? driveErr.message : String(driveErr);
      log(`Drive upload failed: ${message}`, 'backup');

      await db.update(databaseBackups).set({
        status: 'failed',
        tablesExported: BACKUP_TABLES as unknown as string[],
        totalRows,
        fileSizeBytes,
        verificationStatus: 'failed',
        verificationDetails: verificationDetails as unknown as Record<string, unknown>,
        errorMessage: `Drive upload failed: ${message}`,
        completedAt: new Date(),
      }).where(eq(databaseBackups.id, backupId));

      return { success: false, backupId, label, error: `Drive upload failed: ${message}` };
    }

    await db.update(databaseBackups).set({
      status: 'completed',
      tablesExported: BACKUP_TABLES as unknown as string[],
      totalRows,
      fileSizeBytes,
      driveFileId,
      driveWebViewLink,
      driveFolderId,
      verificationStatus: 'passed',
      verificationDetails: verificationDetails as unknown as Record<string, unknown>,
      completedAt: new Date(),
    }).where(eq(databaseBackups.id, backupId));

    await enforceRetentionPolicy();

    log(`Backup completed: ${label} (${totalRows} rows, ${Math.round(fileSizeBytes / 1024)}KB, checksum: ${checksumSHA256.substring(0, 12)}...)`, 'backup');

    return {
      success: true,
      backupId,
      label,
      totalRows,
      fileSizeBytes,
      driveFileId,
      driveWebViewLink,
      verificationStatus: 'passed',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log(`Backup failed: ${message}`, 'backup');
    await db.update(databaseBackups).set({
      status: 'failed',
      errorMessage: message,
      completedAt: new Date(),
    }).where(eq(databaseBackups.id, backupId));

    return { success: false, backupId, error: message };
  }
}

async function enforceRetentionPolicy(): Promise<void> {
  const DAILY_KEEP = 7;
  const WEEKLY_KEEP = 4;
  const MONTHLY_KEEP = 3;

  const limits: Array<['daily' | 'weekly' | 'monthly', number]> = [
    ['daily', DAILY_KEEP],
    ['weekly', WEEKLY_KEEP],
    ['monthly', MONTHLY_KEEP],
  ];

  try {
    for (const [bType, keepCount] of limits) {
      const backups = await db.select()
        .from(databaseBackups)
        .where(and(
          eq(databaseBackups.backupType, bType),
          eq(databaseBackups.status, 'completed'),
        ))
        .orderBy(desc(databaseBackups.createdAt));

      if (backups.length > keepCount) {
        const toDelete = backups.slice(keepCount);
        for (const b of toDelete) {
          if (b.driveFileId) {
            try {
              const driveClient = await getGoogleDriveClient();
              await driveClient.files.delete({ fileId: b.driveFileId });
              log(`Retention: deleted Drive file ${b.driveFileId} for ${b.label}`, 'backup');
            } catch {
            }
          }
          await db.delete(databaseBackups).where(eq(databaseBackups.id, b.id));
        }
        log(`Retention: pruned ${toDelete.length} old ${bType} backup(s)`, 'backup');
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log(`Retention policy error: ${message}`, 'backup');
  }
}

export async function getLatestBackupStatus(): Promise<{
  lastBackup: DatabaseBackup | null;
  totalBackups: number;
  lastSuccessfulAt: string | null;
  lastStatus: string | null;
}> {
  try {
    const [latest] = await db.select()
      .from(databaseBackups)
      .orderBy(desc(databaseBackups.createdAt))
      .limit(1);

    const countRes = await pool.query(`SELECT COUNT(*) FROM database_backups`);
    const totalBackups = parseInt(countRes.rows[0].count, 10);

    const [lastSuccessful] = await db.select()
      .from(databaseBackups)
      .where(eq(databaseBackups.status, 'completed'))
      .orderBy(desc(databaseBackups.completedAt))
      .limit(1);

    return {
      lastBackup: latest || null,
      totalBackups,
      lastSuccessfulAt: lastSuccessful?.completedAt?.toISOString() || null,
      lastStatus: latest?.status || null,
    };
  } catch {
    return { lastBackup: null, totalBackups: 0, lastSuccessfulAt: null, lastStatus: null };
  }
}

export async function restoreFromBackup(driveFileId: string): Promise<{
  success: boolean;
  tablesRestored: string[];
  tablesPartiallyFailed: string[];
  totalRows: number;
  error?: string;
}> {
  log(`Starting restore from Drive file: ${driveFileId}`, 'backup');
  const tablesRestored: string[] = [];
  const tablesPartiallyFailed: string[] = [];
  let totalRows = 0;

  const client = await pool.connect();
  try {
    const driveClient = await getGoogleDriveClient();

    const res = await driveClient.files.get({
      fileId: driveFileId,
      alt: 'media',
    }, { responseType: 'text' });

    const content = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    const payload = JSON.parse(content) as { meta?: unknown; data?: Record<string, Record<string, unknown>[]> };

    if (!payload.meta || !payload.data) {
      throw new Error('Invalid backup file format - missing meta or data fields');
    }

    for (const tableName of RESTORE_TABLES) {
      const rows = payload.data[tableName];
      if (!rows || rows.length === 0) {
        log(`Skipping ${tableName}: no data in backup`, 'backup');
        continue;
      }

      const allowedCols = TABLE_COLUMN_ALLOWLIST[tableName];
      if (!allowedCols || allowedCols.length === 0) {
        log(`Skipping ${tableName}: no column allowlist defined`, 'backup');
        tablesPartiallyFailed.push(tableName);
        continue;
      }

      try {
        await client.query('BEGIN');
        let rowsInserted = 0;

        for (const row of rows) {
          const cols = allowedCols.filter(c => c in row && row[c] !== null && row[c] !== undefined);
          if (cols.length === 0) continue;

          const colList = cols.map(c => `"${c}"`).join(', ');
          const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
          const values = cols.map(c => row[c]);

          const nonIdCols = cols.filter(c => c !== 'id');
          const updateSet = nonIdCols.length > 0
            ? nonIdCols.map(c => `"${c}" = EXCLUDED."${c}"`).join(', ')
            : '"id" = EXCLUDED."id"';

          await client.query(
            `INSERT INTO "${tableName}" (${colList}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${updateSet}`,
            values
          );
          rowsInserted++;
        }

        await client.query('COMMIT');
        tablesRestored.push(tableName);
        totalRows += rowsInserted;
        log(`Restored ${rowsInserted} rows to ${tableName}`, 'backup');
      } catch (tableErr: unknown) {
        await client.query('ROLLBACK');
        const message = tableErr instanceof Error ? tableErr.message : String(tableErr);
        log(`Failed to restore table ${tableName}: ${message}`, 'backup');
        tablesPartiallyFailed.push(tableName);
      }
    }

    const partialSuccess = tablesPartiallyFailed.length > 0;
    const overallSuccess = tablesRestored.length > 0;

    log(`Restore ${overallSuccess ? (partialSuccess ? 'partial' : 'complete') : 'failed'}: ${tablesRestored.length} tables OK, ${tablesPartiallyFailed.length} failed, ${totalRows} rows`, 'backup');

    return {
      success: overallSuccess && !partialSuccess,
      tablesRestored,
      tablesPartiallyFailed,
      totalRows,
      error: partialSuccess ? `Some tables failed to restore: ${tablesPartiallyFailed.join(', ')}` : undefined,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log(`Restore failed: ${message}`, 'backup');
    return { success: false, tablesRestored, tablesPartiallyFailed, totalRows, error: message };
  } finally {
    client.release();
  }
}

export async function listBackups(limit = 20): Promise<DatabaseBackup[]> {
  return db.select()
    .from(databaseBackups)
    .orderBy(desc(databaseBackups.createdAt))
    .limit(limit);
}
