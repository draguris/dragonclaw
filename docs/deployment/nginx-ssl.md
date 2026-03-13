# Nginx & SSL

DragonClaw ships with a production Nginx config that serves both the static landing page and proxies the backend API.

## What Nginx Does

```
Internet → Nginx (443/SSL) → /           → Static HTML (landing page)
                            → /api/*      → DragonClaw backend (127.0.0.1:18789)
                            → /ws         → WebSocket proxy
                            → /health     → Health check (no auth)
```

## Config Location

```
/etc/nginx/sites-available/dragonclaw.asia
/etc/nginx/sites-enabled/dragonclaw.asia  → symlink
```

## Key Features

- **HTTP→HTTPS redirect** — all HTTP traffic redirected to HTTPS
- **TLS 1.2+** — modern cipher suite, HSTS header
- **Rate limiting** — 30 req/min for API, 60 req/min for web
- **WebSocket proxy** — 24-hour timeout for persistent connections
- **Gzip** — compresses HTML, CSS, JS, JSON, SVG
- **Static asset caching** — 7-day cache for CSS/JS/images
- **Scanner blocking** — returns 444 for wp-admin, phpmyadmin probes

## SSL Certificate

Managed by Certbot (Let's Encrypt):

```bash
# Initial setup
certbot certonly --webroot -w /var/www/certbot \
  -d dragonclaw.asia -d www.dragonclaw.asia \
  --non-interactive --agree-tos --email admin@dragonclaw.asia

# Auto-renewal (added by setup script)
# Cron: 0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'
```

## Coexistence

The config declares `server_name dragonclaw.asia www.dragonclaw.asia` only. It does not use `default_server` and does not modify any global Nginx settings. Other sites in `sites-enabled/` are unaffected.

## Testing

```bash
nginx -t                  # validate config syntax
systemctl reload nginx    # apply changes
curl -I https://dragonclaw.asia  # check headers
```

## Adding Connector Callbacks

If you use DingTalk or Feishu, add proxy blocks for their callback ports:

```nginx
# DingTalk callback
location /dingtalk/callback {
    proxy_pass http://127.0.0.1:18790;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# Feishu events
location /feishu/events {
    proxy_pass http://127.0.0.1:18791;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Then reload: `nginx -t && systemctl reload nginx`
