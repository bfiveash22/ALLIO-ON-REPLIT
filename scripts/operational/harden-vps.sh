#!/bin/bash
# Operation Ironclad: VPS Security Hardening Script
set -e

echo "Starting Security Hardening..."

# Install fail2ban if not present
apt-get update
apt-get install -y fail2ban

# Configure fail2ban
cat << 'EOF' > /etc/fail2ban/jail.local
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10
EOF

systemctl restart fail2ban
echo "fail2ban installed and configured."

# Add Nginx rate limiting rules to the main conf file
NGINX_CONF="/etc/nginx/sites-available/ffpma.com"
if ! grep -q "limit_req_zone \$binary_remote_addr" "$NGINX_CONF"; then
    echo "Adding Nginx rate limits..."
    
    # We'll inject the limit_req_zone before the server blocks
    sed -i '1i limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;' "$NGINX_CONF"
    
    # Add rate limiting to /api/ routes
    # Find the location / block and insert limit_req for /api/ before it
    sed -i '/location \/ {/i \    location /api/ {\n        limit_req zone=api_limit burst=20 nodelay;\n        proxy_pass http://localhost:5000;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade \$http_upgrade;\n        proxy_set_header Connection "upgrade";\n        proxy_set_header Host \$host;\n        proxy_cache_bypass \$http_upgrade;\n    }\n' "$NGINX_CONF"
    
    nginx -t && systemctl reload nginx
    echo "Nginx rate limits applied."
else
    echo "Nginx rate limits already exist."
fi

echo "Security Hardening Complete."
