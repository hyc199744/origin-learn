// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ANUBIS PLAY 统一返佣金库
/// @notice 分币种记账，用户主动领取。v1.2（含 GPT 审查修订）
/// @dev 资金守恒不变量：totalOwed[token] <= balanceOf(token) 恒成立

import "./IERC20.sol";

interface IRegistry {
    function getUpline(address user) external view returns (address l1, address l2);
    function gameBps(address game) external view returns (uint16 l1Bps, uint16 l2Bps);
    function isV3Pool(address game) external view returns (bool);
    function notifyActivity(address user) external;
}

contract ReferralTreasury {
    uint256 public constant DEN = 10000;

    address public multisig;
    IRegistry public registry;
    bool public paused;

    // 适配器 => 游戏（1:1 严格绑定，终身不可改）
    mapping(address => bool) public authorizedAdapters;
    mapping(address => address) public adapterGame;
    // GPT#5 修复：revoke 只停用，不清除绑定。重新授权只能绑回原游戏

    // GPT#2 修复：Treasury 控制的结算 nonce，settlementId 由 Treasury 派生，
    // 适配器不能自选 ID，无法通过换 ID 重复上报
    mapping(address => uint256) public adapterNonce;

    // 分币种记账：用户 => 代币 => 待领取
    mapping(address => mapping(address => uint256)) public claimable;
    // 已领取累计
    mapping(address => mapping(address => uint256)) public claimedTotal;
    // 代币 => 未领取总额（资金守恒）
    mapping(address => uint256) public totalOwed;
    // 游戏 => 代币 => 已上报收入（核验用）
    mapping(address => mapping(address => uint256)) public gameRevenue;
    // H-1 修复：每游戏实际注资（游戏方调 fundGame 存入）
    mapping(address => mapping(address => uint256)) public gameFunded;
    // H-1 修复：每游戏已记账返佣
    mapping(address => mapping(address => uint256)) public gameRecorded;

    // 限额：用户 => 代币 => 天 => 已用
    mapping(address => mapping(address => mapping(uint256 => uint256))) public dailyUsed;
    // 游戏 => 代币 => 单用户单日上限（0 = 不限）
    mapping(address => mapping(address => uint256)) public dailyCap;

    bool private _locked;
    modifier nonReentrant() { require(!_locked, "REENTRANCY"); _locked = true; _; _locked = false; }
    modifier onlyMultisig() { require(msg.sender == multisig, "NOT_MULTISIG"); _; }
    modifier whenNotPaused() { require(!paused, "PAUSED"); _; }

    event AdapterAuthorized(address indexed adapter, address indexed game);
    event AdapterRevoked(address indexed adapter);
    event GameFunded(address indexed game, address indexed token, uint256 amount);
    event CommissionRecorded(bytes32 indexed settlementId, address indexed game, address indexed token, address user, address l1, uint256 l1Amt, address l2, uint256 l2Amt);
    event Claimed(address indexed user, address indexed token, uint256 amount);
    event DailyCapSet(address indexed game, address indexed token, uint256 cap);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event RegistrySet(address indexed registry);

    constructor(address _multisig, address _registry) {
        require(_multisig != address(0), "BAD_MULTISIG");
        multisig = _multisig;
        registry = IRegistry(_registry);
        emit RegistrySet(_registry);
    }

    // ============ 适配器管理 ============

    function authorizeAdapter(address adapter, address game) external onlyMultisig {
        require(adapter != address(0) && game != address(0), "BAD_ADDR");
        require(!registry.isV3Pool(game), "V3_BLOCKED");
        require(adapterGame[adapter] == address(0), "ALREADY_BOUND");
        authorizedAdapters[adapter] = true;
        adapterGame[adapter] = game;
        emit AdapterAuthorized(adapter, game);
    }

    /// @notice GPT#5 修复：revoke 只停用，adapterGame 终身保留。
    /// @dev 如需换游戏，部署新适配器。旧适配器重新授权只能绑回原游戏
    function revokeAdapter(address adapter) external onlyMultisig {
        authorizedAdapters[adapter] = false;
        emit AdapterRevoked(adapter);
    }

    function reauthorizeAdapter(address adapter) external onlyMultisig {
        require(adapterGame[adapter] != address(0), "NEVER_BOUND");
        require(!registry.isV3Pool(adapterGame[adapter]), "V3_BLOCKED");
        authorizedAdapters[adapter] = true;
        emit AdapterAuthorized(adapter, adapterGame[adapter]);
    }

    /// @notice H-1 修复：游戏方注资。返佣记账不得超过本游戏实际注资，
    /// @dev 妥协适配器也只能动自己游戏的钱，动不了别的游戏/用户的资金
    function fundGame(address game, address token, uint256 amount) external {
        require(amount > 0, "BAD_AMOUNT");
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "FUND_FAIL");
        gameFunded[game][token] += amount;
        emit GameFunded(game, token, amount);
    }

    function setDailyCap(address game, address token, uint256 cap) external onlyMultisig {
        dailyCap[game][token] = cap;
        emit DailyCapSet(game, token, cap);
    }

    // ============ 记账 ============

    /// @notice GPT#2 修复：原子结算。适配器在同一笔交易中从游戏拉取资金并记账。
    /// @dev settlementId 由 Treasury 用自有 nonce 派生，适配器不能自选 ID，
    /// 无法通过换 ID 反复上报同一业务收入。重复上报必须重复注资（经济约束）。
    /// 游戏只需 approve Treasury 一次。
    function settle(address token, address user, uint256 revenue)
        external whenNotPaused nonReentrant returns (bytes32 settlementId)
    {
        require(authorizedAdapters[msg.sender], "NOT_ADAPTER");
        address game = adapterGame[msg.sender]; // 严格绑定：只能结算自己的游戏
        require(revenue > 0, "ZERO_REVENUE");

        // 原子资金流：同一笔交易从游戏拉取本次收入
        require(IERC20(token).transferFrom(game, address(this), revenue), "FUND_FAIL");

        // Treasury 派生唯一结算 ID（适配器不可控）
        uint256 nonce = adapterNonce[msg.sender]++;
        settlementId = keccak256(abi.encode(msg.sender, game, token, user, revenue, nonce, block.chainid));

        (address l1, address l2) = registry.getUpline(user);
        (uint16 l1Bps, uint16 l2Bps) = registry.gameBps(game);
        uint256 l1Amt = revenue * l1Bps / DEN;
        uint256 l2Amt = revenue * l2Bps / DEN;

        _checkDailyCap(game, token, user, l1Amt + l2Amt);

        // GPT#3 修复：只给真实存在的邀请人记账。零地址/无上级的部分不产生债务，
        // totalOwed 只累计实际应付，确保资金守恒与可领取余额一致
        uint256 credited = 0;
        if (l1 != address(0) && l1Amt > 0) {
            claimable[l1][token] += l1Amt;
            credited += l1Amt;
        }
        if (l2 != address(0) && l2Amt > 0) {
            claimable[l2][token] += l2Amt;
            credited += l2Amt;
        }

        // 每游戏隔离：实际记账不得超过本游戏累计转入
        gameFunded[game][token] += revenue;
        gameRecorded[game][token] += credited;
        require(gameRecorded[game][token] <= gameFunded[game][token], "GAME_UNDERFUNDED");

        // 全局资金守恒：记账总额永不超过实际到账
        totalOwed[token] += credited;
        require(IERC20(token).balanceOf(address(this)) >= totalOwed[token], "UNDERFUNDED");

        gameRevenue[game][token] += revenue;

        registry.notifyActivity(user);
        emit CommissionRecorded(settlementId, game, token, user, l1, l1Amt, l2, l2Amt);
    }

    function _checkDailyCap(address game, address token, address user, uint256 total) internal {
        uint256 cap = dailyCap[game][token];
        if (cap == 0) return;
        uint256 day = block.timestamp / 1 days;
        require(dailyUsed[user][token][day] + total <= cap, "DAILY_CAP");
        dailyUsed[user][token][day] += total;
    }

    // ============ 领取 ============

    /// @notice 用户主动领取。暂停不影响领取（用户资金永不被锁）
    function claim(address token) external nonReentrant {
        uint256 amt = claimable[msg.sender][token];
        require(amt > 0, "NOTHING");
        claimable[msg.sender][token] = 0;
        totalOwed[token] -= amt;
        claimedTotal[msg.sender][token] += amt;
        require(IERC20(token).transfer(msg.sender, amt), "TRANSFER_FAIL");
        emit Claimed(msg.sender, token, amt);
    }

    /// @notice 批量领取（先全部清零再转账，防重入）
    function claimBatch(address[] calldata tokens) external nonReentrant {
        uint256 n = tokens.length;
        require(n > 0 && n <= 20, "BAD_LEN");
        uint256[] memory amts = new uint256[](n);
        for (uint i = 0; i < n; i++) {
            uint256 amt = claimable[msg.sender][tokens[i]];
            require(amt > 0, "NOTHING");
            claimable[msg.sender][tokens[i]] = 0;
            totalOwed[tokens[i]] -= amt;
            claimedTotal[msg.sender][tokens[i]] += amt;
            amts[i] = amt;
        }
        for (uint i = 0; i < n; i++) {
            require(IERC20(tokens[i]).transfer(msg.sender, amts[i]), "TRANSFER_FAIL");
            emit Claimed(msg.sender, tokens[i], amts[i]);
        }
    }

    // ============ 管理 ============

    /// @notice 暂停只停 record，不停 claim
    function pause() external onlyMultisig {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyMultisig {
        paused = false;
        emit Unpaused(msg.sender);
    }
}
