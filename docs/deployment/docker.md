# Docker Deployment

Run DragonClaw in a container with resource limits, health checks, and automatic restarts.

## Quick Start

```bash
# Clone and configure
git clone https://github.com/draguris/dragonclaw.git
cd dragonclaw
cp .env.example .env
nano .env   # Add your API keys

# Start
docker-compose up -d
```

## docker-compose.yml

The included `docker-compose.yml` provides:

- **Resource limits**: 512MB RAM, 1 CPU core
- **Restart policy**: `unless-stopped`
- **Log rotation**: 10MB max per file, 5 files retained
- **Health check**: every 30s, hits `/health` endpoint
- **Localhost binding**: port 18789 only on 127.0.0.1
- **Persistent volume**: `dragonclaw-data` for memory DB

## Environment Variables

All secrets are passed via environment variables — never baked into the image:

```bash
# .env file
DRAGONCLAW_LLM_PROVIDER=deepseek
DRAGONCLAW_LLM_API_KEY=sk-your-key
DRAGONCLAW_GATEWAY_TOKEN=your-generated-token
BINANCE_API_KEY=optional
BINANCE_API_SECRET=optional
TELEGRAM_BOT_TOKEN=optional
```

## Building the Image

```bash
docker build -t dragonclaw:latest .
```

The Dockerfile uses a multi-stage build:
1. **Builder stage** — installs npm dependencies
2. **Runtime stage** — slim Node 22 image, non-root `dragonclaw` user, copies only what's needed

Final image is approximately 180MB.

## Useful Commands

```bash
docker-compose up -d          # start
docker-compose down           # stop
docker-compose logs -f        # live logs
docker-compose restart        # restart
docker exec -it dragonclaw node src/cli.js doctor  # health check
docker exec -it dragonclaw node src/cli.js skills  # list skills
```

## With Nginx

If running behind Nginx (recommended for production), the `docker-compose.yml` already binds to `127.0.0.1:18789`. Use the provided `deploy/nginx-dragonclaw.conf` to proxy requests.

## Data Persistence

The `dragonclaw-data` Docker volume stores:
- `memory.db` — SQLite memory database
- `.env` — environment config

To back up:

```bash
docker run --rm -v dragonclaw-data:/data -v $(pwd):/backup alpine tar czf /backup/dragonclaw-backup.tar.gz /data
```

To restore:

```bash
docker run --rm -v dragonclaw-data:/data -v $(pwd):/backup alpine tar xzf /backup/dragonclaw-backup.tar.gz -C /
```
