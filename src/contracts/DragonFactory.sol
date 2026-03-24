// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DragonToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * DragonFactory — Token Launch Factory
 *
 * Main entry point for the DragonLaunch launchpad.
 * Users call createToken() to:
 * 1. Deploy a new BEP-20 token
 * 2. Send token allocation to the bonding curve
 * 3. Bonding curve sale begins immediately
 *
 * The factory charges a small creation fee to prevent spam.
 */

interface IDragonCurve {
    function initializeSale(
        address token,
        address creator,
        uint256 totalSupply,
        uint256 graduationTarget,
        uint256 basePrice,
        uint256 slope
    ) external;
}

contract DragonFactory {
    using SafeERC20 for IERC20;

    // ── State ──

    address public curve;           // DragonCurve contract
    address public treasury;        // Fee recipient
    uint256 public creationFee;     // BNB fee to create a token (anti-spam)

    // Default launch parameters
    uint256 public defaultSupply;          // e.g., 1_000_000_000 * 1e18 (1 billion)
    uint256 public defaultGraduationBnb;   // e.g., 24 ether (24 BNB)
    uint256 public defaultBasePrice;       // starting price in wei
    uint256 public defaultSlope;           // price increase per token
    uint256 public curveAllocationBps;     // % of supply to bonding curve (e.g., 8000 = 80%)

    // Track launches
    struct Launch {
        address token;
        address creator;
        string name;
        string symbol;
        uint256 totalSupply;
        uint256 curveAllocation;
        uint256 creatorAllocation;
        uint256 timestamp;
    }

    mapping(address => Launch) public launches;    // token => launch info
    mapping(address => address[]) public creatorTokens; // creator => their tokens
    address[] public allTokens;

    // ── Events ──

    event TokenCreated(
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        uint256 totalSupply,
        uint256 curveAllocation
    );

    // ── Constructor ──

    constructor(
        address curve_,
        address treasury_,
        uint256 creationFee_,
        uint256 defaultSupply_,
        uint256 defaultGraduationBnb_,
        uint256 defaultBasePrice_,
        uint256 defaultSlope_,
        uint256 curveAllocationBps_
    ) {
        require(curve_ != address(0), "DF: zero curve");
        require(treasury_ != address(0), "DF: zero treasury");
        require(curveAllocationBps_ <= 10000, "DF: invalid allocation");

        curve = curve_;
        treasury = treasury_;
        creationFee = creationFee_;
        defaultSupply = defaultSupply_;
        defaultGraduationBnb = defaultGraduationBnb_;
        defaultBasePrice = defaultBasePrice_;
        defaultSlope = defaultSlope_;
        curveAllocationBps = curveAllocationBps_;
    }

    // ── Create Token ──

    /**
     * @notice Create a new memecoin and start bonding curve sale
     * @param name Token name (e.g., "DragonCat")
     * @param symbol Token symbol (e.g., "DCAT")
     * @param totalSupply Total supply (0 = use default)
     * @param graduationBnb BNB target for graduation (0 = use default)
     * @return token Address of the deployed token
     */
    function createToken(
        string calldata name,
        string calldata symbol,
        uint256 totalSupply,
        uint256 graduationBnb
    ) external payable returns (address token) {
        require(msg.value >= creationFee, "DF: insufficient fee");
        require(bytes(name).length > 0, "DF: empty name");
        require(bytes(symbol).length > 0, "DF: empty symbol");

        // Use defaults if not specified
        uint256 supply = totalSupply > 0 ? totalSupply : defaultSupply;
        uint256 target = graduationBnb > 0 ? graduationBnb : defaultGraduationBnb;

        // Deploy token — mint all to this factory
        DragonToken newToken = new DragonToken(
            name,
            symbol,
            18,
            supply,
            address(this)
        );
        token = address(newToken);

        // Calculate allocations
        uint256 curveAmount = (supply * curveAllocationBps) / 10000;
        uint256 creatorAmount = supply - curveAmount;

        // Approve curve to take tokens
        IERC20(token).safeApprove(curve, curveAmount);

        // Initialize bonding curve sale
        IDragonCurve(curve).initializeSale(
            token,
            msg.sender,
            curveAmount,
            target,
            defaultBasePrice,
            defaultSlope
        );

        // Send creator allocation (if any)
        if (creatorAmount > 0) {
            IERC20(token).safeTransfer(msg.sender, creatorAmount);
        }

        // Send creation fee to treasury
        if (creationFee > 0) {
            (bool ok, ) = treasury.call{value: creationFee}("");
            require(ok, "DF: fee transfer failed");
        }

        // Refund excess BNB
        uint256 excess = msg.value - creationFee;
        if (excess > 0) {
            (bool refundOk, ) = msg.sender.call{value: excess}("");
            require(refundOk, "DF: refund failed");
        }

        // Record launch
        launches[token] = Launch({
            token: token,
            creator: msg.sender,
            name: name,
            symbol: symbol,
            totalSupply: supply,
            curveAllocation: curveAmount,
            creatorAllocation: creatorAmount,
            timestamp: block.timestamp
        });

        creatorTokens[msg.sender].push(token);
        allTokens.push(token);

        emit TokenCreated(token, msg.sender, name, symbol, supply, curveAmount);
    }

    // ── View functions ──

    function totalLaunches() external view returns (uint256) {
        return allTokens.length;
    }

    function getTokenAt(uint256 index) external view returns (address) {
        return allTokens[index];
    }

    function getCreatorTokens(address creator) external view returns (address[] memory) {
        return creatorTokens[creator];
    }

    function getLaunchInfo(address token) external view returns (
        address creator,
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint256 curveAllocation,
        uint256 creatorAllocation,
        uint256 timestamp
    ) {
        Launch storage l = launches[token];
        return (l.creator, l.name, l.symbol, l.totalSupply, l.curveAllocation, l.creatorAllocation, l.timestamp);
    }

    // ── Admin ──

    function updateCreationFee(uint256 newFee) external {
        require(msg.sender == treasury, "DF: not treasury");
        creationFee = newFee;
    }

    function updateDefaults(
        uint256 supply_,
        uint256 graduationBnb_,
        uint256 basePrice_,
        uint256 slope_,
        uint256 allocationBps_
    ) external {
        require(msg.sender == treasury, "DF: not treasury");
        if (supply_ > 0) defaultSupply = supply_;
        if (graduationBnb_ > 0) defaultGraduationBnb = graduationBnb_;
        if (basePrice_ > 0) defaultBasePrice = basePrice_;
        if (slope_ > 0) defaultSlope = slope_;
        if (allocationBps_ > 0 && allocationBps_ <= 10000) curveAllocationBps = allocationBps_;
    }

    receive() external payable {}
}
