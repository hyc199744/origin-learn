# ANUBIS PLAY 统一返佣系统 · Phase 1

Solidity + Foundry 本地开发。**未部署主网，无真实资金。**

## 合约

| 文件 | 说明 |
|---|---|
| `src/ReferralRegistry.sol` | 邀请关系注册表：绑定/改绑/签名绑定/V3迁移/游戏配置/多签延迟 |
| `src/ReferralTreasury.sol` | 返佣金库：分币种记账/主动领取/资金守恒/每游戏隔离 |
| `src/SettlementAdapter.sol` | 结算适配器模板（每游戏一个） |
| `src/IERC20.sol` | ERC20 接口 |
| `src/MockERC20.sol` | 测试币 + 恶意重入币 |

## 测试

```bash
export PATH="$HOME/workspace/bin:$PATH"
forge test
```

33 个测试：单元/模糊/不变量/攻击模拟/权限。

## 审计状态

- 架构 v1.1 → DeepSeek 审出 8 缺陷 → 修订 v1.2
- GPT 审 v1.1 → 4 个必修问题 → 已修
- 代码 v1.2 → DeepSeek 复审：4 高危已修（H-1~H-4）
- 待：用户确认后进 Phase 2

## 安全红线

- 仅 dev/feature 分支，禁动 main
- 禁主网部署，禁真实资金，禁改线上合约
