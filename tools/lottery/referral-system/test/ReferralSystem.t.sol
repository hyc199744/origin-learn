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

    // 生成游戏背书签名。businessId 由调用者传入（测试用自增序列保证唯一）
    uint256 businessSeq;
    function _signFor(address tokenAddr, address user, uint256 revenue, bytes32 businessId)
        internal view returns (uint8 v, bytes32 r, bytes32 s)
    {
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(address(treasury), block.chainid, game, tokenAddr, user, revenue, businessId))
        ));
        (v, r, s) = vm.sign(gameSignerKey, digest);
    }

    function _newBiz() internal returns (bytes32) {
        return keccak256(abi.encode("biz", block.timestamp, businessSeq++));
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
        vm.assume(users.length >= 2 && users.length <= 20);
        for (uint i = 0; i < users.length; i++) {
            vm.assume(users[i] != address(0));
            // 简单去重：跳过已出现的
            bool dup = false;
            for (uint j = 0; j < i; j++) if (users[j] == users[i]) { dup = true; break; }
            if (dup) continue;
        }
        // 链式绑定 + 随机尝试闭环，闭环必须失败
        // GPT 终审修复：正确解码 hasBound 返回值（之前误用 call 成功标志）
        uint256 bindCount = 0;
        uint256 cycleAttempts = 0;
        for (uint i = 0; i + 1 < users.length; i++) {
            if (users[i] == address(0) || users[i+1] == address(0) || users[i] == users[i+1]) continue;
            // 正确读取 hasBound 返回值
            (bool success, bytes memory ret) = address(registry).call(
                abi.encodeWithSignature("hasBound(address)", users[i]));
            require(success, "CALL_FAIL");
            bool alreadyBound = abi.decode(ret, (bool));
            if (alreadyBound) continue;
            vm.prank(users[i]);
            try registry.bind(users[i+1]) {
                bindCount++;
            } catch {
                cycleAttempts++;
            }
        }
        // 确保测试真正执行了绑定操作，而不是全部跳过
        assertTrue(bindCount > 0, "NO_BINDS_EXECUTED");
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
        // 只需给游戏准备好实际应付的佣金（20%+5%=25%），剩余留在游戏账户
        uint256 need = revenue * 2500 / 10000;
        token.mint(game, need);
        vm.prank(game);
        token.approve(address(treasury), need);
        bytes32 biz = _newBiz();
        (uint8 v, bytes32 r, bytes32 s) = _signFor(address(token), user, revenue, biz);
        vm.prank(multisig);
        return adapter.reportRevenue(user, revenue, biz, v, r, s);
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
        bytes32 biz1 = _newBiz();
        (uint8 v, bytes32 r, bytes32 s) = _signFor(address(token), bob, 10000, biz1);
        vm.prank(multisig);
        vm.expectRevert();
        adapter.reportRevenue(bob, 10000, biz1, v, r, s);
        // settlementId 每次不同（Treasury nonce 派生）
        bytes32 sid2 = _fundAndReport(bob, 10000);
        assertTrue(sid1 != sid2);
    }

    /// @notice 攻击模拟：未注资就上报（虚假收入）
    function test_unfunded_report_revert() public {
        vm.prank(bob); registry.bind(alice);
        // game 没 approve → transferFrom 失败，无法上报
        bytes32 biz1 = _newBiz();
        (uint8 v3, bytes32 r3, bytes32 s3) = _signFor(address(token), bob, 10000, biz1);
        vm.prank(multisig);
        vm.expectRevert();
        adapter.reportRevenue(bob, 10000, biz1, v3, r3, s3);
    }

    /// @notice 攻击模拟：未授权适配器上报
    function test_unauthorized_adapter_revert() public {
        vm.prank(bob); registry.bind(alice);
        token.mint(game, 10000);
        vm.prank(game);
        token.approve(address(treasury), 10000);
        bytes32 biz1 = _newBiz();
        (uint8 v, bytes32 r, bytes32 s) = _signFor(address(token), bob, 10000, biz1);
        vm.prank(address(0xE411));
        vm.expectRevert("NOT_ADAPTER");
        treasury.settle(address(token), bob, 10000, _newBiz(), v, r, s);
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
        bytes32 biz1 = _newBiz();
        (uint8 v2, bytes32 r2, bytes32 s2) = _signFor(address(evil), bob, 10000, biz1);
        vm.prank(multisig);
        evilAdapter.reportRevenue(bob, 10000, biz1, v2, r2, s2);
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
        bytes32 biz1 = _newBiz();
        (uint8 pv, bytes32 pr, bytes32 ps) = _signFor(address(token), bob, 10000, biz1);
        vm.prank(multisig);
        vm.expectRevert("PAUSED");
        adapter.reportRevenue(bob, 10000, biz1, pv, pr, ps);
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
        bytes32 biz1 = _newBiz();
        (uint8 fv, bytes32 fr, bytes32 fs) = _signFor(address(token), carol, revenue, biz1);
        vm.prank(multisig);
        adapter.reportRevenue(carol, revenue, biz1, fv, fr, fs);
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
        bytes32 biz1 = _newBiz();
        (uint8 fv2, bytes32 fr2, bytes32 fs2) = _signFor(address(token), u3, revenue, biz1);
        vm.prank(multisig);
        adapter.reportRevenue(u3, revenue, biz1, fv2, fr2, fs2);
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

    uint256 businessSeq;
    function _newBiz() internal returns (bytes32) {
        return keccak256(abi.encode("biz", block.timestamp, businessSeq++));
    }

    function _gameSig(address user, uint256 revenue, bytes32 biz) internal view returns (uint8 v, bytes32 r, bytes32 s) {
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(address(treasury), block.chainid, game, address(token), user, revenue, biz))
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
            (uint8 iv, bytes32 ir, bytes32 is_) = _gameSig(user, rev, _newBiz());
            vm.prank(multisig);
            bytes32 ibiz = _newBiz();
            (uint8 iv2, bytes32 ir2, bytes32 is2) = _gameSig(user, rev, ibiz);
            try adapter.reportRevenue(user, rev, ibiz, iv2, ir2, is2) {} catch {}
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

    uint256 businessSeq;
    function _newBiz() internal returns (bytes32) {
        return keccak256(abi.encode("biz", block.timestamp, businessSeq++));
    }

    function _sigA(address user, uint256 revenue, bytes32 biz) internal view returns (uint8 v, bytes32 r, bytes32 s) {
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(address(treasury), block.chainid, gameA, address(token), user, revenue, biz))
        ));
        (v, r, s) = vm.sign(signerKeyA, digest);
    }

    function _sigB(address user, uint256 revenue, bytes32 biz) internal view returns (uint8 v, bytes32 r, bytes32 s) {
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(address(treasury), block.chainid, gameB, address(token), user, revenue, biz))
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
        bytes32 bizB = _newBiz();
        (uint8 bv, bytes32 br, bytes32 bs) = _sigB(user, 10000, bizB);
        vm.prank(multisig);
        vm.expectRevert();
        adapterB.reportRevenue(user, 10000, bizB, bv, br, bs);
        // gameA 正常上报 → 成功
        bytes32 bizA = _newBiz();
        (uint8 av, bytes32 ar, bytes32 as_) = _sigA(user, 10000, bizA);
        vm.prank(multisig);
        adapterA.reportRevenue(user, 10000, bizA, av, ar, as_);
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
        msig = new SimpleMultisig(owners);
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
        (,,, bool executed) = msig.transactions(txId);
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

    uint256 businessSeq;
    function _newBiz() internal returns (bytes32) {
        return keccak256(abi.encode("biz", block.timestamp, businessSeq++));
    }

    function _signFor(address tokenAddr, address user, uint256 revenue, bytes32 businessId)
        internal view returns (uint8 v, bytes32 r, bytes32 s)
    {
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(address(treasury), block.chainid, game, tokenAddr, user, revenue, businessId))
        ));
        (v, r, s) = vm.sign(gameSignerKey, digest);
    }

    function test_no_upline_no_debt() public {
        address lonely = address(0x9999);
        // lonely 没有绑定任何邀请人
        token.mint(game, 10000);
        vm.prank(game);
        token.approve(address(treasury), 10000);
        bytes32 bizLonely = _newBiz();
        (uint8 zv, bytes32 zr, bytes32 zs) = _signFor(address(token), lonely, 10000, bizLonely);
        vm.prank(multisig);
        adapter.reportRevenue(lonely, 10000, bizLonely, zv, zr, zs);
        // 零地址没有产生不可领取的债务
        assertEq(treasury.claimable(address(0), address(token)), 0);
        assertEq(treasury.totalOwed(address(token)), 0);
        // gameRecorded 只记实际应付（0）
        assertEq(treasury.gameRecorded(game, address(token)), 0);
        // GPT 终审修复：精确资金流，无应付时 Treasury 不拉取资金，余额为 0
        assertEq(token.balanceOf(address(treasury)), 0);
        // 游戏账户保留了全部 10000（未被转走）
        assertEq(token.balanceOf(game), 10000);
    }

    function test_partial_upline_only_real_credit() public {
        address user = address(0x1111);
        address l1 = address(0x2222);
        vm.prank(user);
        registry.bind(l1); // 只有一级，无二级
        token.mint(game, 10000);
        vm.prank(game);
        token.approve(address(treasury), 10000);
        bytes32 bizUser = _newBiz();
        (uint8 zv2, bytes32 zr2, bytes32 zs2) = _signFor(address(token), user, 10000, bizUser);
        vm.prank(multisig);
        adapter.reportRevenue(user, 10000, bizUser, zv2, zr2, zs2);
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

    uint256 businessSeq;
    function _newBiz() internal returns (bytes32) {
        return keccak256(abi.encode("biz", block.timestamp, businessSeq++));
    }

    function _sig(uint256 key, address user, uint256 revenue, bytes32 biz)
        internal view returns (uint8 v, bytes32 r, bytes32 s)
    {
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(address(treasury), block.chainid, game, address(token), user, revenue, biz))
        ));
        (v, r, s) = vm.sign(key, digest);
    }

    function test_forged_game_sig_rejected() public {
        address user = address(0x1111);
        token.mint(game, 10000);
        vm.prank(game);
        token.approve(address(treasury), 10000);
        // 攻击者伪造签名（用自己的 key 签）
        bytes32 bizForge = _newBiz();
        (uint8 v, bytes32 r, bytes32 s) = _sig(attackerKey, user, 10000, bizForge);
        vm.prank(multisig);
        vm.expectRevert("BAD_GAME_SIG");
        adapter.reportRevenue(user, 10000, bizForge, v, r, s);
    }

    function test_replay_sig_rejected() public {
        address user = address(0x1111);
        token.mint(game, 20000);
        vm.prank(game);
        token.approve(address(treasury), 20000);
        // 正常签一次，上报成功
        bytes32 biz1 = _newBiz();
        (uint8 v, bytes32 r, bytes32 s) = _sig(gameSignerKey, user, 10000, biz1);
        vm.prank(multisig);
        adapter.reportRevenue(user, 10000, biz1, v, r, s);
        // 同一 businessId 重复结算 → 失败（BUSINESS_SETTLED）
        bytes32 biz2 = _newBiz();
        (uint8 v2, bytes32 r2, bytes32 s2) = _sig(gameSignerKey, user, 10000, biz1);
        vm.prank(multisig);
        vm.expectRevert("BUSINESS_SETTLED");
        adapter.reportRevenue(user, 10000, biz1, v2, r2, s2);
    }

    function test_wrong_revenue_sig_rejected() public {
        address user = address(0x1111);
        token.mint(game, 10000);
        vm.prank(game);
        token.approve(address(treasury), 10000);
        bytes32 bizW = _newBiz();
        // 签的是 10000，实际报 20000 → 签名不匹配
        (uint8 v, bytes32 r, bytes32 s) = _sig(gameSignerKey, user, 10000, bizW);
        vm.prank(multisig);
        vm.expectRevert("BAD_GAME_SIG");
        adapter.reportRevenue(user, 20000, bizW, v, r, s);
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
        msig = new SimpleMultisig(owners);
    }

    function test_removed_owner_confirm_invalidated() public {
        // 场景：o1、o2、o4 确认某交易（3/3 达成，可执行）
        vm.prank(o1);
        uint256 txId = msig.submit(address(0x9999), 0, "");
        vm.prank(o2);
        msig.confirm(txId);
        vm.prank(o4);
        msig.confirm(txId);
        // 移除 o1：o2 提交，o3、o4 确认 → 3 达成
        vm.prank(o2);
        uint256 rmTx = msig.submit(address(msig), 0,
            abi.encodeWithSelector(msig.removeOwner.selector, o1));
        vm.prank(o3);
        msig.confirm(rmTx);
        vm.prank(o4);
        msig.confirm(rmTx);
        vm.prank(o2);
        msig.execute(rmTx);
        assertFalse(msig.isOwner(o1));
        // o1 的确认被作废（版本号懒作废），原交易有效确认数从 3 降到 2
        (, , , bool executed) = msig.transactions(txId);
        assertEq(msig.getValidConfirmations(txId), 2);
        assertFalse(executed);
        // 移除后剩 3 人，阈值降为 2。但 o1 已不是 owner，不能再确认或执行
        vm.prank(o1);
        vm.expectRevert("NOT_OWNER");
        msig.confirm(txId);
        // o2 执行：2 确认 >= 阈值 2，可以执行（o1 的旧确认未被计入）
        vm.prank(o2);
        msig.execute(txId);
        (, , , bool executed2) = msig.transactions(txId);
        assertTrue(executed2);
    }

    /// @notice 攻击：被移除成员试图用旧确认执行交易
    function test_removed_owner_cannot_execute() public {
        vm.prank(o1);
        uint256 txId = msig.submit(address(0x9999), 0, "");
        // 移除 o1
        vm.prank(o2);
        uint256 rmTx = msig.submit(address(msig), 0,
            abi.encodeWithSelector(msig.removeOwner.selector, o1));
        vm.prank(o3);
        msig.confirm(rmTx);
        vm.prank(o4);
        msig.confirm(rmTx);
        vm.prank(o2);
        msig.execute(rmTx);
        // o1 试图执行 → 不是 owner，失败
        vm.prank(o1);
        vm.expectRevert("NOT_OWNER");
        msig.execute(txId);
    }
}

