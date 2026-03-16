/**
 * Four.meme Client — Native BSC Integration
 * 
 * Direct contract calls via viem. No CLI shelling.
 * This is what makes DragonClaw different from OpenClaw's plugin:
 * everything runs in-process, enabling background automation.
 */

import { createPublicClient, createWalletClient, http, parseAbi, parseAbiItem } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc } from 'viem/chains';
import { log } from './logger.js';
import { retry } from './retry.js';

const fmLog = log.child('four-meme');

const API_BASE = 'https://four.meme/meme-api/v1';
const TOKEN_MANAGER2 = '0x5c952063c7fc8610FFDB798152D69F0B9550762b';
const HELPER3 = '0xF251F83e40a78868FcfA3FA4599Dad6494E46034';

const HELPER_ABI = parseAbi([
  'function getTokenInfo(address token) view returns (uint256 version, address tokenManager, address quote, uint256 lastPrice, uint256 tradingFeeRate, uint256 minTradingFee, uint256 launchTime, uint256 offers, uint256 maxOffers, uint256 funds, uint256 maxFunds, bool liquidityAdded)',
  'function tryBuy(address token, uint256 amount, uint256 funds) view returns (address tokenManager, address quote, uint256 estimatedAmount, uint256 estimatedCost, uint256 estimatedFee, uint256 amountMsgValue, uint256 amountApproval, uint256 amountFunds)',
  'function trySell(address token, uint256 amount) view returns (address tokenManager, address quote, uint256 funds, uint256 fee)',
]);

const TM2_ABI = parseAbi([
  'function buyTokenAMAP(address token, uint256 minAmount) payable',
  'function sellToken(address token, uint256 amount)',
  'function createToken(bytes args, bytes signature) payable',
  'function _launchFee() view returns (uint256)',
  'function _tradingFeeRate() view returns (uint256)',
]);

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
]);

const TAX_TOKEN_ABI = parseAbi([
  'function feeRate() view returns (uint256)',
  'function rateFounder() view returns (uint256)',
  'function rateHolder() view returns (uint256)',
  'function rateBurn() view returns (uint256)',
  'function rateLiquidity() view returns (uint256)',
  'function minDispatch() view returns (uint256)',
  'function minShare() view returns (uint256)',
]);

const TOKEN_CREATE_EVENT = parseAbiItem(
  'event TokenCreate(address creator, address token, uint256 requestId, string name, string symbol, uint256 totalSupply, uint256 launchTime, uint256 launchFee)'
);
const TOKEN_PURCHASE_EVENT = parseAbiItem(
  'event TokenPurchase(address token, address account, uint256 price, uint256 amount, uint256 cost, uint256 fee, uint256 offers, uint256 funds)'
);
const TOKEN_SALE_EVENT = parseAbiItem(
  'event TokenSale(address token, address account, uint256 price, uint256 amount, uint256 cost, uint256 fee, uint256 offers, uint256 funds)'
);
const LIQUIDITY_EVENT = parseAbiItem(
  'event LiquidityAdded(address base, uint256 offers, address quote, uint256 funds)'
);

export class FourMemeClient {
  constructor(config = {}) {
    this.rpcUrl = config.rpcUrl || process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org';
    this.publicClient = createPublicClient({ chain: bsc, transport: http(this.rpcUrl) });
    this._walletClient = null;
    this._account = null;
  }

  _getWallet() {
    if (this._walletClient) return { wallet: this._walletClient, account: this._account };
    const pk = process.env.PRIVATE_KEY;
    if (!pk) throw new Error('PRIVATE_KEY not set');
    const key = pk.startsWith('0x') ? pk : '0x' + pk;
    this._account = privateKeyToAccount(key);
    this._walletClient = createWalletClient({
      account: this._account,
      chain: bsc,
      transport: http(this.rpcUrl),
    });
    return { wallet: this._walletClient, account: this._account };
  }

  // ── Read-only queries ──

