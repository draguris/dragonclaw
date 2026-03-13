/**
 * Binance API Client
 * 
 * Handles authenticated (signed) and public API calls.
 * Supports both mainnet and testnet.
 * Uses HMAC-SHA256 for request signing per Binance API spec.
 */

import { createHmac } from 'crypto';

const MAINNET_BASE = 'https://api.binance.com';
const TESTNET_BASE = 'https://testnet.binance.vision';
const WEB3_BASE = 'https://web3.binance.com';

export class BinanceClient {
  constructor(binanceConfig) {
    this.apiKey = binanceConfig.apiKey;
    this.secretKey = binanceConfig.secretKey;
    this.testnet = binanceConfig.testnet !== false;
    this.baseUrl = this.testnet ? TESTNET_BASE : MAINNET_BASE;
  }

  /**
   * Public GET (no auth needed) — for market data, token info, etc.
   */
  async get(endpoint, params = {}) {
    // Web3 endpoints use a different base
    if (endpoint.startsWith('/bapi/')) {
      return this._fetchWeb3(endpoint, params);
    }

    const qs = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}${endpoint}${qs ? '?' + qs : ''}`;

    const headers = {};
    if (this.apiKey) {
      headers['X-MBX-APIKEY'] = this.apiKey;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Binance GET ${endpoint} failed (${res.status}): ${text.slice(0, 200)}`);
    }
    return res.json();
  }

  /**
   * Signed POST — for placing orders, requires API key + secret
   */
  async post(endpoint, params = {}) {
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Binance API key and secret required for trading. Configure in dragonclaw.yaml');
    }

    // Add timestamp and sign
    params.timestamp = Date.now();
    params.recvWindow = params.recvWindow || 5000;

    const queryString = new URLSearchParams(params).toString();
    const signature = createHmac('sha256', this.secretKey)
      .update(queryString)
      .digest('hex');

    const url = `${this.baseUrl}${endpoint}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': this.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `${queryString}&signature=${signature}`,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Binance POST ${endpoint} failed (${res.status}): ${text.slice(0, 200)}`);
    }
    return res.json();
  }

  /**
   * Web3 public endpoints (meme rush, token audit, etc.) — no auth needed
   */
  async _fetchWeb3(endpoint, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = `${WEB3_BASE}${endpoint}${qs ? '?' + qs : ''}`;

    const res = await fetch(url, {
      headers: { 'Accept-Encoding': 'identity' },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Binance Web3 ${endpoint} failed (${res.status}): ${text.slice(0, 200)}`);
    }
    return res.json();
  }

  /**
   * Signed GET — for account info, order status, etc.
   */
  async signedGet(endpoint, params = {}) {
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Binance API key and secret required');
    }

    params.timestamp = Date.now();
    params.recvWindow = params.recvWindow || 5000;

    const queryString = new URLSearchParams(params).toString();
    const signature = createHmac('sha256', this.secretKey)
      .update(queryString)
      .digest('hex');

    const url = `${this.baseUrl}${endpoint}?${queryString}&signature=${signature}`;

    const res = await fetch(url, {
      headers: { 'X-MBX-APIKEY': this.apiKey },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Binance signed GET ${endpoint} failed (${res.status}): ${text.slice(0, 200)}`);
    }
    return res.json();
  }
}
