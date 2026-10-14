# SimpleMultisig Gas DoS 修复报告

- 日期：2026-10-14
- 任务：GPT 第二项正式任务 —— 修复多签待处理交易 Gas DoS 风险
- 分支：`feature/referral-phase1`
- Commit：`9260c084`（GPT设计+修正：多签版本号懒作废，removeOwner O(1)有界，58测试全过）

## 一、攻击分析

**攻击路径**：单个被攻陷的 owner key 可无限调用 `submit`（每次自动确认一次），
制造大量 pending 交易。旧版 `removeOwner` 必须遍历全部 pending 交易逐个作废确认，
gas 随 pending 数量线性增长，攻击者可借此阻止自己被踢出多签。

## 二、Gas 实测对比（Foundry 真实测量）

| pending 交易数 | 修复前 removeOwner gas | 修复后 removeOwner gas |
|---|---|---|
| 32 | 186,075 | 81,599 |
| 128 | 528,891 | 81,599 |
| 512 | 1,900,155 | 81,599 |

修复后 gas **完全恒定**，与 pending 数量无关。2000 笔时的阻塞风险已消除。

## 三、修复方案：版本号懒作废

**GPT 设计**（真实 API 调用，gpt-4.1-mini，4,329 tokens，约 ¥0.034）：
引入版本号机制，`removeOwner` 不再遍历交易，而是递增被移除者的版本号，
使其历史确认在 `execute` 时因版本不匹配自动失效。

**总指挥修正了 GPT 方案的一个 bug**：
GPT 原方案在 `removeOwner` 时递增了**全体** owner 的版本号，
会导致所有合法 pending 交易也无法再被确认（误杀）。
修正版只递增**被移除者**的版本号，其余 owner 的 pending 确认不受影响。

**核心机制**：
- `ownerVersion[owner]`：每个 owner 独立版本号，初始 1
- `confirmVersion[txId][owner]`：确认时记录的版本号（0 = 未确认）
- `removeOwner`：`ownerVersion[o]++`，O(1)，不遍历任何交易
- `execute`：调用 `getValidConfirmations(txId)` 实时重算，只遍历 `owners` 数组（有界）
- `addOwner`：全新地址初始化为 1；曾被移除的保留递增后的版本（旧确认不复活）

## 四、Foundry 测试结果

```
Ran 12 test suites: 58 tests passed, 0 failed, 0 skipped
```

新增 7 个测试（`MultisigGasBench.t.sol`）：
- 3 个 gas 基准测试（32/128/512）
- 4 个攻击测试：
  1. 刷 512 笔 submit 后仍能成功移除作恶者
  2. 被移除者的历史确认全部失效（抽查 50 笔）
  3. 合法 pending 交易不受 removeOwner 影响（GPT 原 bug 的回归测试）
  4. 移除后重新加回，旧确认不复活、新确认正常工作

## 五、DeepSeek 独立复核结论

- **核心确认**：版本号懒作废机制正确，`removeOwner` 真正 O(1) 有界，
  被移除者历史确认确实失效，合法 pending 交易不受影响，
  加回后旧确认不复活，动态阈值 ceil(2n/3) 正确。**无新增高危漏洞**。
- **H-1（需文档说明）**：`removeOwner` 会降低 threshold，可能使原本差一票的
  pending 交易变得可执行。这是设计取舍，已在代码注释中显式说明。
- **M-1（中低）**：`submit` 可无限堆积造成存储占用，但不阻塞合法交易执行。
  建议未来加 `cancel` 机制，本轮不阻塞。

## 六、安全红线确认

- [x] 未修改 main
- [x] 未部署主网
- [x] 未操作真实钱包或资金
- [x] 仅 feature 分支

## 七、API 用量

| 调用 | 模型 | tokens | 费用 |
|---|---|---|---|
| GPT 方案设计 | gpt-4.1-mini | 4,329 | ~¥0.034 |
| DeepSeek 独立复核 | deepseek-chat | 5,366 | ~¥0.008 |
| **本轮小计** | | | **~¥0.042** |
| 月累计（OpenAI） | | | ~¥0.077 / ¥30 |
