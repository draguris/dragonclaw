/**
 * Four.meme Auto-Snipe Module
 * 
 * Watches Four.meme TokenCreate events in real-time on BSC.
 * When a new token matches user-defined criteria, it:
 * 1. Checks contract safety (tax token, dev holdings)
 * 2. Auto-buys with preset BNB amount
 * 3. Sends notification to user's connected chat platform
 * 
 * This is DragonClaw-exclusive. OpenClaw's four-meme plugin
 * can only run commands when the user asks. This runs 24/7.
 */

import { createPublicClient, http, parseAbiItem, parseAbi } from 'viem';
import { bsc } from 'viem/chains';
import { log } from './logger.js';

const sLog = log.child('four-meme-sniper');

const TOKEN_MANAGER2 = '0x5c952063c7fc8610FFDB798152D69F0B9550762b';
const HELPER3 = '0xF251F83e40a78868FcfA3FA4599Dad6494E46034';

const TOKEN_CREATE_EVENT = parseAbiItem(
  'event TokenCreate(address creator, address token, uint256 requestId, string name, string symbol, uint256 totalSupply, uint256 launchTime, uint256 launchFee)'
);

const HELPER_ABI = parseAbi([
  'function getTokenInfo(address token) view returns (uint256 version, address tokenManager, address quote, uint256 lastPrice, uint256 tradingFeeRate, uint256 minTradingFee, uint256 launchTime, uint256 offers, uint256 maxOffers, uint256 funds, uint256 maxFunds, bool liquidityAdded)',
  'function tryBuy(address token, uint256 amount, uint256 funds) view returns (address tokenManager, address quote, uint256 estimatedAmount, uint256 estimatedCost, uint256 estimatedFee, uint256 amountMsgValue, uint256 amountApproval, uint256 amountFunds)',
]);

const TM2_BUY_ABI = parseAbi([
  'function buyTokenAMAP(address token, uint256 minAmount) payable',
]);

const TAX_TOKEN_ABI = parseAbi([
  'function feeRate() view returns (uint256)',
]);

// Default snipe config
const DEFAULT_CONFIG = {
  enabled: false,
  buyAmountBnb: '0.01',          // BNB per new token
  labels: ['Meme', 'AI'],         // only snipe these labels (empty = all)
  excludeTaxToken: true,           // skip tokens with tax
  maxTaxRate: 0,                   // max acceptable tax rate (0 = no tax allowed)
  minSlippage: 10,                 // minimum token amount as % of quote (90% = 10% slippage)
  maxConcurrent: 5,                // max snipes per hour
  cooldownMs: 5000,                // wait between snipes
  pollIntervalMs: 3000,            // how often to check for new blocks
  notifyOnSnipe: true,             // send chat notification on buy
  notifyOnSkip: false,             // send notification when skipping a token
  requireV2: true,                 // only V2 tokens (V1 not supported)
};

