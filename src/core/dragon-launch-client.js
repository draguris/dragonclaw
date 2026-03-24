/**
 * DragonLaunch Client — BSC Memecoin Launchpad
 * 
 * DragonClaw's native token launchpad.
 * No Four.meme. No third party. Straight to PancakeSwap.
 *
 * User says: "发一个 meme 币叫 DRAGONCAT，总量 1 亿"
 * DragonClaw deploys the token, starts bonding curve,
 * graduates to PancakeSwap when target is hit.
 */

import { createPublicClient, createWalletClient, http, parseAbi, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc } from 'viem/chains';
import { log } from './logger.js';

const dlLog = log.child('dragon-launch');

// Contract ABIs (minimal for interaction)
const FACTORY_ABI = parseAbi([
  'function createToken(string name, string symbol, uint256 totalSupply, uint256 graduationBnb) payable returns (address)',
  'function totalLaunches() view returns (uint256)',
  'function getTokenAt(uint256 index) view returns (address)',
  'function getLaunchInfo(address token) view returns (address creator, string name, string symbol, uint256 totalSupply, uint256 curveAllocation, uint256 creatorAllocation, uint256 timestamp)',
  'function creationFee() view returns (uint256)',
  'function getCreatorTokens(address creator) view returns (address[])',
  'event TokenCreated(address indexed token, address indexed creator, string name, string symbol, uint256 totalSupply, uint256 curveAllocation)',
]);

const CURVE_ABI = parseAbi([
  'function buy(address token) payable',
  'function sell(address token, uint256 tokenAmount)',
  'function getCurrentPrice(address token) view returns (uint256)',
  'function getSaleInfo(address token) view returns (address creator, uint256 totalSupply, uint256 tokensSold, uint256 bnbRaised, uint256 graduationTarget, uint256 currentPrice, bool graduated, bool active, uint256 progressPercent)',
  'function totalLaunches() view returns (uint256)',
  'function getTokenAt(uint256 index) view returns (address)',
  'event TokenPurchased(address indexed token, address indexed buyer, uint256 bnbAmount, uint256 tokenAmount, uint256 newPrice)',
  'event TokenSold(address indexed token, address indexed seller, uint256 tokenAmount, uint256 bnbAmount)',
  'event Graduated(address indexed token, uint256 bnbRaised, uint256 tokensRemaining)',
]);

const MIGRATOR_ABI = parseAbi([
  'function getMigration(address token) view returns (address lpPair, uint256 bnbAmount, uint256 tokenAmount, uint256 lpBurned, uint256 timestamp)',
  'function isMigrated(address token) view returns (bool)',
  'function totalMigrations() view returns (uint256)',
]);

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
]);

export class DragonLaunchClient {
  constructor(config = {}) {
    this.rpcUrl = config.rpcUrl || process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org';
    this.factoryAddress = config.factoryAddress || process.env.DRAGON_FACTORY;
    this.curveAddress = config.curveAddress || process.env.DRAGON_CURVE;
    this.migratorAddress = config.migratorAddress || process.env.DRAGON_MIGRATOR;

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

  // ── Create a new token ──

  async createToken(name, symbol, totalSupply = 0n, graduationBnb = 0n) {
    if (!this.factoryAddress) throw new Error('DRAGON_FACTORY address not configured');

    const { wallet } = this._getWallet();

    // Get creation fee
    const fee = await this.publicClient.readContract({
      address: this.factoryAddress,
      abi: FACTORY_ABI,
      functionName: 'creationFee',
    });

    dlLog.info('Creating token', { name, symbol, totalSupply: totalSupply.toString(), fee: formatEther(fee) });

    const hash = await wallet.writeContract({
      address: this.factoryAddress,
      abi: FACTORY_ABI,
      functionName: 'createToken',
      args: [name, symbol, totalSupply, graduationBnb],
      value: fee,
    });

    // Wait for receipt and extract token address from event
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    let tokenAddress = null;
    for (const log of receipt.logs) {
      try {
        // Look for TokenCreated event
        if (log.address.toLowerCase() === this.factoryAddress.toLowerCase()) {
          // Token address is in the first indexed topic
          tokenAddress = '0x' + log.topics[1].slice(26);
          break;
        }
      } catch { /* skip */ }
    }

    dlLog.info('Token created', { name, symbol, tokenAddress, txHash: hash });

    return {
      txHash: hash,
      tokenAddress,
      name,
      symbol,
      creationFee: formatEther(fee),
    };
  }

  // ── Buy tokens on bonding curve ──

  async buyToken(tokenAddress, bnbAmount) {
    if (!this.curveAddress) throw new Error('DRAGON_CURVE address not configured');

    const { wallet } = this._getWallet();
    const value = typeof bnbAmount === 'string' ? parseEther(bnbAmount) : BigInt(bnbAmount);

    const hash = await wallet.writeContract({
      address: this.curveAddress,
      abi: CURVE_ABI,
      functionName: 'buy',
      args: [tokenAddress],
      value,
    });

    dlLog.info('Bought on curve', { token: tokenAddress, bnb: formatEther(value), txHash: hash });

    return { txHash: hash, tokenAddress, bnbSpent: formatEther(value) };
  }

  // ── Sell tokens back to curve ──

  async sellToken(tokenAddress, tokenAmount) {
    if (!this.curveAddress) throw new Error('DRAGON_CURVE address not configured');

    const { wallet } = this._getWallet();
    const amount = BigInt(tokenAmount);

    // Approve curve to take tokens
    await wallet.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [this.curveAddress, amount],
    });

