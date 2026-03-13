# Monitoring & Logs

## Log Format

DragonClaw outputs structured JSON logs — one JSON object per line:

```json
{"ts":"2026-03-13T10:23:45.123Z","level":"info","module":"llm","msg":"LLM complete","provider":"deepseek","elapsed":2341,"chars":856}
```

Fields:
- `ts` — ISO 8601 timestamp
- `level` — `debug`, `info`, `warn`, `error`, `fatal`
- `module` — which subsystem emitted the log (`llm`, `gateway`, `memory`, `dragonclaw`)
- `msg` — human-readable message
- Additional fields vary per event

## Viewing Logs

### PM2

```bash
pm2 logs dragonclaw              # live stream
pm2 logs dragonclaw --lines 50   # last 50 lines
pm2 logs dragonclaw --err        # errors only
```

Log files:
- `/var/log/dragonclaw/out.log` — stdout (info+)
- `/var/log/dragonclaw/error.log` — stderr (error+)

### Docker

```bash
docker-compose logs -f           # live stream
docker-compose logs --tail 50    # last 50 lines
```

### Log Level

Set via environment variable:

```bash
LOG_LEVEL=debug    # everything (verbose, for development)
LOG_LEVEL=info     # normal operations (default)
LOG_LEVEL=warn     # warnings and errors only
LOG_LEVEL=error    # errors only (production minimal)
```

## Health Check

```bash
curl -s https://dragonclaw.asia/api/health | jq .
```

Response:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "uptime": 86400,
  "memory": "45MB",
  "skills": { "core": 7, "user": 0 },
  "connectors": ["telegram"]
}
```

Monitor this endpoint with your preferred uptime service (UptimeRobot, Better Stack, etc.).

## PM2 Monitoring

```bash
pm2 monit              # live CPU/RAM/logs dashboard
pm2 status             # process table
pm2 describe dragonclaw # detailed process info
```

## Key Metrics to Watch

| Metric | Where to Find | Alert Threshold |
|--------|--------------|-----------------|
| Process alive | `pm2 status` | Status not "online" |
| Memory usage | `pm2 monit` or `/health` | > 400MB |
| Restart count | `pm2 describe dragonclaw` | > 5 in 1 hour |
| LLM latency | Log entries with `module=llm` | `elapsed` > 30000 |
| Rate limit hits | Log entries with `msg=Rate limited` | Spike in count |
| Error rate | `/var/log/dragonclaw/error.log` | Any new entries |

## Log Rotation

PM2 log rotation is configured in `deploy/pm2-logrotate.json`:
- Max 10MB per file
- Keep 10 rotated files
- Compress old logs
- Rotate daily at midnight

Install:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 10
pm2 set pm2-logrotate:compress true
```

## Alerting

For simple alerting, add a cron job that checks health:

```bash
# Check every 5 minutes, send notification if down
*/5 * * * * curl -sf https://dragonclaw.asia/api/health > /dev/null || echo "DragonClaw is down!" | mail -s "ALERT" admin@example.com
```

Or use external monitoring services — the `/health` endpoint is unauthenticated by design for this purpose.
