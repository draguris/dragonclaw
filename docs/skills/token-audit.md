# Token Audit

**API Key Required:** No

Scan any token's smart contract for security risks — honeypots, rug pull mechanics, malicious permissions, excessive taxes.

## Supported Chains

- Ethereum (chainId: `1`)
- BSC (chainId: `56`)
- Solana (chainId: `CT_501`)
- Base (chainId: `8453`)

## What It Checks

- **Mintable** — can the owner create new tokens (dilution risk)
- **Pausable** — can transfers be frozen
- **Blacklist** — can specific addresses be blocked from selling
- **Tax Rate** — buy/sell tax percentage
- **Proxy Contract** — is the code upgradeable (can be changed after launch)
- **Owner Privileges** — what special powers does the contract owner have

## Risk Levels

- **LOW** — no significant risks detected
- **MEDIUM** — some flags (moderate tax, upgradeable proxy)
- **HIGH** — dangerous flags (owner can mint, blacklist present)
- **CRITICAL** — honeypot detected or extreme tax (>50%)

## Example

```
你: 这个合约安全吗？ 0x6982508145454Ce325dDbE47a25d4ec3d2311933
龙爪: PEPE (Ethereum) 合约审计:
     
     风险等级: LOW ✓
     
     ✓ 不可增发 (no mint function)
     ✓ 无黑名单机制
     ✓ 无暂停功能
     ✓ 非代理合约
     ✓ 所有权已放弃
     
     税率: 买入 0% / 卖出 0%
     持有者: 234,567
     
     结论: 合约安全，无明显风险。
```

```
你: 帮我查查这个 meme 0xSCAMTOKEN...
龙爪: ⚠ SCAMTOKEN (BSC) 合约审计:
     
     风险等级: CRITICAL ❌
     
     ❌ 可增发 — 所有者可无限铸造
     ❌ 黑名单 — 可阻止地址卖出
     ❌ 卖出税率 99%
     ✓ 非代理合约
     
     结论: 极高风险！这很可能是骗局。不建议交易。
```
