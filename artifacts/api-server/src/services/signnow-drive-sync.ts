import { logger } from '../lib/logger';
import { signNowService } from './signnow';
import {
  findAllioFolder,
  findFolderByName,
  createSubfolder,
  getUncachableGoogleDriveClient,
} from './drive';
import { outboundLimiters } from '../lib/rate-limiter';
import { db } from '../db';
import { contracts } from '@shared/schema';
import { eq, isNull, and, isNotNull, ne } from 'drizzle-orm';

const DOCTOR_CONTRACTS_FOLDER = 'Doctor Contracts';
const MEMBER_CONTRACTS_FOLDER = 'Member Contracts';
const LEGAL_CONTRACTS_FOLDER = 'Legal - Contracts & Agreements';

export interface ContractSyncResult {
  contractId: string;
  signNowDocumentId: string;
  status: 'synced' | 'skipped' | 'failed';
  driveFileId?: string;
  driveLink?: string;
  error?: string;
}

export interface SyncSummary {
  total: number;
  synced: number;
  skipped: number;
  failed: number;
  results: ContractSyncResult[];
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

async function ensureLegalContractsStructure(): Promise<{
  doctorFolderId: string | null;
  memberFolderId: string | null;
}> {
  const allioFolder = await findAllioFolder();
  if (!allioFolder) {
    throw new Error('ALLIO Drive folder not found');
  }

  let legalContractsFolderId = await findFolderByName(allioFolder.id, LEGAL_CONTRACTS_FOLDER);
  if (!legalContractsFolderId) {
    logger.info('[SignNow-Drive-Sync] Creating "Legal - Contracts & Agreements" folder', { source: 'signnow-drive-sync' });
    const created = await createSubfolder(allioFolder.id, LEGAL_CONTRACTS_FOLDER);
    legalContractsFolderId = created.id;
  }

  let doctorFolderId = await findFolderByName(legalContractsFolderId, DOCTOR_CONTRACTS_FOLDER);
  if (!doctorFolderId) {
    logger.info('[SignNow-Drive-Sync] Creating "Doctor Contracts" subfolder', { source: 'signnow-drive-sync' });
    const created = await createSubfolder(legalContractsFolderId, DOCTOR_CONTRACTS_FOLDER);
    doctorFolderId = created.id;
  }

  let memberFolderId = await findFolderByName(legalContractsFolderId, MEMBER_CONTRACTS_FOLDER);
  if (!memberFolderId) {
    logger.info('[SignNow-Drive-Sync] Creating "Member Contracts" subfolder', { source: 'signnow-drive-sync' });
    const created = await createSubfolder(legalContractsFolderId, MEMBER_CONTRACTS_FOLDER);
    memberFolderId = created.id;
  }

  return { doctorFolderId, memberFolderId };
}

async function uploadPdfBufferToDrive(
  folderId: string,
  fileName: string,
  buffer: Buffer
): Promise<{ fileId: string; webViewLink: string }> {
  await outboundLimiters.googledrive.consume();

  const drive = await getUncachableGoogleDriveClient();
  const { Readable } = await import('stream');
  const bufferStream = Readable.from(buffer);

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
      mimeType: 'application/pdf',
    },
    media: {
      mimeType: 'application/pdf',
      body: bufferStream,
    },
    fields: 'id, webViewLink',
  });

  if (!file.data.id) {
    throw new Error('Drive file creation returned no ID');
  }

  return {
    fileId: file.data.id,
    webViewLink: file.data.webViewLink || `https://drive.google.com/file/d/${file.data.id}/view`,
  };
}

function isDocumentComplete(doc: any): boolean {
  return (
    doc.document_status === 'completed' ||
    doc.status === 'completed' ||
    doc.document_status === 'signed' ||
    doc.status === 'signed'
  );
}

const DOCTOR_TEMPLATE_IDS = new Set(
  [
    process.env.SIGNNOW_DOCTOR_ONBOARDING_TEMPLATE_ID,
    process.env.SIGNNOW_DOCTOR_TEMPLATE_ID,
    '253597f6c6724abd976af62a69b3e0a5b92b38dd',
  ].filter(Boolean) as string[]
);

function determineContractType(contract: {
  licenseNumber?: string | null;
  templateId?: string | null;
}): 'doctor' | 'member' {
  if (contract.licenseNumber) return 'doctor';
  if (contract.templateId && DOCTOR_TEMPLATE_IDS.has(contract.templateId)) return 'doctor';
  return 'member';
}

function buildFileName(contract: {
  doctorName?: string | null;
  signNowDocumentId?: string | null;
  createdAt?: Date | null;
}, contractType: 'doctor' | 'member'): string {
  const name = (contract.doctorName || 'Unknown').replace(/[^a-zA-Z0-9 _-]/g, '').trim();
  const dateStr = contract.createdAt
    ? new Date(contract.createdAt).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const typeLabel = contractType === 'doctor' ? 'Doctor-Agreement' : 'Member-Agreement';
  return `${typeLabel}_${name}_${dateStr}.pdf`;
}

export async function syncSingleContract(contractId: string): Promise<ContractSyncResult> {
  const [contract] = await db.select().from(contracts).where(eq(contracts.id, contractId));

  if (!contract) {
    return {
      contractId,
      signNowDocumentId: '',
      status: 'failed',
      error: 'Contract not found in database',
    };
  }

  if (!contract.signNowDocumentId) {
    return {
      contractId,
      signNowDocumentId: '',
      status: 'skipped',
      error: 'No SignNow document ID associated with this contract',
    };
  }

  if (contract.driveFileId) {
    return {
      contractId,
      signNowDocumentId: contract.signNowDocumentId,
      status: 'skipped',
      driveFileId: contract.driveFileId || undefined,
      driveLink: contract.driveLink || undefined,
    };
  }

  return syncContractToDrive(contract);
}

