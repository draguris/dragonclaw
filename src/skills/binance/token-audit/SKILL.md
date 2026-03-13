---
title: Token Security Audit
slug: token-audit
description: Detect scams, honeypots, and malicious contracts on BSC, Base, Solana, Ethereum. No API key needed.
version: 1.0.0
author: dragonclaw
---

# Token Security Audit

Audit token smart contracts for security risks including honeypots, rug pulls, fake tokens, and malicious permissions.

## When to Use
User asks to check if a token is safe, audit a contract, detect scams, verify a meme coin, or asks "is this legit."

## No API Key Required

## Endpoint
GET /bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/risk/audit
Params: contractAddress, chainId (56=BSC, 1=ETH, CT_501=Solana, 8453=Base)

## Tool Call
```tool
{"tool": "binance_market", "action": "GET", "endpoint": "/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/risk/audit", "params": {"contractAddress": "TOKEN_ADDRESS", "chainId": "CT_501"}}
```

## Risk Interpretation
- Check for: mintable, pausable, blacklist, high tax, proxy contract
- Flag if tax > 10% or if owner retains mint/pause authority
- State risk level clearly: LOW / MEDIUM / HIGH / CRITICAL
