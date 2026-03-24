// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * DragonMigrator — PancakeSwap V2 Liquidity Migration
 *
 * When a bonding curve graduates, this contract:
 * 1. Receives BNB + remaining tokens from DragonCurve
 * 2. Approves PancakeSwap V2 Router to spend tokens
 * 3. Calls addLiquidityETH to create the LP pair
 * 4. Burns the LP tokens (sends to dead address) for permanent liquidity
 *
 * PancakeSwap V2 Router (BSC): 0x10ED43C718714eb63d5aA57B78B54704E256024E
 * WBNB: 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
 */

interface IPancakeRouter02 {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
}

interface IPancakeFactory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

contract DragonMigrator {
    using SafeERC20 for IERC20;

    // PancakeSwap V2 Router on BSC mainnet
    address public constant PANCAKE_ROUTER = 0x10ED43C718714eb63d5aA57B78B54704E256024E;

    // Dead address for LP burn (permanent liquidity)
    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;

    // Only the bonding curve contract can call migrate
    address public curve;
    address public treasury;

    // Track migrations
    struct Migration {
        address token;
        address lpPair;
        uint256 bnbAmount;
        uint256 tokenAmount;
        uint256 lpBurned;
        uint256 timestamp;
    }

    mapping(address => Migration) public migrations;
    address[] public migratedTokens;

    // Events
    event Migrated(
        address indexed token,
        address indexed lpPair,
        uint256 bnbAmount,
        uint256 tokenAmount,
        uint256 lpBurned
    );

    constructor(address curve_, address treasury_) {
        require(curve_ != address(0), "DM: zero curve");
        curve = curve_;
        treasury = treasury_;
    }

    /**
     * @notice Migrate a graduated token to PancakeSwap V2
     * @param token The BEP-20 token to create LP for
     * @param tokenAmount Tokens to add as liquidity
     * @dev Called by DragonCurve when graduation target is hit
     * @dev msg.value = BNB to pair with tokens
     */
    function migrate(address token, uint256 tokenAmount) external payable {
        require(msg.sender == curve, "DM: only curve");
        require(msg.value > 0, "DM: zero BNB");
        require(tokenAmount > 0, "DM: zero tokens");
        require(migrations[token].token == address(0), "DM: already migrated");

        // Take tokens from curve
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);

        // Approve router
        IERC20(token).safeApprove(PANCAKE_ROUTER, tokenAmount);

        // Add liquidity — LP tokens go to DEAD address (burned)
        IPancakeRouter02 router = IPancakeRouter02(PANCAKE_ROUTER);

        (uint256 amountToken, uint256 amountETH, uint256 liquidity) = router.addLiquidityETH{value: msg.value}(
            token,
            tokenAmount,
            0,                      // amountTokenMin (accept any for first LP)
            0,                      // amountETHMin (accept any for first LP)
            DEAD,                   // LP tokens sent to dead address (burned)
            block.timestamp + 300   // 5 min deadline
        );

        // Get the LP pair address
        IPancakeFactory factory = IPancakeFactory(router.factory());
        address lpPair = factory.getPair(token, router.WETH());

        // Record migration
        migrations[token] = Migration({
            token: token,
            lpPair: lpPair,
            bnbAmount: amountETH,
            tokenAmount: amountToken,
            lpBurned: liquidity,
            timestamp: block.timestamp
        });

        migratedTokens.push(token);

        // Refund any leftover BNB to treasury
        uint256 leftoverBnb = address(this).balance;
        if (leftoverBnb > 0) {
            (bool ok, ) = treasury.call{value: leftoverBnb}("");
            require(ok, "DM: refund failed");
        }

        // Refund any leftover tokens to treasury
        uint256 leftoverTokens = IERC20(token).balanceOf(address(this));
        if (leftoverTokens > 0) {
            IERC20(token).safeTransfer(treasury, leftoverTokens);
        }

        emit Migrated(token, lpPair, amountETH, amountToken, liquidity);
    }

    // ── View functions ──

    function getMigration(address token) external view returns (
        address lpPair,
        uint256 bnbAmount,
        uint256 tokenAmount,
        uint256 lpBurned,
        uint256 timestamp
    ) {
        Migration storage m = migrations[token];
        return (m.lpPair, m.bnbAmount, m.tokenAmount, m.lpBurned, m.timestamp);
    }

    function totalMigrations() external view returns (uint256) {
        return migratedTokens.length;
    }

    function isMigrated(address token) external view returns (bool) {
        return migrations[token].token != address(0);
    }

    receive() external payable {}
}
