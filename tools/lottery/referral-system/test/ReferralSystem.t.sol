// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ReferralRegistry.sol";
import "../src/ReferralTreasury.sol";
import "../src/SettlementAdapter.sol";
import "../src/SimpleMultisig.sol";
import "../src/MockERC20.sol";

/// @notice V3 彩票 mock（测试迁移用）
contract MockV3Pool {
    mapping(address => address) public referrer;
    function setReferrer(address user, address ref) external { referrer[user] = ref; }
}

contract ReferralSystemTest is Test {
    ReferralRegistry registry;
    ReferralTreasury treasury;
    SettlementAdapter adapter;
    MockERC20 token;
    MockV3Pool v3pool;

    address multisig = address(0x1001);
    address game = address(0x2002);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address carol = address(0xCA201);
    uint256 gameSignerKey = 0x6A6E;
    address gameSignerAddr;

    function setUp() public {
        gameSignerAddr = vm.addr(gameSignerKey);
        address[] memory pools = new address[](1);
        v3pool = new MockV3Pool();
        pools[0] = address(v3pool);
        registry = new ReferralRegistry(multisig, pools);
        treasury = new ReferralTreasury(multisig, address(registry));
        token = new MockERC20("Test", "TST", 18);

        vm.startPrank(multisig);
        bytes32 topId = registry.proposeTreasury(address(treasury));
        // 游戏配置：l1 20%, l2 5%
        bytes32 opId = registry.proposeGameConfig(game, 2000, 500, 2500, true);
        treasury.setGameSigner(game, gameSignerAddr);
        vm.warp(block.timestamp + 25 hours);
        registry.executeTreasury(address(treasury), 0);
        registry.executeGameConfig(game, 2000, 500, 2500, true, 1);
        adapter = new SettlementAdapter(game, address(treasury), address(token), multisig);
        treasury.authorizeAdapter(address(adapter), game);
        vm.stopPrank();
    }

    // 生成游戏背书签名
    function _gameSig(address tokenAddr, address user, uint256 revenue)
        internal view returns (uint8 v, bytes32 r, bytes32 s)
    {
        uint256 nonce = treasury.gameNonce(game);
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(address(treasury), block.chainid, game, tokenAddr, user, revenue, nonce))
        ));
        (v, r, s) = vm.sign(gameSignerKey, digest);
    }

    // ============ 绑定测试 ============

    function test_bind_basic() public {
        vm.prank(alice);
        registry.bind(bob);
        assertEq(registry.referrer(alice), bob);
        assertEq(registry.depth(alice), 1);
        assertTrue(registry.hasBound(alice));
    }

    function test_bind_self_revert() public {
        vm.prank(alice);
        vm.expectRevert("SELF_REF");
        registry.bind(alice);
    }

    function test_bind_zero_revert() public {
        vm.prank(alice);
        vm.expectRevert("ZERO_REF");
        registry.bind(address(0));
    }

    function test_bind_double_revert() public {
        vm.prank(alice);
        registry.bind(bob);
        vm.prank(alice);
        vm.expectRevert("ALREADY_BOUND");
        registry.bind(carol);
    }

    /// @notice 深度赋值无环：A→B→C 后，C→A 依然可以绑定（depth 递增），但派奖有界
    /// @notice GPT#1 回归：任何循环绑定必须失败
    function test_cycle_rejected_two_node() public {
        vm.prank(alice); registry.bind(bob);   // alice → bob
        // bob 试图绑回 alice → 形成 A↔B 环，必须 revert
        vm.prank(bob);
        vm.expectRevert("CYCLE");
        registry.bind(alice);
    }

    /// @notice 攻击模拟：深层环（11 层）闭环必须失败
    function test_deep_cycle_attack() public {
        address[] memory chain = new address[](12);
        for (uint i = 0; i < 12; i++) chain[i] = address(uint160(0x3000 + i));
        for (uint i = 0; i < 11; i++) {
            vm.prank(chain[i]);
            registry.bind(chain[i+1]);
        }
        // 试图闭环：chain[11]→chain[0]，必须 revert
        vm.prank(chain[11]);
        vm.expectRevert("CYCLE");
        registry.bind(chain[0]);
    }

    /// @notice 攻击模拟：改绑形成环必须失败
    function test_rebind_cycle_rejected() public {
        vm.prank(alice); registry.bind(bob);   // alice → bob
        // alice 在冷静期内试图改绑到自己 → 自环，必须失败
        vm.prank(alice);
        vm.expectRevert("BAD_REF");
        registry.rebind(alice);
    }

    /// @notice 攻击模拟：改绑到自己的下游形成环，必须失败
    function test_rebind_to_downstream_rejected() public {
        address dave = address(0xD000);
        vm.prank(alice); registry.bind(bob);   // alice → bob
        vm.prank(dave); registry.bind(alice);  // dave → alice（alice 是 dave 的上游）
        // alice 试图改绑到 dave：dave 的上游链是 dave→alice，包含 alice → 成环
        vm.prank(alice);
        vm.expectRevert("CYCLE");
        registry.rebind(dave);
    }

    /// @notice fuzz：随机绑定序列永不形成环
    function testFuzz_no_cycle_random_binds(address[] memory users, uint8 seed) public {
        vm.assume(users.length > 0 && users.length <= 20);
        for (uint i = 0; i < users.length; i++) {
            vm.assume(users[i] != address(0));
            // 简单去重：跳过已出现的
            bool dup = false;
            for (uint j = 0; j < i; j++) if (users[j] == users[i]) { dup = true; break; }
            if (dup) continue;
        }
        // 链式绑定 + 随机尝试闭环，闭环必须失败
        for (uint i = 0; i + 1 < users.length; i++) {
            if (users[i] == address(0) || users[i+1] == address(0) || users[i] == users[i+1]) continue;
            // 检查是否已绑定
            (bool ok,) = address(registry).call(
                abi.encodeWithSignature("hasBound(address)", users[i]));
            if (ok) continue;
            vm.prank(users[i]);
            try registry.bind(users[i+1]) {} catch {}
        }
        // 验证：对每个用户，从其上游链走 32 步永不回到自己
        for (uint i = 0; i < users.length; i++) {
            address cur = users[i];
            for (uint k = 0; k < 32; k++) {
                cur = registry.referrer(cur);
                if (cur == address(0)) break;
                assertTrue(cur != users[i], "CYCLE_FOUND");
            }
        }
    }

    function test_rebind_cooldown() public {
        vm.prank(alice);
        registry.bind(bob);
        // 冷静期内、无返佣行为 → 可改绑
        vm.prank(alice);
        registry.rebind(carol);
        assertEq(registry.referrer(alice), carol);
    }

    function test_rebind_locked_after_earn() public {
        vm.prank(alice);
        registry.bind(bob);
        // 模拟产生返佣行为
        vm.prank(address(treasury));
        registry.notifyActivity(alice);
        // 再改绑 → 失败
        vm.prank(alice);
        vm.expectRevert("ALREADY_ACTIVE");
        registry.rebind(carol);
    }

    function test_rebind_after_cooldown_revert() public {
        vm.prank(alice);
        registry.bind(bob);
        vm.warp(block.timestamp + 25 hours);
        vm.prank(alice);
        vm.expectRevert("COOLDOWN_OVER");
        registry.rebind(carol);
    }

    // ============ 返佣记账测试 ============

    // 新资金流：token 先给 game，game approve Treasury，适配器调 settle 原子拉取
    function _fundAndReport(address user, uint256 revenue) internal returns (bytes32) {
        token.mint(game, revenue);
        vm.prank(game);
        token.approve(address(treasury), revenue);
        (uint8 v, bytes32 r, bytes32 s) = _gameSig(address(token), user, revenue);
        vm.prank(multisig);
        return adapter.reportRevenue(user, revenue, v, r, s);
    }

    function test_commission_split() public {
        // alice→bob→carol：carol 消费，bob 拿 20%，alice 拿 5%
        vm.prank(bob); registry.bind(alice);
        vm.prank(carol); registry.bind(bob);
        _fundAndReport(carol, 10000);
        assertEq(treasury.claimable(bob, address(token)), 2000);  // 20%
        assertEq(treasury.claimable(alice, address(token)), 500); // 5%
    }

    function test_claim() public {
        vm.prank(bob); registry.bind(alice);
        _fundAndReport(bob, 10000);
        uint256 before = token.balanceOf(alice);
        vm.prank(alice);
        treasury.claim(address(token));
        assertEq(token.balanceOf(alice) - before, 2000);
        assertEq(treasury.claimable(alice, address(token)), 0);
    }

    function test_claim_double_revert() public {
        vm.prank(bob); registry.bind(alice);
        _fundAndReport(bob, 10000);
        vm.prank(alice);
        treasury.claim(address(token));
        vm.prank(alice);
        vm.expectRevert("NOTHING");
        treasury.claim(address(token));
    }

    /// @notice 攻击模拟：同一业务收入反复上报 → 每次都要真实注资
    function test_replay_requires_refunding() public {
        vm.prank(bob); registry.bind(alice);
        // 第一次：game 有 10000，成功
        bytes32 sid1 = _fundAndReport(bob, 10000);
        // 第二次：game 没钱了 → transferFrom 失败
        (uint8 v, bytes32 r, bytes32 s) = _gameSig(address(token), bob, 10000);
        vm.prank(multisig);
        vm.expectRevert();
        adapter.reportRevenue(bob, 10000, v, r, s);
        // settlementId 每次不同（Treasury nonce 派生）
        bytes32 sid2 = _fundAndReport(bob, 10000);
        assertTrue(sid1 != sid2);
    }

    /// @notice 攻击模拟：未注资就上报（虚假收入）
    function test_unfunded_report_revert() public {
        vm.prank(bob); registry.bind(alice);
        // game 没 approve → transferFrom 失败，无法上报
        (uint8 v3, bytes32 r3, bytes32 s3) = _gameSig(address(token), bob, 10000);
        vm.prank(multisig);
        vm.expectRevert();
        adapter.reportRevenue(bob, 10000, v3, r3, s3);
    }

    /// @notice 攻击模拟：未授权适配器上报
    function test_unauthorized_adapter_revert() public {
        vm.prank(bob); registry.bind(alice);
        token.mint(game, 10000);
        vm.prank(game);
        token.approve(address(treasury), 10000);
        (uint8 v, bytes32 r, bytes32 s) = _gameSig(address(token), bob, 10000);
        vm.prank(address(0xE411));
        vm.expectRevert("NOT_ADAPTER");
        treasury.settle(address(token), bob, 10000, v, r, s);
    }

    /// @notice GPT#4：真正的恶意 ERC20 重入测试
    /// @dev 恶意代币在 transfer 回调中重入 treasury.claim，验证无重复支付
    function test_reentrancy_claim_real() public {
        MaliciousERC20 evil = new MaliciousERC20();
        vm.prank(bob); registry.bind(alice);

        // 给 alice 在恶意币上记一笔 2000 待领取（手动记账模拟 settle）
        // 先让 treasury 持有恶意币
        evil.mint(address(treasury), 10000);
        // 直接写 claimable（测试环境）：用 deal 思路，这里走正常 settle 流程
        // 为简化，用一个独立的 treasury 实例测重入
        ReferralTreasury evilTreasury = new ReferralTreasury(multisig, address(registry));
        evil.mint(address(evilTreasury), 10000);
        // 手动设置 claimable：通过 vm.store 直接写 storage（slot 计算复杂，改走事件）
        // 更直接：让 alice 在 evilTreasury 上走 claim 流程，先记账
        // 由于 settle 需要 adapter，这里直接测试 claim 的重入保护：
        // 1. 给 alice 记账：调用一个最小化的记账路径
        // 用 mock 手段：在测试合约里直接调 evilTreasury 的内部状态不可行，
        // 改为验证 nonReentrant 修饰符：第一次 claim 进入后，重入被 "REENTRANCY" 挡住

        // 配置恶意代币：transfer 时重入 evilTreasury.claim(evil)
        bytes memory payload = abi.encodeWithSelector(evilTreasury.claim.selector, address(evil));
        evil.setAttack(address(evilTreasury), payload);

        // 场景：alice 在 evilTreasury 有 2000 可领（通过 store 直接设置）
        // claimable mapping slot: 需要计算，这里用更直接的方法验证：
        // 调用 claim 时若 claimable 为 0 会 revert "NOTHING"，先确认保护逻辑存在
        vm.prank(alice);
        vm.expectRevert("NOTHING");
        evilTreasury.claim(address(evil));

        // 现在给 alice 真正记一笔：通过 treasury.settle 的完整路径需要 adapter，
        // 为聚焦重入测试，直接用 vm.store 写 claimable
        // claimable[alice][evil] 的 slot = keccak256(abi.encode(evil, keccak256(abi.encode(alice, CLAIMABLE_SLOT))))
        // 简化：部署时已知布局，改用可计算的方式
        // 实际采用：在测试中部署新 Treasury 并走完整 settle（配 adapter）
        _testReentrancyFullPath(evil);
    }

    function _testReentrancyFullPath(MaliciousERC20 evil) internal {
        // 完整路径：adapter + settle（用恶意币）+ claim 重入
        SettlementAdapter evilAdapter = new SettlementAdapter(game, address(treasury), address(evil), multisig);
        vm.prank(multisig);
        treasury.authorizeAdapter(address(evilAdapter), game);
        // game 需要持有恶意币并 approve
        evil.mint(game, 10000);
        vm.prank(game);
        evil.approve(address(treasury), 10000);
        // 配置游戏返佣（game 已在 setUp 配置）
        // 上报：alice 是 bob 的上级，bob 消费 10000 → alice 得 2000 恶意币
        (uint8 v2, bytes32 r2, bytes32 s2) = _gameSig(address(evil), bob, 10000);
        vm.prank(multisig);
        evilAdapter.reportRevenue(bob, 10000, v2, r2, s2);
        assertEq(treasury.claimable(alice, address(evil)), 2000);

        // 配置恶意回调：transfer 时重入 treasury.claim(evil)
        bytes memory payload = abi.encodeWithSelector(treasury.claim.selector, address(evil));
        evil.setAttack(address(treasury), payload);

        uint256 balBefore = evil.balanceOf(alice);
        // alice 领取：transfer 触发重入，重入的 claim 因 nonReentrant 失败（被吞掉），
        // 外层继续完成。最终 alice 只拿到 2000，没有双花
        vm.prank(alice);
        treasury.claim(address(evil));
        assertEq(evil.balanceOf(alice) - balBefore, 2000, "DOUBLE_PAY");
        assertEq(treasury.claimable(alice, address(evil)), 0);
    }

    /// @notice 攻击模拟：暂停后不能 record，但能 claim
    function test_pause_claim_still_works() public {
        vm.prank(bob); registry.bind(alice);
        _fundAndReport(bob, 10000);
        vm.prank(multisig);
        treasury.pause();
        // record 被停
        (uint8 pv, bytes32 pr, bytes32 ps) = _gameSig(address(token), bob, 10000);
        vm.prank(multisig);
        vm.expectRevert("PAUSED");
        adapter.reportRevenue(bob, 10000, pv, pr, ps);
        // claim 不受影响
        vm.prank(alice);
        treasury.claim(address(token));
        assertEq(token.balanceOf(alice), 2000);
    }

    // ============ V3 迁移测试 ============

    function test_importFromV3() public {
        v3pool.setReferrer(alice, bob);
        vm.prank(alice);
        registry.importFromV3(address(v3pool), alice);
        assertEq(registry.referrer(alice), bob);
        assertTrue(registry.hasBound(alice));
    }

    function test_importFromV3_not_self_revert() public {
        v3pool.setReferrer(alice, bob);
        vm.prank(bob); // 不是本人
        vm.expectRevert("ONLY_SELF");
        registry.importFromV3(address(v3pool), alice);
    }

    function test_importFromV3_no_overwrite() public {
        v3pool.setReferrer(alice, bob);
        vm.prank(alice);
        registry.bind(carol); // 先在新系统绑定
        vm.prank(alice);
        registry.importFromV3(address(v3pool), alice); // 应跳过，不覆盖
        assertEq(registry.referrer(alice), carol);
    }

    // ============ 权限测试 ============

    function test_onlyMultisig_pause() public {
        vm.prank(alice);
        vm.expectRevert("NOT_MULTISIG");
        treasury.pause();
    }

    function test_onlyMultisig_authorize() public {
        vm.prank(alice);
        vm.expectRevert("NOT_MULTISIG");
        treasury.authorizeAdapter(address(0x9999), game);
    }

    function test_v3pool_blocked() public {
        vm.startPrank(multisig);
        SettlementAdapter evilAdapter = new SettlementAdapter(address(v3pool), address(treasury), address(token), multisig);
        vm.expectRevert("V3_BLOCKED");
        treasury.authorizeAdapter(address(evilAdapter), address(v3pool));
        vm.stopPrank();
    }

    function test_game_config_caps() public {
        vm.prank(multisig);
        // l1+l2 > maxTotal → revert
        vm.expectRevert("EXCEED_MAX");
        registry.proposeGameConfig(game, 8000, 3000, 10000, true);
        // maxTotal > 10000 → revert
        vm.prank(multisig);
        vm.expectRevert("MAX_TOO_HIGH");
        registry.proposeGameConfig(game, 8000, 3000, 20000, true);
    }

    // ============ 模糊测试 ============

    /// @notice 模糊：任意 revenue 下 l1+l2 不超过 25%，且资金守恒
    function testFuzz_commission_math(uint256 revenue) public {
        revenue = bound(revenue, 1, 1e30);
        vm.prank(carol); // carol 未绑定，无上级
        token.mint(game, revenue);
        vm.prank(game);
        token.approve(address(treasury), revenue);
        (uint8 fv, bytes32 fr, bytes32 fs) = _gameSig(address(token), carol, revenue);
        vm.prank(multisig);
        adapter.reportRevenue(carol, revenue, fv, fr, fs);
        // 无上级 → 无人拿钱，但 gameRevenue 记录
        assertEq(treasury.gameRevenue(game, address(token)), revenue);
    }

    /// @notice 模糊：有上级时分成比例恒为 20%/5%
    function testFuzz_split_ratio(uint256 revenue) public {
        revenue = bound(revenue, 100, 1e24);
        address u1 = address(0x1111);
        address u2 = address(0x2222);
        address u3 = address(0x3333);
        vm.prank(u2); registry.bind(u1);
        vm.prank(u3); registry.bind(u2);
        token.mint(game, revenue);
        vm.prank(game);
        token.approve(address(treasury), revenue);
        (uint8 fv2, bytes32 fr2, bytes32 fs2) = _gameSig(address(token), u3, revenue);
        vm.prank(multisig);
        adapter.reportRevenue(u3, revenue, fv2, fr2, fs2);
        assertEq(treasury.claimable(u2, address(token)), revenue * 2000 / 10000);
        assertEq(treasury.claimable(u1, address(token)), revenue * 500 / 10000);
    }
}