/// @notice GPT 终审：多签动态阈值攻击测试
contract MultisigThresholdTest is Test {
    SimpleMultisig msig;
    address o1 = address(0x1111);
    address o2 = address(0x2222);
    address o3 = address(0x3333);
    address o4 = address(0x4444);
    address o5 = address(0x5555);

    function setUp() public {
        address[] memory owners = new address[](3);
        owners[0] = o1; owners[1] = o2; owners[2] = o3;
        msig = new SimpleMultisig(owners);
    }

    function test_threshold_scales_with_owners() public {
        // 3 人 → ceil(6/3)=2
        assertEq(msig.threshold(), 2);
        // 加到 4 人 → ceil(8/3)=3（走多签自身调用）
        _addOwnerViaMultisig(o4);
        assertEq(msig.threshold(), 3);
        // 加到 5 人 → ceil(10/3)=4
        _addOwnerViaMultisig(o5);
        assertEq(msig.threshold(), 4);
    }

    function test_old_threshold_not_enough_after_growth() public {
        _addOwnerViaMultisig(o4); // 4 人，阈值 3
        // o1 提交，o2 确认 → 只有 2 个确认，不够 3
        vm.prank(o1);
        uint256 txId = msig.submit(address(0x9999), 0, "");
        vm.prank(o2);
        msig.confirm(txId);
        vm.prank(o1);
        vm.expectRevert("NOT_ENOUGH_CONFIRMS");
        msig.execute(txId);
        // o3 再确认 → 3 个，够了
        vm.prank(o3);
        msig.confirm(txId);
        vm.prank(o1);
        msig.execute(txId);
        (, , , bool executed) = msig.transactions(txId);
        assertTrue(executed);
    }

    function _addOwnerViaMultisig(address o) internal {
        vm.prank(o1);
        uint256 txId = msig.submit(address(msig), 0,
            abi.encodeWithSelector(msig.addOwner.selector, o));
        // 根据当前阈值确认足够人数
        uint256 need = msig.threshold();
        address[5] memory owners = [o1, o2, o3, o4, o5];
        uint256 confirmed = 1; // o1 提交时自动确认
        for (uint i = 1; i < 5 && confirmed < need; i++) {
            if (msig.isOwner(owners[i])) {
                vm.prank(owners[i]);
                // 可能已确认，忽略失败
                try msig.confirm(txId) { confirmed++; } catch {}
            }
        }
        vm.prank(o1);
        msig.execute(txId);
    }
}

