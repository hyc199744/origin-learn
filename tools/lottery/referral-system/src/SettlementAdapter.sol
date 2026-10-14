// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title 结算适配器模板
/// @notice 每游戏部署一个。只做归一化上报，不持有资金，无状态
/// @dev 标准资金流：游戏合约先把平台费转给 Treasury，适配器再调 recordCommission

interface ITreasury {
    function recordCommission(bytes32 settlementId, address token, address user, uint256 revenue) external;
}

import "./IERC20.sol";

contract SettlementAdapter {
    address public immutable game;
    address public immutable treasury;
    address public immutable token;
    address public operator; // 游戏运营方，可更换
    uint256 public nonce;

    event RevenueReported(bytes32 indexed settlementId, address indexed user, uint256 revenue);

    modifier onlyOperator() { require(msg.sender == operator, "NOT_OPERATOR"); _; }

    constructor(address _game, address _treasury, address _token, address _operator) {
        require(_game != address(0) && _treasury != address(0) && _token != address(0), "BAD_ADDR");
        game = _game;
        treasury = _treasury;
        token = _token;
        operator = _operator;
    }

    /// @notice 上报一笔已实现收入。调用前游戏必须已把 revenue 转给 treasury
    function reportRevenue(address user, uint256 revenue) external onlyOperator returns (bytes32 settlementId) {
        require(user != address(0) && revenue > 0, "BAD_INPUT");
        settlementId = keccak256(abi.encode(game, token, user, revenue, block.number, nonce));
        nonce++;
        ITreasury(treasury).recordCommission(settlementId, token, user, revenue);
        emit RevenueReported(settlementId, user, revenue);
    }

    function setOperator(address next) external onlyOperator {
        require(next != address(0), "BAD_ADDR");
        operator = next;
    }
}
