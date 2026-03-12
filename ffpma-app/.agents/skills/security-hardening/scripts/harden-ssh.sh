#!/bin/bash
# SSH Security Hardening Script
# Run as root

echo "🔒 SSH Security Hardening Starting..."

# Backup original config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d)

# Disable password authentication
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#*ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' /etc/ssh/sshd_config

# Disable root login
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config

# Change SSH port to 2222
sed -i 's/^#*Port.*/Port 2222/' /etc/ssh/sshd_config

# Set login grace time
grep -q "^LoginGraceTime" /etc/ssh/sshd_config || echo "LoginGraceTime 30" >> /etc/ssh/sshd_config
sed -i 's/^#*LoginGraceTime.*/LoginGraceTime 30/' /etc/ssh/sshd_config

# Max auth tries
grep -q "^MaxAuthTries" /etc/ssh/sshd_config || echo "MaxAuthTries 3" >> /etc/ssh/sshd_config
sed -i 's/^#*MaxAuthTries.*/MaxAuthTries 3/' /etc/ssh/sshd_config

# Protocol 2 only
grep -q "^Protocol" /etc/ssh/sshd_config || echo "Protocol 2" >> /etc/ssh/sshd_config

# Test config
sshd -t
if [ $? -eq 0 ]; then
    echo "✅ SSH config valid"
    echo "⚠️  SSH will restart. Make sure you have an SSH key configured!"
    echo "Press Ctrl+C to cancel, or wait 10 seconds to continue..."
    sleep 10
    systemctl restart sshd
    echo "✅ SSH hardened successfully"
    echo "   New port: 2222"
    echo "   Password auth: disabled"
    echo "   Root login: disabled"
else
    echo "❌ SSH config test failed. Restoring backup."
    mv /etc/ssh/sshd_config.backup.$(date +%Y%m%d) /etc/ssh/sshd_config
    exit 1
fi
