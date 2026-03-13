# Spot Trading

**API Key Required:** Yes

Execute spot trades on Binance — buy, sell, cancel orders, check balances, view open orders.

## Setup

1. Log in to Binance → Profile → API Management
2. Create a new API key (select "System-generated")
3. Enable permissions: **Read** + **Spot Trading**
4. Under IP Access Restrictions, select "Allow only trusted IPs" and add your server IP
5. **Do NOT enable withdrawal permissions**

Add to your environment:
```bash
BINANCE_API_KEY=your-key
BINANCE_API_SECRET=your-secret
```

## Testnet vs Mainnet

Default is testnet (`binance.testnet: true`). To trade with real money:

```yaml
binance:
  testnet: false
```

Binance testnet: [testnet.binance.vision](https://testnet.binance.vision) — get free test funds there.

## Example Conversations

### Check Price
```
你: BNB什么价格？
龙爪: BNB/USDT: $612.45 | 24h: +1.8% | 高: $618.20 | 低: $601.30
```

### Place a Limit Order
```
你: 在 600 USDT 的价格挂单买 0.1 BNB
龙爪: 确认订单:
     买入 0.1 BNB
     价格: 600 USDT (限价)
     总额: 60 USDT
     网络: Mainnet
     
     请回复 CONFIRM 执行。

你: CONFIRM
龙爪: ✓ 限价单已提交
     订单ID: 987654321
     状态: NEW (等待成交)
```

### Check Open Orders
```
你: 我有哪些未成交的挂单？
龙爪: 当前挂单:
     1. BNB/USDT — 买入 0.1 @ $600.00 (限价)
     2. BTC/USDT — 卖出 0.001 @ $70,000 (限价)
```

### Cancel an Order
```
你: 取消BNB的那个挂单
龙爪: 已取消订单 #987654321 (BNB/USDT 买入 0.1 @ $600)
```

## Safety Mechanisms

1. **Confirmation required** — the agent always shows order details and waits for `CONFIRM`
2. **Testnet default** — real trading requires explicit config change
3. **IP restriction** — Binance API key should be locked to your server's IP
4. **No withdrawals** — the system never uses withdrawal endpoints
5. **Signed requests** — all authenticated calls use HMAC-SHA256 per Binance spec

## Available Operations

| Operation | Endpoint | Method |
|-----------|----------|--------|
| Get price | `/api/v3/ticker/price` | GET |
| Account balance | `/api/v3/account` | GET (signed) |
| Place order | `/api/v3/order` | POST (signed) |
| Cancel order | `/api/v3/order` | DELETE (signed) |
| Open orders | `/api/v3/openOrders` | GET (signed) |
| Order status | `/api/v3/order` | GET (signed) |
| Trade history | `/api/v3/myTrades` | GET (signed) |