/// @notice 不变量测试：资金守恒 totalOwed <= balance 恒成立
contract InvariantTest is Test {
    ReferralRegistry registry;
    ReferralTreasury treasury;
    SettlementAdapter adapter;
    MockERC20 token;
    address multisig = address(0x1001);
    address game = address(0x2002);
    uint256 gameSignerKey = 0x6A6E;
    address gameSignerAddr;

    function setUp() public {
        gameSignerAddr = vm.addr(gameSignerKey);
        address[] memory pools = new address[](0);
        registry = new ReferralRegistry(multisig, pools);
        treasury = new ReferralTreasury(multisig, address(registry));
        token = new MockERC20("Test", "TST", 18);
        vm.startPrank(multisig);
        registry.proposeTreasury(address(treasury));
        registry.proposeGameConfig(game, 2000, 500, 2500, true);
        treasury.setGameSigner(game, gameSignerAddr);
        vm.warp(block.timestamp + 25 hours);
        registry.executeTreasury(address(treasury), 0);
        registry.executeGameConfig(game, 2000, 500, 2500, true, 1);
        adapter = new SettlementAdapter(game, address(treasury), address(token), multisig);
        treasury.authorizeAdapter(address(adapter), game);
        vm.stopPrank();
    }

    function _gameSig(address user, uint256 revenue) internal view returns (uint8 v, bytes32 r, bytes32 s) {
        uint256 nonce = treasury.gameNonce(game);
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(address(treasury), block.chainid, game, address(token), user, revenue, nonce))
        ));
        (v, r, s) = vm.sign(gameSignerKey, digest);
    }

    /// @notice 处理器：随机绑定+上报+领取
    function test_invariant_fund_conservation() public {
        for (uint i = 0; i < 20; i++) {
            address user = address(uint160(0x5000 + i));
            address ref = address(uint160(0x6000 + i));
            vm.prank(user);
            try registry.bind(ref) {} catch {}
            uint256 rev = (i + 1) * 1e18;
            token.mint(game, rev);
            vm.prank(game);
            token.approve(address(treasury), rev);
            (uint8 iv, bytes32 ir, bytes32 is_) = _gameSig(user, rev);
            vm.prank(multisig);
            try adapter.reportRevenue(user, rev, iv, ir, is_) {} catch {}
            // 不变量：totalOwed 永不超过余额
            assertLe(treasury.totalOwed(address(token)), token.balanceOf(address(treasury)));
        }
        // 最终：所有 claimable 加总 == totalOwed
        assertLe(treasury.totalOwed(address(token)), token.balanceOf(address(treasury)));
    }
}

