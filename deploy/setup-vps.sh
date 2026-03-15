#!/usr/bin/env bash
set -euo pipefail

# ══════════════════════════════════════════════
# DragonClaw 龙爪 — VPS Deployment Script
# 
# Target: 148.230.109.110 / dragonclaw.asia
# 
# This script:
# 1. Installs Node 22 (if not present)
# 2. Installs PM2 (process manager)
# 3. Creates /opt/dragonclaw (isolated from other sites)
# 4. Deploys the application
# 5. Sets up Nginx vhost (does NOT touch other site configs)
# 6. Gets SSL certificate via Certbot
# 7. Starts the application via PM2
#
# Run as root or with sudo:
#   bash deploy/setup-vps.sh
# ══════════════════════════════════════════════

DOMAIN="dragonclaw.asia"
APP_DIR="/opt/dragonclaw"
DATA_DIR="/var/lib/dragonclaw"
LOG_DIR="/var/log/dragonclaw"
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}"
USER="dragonclaw"

echo ""
echo "  🐉 DragonClaw VPS Deployment"
echo "  ═══════════════════════════════"
echo "  Domain:  ${DOMAIN}"
echo "  App dir: ${APP_DIR}"
echo "  Data:    ${DATA_DIR}"
echo ""

# ── 1. System user (non-root, no login) ──
if ! id "${USER}" &>/dev/null; then
  echo "  [1/8] Creating system user: ${USER}"
  useradd -r -m -d "${DATA_DIR}" -s /usr/sbin/nologin "${USER}"
else
  echo "  [1/8] User ${USER} already exists"
fi

# ── 2. Node.js 22 ──
if ! command -v node &>/dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 20 ]; then
  echo "  [2/8] Installing Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
else
  echo "  [2/8] Node.js $(node -v) already installed"
fi

# ── 3. PM2 ──
if ! command -v pm2 &>/dev/null; then
  echo "  [3/8] Installing PM2..."
  npm install -g pm2
  pm2 install pm2-logrotate
  pm2 startup systemd -u root --hp /root 2>/dev/null || true
else
  echo "  [3/8] PM2 already installed"
fi

# ── 4. Deploy application ──
echo "  [4/8] Deploying application to ${APP_DIR}..."
mkdir -p "${APP_DIR}" "${DATA_DIR}" "${LOG_DIR}"

# Copy files (preserving structure)
if [ -d "$(pwd)/src" ]; then
  # Running from project root
  cp -r src config package.json ecosystem.config.cjs "${APP_DIR}/"
  cp -r web "${APP_DIR}/" 2>/dev/null || true
else
  echo "  ERROR: Run this script from the DragonClaw project root."
  exit 1
fi

# Install production dependencies
cd "${APP_DIR}"
npm install --production --ignore-scripts 2>/dev/null

# Set ownership
chown -R "${USER}:${USER}" "${APP_DIR}" "${DATA_DIR}" "${LOG_DIR}"
chmod 750 "${DATA_DIR}"

echo "  ✓ Application deployed"

# ── 5. Environment file ──
ENV_FILE="${DATA_DIR}/.env"
if [ ! -f "${ENV_FILE}" ]; then
  echo "  [5/8] Creating .env template..."
  GATEWAY_TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  cat > "${ENV_FILE}" << EOF
# DragonClaw Production Environment
# Edit this file with your real API keys

DRAGONCLAW_LLM_PROVIDER=deepseek
DRAGONCLAW_LLM_API_KEY=YOUR_KEY_HERE
DRAGONCLAW_GATEWAY_TOKEN=${GATEWAY_TOKEN}
BINANCE_API_KEY=
BINANCE_API_SECRET=
TELEGRAM_BOT_TOKEN=
LOG_LEVEL=info
EOF
  chown "${USER}:${USER}" "${ENV_FILE}"
  chmod 600 "${ENV_FILE}"
  echo "  ✓ .env created at ${ENV_FILE}"
  echo "  ⚠ IMPORTANT: Edit ${ENV_FILE} and add your LLM API key!"
