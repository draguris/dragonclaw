---
title: Wallet Address Info
slug: address-info
description: Query token holdings and portfolio for any wallet on BSC, Base, or Solana. No API key needed.
version: 1.0.0
author: dragonclaw
---

# Wallet Address Info

Look up all token holdings, balances, and portfolio value for any wallet address.

## When to Use
User asks to check a wallet, view holdings, portfolio value, or "what does this address hold."

## No API Key Required
Supports BSC (56), Base (8453), Solana (CT_501).

## Endpoint
GET /bapi/defi/v1/public/wallet-direct/buw/wallet/balance/token/list
Params: walletAddress, chainId

## Tool Call
```tool
{"tool": "binance_market", "action": "GET", "endpoint": "/bapi/defi/v1/public/wallet-direct/buw/wallet/balance/token/list", "params": {"walletAddress": "ADDRESS", "chainId": "CT_501"}}
```
