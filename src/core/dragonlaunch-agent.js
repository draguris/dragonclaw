/**
 * DragonLaunch Agent — Platform-Native Intelligence
 * 
 * This module only works with DragonLaunch (launch.dragonclaw.asia).
 * It gives every DragonClaw agent superpowers on our own platform:
 *
 * 1. Chat-to-Launch: "发一个币叫 DRAGONCAT" → deploys on-chain from chat
 * 2. Graduation Sniper: Monitors all curves, auto-buys before graduation
 * 3. Creator Reputation: Scores creators by history, flags bad actors
 * 4. Anti-Rug Intelligence: Watches creator wallets for dumps
 * 5. Platform Analytics: Live data on trending tokens, smart money, velocity
 * 
 * None of this works on Four.meme or any other platform.
 * We own the factory contract. We read every curve directly.
 */

import { createPublicClient, createWalletClient, http, parseAbi, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc, bscTestnet } from 'viem/chains';
import { log } from './logger.js';

const dlLog = log.child('dragonlaunch-agent');

// ═══ Contract ABIs ═══
const FACTORY_ABI = parseAbi([
  'function launch(string name, string symbol, uint256 initialBuyBnb) payable returns (address tokenAddr, address curveAddr)',
  'function totalLaunches() view returns (uint256)',
  'function getLaunch(uint256 idx) view returns (address token, address curve, address creator, string name, string symbol, uint256 timestamp)',
  'function tokenToCurve(address token) view returns (address curve)',
  'event TokenLaunched(address indexed token, address indexed curve, address indexed creator, string name, string symbol)',
]);

const CURVE_ABI = parseAbi([
  'function buy(uint256 minTokensOut) payable',
  'function sell(uint256 tokensIn, uint256 minBnbOut)',
  'function virtualBnbReserve() view returns (uint256)',
  'function virtualTokenReserve() view returns (uint256)',
  'function realBnbReserve() view returns (uint256)',
  'function realTokenReserve() view returns (uint256)',
  'function graduated() view returns (bool)',
  'function active() view returns (bool)',
  'function GRADUATION_THRESHOLD() view returns (uint256)',
  'function CURVE_SUPPLY() view returns (uint256)',
  'function bondingCurveProgress() view returns (uint256)',
  'function creator() view returns (address)',
  'function token() view returns (address)',
  'event Buy(address indexed buyer, uint256 bnbIn, uint256 tokensOut)',
  'event Sell(address indexed seller, uint256 tokensIn, uint256 bnbOut)',
  'event Graduated(address indexed pair, uint256 bnbSeeded, uint256 tokensSeeded)',
]);

const ERC20_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
]);

const DEFAULT_CONFIG = {
  enabled: true,
  network: 'testnet',
  factoryAddress: '0x7C91c8C2e354Ad1983FdbFC0B3fe2e78Ff02c370',
  rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  apiUrl: 'https://launch.dragonclaw.asia/api',
  // Graduation sniper
  sniperEnabled: false,
  sniperMinProgress: 9000,           // 90.00% in bps
  sniperBuyBnb: '0.1',              // BNB to buy before graduation
  sniperPollMs: 5000,                // check every 5s
  sniperMaxPerHour: 3,
  // Anti-rug
  antiRugEnabled: true,
  antiRugPollMs: 30000,              // check creator wallets every 30s
  antiRugDumpThreshold: 50,          // alert if creator sells >50% of allocation
  // Notifications
  notifyOnLaunch: true,
  notifyOnGraduation: true,
  notifyOnRug: true,
  notifyOnSnipe: true,
};

export class DragonLaunchAgent {
  constructor(config = {}, connectors = null) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.connectors = connectors;
    this.running = false;
    this.sniperTimer = null;
    this.antiRugTimer = null;

    // State
    this.knownTokens = new Map();        // address -> { name, symbol, creator, curveAddr, ... }
    this.creatorHistory = new Map();      // creator -> { launches: [], graduated: 0, rugged: 0 }
    this.flaggedCreators = new Set();     // creators who dumped
    this.snipeCount = 0;
    this.snipeHourStart = Date.now();
    this.holdings = new Map();            // token -> { buyPrice, amount, timestamp }

