# Phase 1 合约验收报告（待用户验收）

- 日期：2026-10-14
- 分支：`feature/referral-phase1`
- 代码：`tools/lottery/referral-system/`
- 状态：**未部署主网，无真实资金**

## 一、GPT 审查 5 项问题修复状态

| # | 问题 | 修复 | 测试 | 状态 |
|---|---|---|---|---|
| 1 | depth 不能保证无环 | `_checkAcyclicAndDepth`：绑定时遍历上溯查环 + 重算真实链长，depth 恒等于链长 | test_cycle_rejected_two_node、test_deep_cycle_attack、test_rebind_to_downstream_rejected、fuzz | ✓ |
| 2 | operator 可换 ID 重复上报 | `settle()` 原子结算：同一笔交易 transferFrom 拉取资金；settlementId 由 Treasury nonce 派生 | test_settlement_id_unique_per_nonce、test_no_replay_without_funding、test_replay_requires_refunding | ✓ |
| 3 | 零地址累计不可领取债务 | 只给非零 l1/l2 记账，totalOwed 只加实际应付 | ZeroRefTest（2个） | ✓ |
| 4 | 重入测试不真实 | MaliciousERC20 transfer 回调重入 claim，验证无双花 | test_reentrancy_claim_real | ✓ |
| 5 | revoke 后可换游戏 | revoke 只停用不清除绑定；reauthorizeAdapter 只能绑回原游戏 | LifetimeBindTest（2个） | ✓ |

## 二、测试统计

- 总计：**46 通过，0 失败**
- 单元测试：绑定/改绑/签名/迁移/结算/领取/暂停/权限
- 模糊测试：分成比例、随机绑定无环
- 不变量测试：资金守恒 `totalOwed <= balance`
- 攻击模拟：循环攻击、重放攻击、重入攻击、未授权上报

## 三、独立审查记录

| 轮次 | 审查方 | 发现 | 状态 |
|---|---|---|---|
| 1 | DeepSeek（架构 v1.1） | 8 缺陷 | 已修 → v1.2 |
| 2 | GPT（架构 v1.1） | 4 必修 | 已修 → v1.2 |
| 3 | DeepSeek（代码 v1.2） | 4 高危 | 已修 |
| 4 | GPT（代码 v1.2） | 5 问题 | 已修 |
| 5 | DeepSeek（代码 v1.3） | depth 低估 + settle 无重入锁 | 已修 |
| 6 | DeepSeek（最终确认） | depth 重算方案 + settle 无死锁 | **通过** |
| 7 | GPT（第二轮） | 5 问题（depth/零地址/游戏签名/多签历史/回归测试） | 已修 |
| 8 | DeepSeek（第四轮） | 游戏签名+多签历史确认 | 通过（多签 gas 优化后） |

## 四、已知限制

1. 合约未部署，未经主网实战检验
2. 法律审查尚未安排（用户已要求列为前置）
3. 多签正式地址未录入
4. V3 五池 30%/10% 保持不变，双轨并行

## 五、第二轮 GPT 审查新增修复（2026-10-14）

1. **depth 重算**：`_checkAcyclicAndDepth` 每次重算真实链长，depth 恒等于链长
2. **游戏签名背书**：settle 必须携带 gameSigner 签名，覆盖 (treasury, chainid, game, token, user, revenue, nonce)
3. **多签历史确认**：removeOwner 作废旧确认；pendingTxIds 有界遍历防 gas DoS
4. **Safe 评估**：Anubis 无 Safe 官方部署前置合约，部署非官方地址引入信任风险 → 加固自研多签
5. **回归测试**：33 个 expectRevert，新增 GameSigAttackTest（3）+ MultisigHistoryTest（1）

## 六、待用户验收

- [ ] 代码审查通过
- [ ] 批准进入 Phase 2（前端演示已并行开发）
- [ ] 确认法律审查安排
- [ ] 确认多签正式地址录入时机