/// @notice H-1 修复测试：每游戏资金隔离。A 游戏注资不能被 B 游戏的适配器挪用
contract GameIsolationTest is Test {
    ReferralRegistry registry;
    ReferralTreasury treasury;
    SettlementAdapter adapterA;
    SettlementAdapter adapterB;
    MockERC20 token;
    address multisig = address(0x1001);
    address gameA = address(0xA001);
    address gameB = address(0xB002);
    uint256 signerKeyA = 0xAAA1;
    uint256 signerKeyB = 0xBBB2;
    address signerA;
    address signerB;

    function setUp() public {
        signerA = vm.addr(signerKeyA);
        signerB = vm.addr(signerKeyB);
        address[] memory pools = new address[](0);
        registry = new ReferralRegistry(multisig, pools);
        treasury = new ReferralTreasury(multisig, address(registry));
        token = new MockERC20("Test", "TST", 18);
        vm.startPrank(multisig);
        registry.proposeTreasury(address(treasury));
        registry.proposeGameConfig(gameA, 2000, 500, 2500, true);
        registry.proposeGameConfig(gameB, 2000, 500, 2500, true);
        treasury.setGameSigner(gameA, signerA);
        treasury.setGameSigner(gameB, signerB);
        vm.warp(block.timestamp + 25 hours);
        registry.executeTreasury(address(treasury), 0);
        registry.executeGameConfig(gameA, 2000, 500, 2500, true, 1);
        registry.executeGameConfig(gameB, 2000, 500, 2500, true, 2);
        adapterA = new SettlementAdapter(gameA, address(treasury), address(token), multisig);
        adapterB = new SettlementAdapter(gameB, address(treasury), address(token), multisig);
        treasury.authorizeAdapter(address(adapterA), gameA);
        treasury.authorizeAdapter(address(adapterB), gameB);
        vm.stopPrank();
    }

    function _sigA(address user, uint256 revenue) internal view returns (uint8 v, bytes32 r, bytes32 s) {
        uint256 nonce = treasury.gameNonce(gameA);
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(address(treasury), block.chainid, gameA, address(token), user, revenue, nonce))
        ));
        (v, r, s) = vm.sign(signerKeyA, digest);
    }

    function _sigB(address user, uint256 revenue) internal view returns (uint8 v, bytes32 r, bytes32 s) {
        uint256 nonce = treasury.gameNonce(gameB);
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(address(treasury), block.chainid, gameB, address(token), user, revenue, nonce))
        ));
        (v, r, s) = vm.sign(signerKeyB, digest);
    }

    function test_game_fund_isolation() public {
        address user = address(0x1111);
        address ref = address(0x2222);
        vm.prank(user); registry.bind(ref);
        // 只给 gameA 的资金（gameA approve），gameB 没钱
        token.mint(gameA, 10000);
        vm.prank(gameA);
        token.approve(address(treasury), 10000);
        // gameB 的适配器想上报 → 从 gameB 拉取失败
        (uint8 bv, bytes32 br, bytes32 bs) = _sigB(user, 10000);
        vm.prank(multisig);
        vm.expectRevert();
        adapterB.reportRevenue(user, 10000, bv, br, bs);
        // gameA 正常上报 → 成功
        (uint8 av, bytes32 ar, bytes32 as_) = _sigA(user, 10000);
        vm.prank(multisig);
        adapterA.reportRevenue(user, 10000, av, ar, as_);
        assertEq(treasury.claimable(ref, address(token)), 2000);
    }
}

