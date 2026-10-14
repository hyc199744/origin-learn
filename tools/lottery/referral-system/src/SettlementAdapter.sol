// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title 结算适配器模板
/// @notice 每游戏部署一个。只做归一化上报，不持有资金，无状态
/// @dev GPT#2 修复：原子结算。适配器调用 treasury.settle，Treasury 在同一笔交易中
/// 从游戏拉取资金（游戏需 approve Treasury）并记账。settlementId 由 Treasury 派生。

interface ITreasury {
    function settle(address token, address user, uint256 revenue, uint8 v, bytes32 r, bytes32 s)
        external returns (bytes32 settlementId);
}

contract SettlementAdapter {
    address public immutable game;
    address public immutable treasury;
    address public immutable token;
    address public operator; // 游戏运营方，可更换

    event RevenueReported(bytes32 indexed settlementId, address indexed user, uint256 revenue);

    modifier onlyOperator() { require(msg.sender == operator, "NOT_OPERATOR"); _; }

    constructor(address _game, address _treasury, address _token, address _operator) {
        require(_game != address(0) && _treasury != address(0) && _token != address(0), "BAD_ADDR");
        game = _game;
        treasury = _treasury;
        token = _token;
        operator = _operator;
    }

    /// @notice 上报一笔已实现收入。需附带游戏签名人的背书签名。
    /// @dev Treasury 原子拉取资金并记账，返回 Treasury 派生的结算 ID
    function reportRevenue(address user, uint256 revenue, uint8 v, bytes32 r, bytes32 s)
        external onlyOperator returns (bytes32 settlementId)
    {
        require(user != address(0) && revenue > 0, "BAD_INPUT");
        settlementId = ITreasury(treasury).settle(token, user, revenue, v, r, s);
        emit RevenueReported(settlementId, user, revenue);
    }

    function setOperator(address next) external onlyOperator {
        require(next != address(0), "BAD_ADDR");
        operator = next;
    }
}