  async getTokenInfo(tokenAddress) {
    const result = await this.publicClient.readContract({
      address: HELPER3,
      abi: HELPER_ABI,
      functionName: 'getTokenInfo',
      args: [tokenAddress],
    });
    const [version, tokenManager, quote, lastPrice, tradingFeeRate, minTradingFee, launchTime, offers, maxOffers, funds, maxFunds, liquidityAdded] = result;
    return {
      version: Number(version),
      tokenManager,
      quote: quote === '0x0000000000000000000000000000000000000000' ? null : quote,
      lastPrice: lastPrice.toString(),
      tradingFeeRate: Number(tradingFeeRate) / 10000,
      minTradingFee: minTradingFee.toString(),
      launchTime: Number(launchTime),
      offers: offers.toString(),
      maxOffers: maxOffers.toString(),
      funds: funds.toString(),
      maxFunds: maxFunds.toString(),
      liquidityAdded,
      progressPercent: maxFunds > 0n ? Math.round(Number(funds * 10000n / maxFunds)) / 100 : 0,
    };
  }

  async quoteBuy(tokenAddress, amountWei = 0n, fundsWei = 0n) {
    const result = await this.publicClient.readContract({
      address: HELPER3,
      abi: HELPER_ABI,
      functionName: 'tryBuy',
      args: [tokenAddress, BigInt(amountWei), BigInt(fundsWei)],
    });
    const [tokenManager, quote, estimatedAmount, estimatedCost, estimatedFee, amountMsgValue, amountApproval, amountFunds] = result;
    return {
      tokenManager,
      quote: quote === '0x0000000000000000000000000000000000000000' ? 'BNB' : quote,
      estimatedAmount: estimatedAmount.toString(),
      estimatedCost: estimatedCost.toString(),
      estimatedFee: estimatedFee.toString(),
      amountMsgValue: amountMsgValue.toString(),
    };
  }

  async quoteSell(tokenAddress, amountWei) {
    const result = await this.publicClient.readContract({
      address: HELPER3,
      abi: HELPER_ABI,
      functionName: 'trySell',
      args: [tokenAddress, BigInt(amountWei)],
    });
    const [tokenManager, quote, funds, fee] = result;
    return {
      tokenManager,
      quote: quote === '0x0000000000000000000000000000000000000000' ? 'BNB' : quote,
      funds: funds.toString(),
      fee: fee.toString(),
    };
  }

  async getTaxInfo(tokenAddress) {
    try {
      const [feeRate, rateFounder, rateHolder, rateBurn, rateLiquidity, minDispatch, minShare] = await Promise.all([
        this.publicClient.readContract({ address: tokenAddress, abi: TAX_TOKEN_ABI, functionName: 'feeRate' }),
        this.publicClient.readContract({ address: tokenAddress, abi: TAX_TOKEN_ABI, functionName: 'rateFounder' }),
        this.publicClient.readContract({ address: tokenAddress, abi: TAX_TOKEN_ABI, functionName: 'rateHolder' }),
        this.publicClient.readContract({ address: tokenAddress, abi: TAX_TOKEN_ABI, functionName: 'rateBurn' }),
        this.publicClient.readContract({ address: tokenAddress, abi: TAX_TOKEN_ABI, functionName: 'rateLiquidity' }),
        this.publicClient.readContract({ address: tokenAddress, abi: TAX_TOKEN_ABI, functionName: 'minDispatch' }),
        this.publicClient.readContract({ address: tokenAddress, abi: TAX_TOKEN_ABI, functionName: 'minShare' }),
      ]);
      return {
        isTaxToken: true,
        feeRatePercent: Number(feeRate) / 100,
        rateFounder: Number(rateFounder),
        rateHolder: Number(rateHolder),
        rateBurn: Number(rateBurn),
        rateLiquidity: Number(rateLiquidity),
        minDispatch: minDispatch.toString(),
        minShare: minShare.toString(),
      };
    } catch {
      return { isTaxToken: false };
    }
  }

  async getEvents(fromBlock, toBlock = 'latest') {
    const from = typeof fromBlock === 'bigint' ? fromBlock : BigInt(fromBlock);
    const to = toBlock === 'latest' ? undefined : (typeof toBlock === 'bigint' ? toBlock : BigInt(toBlock));

    const logs = await this.publicClient.getLogs({
      address: TOKEN_MANAGER2,
      events: [TOKEN_CREATE_EVENT, TOKEN_PURCHASE_EVENT, TOKEN_SALE_EVENT, LIQUIDITY_EVENT],
      fromBlock: from,
      ...(to && { toBlock: to }),
    });

    return logs.map(l => ({
      eventName: l.eventName,
      blockNumber: Number(l.blockNumber),
      transactionHash: l.transactionHash,
      args: l.args,
    }));
  }

