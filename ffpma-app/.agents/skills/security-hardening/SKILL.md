---
name: security-hardening
description: Multi-layer VPS security hardening, Allio v1 longevity solutions, firewall configuration, backup verification, and incident response playbooks. Use when implementing security measures for FFPMA.com, hardening the VPS infrastructure, configuring Cloudflare WAF, setting up automated backups, responding to security incidents, or ensuring long-term operational resilience. CRITICAL: Protect VPS with maximum diligence - this is life-or-death for FFPMA operations.
---

# Security Hardening

**MISSION:** Protect FFPMA.com VPS infrastructure with bank-level security. Member data, patient protocols, and PMA operations depend on this system. Failure is not an option.

## Security Philosophy

**Defense in Depth:** 7 layers of security, so an attacker must breach ALL layers to succeed.

**Assume Breach:** Design every layer assuming attackers bypass previous ones.

**Fail Secure:** System defaults to locked-down state on errors.

**Least Privilege:** Every process, user, and agent gets minimum required access.

**Immutable Backups:** Even root can't delete backups (protection against ransomware).

## Layer 1: Network Security (Perimeter Defense)

### Cloudflare Proxy Setup

**Purpose:** Hide origin IP, block DDoS, filter malicious traffic

**Configuration:**
```bash
# 1. Add ffpma.com to Cloudflare account (free tier)
# 2. Update DNS to Cloudflare nameservers
# 3. Set SSL/TLS mode to "Full (strict)"
# 4. Enable "Under Attack Mode" (challenge page for bots)

# 5. Configure Page Rules:
# - www.ffpma.com/* → Redirect to https://ffpma.com/
# - ffpma.com/admin/* → Security Level: High
# - ffpma.com/api/* → Rate Limit: 100 req/min

# 6. Enable WAF (Web Application Firewall)
# - OWASP ModSecurity Core Rule Set
# - Block SQL injection, XSS, path traversal
# - Custom rules for known attack patterns
```

**Nginx Configuration (origin server):**
```nginx
# Allow ONLY Cloudflare IPs
# Drop all other traffic

geo $realip_remote_addr $cloudflare_ip {
    default 0;
    # Cloudflare IPv4 ranges
    103.21.244.0/22 1;
    103.22.200.0/22 1;
    103.31.4.0/22 1;
    # ... (full list in references/cloudflare-ips.txt)
}

server {
    listen 80;
    server_name ffpma.com;
    
    if ($cloudflare_ip = 0) {
        return 444; # Drop connection
    }
    
    # Rest of config...
}
```

### Firewall Rules (UFW)

```bash
# Reset firewall
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (key-only, port 2222)
ufw allow 2222/tcp

# Allow HTTP/HTTPS (only from Cloudflare)
ufw allow from 173.245.48.0/20 to any port 80
ufw allow from 173.245.48.0/20 to any port 443
# (Add all Cloudflare IP ranges - see references/)

# Enable firewall
ufw enable

# Verify
ufw status verbose
```

## Layer 2: Application Security

### CSRF Protection

**Implementation:**
```javascript
import csrf from 'csrf-sync';

const { csrfSynchronisedProtection } = csrf({
  getTokenFromRequest: (req) => req.body._csrf,
});

app.use(csrfSynchronisedProtection);

// Add to all forms:
// <input type="hidden" name="_csrf" value="{csrfToken}">
```

### Security Headers

```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Minimize inline scripts
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Additional headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  next();
});
```

### Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

// General pages
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});

// Authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true,
});

app.use('/', generalLimiter);
app.use('/api/auth/login', authLimiter);
```

## Layer 3: Authentication & Authorization

### 2FA (Two-Factor Authentication)

**Setup for Trustee Account:**
```javascript
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

// Generate secret
const secret = speakeasy.generateSecret({
  name: 'FFPMA (Trustee)',
});

// Generate QR code
const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

// Store secret.base32 encrypted in database

