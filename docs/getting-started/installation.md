# Installation

## System Requirements

| Requirement | Minimum | Recommended |
|------------|---------|-------------|
| Node.js | 20.0+ | 22.x |
| RAM | 128MB | 512MB |
| Disk | 100MB | 1GB (with memory DB) |
| OS | Linux, macOS, Windows | Linux (Ubuntu 22/24) |

## Method 1: One-liner (Recommended)

```bash
curl -fsSL https://dragonclaw.asia/install.sh | bash
```

What it does:
1. Checks for Node.js, installs v22 if missing
2. Clones the repository to `~/.dragonclaw/app`
3. Runs `npm install --production`
4. Creates a `dragonclaw` command symlink

## Method 2: npm Global Install

```bash
npm i -g dragonclaw
```

Requires Node.js 20+ already installed.

## Method 3: Git Clone (For Development)

```bash
git clone https://github.com/draguris/dragonclaw.git
cd dragonclaw
npm install
node src/cli.js onboard
node src/index.js
```

## Method 4: Docker

```bash
# Build from source
docker build -t dragonclaw .

# Or use docker-compose
cp .env.example .env
# Edit .env with your API keys
docker-compose up -d
```

See [Docker Deployment](../deployment/docker.md) for full details.

## Verify Installation

```bash
dragonclaw doctor
```

Expected output:
```
  ✓ Config file found
  ✓ LLM provider: deepseek
  ✓ LLM API key: ***configured***
  ○ Binance API key: not set (optional)
  ○ Connectors: none enabled
  ✓ Node.js: v22.x (need >= 20)
  Binance skills (hardcoded): 7/7 ✓
```

## Uninstall

```bash
# npm install
npm uninstall -g dragonclaw

# One-liner install
rm -rf ~/.dragonclaw

# Docker
docker-compose down -v
```

Your data lives in `~/.dragonclaw/` (or `/data` in Docker). Delete that directory to remove all memory and configuration.
