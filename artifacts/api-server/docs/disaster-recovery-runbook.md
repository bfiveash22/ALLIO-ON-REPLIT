# FFPMA Database Backup & Disaster Recovery Runbook

## Overview

The FFPMA backup system automatically exports critical database tables to JSON files stored in Google Drive. Backups are taken nightly at 3:00 AM CST and retained per the following policy:

- **Daily backups**: 7 most recent kept
- **Weekly backups**: 4 most recent kept (taken on Sundays)
- **Monthly backups**: 3 most recent kept (taken on the 1st of each month)

Each backup is verified with SHA-256 checksum and per-table row count comparison against source.

---

## Backed-Up Tables

| Table | Backed Up | Restored | Description |
|---|---|---|---|
| `users` | ✅ | ✅ | Auth user accounts |
| `member_profiles` | ✅ | ✅ | Member PMA profiles |
| `contracts` | ✅ | ✅ | Signed contracts |
| `legal_documents` | ✅ | ✅ | Legal documents |
| `agent_tasks` | ✅ | ✅ | AI agent task queue |
| `api_audit_logs` | ✅ | ✅ | API audit trail |
| `patient_records` | ✅ | ✅ | Patient records |
| `patient_protocols` | ✅ | ✅ | Treatment protocols |
| `clinics` | ✅ | ✅ | Clinic network |
| `sentinel_notifications` | ✅ | ❌ | System notifications (backup only; intentionally not restored — these are ephemeral system alerts that would be stale after a recovery event and would confuse the live notification feed) |

---

## Backup File Format

Each backup is a JSON file with this structure:

```json
{
  "meta": {
    "label": "daily-backup-2026-03-23T03-00-00",
    "type": "daily",
    "exportedAt": "2026-03-23T09:00:00.000Z",
    "tables": ["users", "member_profiles", ...],
    "totalRows": 12345
  },
  "data": {
    "users": [...],
    "member_profiles": [...],
    ...
  }
}
```

---

## Recovery Procedure

### Step 1: Identify the Backup to Restore From

1. Log into the Trustee Dashboard → **Security** tab
2. Find the **Database Backup Status** widget
3. Identify the most recent successful backup (green status)
4. Copy the Drive File ID from the backup record (visible in the Drive link)

Alternatively, open Google Drive and navigate to the `FFPMA-DB-Backups` folder.

### Step 2: Verify the Backup File

Before restoring, confirm:
- The backup file exists in Google Drive (`FFPMA-DB-Backups` folder)
- The `verificationStatus` column shows `passed` in the dashboard
- The row counts in `verificationDetails.tableCounts` are reasonable

### Step 3: Trigger Restore via API

The restore is performed via the admin API endpoint. This requires admin authentication.

**Option A: Via Trustee Dashboard (future UI)**

Navigate to Security → Database Backups → select backup → click "Restore".

**Option B: Via API (immediate)**

```bash
# Get admin session token first, then:
curl -X POST https://your-domain.com/api/backup/restore \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin-session-cookie>" \
  -d '{"driveFileId": "1abc123...DRIVE_FILE_ID..."}'
```

The restore uses `ON CONFLICT (id) DO UPDATE` for each row, so existing records are updated and missing records are inserted. This is safe to run multiple times (idempotent).

### Step 4: Verify Restore Success

After restore completes, verify:

1. Check the response for `tablesRestored` and `totalRows`
2. Confirm key data is accessible in the application
3. For member data: check the Members section in the dashboard
4. For agent tasks: check the Agent Network tab

---

## Manual Backup

To trigger an immediate backup outside the scheduled window:

**Via Trustee Dashboard:**
Security tab → Database Backup Status → "Run Backup Now"

**Via API:**
```bash
curl -X POST https://your-domain.com/api/backup/run \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin-session-cookie>" \
  -d '{"type": "manual"}'
```

---

## Troubleshooting

### Backup shows "failed" status
- Check `errorMessage` field in the backup record
- Common causes: Google Drive auth expired, database connectivity, table schema mismatch
- The backup metadata is still recorded even if Drive upload fails

### Drive upload failing
- Verify `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` env vars are set
- Check Google OAuth token has Drive write permissions
- Re-authorize via the Google Drive integration if needed

### Restore fails for a specific table
- The restore is table-by-table; a single table failure does not block others
- Check the `ROLLBACK` log message to identify the constraint violation
- Foreign key constraints may require restoring parent tables first (e.g., `users` before `member_profiles`)
- The restore order is designed to respect FK dependencies: users → member_profiles → contracts, etc.

### Data not appearing after restore
- The restore uses upsert (INSERT ... ON CONFLICT DO UPDATE), so existing rows are updated
- If data was deleted at the DB level rather than soft-deleted, restore will re-insert it
- Application caches (e.g., members cache) may need a restart to reflect restored data

---

## Backup Schedule

| Time (CST) | Event |
|---|---|
| 3:00 AM | Automated daily backup runs |
| After backup | Retention policy enforced (old backups pruned from Drive + DB) |
| Success | Sentinel notification created |
| Failure | Sentinel alert notification at priority 3 |

---

## Contact

If recovery fails or data is unrecoverable, contact the system administrator. The Replit checkpoint system also provides additional recovery options for the full environment state.
