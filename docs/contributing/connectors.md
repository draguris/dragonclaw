# Connector Development

Add support for a new chat platform to DragonClaw.

## Interface

Every connector implements this interface:

```javascript
export class MyPlatformConnector {
  /**
   * @param {object} config — platform-specific config from dragonclaw.yaml
   * @param {AgentLoop} agent — the agent to process messages through
   */
  constructor(config, agent) {
    this.config = config;
    this.agent = agent;
  }

  /**
   * Start listening for messages.
   * Called once during startup. Should not block.
   */
  async start() { }

  /**
   * Clean shutdown. Close connections, cancel timers.
   */
  async stop() { }
}
```

## Processing Messages

When your connector receives a message, call:

```javascript
const reply = await this.agent.process(channelId, userId, text, platformName);
```

Parameters:
- `channelId` — unique conversation identifier (e.g., `myplatform:room-123`)
- `userId` — unique user identifier (e.g., `myplatform:user-456`)
- `text` — the message text content
- `platformName` — string identifying your platform (used in system prompt)

The agent returns a string response. Send it back via your platform's API.

## Registration

Add your connector to `src/connectors/manager.js`:

```javascript
import { MyPlatformConnector } from './myplatform.js';

const CONNECTOR_MAP = {
  // ... existing connectors
  myplatform: MyPlatformConnector,
};
```

Add config defaults to `src/core/config.js`:

```javascript
const DEFAULTS = {
  connectors: {
    // ... existing
    myplatform: { enabled: false, token: null },
  },
};
```

## Checklist

Before submitting a PR:

- [ ] Connector implements `constructor`, `start`, `stop`
- [ ] Messages routed through `agent.process()`
- [ ] Platform-specific prefix on channelId and userId (`platform:id`)
- [ ] Group chat: only responds to mentions/replies
- [ ] DM: responds to every message
- [ ] Message chunking for platform limits
- [ ] Error handling: catch and log, don't crash
- [ ] Auto-reconnect on connection loss (if applicable)
- [ ] Config schema added to `config.js`
- [ ] Registered in `manager.js`
- [ ] Doc page in `docs/connectors/`
- [ ] Tested manually with a real account

## Example: Minimal Webhook Connector

```javascript
import { createServer } from 'http';

export class WebhookConnector {
  constructor(config, agent) {
    this.config = config;
    this.agent = agent;
    this.server = null;
  }

  async start() {
    this.server = createServer(async (req, res) => {
      if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }

      let body = '';
      req.on('data', c => body += c);
      req.on('end', async () => {
        const { text, userId, channelId, replyUrl } = JSON.parse(body);
        res.writeHead(200); res.end('ok');

        const reply = await this.agent.process(
          `webhook:${channelId}`, `webhook:${userId}`, text, 'webhook'
        );

        // Send reply back via callback URL
        await fetch(replyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: reply }),
        });
      });
    });
    this.server.listen(18792);
  }

  async stop() {
    if (this.server) return new Promise(r => this.server.close(r));
  }
}
```
