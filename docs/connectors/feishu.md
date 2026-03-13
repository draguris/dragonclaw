# Feishu 飞书 Connector

Connect DragonClaw to Feishu (Lark) via the Bot Events API.

## Setup

### 1. Create a Feishu App

1. Go to [open.feishu.cn](https://open.feishu.cn) → Developer Console
2. Create a new Custom App
3. Under **Bot** capability, enable it
4. Under **Event Subscriptions**, add event: `im.message.receive_v1`
5. Set the Request URL to `https://dragonclaw.asia/feishu/events`
6. Note your **App ID** and **App Secret**

### 2. Configure Permissions

In the Feishu app console, add these permissions:
- `im:message` — read messages
- `im:message:send_as_bot` — send messages as the bot
- Then publish the app version and get admin approval

### 3. Configure DragonClaw

```yaml
connectors:
  feishu:
    enabled: true
    appId: "cli_your_app_id"
    appSecret: "your_app_secret"
```

### 4. Add Nginx Proxy

Add to your Nginx config inside the server block:

```nginx
location /feishu/events {
    proxy_pass http://127.0.0.1:18791;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## How It Works

- DragonClaw starts a callback server on port `18791`
- Handles Feishu's URL verification challenge automatically
- Receives message events, processes them, replies via the Feishu Messages API
- OAuth token auto-refreshes before expiry
- Supports text messages (other types like images coming soon)