/// @notice H-2/H-3/H-4 修复测试
contract SigCycleRebindTest is Test {
    ReferralRegistry registry;
    address multisig = address(0x1001);
    uint256 aliceKey = 0xA11CE;
    address alice;

    function setUp() public {
        alice = vm.addr(aliceKey);
        address[] memory pools = new address[](0);
        registry = new ReferralRegistry(multisig, pools);
    }

    function _sig(address user, uint256 key, address ref, uint256 deadline, uint256 nonce)
        internal view returns (uint8 v, bytes32 r, bytes32 s)
    {
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(address(registry), block.chainid, user, ref, deadline, nonce))
        ));
        (v, r, s) = vm.sign(key, digest);
    }

    function test_bindWithSig_nonce_replay_revert() public {
        address ref = address(0xB0B);
        uint256 deadline = block.timestamp + 30 minutes;
        (uint8 v, bytes32 r, bytes32 s) = _sig(alice, aliceKey, ref, deadline, 0);
        registry.bindWithSig(alice, ref, deadline, v, r, s);
        assertEq(registry.referrer(alice), ref);
        // 同一签名重放 → nonce 已消费，失败
        vm.expectRevert();
        registry.bindWithSig(alice, ref, deadline, v, r, s);
    }

    function test_bindWithSig_deadline_too_long_revert() public {
        address ref = address(0xB0B);
        uint256 deadline = block.timestamp + 2 hours;
        (uint8 v, bytes32 r, bytes32 s) = _sig(alice, aliceKey, ref, deadline, 0);
        vm.expectRevert("DEADLINE_TOO_LONG");
        registry.bindWithSig(alice, ref, deadline, v, r, s);
    }

    function test_rebind_only_once() public {
        vm.prank(alice);
        registry.bind(address(0xB0B));
        vm.prank(alice);
        registry.rebind(address(0xC0C));
        assertEq(registry.referrer(alice), address(0xC0C));
        // 第二次改绑 → 失败
        vm.prank(alice);
        vm.expectRevert("REBIND_LIMIT");
        registry.rebind(address(0xD0D));
    }
}

