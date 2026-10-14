// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title 极简 2/3 多签钱包
/// @notice Anubis Chain 无 Gnosis Safe 部署，故自研极简多签。EVM 原生，无特殊预编译依赖
/// @dev 流程：submit → confirm(≥2) → execute。关键操作建议配合目标合约的 timelock

contract SimpleMultisig {
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public threshold;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
    }

    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmed;
    // DeepSeek 复审修复：维护未执行交易 ID 列表，removeOwner 只遍历未执行的，
    // 避免 transactions 无限增长导致 gas DoS
    uint256[] public pendingTxIds;
    mapping(uint256 => uint256) private pendingTxIndex; // txId => 在 pendingTxIds 中的下标+1（0 表示不在）

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
        transactions.push(Transaction(to, value, data, false, 0));
        pendingTxIds.push(txId);
        pendingTxIndex[txId] = pendingTxIds.length; // 下标+1
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
        require(!confirmed[txId][msg.sender], "ALREADY_CONFIRMED");
        confirmed[txId][msg.sender] = true;
        transactions[txId].confirmations++;
        emit Confirmed(txId, msg.sender);
    }

    function execute(uint256 txId)
        external onlyOwner txExists(txId) notExecuted(txId)
    {
        Transaction storage t = transactions[txId];
        require(t.confirmations >= threshold, "NOT_ENOUGH_CONFIRMS");
        t.executed = true;
        _removePending(txId);
        (bool ok,) = t.to.call{value: t.value}(t.data);
        require(ok, "EXEC_FAIL");
        emit Executed(txId);
    }

    function _removePending(uint256 txId) internal {
        uint256 idx = pendingTxIndex[txId];
        require(idx > 0, "NOT_PENDING");
        uint256 last = pendingTxIds[pendingTxIds.length - 1];
        pendingTxIds[idx - 1] = last;
        pendingTxIndex[last] = idx;
        pendingTxIds.pop();
        delete pendingTxIndex[txId];
    }

    // ============ owner 管理（需多签自身调用，即走 submit/confirm/execute） ============

    function addOwner(address o) external {
        require(msg.sender == address(this), "ONLY_SELF");
        require(o != address(0) && !isOwner[o], "BAD_OWNER");
        isOwner[o] = true;
        owners.push(o);
        _updateThreshold();
        emit OwnerAdded(o);
    }

    /// @notice GPT 复审修复：移除成员时，其在所有未执行交易上的旧确认一并作废，
    /// @dev 保证"历史确认一致性"：已移除成员的确认不能继续计入阈值
    function removeOwner(address o) external {
        require(msg.sender == address(this), "ONLY_SELF");
        require(isOwner[o], "NOT_OWNER");
        require(owners.length - 1 >= 3, "MIN_3_OWNERS");
        isOwner[o] = false;
        // 作废该成员在所有未执行交易上的确认（只遍历 pending 列表，有界）
        for (uint256 i = 0; i < pendingTxIds.length; i++) {
            uint256 txId = pendingTxIds[i];
            if (confirmed[txId][o]) {
                confirmed[txId][o] = false;
                transactions[txId].confirmations--;
            }
        }
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
