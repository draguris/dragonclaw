# WeChat 微信 Connector

**Status: Planned**

WeChat integration is more complex than other platforms due to its walled-garden nature. Here's the current status and roadmap.

## Available Approaches

### 1. Official Account (公众号) — Supported

Requires a verified WeChat Official Account (Service Account type). Subscription Accounts do not support the required APIs.

Setup:
1. Register a Service Account at [mp.weixin.qq.com](https://mp.weixin.qq.com)
2. Complete business verification
3. Enable Developer Mode
4. Set server URL to your DragonClaw callback endpoint
5. Configure in DragonClaw:

```yaml
connectors:
  wechat:
    enabled: true
    mode: official-account
    appId: "wx..."
    appSecret: "..."
```

Limitations:
- Users must follow your Official Account first
- 48-hour messaging window after user interaction
- Templates for proactive messages require approval
- Business verification takes 1-2 weeks

### 2. Personal WeChat — Not Officially Supported

Automating personal WeChat accounts uses reverse-engineered protocols and risks account bans. DragonClaw does not include this functionality. Third-party tools exist but use at your own risk.

### 3. WeCom (企业微信) — Planned

WeCom (formerly WeChat Work) has more open APIs and is suitable for team/business use. This is on the roadmap.

## Recommendation

For most users, we recommend using **DingTalk or Feishu** as your Chinese chat connector. They have proper bot APIs, are easy to set up, and don't require business verification.

If you specifically need WeChat, the Official Account approach works but requires more setup time.
