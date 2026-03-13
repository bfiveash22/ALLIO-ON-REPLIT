#!/bin/bash
# Automated Security Audit Script
# Checks system security posture and reports findings

echo "🔍 SECURITY AUDIT STARTING..."
echo "=============================="
echo "Date: $(date)"
echo ""

PASS=0
WARN=0
FAIL=0

check_pass() { echo "  ✅ PASS: $1"; PASS=$((PASS + 1)); }
check_warn() { echo "  ⚠️  WARN: $1"; WARN=$((WARN + 1)); }
check_fail() { echo "  ❌ FAIL: $1"; FAIL=$((FAIL + 1)); }

echo "--- SSH Configuration ---"

if grep -q "^PasswordAuthentication no" /etc/ssh/sshd_config 2>/dev/null; then
    check_pass "Password authentication disabled"
else
    check_fail "Password authentication not disabled"
fi

if grep -q "^PermitRootLogin no" /etc/ssh/sshd_config 2>/dev/null; then
    check_pass "Root login disabled"
else
    check_fail "Root login not disabled"
fi

SSH_PORT=$(grep "^Port " /etc/ssh/sshd_config 2>/dev/null | awk '{print $2}')
if [ "$SSH_PORT" != "22" ] && [ -n "$SSH_PORT" ]; then
    check_pass "SSH on non-standard port ($SSH_PORT)"
else
    check_warn "SSH on default port 22"
fi

echo ""
echo "--- Firewall ---"

if command -v ufw &> /dev/null && ufw status | grep -q "active"; then
    check_pass "UFW firewall is active"
else
    check_fail "UFW firewall is not active"
fi

echo ""
echo "--- Fail2ban ---"

if command -v fail2ban-client &> /dev/null; then
    if systemctl is-active fail2ban &> /dev/null; then
        check_pass "Fail2ban is running"
        BANNED=$(fail2ban-client status sshd 2>/dev/null | grep "Currently banned" | awk '{print $NF}')
        [ -n "$BANNED" ] && echo "    Currently banned IPs (sshd): $BANNED"
    else
        check_fail "Fail2ban installed but not running"
    fi
else
    check_fail "Fail2ban not installed"
fi

echo ""
echo "--- System Updates ---"

if command -v apt &> /dev/null; then
    UPDATES=$(apt list --upgradable 2>/dev/null | grep -c "upgradable")
    if [ "$UPDATES" -gt 10 ]; then
        check_warn "$UPDATES packages need updating"
    elif [ "$UPDATES" -gt 0 ]; then
        check_pass "$UPDATES minor updates available"
    else
        check_pass "System is up to date"
    fi
fi

echo ""
echo "--- File Permissions ---"

if [ "$(stat -c %a /etc/ssh/sshd_config 2>/dev/null)" = "600" ]; then
    check_pass "sshd_config permissions correct (600)"
else
    check_warn "sshd_config permissions may be too open"
fi

if [ "$(stat -c %a /etc/shadow 2>/dev/null)" = "640" ] || [ "$(stat -c %a /etc/shadow 2>/dev/null)" = "600" ]; then
    check_pass "/etc/shadow permissions correct"
else
    check_warn "/etc/shadow permissions may be incorrect"
fi

echo ""
echo "--- Backups ---"

BACKUP_DIR="/root/backups"
if [ -d "$BACKUP_DIR" ]; then
    LATEST_BACKUP=$(ls -t $BACKUP_DIR/db-*.sql.gz 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "$LATEST_BACKUP")) / 3600 ))
        if [ "$BACKUP_AGE" -lt 25 ]; then
            check_pass "Database backup exists (${BACKUP_AGE}h old)"
        else
            check_warn "Database backup is ${BACKUP_AGE}h old"
        fi
    else
        check_fail "No database backups found"
    fi
else
    check_fail "Backup directory does not exist"
fi

echo ""
echo "--- TLS/SSL ---"

if command -v nginx &> /dev/null; then
    if nginx -T 2>/dev/null | grep -q "ssl_protocols TLSv1.3"; then
        check_pass "TLS 1.3 configured"
    else
        check_warn "TLS 1.3 not explicitly configured"
    fi
fi

echo ""
echo "=============================="
echo "AUDIT SUMMARY"
echo "  Passed: $PASS"
echo "  Warnings: $WARN"
echo "  Failed: $FAIL"
echo "=============================="

if [ $FAIL -gt 0 ]; then
    exit 2
elif [ $WARN -gt 0 ]; then
    exit 1
else
    exit 0
fi
