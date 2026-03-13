#!/bin/bash
# Automated File Backup Script
# Run via cron: 0 4 * * * /root/scripts/backup-files.sh

DATE=$(date +%Y-%m-%d-%H%M%S)
BACKUP_DIR="/root/backups"
APP_DIR="/root/allio-v1"
LOG_FILE="/var/log/backups.log"

mkdir -p $BACKUP_DIR

echo "[$(date)] Starting file backup..." >> $LOG_FILE

if [ ! -d "$APP_DIR" ]; then
    echo "[$(date)] ❌ Application directory $APP_DIR not found" >> $LOG_FILE
    exit 1
fi

tar -czf $BACKUP_DIR/allio-$DATE.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude='*.log' \
  --exclude=tmp \
  $APP_DIR/ 2>> $LOG_FILE

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h $BACKUP_DIR/allio-$DATE.tar.gz | cut -f1)
    echo "[$(date)] ✅ File backup successful: allio-$DATE.tar.gz ($BACKUP_SIZE)" >> $LOG_FILE

    tar -tzf $BACKUP_DIR/allio-$DATE.tar.gz > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "[$(date)] ✅ Backup integrity verified" >> $LOG_FILE
    else
        echo "[$(date)] ❌ Backup integrity check FAILED" >> $LOG_FILE
        exit 1
    fi

    find $BACKUP_DIR -name "allio-*.tar.gz" -mtime +30 -delete
    find $BACKUP_DIR -name "allio-*.tar.gz.gpg" -mtime +30 -delete
    echo "[$(date)] ✅ Cleaned up backups older than 30 days" >> $LOG_FILE
else
    echo "[$(date)] ❌ File backup FAILED" >> $LOG_FILE
    exit 1
fi

echo "[$(date)] File backup complete" >> $LOG_FILE
