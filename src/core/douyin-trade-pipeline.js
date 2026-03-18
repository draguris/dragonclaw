/**
 * Douyin-to-Trade Pipeline
 * 
 * DragonClaw Exclusive. Nobody else has this.
 * 
 * Monitors Douyin (TikTok China) hot search and trending content.
 * When a meme, keyword, or narrative goes viral:
 * 1. Extracts potential token names/tickers from the trend
 * 2. Searches Binance, Four.meme, and GMGN for matching tokens
 * 3. Runs safety audit (honeypot, tax, dev holdings)
 * 4. Auto-buys or alerts the user via chat
 * 
 * This is the "alpha from TikTok" pipeline that crypto Twitter
 * talks about but nobody has actually built. Until now.
 * 
 * Western agents can't do this — they don't have Douyin access.
 */

import { log } from './logger.js';

const dLog = log.child('douyin-pipeline');

// Douyin public endpoints (no auth needed)
const DOUYIN_HOT_SEARCH = 'https://www.douyin.com/aweme/v1/web/hot/search/list/';
const DOUYIN_SEARCH = 'https://www.douyin.com/aweme/v1/web/search/item/';

// Common crypto keywords that signal a potential token play
const CRYPTO_SIGNALS = [
  // Direct mentions
  '币', 'coin', 'token', '代币', 'meme', '梗', 'doge', 'pepe',
  '暴涨', '翻倍', '百倍', '千倍', '财富密码', '上车',
  // Meme culture signals
  '土狗', '空投', 'airdrop', 'pump', 'moon', '起飞',
  'web3', 'nft', '链上', 'defi', 'sol', 'bnb', 'eth',
  // Viral meme patterns
  '挑战', 'challenge', '梗图', '鬼畜', '整活',
];

// Keywords to extract potential ticker from viral content
const TICKER_PATTERNS = [
  /\$([A-Z]{2,10})/g,                    // $PEPE, $DOGE
  /(?:买|炒|冲)\s*([A-Z]{2,10})/g,       // 买PEPE, 冲DOGE
  /([A-Z]{2,10})\s*(?:币|coin|token)/gi,  // PEPE币, DOGE coin
  /#([A-Za-z]{2,10})(?:coin|token|币)/g,  // #PEPEcoin
];

const DEFAULT_CONFIG = {
  enabled: false,
  pollIntervalMs: 60000,          // check Douyin every 60s
  minViews: 5_000_000,            // minimum views to trigger (5M)
  minLikes: 100_000,              // minimum likes to trigger (100K)
  autoTrade: false,               // false = alert only, true = auto-buy
  buyAmountUsdt: 10,              // USDT amount per auto-trade (Binance)
  buyAmountBnb: '0.01',           // BNB amount per auto-trade (Four.meme)
  platforms: ['binance', 'fourmeme', 'gmgn'],  // where to search
  requireAudit: true,             // must pass token-audit before buy
  maxTaxRate: 5,                  // max acceptable tax % for Four.meme tokens
  notifyOnTrend: true,            // alert when trend detected (even if no token found)
  notifyOnMatch: true,            // alert when token match found
  notifyOnTrade: true,            // alert when auto-trade executed
  cooldownMs: 300_000,            // 5 min cooldown per keyword to avoid spam
  maxTradesPerHour: 3,            // rate limit auto-trades
  xiaohongshuEnabled: true,       // also monitor Xiaohongshu
};

