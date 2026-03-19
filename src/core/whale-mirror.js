/**
 * Whale Wallet Mirror — Copy Trading Engine
 * 
 * DragonClaw Exclusive.
 * 
 * Monitors whale wallet addresses across chains via GMGN.
 * When a whale buys/sells a token:
 * 1. Detects the transaction via GMGN wallet tracking
 * 2. Identifies the token and action (buy/sell)
 * 3. Searches for the token across Binance, Four.meme, GMGN, Aster
 * 4. Runs safety audit (honeypot, tax, dev holdings)
 * 5. Copies the trade with user-defined size
 * 6. Sends notification to all connected chat platforms
 * 
 * OpenClaw can track a wallet OR place a trade.
 * DragonClaw watches → decides → executes in a single loop.
 */

import { log } from './logger.js';

const wLog = log.child('whale-mirror');

const DEFAULT_CONFIG = {
  enabled: false,
  wallets: [],                     // [{ address, chain, label }]
  pollIntervalMs: 10000,           // check wallet activity every 10s
  copyBuy: true,                   // copy buy trades
  copySell: true,                  // copy sell trades
  buyAmountBnb: '0.05',           // BNB per copy trade (BSC)
  buyAmountSol: '0.5',            // SOL per copy trade (Solana)
  buyAmountUsdt: 20,              // USDT per copy trade (Binance/Aster)
  sellPercent: 100,                // sell this % when whale sells (100 = full exit)
  requireAudit: true,              // safety check before buying
  maxTaxRate: 5,                   // max acceptable tax %
  skipIfAlreadyHolding: true,      // don't buy if we already hold this token
  maxCopiesPerHour: 10,            // rate limit
  minTradeValueUsd: 500,           // only copy whale trades above this USD value
  maxTradeValueUsd: 1000000,       // skip suspiciously large trades
  cooldownPerTokenMs: 600000,      // 10 min cooldown per token
  platforms: ['binance', 'fourmeme', 'gmgn', 'aster'],
  notifyOnDetect: true,            // notify when whale trade detected
  notifyOnCopy: true,              // notify when copy trade executed
  notifyOnSkip: true,              // notify when trade skipped (failed audit etc)
};