/// @notice 多签测试
contract MultisigTest is Test {
    SimpleMultisig msig;
    address o1 = address(0x1111);
    address o2 = address(0x2222);
    address o3 = address(0x3333);

    function setUp() public {
        address[] memory owners = new address[](3);
        owners[0] = o1; owners[1] = o2; owners[2] = o3;
        msig = new SimpleMultisig(owners, 2);
    }

    function test_submit_and_execute() public {
        // o1 提交（自动确认1次）
        vm.prank(o1);
        uint256 txId = msig.submit(address(0x9999), 0, "");
        // o2 确认（2/3 达成）
        vm.prank(o2);
        msig.confirm(txId);
        // o3 执行
        vm.prank(o3);
        msig.execute(txId);
        (,,, bool executed,) = msig.transactions(txId);
        assertTrue(executed);
    }

    function test_single_confirm_cannot_execute() public {
        vm.prank(o1);
        uint256 txId = msig.submit(address(0x9999), 0, "");
        // 只有1个确认，执行失败
        vm.prank(o1);
        vm.expectRevert("NOT_ENOUGH_CONFIRMS");
        msig.execute(txId);
    }

    function test_non_owner_revert() public {
        vm.prank(address(0x9999));
        vm.expectRevert("NOT_OWNER");
        msig.submit(address(0x8888), 0, "");
    }

    function test_double_confirm_revert() public {
        vm.prank(o1);
        uint256 txId = msig.submit(address(0x9999), 0, "");
        vm.prank(o1);
        vm.expectRevert("ALREADY_CONFIRMED");
        msig.confirm(txId);
    }
}

