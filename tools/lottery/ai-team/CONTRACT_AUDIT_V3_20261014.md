# LgnsLotteryV3 合约安全审计报告（终版）

- 审计日期：2026-10-14
- 审计员：DeepSeek（代码审核员）+ Muse（总指挥复核）
- 目标合约：0xb8A20cEFDDAE4b298A4086f3376F01Bdb2d300C7（Anubis 链）
- 源码可信度：**已验证**——浏览器未开源，但本地 `LgnsLotteryV3.sol` 编译字节码与链上 `eth_getCode` 返回**逐字节完全一致**（35,858 字符），可放心审计
- Token 消耗：本次 9,507 tokens（约 ¥0.0147）；累计两次审查 19,032 tokens（约 ¥0.0298）
- 只读审计，未修改代码、未部署、未操作钱包

---

## 总结论

**未发现可能危及真实奖池资金的高危漏洞。**

玩家资金（票款/奖池）的流出路径只有三条：`draw()` 派奖、`claimReferral()` 返佣提取、平台费转 owner。owner 没有直接提取玩家资金的后门：`rescueTokens` 明确排除票币，`withdrawLocked` 只能动锁定池（注资者的营销预算）。

---

## 一、已证实的问题

### 1. `setUnlockPerTicket` 无上限 —— 中
- 位置：`setUnlockPerTicket(uint256 v)`，无任何上限检查
- 攻击条件：owner（用户自己钱包）可将其设为极大值，一张票就抽干整个 `lockedJackpot` 进当期奖池
- 可能损失：锁定池营销预算被快速释放；释放进奖池后玩家可赢，owner 若同时操纵随机数可定向获利
- 备注：与已知的 RM 池 P0（0.3 相对票价过高）同类问题，注资前必须先调成合理值
- 修复：加上限（如 ≤ 票价的 10%）+ 时间锁

### 2. `setTicketPrice` 无幅度限制 —— 中
- 位置：`setTicketPrice(uint256 v)`，只检查 `v > 0`
- 攻击条件：owner 可瞬间把票价调到天价，冻结所有购票；或调到极低配合自刷
- 可能损失：游戏停摆；用户按旧价授权后可能买到意料之外的张数（合约按 `received/ticketPrice` 取整，多退少补逻辑在，前端会 revert，不会多扣）
- 修复：加单次调整幅度限制（如 ±20%）+ 时间锁

### 3. 邀请自刷可拿 3–4% 票款返佣 —— 中（设计权衡）
- 位置：`_bindReferrer` / `_creditReferral`
- 攻击条件：同一人用 A、B 两地址互绑，A 买票 B 拿直推 30% 平台费（=票款 3%）；三角循环 A→B→C→A 每笔拿 40% 平台费（=票款 4%）
- 可能损失：平台费收入被稀释，owner 实收减少；**奖池不受影响**
- 关键澄清（纠正 DeepSeek 原报告错误）：返佣**不可能**资不抵债。每笔返佣上限是当笔票款的 4%，累计恒小于当期总平台费（10%），`ownerFee = fee - refTotal` 恒 ≥ 0。原报告"refTotal > fee"的假设数学上不可能成立
- 修复：如在意可加返佣总额上限或循环绑定检测；当前可接受

### 4. `transferOwnership` 无两步确认 —— 低
- 位置：`transferOwnership(address o)`
- 风险：误转到错误地址合约即失控
- 修复：改用 Ownable2Step 模式

### 5. `setFeeBps` 上限 20% 偏高 —— 低
- 位置：`setFeeBps`，`require(v <= 2000)`
- 风险：20% 平台费偏高，但有上限不会无限
- 修复：建议降至 10%（1000）

---

## 二、设计风险（已知局限，非漏洞）

### 6. blockhash 随机源可被出块者影响 —— 中高
- 位置：`draw()` 用 `blockhash(drawBlock)`，drawBlock = 截止块 +50
- 说明：这是**所有** blockhash 彩票的共有局限，不是本合约独有。Anubis 链无 Chainlink VRF 可用。出块者理论上可通过选择性出块影响结果，但需恰好是目标区块的出块者、且奖池值得操纵，实际利用门槛高
- 纠正 DeepSeek 原报告夸大之处："完全控制、定向薅走整个奖池"过于绝对；50 块延迟 + 1 秒出块使操纵成本不低
- 缓解：保持现状可接受；未来可考虑 commit-reveal 或多区块哈希混合

### 7. Fisher-Yates 实现正确 —— 已排除
- DeepSeek 原报告称"存在偏差"，经复核：`j = i + keccak256(h,i) % (n-i)` 是标准部分 Fisher-Yates，`n << 2^256` 时模偏差可忽略，**不构成问题**

### 8. draw 过期重锁逻辑正常 —— 已排除
- DeepSeek 原报告称"超时卡死"，经复核：`h == bytes32(0)` 时会重新锁定未来区块，**不会卡死**，开奖 bot 每分钟调用即可

---

## 三、已确认安全项

| 检查项 | 结论 |
|---|---|
| 重入攻击 | ✅ 全外部调用函数有 `nonReentrant`；`claimReferral` 先清零后转账 |
| 玩家资金提取 | ✅ owner 无法直接提走票款/奖池 |
| 返佣资金来源 | ✅ 从平台费出，不碰奖池；数学上不可能资不抵债 |
| 授权风险 | ✅ 标准 `transferFrom` 模式，无额外授权滥用路径 |
| 前端 selector | ✅ 11 个函数 selector 与真实 ABI 逐个核对，全部一致 |
| 前端参数编码 | ✅ `buyTicketsWithRef(uint256,address)` 参数顺序正确 |
| 票币锁定 | ✅ 无 `setTicketToken`，票币地址永久不可更改 |

---

## 四、上一版前端报告误报修正

| 原报告问题 | 修正结论 |
|---|---|
| buy() 的 buyN 未做边界校验（中） | ❌ 误报。`setBuyN()` 已限 1–200 |
| sendTx 轮询无超时取消（低） | ❌ 误报。有 150 次 × 2 秒 = 5 分钟上限 |
| claimReferral 未等交易确认就 toast（低） | ❌ 误报。`sendTx` 内部等待回执确认后才返回 |
| buyTicketsWithRef 参数顺序待核查（高） | ✅ 已排除。与 ABI 一致 |
| approve selector 待核查（高） | ✅ 已排除。`095ea7b3` 正确 |
| 合约是否可升级待核查（高） | ✅ 已排除。非代理合约，不可升级 |

---

## 五、待用户决策

1. **RM 池 P0**（注资前必做）：`setUnlockPerTicket(20000000)`（0.02 RM/票），owner 钱包执行
2. 是否给 `setUnlockPerTicket` / `setTicketPrice` 加上限（建议加，需 owner 调合约）
3. 是否接受 3–4% 的邀请自刷折扣（建议接受，属正常营销成本）

---

*报告生成：Muse 总指挥 + DeepSeek 审核员 | 2026-10-14*