else
  echo "  [5/8] .env already exists, skipping"
fi

# Symlink .env into app dir so PM2 picks it up
ln -sf "${ENV_FILE}" "${APP_DIR}/.env"

# ── 6. Nginx ──
echo "  [6/8] Configuring Nginx..."

# Ensure Nginx is installed
if ! command -v nginx &>/dev/null; then
  apt-get install -y nginx
fi

# Create certbot webroot
mkdir -p /var/www/certbot

# Write config (initially without SSL for certbot challenge)
cat > "${NGINX_CONF}" << 'NGINX_TEMP'
server {
    listen 80;
    listen [::]:80;
    server_name dragonclaw.asia www.dragonclaw.asia;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }

    location / {
        root /opt/dragonclaw/web;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
NGINX_TEMP

# Enable site (only if not already enabled)
if [ ! -L "/etc/nginx/sites-enabled/${DOMAIN}" ]; then
  ln -sf "${NGINX_CONF}" "/etc/nginx/sites-enabled/${DOMAIN}"
fi

# Test and reload
nginx -t && systemctl reload nginx
echo "  ✓ Nginx configured (HTTP only, pre-SSL)"

# ── 7. SSL Certificate ──
echo "  [7/8] Setting up SSL..."

if ! command -v certbot &>/dev/null; then
  apt-get install -y certbot python3-certbot-nginx
fi

if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  echo "  Requesting certificate for ${DOMAIN}..."
  certbot certonly --webroot -w /var/www/certbot \
    -d "${DOMAIN}" -d "www.${DOMAIN}" \
    --non-interactive --agree-tos \
    --email "admin@${DOMAIN}" \
    --cert-name "${DOMAIN}" || {
    echo "  ⚠ Certbot failed. Make sure DNS A record points to this server."
    echo "  ⚠ You can run certbot manually later."
    echo "  Continuing with HTTP only..."
  }
fi

# If cert exists, install the full SSL config
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  cp deploy/nginx-dragonclaw.conf "${NGINX_CONF}"
  nginx -t && systemctl reload nginx
  echo "  ✓ SSL configured"

  # Auto-renew cron (certbot usually adds this, but be safe)
  if ! crontab -l 2>/dev/null | grep -q certbot; then
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
  fi
else
  echo "  ⚠ Skipped SSL — site available on HTTP only"
fi

# ── 8. Start with PM2 ──
echo "  [8/8] Starting DragonClaw..."

# Load env vars for PM2
set -a
source "${ENV_FILE}" 2>/dev/null || true
set +a

cd "${APP_DIR}"

# Stop existing instance if running
pm2 delete dragonclaw 2>/dev/null || true

# Start fresh
pm2 start ecosystem.config.cjs --env production
pm2 save

echo ""
echo "  ═══════════════════════════════════════"
echo "  ✓ DragonClaw deployed successfully!"
echo ""
echo "  Website:   https://${DOMAIN}"
echo "  API:       https://${DOMAIN}/api/health"
echo "  WebSocket: wss://${DOMAIN}/ws"
echo ""
echo "  Management commands:"
echo "    pm2 status              # check status"
echo "    pm2 logs dragonclaw     # view logs"
echo "    pm2 restart dragonclaw  # restart"
echo "    pm2 monit               # live dashboard"
echo ""
echo "  NEXT STEPS:"
echo "    1. Edit ${ENV_FILE}"
echo "       - Set DRAGONCLAW_LLM_API_KEY to your DeepSeek/Qwen key"
echo "       - Optionally add BINANCE_API_KEY / TELEGRAM_BOT_TOKEN"
echo "    2. Restart: pm2 restart dragonclaw"
echo "    3. Test: curl https://${DOMAIN}/api/health"
echo ""
echo "  🐉 龙爪已就位。"
echo ""