// Verify token
const verified = speakeasy.totp.verify({
  secret: user.twoFactorSecret,
  encoding: 'base32',
  token: userProvidedToken,
  window: 1, // Allow 30s clock drift
});
```

### Session Security

```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true, // No JavaScript access
    sameSite: 'strict', // CSRF protection
    maxAge: 30 * 60 * 1000, // 30 minutes
  },
  store: new RedisStore({}), // Use Redis, not in-memory
}));
```

## Layer 4: Data Security

### Database Encryption at Rest

**Neon PostgreSQL** (already supports encryption at rest)

**Additional PII Encryption:**
```javascript
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText) {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Encrypt PII before storing
user.email = encrypt(user.email);
user.phone = encrypt(user.phone);
```

### TLS 1.3 Configuration

**Nginx SSL Config:**
```nginx
ssl_protocols TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256';
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;
```

## Layer 5: Infrastructure Security

### SSH Hardening

```bash
# 1. Disable password authentication
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# 2. Disable root login
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# 3. Change SSH port
sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config

# 4. Set login grace time
echo "LoginGraceTime 30" >> /etc/ssh/sshd_config

# 5. Max auth tries
echo "MaxAuthTries 3" >> /etc/ssh/sshd_config

# 6. SSH protocol 2 only
echo "Protocol 2" >> /etc/ssh/sshd_config

# Restart SSH
systemctl restart sshd
```

### Fail2ban Configuration

```bash
# Install
apt-get install fail2ban -y

# Configure /etc/fail2ban/jail.local
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = security@ffpma.com
action = %(action_mwl)s

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
EOF

# Start fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Check status
fail2ban-client status
```

### Automated System Updates

```bash
# Install unattended-upgrades
apt-get install unattended-upgrades apt-listchanges -y

# Configure /etc/apt/apt.conf.d/50unattended-upgrades
cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Mail "trustee@ffpma.com";
EOF

# Enable automatic updates
dpkg-reconfigure -plow unattended-upgrades
```

## Layer 6: Monitoring & Incident Response

### Intrusion Detection (OSSEC)

```bash
# Install OSSEC
wget -q -O - https://updates.atomicorp.com/installers/atomic | bash
yum install ossec-hids ossec-hids-server -y

# Configure /var/ossec/etc/ossec.conf
# - File integrity monitoring: /root/allio-v1/, /etc/, /var/www/
# - Log analysis: auth.log, nginx logs, syslog
# - Rootkit detection
# - Alert email: security@ffpma.com

# Start OSSEC
/var/ossec/bin/ossec-control start
```

### Log Monitoring

```bash
# Centralized logging
# Forward logs to syslog server or use Logrotate

cat > /etc/logrotate.d/allio << 'EOF'
/root/.pm2/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

### Incident Response Playbook

**Scenario 1: DDoS Attack**
1. Verify Cloudflare is proxy (orange cloud)
2. Enable "I'm Under Attack Mode" in Cloudflare
3. Monitor attack traffic in Cloudflare Analytics
4. If overwhelmed, contact Cloudflare support
5. Post-incident: Review WAF rules, tighten rate limits

**Scenario 2: Unauthorized Access Attempt**
1. Check fail2ban logs: `fail2ban-client status sshd`
2. Verify banned IPs: `fail2ban-client get sshd banned`
3. Check auth.log for patterns: `grep "Failed password" /var/log/auth.log | tail -50`
4. If successful breach suspected:
   - Rotate all credentials immediately
   - Force logout all sessions
   - Enable 2FA if not already
   - Review audit logs
   - Restore from backup if needed

**Scenario 3: Data Breach**
1. Isolate affected system (disable network if needed)
2. Preserve evidence (copy logs before they rotate)
3. Identify scope (what data was accessed?)
4. Notify affected members (GDPR: within 72 hours)
5. Restore from clean backup
6. Patch vulnerability
7. Conduct post-mortem
8. Update incident response playbook

## Layer 7: Backup & Recovery

### Automated Backups

**Database Backup Script:**
```bash
#!/bin/bash
# /root/scripts/backup-database.sh

DATE=$(date +%Y-%m-%d-%H%M%S)
BACKUP_DIR="/root/backups"
DB_NAME="neondb"
DB_CONNECTION="postgresql://neondb_owner:npg_GcYmap1rVP6I@ep-square-wildflower-a6u9shej.us-west-2.aws.neon.tech/neondb"

# Create backup
pg_dump $DB_CONNECTION | gzip > $BACKUP_DIR/db-$DATE.sql.gz

# Encrypt
gpg --encrypt --recipient trustee@ffpma.com $BACKUP_DIR/db-$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/db-$DATE.sql.gz.gpg s3://ffpma-backups/database/

# Cleanup local (keep 7 days)
find $BACKUP_DIR -name "db-*.sql.gz*" -mtime +7 -delete

# Verify backup integrity
gunzip -t $BACKUP_DIR/db-$DATE.sql.gz || echo "BACKUP FAILED" | mail -s "Backup Error" trustee@ffpma.com
```

**File Backup Script:**
```bash
#!/bin/bash
# /root/scripts/backup-files.sh

DATE=$(date +%Y-%m-%d-%H%M%S)
BACKUP_DIR="/root/backups"

# Backup Allio application
tar -czf $BACKUP_DIR/allio-$DATE.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  /root/allio-v1/

# Encrypt
gpg --encrypt --recipient trustee@ffpma.com $BACKUP_DIR/allio-$DATE.tar.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/allio-$DATE.tar.gz.gpg s3://ffpma-backups/files/

# Cleanup (keep 30 days)
find $BACKUP_DIR -name "allio-*.tar.gz*" -mtime +30 -delete
```

**Cron Schedule:**
```cron
# Database: Daily at 3 AM UTC
0 3 * * * /root/scripts/backup-database.sh

# Files: Daily at 4 AM UTC
0 4 * * * /root/scripts/backup-files.sh

# Weekly restore test: Sundays at 5 AM UTC
0 5 * * 0 /root/scripts/test-restore.sh
```

### Disaster Recovery Plan

**RTO (Recovery Time Objective):** 4 hours  
**RPO (Recovery Point Objective):** 24 hours

**Recovery Steps:**
1. Provision new VPS (same specs)
2. Install base system + dependencies
3. Restore latest backup from S3
4. Update DNS to new IP
5. Verify application functionality
6. Monitor for 24 hours

**Test Recovery Quarterly:**
- Restore to test VPS
- Verify data integrity
- Document any issues
- Update recovery procedures

## Allio v1 Longevity Solutions

### High Availability (Future)

**When to implement:** Member count >5,000 or revenue >$10k/month

**Architecture:**
- Load balancer (Nginx or HAProxy)
- 2-3 application servers (PM2 cluster mode)
- Shared PostgreSQL (Neon or Cloud SQL)
- Shared Redis (session store)
- Shared file storage (S3 or Google Cloud Storage)

**Cost:** $200-400/month  
**Benefit:** Zero downtime deployments, auto-failover

### Monitoring & Alerting

**Uptime Monitoring:**
```bash
# Use UptimeRobot (free tier)
# Monitor:
# - https://ffpma.com (HTTP 200)
# - https://ffpma.com/api/health (JSON response)
# Alert: Email + WhatsApp

# Health check endpoint
app.get('/api/health', (req, res) => {
  // Check database connection
  const dbHealthy = await checkDB();
  // Check Drive API
  const driveHealthy = await checkDrive();
  
  if (dbHealthy && driveHealthy) {
    res.status(200).json({ status: 'healthy', timestamp: Date.now() });
  } else {
    res.status(500).json({ status: 'unhealthy', db: dbHealthy, drive: driveHealthy });
  }
});
```

**Error Tracking:**
```javascript
// Use Sentry or custom error logging
app.use((err, req, res, next) => {
  console.error(err.stack);
  // Log to file
  fs.appendFileSync('/var/log/allio/errors.log', 
    `${new Date().toISOString()} ${err.stack}\n`);
  // Send critical errors to WhatsApp
  if (err.critical) {
    sendWhatsAppAlert(`Critical error: ${err.message}`);
  }
  res.status(500).send('Internal Server Error');
});
```

### Performance Optimization

**Database Connection Pooling:**
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Caching (Redis):**
```javascript
import redis from 'redis';
const cache = redis.createClient();

// Cache frequently accessed data
app.get('/api/agents', async (req, res) => {
  const cached = await cache.get('agents');
  if (cached) return res.json(JSON.parse(cached));
  
  const agents = await db.query('SELECT * FROM agent_registry');
  await cache.set('agents', JSON.stringify(agents.rows), 'EX', 300); // 5 min TTL
  res.json(agents.rows);
});
```

## Security Audit Checklist

**Monthly:**
- [ ] Review fail2ban ban list
- [ ] Check for unauthorized SSH attempts
- [ ] Verify backup integrity (restore test)
- [ ] Review Cloudflare security events
- [ ] Update all dependencies (npm audit fix)
- [ ] Review access logs for anomalies

**Quarterly:**
- [ ] Full vulnerability scan (OWASP ZAP)
- [ ] Penetration test (BugCrowd or hire red team)
- [ ] Review and update firewall rules
- [ ] Rotate API keys and secrets
- [ ] Disaster recovery drill
- [ ] Security awareness training (if team grows)

**Annually:**
- [ ] Review and update security policies
- [ ] Third-party security audit
- [ ] Compliance review (GDPR/CCPA)
- [ ] Update incident response playbook
- [ ] Review and renew SSL certificates

## References

See `references/` directory for:
- Cloudflare IP ranges (`cloudflare-ips.txt`)
- Security best practices (`owasp-top-10.md`)
- Incident response templates (`incident-response.md`)
- Compliance checklists (`gdpr-ccpa.md`)

## Scripts

See `scripts/` directory for:
- `setup-cloudflare.sh` - Automated Cloudflare setup
- `harden-ssh.sh` - SSH security hardening
- `install-fail2ban.sh` - Fail2ban deployment
- `backup-database.sh` - Database backup automation
- `backup-files.sh` - File backup automation
- `test-restore.sh` - Restore verification
- `security-audit.sh` - Automated security checks
- `incident-response.sh` - Emergency response automation
