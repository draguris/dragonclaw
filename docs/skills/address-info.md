# Address Info

**API Key Required:** No

Query all token holdings and portfolio value for any wallet address on supported chains.

## Supported Chains

- BSC (chainId: `56`)
- Base (chainId: `8453`)
- Solana (chainId: `CT_501`)

## Example

```
你: 查一下这个钱包 7xKp...3mF 持有什么
龙爪: 钱包 7xKp...3mF (Solana):
     
     总价值: $45,678
     
     SOL      12.5    $2,345
     USDC     5,000   $5,000
     JUP      890     $1,234
     WIF      3,456   $8,090
     BONK     12.4M   $234
     
     前5持仓占比: 89.2%
```

## Use Cases

- Check what a smart money wallet is holding
- Verify a project team's token distribution
- Track your own portfolio from a chat message
- Monitor competitor wallets
