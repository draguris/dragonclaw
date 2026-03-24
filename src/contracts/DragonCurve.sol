// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * DragonCurve — Linear Bonding Curve
 *
 * Price increases linearly as more tokens are sold.
 * Formula: price = basePrice + (slope * tokensSold)
 *
 * When totalBNBRaised >= graduationTarget, the curve
 * is frozen and migration to PancakeSwap is triggered.
 */

interface IDragonMigrator {
    function migrate(address token, uint256 tokenAmount) external payable;
}

contract DragonCurve is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── State ──

    struct TokenSale {
        address token;               // BEP-20 token address
        address creator;             // who created this launch
        uint256 totalSupply;         // total supply allocated to curve
        uint256 tokensSold;          // tokens purchased so far
        uint256 bnbRaised;           // total BNB collected
        uint256 graduationTarget;    // BNB needed to graduate (e.g., 24 BNB)
        uint256 basePrice;           // starting price in wei per token
        uint256 slope;               // price increase per token sold (wei)
        bool graduated;              // true after migration to PancakeSwap
        bool active;                 // sale is live
        uint256 createdAt;           // block.timestamp of creation
    }

    mapping(address => TokenSale) public sales;     // token address => sale
    address[] public allTokens;                     // all launched tokens

    address public treasury;                        // platform fee recipient
    address public migrator;                        // DragonMigrator address
    uint256 public platformFeeBps;                  // platform fee in basis points (100 = 1%)
    uint256 public defaultGraduationTarget;         // default BNB target

    // ── Events ──

    event TokenLaunched(address indexed token, address indexed creator, uint256 supply, uint256 graduationTarget);
    event TokenPurchased(address indexed token, address indexed buyer, uint256 bnbAmount, uint256 tokenAmount, uint256 newPrice);
    event TokenSold(address indexed token, address indexed seller, uint256 tokenAmount, uint256 bnbAmount);
    event Graduated(address indexed token, uint256 bnbRaised, uint256 tokensRemaining);

    // ── Constructor ──

    constructor(
        address treasury_,
        address migrator_,
        uint256 platformFeeBps_,
        uint256 defaultGraduationTarget_
    ) {
        require(treasury_ != address(0), "DC: zero treasury");
        require(migrator_ != address(0), "DC: zero migrator");
        require(platformFeeBps_ <= 500, "DC: fee too high"); // max 5%

        treasury = treasury_;
        migrator = migrator_;
        platformFeeBps = platformFeeBps_;
        defaultGraduationTarget = defaultGraduationTarget_;
    }

    // ── Initialize a new token sale (called by Factory) ──

    function initializeSale(
        address token,
        address creator,
        uint256 totalSupply,
        uint256 graduationTarget,
        uint256 basePrice,
        uint256 slope
    ) external {
        require(sales[token].token == address(0), "DC: already initialized");
        require(totalSupply > 0, "DC: zero supply");

        // Transfer tokens from factory/creator to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), totalSupply);

        sales[token] = TokenSale({
            token: token,
            creator: creator,
            totalSupply: totalSupply,
            tokensSold: 0,
            bnbRaised: 0,
            graduationTarget: graduationTarget > 0 ? graduationTarget : defaultGraduationTarget,
            basePrice: basePrice,
            slope: slope,
            graduated: false,
            active: true,
            createdAt: block.timestamp
        });

        allTokens.push(token);

        emit TokenLaunched(token, creator, totalSupply, sales[token].graduationTarget);
    }

    // ── Buy tokens with BNB ──

    function buy(address token) external payable nonReentrant {
        TokenSale storage sale = sales[token];
        require(sale.active, "DC: sale not active");
        require(!sale.graduated, "DC: already graduated");
        require(msg.value > 0, "DC: zero BNB");

        // Platform fee
        uint256 fee = (msg.value * platformFeeBps) / 10000;
        uint256 netBnb = msg.value - fee;

        // Calculate tokens to give based on bonding curve
        uint256 tokensOut = _calculateBuyTokens(sale, netBnb);
        require(tokensOut > 0, "DC: zero tokens");
        require(sale.tokensSold + tokensOut <= sale.totalSupply, "DC: exceeds supply");

        // Update state
        sale.tokensSold += tokensOut;
        sale.bnbRaised += netBnb;

        // Transfer fee to treasury
        if (fee > 0) {
            (bool feeOk, ) = treasury.call{value: fee}("");
            require(feeOk, "DC: fee transfer failed");
        }

        // Transfer tokens to buyer
        IERC20(token).safeTransfer(msg.sender, tokensOut);

        uint256 currentPrice = _currentPrice(sale);
        emit TokenPurchased(token, msg.sender, msg.value, tokensOut, currentPrice);

        // Check graduation
        if (sale.bnbRaised >= sale.graduationTarget) {
            _graduate(token);
        }
    }

    // ── Sell tokens back to curve ──

    function sell(address token, uint256 tokenAmount) external nonReentrant {
        TokenSale storage sale = sales[token];
        require(sale.active, "DC: sale not active");
        require(!sale.graduated, "DC: already graduated");
        require(tokenAmount > 0, "DC: zero amount");

        // Calculate BNB to return
        uint256 bnbOut = _calculateSellBnb(sale, tokenAmount);
        require(bnbOut > 0, "DC: zero BNB out");
        require(bnbOut <= sale.bnbRaised, "DC: insufficient reserves");

        // Platform fee on sell
        uint256 fee = (bnbOut * platformFeeBps) / 10000;
        uint256 netBnb = bnbOut - fee;

        // Update state
        sale.tokensSold -= tokenAmount;
        sale.bnbRaised -= bnbOut;

        // Take tokens from seller
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);

        // Send fee
        if (fee > 0) {
            (bool feeOk, ) = treasury.call{value: fee}("");
            require(feeOk, "DC: fee transfer failed");
        }

        // Send BNB to seller
        (bool ok, ) = msg.sender.call{value: netBnb}("");
        require(ok, "DC: BNB transfer failed");

        emit TokenSold(token, msg.sender, tokenAmount, netBnb);
    }

    // ── Graduation — migrate to PancakeSwap ──

    function _graduate(address token) internal {
        TokenSale storage sale = sales[token];
        sale.graduated = true;
        sale.active = false;

        uint256 remainingTokens = sale.totalSupply - sale.tokensSold;
        uint256 bnbForLiquidity = sale.bnbRaised;

        // Approve migrator to take tokens
        IERC20(token).safeApprove(migrator, remainingTokens);

        // Call migrator with BNB + tokens
        IDragonMigrator(migrator).migrate{value: bnbForLiquidity}(token, remainingTokens);

        emit Graduated(token, bnbForLiquidity, remainingTokens);
    }

    // ── Bonding curve math ──

    /**
     * Linear bonding curve:
     *   price(n) = basePrice + slope * n
     *   where n = tokens already sold
     *
     * Cost to buy `amount` tokens starting from `tokensSold`:
     *   cost = amount * basePrice + slope * (tokensSold * amount + amount * (amount - 1) / 2)
     *
     * Simplified: we iterate in chunks for gas efficiency
     */

    function _calculateBuyTokens(TokenSale storage sale, uint256 bnbIn) internal view returns (uint256) {
        uint256 currentSold = sale.tokensSold;
        uint256 remaining = bnbIn;
        uint256 tokensBought = 0;

        // Use 1e18 precision for token units
        uint256 step = 1e18; // 1 token at a time (with 18 decimals)

        while (remaining > 0 && currentSold + tokensBought < sale.totalSupply) {
            uint256 price = sale.basePrice + (sale.slope * (currentSold + tokensBought)) / 1e18;
            if (price == 0) price = 1; // minimum 1 wei

            if (remaining >= price) {
                remaining -= price;
                tokensBought += step;
            } else {
                // Partial token
                uint256 partialTokens = (remaining * 1e18) / price;
                tokensBought += partialTokens;
                remaining = 0;
            }

            // Gas safety: max 10000 iterations
            if (tokensBought / step > 10000) break;
        }

        return tokensBought;
    }

    function _calculateSellBnb(TokenSale storage sale, uint256 tokenAmount) internal view returns (uint256) {
        uint256 currentSold = sale.tokensSold;
        uint256 tokensToSell = tokenAmount;
        uint256 bnbOut = 0;
        uint256 step = 1e18;

        while (tokensToSell >= step && currentSold > 0) {
            currentSold -= step;
            uint256 price = sale.basePrice + (sale.slope * currentSold) / 1e18;
            bnbOut += price;
            tokensToSell -= step;

            if (bnbOut / step > 10000) break;
        }

        // Partial
        if (tokensToSell > 0 && currentSold > 0) {
            uint256 price = sale.basePrice + (sale.slope * currentSold) / 1e18;
            bnbOut += (price * tokensToSell) / 1e18;
        }

        return bnbOut;
    }

    function _currentPrice(TokenSale storage sale) internal view returns (uint256) {
        return sale.basePrice + (sale.slope * sale.tokensSold) / 1e18;
    }

    // ── View functions ──

    function getCurrentPrice(address token) external view returns (uint256) {
        return _currentPrice(sales[token]);
    }

    function getSaleInfo(address token) external view returns (
        address creator,
        uint256 totalSupply,
        uint256 tokensSold,
        uint256 bnbRaised,
        uint256 graduationTarget,
        uint256 currentPrice,
        bool graduated,
        bool active,
        uint256 progressPercent
    ) {
        TokenSale storage sale = sales[token];
        creator = sale.creator;
        totalSupply = sale.totalSupply;
        tokensSold = sale.tokensSold;
        bnbRaised = sale.bnbRaised;
        graduationTarget = sale.graduationTarget;
        currentPrice = _currentPrice(sale);
        graduated = sale.graduated;
        active = sale.active;
        progressPercent = sale.graduationTarget > 0
            ? (sale.bnbRaised * 100) / sale.graduationTarget
            : 0;
    }

    function totalLaunches() external view returns (uint256) {
        return allTokens.length;
    }

    function getTokenAt(uint256 index) external view returns (address) {
        return allTokens[index];
    }

    // ── Admin ──

    function updateTreasury(address newTreasury) external {
        require(msg.sender == treasury, "DC: not treasury");
        treasury = newTreasury;
    }

    function updateFee(uint256 newFeeBps) external {
        require(msg.sender == treasury, "DC: not treasury");
        require(newFeeBps <= 500, "DC: fee too high");
        platformFeeBps = newFeeBps;
    }

    receive() external payable {}
}
