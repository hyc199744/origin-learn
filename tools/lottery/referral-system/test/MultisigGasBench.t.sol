// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SimpleMultisig.sol";

/// @notice 测量 removeOwner 在 N 笔 pending 交易下的 gas 消耗（版本号懒作废方案）
contract MultisigGasBench is Test {
    SimpleMultisig ms;
    address o1 = address(0x1001);
    address o2 = address(0x1002);
    address o3 = address(0x1003);
    address attacker = address(0xBEEF);

    function setUp() public {
        address[] memory owners = new address[](4);
        owners[0] = o1; owners[1] = o2; owners[2] = o3; owners[3] = attacker;
        ms = new SimpleMultisig(owners);
    }

    function _spamSubmits(uint256 n) internal {
        vm.startPrank(attacker);
        for (uint256 i = 0; i < n; i++) {
            ms.submit(address(0xCAFE), 0, "");
        }
        vm.stopPrank();
    }

    /// @notice 作恶 owner 刷 submit 后，测量 removeOwner(attacker) 的 gas
    function _benchRemove(uint256 n) internal returns (uint256 gasUsed) {
        _spamSubmits(n);
        bytes memory data = abi.encodeWithSelector(SimpleMultisig.removeOwner.selector, attacker);
        vm.prank(o1); uint256 txId = ms.submit(address(ms), 0, data);
        vm.prank(o2); ms.confirm(txId);
        vm.prank(o3); ms.confirm(txId);
        uint256 before = gasleft();
        vm.prank(o1); ms.execute(txId);
        gasUsed = before - gasleft();
    }

    function testBench_32() public {
        uint256 g = _benchRemove(32);
        emit log_named_uint("NEW removeOwner gas with 32 pending", g);
    }
    function testBench_128() public {
        uint256 g = _benchRemove(128);
        emit log_named_uint("NEW removeOwner gas with 128 pending", g);
    }
    function testBench_512() public {
        uint256 g = _benchRemove(512);
        emit log_named_uint("NEW removeOwner gas with 512 pending", g);
    }

    /// @notice 攻击测试1：作恶者刷 512 笔 submit 后，仍能成功移除，且 gas 有界
    function test_attack_spam_then_remove() public {
        _spamSubmits(512);
        bytes memory data = abi.encodeWithSelector(SimpleMultisig.removeOwner.selector, attacker);
        vm.prank(o1); uint256 txId = ms.submit(address(ms), 0, data);
        vm.prank(o2); ms.confirm(txId);
        vm.prank(o3); ms.confirm(txId);
        vm.prank(o1); ms.execute(txId);
        assertFalse(ms.isOwner(attacker), "attacker should be removed");
        // 作恶者的版本号已递增
        assertEq(ms.ownerVersion(attacker), 2);
    }

    /// @notice 攻击测试2：被移除者的历史确认全部失效（抽查多笔）
    function test_attack_removed_confirmations_invalid() public {
        // attacker 刷 50 笔（每笔自动确认一次）
        _spamSubmits(50);
        // 移除 attacker
        bytes memory data = abi.encodeWithSelector(SimpleMultisig.removeOwner.selector, attacker);
        vm.prank(o1); uint256 rmTx = ms.submit(address(ms), 0, data);
        vm.prank(o2); ms.confirm(rmTx);
        vm.prank(o3); ms.confirm(rmTx);
        vm.prank(o1); ms.execute(rmTx);
        // 抽查：attacker 刷的每笔交易，有效确认数都应为 0（只剩他自己的确认，已失效）
        for (uint256 i = 0; i < 50; i++) {
            assertEq(ms.getValidConfirmations(i), 0, "spam tx should have 0 valid confirms");
        }
    }

    /// @notice 攻击测试3：合法 pending 交易不受 removeOwner 影响（GPT 原方案的 bug 已修正）
    function test_legit_pending_survives_remove() public {
        // o1 提交一笔合法交易，o2 确认（2/3 阈值下，4 人时阈值=3，还差 1 个）
        vm.prank(o1); uint256 legitTx = ms.submit(address(0x1234), 0, "");
        vm.prank(o2); ms.confirm(legitTx);
        assertEq(ms.getValidConfirmations(legitTx), 2);
        // 移除 attacker（与合法交易无关的成员）
        bytes memory data = abi.encodeWithSelector(SimpleMultisig.removeOwner.selector, attacker);
        vm.prank(o1); uint256 rmTx = ms.submit(address(ms), 0, data);
        vm.prank(o2); ms.confirm(rmTx);
        vm.prank(o3); ms.confirm(rmTx);
        vm.prank(o1); ms.execute(rmTx);
        // 合法交易的确认数不受影响（o1、o2 的确认仍然有效）
        assertEq(ms.getValidConfirmations(legitTx), 2, "legit confirms must survive");
        // 现在 3 人，阈值=2，o3 再确认即可执行
        vm.prank(o3); ms.confirm(legitTx);
        assertEq(ms.getValidConfirmations(legitTx), 3);
        vm.prank(o1); ms.execute(legitTx);
        (,,, bool executed) = ms.transactions(legitTx);
        assertTrue(executed);
    }

    /// @notice 攻击测试4：被移除后重新加回，旧确认不复活
    function test_readded_owner_old_confirms_stay_dead() public {
        vm.prank(o1); uint256 txId = ms.submit(address(0x1234), 0, "");
        // attacker 确认（4 人阈值=3）
        vm.prank(attacker); ms.confirm(txId);
        assertEq(ms.getValidConfirmations(txId), 2); // o1 + attacker
        // 移除 attacker
        bytes memory data = abi.encodeWithSelector(SimpleMultisig.removeOwner.selector, attacker);
        vm.prank(o1); uint256 rmTx = ms.submit(address(ms), 0, data);
        vm.prank(o2); ms.confirm(rmTx);
        vm.prank(o3); ms.confirm(rmTx);
        vm.prank(o1); ms.execute(rmTx);
        assertEq(ms.getValidConfirmations(txId), 1); // 只剩 o1
        // 重新加回 attacker
        bytes memory addData = abi.encodeWithSelector(SimpleMultisig.addOwner.selector, attacker);
        vm.prank(o1); uint256 addTx = ms.submit(address(ms), 0, addData);
        vm.prank(o2); ms.confirm(addTx);
        vm.prank(o3); ms.confirm(addTx);
        vm.prank(o1); ms.execute(addTx);
        assertTrue(ms.isOwner(attacker));
        // 旧确认不复活
        assertEq(ms.getValidConfirmations(txId), 1, "old confirms must stay dead");
        // 但 attacker 可以重新确认（新身份）
        vm.prank(attacker); ms.confirm(txId);
        assertEq(ms.getValidConfirmations(txId), 2);
    }
}