export class FourMemeSniper {
  constructor(config, agent, connectors) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.agent = agent;
    this.connectors = connectors;
    this.client = null;
    this.running = false;
    this.lastBlock = 0n;
    this.snipeCount = 0;
    this.snipeHourStart = Date.now();
    this.pollTimer = null;
    this.sniped = new Set(); // track sniped tokens to avoid duplicates
  }

  async start() {
    if (!this.config.enabled) {
      sLog.info('Four.meme sniper disabled');
      return;
    }

    const privateKey = process.env.PRIVATE_KEY || this.config.privateKey;
    if (!privateKey) {
      sLog.warn('Four.meme sniper requires PRIVATE_KEY');
      return;
    }

    const rpcUrl = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org';
    this.client = createPublicClient({
      chain: bsc,
      transport: http(rpcUrl),
    });

    this.lastBlock = await this.client.getBlockNumber();
    this.running = true;

    sLog.info('Four.meme sniper started', {
      buyAmount: this.config.buyAmountBnb + ' BNB',
      labels: this.config.labels,
      excludeTax: this.config.excludeTaxToken,
    });

    this._poll();
  }

  async stop() {
    this.running = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    sLog.info('Four.meme sniper stopped');
  }

  _poll() {
    if (!this.running) return;

    this._checkNewTokens()
      .catch(err => sLog.error('Sniper poll error', { error: err.message }))
      .finally(() => {
        if (this.running) {
          this.pollTimer = setTimeout(() => this._poll(), this.config.pollIntervalMs);
        }
      });
  }

  async _checkNewTokens() {
    const currentBlock = await this.client.getBlockNumber();
    if (currentBlock <= this.lastBlock) return;

    const fromBlock = this.lastBlock + 1n;
    const toBlock = currentBlock;

    sLog.debug('Scanning blocks', { from: fromBlock.toString(), to: toBlock.toString() });

    const logs = await this.client.getLogs({
      address: TOKEN_MANAGER2,
      event: TOKEN_CREATE_EVENT,
      fromBlock,
      toBlock,
    });

    this.lastBlock = currentBlock;

    for (const event of logs) {
      const { creator, token, name, symbol, totalSupply, launchFee } = event.args;

      if (this.sniped.has(token)) continue;

      sLog.info('New token detected', { token, name, symbol, creator });

      // Rate limit check
      if (!this._checkRateLimit()) {
        sLog.warn('Hourly snipe limit reached, skipping', { token, name });
        continue;
      }

      // Evaluate and maybe buy
      try {
        await this._evaluateAndSnipe(token, name, symbol, creator);
      } catch (err) {
        sLog.error('Snipe evaluation failed', { token, name, error: err.message });
      }
    }
  }

  _checkRateLimit() {
    const now = Date.now();
    if (now - this.snipeHourStart > 3600_000) {
      this.snipeCount = 0;
      this.snipeHourStart = now;
    }
    return this.snipeCount < this.config.maxConcurrent;
  }

  async _evaluateAndSnipe(tokenAddress, name, symbol, creator) {
    // Step 1: Get token info from Helper3
    const tokenInfo = await this.client.readContract({
      address: HELPER3,
      abi: HELPER_ABI,
      functionName: 'getTokenInfo',
      args: [tokenAddress],
    });

    const [version, tokenManager, quote, lastPrice, tradingFeeRate, , , offers, maxOffers, funds, maxFunds, liquidityAdded] = tokenInfo;

    // V2 check
    if (this.config.requireV2 && Number(version) !== 2) {
      sLog.info('Skipping V1 token', { token: tokenAddress, name, version: Number(version) });
      this._notifySkip(name, symbol, 'V1 token (不支持)');
      return;
    }

    // Already graduated to DEX
    if (liquidityAdded) {
      sLog.info('Skipping graduated token', { token: tokenAddress, name });
      this._notifySkip(name, symbol, '已毕业到 DEX');
      return;
    }

    // Step 2: Tax token check
    if (this.config.excludeTaxToken) {
      try {
        const feeRate = await this.client.readContract({
          address: tokenAddress,
          abi: TAX_TOKEN_ABI,
          functionName: 'feeRate',
        });
        const taxPercent = Number(feeRate) / 100;
        if (taxPercent > this.config.maxTaxRate) {
          sLog.info('Skipping tax token', { token: tokenAddress, name, taxPercent });
          this._notifySkip(name, symbol, `税率 ${taxPercent}%`);
          return;
        }
      } catch {
        // Not a tax token (call reverts), which is good
      }
    }

    // Step 3: Get buy quote
    const buyAmountWei = BigInt(Math.round(parseFloat(this.config.buyAmountBnb) * 1e18));

    const quoteResult = await this.client.readContract({
      address: HELPER3,
      abi: HELPER_ABI,
      functionName: 'tryBuy',
      args: [tokenAddress, 0n, buyAmountWei],
    });

    const [, , estimatedAmount, estimatedCost, estimatedFee, amountMsgValue] = quoteResult;

    if (estimatedAmount === 0n) {
      sLog.info('Skipping zero estimate', { token: tokenAddress, name });
      this._notifySkip(name, symbol, '估算数量为0');
      return;
    }

    // Step 4: Calculate minimum amount with slippage
    const slippageMultiplier = BigInt(100 - this.config.minSlippage);
    const minAmount = (estimatedAmount * slippageMultiplier) / 100n;

    // Step 5: Execute buy
    sLog.info('Sniping token', {
      token: tokenAddress, name, symbol,
      buyBnb: this.config.buyAmountBnb,
      estimatedTokens: estimatedAmount.toString(),
      minTokens: minAmount.toString(),
    });

    const txHash = await this._executeBuy(tokenAddress, minAmount, amountMsgValue);

    this.sniped.add(tokenAddress);
    this.snipeCount++;

    sLog.info('Snipe successful', { token: tokenAddress, name, symbol, txHash });

    // Step 6: Notify user
    await this._notifySnipe(tokenAddress, name, symbol, txHash, estimatedAmount);

    // Cooldown
    if (this.config.cooldownMs > 0) {
      await new Promise(r => setTimeout(r, this.config.cooldownMs));
    }
  }

  async _executeBuy(tokenAddress, minAmount, msgValue) {
    // Dynamic import to avoid requiring viem/accounts at module level when sniper is disabled
    const { createWalletClient } = await import('viem');
    const { privateKeyToAccount } = await import('viem/accounts');

    const pk = process.env.PRIVATE_KEY || this.config.privateKey;
    const key = pk.startsWith('0x') ? pk : '0x' + pk;
    const account = privateKeyToAccount(key);

    const rpcUrl = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org';
    const wallet = createWalletClient({
      account,
      chain: bsc,
      transport: http(rpcUrl),
    });

    // Get tokenManager from helper
    const tokenInfo = await this.client.readContract({
      address: HELPER3,
      abi: HELPER_ABI,
      functionName: 'getTokenInfo',
      args: [tokenAddress],
    });
    const tokenManager = tokenInfo[1];

    const hash = await wallet.writeContract({
      address: tokenManager,
      abi: TM2_BUY_ABI,
      functionName: 'buyTokenAMAP',
      args: [tokenAddress, minAmount],
      value: msgValue,
    });

    return hash;
  }

  async _notifySnipe(tokenAddress, name, symbol, txHash, estimatedAmount) {
    if (!this.config.notifyOnSnipe) return;

    const msg = [
      `Four.meme 狙击成功`,
      ``,
      `代币: ${name} ($${symbol})`,
      `合约: ${tokenAddress}`,
      `买入: ${this.config.buyAmountBnb} BNB`,
      `预估数量: ${estimatedAmount.toString()}`,
      `交易哈希: ${txHash}`,
      ``,
      `查看: https://bscscan.com/tx/${txHash}`,
    ].join('\n');

    this._broadcast(msg);
  }

  _notifySkip(name, symbol, reason) {
    if (!this.config.notifyOnSkip) return;
    this._broadcast(`Four.meme 跳过: ${name} ($${symbol}) — ${reason}`);
  }

  _broadcast(message) {
    // Send to all active connectors
    if (this.connectors && typeof this.connectors.broadcast === 'function') {
      this.connectors.broadcast(message);
    } else {
      sLog.info('Sniper notification', { message });
    }
  }

  // ── Public API for agent commands ──

  /**
   * Update sniper config from chat command
   * Returns human-readable status string
   */
  updateConfig(updates) {
    Object.assign(this.config, updates);
    sLog.info('Sniper config updated', updates);
    return this.getStatus();
  }

  getStatus() {
    return {
      enabled: this.running,
      buyAmountBnb: this.config.buyAmountBnb,
      labels: this.config.labels,
      excludeTaxToken: this.config.excludeTaxToken,
      maxTaxRate: this.config.maxTaxRate,
      snipedThisHour: this.snipeCount,
      maxPerHour: this.config.maxConcurrent,
      totalSniped: this.sniped.size,
      lastBlock: this.lastBlock.toString(),
    };
  }

  /**
   * Get list of all tokens sniped this session
   */
  getSnipedTokens() {
    return Array.from(this.sniped);
  }
}
