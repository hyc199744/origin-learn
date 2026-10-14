// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ANUBIS PLAY 统一邀请关系注册表
/// @notice 全平台唯一邀请关系真相源。v1.2（含 GPT 审查修订）
/// @dev 无环保证：depth 严格递增赋值，数学上不可能形成环

interface IReferralTreasury {
    function notifyActivity(address user) external;
}

interface ILotteryV3 {
    function referrer(address user) external view returns (address);
}

contract ReferralRegistry {
    uint256 public constant DEN = 10000;
    uint256 public constant MAX_DEPTH = 32;
    uint256 public constant COOLDOWN = 24 hours;
    uint16 public constant MAX_TOTAL_BPS = 10000;

    address public multisig;
    address public treasury;
    address public pendingMultisig;
    bool public paused;

    // 用户 => 一级邀请人（永久，除冷静期改绑外）
    mapping(address => address) public referrer;
    // 用户 => depth（无环保证的核心）
    mapping(address => uint256) public depth;
    mapping(address => bool) public hasBound;
    mapping(address => uint256) public boundAt;
    // 是否产生过返佣行为（Treasury 回调设置）
    mapping(address => bool) public hasEarned;

    struct GameConfig {
        uint16 l1Bps;       // 默认 2000 (20%)
        uint16 l2Bps;       // 默认 500 (5%)
        uint16 maxTotalBps; // 默认 2500
        bool active;
    }
    mapping(address => bool) public whitelistedGames;
    mapping(address => GameConfig) public gameConfig;

    // V3 彩票池（禁止接入适配器）
    address[] public v3Pools;
    mapping(address => bool) public isV3Pool;

    // 绑定频率限制：ref => 小时 => 次数
    mapping(address => mapping(uint256 => uint256)) public bindCountPerHour;
    uint256 public constant MAX_BINDS_PER_HOUR = 50;
    // H-2 修复：签名 nonce 防重放
    mapping(address => uint256) public nonces;
    // H-4 修复：改绑次数限制
    mapping(address => uint256) public rebindCount;
    uint256 public constant MAX_REBINDS = 1;

    // 延迟执行
    struct PendingOp { bytes32 hash; uint256 executableAt; bool exists; }
    mapping(bytes32 => PendingOp) public pendingOps;
    uint256 public constant TIMELOCK = 24 hours;
    uint256 public opNonce;

    event ReferrerBound(address indexed user, address indexed ref, uint256 depth);
    event ReferrerRebound(address indexed user, address indexed oldRef, address indexed newRef);
    event MigrationRecord(address indexed user, address indexed pool, address indexed chosenRef, address[5] allRefs, bool cyclic);
    event MigrationSkipped(address indexed user, string reason);
    event GameConfigured(address indexed game, uint16 l1Bps, uint16 l2Bps, uint16 maxTotalBps, bool active);
    event V3PoolAdded(address indexed pool);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event TreasurySet(address indexed treasury);
    event MultisigTransferInitiated(address indexed newMultisig);
    event MultisigTransferred(address indexed newMultisig);

    modifier onlyMultisig() { require(msg.sender == multisig, "NOT_MULTISIG"); _; }
    modifier whenNotPaused() { require(!paused, "PAUSED"); _; }

    constructor(address _multisig, address[] memory _v3Pools) {
        require(_multisig != address(0), "BAD_MULTISIG");
        multisig = _multisig;
        for (uint i = 0; i < _v3Pools.length; i++) {
            v3Pools.push(_v3Pools[i]);
            isV3Pool[_v3Pools[i]] = true;
            emit V3PoolAdded(_v3Pools[i]);
        }
    }

    // ============ 绑定 ============

    /// @notice 用户主动绑定邀请人（永久，除冷静期外）
    function bind(address ref) external whenNotPaused {
        _bind(msg.sender, ref);
    }

    /// @notice 签名绑定：防 mempool 抢跑。用户离线签名，任何人代提交
    /// @dev H-2 修复：nonce 防重放 + deadline 上限 + user 非零检查
    function bindWithSig(address user, address ref, uint256 deadline, uint8 v, bytes32 r, bytes32 s)
        external whenNotPaused
    {
        require(user != address(0), "BAD_USER");
        require(block.timestamp <= deadline, "EXPIRED");
        require(deadline <= block.timestamp + 1 hours, "DEADLINE_TOO_LONG");
        uint256 nonce = nonces[user];
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(address(this), block.chainid, user, ref, deadline, nonce))
        ));
        require(ecrecover(digest, v, r, s) == user, "BAD_SIG");
        nonces[user] = nonce + 1;
        _bind(user, ref);
    }

    function _bind(address user, address ref) internal {
        require(!hasBound[user], "ALREADY_BOUND");
        require(ref != address(0), "ZERO_REF");
        require(ref != user, "SELF_REF");
        // 无环保证：depth 严格递增，环在数学上不可能形成
        uint256 rd = depth[ref];
        require(rd + 1 <= MAX_DEPTH, "TOO_DEEP");
        // 频率限制
        uint256 hour = block.timestamp / 1 hours;
        require(bindCountPerHour[ref][hour] < MAX_BINDS_PER_HOUR, "RATE_LIMIT");
        bindCountPerHour[ref][hour]++;

        referrer[user] = ref;
        depth[user] = rd + 1;
        hasBound[user] = true;
        boundAt[user] = block.timestamp;
        emit ReferrerBound(user, ref, rd + 1);
    }

    /// @notice 冷静期改绑：24h 内、未产生返佣行为、终身仅一次
    /// @dev H-4 修复：次数限制 + 不重置计时 + 频率限制，杜绝无限改绑
    function rebind(address newRef) external whenNotPaused {
        require(hasBound[msg.sender], "NOT_BOUND");
        require(block.timestamp <= boundAt[msg.sender] + COOLDOWN, "COOLDOWN_OVER");
        require(!hasEarned[msg.sender], "ALREADY_ACTIVE");
        require(rebindCount[msg.sender] < MAX_REBINDS, "REBIND_LIMIT");
        address oldRef = referrer[msg.sender];
        require(newRef != address(0) && newRef != msg.sender, "BAD_REF");
        uint256 rd = depth[newRef];
        require(rd + 1 <= MAX_DEPTH, "TOO_DEEP");
        uint256 hour = block.timestamp / 1 hours;
        require(bindCountPerHour[newRef][hour] < MAX_BINDS_PER_HOUR, "RATE_LIMIT");
        bindCountPerHour[newRef][hour]++;
        referrer[msg.sender] = newRef;
        depth[msg.sender] = rd + 1;
        rebindCount[msg.sender]++;
        // 注意：不重置 boundAt，冷静期不延长
        emit ReferrerRebound(msg.sender, oldRef, newRef);
    }

    /// @notice Treasury 回调：用户产生返佣行为后锁定绑定
    function notifyActivity(address user) external {
        require(msg.sender == treasury, "ONLY_TREASURY");
        hasEarned[user] = true;
    }

    // ============ V3 迁移 ============

    /// @notice 从 V3 池迁移邀请关系。确定性冲突规则，永不自动覆盖
    function importFromV3(address pool, address user) external whenNotPaused {
        require(msg.sender == user, "ONLY_SELF");
        if (hasBound[user]) { emit MigrationSkipped(user, "ALREADY_BOUND"); return; }
        require(isV3Pool[pool], "NOT_V3_POOL");

        // 读取全部五个池，作为历史证据
        address[5] memory refs;
        uint256 n = v3Pools.length < 5 ? v3Pools.length : 5;
        for (uint i = 0; i < n; i++) {
            refs[i] = ILotteryV3(v3Pools[i]).referrer(user);
        }
        address chosen = ILotteryV3(pool).referrer(user);
        if (chosen == address(0) || chosen == user) {
            emit MigrationSkipped(user, "BAD_REF");
            return;
        }
        // H-3 修复：遗留环直接拒绝，不写入。用户可改走新绑定
        if (_isDownstream(chosen, user)) {
            emit MigrationSkipped(user, "CYCLIC_REF");
            return;
        }
        _bind(user, chosen);
        emit MigrationRecord(user, pool, chosen, refs, false);
    }

    /// @notice 检查 target 是否在 user 的下游链上（用于标记遗留环）
    function _isDownstream(address target, address user) internal view returns (bool) {
        address cur = target;
        for (uint i = 0; i < MAX_DEPTH; i++) {
            if (cur == user) return true;
            cur = referrer[cur];
            if (cur == address(0)) return false;
        }
        return false;
    }

    // ============ 查询 ============

    /// @notice 返回 (l1, l2)。固定深度，无循环
    /// @dev M-7 修复：同时排除 l2==user（环）和 l2==l1（自环）
    function getUpline(address user) external view returns (address l1, address l2) {
        l1 = referrer[user];
        if (l1 != address(0)) {
            l2 = referrer[l1];
            if (l2 == user || l2 == l1) l2 = address(0);
        }
    }

    function gameBps(address game) external view returns (uint16 l1Bps, uint16 l2Bps) {
        GameConfig memory c = gameConfig[game];
        require(c.active, "GAME_INACTIVE");
        return (c.l1Bps, c.l2Bps);
    }

    // ============ 管理（多签+延迟） ============

    // M-5 修复：setTreasury 走延迟执行
    function proposeTreasury(address t) external onlyMultisig returns (bytes32 opId) {
        require(t != address(0), "BAD_TREASURY");
        opId = _propose("setTreasury", abi.encode(t));
    }

    function executeTreasury(address t, uint256 nonce) external onlyMultisig {
        _execute("setTreasury", abi.encode(t), nonce);
        treasury = t;
        emit TreasurySet(t);
    }

    /// @notice 配置游戏返佣规则（延迟 24h 执行，可取消）
    /// @dev M-3 修复：opId 用 nonce 代替 timestamp，调用者无需传 ts
    function proposeGameConfig(address game, uint16 l1Bps, uint16 l2Bps, uint16 maxTotalBps, bool active)
        external onlyMultisig returns (bytes32 opId)
    {
        require(l1Bps + l2Bps <= maxTotalBps, "EXCEED_MAX");
        require(maxTotalBps <= MAX_TOTAL_BPS, "MAX_TOO_HIGH");
        opId = _propose("gameConfig", abi.encode(game, l1Bps, l2Bps, maxTotalBps, active));
    }

    function executeGameConfig(address game, uint16 l1Bps, uint16 l2Bps, uint16 maxTotalBps, bool active, uint256 nonce)
        external onlyMultisig
    {
        _execute("gameConfig", abi.encode(game, l1Bps, l2Bps, maxTotalBps, active), nonce);
        gameConfig[game] = GameConfig(l1Bps, l2Bps, maxTotalBps, active);
        if (active) whitelistedGames[game] = true;
        emit GameConfigured(game, l1Bps, l2Bps, maxTotalBps, active);
    }

    function _propose(string memory kind, bytes memory data) internal returns (bytes32 opId) {
        opId = keccak256(abi.encode(kind, data, opNonce));
        opNonce++;
        pendingOps[opId] = PendingOp(opId, block.timestamp + TIMELOCK, true);
    }

    function _execute(string memory kind, bytes memory data, uint256 nonce) internal {
        bytes32 opId = keccak256(abi.encode(kind, data, nonce));
        PendingOp memory op = pendingOps[opId];
        require(op.exists, "NO_OP");
        require(block.timestamp >= op.executableAt, "TOO_EARLY");
        delete pendingOps[opId];
    }

    function cancelOp(bytes32 opId) external onlyMultisig {
        require(pendingOps[opId].exists, "NO_OP");
        delete pendingOps[opId];
    }

    /// @notice 暂停：只停 bind/record，不影响用户 claim（claim 在 Treasury，不受此暂停影响）
    function pause() external onlyMultisig {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyMultisig {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // M-4 修复：多签转移走延迟执行，防单点接管
    function proposeMultisig(address next) external onlyMultisig returns (bytes32 opId) {
        require(next != address(0), "BAD_ADDR");
        opId = _propose("multisig", abi.encode(next));
        emit MultisigTransferInitiated(next);
    }

    function executeMultisig(address next, uint256 nonce) external onlyMultisig {
        _execute("multisig", abi.encode(next), nonce);
        multisig = next;
        emit MultisigTransferred(next);
    }
}
