#!/bin/bash
# Fail2ban Installation and Configuration Script
# Protects against brute-force attacks

echo "🛡️  Fail2ban Installation Starting..."

if command -v fail2ban-client &> /dev/null; then
    echo "ℹ️  Fail2ban already installed. Updating configuration..."
else
    echo "Installing fail2ban..."
    apt-get update -qq
    apt-get install fail2ban -y -qq
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install fail2ban"
        exit 1
    fi
fi

JAIL_CONF="/etc/fail2ban/jail.local"

cp "$JAIL_CONF" "${JAIL_CONF}.backup.$(date +%Y%m%d)" 2>/dev/null

cat > "$JAIL_CONF" << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = security@ffpma.com
action = %(action_mwl)s
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
port = http,https
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-login]
enabled = true
port = http,https
filter = nginx-login
logpath = /var/log/nginx/access.log
maxretry = 5
bantime = 1800
EOF

systemctl enable fail2ban
systemctl restart fail2ban

if [ $? -eq 0 ]; then
    echo "✅ Fail2ban installed and configured"
    echo ""
    fail2ban-client status
    echo ""
    echo "Configured jails:"
    echo "  - sshd (port 2222, 3 retries, 24h ban)"
    echo "  - nginx-http-auth (5 retries, 1h ban)"
    echo "  - nginx-noscript (6 retries, 1h ban)"
    echo "  - nginx-badbots (2 retries, 1h ban)"
    echo "  - nginx-login (5 retries, 30m ban)"
    echo ""
    echo "Monitor with: fail2ban-client status sshd"
else
    echo "❌ Failed to start fail2ban"
    exit 1
fi
