# Binance Trading Safety

DragonClaw can execute real trades on Binance. Here's every safety mechanism in place.

## Defense in Depth

### 1. Testnet by Default

```yaml
binance:
  testnet: true   # default — uses testnet.binance.vision
```

You must explicitly set `testnet: false` to trade with real money. There is no way to accidentally switch to mainnet.

### 2. Confirmation Required

Every trade shows full details and waits for you to type `CONFIRM`:

```
龙爪: 确认交易:
     买入 BNB
     金额: 50 USDT
     当前价: $612.50
     网络: Mainnet
     
     请回复 CONFIRM 确认执行。
```

This is controlled by `agent.confirmBeforeTrade: true` (default). Even if you set it to `false`, the LLM system prompt still instructs the agent to confirm — you'd have to modify both the config and the prompt to bypass it.

### 3. No Withdrawal Permissions

The system never calls withdrawal endpoints. The Binance client (`src/core/binance-client.js`) only implements:
- `GET` (market data, account info)
- `POST` (place orders)
- `DELETE` (cancel orders)

There is no withdraw function in the codebase.

### 4. IP Restriction

When creating your Binance API key, always:
1. Select "Restrict access to trusted IPs only"
2. Add only your server's IP
3. This means even if your key leaks, it can't be used from another IP

### 5. Signed Requests

All authenticated Binance calls are signed with HMAC-SHA256:

```
signature = HMAC-SHA256(queryString, secretKey)
```

Requests include a timestamp and `recvWindow` (5000ms default) to prevent replay attacks.

### 6. No Secret Logging

The Binance secret key is never logged, printed, or included in error messages. Only the API key identifier appears in logs (and only at debug level).

## Recommended Binance API Permissions

| Permission | Enable? | Reason |
|-----------|---------|--------|
| Read | Yes | View balances, prices, order status |
| Spot Trading | Yes | Place and cancel spot orders |
| Margin Trading | No | Not needed unless you use margin skills |
| Futures Trading | No | Not supported yet |
| Withdraw | **Never** | DragonClaw never needs this |

## What Could Go Wrong

| Scenario | Protection |
|----------|-----------|
| LLM hallucinates a trade | Confirmation step blocks execution |
| Wrong amount/price | Agent shows details before execution |
| API key compromised | IP restriction limits damage |
| Replay attack | Timestamp + recvWindow in signed requests |
| Accidental mainnet trade | Testnet is default, requires explicit config change |

## Emergency Stop

If something goes wrong:

1. **Revoke your Binance API key** immediately in Binance settings
2. `pm2 stop dragonclaw` to halt the agent
3. Check open orders: log into Binance web and cancel any pending orders
4. Review logs: `pm2 logs dragonclaw --lines 200`