    const hash = await wallet.writeContract({
      address: this.curveAddress,
      abi: CURVE_ABI,
      functionName: 'sell',
      args: [tokenAddress, amount],
    });

    dlLog.info('Sold on curve', { token: tokenAddress, amount: amount.toString(), txHash: hash });

    return { txHash: hash, tokenAddress, tokensSold: amount.toString() };
  }

  // ── Get sale info ──

  async getSaleInfo(tokenAddress) {
    if (!this.curveAddress) throw new Error('DRAGON_CURVE address not configured');

    const result = await this.publicClient.readContract({
      address: this.curveAddress,
      abi: CURVE_ABI,
      functionName: 'getSaleInfo',
      args: [tokenAddress],
    });

    const [creator, totalSupply, tokensSold, bnbRaised, graduationTarget, currentPrice, graduated, active, progressPercent] = result;

    return {
      creator,
      totalSupply: totalSupply.toString(),
      tokensSold: tokensSold.toString(),
      bnbRaised: formatEther(bnbRaised),
      graduationTarget: formatEther(graduationTarget),
      currentPrice: currentPrice.toString(),
      graduated,
      active,
      progressPercent: Number(progressPercent),
    };
  }

  // ── Get current price ──

  async getCurrentPrice(tokenAddress) {
    if (!this.curveAddress) throw new Error('DRAGON_CURVE address not configured');

    const price = await this.publicClient.readContract({
      address: this.curveAddress,
      abi: CURVE_ABI,
      functionName: 'getCurrentPrice',
      args: [tokenAddress],
    });

    return { tokenAddress, priceWei: price.toString() };
  }

  // ── Check if token graduated to PancakeSwap ──

  async getMigrationInfo(tokenAddress) {
    if (!this.migratorAddress) throw new Error('DRAGON_MIGRATOR address not configured');

    const migrated = await this.publicClient.readContract({
      address: this.migratorAddress,
      abi: MIGRATOR_ABI,
      functionName: 'isMigrated',
      args: [tokenAddress],
    });

    if (!migrated) return { migrated: false };

    const result = await this.publicClient.readContract({
      address: this.migratorAddress,
      abi: MIGRATOR_ABI,
      functionName: 'getMigration',
      args: [tokenAddress],
    });

    const [lpPair, bnbAmount, tokenAmount, lpBurned, timestamp] = result;

    return {
      migrated: true,
      lpPair,
      bnbAmount: formatEther(bnbAmount),
      tokenAmount: tokenAmount.toString(),
      lpBurned: lpBurned.toString(),
      timestamp: Number(timestamp),
      pancakeswapUrl: `https://pancakeswap.finance/swap?chain=bsc&outputCurrency=${tokenAddress}`,
    };
  }

  // ── Get launch info from factory ──

  async getLaunchInfo(tokenAddress) {
    if (!this.factoryAddress) throw new Error('DRAGON_FACTORY address not configured');

    const result = await this.publicClient.readContract({
      address: this.factoryAddress,
      abi: FACTORY_ABI,
      functionName: 'getLaunchInfo',
      args: [tokenAddress],
    });

    const [creator, name, symbol, totalSupply, curveAllocation, creatorAllocation, timestamp] = result;

    return {
      creator,
      name,
      symbol,
      totalSupply: totalSupply.toString(),
      curveAllocation: curveAllocation.toString(),
      creatorAllocation: creatorAllocation.toString(),
      timestamp: Number(timestamp),
    };
  }

  // ── List all launches ──

  async listLaunches(limit = 20) {
    if (!this.factoryAddress) throw new Error('DRAGON_FACTORY address not configured');

    const total = await this.publicClient.readContract({
      address: this.factoryAddress,
      abi: FACTORY_ABI,
      functionName: 'totalLaunches',
    });

    const count = Number(total);
    const start = Math.max(0, count - limit);
    const launches = [];

    for (let i = count - 1; i >= start; i--) {
      const token = await this.publicClient.readContract({
        address: this.factoryAddress,
        abi: FACTORY_ABI,
        functionName: 'getTokenAt',
        args: [BigInt(i)],
      });

      const info = await this.getLaunchInfo(token);
      const sale = await this.getSaleInfo(token);

      launches.push({
        tokenAddress: token,
        ...info,
        ...sale,
      });
    }

    return { total: count, launches };
  }

  // ── Get my created tokens ──

  async getMyTokens() {
    if (!this.factoryAddress) throw new Error('DRAGON_FACTORY address not configured');

    const { account } = this._getWallet();
    const tokens = await this.publicClient.readContract({
      address: this.factoryAddress,
      abi: FACTORY_ABI,
      functionName: 'getCreatorTokens',
      args: [account.address],
    });

    return tokens;
  }

  // ── Stats ──

  async getStats() {
    const totalLaunches = this.factoryAddress ? await this.publicClient.readContract({
      address: this.factoryAddress,
      abi: FACTORY_ABI,
      functionName: 'totalLaunches',
    }) : 0n;

    const totalMigrations = this.migratorAddress ? await this.publicClient.readContract({
      address: this.migratorAddress,
      abi: MIGRATOR_ABI,
      functionName: 'totalMigrations',
    }) : 0n;

    return {
      totalLaunches: Number(totalLaunches),
      totalGraduated: Number(totalMigrations),
      graduationRate: Number(totalLaunches) > 0
        ? Math.round(Number(totalMigrations) * 100 / Number(totalLaunches))
        : 0,
    };
  }
}
