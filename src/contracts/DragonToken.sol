// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ╔═══════════════════════════════════════════════════╗
 * ║           DragonLaunch 龙爪发射台                    ║
 * ║     BSC Memecoin Launchpad by DragonClaw          ║
 * ║                                                   ║
 * ║  Token Factory + Bonding Curve + PancakeSwap LP   ║
 * ║           dragonclaw.asia                         ║
 * ╚═══════════════════════════════════════════════════╝
 *
 * Architecture:
 *   DragonToken.sol     — Standard BEP-20 with fixed supply
 *   DragonFactory.sol   — Deploys tokens + initializes bonding curves
 *   DragonCurve.sol     — Linear bonding curve sale with platform fee
 *   DragonMigrator.sol  — Graduates to PancakeSwap V2 + burns LP
 *
 * Flow:
 *   1. User calls DragonFactory.createToken(name, symbol, supply, ...)
 *   2. Factory deploys DragonToken, sends allocation to DragonCurve
 *   3. Buyers send BNB to DragonCurve.buy() — price increases along curve
 *   4. When curve hits target (e.g., 24 BNB), graduation triggers
 *   5. DragonMigrator takes BNB + remaining tokens → PancakeSwap V2 addLiquidityETH
 *   6. LP tokens are burned (permanent liquidity)
 *   7. Token is tradable on PancakeSwap
 */

// ═══════════════════════════════════════════════════════
//  DragonToken — BEP-20 with fixed supply
// ═══════════════════════════════════════════════════════

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DragonToken is ERC20 {
    uint8 private _decimals;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 totalSupply_,
        address recipient_
    ) ERC20(name_, symbol_) {
        _decimals = decimals_;
        _mint(recipient_, totalSupply_);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}
