// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title 极简 2/3 多签钱包
/// @notice Anubis Chain 无 Gnosis Safe 部署，故自研极简多签。EVM 原生，无特殊预编译依赖
/// @dev 流程：submit → confirm(≥threshold) → execute。关键操作建议配合目标合约的 timelock
/// @dev Gas DoS 修复（GPT 设计版本号懒作废 + 总指挥修正）：
///      - 每个 owner 有独立版本号 ownerVersion（初始 1）
///      - 每次确认记录确认时的版本号 confirmVersion[txId][owner]
///      - removeOwner 只需 ownerVersion[o]++，O(1)，不遍历任何交易
///      - execute 时实时重算有效确认（只遍历 owners 数组，有界）
///      - 修正 GPT 原方案 bug：原方案递增全体 owner 版本号，会误杀合法 pending 交易；
///        本方案只递增被移除者版本，其余 owner 的 pending 确认不受影响

contract SimpleMultisig {
    address[] public owners;
    mapping(address => bool) public isOwner;
    /// @notice 每个 owner 的版本号。初始 1；被移除时 +1，使其历史确认自动失效
    mapping(address => uint256) public ownerVersion;
    uint256 public threshold;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
    }

    Transaction[] public transactions;
    /// @notice txId => owner => 确认时的 ownerVersion（0 = 未确认）
    mapping(uint256 => mapping(address => uint256)) public confirmVersion;

    event Submitted(uint256 indexed txId, address indexed to, uint256 value, bytes data);
    event Confirmed(uint256 indexed txId, address indexed owner);
    event Executed(uint256 indexed txId);
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event ThresholdChanged(uint256 threshold);

    modifier onlyOwner() { require(isOwner[msg.sender], "NOT_OWNER"); _; }
    modifier txExists(uint256 txId) { require(txId < transactions.length, "NO_TX"); _; }
    modifier notExecuted(uint256 txId) { require(!transactions[txId].executed, "EXECUTED"); _; }

    /// @notice GPT 终审修复：阈值动态 = ceil(2n/3)，owner 数量变化时自动调整
    constructor(address[] memory _owners) {
        require(_owners.length >= 3, "MIN_3_OWNERS");
        for (uint i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0), "ZERO_OWNER");
            require(!isOwner[_owners[i]], "DUP_OWNER");
            isOwner[_owners[i]] = true;
            owners.push(_owners[i]);
            ownerVersion[_owners[i]] = 1;
        }
        threshold = _calcThreshold(_owners.length);
    }

    function _calcThreshold(uint256 n) internal pure returns (uint256) {
        return (n * 2 + 2) / 3; // ceil(2n/3)
    }

    function _updateThreshold() internal {
        threshold = _calcThreshold(owners.length);
        emit ThresholdChanged(threshold);
    }

    function submit(address to, uint256 value, bytes calldata data)
        external onlyOwner returns (uint256 txId)
    {
        txId = transactions.length;
        transactions.push(Transaction(to, value, data, false));
        emit Submitted(txId, to, value, data);
        // 提交者自动确认一次
        _confirm(txId);
    }

    function confirm(uint256 txId)
        external onlyOwner txExists(txId) notExecuted(txId)
    {
        _confirm(txId);
    }

    function _confirm(uint256 txId) internal {
        uint256 cur = ownerVersion[msg.sender];
        // 版本号不同视为"新身份"，允许重新确认；同版本号重复确认则拒绝
        require(confirmVersion[txId][msg.sender] != cur, "ALREADY_CONFIRMED");
        confirmVersion[txId][msg.sender] = cur;
        emit Confirmed(txId, msg.sender);
    }

    /// @notice 实时计算有效确认数：只统计当前 owner 且版本号匹配的确认
    /// @dev O(owners.length)，有界；已移除成员的旧确认因版本号不匹配自动排除
    function getValidConfirmations(uint256 txId) public view txExists(txId) returns (uint256 n) {
        for (uint256 i = 0; i < owners.length; i++) {
            address o = owners[i];
            if (confirmVersion[txId][o] == ownerVersion[o]) n++;
        }
    }

    function execute(uint256 txId)
        external onlyOwner txExists(txId) notExecuted(txId)
    {
        require(getValidConfirmations(txId) >= threshold, "NOT_ENOUGH_CONFIRMS");
        Transaction storage t = transactions[txId];
        t.executed = true;
        (bool ok,) = t.to.call{value: t.value}(t.data);
        require(ok, "EXEC_FAIL");
        emit Executed(txId);
    }

    // ============ owner 管理（需多签自身调用，即走 submit/confirm/execute） ============

    function addOwner(address o) external {
        require(msg.sender == address(this), "ONLY_SELF");
        require(o != address(0) && !isOwner[o], "BAD_OWNER");
        isOwner[o] = true;
        owners.push(o);
        // 全新 owner 初始化为 1；曾被移除的保留递增后的版本（旧确认不复活）
        if (ownerVersion[o] == 0) ownerVersion[o] = 1;
        _updateThreshold();
        emit OwnerAdded(o);
    }

    /// @notice 移除成员：O(1) 懒作废，不遍历任何交易，gas 有界
    /// @dev 被移除者的所有历史确认因版本号不匹配自动失效；其余 owner 的 pending 确认不受影响
    /// @dev 语义注意：removeOwner 会降低 threshold（ceil(2n/3)），可能使原本差一票的
    ///      pending 交易变得可执行。集成方需意识到"踢人 = 降门槛"，敏感操作建议配合 timelock
    function removeOwner(address o) external {
        require(msg.sender == address(this), "ONLY_SELF");
        require(isOwner[o], "NOT_OWNER");
        require(owners.length - 1 >= 3, "MIN_3_OWNERS");
        isOwner[o] = false;
        ownerVersion[o]++; // 关键：懒作废，该成员历史确认自动失效，无需遍历
        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == o) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }
        _updateThreshold();
        emit OwnerRemoved(o);
    }

    receive() external payable {}
}
