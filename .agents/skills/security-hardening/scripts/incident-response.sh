#!/bin/bash
# Emergency Incident Response Script
# Use during active security incidents

echo "🚨 INCIDENT RESPONSE ACTIVATED"
echo "==============================="
echo "Time: $(date)"
echo ""

LOG_DIR="/root/incident-$(date +%Y%m%d-%H%M%S)"
mkdir -p $LOG_DIR

echo "📁 Evidence collection directory: $LOG_DIR"
echo ""

collect_evidence() {
    echo "--- Phase 1: Evidence Collection ---"

    echo "Capturing network connections..."
    ss -tunapl > $LOG_DIR/network-connections.txt 2>&1
    netstat -tlnp > $LOG_DIR/listening-ports.txt 2>&1

    echo "Capturing active processes..."
    ps auxf > $LOG_DIR/processes.txt 2>&1
    top -bn1 > $LOG_DIR/system-load.txt 2>&1

    echo "Capturing auth logs..."
    cp /var/log/auth.log $LOG_DIR/auth.log 2>/dev/null
    tail -500 /var/log/auth.log > $LOG_DIR/auth-recent.log 2>/dev/null

    echo "Capturing syslog..."
    tail -1000 /var/log/syslog > $LOG_DIR/syslog-recent.log 2>/dev/null

    echo "Capturing nginx logs..."
    tail -1000 /var/log/nginx/access.log > $LOG_DIR/nginx-access-recent.log 2>/dev/null
    tail -500 /var/log/nginx/error.log > $LOG_DIR/nginx-error-recent.log 2>/dev/null

    echo "Capturing fail2ban status..."
    fail2ban-client status > $LOG_DIR/fail2ban-status.txt 2>&1
    fail2ban-client status sshd > $LOG_DIR/fail2ban-sshd.txt 2>&1

    echo "Capturing recent logins..."
    last -50 > $LOG_DIR/recent-logins.txt 2>&1
    lastb -50 > $LOG_DIR/failed-logins.txt 2>&1

    echo "Capturing crontab entries..."
    crontab -l > $LOG_DIR/crontab.txt 2>&1
    ls -la /etc/cron.d/ > $LOG_DIR/cron-d.txt 2>&1

    echo "Checking for suspicious files..."
    find /tmp -type f -mtime -1 -ls > $LOG_DIR/tmp-recent-files.txt 2>&1
    find /root -name "*.sh" -mtime -1 -ls > $LOG_DIR/recent-scripts.txt 2>&1

    echo "✅ Evidence collected in $LOG_DIR"
    echo ""
}

analyze_threats() {
    echo "--- Phase 2: Threat Analysis ---"

    echo "Checking for brute force attempts..."
    FAILED_SSH=$(grep -c "Failed password" /var/log/auth.log 2>/dev/null)
    echo "  Failed SSH attempts: ${FAILED_SSH:-0}"

    echo "Checking for unauthorized access..."
    ACCEPTED=$(grep "Accepted" /var/log/auth.log 2>/dev/null | tail -10)
    if [ -n "$ACCEPTED" ]; then
        echo "  Recent successful logins:"
        echo "$ACCEPTED" | while read -r line; do
            echo "    $line"
        done
    fi

    echo "Checking for suspicious processes..."
    CRYPTO_MINERS=$(ps aux | grep -iE "(mine|xmr|monero|crypto)" | grep -v grep)
    if [ -n "$CRYPTO_MINERS" ]; then
        echo "  ⚠️  ALERT: Possible crypto miner detected!"
        echo "$CRYPTO_MINERS" >> $LOG_DIR/suspicious-processes.txt
    else
        echo "  ✅ No suspicious processes detected"
    fi

    echo "Checking for modified system files..."
    if command -v debsums &> /dev/null; then
        debsums -c 2>/dev/null > $LOG_DIR/modified-packages.txt
    fi

    echo ""
}

containment() {
    echo "--- Phase 3: Containment Options ---"
    echo ""
    echo "Available containment actions (run manually as needed):"
    echo ""
    echo "  1. Block specific IP:"
    echo "     ufw deny from <IP_ADDRESS>"
    echo ""
    echo "  2. Enable Cloudflare Under Attack Mode:"
    echo "     Log into Cloudflare dashboard → Security → Under Attack Mode"
    echo ""
    echo "  3. Force logout all sessions:"
    echo "     pkill -u <username>"
    echo ""
    echo "  4. Rotate credentials:"
    echo "     - Change DATABASE_URL password"
    echo "     - Regenerate SESSION_SECRET"
    echo "     - Rotate API keys"
    echo ""
    echo "  5. Emergency network isolation:"
    echo "     ufw default deny incoming && ufw default deny outgoing"
    echo "     (WARNING: This will cut ALL network access)"
    echo ""
}

collect_evidence
analyze_threats
containment

echo "==============================="
echo "INCIDENT RESPONSE SUMMARY"
echo "Evidence saved to: $LOG_DIR"
echo ""
echo "Next steps:"
echo "  1. Review evidence in $LOG_DIR"
echo "  2. Determine scope of breach"
echo "  3. Apply containment measures"
echo "  4. Notify affected parties (if data breach)"
echo "  5. Restore from clean backup if needed"
echo "  6. Conduct post-mortem"
echo "==============================="