    // Clients
    const chain = this.config.network === 'mainnet' ? bsc : bscTestnet;
    this.publicClient = createPublicClient({
      chain,
      transport: http(this.config.rpcUrl),
    });
    this._walletClient = null;
    this._account = null;
  }

  _getWallet() {
    if (this._walletClient) return { wallet: this._walletClient, account: this._account };
    const pk = process.env.PRIVATE_KEY;
    if (!pk) throw new Error('PRIVATE_KEY not set');
    const key = pk.startsWith('0x') ? pk : '0x' + pk;
    const chain = this.config.network === 'mainnet' ? bsc : bscTestnet;
    this._account = privateKeyToAccount(key);
    this._walletClient = createWalletClient({
      account: this._account,
      chain,
      transport: http(this.config.rpcUrl),
    });
    return { wallet: this._walletClient, account: this._account };
  }

  // ═══════════════════════════════════════════════
  // 1. CHAT-TO-LAUNCH
  // ═══════════════════════════════════════════════

  async launchToken(name, symbol, description = '', preBuyBnb = '0', tag = 'Meme') {
    const { wallet, account } = this._getWallet();

    dlLog.info('Launching token from chat', { name, symbol, preBuyBnb });

    const value = parseEther(preBuyBnb);

    const hash = await wallet.writeContract({
      address: this.config.factoryAddress,
      abi: FACTORY_ABI,
      functionName: 'launch',
      args: [name, symbol, value],
      value,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    // Parse event to get token + curve addresses
    let tokenAddress = null, curveAddress = null;
    for (const log of receipt.logs) {
      try {
        if (log.address.toLowerCase() === this.config.factoryAddress.toLowerCase() && log.topics.length >= 4) {
          tokenAddress = '0x' + log.topics[1].slice(26);
          curveAddress = '0x' + log.topics[2].slice(26);
          break;
        }
      } catch { /* skip */ }
    }

    // Store metadata on DragonLaunch backend
    try {
      await fetch(this.config.apiUrl + '/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddress, curveAddress, name, symbol,
          description, image: '', tag,
          website: '', twitter: '', telegram: '',
          creator: account.address,
        }),
      });
    } catch (err) {
      dlLog.debug('Metadata save failed', { error: err.message });
    }

    // Track in local state
    this.knownTokens.set(tokenAddress, {
      name, symbol, creator: account.address,
      curveAddress, launched: Date.now(),
    });

    // Track creator history
    this._trackCreator(account.address, tokenAddress, name, symbol);

    const result = {
      tokenAddress,
      curveAddress,
      name,
      symbol,
      txHash: hash,
      preBuyBnb,
      launchUrl: `https://launch.dragonclaw.asia`,
      bscscanUrl: `https://testnet.bscscan.com/address/${tokenAddress}`,
    };

    if (this.config.notifyOnLaunch) {
      this._broadcast([
        `代币发射成功 🚀`,
        ``,
        `名称: ${name} ($${symbol})`,
        `合约: ${tokenAddress}`,
        `曲线: ${curveAddress}`,
        preBuyBnb !== '0' ? `初始买入: ${preBuyBnb} BNB` : '',
        ``,
        `交易哈希: ${hash}`,
        `链接: ${result.launchUrl}`,
      ].filter(Boolean).join('\n'));
    }

    dlLog.info('Token launched', result);
    return result;
  }

  // ═══════════════════════════════════════════════
  // 2. GRADUATION SNIPER
  // ═══════════════════════════════════════════════

  async startSniper() {
    if (!this.config.sniperEnabled) {
      dlLog.info('Graduation sniper disabled');
      return;
    }

    this.running = true;
    dlLog.info('Graduation sniper started', {
      minProgress: this.config.sniperMinProgress / 100 + '%',
      buyBnb: this.config.sniperBuyBnb,
    });

    this._pollSniper();
  }

  _pollSniper() {
    if (!this.running) return;
    this._scanCurves()
      .catch(err => dlLog.error('Sniper scan error', { error: err.message }))
      .finally(() => {
        if (this.running) {
          this.sniperTimer = setTimeout(() => this._pollSniper(), this.config.sniperPollMs);
        }
      });
  }

  async _scanCurves() {
    const total = await this.publicClient.readContract({
      address: this.config.factoryAddress,
      abi: FACTORY_ABI,
      functionName: 'totalLaunches',
    });

    const count = Number(total);
    // Scan most recent 50 tokens
    const start = Math.max(0, count - 50);

    for (let i = count - 1; i >= start; i--) {
      const [tokenAddr, curveAddr, creator, name, symbol] = await this.publicClient.readContract({
        address: this.config.factoryAddress,
        abi: FACTORY_ABI,
        functionName: 'getLaunch',
        args: [BigInt(i)],
      });

      // Check curve state
      const [progress, graduated, rBnb, threshold] = await Promise.all([
        this.publicClient.readContract({ address: curveAddr, abi: CURVE_ABI, functionName: 'bondingCurveProgress' }),
        this.publicClient.readContract({ address: curveAddr, abi: CURVE_ABI, functionName: 'graduated' }),
        this.publicClient.readContract({ address: curveAddr, abi: CURVE_ABI, functionName: 'realBnbReserve' }),
        this.publicClient.readContract({ address: curveAddr, abi: CURVE_ABI, functionName: 'GRADUATION_THRESHOLD' }),
      ]);

      if (graduated) continue; // already graduated

      const progressPct = Number(progress);
      const bnbRaised = formatEther(rBnb);
      const bnbTarget = formatEther(threshold);
      const bnbRemaining = Number(bnbTarget) - Number(bnbRaised);

      // Track
      this.knownTokens.set(tokenAddr, {
        name, symbol, creator, curveAddress: curveAddr,
        progress: progressPct / 100,
        bnbRaised, bnbTarget, bnbRemaining,
      });

      // Track creator
      this._trackCreator(creator, tokenAddr, name, symbol);

      // Check if near graduation
      if (progressPct >= this.config.sniperMinProgress) {
        dlLog.info('Near graduation detected', {
          token: symbol,
          progress: progressPct / 100 + '%',
          bnbRemaining: bnbRemaining.toFixed(4),
        });

        // Auto-buy if within rate limit
        if (this._checkSnipeLimit()) {
          await this._snipeBuy(tokenAddr, curveAddr, name, symbol, bnbRemaining);
        }
      }
    }
  }

  async _snipeBuy(tokenAddr, curveAddr, name, symbol, bnbRemaining) {
    try {
      const { wallet } = this._getWallet();
      const buyAmount = parseEther(this.config.sniperBuyBnb);

      dlLog.info('Snipe buying before graduation', { token: symbol, amount: this.config.sniperBuyBnb });

      const hash = await wallet.writeContract({
        address: curveAddr,
        abi: CURVE_ABI,
        functionName: 'buy',
        args: [0n], // minTokensOut = 0 (accept any)
        value: buyAmount,
      });

      await this.publicClient.waitForTransactionReceipt({ hash });

      this.snipeCount++;
      this.holdings.set(tokenAddr, {
        symbol,
        buyBnb: this.config.sniperBuyBnb,
        timestamp: Date.now(),
        type: 'graduation-snipe',
      });

      if (this.config.notifyOnSnipe) {
        this._broadcast([
          `毕业狙击成功 🎯`,
          ``,
          `代币: ${name} ($${symbol})`,
          `买入: ${this.config.sniperBuyBnb} BNB`,
          `距毕业: ${bnbRemaining.toFixed(4)} BNB`,
          ``,
          `毕业后将自动上 PancakeSwap，价格通常会上涨。`,
          `交易哈希: ${hash}`,
        ].join('\n'));
      }

      dlLog.info('Snipe buy executed', { token: symbol, txHash: hash });
    } catch (err) {
      dlLog.error('Snipe buy failed', { token: symbol, error: err.message });
    }
  }

  _checkSnipeLimit() {
    const now = Date.now();
    if (now - this.snipeHourStart > 3600_000) {
      this.snipeCount = 0;
      this.snipeHourStart = now;
    }
    return this.snipeCount < this.config.sniperMaxPerHour;
  }

  // ═══════════════════════════════════════════════
  // 3. CREATOR REPUTATION SCORING
  // ═══════════════════════════════════════════════

  _trackCreator(creator, tokenAddr, name, symbol) {
    if (!this.creatorHistory.has(creator)) {
      this.creatorHistory.set(creator, {
        launches: [],
        graduated: 0,
        rugged: 0,
        firstSeen: Date.now(),
      });
    }

    const history = this.creatorHistory.get(creator);
    const existing = history.launches.find(l => l.token === tokenAddr);
    if (!existing) {
      history.launches.push({ token: tokenAddr, name, symbol, timestamp: Date.now() });
    }
  }

  getCreatorScore(creator) {
    const history = this.creatorHistory.get(creator?.toLowerCase?.() || creator);
    if (!history) return { score: 0, risk: 'unknown', launches: 0, graduated: 0, rugged: 0 };

    const total = history.launches.length;
    const graduated = history.graduated;
    const rugged = history.rugged;
    const flagged = this.flaggedCreators.has(creator);

    let score = 50; // base score
    score += graduated * 15;     // +15 per graduation
    score -= rugged * 30;        // -30 per rug
    score += Math.min(total, 5) * 3; // +3 per launch (max 15)
    if (flagged) score -= 50;    // -50 if flagged for dumping
    score = Math.max(0, Math.min(100, score));

    let risk = 'medium';
    if (score >= 75) risk = 'low';
    else if (score >= 50) risk = 'medium';
    else if (score >= 25) risk = 'high';
    else risk = 'dangerous';

    return {
      score,
      risk,
      launches: total,
      graduated,
      rugged,
      flagged,
      successRate: total > 0 ? Math.round((graduated / total) * 100) : 0,
    };
  }

  getCreatorReport(creator) {
    const score = this.getCreatorScore(creator);
    const history = this.creatorHistory.get(creator) || { launches: [] };

    const riskEmoji = { low: '🟢', medium: '🟡', high: '🟠', dangerous: '🔴', unknown: '⚪' };

    return [
      `创建者信用报告`,
      ``,
      `地址: ${creator.slice(0, 8)}...${creator.slice(-6)}`,
      `信用分: ${score.score}/100 ${riskEmoji[score.risk]}`,
      `风险等级: ${score.risk === 'low' ? '低' : score.risk === 'medium' ? '中' : score.risk === 'high' ? '高' : score.risk === 'dangerous' ? '危险' : '未知'}`,
      ``,
      `发射: ${score.launches} 个代币`,
      `毕业: ${score.graduated} 个 (${score.successRate}%)`,
      `跑路: ${score.rugged} 个`,
      score.flagged ? `⚠️ 此创建者有抛售记录` : '',
      ``,
      `最近发射:`,
      ...history.launches.slice(-5).map(l =>
        `  ${l.symbol} — ${new Date(l.timestamp).toLocaleDateString('zh-CN')}`
      ),
    ].filter(Boolean).join('\n');
  }

  // ═══════════════════════════════════════════════
  // 4. ANTI-RUG INTELLIGENCE
  // ═══════════════════════════════════════════════

  async startAntiRug() {
    if (!this.config.antiRugEnabled) return;

    dlLog.info('Anti-rug monitor started');
    this._pollAntiRug();
  }

  _pollAntiRug() {
    if (!this.running) return;
    this._checkCreatorWallets()
      .catch(err => dlLog.error('Anti-rug scan error', { error: err.message }))
      .finally(() => {
        if (this.running) {
          this.antiRugTimer = setTimeout(() => this._pollAntiRug(), this.config.antiRugPollMs);
        }
      });
  }

  async _checkCreatorWallets() {
    for (const [tokenAddr, info] of this.knownTokens) {
      if (!info.creator || !info.curveAddress) continue;

      try {
        // Check if the curve is still active (pre-graduation)
        const graduated = await this.publicClient.readContract({
          address: info.curveAddress,
          abi: CURVE_ABI,
          functionName: 'graduated',
        });

        if (graduated) continue; // only monitor pre-graduation

        // Check creator's token balance
        // Creator gets 20% allocation = 200M tokens
        const creatorBalance = await this.publicClient.readContract({
          address: tokenAddr,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [info.creator],
        });

        const totalAllocation = 200_000_000n * (10n ** 18n); // 20% of 1B
        const balancePct = Number(creatorBalance * 100n / totalAllocation);

        // If creator has sold more than threshold% of their allocation
        if (balancePct < (100 - this.config.antiRugDumpThreshold)) {
          if (!this.flaggedCreators.has(info.creator)) {
            this.flaggedCreators.add(info.creator);

            const history = this.creatorHistory.get(info.creator);
            if (history) history.rugged++;

            dlLog.warn('Creator dump detected', {
              token: info.symbol,
              creator: info.creator,
              remainingPct: balancePct + '%',
            });

            if (this.config.notifyOnRug) {
              this._broadcast([
                `⚠️ 创建者抛售警报`,
                ``,
                `代币: ${info.name} ($${info.symbol})`,
                `创建者: ${info.creator.slice(0, 8)}...${info.creator.slice(-6)}`,
                `剩余分配: ${balancePct}%`,
                `已卖出: ${100 - balancePct}% 创建者分配`,
                ``,
                `此创建者已被标记。未来发射将显示警告。`,
              ].join('\n'));
            }
          }
        }
      } catch { /* skip failed reads */ }
    }
  }

  // ═══════════════════════════════════════════════
  // 5. PLATFORM ANALYTICS
  // ═══════════════════════════════════════════════

  async getPlatformStats() {
    const total = await this.publicClient.readContract({
      address: this.config.factoryAddress,
      abi: FACTORY_ABI,
      functionName: 'totalLaunches',
    });

    let graduated = 0;
    let totalBnbRaised = 0n;
    let activeCurves = 0;
    const trending = []; // tokens with most progress in last scan

    const count = Number(total);
    for (let i = Math.max(0, count - 50); i < count; i++) {
      try {
        const [tokenAddr, curveAddr, creator, name, symbol, ts] = await this.publicClient.readContract({
          address: this.config.factoryAddress,
          abi: FACTORY_ABI,
          functionName: 'getLaunch',
          args: [BigInt(i)],
        });

        const [grad, rBnb, progress] = await Promise.all([
          this.publicClient.readContract({ address: curveAddr, abi: CURVE_ABI, functionName: 'graduated' }),
          this.publicClient.readContract({ address: curveAddr, abi: CURVE_ABI, functionName: 'realBnbReserve' }),
          this.publicClient.readContract({ address: curveAddr, abi: CURVE_ABI, functionName: 'bondingCurveProgress' }),
        ]);

        if (grad) graduated++;
        else activeCurves++;
        totalBnbRaised += rBnb;

        if (!grad && Number(progress) > 0) {
          trending.push({
            token: tokenAddr,
            symbol,
            name,
            progress: Number(progress) / 100,
            bnbRaised: formatEther(rBnb),
            creator,
          });
        }
      } catch { /* skip */ }
    }

    trending.sort((a, b) => b.progress - a.progress);

    return {
      totalLaunches: count,
      graduated,
      activeCurves,
      graduationRate: count > 0 ? Math.round((graduated / count) * 100) : 0,
      totalBnbRaised: formatEther(totalBnbRaised),
      trending: trending.slice(0, 10),
      creatorsTracked: this.creatorHistory.size,
      flaggedCreators: this.flaggedCreators.size,
    };
  }

  async getTrendingReport() {
    const stats = await this.getPlatformStats();

    const lines = [
      `DragonLaunch 平台报告`,
      ``,
      `总发射: ${stats.totalLaunches}`,
      `已毕业: ${stats.graduated} (${stats.graduationRate}%)`,
      `活跃曲线: ${stats.activeCurves}`,
      `总筹集: ${stats.totalBnbRaised} BNB`,
      `追踪创建者: ${stats.creatorsTracked}`,
      `标记创建者: ${stats.flaggedCreators}`,
    ];

    if (stats.trending.length > 0) {
      lines.push('', '热门代币 (按进度排序):');
      for (const t of stats.trending.slice(0, 5)) {
        const score = this.getCreatorScore(t.creator);
        const risk = { low: '🟢', medium: '🟡', high: '🟠', dangerous: '🔴' }[score.risk] || '⚪';
        lines.push(`  ${t.symbol} — ${t.progress.toFixed(1)}% — ${t.bnbRaised} BNB — 创建者 ${risk} ${score.score}/100`);
      }
    }

    return lines.join('\n');
  }

  // ═══════════════════════════════════════════════
  // 6. PORTFOLIO TRACKING
  // ═══════════════════════════════════════════════

  async getMyHoldings() {
    const { account } = this._getWallet();
    const holdings = [];

    for (const [tokenAddr, info] of this.knownTokens) {
      try {
        const balance = await this.publicClient.readContract({
          address: tokenAddr,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [account.address],
        });

        if (balance > 0n) {
          holdings.push({
            token: tokenAddr,
            symbol: info.symbol,
            name: info.name,
            balance: formatEther(balance),
            curveAddress: info.curveAddress,
            buyInfo: this.holdings.get(tokenAddr) || null,
          });
        }
      } catch { /* skip */ }
    }

    return holdings;
  }

  // ═══════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════

  async start() {
    this.running = true;
    dlLog.info('DragonLaunch agent started');

    // Load existing tokens from factory
    await this._loadExistingTokens();

    // Start background monitors
    if (this.config.sniperEnabled) await this.startSniper();
    if (this.config.antiRugEnabled) await this.startAntiRug();
  }

  async stop() {
    this.running = false;
    if (this.sniperTimer) clearTimeout(this.sniperTimer);
    if (this.antiRugTimer) clearTimeout(this.antiRugTimer);
    dlLog.info('DragonLaunch agent stopped');
  }

  async _loadExistingTokens() {
    try {
      const total = await this.publicClient.readContract({
        address: this.config.factoryAddress,
        abi: FACTORY_ABI,
        functionName: 'totalLaunches',
      });

      const count = Number(total);
      for (let i = 0; i < count; i++) {
        try {
          const [tokenAddr, curveAddr, creator, name, symbol] = await this.publicClient.readContract({
            address: this.config.factoryAddress,
            abi: FACTORY_ABI,
            functionName: 'getLaunch',
            args: [BigInt(i)],
          });

          this.knownTokens.set(tokenAddr, { name, symbol, creator, curveAddress: curveAddr });
          this._trackCreator(creator, tokenAddr, name, symbol);
        } catch { /* skip */ }
      }

      dlLog.info('Loaded existing tokens', { count });
    } catch (err) {
      dlLog.error('Failed to load tokens', { error: err.message });
    }
  }

  // ═══ Notifications ═══

  _broadcast(message) {
    if (this.connectors && typeof this.connectors.broadcast === 'function') {
      this.connectors.broadcast(message);
    } else {
      dlLog.info('DragonLaunch notification', { message });
    }
  }

  // ═══ Public status ═══

  getStatus() {
    return {
      enabled: this.running,
      tokensTracked: this.knownTokens.size,
      creatorsTracked: this.creatorHistory.size,
      flaggedCreators: this.flaggedCreators.size,
      sniperEnabled: this.config.sniperEnabled,
      snipesThisHour: this.snipeCount,
      antiRugEnabled: this.config.antiRugEnabled,
      holdings: this.holdings.size,
    };
  }

  updateConfig(updates) {
    Object.assign(this.config, updates);
    dlLog.info('Config updated', updates);
    return this.getStatus();
  }
}
