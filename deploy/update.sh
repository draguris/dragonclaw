#!/usr/bin/env bash
set -euo pipefail

# DragonClaw — Quick Update Script
# Deploys code changes without re-running full setup.
# Run from project root: bash deploy/update.sh

APP_DIR="/opt/dragonclaw"
USER="dragonclaw"

echo "  🐉 Updating DragonClaw..."

# Copy updated source files
cp -r src config package.json ecosystem.config.cjs "${APP_DIR}/"
cp -r web "${APP_DIR}/" 2>/dev/null || true

# Reinstall deps if package.json changed
cd "${APP_DIR}"
npm install --production --ignore-scripts 2>/dev/null

# Fix ownership
chown -R "${USER}:${USER}" "${APP_DIR}"

# Restart
pm2 restart dragonclaw

echo "  ✓ Updated and restarted"
echo "  Check: pm2 logs dragonclaw --lines 20"