  async getLatestBlock() {
    return await this.publicClient.getBlockNumber();
  }

  // ── REST API queries ──

  async getPublicConfig() {
    const res = await fetch(`${API_BASE}/public/config`);
    const data = await res.json();
    if (data.code !== '0' && data.code !== 0) throw new Error('Config failed: ' + JSON.stringify(data));
    return data.data;
  }

  async tokenList(opts = {}) {
    const params = new URLSearchParams({
      orderBy: opts.orderBy || 'Hot',
      pageIndex: String(opts.pageIndex || 1),
      pageSize: String(opts.pageSize || 20),
      tokenName: opts.tokenName || '',
      symbol: opts.symbol || '',
      labels: opts.labels || '',
      listedPancake: opts.listedPancake || 'false',
    });
    const res = await fetch(`${API_BASE}/private/token/query?${params}`);
    const data = await res.json();
    return data.data || data;
  }

  async tokenGet(tokenAddress) {
    const res = await fetch(`${API_BASE}/private/token/get/v2?address=${tokenAddress}`);
    const data = await res.json();
    return data.data || data;
  }

  async tokenRankings(orderBy, barType = 'HOUR24') {
    const body = { orderBy };
    if (orderBy === 'TradingDesc') body.barType = barType;
    const res = await fetch(`${API_BASE}/private/token/query/advanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return data.data || data;
  }

  // ── Write operations (require PRIVATE_KEY) ──

  async buy(tokenAddress, fundsWei, minAmountWei = 0n) {
    const { wallet } = this._getWallet();
    const info = await this.getTokenInfo(tokenAddress);
    if (info.version !== 2) throw new Error('Only V2 tokens supported');
    if (info.liquidityAdded) throw new Error('Token already graduated to DEX');

    const funds = BigInt(fundsWei);
    const minAmount = BigInt(minAmountWei);

    const hash = await retry(async () => {
      return wallet.writeContract({
        address: info.tokenManager,
        abi: TM2_ABI,
        functionName: 'buyTokenAMAP',
        args: [tokenAddress, minAmount],
        value: funds,
      });
    }, { maxRetries: 2, baseDelayMs: 1000 });

    fmLog.info('Buy executed', { token: tokenAddress, funds: funds.toString(), txHash: hash });
    return { txHash: hash, tokenAddress, fundsWei: funds.toString() };
  }

  async sell(tokenAddress, amountWei, minFundsWei = 0n) {
    const { wallet } = this._getWallet();
    const info = await this.getTokenInfo(tokenAddress);
    if (info.version !== 2) throw new Error('Only V2 tokens supported');

    const amount = BigInt(amountWei);

    // Approve first
    const approveHash = await wallet.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [info.tokenManager, amount],
    });
    await this.publicClient.waitForTransactionReceipt({ hash: approveHash });

    // Sell
    const hash = await wallet.writeContract({
      address: info.tokenManager,
      abi: TM2_ABI,
      functionName: 'sellToken',
      args: [tokenAddress, amount],
    });

    fmLog.info('Sell executed', { token: tokenAddress, amount: amount.toString(), txHash: hash });
    return { txHash: hash, tokenAddress, amountWei: amount.toString() };
  }

  async sendBnb(toAddress, amountWei) {
    const { wallet } = this._getWallet();
    const hash = await wallet.sendTransaction({
      to: toAddress,
      value: BigInt(amountWei),
    });
    return { txHash: hash, to: toAddress, amountWei: amountWei.toString(), native: true };
  }

  async sendErc20(tokenAddress, toAddress, amountWei) {
    const { wallet } = this._getWallet();
    const hash = await wallet.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [toAddress, BigInt(amountWei)],
    });
    return { txHash: hash, to: toAddress, token: tokenAddress, amountWei: amountWei.toString(), native: false };
  }

  async getBalance(tokenAddress, walletAddress) {
    if (!walletAddress) {
      const { account } = this._getWallet();
      walletAddress = account.address;
    }
    if (!tokenAddress || tokenAddress === 'BNB') {
      const balance = await this.publicClient.getBalance({ address: walletAddress });
      return { token: 'BNB', balance: balance.toString(), walletAddress };
    }
    const balance = await this.publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress],
    });
    return { token: tokenAddress, balance: balance.toString(), walletAddress };
  }
}
