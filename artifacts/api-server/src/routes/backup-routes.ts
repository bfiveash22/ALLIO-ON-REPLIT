import type { Express, Request, Response } from 'express';
import { requireAuth, requireRole } from '../working-auth';
import { runDatabaseBackup, getLatestBackupStatus, listBackups, restoreFromBackup } from '../services/backup-service';

export function registerBackupRoutes(app: Express): void {
  app.get('/api/backup/status', requireRole('admin'), async (_req: Request, res: Response) => {
    try {
      const status = await getLatestBackupStatus();
      res.json({ success: true, ...status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/backup/list', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const backups = await listBackups(limit);
      res.json({ success: true, backups });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/backup/run', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const type = (req.body?.type as 'daily' | 'weekly' | 'monthly' | 'manual') || 'manual';
      res.json({ success: true, message: 'Backup started in background', type });
      runDatabaseBackup(type).catch(err => {
        console.error('[backup-routes] Background backup error:', err.message);
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/backup/restore', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const { driveFileId } = req.body;
      if (!driveFileId) {
        return res.status(400).json({ success: false, error: 'driveFileId is required' });
      }
      const result = await restoreFromBackup(driveFileId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
