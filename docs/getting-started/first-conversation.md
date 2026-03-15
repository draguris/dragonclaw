# Your First Conversation

Once DragonClaw is running, here are things you can try immediately — no additional configuration needed.

## Via CLI

```bash
dragonclaw chat
```

## Things That Work Without Any API Keys

These use public Binance Web3 endpoints:

### Check a Token Price
```
你: PEPE现在什么价格？
龙爪: 正在查询 PEPE 代币信息...
     PEPE/USDT: $0.00001234 | 24h: +5.2% | 市值: $5.1B
```

### Audit a Contract
```
你: 帮我审计这个合约 0x6982508145454Ce325dDbE47a25d4ec3d2311933
龙爪: 正在审计合约安全性...
     链: Ethereum
     风险等级: LOW
     ✓ 不可增发 ✓ 无黑名单 ✓ 无暂停功能
     税率: 买入 0% / 卖出 0%
     持有者: 234,567
```

### Track Meme Tokens
```
你: Solana上最近有什么新的meme币？
龙爪: 正在查询 Pump.fun 最新代币...
     1. $DRAGON — 创建 2h前, 进度 67%, 开发者未卖出
     2. $NOODLE — 创建 5h前, 进度 89%, 即将迁移到DEX
     3. $PANDA — 已迁移, 市值 $234K, 前10持有者 32%
```

### Market Rankings
```
你: 现在什么币最火？
龙爪: 24小时热门代币排行...
     🔥 社交热度: TRUMP, PEPE, WIF
     💰 智能资金流入: ETH, SOL, BNB
     📈 Meme 涨幅榜: BONK +34%, WIF +21%
```

## Things That Need Binance API Key

### Place a Trade
```
你: 帮我买入 10 USDT 的 BNB
龙爪: 确认交易:
     买入 BNB
     金额: 10 USDT
     当前价: $612.50
     预估数量: ~0.0163 BNB
     网络: Testnet
     
     请回复 CONFIRM 确认执行。

你: CONFIRM
龙爪: ✓ 订单已提交
     订单ID: 12345678
     状态: FILLED
     成交: 0.0163 BNB @ $612.48
```

### Check Balance
```
你: 我的币安余额是多少？
龙爪: 你的现货账户:
     BTC: 0.0521 (~$3,512)
     USDT: 1,234.56
     BNB: 2.34 (~$1,433)
```

## Via Telegram / DingTalk / Feishu

Once you connect a chat platform, the experience is identical — just send messages as you normally would. In group chats, mention the bot or reply to its message to trigger a response.

## Tips

- DragonClaw remembers your conversations. If you tell it "我主要关注 Solana 生态", it will prioritize Solana data in future queries.
- Say "记住我的风险偏好是保守的" to have it factor that into trading suggestions.
- Use `CONFIRM` to approve trades. This is required by default and can't be disabled without editing the config.
- The agent speaks Chinese by default. Switch with "please respond in English" or set `agent.language: en` in config.
