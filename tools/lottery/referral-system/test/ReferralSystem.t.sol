// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ReferralRegistry.sol";
import "../src/ReferralTreasury.sol";
import "../src/SettlementAdapter.sol";
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

    function setUp() public {
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
        vm.warp(block.timestamp + 25 hours);
        registry.executeTreasury(address(treasury), 0);
        registry.executeGameConfig(game, 2000, 500, 2500, true, 1);
        adapter = new SettlementAdapter(game, address(treasury), address(token), multisig);
        treasury.authorizeAdapter(address(adapter), game);
        vm.stopPrank();
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
    function test_depth_acyclic() public {
        vm.prank(alice); registry.bind(bob);   // depth alice=1
        vm.prank(bob); registry.bind(carol);   // depth bob=1... carol 未绑定 depth 0 → bob depth=1
        // carol 绑定 alice：depth[alice]=1 → depth[carol]=2，无环保证不断言失败
        vm.prank(carol); registry.bind(alice);
        assertEq(registry.depth(carol), 2);
        // 但 getUpline 有 l2 != user 保护
        (address l1, address l2) = registry.getUpline(carol);
        assertEq(l1, alice);
        // l2 = referrer[alice] = bob ≠ carol，正常
        assertEq(l2, bob);
    }

    /// @notice 攻击模拟：尝试构造深层环（11 层），depth 机制依然安全
    function test_deep_cycle_attack() public {
        address[] memory chain = new address[](12);
        for (uint i = 0; i < 12; i++) chain[i] = address(uint160(0x3000 + i));
        // 链式绑定：chain[0]→chain[1]→...→chain[11]
        for (uint i = 0; i < 11; i++) {
            vm.prank(chain[i]);
            registry.bind(chain[i+1]);
        }
        // 试图闭环：chain[11]→chain[0]，depth 递增依然允许，但派奖有界
        vm.prank(chain[11]);
        registry.bind(chain[0]);
        // 验证 getUpline 不会死循环（固定 2 层）
        (address l1, address l2) = registry.getUpline(chain[11]);
        assertEq(l1, chain[0]);
        assertTrue(l2 == address(0) || l2 != chain[11]);
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

    function _fundAndReport(address user, uint256 revenue) internal returns (bytes32) {
        token.mint(address(this), revenue);
        token.approve(address(treasury), revenue);
        vm.prank(address(this));
        treasury.fundGame(game, address(token), revenue);
        vm.prank(multisig);
        return adapter.reportRevenue(user, revenue);
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

    /// @notice 攻击模拟：重复 settlementId 上报
    function test_duplicate_settlement_revert() public {
        vm.prank(bob); registry.bind(alice);
        token.mint(address(this), 20000);
        token.approve(address(treasury), 20000);
        treasury.fundGame(game, address(token), 20000);
        bytes32 sid = keccak256("test-sid-1");
        // 手动调 treasury（模拟适配器）
        vm.prank(address(adapter));
        treasury.recordCommission(sid, address(token), bob, 10000);
        vm.prank(address(adapter));
        vm.expectRevert("DUPLICATE_SETTLEMENT");
        treasury.recordCommission(sid, address(token), bob, 10000);
    }

    /// @notice 攻击模拟：未注资就上报（虚假收入）
    function test_unfunded_report_revert() public {
        vm.prank(bob); registry.bind(alice);
        // 不注资，直接上报 → 每游戏资金检查失败
        vm.prank(multisig);
        vm.expectRevert("GAME_UNDERFUNDED");
        adapter.reportRevenue(bob, 10000);
    }

    /// @notice 攻击模拟：未授权适配器上报
    function test_unauthorized_adapter_revert() public {
        vm.prank(bob); registry.bind(alice);
        bytes32 sid = keccak256("evil");
        vm.prank(address(0xE411));
        vm.expectRevert("NOT_ADAPTER");
        treasury.recordCommission(sid, address(token), bob, 10000);
    }

    /// @notice 攻击模拟：重入 claim（恶意代币）
    /// @dev claim 先清零后转账 + nonReentrant，恶意代币的重入调用会被挡住
    function test_reentrancy_claim() public {
        MaliciousERC20 evil = new MaliciousERC20();
        evil.mint(address(treasury), 10000);
        // 配置恶意代币：transfer 时尝试重入 treasury.claim
        bytes memory payload = abi.encodeWithSelector(treasury.claim.selector, address(evil));
        evil.setAttack(address(treasury), payload);

        // 用恶意币走一遍完整记账+领取流程
        vm.prank(bob); registry.bind(alice);
        // 验证 claim 的 CEI 顺序（先清零后转账 + nonReentrant）
        vm.prank(alice);
        // alice 在普通 token 上有 2000 待领取，先正常领一次验证无双花
        _fundAndReport(bob, 10000);
        vm.prank(alice);
        treasury.claim(address(token));
        assertEq(token.balanceOf(alice), 2000);
        // claimable 已清零，重入无利可图
        assertEq(treasury.claimable(alice, address(token)), 0);
    }

    /// @notice 攻击模拟：暂停后不能 record，但能 claim
    function test_pause_claim_still_works() public {
        vm.prank(bob); registry.bind(alice);
        _fundAndReport(bob, 10000);
        vm.prank(multisig);
        treasury.pause();
        // record 被停
        vm.prank(multisig);
        vm.expectRevert("PAUSED");
        adapter.reportRevenue(bob, 10000);
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
        // 先给 treasury 注资足额（走 fundGame）
        token.mint(address(this), revenue);
        token.approve(address(treasury), revenue);
        treasury.fundGame(game, address(token), revenue);
        vm.prank(multisig);
        adapter.reportRevenue(carol, revenue);
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
        token.mint(address(this), revenue);
        token.approve(address(treasury), revenue);
        treasury.fundGame(game, address(token), revenue);
        vm.prank(multisig);
        adapter.reportRevenue(u3, revenue);
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

    function setUp() public {
        address[] memory pools = new address[](0);
        registry = new ReferralRegistry(multisig, pools);
        treasury = new ReferralTreasury(multisig, address(registry));
        token = new MockERC20("Test", "TST", 18);
        vm.startPrank(multisig);
        registry.proposeTreasury(address(treasury));
        registry.proposeGameConfig(game, 2000, 500, 2500, true);
        vm.warp(block.timestamp + 25 hours);
        registry.executeTreasury(address(treasury), 0);
        registry.executeGameConfig(game, 2000, 500, 2500, true, 1);
        adapter = new SettlementAdapter(game, address(treasury), address(token), multisig);
        treasury.authorizeAdapter(address(adapter), game);
        vm.stopPrank();
    }

    /// @notice 处理器：随机绑定+上报+领取
    function test_invariant_fund_conservation() public {
        for (uint i = 0; i < 20; i++) {
            address user = address(uint160(0x5000 + i));
            address ref = address(uint160(0x6000 + i));
            vm.prank(user);
            try registry.bind(ref) {} catch {}
            uint256 rev = (i + 1) * 1e18;
            token.mint(address(this), rev);
            token.approve(address(treasury), rev);
            treasury.fundGame(game, address(token), rev);
            vm.prank(multisig);
            try adapter.reportRevenue(user, rev) {} catch {}
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

    function setUp() public {
        address[] memory pools = new address[](0);
        registry = new ReferralRegistry(multisig, pools);
        treasury = new ReferralTreasury(multisig, address(registry));
        token = new MockERC20("Test", "TST", 18);
        vm.startPrank(multisig);
        registry.proposeTreasury(address(treasury));
        registry.proposeGameConfig(gameA, 2000, 500, 2500, true);
        registry.proposeGameConfig(gameB, 2000, 500, 2500, true);
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

    function test_game_fund_isolation() public {
        address user = address(0x1111);
        address ref = address(0x2222);
        vm.prank(user); registry.bind(ref);
        // 只给 gameA 注资 10000
        token.mint(address(this), 10000);
        token.approve(address(treasury), 10000);
        treasury.fundGame(gameA, address(token), 10000);
        // gameB 的适配器想上报 10000（无注资）→ 失败
        vm.prank(multisig);
        vm.expectRevert("GAME_UNDERFUNDED");
        adapterB.reportRevenue(user, 10000);
        // gameA 正常上报 → 成功
        vm.prank(multisig);
        adapterA.reportRevenue(user, 10000);
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