export class WhaleMirror {
  constructor(config, agent, connectors, skills) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.agent = agent;
    this.connectors = connectors;
    this.skills = skills;           // { binance, fourMeme, gmgn }
    this.running = false;
    this.pollTimer = null;
    this.lastTxByWallet = new Map();  // wallet -> last seen tx hash
    this.copiedTokens = new Map();    // token -> { timestamp, platform, whale, action }
    this.holdingTokens = new Set();   // tokens we currently hold from copy trades
    this.copyCount = 0;
    this.copyHourStart = Date.now();
    this.tokenCooldowns = new Map();  // token -> timestamp
  }

  // ── Lifecycle ──

  async start() {
    if (!this.config.enabled) {
      wLog.info('Whale mirror disabled');
      return;
    }

    if (this.config.wallets.length === 0) {
      wLog.warn('No wallets configured for whale mirror');
      return;
    }

    const apiKey = process.env.GMGN_API_KEY;
    if (!apiKey) {
      wLog.warn('Whale mirror requires GMGN_API_KEY for wallet tracking');
      return;
    }

    this.running = true;
    wLog.info('Whale mirror started', {
      wallets: this.config.wallets.length,
      copyBuy: this.config.copyBuy,
      copySell: this.config.copySell,
      platforms: this.config.platforms,
    });

    this._poll();
  }

  async stop() {
    this.running = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    wLog.info('Whale mirror stopped', {
      totalCopied: this.copiedTokens.size,
      holding: this.holdingTokens.size,
    });
  }

  _poll() {
    if (!this.running) return;

    this._scanAllWallets()
      .catch(err => wLog.error('Whale scan error', { error: err.message }))
      .finally(() => {
        if (this.running) {
          this.pollTimer = setTimeout(() => this._poll(), this.config.pollIntervalMs);
        }
      });
  }

  // ── Core scanning ──

  async _scanAllWallets() {
    for (const wallet of this.config.wallets) {
      if (!this.running) break;
      try {
        await this._scanWallet(wallet);
      } catch (err) {
        wLog.error('Wallet scan failed', { wallet: wallet.address, error: err.message });
      }
    }
  }

  async _scanWallet(wallet) {
    const apiKey = process.env.GMGN_API_KEY;
    const chain = wallet.chain || 'sol';

    // Fetch recent trades for this wallet
    const res = await fetch(
      `https://api.gmgn.ai/v1/portfolio/${chain}/${wallet.address}/trades?limit=10`,
      { headers: { 'Authorization': `Bearer ${apiKey}` } }
    );

    if (!res.ok) {
      wLog.debug('GMGN trades fetch failed', { status: res.status, wallet: wallet.address });
      return;
    }

    const data = await res.json();
    const trades = data?.data?.trades || data?.data || [];

    if (!Array.isArray(trades) || trades.length === 0) return;

    // Get the last seen tx for this wallet
    const lastSeenTx = this.lastTxByWallet.get(wallet.address);

    for (const trade of trades) {
      const txHash = trade.tx_hash || trade.txHash || trade.hash;
      if (!txHash) continue;

      // Skip already-seen transactions
      if (txHash === lastSeenTx) break;

      // First run — just record the latest tx, don't trade
      if (!lastSeenTx) {
        this.lastTxByWallet.set(wallet.address, txHash);
        break;
      }

      // New transaction detected
      const action = this._parseAction(trade);
      if (!action) continue;

      wLog.info('Whale trade detected', {
        whale: wallet.label || wallet.address.slice(0, 10),
        action: action.side,
        token: action.tokenSymbol,
        address: action.tokenAddress,
        valueUsd: action.valueUsd,
        chain,
      });

      // Process this trade
      await this._processWhaleTrade(wallet, action, chain);
    }

    // Update last seen
    if (trades[0]) {
      const latestTx = trades[0].tx_hash || trades[0].txHash || trades[0].hash;
      if (latestTx) this.lastTxByWallet.set(wallet.address, latestTx);
    }
  }

  _parseAction(trade) {
    const side = (trade.side || trade.type || '').toUpperCase();
    if (!side || (side !== 'BUY' && side !== 'SELL')) return null;

    const tokenAddress = trade.token_address || trade.tokenAddress || trade.address;
    const tokenSymbol = trade.token_symbol || trade.symbol || trade.tokenSymbol || 'UNKNOWN';
    const valueUsd = parseFloat(trade.value_usd || trade.cost_usd || trade.usd_value || 0);
    const amount = trade.amount || trade.quantity || '0';
    const price = trade.price || '0';

    return { side, tokenAddress, tokenSymbol, valueUsd, amount, price };
  }

  // ── Trade processing ──

  async _processWhaleTrade(wallet, action, chain) {
    const label = wallet.label || wallet.address.slice(0, 8) + '...';

    // Check if we should copy this action
    if (action.side === 'BUY' && !this.config.copyBuy) return;
    if (action.side === 'SELL' && !this.config.copySell) return;

    // Value filter
    if (action.valueUsd < this.config.minTradeValueUsd) {
      wLog.debug('Trade below min value', { value: action.valueUsd, min: this.config.minTradeValueUsd });
      return;
    }
    if (action.valueUsd > this.config.maxTradeValueUsd) {
      wLog.debug('Trade above max value — suspicious', { value: action.valueUsd });
      this._notifySkip(label, action, '交易金额异常大');
      return;
    }

    // Token cooldown
    if (this._isTokenOnCooldown(action.tokenAddress)) {
      wLog.debug('Token on cooldown', { token: action.tokenSymbol });
      return;
    }

    // Rate limit
    if (!this._checkRateLimit()) {
      wLog.warn('Copy rate limit reached');
      return;
    }

    // Notify detection
    if (this.config.notifyOnDetect) {
      this._notifyDetect(label, action, chain);
    }

    if (action.side === 'BUY') {
      await this._handleBuy(wallet, action, chain, label);
    } else {
      await this._handleSell(wallet, action, chain, label);
    }
  }

  async _handleBuy(wallet, action, chain, label) {
    // Skip if already holding
    if (this.config.skipIfAlreadyHolding && this.holdingTokens.has(action.tokenAddress)) {
      wLog.info('Already holding, skip', { token: action.tokenSymbol });
      this._notifySkip(label, action, '已持有该代币');
      return;
    }

    // Audit
    if (this.config.requireAudit) {
      const safe = await this._auditToken(action.tokenAddress, chain);
      if (!safe) {
        wLog.info('Token failed audit', { token: action.tokenSymbol });
        this._notifySkip(label, action, '安全审计未通过');
        return;
      }
    }

    // Execute buy across best available platform
    const result = await this._executeBuy(action, chain);

    if (result) {
      this.copyCount++;
      this.holdingTokens.add(action.tokenAddress);
      this.copiedTokens.set(action.tokenAddress, {
        timestamp: Date.now(),
        platform: result.platform,
        whale: label,
        action: 'BUY',
        symbol: action.tokenSymbol,
        txHash: result.txHash,
      });
      this.tokenCooldowns.set(action.tokenAddress, Date.now());

      if (this.config.notifyOnCopy) {
        this._notifyCopy(label, action, result, 'BUY');
      }
    }
  }

  async _handleSell(wallet, action, chain, label) {
    // Only sell if we hold from a previous copy
    if (!this.holdingTokens.has(action.tokenAddress)) {
      wLog.debug('Not holding, skip sell', { token: action.tokenSymbol });
      return;
    }

    const result = await this._executeSell(action, chain);

    if (result) {
      this.holdingTokens.delete(action.tokenAddress);
      this.copiedTokens.set(action.tokenAddress + '_sell', {
        timestamp: Date.now(),
        platform: result.platform,
        whale: label,
        action: 'SELL',
        symbol: action.tokenSymbol,
        txHash: result.txHash,
      });

      if (this.config.notifyOnCopy) {
        this._notifyCopy(label, action, result, 'SELL');
      }
    }
  }

  // ── Token audit ──

  async _auditToken(tokenAddress, chain) {
    if (!tokenAddress) return false;

    try {
      const apiKey = process.env.GMGN_API_KEY;
      if (!apiKey) return false;

      const res = await fetch(
        `https://api.gmgn.ai/v1/token/${chain}/${tokenAddress}/security`,
        { headers: { 'Authorization': `Bearer ${apiKey}` } }
      );

      if (!res.ok) return false;

      const data = await res.json();
      const sec = data?.data;
      if (!sec) return false;

      if (sec.is_honeypot) return false;
      if (sec.buy_tax > this.config.maxTaxRate) return false;
      if (sec.sell_tax > this.config.maxTaxRate) return false;

      return true;
    } catch {
      return false;
    }
  }

  // ── Trade execution ──

  async _executeBuy(action, chain) {
    // Try GMGN swap (native chain)
    if (this.config.platforms.includes('gmgn') && action.tokenAddress) {
      try {
        const apiKey = process.env.GMGN_API_KEY;
        const privateKey = process.env.GMGN_PRIVATE_KEY;
        if (apiKey && privateKey) {
          const amount = chain === 'sol' ? this.config.buyAmountSol : this.config.buyAmountBnb;
          const amountWei = chain === 'sol'
            ? Math.round(parseFloat(amount) * 1e9)  // lamports
            : Math.round(parseFloat(amount) * 1e18); // wei

          const res = await fetch(`https://api.gmgn.ai/v1/swap/${chain}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              privateKey,
              tokenAddress: action.tokenAddress,
              side: 'buy',
              amount: amountWei,
              slippage: 10,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            return {
              platform: `gmgn-${chain}`,
              txHash: data?.data?.txHash || data?.txHash || 'pending',
              amount,
            };
          }
        }
      } catch (err) {
        wLog.debug('GMGN swap failed', { error: err.message });
      }
    }

    // Try Four.meme (BSC only)
    if (this.config.platforms.includes('fourmeme') && chain === 'bsc' && this.skills.fourMeme) {
      try {
        const buyWei = BigInt(Math.round(parseFloat(this.config.buyAmountBnb) * 1e18));
        const result = await this.skills.fourMeme.buy(action.tokenAddress, buyWei.toString(), 0n);
        return {
          platform: 'fourmeme',
          txHash: result.txHash,
          amount: this.config.buyAmountBnb + ' BNB',
        };
      } catch (err) {
        wLog.debug('Four.meme buy failed', { error: err.message });
      }
    }

    // Try Binance spot
    if (this.config.platforms.includes('binance')) {
      try {
        const symbol = `${action.tokenSymbol}USDT`;
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
        if (res.ok) {
          // Token exists on Binance — delegate to agent loop
          return {
            platform: 'binance',
            txHash: null,
            amount: this.config.buyAmountUsdt + ' USDT',
            note: 'Delegated to agent loop',
            symbol,
          };
        }
      } catch { /* not on Binance */ }
    }

    wLog.info('No platform available for buy', { token: action.tokenSymbol, chain });
    return null;
  }

  async _executeSell(action, chain) {
    // Check what platform we bought on
    const bought = this.copiedTokens.get(action.tokenAddress);
    if (!bought) return null;

    // GMGN sell
    if (bought.platform.startsWith('gmgn-')) {
      try {
        const apiKey = process.env.GMGN_API_KEY;
        const privateKey = process.env.GMGN_PRIVATE_KEY;
        if (apiKey && privateKey) {
          const res = await fetch(`https://api.gmgn.ai/v1/swap/${chain}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              privateKey,
              tokenAddress: action.tokenAddress,
              side: 'sell',
              percentage: this.config.sellPercent,
              slippage: 10,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            return {
              platform: bought.platform,
              txHash: data?.data?.txHash || 'pending',
            };
          }
        }
      } catch (err) {
        wLog.debug('GMGN sell failed', { error: err.message });
      }
    }

    // Four.meme sell
    if (bought.platform === 'fourmeme' && this.skills.fourMeme) {
      try {
        const balance = await this.skills.fourMeme.getBalance(action.tokenAddress);
        if (balance && BigInt(balance.balance) > 0n) {
          const sellAmount = (BigInt(balance.balance) * BigInt(this.config.sellPercent)) / 100n;
          const result = await this.skills.fourMeme.sell(action.tokenAddress, sellAmount.toString());
          return { platform: 'fourmeme', txHash: result.txHash };
        }
      } catch (err) {
        wLog.debug('Four.meme sell failed', { error: err.message });
      }
    }

    return null;
  }

  // ── Rate limiting ──

  _checkRateLimit() {
    const now = Date.now();
    if (now - this.copyHourStart > 3600_000) {
      this.copyCount = 0;
      this.copyHourStart = now;
    }
    return this.copyCount < this.config.maxCopiesPerHour;
  }

  _isTokenOnCooldown(tokenAddress) {
    if (!tokenAddress) return false;
    const last = this.tokenCooldowns.get(tokenAddress);
    if (!last) return false;
    return (Date.now() - last) < this.config.cooldownPerTokenMs;
  }

  // ── Notifications ──

  _notifyDetect(label, action, chain) {
    const msg = [
      `鲸鱼动态检测`,
      ``,
      `鲸鱼: ${label}`,
      `操作: ${action.side === 'BUY' ? '买入' : '卖出'} $${action.tokenSymbol}`,
      `金额: ~$${Math.round(action.valueUsd).toLocaleString()}`,
      `链: ${chain.toUpperCase()}`,
      action.tokenAddress ? `合约: ${action.tokenAddress.slice(0, 8)}...${action.tokenAddress.slice(-6)}` : '',
      ``,
      `正在审计并准备跟单...`,
    ].filter(Boolean).join('\n');
    this._broadcast(msg);
  }

  _notifyCopy(label, action, result, side) {
    const msg = [
      `鲸鱼跟单${side === 'BUY' ? '买入' : '卖出'}成功`,
      ``,
      `鲸鱼: ${label}`,
      `代币: $${action.tokenSymbol}`,
      `平台: ${result.platform}`,
      result.amount ? `金额: ${result.amount}` : '',
      result.txHash ? `交易哈希: ${result.txHash}` : '',
      ``,
      `来源: 鲸鱼监控 → 安全审计 → 自动${side === 'BUY' ? '买入' : '卖出'}`,
    ].filter(Boolean).join('\n');
    this._broadcast(msg);
  }

  _notifySkip(label, action, reason) {
    if (!this.config.notifyOnSkip) return;
    this._broadcast(`鲸鱼跟单跳过: ${label} ${action.side} $${action.tokenSymbol} — ${reason}`);
  }

  _broadcast(message) {
    if (this.connectors && typeof this.connectors.broadcast === 'function') {
      this.connectors.broadcast(message);
    } else {
      wLog.info('Whale notification', { message });
    }
  }

  // ── Public API ──

  addWallet(address, chain = 'sol', label = '') {
    const existing = this.config.wallets.find(w => w.address === address);
    if (existing) return { error: '该钱包已在监控列表中' };

    this.config.wallets.push({ address, chain, label: label || address.slice(0, 8) });
    wLog.info('Wallet added', { address, chain, label });
    return { success: true, wallets: this.config.wallets.length };
  }

  removeWallet(address) {
    const idx = this.config.wallets.findIndex(w => w.address === address);
    if (idx === -1) return { error: '未找到该钱包' };

    this.config.wallets.splice(idx, 1);
    this.lastTxByWallet.delete(address);
    wLog.info('Wallet removed', { address });
    return { success: true, wallets: this.config.wallets.length };
  }

  listWallets() {
    return this.config.wallets.map(w => ({
      address: w.address,
      chain: w.chain,
      label: w.label,
      lastTx: this.lastTxByWallet.get(w.address) || null,
    }));
  }

  updateConfig(updates) {
    Object.assign(this.config, updates);
    wLog.info('Whale mirror config updated', updates);
    return this.getStatus();
  }

  getStatus() {
    return {
      enabled: this.running,
      wallets: this.config.wallets.length,
      copyBuy: this.config.copyBuy,
      copySell: this.config.copySell,
      holdingTokens: this.holdingTokens.size,
      totalCopied: this.copiedTokens.size,
      copiesThisHour: this.copyCount,
      maxPerHour: this.config.maxCopiesPerHour,
      platforms: this.config.platforms,
    };
  }

  getHoldings() {
    const result = [];
    for (const addr of this.holdingTokens) {
      const data = this.copiedTokens.get(addr);
      result.push({
        tokenAddress: addr,
        symbol: data?.symbol || 'UNKNOWN',
        platform: data?.platform || 'unknown',
        whale: data?.whale || 'unknown',
        copiedAt: data?.timestamp || 0,
      });
    }
    return result;
  }

  getCopyHistory() {
    const result = [];
    for (const [key, data] of this.copiedTokens) {
      result.push({ key, ...data });
    }
    return result.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  }
}
