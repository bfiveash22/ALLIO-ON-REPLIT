#!/bin/bash
# Cloudflare Proxy Setup Script
# Configures Nginx to only accept traffic from Cloudflare IPs

echo "☁️  Cloudflare Setup Starting..."

NGINX_CONF="/etc/nginx/conf.d/cloudflare.conf"
CF_IPS_URL="https://www.cloudflare.com/ips-v4"
CF_IPS6_URL="https://www.cloudflare.com/ips-v6"

if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx is not installed. Install it first."
    exit 1
fi

cp "$NGINX_CONF" "${NGINX_CONF}.backup.$(date +%Y%m%d)" 2>/dev/null

echo "Fetching Cloudflare IP ranges..."
CF_IPV4=$(curl -s "$CF_IPS_URL")
CF_IPV6=$(curl -s "$CF_IPS6_URL")

if [ -z "$CF_IPV4" ]; then
    echo "❌ Failed to fetch Cloudflare IPs. Check network."
    exit 1
fi

cat > "$NGINX_CONF" << 'CONF_HEADER'
# Cloudflare IP allowlist - Auto-generated
# Only allow traffic from Cloudflare proxy IPs

geo $realip_remote_addr $cloudflare_ip {
    default 0;
CONF_HEADER

echo "$CF_IPV4" | while read -r ip; do
    [ -n "$ip" ] && echo "    $ip 1;" >> "$NGINX_CONF"
done

echo "$CF_IPV6" | while read -r ip; do
    [ -n "$ip" ] && echo "    $ip 1;" >> "$NGINX_CONF"
done

echo "}" >> "$NGINX_CONF"

cat >> "$NGINX_CONF" << 'CONF_FOOTER'

# Map to block non-Cloudflare traffic
# Add to each server block:
#   if ($cloudflare_ip = 0) {
#       return 444;
#   }

# Set real IP from Cloudflare header
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 131.0.72.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
real_ip_header CF-Connecting-IP;
CONF_FOOTER

nginx -t
if [ $? -eq 0 ]; then
    echo "✅ Nginx config valid"
    echo "Run 'systemctl reload nginx' to apply changes"
    echo ""
    echo "Next steps:"
    echo "  1. Add ffpma.com to Cloudflare (free tier)"
    echo "  2. Update DNS nameservers to Cloudflare"
    echo "  3. Set SSL/TLS mode to 'Full (strict)'"
    echo "  4. Enable WAF rules"
    echo "  5. Configure page rules for /admin/* and /api/*"
else
    echo "❌ Nginx config test failed. Restoring backup."
    mv "${NGINX_CONF}.backup.$(date +%Y%m%d)" "$NGINX_CONF" 2>/dev/null
    exit 1
fi