async function syncContractToDrive(contract: typeof contracts.$inferSelect): Promise<ContractSyncResult> {
  const signNowDocumentId = contract.signNowDocumentId!;

  try {
    const signnowDoc = await signNowService.getDocument(signNowDocumentId);

    if (!isDocumentComplete(signnowDoc)) {
      logger.debug('[SignNow-Drive-Sync] Document not yet completed, skipping', {
        source: 'signnow-drive-sync',
        contractId: contract.id,
        status: (signnowDoc as any).document_status || (signnowDoc as any).status,
      });
      return {
        contractId: contract.id,
        signNowDocumentId,
        status: 'skipped',
      };
    }

    const pdfBuffer = await signNowService.downloadDocument(signNowDocumentId);

    const { doctorFolderId, memberFolderId } = await ensureLegalContractsStructure();

    const contractType = determineContractType(contract);
    const targetFolderId = contractType === 'doctor' ? doctorFolderId : memberFolderId;

    if (!targetFolderId) {
      throw new Error(`Target Drive folder for ${contractType} contracts could not be found or created`);
    }

    const fileName = buildFileName(contract, contractType);
    const { fileId, webViewLink } = await uploadPdfBufferToDrive(targetFolderId, fileName, pdfBuffer);

    await db
      .update(contracts)
      .set({
        driveFileId: fileId,
        driveLink: webViewLink,
        driveSyncedAt: new Date(),
        driveSyncError: null,
        status: 'completed',
        signedAt: contract.signedAt || new Date(),
      })
      .where(eq(contracts.id, contract.id));

    logger.info('[SignNow-Drive-Sync] Successfully synced contract to Drive', {
      source: 'signnow-drive-sync',
      contractId: contract.id,
      driveFileId: fileId,
      contractType,
    });

    return {
      contractId: contract.id,
      signNowDocumentId,
      status: 'synced',
      driveFileId: fileId,
      driveLink: webViewLink,
    };
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    logger.error('[SignNow-Drive-Sync] Failed to sync contract', {
      source: 'signnow-drive-sync',
      contractId: contract.id,
      error: errorMsg,
    });

    await db
      .update(contracts)
      .set({
        driveSyncError: errorMsg,
        driveSyncedAt: new Date(),
      })
      .where(eq(contracts.id, contract.id));

    return {
      contractId: contract.id,
      signNowDocumentId,
      status: 'failed',
      error: errorMsg,
    };
  }
}

export async function syncAllCompletedContracts(options?: {
  forceResync?: boolean;
}): Promise<SyncSummary> {
  const startedAt = new Date();
  const results: ContractSyncResult[] = [];

  logger.info('[SignNow-Drive-Sync] Starting sync of completed contracts', {
    source: 'signnow-drive-sync',
    forceResync: options?.forceResync,
  });

  let allContracts;

  if (options?.forceResync) {
    allContracts = await db
      .select()
      .from(contracts)
      .where(isNotNull(contracts.signNowDocumentId));
  } else {
    allContracts = await db
      .select()
      .from(contracts)
      .where(
        and(
          isNotNull(contracts.signNowDocumentId),
          isNull(contracts.driveFileId)
        )
      );
  }

  logger.info(`[SignNow-Drive-Sync] Found ${allContracts.length} contracts to check`, {
    source: 'signnow-drive-sync',
  });

  for (const contract of allContracts) {
    const result = await syncContractToDrive(contract);
    results.push(result);
  }

  const completedAt = new Date();
  const summary: SyncSummary = {
    total: results.length,
    synced: results.filter(r => r.status === 'synced').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    failed: results.filter(r => r.status === 'failed').length,
    results,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs: completedAt.getTime() - startedAt.getTime(),
  };

  logger.info('[SignNow-Drive-Sync] Sync complete', {
    source: 'signnow-drive-sync',
    total: summary.total,
    synced: summary.synced,
    skipped: summary.skipped,
    failed: summary.failed,
    durationMs: summary.durationMs,
  });

  return summary;
}

export async function getSyncStatus(): Promise<{
  totalContracts: number;
  syncedContracts: number;
  pendingSync: number;
  failedSync: number;
  recentlySynced: Array<{
    id: string;
    doctorName: string | null;
    driveLink: string | null;
    driveSyncedAt: Date | null;
    contractType: string;
  }>;
}> {
  const allContracts = await db.select().from(contracts);

  const withSignNow = allContracts.filter(c => c.signNowDocumentId);
  const synced = allContracts.filter(c => c.driveFileId);
  const failed = allContracts.filter(c => !c.driveFileId && c.driveSyncError);
  const pending = withSignNow.filter(c => !c.driveFileId && !c.driveSyncError);

  const recentlySynced = synced
    .filter(c => c.driveSyncedAt)
    .sort((a, b) => {
      const dateA = a.driveSyncedAt?.getTime() || 0;
      const dateB = b.driveSyncedAt?.getTime() || 0;
      return dateB - dateA;
    })
    .slice(0, 10)
    .map(c => ({
      id: c.id,
      doctorName: c.doctorName,
      driveLink: c.driveLink,
      driveSyncedAt: c.driveSyncedAt,
      contractType: determineContractType(c),
    }));

  return {
    totalContracts: allContracts.length,
    syncedContracts: synced.length,
    pendingSync: pending.length,
    failedSync: failed.length,
    recentlySynced,
  };
}