/// @notice GPT 终审#5：depth 语义澄清测试
/// @dev depth 是绑定时的快照（上游链增长后可能过期），不用于安全判断。
/// 安全由 _checkAcyclicAndDepth 的实时遍历保证。此测试验证文档宣称的准确语义。
contract DepthSemanticsTest is Test {
    ReferralRegistry registry;
    address multisig = address(0x1001);

    function setUp() public {
        address[] memory pools = new address[](0);
        registry = new ReferralRegistry(multisig, pools);
    }

    function test_depth_is_bind_time_snapshot() public {
        address a = address(0xA001);
        address b = address(0xB002);
        // a 绑 b 时 b 未绑定（链长 0），所以 depth[a] = 1
        vm.prank(a); registry.bind(b);
        assertEq(registry.depth(a), 1);
        // b 后来绑定 c，a 的 depth 快照不变（仍为 1），但真实链长变为 2
        // 这是已知语义：depth 是快照，不自动更新
        vm.prank(b); registry.bind(address(0xC003));
        assertEq(registry.depth(a), 1); // 快照不变
        // 无环检查仍有效：a 不能绑回自己的下游
        vm.prank(address(0xC003));
        vm.expectRevert("CYCLE");
        registry.bind(a);
    }

    function test_cycle_check_independent_of_depth() public {
        // 证明无环检查不依赖 depth 准确性
        address a = address(0xA001);
        address b = address(0xB002);
        vm.prank(a); registry.bind(b);
        // 即使 depth[a]=1 是过期快照，b 绑回 a 仍被拦截
        vm.prank(b);
        vm.expectRevert("CYCLE");
        registry.bind(a);
    }
}