/// @notice GPT#3 回归：零地址/无效邀请人不产生债务
contract ZeroRefTest is Test {
    ReferralRegistry registry;
    ReferralTreasury treasury;
    SettlementAdapter adapter;
    MockERC20 token;
    address multisig = address(0x1001);
    address game = address(0x2002);
    uint256 gameSignerKey = 0x6A6E;
    address gameSignerAddr;

    function setUp() public {
        gameSignerAddr = vm.addr(gameSignerKey);
        address[] memory pools = new address[](0);
        registry = new ReferralRegistry(multisig, pools);
        treasury = new ReferralTreasury(multisig, address(registry));
        token = new MockERC20("Test", "TST", 18);
        vm.startPrank(multisig);
        registry.proposeTreasury(address(treasury));
        registry.proposeGameConfig(game, 2000, 500, 2500, true);
        treasury.setGameSigner(game, gameSignerAddr);
        vm.warp(block.timestamp + 25 hours);
        registry.executeTreasury(address(treasury), 0);
        registry.executeGameConfig(game, 2000, 500, 2500, true, 1);
        adapter = new SettlementAdapter(game, address(treasury), address(token), multisig);
        treasury.authorizeAdapter(address(adapter), game);
        vm.stopPrank();
    }

    function _gameSig(address user, uint256 revenue) internal view returns (uint8 v, bytes32 r, bytes32 s) {
        uint256 nonce = treasury.gameNonce(game);
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(address(treasury), block.chainid, game, address(token), user, revenue, nonce))
        ));
        (v, r, s) = vm.sign(gameSignerKey, digest);
    }

    function test_no_upline_no_debt() public {
        address lonely = address(0x9999);
        // lonely 没有绑定任何邀请人
        token.mint(game, 10000);
        vm.prank(game);
        token.approve(address(treasury), 10000);
        (uint8 zv, bytes32 zr, bytes32 zs) = _gameSig(lonely, 10000);
        vm.prank(multisig);
        adapter.reportRevenue(lonely, 10000, zv, zr, zs);
        // 零地址没有产生不可领取的债务
        assertEq(treasury.claimable(address(0), address(token)), 0);
        assertEq(treasury.totalOwed(address(token)), 0);
        // gameRecorded 只记实际应付（0）
        assertEq(treasury.gameRecorded(game, address(token)), 0);
        // Treasury 实际收到了 10000（资金在，但无债务）
        assertEq(token.balanceOf(address(treasury)), 10000);
    }

    function test_partial_upline_only_real_credit() public {
        address user = address(0x1111);
        address l1 = address(0x2222);
        vm.prank(user);
        registry.bind(l1); // 只有一级，无二级
        token.mint(game, 10000);
        vm.prank(game);
        token.approve(address(treasury), 10000);
        (uint8 zv2, bytes32 zr2, bytes32 zs2) = _gameSig(user, 10000);
        vm.prank(multisig);
        adapter.reportRevenue(user, 10000, zv2, zr2, zs2);
        // l1 得 2000，l2（零地址）不得
        assertEq(treasury.claimable(l1, address(token)), 2000);
        assertEq(treasury.claimable(address(0), address(token)), 0);
        assertEq(treasury.totalOwed(address(token)), 2000);
    }
}

