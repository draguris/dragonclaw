# DingTalk 钉钉 Connector

Connect DragonClaw to DingTalk groups via Robot Webhook.

## Setup

### 1. Create a Custom Robot

1. Open your DingTalk group
2. Click the group settings (gear icon) → **智能群助手** → **添加机器人**
3. Select **自定义** robot
4. Name it (e.g., "龙爪")
5. Security setting: choose **加签** (signature) and save the secret
6. Copy the **Webhook URL**

### 2. Configure DragonClaw

```yaml
connectors:
  dingtalk:
    enabled: true
    robotWebhook: "https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN"
    appSecret: "SEC..."  # the signature secret from step 5
```

### 3. Set Up Callback (Optional)

For the robot to receive incoming messages (not just send), you need to expose DragonClaw's callback endpoint:

- DragonClaw listens on port `18790` for DingTalk callbacks
- In your DingTalk app settings, set the callback URL to `https://dragonclaw.asia/dingtalk/callback`
- Add an Nginx location block to proxy this

## How It Works

- **Outgoing**: DragonClaw sends messages via the Robot Webhook URL
- **Incoming**: DingTalk posts to the callback URL when someone @mentions the robot
- Messages are signed with HMAC-SHA256 using your `appSecret`
- In groups, the robot only responds when @mentioned
