# VPS Deployment

Deploy DragonClaw on a VPS with Nginx, SSL, and PM2 process management. This guide assumes Ubuntu 22.04+ and runs alongside other websites without interference.

## What Gets Installed

| Component | Location | Purpose |
|-----------|----------|---------|
| App code | `/opt/dragonclaw` | Application files |
| Data | `/var/lib/dragonclaw` | Memory DB, config, secrets |
| Logs | `/var/log/dragonclaw` | PM2 log files |
| Nginx config | `/etc/nginx/sites-available/dragonclaw.asia` | Web server |
| PM2 process | `dragonclaw` | Process manager |
| System user | `dragonclaw` | Non-root, no shell |

Everything is isolated. Nothing touches other site configs, users, or directories.

## Automatic Deployment

The fastest path:

```bash
# Upload project to server
scp dragonclaw-production.tar.gz root@your-server:/tmp/
ssh root@your-server

# Extract and run
cd /tmp && tar xzf dragonclaw-production.tar.gz && cd dragonclaw
bash deploy/setup-vps.sh
```

The script handles: Node 22, PM2, app deployment, Nginx vhost, SSL certificate, process startup.

## Manual Step-by-Step

### 1. Install Node.js 22

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
```

### 2. Install PM2

```bash
npm install -g pm2
pm2 startup systemd
```

### 3. Create System User

```bash
useradd -r -m -d /var/lib/dragonclaw -s /usr/sbin/nologin dragonclaw
```

### 4. Deploy Application

```bash
mkdir -p /opt/dragonclaw /var/log/dragonclaw
cp -r src config package.json ecosystem.config.cjs web /opt/dragonclaw/
cd /opt/dragonclaw && npm install --production
chown -R dragonclaw:dragonclaw /opt/dragonclaw /var/lib/dragonclaw /var/log/dragonclaw
```

### 5. Configure Environment

```bash
# Generate a gateway token
TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

cat > /var/lib/dragonclaw/.env << EOF
DRAGONCLAW_LLM_PROVIDER=deepseek
DRAGONCLAW_LLM_API_KEY=sk-your-real-key
DRAGONCLAW_GATEWAY_TOKEN=${TOKEN}
LOG_LEVEL=info
EOF

chown dragonclaw:dragonclaw /var/lib/dragonclaw/.env
chmod 600 /var/lib/dragonclaw/.env
ln -sf /var/lib/dragonclaw/.env /opt/dragonclaw/.env
```

### 6. Configure Nginx

Copy `deploy/nginx-dragonclaw.conf` to `/etc/nginx/sites-available/your-domain`:

```bash
cp deploy/nginx-dragonclaw.conf /etc/nginx/sites-available/dragonclaw.asia
ln -sf /etc/nginx/sites-available/dragonclaw.asia /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 7. SSL Certificate

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d dragonclaw.asia -d www.dragonclaw.asia
```

### 8. Start with PM2

```bash
cd /opt/dragonclaw
source /var/lib/dragonclaw/.env
pm2 start ecosystem.config.cjs
pm2 save
```

## URLs After Deployment

| URL | Purpose |
|-----|---------|
| `https://dragonclaw.asia` | Landing page (static) |
| `https://dragonclaw.asia/api/health` | Health check |
| `https://dragonclaw.asia/api/message` | Send message (POST) |
| `https://dragonclaw.asia/api/skills` | List skills (GET) |
| `wss://dragonclaw.asia/ws` | WebSocket |

## Updating

After code changes:

```bash
cd /path/to/dragonclaw
bash deploy/update.sh
```

This copies new files to `/opt/dragonclaw` and restarts PM2.

## Monitoring

```bash
pm2 status                  # process status
pm2 logs dragonclaw         # live logs
pm2 monit                   # live dashboard
pm2 logs dragonclaw --lines 100  # last 100 lines

# Health check
curl -s https://dragonclaw.asia/api/health | jq .
```

## Coexistence with Other Sites

DragonClaw's Nginx config only declares `server_name dragonclaw.asia`. It does not modify:
- The default server block
- Any other `sites-enabled` configs
- Any shared Nginx settings

The backend binds to `127.0.0.1:18789` (localhost only). It cannot be accessed directly from the internet. Only Nginx proxies requests to it.

The `dragonclaw` system user has no shell access and owns only its own directories. It cannot read or write other sites' files.
