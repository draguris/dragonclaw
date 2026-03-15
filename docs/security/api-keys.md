# API Key Management

DragonClaw handles multiple sensitive credentials. Here's how to manage them securely.

## Credential Types

| Credential | Purpose | Where to Get |
|-----------|---------|-------------|
| LLM API Key | Powers the AI brain | Provider dashboard (DeepSeek, Qwen, etc.) |
| Gateway Token | Protects the HTTP/WS API | Self-generated (see below) |
| Binance API Key | Spot trading execution | Binance → Profile → API Management |
| Binance Secret | Signs trading requests | Created with API key |
| Telegram Token | Bot communication | @BotFather on Telegram |
| DingTalk Secret | Webhook signature | DingTalk group robot settings |
| Feishu App Secret | OAuth + events | Feishu developer console |
| Discord Token | Bot Gateway connection | Discord developer portal |

## Best Practices

### 1. Use Environment Variables

Never put secrets in YAML files that might end up in git:

```bash
# Good — .env file (chmod 600, gitignored)
DRAGONCLAW_LLM_API_KEY=sk-...
BINANCE_API_KEY=...

# Bad — dragonclaw.yaml
llm:
  apiKey: "sk-..."   # will end up in version control
```

### 2. Generate a Strong Gateway Token

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This produces a 64-character hex string. Set it as `DRAGONCLAW_GATEWAY_TOKEN`.

### 3. Binance API Key Safety

When creating your Binance API key:
- Enable only **Read** and **Spot Trading** permissions
- **Never** enable Withdraw
- Under IP Access Restrictions, select "Restrict access to trusted IPs only"
- Add your server's IP address
- Keep `testnet: true` until you're confident

### 4. File Permissions

```bash
chmod 600 /var/lib/dragonclaw/.env    # only owner can read
chown dragonclaw:dragonclaw /var/lib/dragonclaw/.env
```

### 5. Encryption at Rest

DragonClaw includes a secrets manager that can encrypt values in config files:

```javascript
import { encrypt, decrypt } from './src/core/secrets.js';

const encrypted = encrypt('sk-my-api-key');
// → "enc:v1:abcdef...:123456...:789abc..."

const original = decrypt(encrypted);
// → "sk-my-api-key"
```

Encrypted values are tied to the machine (derived from hostname + username). They can't be decrypted on a different server.

### 6. Key Rotation

Rotate keys periodically:
1. Generate new key from provider dashboard
2. Update `.env` file
3. `pm2 restart dragonclaw`
4. Revoke old key from provider dashboard

## What's NOT Logged

DragonClaw never logs:
- API keys or tokens (any length)
- Binance secret keys
- User message content (unless `LOG_LEVEL=debug`)
- Gateway tokens
