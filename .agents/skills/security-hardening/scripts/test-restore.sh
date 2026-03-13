#!/bin/bash
# Backup Restore Verification Script
# Run via cron: 0 5 * * 0 /root/scripts/test-restore.sh

BACKUP_DIR="/root/backups"
RESTORE_DIR="/tmp/restore-test-$(date +%Y%m%d)"
LOG_FILE="/var/log/backups.log"

echo "[$(date)] Starting restore verification..." >> $LOG_FILE

mkdir -p $RESTORE_DIR

LATEST_DB=$(ls -t $BACKUP_DIR/db-*.sql.gz 2>/dev/null | head -1)
LATEST_FILES=$(ls -t $BACKUP_DIR/allio-*.tar.gz 2>/dev/null | head -1)

PASS=0
FAIL=0

if [ -n "$LATEST_DB" ]; then
    echo "[$(date)] Testing database restore: $(basename $LATEST_DB)" >> $LOG_FILE

    gunzip -t "$LATEST_DB"
    if [ $? -eq 0 ]; then
        echo "[$(date)] ✅ Database backup integrity: PASS" >> $LOG_FILE

        gunzip -c "$LATEST_DB" > $RESTORE_DIR/db-restore.sql
        if [ $? -eq 0 ] && [ -s $RESTORE_DIR/db-restore.sql ]; then
            TABLE_COUNT=$(grep -c "CREATE TABLE" $RESTORE_DIR/db-restore.sql)
            echo "[$(date)] ✅ Database SQL extraction: PASS ($TABLE_COUNT tables found)" >> $LOG_FILE
            PASS=$((PASS + 1))
        else
            echo "[$(date)] ❌ Database SQL extraction: FAIL" >> $LOG_FILE
            FAIL=$((FAIL + 1))
        fi
    else
        echo "[$(date)] ❌ Database backup integrity: FAIL" >> $LOG_FILE
        FAIL=$((FAIL + 1))
    fi
else
    echo "[$(date)] ⚠️  No database backup found to test" >> $LOG_FILE
fi

if [ -n "$LATEST_FILES" ]; then
    echo "[$(date)] Testing file restore: $(basename $LATEST_FILES)" >> $LOG_FILE

    tar -tzf "$LATEST_FILES" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "[$(date)] ✅ File backup integrity: PASS" >> $LOG_FILE

        tar -xzf "$LATEST_FILES" -C $RESTORE_DIR 2>> $LOG_FILE
        if [ $? -eq 0 ]; then
            FILE_COUNT=$(find $RESTORE_DIR -type f | wc -l)
            echo "[$(date)] ✅ File extraction: PASS ($FILE_COUNT files restored)" >> $LOG_FILE
            PASS=$((PASS + 1))
        else
            echo "[$(date)] ❌ File extraction: FAIL" >> $LOG_FILE
            FAIL=$((FAIL + 1))
        fi
    else
        echo "[$(date)] ❌ File backup integrity: FAIL" >> $LOG_FILE
        FAIL=$((FAIL + 1))
    fi
else
    echo "[$(date)] ⚠️  No file backup found to test" >> $LOG_FILE
fi

rm -rf $RESTORE_DIR

echo ""
echo "🧪 RESTORE VERIFICATION RESULTS"
echo "================================"
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
echo ""

if [ $FAIL -gt 0 ]; then
    echo "[$(date)] ❌ Restore verification FAILED ($FAIL failures)" >> $LOG_FILE
    exit 1
else
    echo "[$(date)] ✅ Restore verification PASSED" >> $LOG_FILE
    exit 0
fi
