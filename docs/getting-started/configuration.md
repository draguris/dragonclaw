# Configuration

DragonClaw configuration lives in `dragonclaw.yaml`. The system checks two locations:

1. `./dragonclaw.yaml` (current directory)
2. `~/.dragonclaw/dragonclaw.yaml` (home directory)

Environment variables override file config. This is the recommended approach for production — secrets never touch disk.

## Full Configuration Reference

```yaml
# ── LLM Provider ──
llm:
  provider: deepseek          # deepseek | qwen | kimi | glm | openai | anthropic | openrouter | local
  apiKey: "sk-..."            # or set DRAGONCLAW_LLM_API_KEY env var
  model: deepseek-chat        # auto-detected from provider if not set
  baseUrl: null               # override for custom/local endpoints
  maxTokens: 4096             # max response length
  temperature: 0.7            # 0.0 = deterministic, 1.0 = creative
  timeoutMs: 60000            # request timeout

# ── Binance (optional) ──
binance:
  apiKey: "..."               # or BINANCE_API_KEY env var
  secretKey: "..."            # or BINANCE_API_SECRET env var
  testnet: true               # true = testnet, false = real money

# ── Chat Connectors ──
connectors:
  telegram:
    enabled: false
    token: "BOT_TOKEN"        # from @BotFather
  dingtalk:
    enabled: false
    robotWebhook: "https://oapi.dingtalk.com/robot/send?access_token=..."
    appSecret: "..."          # for signature verification
  feishu:
    enabled: false
    appId: "cli_..."
    appSecret: "..."
  discord:
    enabled: false
    token: "BOT_TOKEN"        # from Discord Developer Portal
  wechat:
    enabled: false
    mode: official-account    # official-account | mini-program
    appId: "..."
    appSecret: "..."
  slack:
    enabled: false
    token: "xoxb-..."
    signingSecret: "..."
  webchat:
    enabled: false

# ── Gateway ──
gateway:
  port: 18789
  host: 127.0.0.1            # bind to localhost only (use Nginx for external)
  token: null                 # or DRAGONCLAW_GATEWAY_TOKEN — required for production
  rateLimit:
    perUser: 20               # max messages per user per minute
    global: 100               # max total messages per minute

# ── Agent Behavior ──
agent:
  name: "龙爪"
  persona: "你是龙爪..."      # custom system prompt (see below)
  language: zh                # zh | en | auto
  confirmBeforeTrade: true    # require "CONFIRM" before executing trades
  heartbeatCron: "0 9 * * *"  # cron for proactive check-in (default: 9am daily)

# ── Skills ──
skills:
  userDir: ~/.dragonclaw/skills  # where user-installed skills live
  allowRemoteInstall: true

# ── Paths ──
paths:
  data: ~/.dragonclaw         # memory database, configs
  workspace: ./               # working directory for file operations
```

## LLM Provider Setup

### DeepSeek (Recommended)

1. Sign up at [platform.deepseek.com](https://platform.deepseek.com)
2. Create an API key
3. Configure:

```yaml
llm:
  provider: deepseek
  apiKey: "sk-..."
```

Cost: approximately $0.001 per query. The cheapest option with excellent Chinese language performance.

### Qwen (Alibaba Cloud)

1. Sign up at [dashscope.aliyuncs.com](https://dashscope.aliyuncs.com)
2. Enable DashScope, get an API key
3. Configure:

```yaml
llm:
  provider: qwen
  apiKey: "sk-..."
  model: qwen-max           # or qwen-plus (cheaper)
```

### Kimi (Moonshot AI)

1. Sign up at [platform.moonshot.cn](https://platform.moonshot.cn)
2. Create an API key
3. Configure:

```yaml
llm:
  provider: kimi
  apiKey: "sk-..."
  model: moonshot-v1-128k   # 128K context window
```

### GLM (Zhipu AI)

1. Sign up at [open.bigmodel.cn](https://open.bigmodel.cn)
2. Get API key
3. Configure:

```yaml
llm:
  provider: glm
  apiKey: "..."
  model: glm-4-flash        # or glm-4 (more capable, slower)
```

### OpenAI / Anthropic / OpenRouter

```yaml
# OpenAI
llm:
  provider: openai
  apiKey: "sk-..."
  model: gpt-4o

# Anthropic
llm:
  provider: anthropic
  apiKey: "sk-ant-..."
  model: claude-sonnet-4-20250514

# OpenRouter (access any model)
llm:
  provider: openrouter
  apiKey: "sk-or-..."
  model: deepseek/deepseek-chat
```

## Environment Variables

All sensitive values can be set via environment variables instead of the YAML file:

| Variable | Overrides |
|----------|-----------|
| `DRAGONCLAW_LLM_PROVIDER` | `llm.provider` |
| `DRAGONCLAW_LLM_API_KEY` | `llm.apiKey` |
| `DRAGONCLAW_LLM_MODEL` | `llm.model` |
| `DRAGONCLAW_GATEWAY_TOKEN` | `gateway.token` |
| `BINANCE_API_KEY` | `binance.apiKey` |
| `BINANCE_API_SECRET` | `binance.secretKey` |
| `TELEGRAM_BOT_TOKEN` | `connectors.telegram.token` (also enables it) |
| `LOG_LEVEL` | Logging verbosity: `debug`, `info`, `warn`, `error` |

## Custom Agent Persona

Override the default persona to change how your dragon behaves:

```yaml
agent:
  persona: |
    你是小龙，一个专注于 DeFi 分析的交易助手。
    你只关注 Solana 生态，用户问其他链的问题时礼貌地拒绝。
    你说话简洁，数据先行，不废话。
```
