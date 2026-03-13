#!/bin/bash
# Automated Database Backup Script
# Run via cron: 0 3 * * * /root/scripts/backup-database.sh

DATE=$(date +%Y-%m-%d-%H%M%S)
BACKUP_DIR="/root/backups"
DB_CONNECTION="${DATABASE_URL:-postgresql://neondb_owner:npg_GcYmap1rVP6I@ep-square-wildflower-a6u9shej.us-west-2.aws.neon.tech/neondb}"
LOG_FILE="/var/log/backups.log"

# Create backup directory
mkdir -p $BACKUP_DIR

echo "[$(date)] Starting database backup..." >> $LOG_FILE

# Dump database
pg_dump "$DB_CONNECTION" 2>> $LOG_FILE | gzip > $BACKUP_DIR/db-$DATE.sql.gz

if [ $? -eq 0 ]; then
    echo "[$(date)] ✅ Database dump successful: db-$DATE.sql.gz" >> $LOG_FILE
    
    # Verify gzip integrity
    gunzip -t $BACKUP_DIR/db-$DATE.sql.gz
    if [ $? -eq 0 ]; then
        echo "[$(date)] ✅ Backup integrity verified" >> $LOG_FILE
        
        # Optional: Encrypt with GPG (requires GPG key setup)
        # gpg --encrypt --recipient trustee@ffpma.com $BACKUP_DIR/db-$DATE.sql.gz
        
        # Optional: Upload to S3 (requires AWS CLI configured)
        # aws s3 cp $BACKUP_DIR/db-$DATE.sql.gz s3://ffpma-backups/database/
        
        # Cleanup old backups (keep 30 days)
        find $BACKUP_DIR -name "db-*.sql.gz" -mtime +30 -delete
        echo "[$(date)] ✅ Cleaned up backups older than 30 days" >> $LOG_FILE
    else
        echo "[$(date)] ❌ Backup integrity check FAILED" >> $LOG_FILE
        # Alert via WhatsApp or email
        exit 1
    fi
else
    echo "[$(date)] ❌ Database dump FAILED" >> $LOG_FILE
    # Alert via WhatsApp or email
    exit 1
fi

echo "[$(date)] Backup complete" >> $LOG_FILE