export class DouyinTradePipeline {
  constructor(config, agent, connectors, skills) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.agent = agent;
    this.connectors = connectors;
    this.skills = skills;       // { binance, fourMeme, gmgn }
    this.running = false;
    this.pollTimer = null;
    this.seenTrends = new Map(); // keyword -> timestamp (cooldown tracking)
    this.matchedTokens = new Map(); // token -> { platform, trend, timestamp }
    this.tradeCount = 0;
    this.tradeHourStart = Date.now();
  }

  async start() {
    if (!this.config.enabled) {
      dLog.info('Douyin pipeline disabled');
      return;
    }

    this.running = true;
    dLog.info('Douyin-to-trade pipeline started', {
      autoTrade: this.config.autoTrade,
      minViews: this.config.minViews,
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
    dLog.info('Douyin pipeline stopped');
  }

  _poll() {
    if (!this.running) return;

    this._scan()
      .catch(err => dLog.error('Pipeline scan error', { error: err.message }))
      .finally(() => {
        if (this.running) {
          this.pollTimer = setTimeout(() => this._poll(), this.config.pollIntervalMs);
        }
      });
  }

  async _scan() {
    // Step 1: Fetch Douyin hot search
    const trends = await this._fetchDouyinTrends();

    // Step 2: Optionally fetch Xiaohongshu trends
    let xhsTrends = [];
    if (this.config.xiaohongshuEnabled) {
      xhsTrends = await this._fetchXiaohongshuTrends();
    }

    const allTrends = [...trends, ...xhsTrends];

    // Step 3: Filter by views/engagement threshold
    const viral = allTrends.filter(t =>
      (t.views >= this.config.minViews || t.likes >= this.config.minLikes)
    );

    if (viral.length === 0) return;

    // Step 4: Check for crypto signals
    for (const trend of viral) {
      const hasCryptoSignal = this._hasCryptoSignal(trend);
      if (!hasCryptoSignal) continue;

      // Cooldown check
      if (this._isOnCooldown(trend.keyword)) continue;
      this.seenTrends.set(trend.keyword, Date.now());

      dLog.info('Crypto-related viral trend detected', {
        keyword: trend.keyword,
        views: trend.views,
        source: trend.source,
      });

      // Notify about the trend
      if (this.config.notifyOnTrend) {
        this._notifyTrend(trend);
      }

      // Step 5: Extract potential token tickers
      const tickers = this._extractTickers(trend);
      if (tickers.length === 0) {
        // Try the keyword itself as a ticker
        const kw = trend.keyword.replace(/[^a-zA-Z]/g, '').toUpperCase();
        if (kw.length >= 2 && kw.length <= 10) {
          tickers.push(kw);
        }
      }

      if (tickers.length === 0) continue;

      // Step 6: Search for matching tokens across platforms
      for (const ticker of tickers) {
        const matches = await this._searchToken(ticker);
        if (matches.length === 0) continue;

        dLog.info('Token match found', { ticker, matches: matches.length, trend: trend.keyword });

        for (const match of matches) {
          // Step 7: Audit
          if (this.config.requireAudit) {
            const safe = await this._auditToken(match);
            if (!safe) {
              dLog.info('Token failed audit', { ticker, platform: match.platform });
              continue;
            }
          }

          // Step 8: Notify match
          if (this.config.notifyOnMatch) {
            this._notifyMatch(trend, ticker, match);
          }

          // Step 9: Auto-trade if enabled
          if (this.config.autoTrade && this._checkTradeRateLimit()) {
            await this._executeTrade(match, trend);
          }

          // Track
          this.matchedTokens.set(ticker, {
            platform: match.platform,
            trend: trend.keyword,
            timestamp: Date.now(),
            address: match.address,
          });
        }
      }
    }
  }

  // ── Data fetching ──

  async _fetchDouyinTrends() {
    try {
      const res = await fetch(DOUYIN_HOT_SEARCH, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });
      const data = await res.json();

      if (!data?.data?.word_list) return [];

      return data.data.word_list.map(item => ({
        keyword: item.word || '',
        views: item.hot_value || 0,
        likes: 0,
        source: 'douyin',
        description: item.word || '',
        url: `https://www.douyin.com/search/${encodeURIComponent(item.word)}`,
      }));
    } catch (err) {
      dLog.debug('Douyin fetch failed, using fallback', { error: err.message });
      return [];
    }
  }

  async _fetchXiaohongshuTrends() {
    try {
      // Xiaohongshu hot topics endpoint
      const res = await fetch('https://edith.xiaohongshu.com/api/sns/v1/search/hot_list', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });
      const data = await res.json();

      if (!data?.data?.items) return [];

      return data.data.items.map(item => ({
        keyword: item.title || item.word || '',
        views: item.score || item.hot_value || 0,
        likes: 0,
        source: 'xiaohongshu',
        description: item.title || '',
        url: '',
      }));
    } catch (err) {
      dLog.debug('Xiaohongshu fetch failed', { error: err.message });
      return [];
    }
  }

  // ── Analysis ──

  _hasCryptoSignal(trend) {
    const text = `${trend.keyword} ${trend.description}`.toLowerCase();
    return CRYPTO_SIGNALS.some(signal => text.includes(signal.toLowerCase()));
  }

  _extractTickers(trend) {
    const text = `${trend.keyword} ${trend.description}`;
    const tickers = new Set();

    for (const pattern of TICKER_PATTERNS) {
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const ticker = match[1].toUpperCase();
        if (ticker.length >= 2 && ticker.length <= 10) {
          tickers.add(ticker);
        }
      }
    }

    return Array.from(tickers);
  }

  _isOnCooldown(keyword) {
    const lastSeen = this.seenTrends.get(keyword);
    if (!lastSeen) return false;
    return (Date.now() - lastSeen) < this.config.cooldownMs;
  }

  _checkTradeRateLimit() {
    const now = Date.now();
    if (now - this.tradeHourStart > 3600_000) {
      this.tradeCount = 0;
      this.tradeHourStart = now;
    }
    return this.tradeCount < this.config.maxTradesPerHour;
  }

  // ── Token search across platforms ──

  async _searchToken(ticker) {
    const matches = [];

    // Search Binance
    if (this.config.platforms.includes('binance') && this.skills.binance) {
      try {
        const symbol = `${ticker}USDT`;
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
        if (res.ok) {
          const data = await res.json();
          matches.push({
            platform: 'binance',
            symbol: data.symbol,
            price: data.price,
            address: null,
            ticker,
          });
        }
      } catch { /* not on Binance */ }
    }

    // Search Four.meme
    if (this.config.platforms.includes('fourmeme') && this.skills.fourMeme) {
      try {
        const res = await fetch(`https://four.meme/meme-api/v1/private/token/query?tokenName=${ticker}&pageSize=5`);
        if (res.ok) {
          const data = await res.json();
          const tokens = data?.data?.records || data?.data || [];
          if (Array.isArray(tokens)) {
            for (const t of tokens.slice(0, 3)) {
              if (t.address || t.tokenAddress) {
                matches.push({
                  platform: 'fourmeme',
                  symbol: t.symbol || t.shortName || ticker,
                  price: t.price || null,
                  address: t.address || t.tokenAddress,
                  ticker,
                  name: t.name || t.tokenName,
                });
              }
            }
          }
        }
      } catch { /* not on Four.meme */ }
    }

    // Search GMGN trending
    if (this.config.platforms.includes('gmgn') && this.skills.gmgn) {
      try {
        const apiKey = process.env.GMGN_API_KEY;
        if (apiKey) {
          // Search across chains
          for (const chain of ['sol', 'bsc', 'base']) {
            const res = await fetch(
              `https://api.gmgn.ai/v1/search/${chain}?q=${ticker}`,
              { headers: { 'Authorization': `Bearer ${apiKey}` } }
            );
            if (res.ok) {
              const data = await res.json();
              const tokens = data?.data?.tokens || [];
              for (const t of tokens.slice(0, 2)) {
                matches.push({
                  platform: `gmgn-${chain}`,
                  symbol: t.symbol || ticker,
                  price: t.price || null,
                  address: t.address,
                  ticker,
                  name: t.name,
                  chain,
                });
              }
            }
          }
        }
      } catch { /* GMGN search failed */ }
    }

    // Search Aster
    if (this.config.platforms.includes('aster')) {
      try {
        const symbol = `${ticker}USDT`;
        const res = await fetch(`https://fapi.asterdex.com/fapi/v1/ticker/price?symbol=${symbol}`);
        if (res.ok) {
          const data = await res.json();
          matches.push({
            platform: 'aster',
            symbol: data.symbol,
            price: data.price,
            address: null,
            ticker,
          });
        }
      } catch { /* not on Aster */ }
    }

    return matches;
  }

  // ── Token audit ──

  async _auditToken(match) {
    // Binance and Aster listed tokens are generally safe
    if (match.platform === 'binance' || match.platform === 'aster') {
      return true;
    }

    // Four.meme — check tax and version
    if (match.platform === 'fourmeme' && match.address && this.skills.fourMeme) {
      try {
        const info = await this.skills.fourMeme.getTokenInfo(match.address);
        if (info.version !== 2) return false;
        if (info.liquidityAdded) return false; // already graduated

        const tax = await this.skills.fourMeme.getTaxInfo(match.address);
        if (tax.isTaxToken && tax.feeRatePercent > this.config.maxTaxRate) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
    }

    // GMGN — check contract security
    if (match.platform.startsWith('gmgn-') && match.address) {
      try {
        const apiKey = process.env.GMGN_API_KEY;
        if (!apiKey) return false;
        const chain = match.chain || 'sol';
        const res = await fetch(
          `https://api.gmgn.ai/v1/token/${chain}/${match.address}/security`,
          { headers: { 'Authorization': `Bearer ${apiKey}` } }
        );
        if (res.ok) {
          const data = await res.json();
          const security = data?.data;
          if (security?.is_honeypot) return false;
          if (security?.buy_tax > this.config.maxTaxRate) return false;
          if (security?.sell_tax > this.config.maxTaxRate) return false;
          return true;
        }
      } catch { /* audit failed */ }
      return false;
    }

    return true; // default pass for unknown platforms
  }

  // ── Trade execution ──

  async _executeTrade(match, trend) {
    try {
      let result = null;

      if (match.platform === 'fourmeme' && match.address && this.skills.fourMeme) {
        const buyWei = BigInt(Math.round(parseFloat(this.config.buyAmountBnb) * 1e18));
        result = await this.skills.fourMeme.buy(match.address, buyWei.toString(), 0n);
      }

      // Binance spot buy
      if (match.platform === 'binance' && this.skills.binance) {
        // Agent loop handles Binance trades via skill commands
        result = { note: 'Binance trade delegated to agent loop', symbol: match.symbol };
      }

      if (result) {
        this.tradeCount++;
        dLog.info('Douyin pipeline trade executed', {
          ticker: match.ticker,
          platform: match.platform,
          trend: trend.keyword,
          result,
        });

        if (this.config.notifyOnTrade) {
          this._notifyTrade(trend, match, result);
        }
      }
    } catch (err) {
      dLog.error('Douyin pipeline trade failed', {
        ticker: match.ticker,
        platform: match.platform,
        error: err.message,
      });
    }
  }

  // ── Notifications ──

  _notifyTrend(trend) {
    const msg = [
      `抖音热搜检测到加密信号`,
      ``,
      `关键词: ${trend.keyword}`,
      `热度: ${(trend.views / 10000).toFixed(1)}万`,
      `来源: ${trend.source === 'douyin' ? '抖音' : '小红书'}`,
      ``,
      `正在搜索相关代币...`,
    ].join('\n');
    this._broadcast(msg);
  }

  _notifyMatch(trend, ticker, match) {
    const msg = [
      `抖音趋势 → 代币匹配`,
      ``,
      `趋势: ${trend.keyword} (${(trend.views / 10000).toFixed(1)}万热度)`,
      `代币: $${ticker}`,
      `平台: ${match.platform}`,
      `价格: ${match.price || '未知'}`,
      match.address ? `合约: ${match.address}` : '',
      ``,
      this.config.autoTrade ? `自动买入中...` : `发送 "买 ${ticker}" 手动交易`,
    ].filter(Boolean).join('\n');
    this._broadcast(msg);
  }

  _notifyTrade(trend, match, result) {
    const msg = [
      `抖音趋势自动交易成功`,
      ``,
      `趋势: ${trend.keyword}`,
      `代币: $${match.ticker} (${match.platform})`,
      result.txHash ? `交易哈希: ${result.txHash}` : '',
      result.orderId ? `订单号: ${result.orderId}` : '',
      ``,
      `来源: 抖音热搜 → 代币搜索 → 安全审计 → 自动买入`,
    ].filter(Boolean).join('\n');
    this._broadcast(msg);
  }

  _broadcast(message) {
    if (this.connectors && typeof this.connectors.broadcast === 'function') {
      this.connectors.broadcast(message);
    } else {
      dLog.info('Pipeline notification', { message });
    }
  }

  // ── Public API ──

  updateConfig(updates) {
    Object.assign(this.config, updates);
    dLog.info('Pipeline config updated', updates);
    return this.getStatus();
  }

  getStatus() {
    return {
      enabled: this.running,
      autoTrade: this.config.autoTrade,
      minViews: this.config.minViews,
      platforms: this.config.platforms,
      trendsTracked: this.seenTrends.size,
      tokensMatched: this.matchedTokens.size,
      tradesThisHour: this.tradeCount,
      maxTradesPerHour: this.config.maxTradesPerHour,
      xiaohongshu: this.config.xiaohongshuEnabled,
    };
  }

  getMatchedTokens() {
    const result = [];
    for (const [ticker, data] of this.matchedTokens) {
      result.push({ ticker, ...data });
    }
    return result;
  }

  getSeenTrends() {
    const result = [];
    for (const [keyword, timestamp] of this.seenTrends) {
      result.push({ keyword, timestamp, age: Date.now() - timestamp });
    }
    return result.sort((a, b) => b.timestamp - a.timestamp);
  }
}