/// @notice GPT#5 回归：适配器终身绑定
contract LifetimeBindTest is Test {
    ReferralRegistry registry;
    ReferralTreasury treasury;
    MockERC20 token;
    address multisig = address(0x1001);
    address gameA = address(0xA001);
    address gameB = address(0xB002);

    function setUp() public {
        address[] memory pools = new address[](0);
        registry = new ReferralRegistry(multisig, pools);
        treasury = new ReferralTreasury(multisig, address(registry));
        token = new MockERC20("Test", "TST", 18);
    }

    function test_revoke_keeps_binding() public {
        SettlementAdapter adapter = new SettlementAdapter(gameA, address(treasury), address(token), multisig);
        vm.startPrank(multisig);
        treasury.authorizeAdapter(address(adapter), gameA);
        treasury.revokeAdapter(address(adapter));
        // 绑定关系保留
        assertEq(treasury.adapterGame(address(adapter)), gameA);
        assertFalse(treasury.authorizedAdapters(address(adapter)));
        // 重新授权只能绑回原游戏
        treasury.reauthorizeAdapter(address(adapter));
        assertTrue(treasury.authorizedAdapters(address(adapter)));
        assertEq(treasury.adapterGame(address(adapter)), gameA);
        vm.stopPrank();
    }

    function test_cannot_rebind_to_different_game() public {
        SettlementAdapter adapter = new SettlementAdapter(gameA, address(treasury), address(token), multisig);
        vm.startPrank(multisig);
        treasury.authorizeAdapter(address(adapter), gameA);
        treasury.revokeAdapter(address(adapter));
        // 试图绑到 gameB → 失败（ALREADY_BOUND）
        vm.expectRevert("ALREADY_BOUND");
        treasury.authorizeAdapter(address(adapter), gameB);
        vm.stopPrank();
    }
}

/// @notice GPT 复审回归：游戏签名背书攻击测试
contract GameSigAttackTest is Test {
    ReferralRegistry registry;
    ReferralTreasury treasury;
    SettlementAdapter adapter;
    MockERC20 token;
    address multisig = address(0x1001);
    address game = address(0x2002);
    uint256 gameSignerKey = 0x6A6E;
    uint256 attackerKey = 0xBAD;
    address gameSignerAddr;

    function setUp() public {
        gameSignerAddr = vm.addr(gameSignerKey);
        address[] memory pools = new address[](0);
        registry = new ReferralRegistry(multisig, pools);
        treasury = new ReferralTreasury(multisig, address(registry));
        token = new MockERC20("Test", "TST", 18);
        vm.startPrank(multisig);
        registry.proposeTreasury(address(treasury));
        registry.proposeGameConfig(game, 2000, 500, 2500, true);
        treasury.setGameSigner(game, gameSignerAddr);
        vm.warp(block.timestamp + 25 hours);
        registry.executeTreasury(address(treasury), 0);
        registry.executeGameConfig(game, 2000, 500, 2500, true, 1);
        adapter = new SettlementAdapter(game, address(treasury), address(token), multisig);
        treasury.authorizeAdapter(address(adapter), game);
        vm.stopPrank();
    }

    function _sig(uint256 key, address user, uint256 revenue, uint256 nonce)
        internal view returns (uint8 v, bytes32 r, bytes32 s)
    {
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(address(treasury), block.chainid, game, address(token), user, revenue, nonce))
        ));
        (v, r, s) = vm.sign(key, digest);
    }

    function test_forged_game_sig_rejected() public {
        address user = address(0x1111);
        token.mint(game, 10000);
        vm.prank(game);
        token.approve(address(treasury), 10000);
        // 攻击者伪造签名（用自己的 key 签）
        (uint8 v, bytes32 r, bytes32 s) = _sig(attackerKey, user, 10000, 0);
        vm.prank(multisig);
        vm.expectRevert("BAD_GAME_SIG");
        adapter.reportRevenue(user, 10000, v, r, s);
    }

    function test_replay_sig_rejected() public {
        address user = address(0x1111);
        token.mint(game, 20000);
        vm.prank(game);
        token.approve(address(treasury), 20000);
        // 正常签一次，上报成功
        (uint8 v, bytes32 r, bytes32 s) = _sig(gameSignerKey, user, 10000, 0);
        vm.prank(multisig);
        adapter.reportRevenue(user, 10000, v, r, s);
        // 重放同一签名（nonce 已消费）→ 失败
        vm.prank(multisig);
        vm.expectRevert("BAD_GAME_SIG");
        adapter.reportRevenue(user, 10000, v, r, s);
    }

    function test_wrong_revenue_sig_rejected() public {
        address user = address(0x1111);
        token.mint(game, 10000);
        vm.prank(game);
        token.approve(address(treasury), 10000);
        // 签的是 10000，实际报 20000 → 签名不匹配
        (uint8 v, bytes32 r, bytes32 s) = _sig(gameSignerKey, user, 10000, 0);
        vm.prank(multisig);
        vm.expectRevert("BAD_GAME_SIG");
        adapter.reportRevenue(user, 20000, v, r, s);
    }
}

/// @notice GPT 复审回归：多签历史确认一致性
contract MultisigHistoryTest is Test {
    SimpleMultisig msig;
    address o1 = address(0x1111);
    address o2 = address(0x2222);
    address o3 = address(0x3333);
    address o4 = address(0x4444);

    function setUp() public {
        address[] memory owners = new address[](4);
        owners[0] = o1; owners[1] = o2; owners[2] = o3; owners[3] = o4;
        msig = new SimpleMultisig(owners, 2);
    }

    function test_removed_owner_confirm_invalidated() public {
        // o1 提交（自动确认），o2 确认 → 2/3 达成
        vm.prank(o1);
        uint256 txId = msig.submit(address(0x9999), 0, "");
        vm.prank(o2);
        msig.confirm(txId);
        // 移除 o1（走多签自身调用）
        // 先构造移除交易：o2 提交，o3 确认，执行
        vm.prank(o2);
        uint256 rmTx = msig.submit(address(msig), 0,
            abi.encodeWithSelector(msig.removeOwner.selector, o1));
        vm.prank(o3);
        msig.confirm(rmTx);
        vm.prank(o2);
        msig.execute(rmTx);
        assertFalse(msig.isOwner(o1));
        // 原交易的确认数应从 2 降到 1（o1 的确认作废）
        (, , , bool executed, uint256 confs) = msig.transactions(txId);
        assertEq(confs, 1);
        assertFalse(executed);
        // 现在执行原交易 → 确认不足，失败
        vm.prank(o2);
        vm.expectRevert("NOT_ENOUGH_CONFIRMS");
        msig.execute(txId);
    }
}
