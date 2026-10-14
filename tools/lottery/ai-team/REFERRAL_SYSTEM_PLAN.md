# ANUBIS PLAY 全平台统一邀请返佣系统 · 架构方案 v1.0

- 规划：Muse（总指挥）
- 安全审查：DeepSeek（待审）
- 状态：方案待用户审查，未进入开发
- 日期：2026-10-14
- 约束：所有代码只在 dev/feature 分支，不动 main，不部署合约，不碰真实资金

---

## 一、设计目标

用户通过邀请链接进入 → 主动点击加入并绑定钱包 → 邀请关系全平台永久有效。
之后参与任何已接入游戏，邀请人按该游戏规则拿返佣。

---

## 二、系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                    用户前端 (anubislottery.com)              │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐  │
│  │ 邀请落地页 │  │ 游戏页面  │  │      统一返佣中心        │  │
│  │ ?ref=绑定 │  │ 买票/游玩 │  │ 链接/人数/余额/领取/历史  │  │
│  └────┬─────┘  └────┬─────┘  └───────────┬────────────┘  │
└───────┼─────────────┼────────────────────┼───────────────┘
        │             │                    │
        ▼             ▼                    ▼
┌──────────────┐ ┌────────────────┐ ┌──────────────────┐
│ReferralRegistry│ │  各游戏合约     │ │ ReferralTreasury │
│  (邀请关系)    │ │  (5彩票池等)    │ │   (返佣金库)      │
│                │ │                │ │                  │
│ bind()         │ │  V3彩票:自带    │ │ recordCommission │
│ importFromV3() │ │  返佣,不接入    │ │ claim(token)     │
│ referrer()     │ │  新游戏:经适配器 │ │ per-token 记账   │
└───────┬────────┘ │  上报收入       │ └────────┬─────────┘
        │          └───────┬────────┘          │
        │                  │ 仅白名单适配器      │
        │                  ▼  可调用            │
        │          ┌────────────────┐          │
        └─────────►│  结算适配器     │◄─────────┘
                   │ (每游戏一个)   │
                   │ 查 Registry    │
                   │ 算 l1/l2 分成  │
                   └────────────────┘
```

---

## 三、合约设计

### 3.1 ReferralRegistry（邀请关系注册表）

**职责**：全平台唯一邀请关系真相源。

```solidity
// 核心存储
mapping(address => address) public referrer;      // 用户 => 一级邀请人（永久）
mapping(address => uint256) public boundAt;       // 绑定时间
mapping(address => bool) public hasBound;          // 是否已绑定

// 游戏注册（支持未来新游戏）
mapping(address => bool) public whitelistedGames; // 白名单游戏合约
mapping(address => GameConfig) public gameConfig; // 每游戏返佣规则

struct GameConfig {
    uint16 l1Bps;    // 一级返佣基点，默认 2000 (20%)
    uint16 l2Bps;    // 二级返佣基点，默认 500 (5%)
    uint16 maxTotalBps; // 两级合计上限，默认 2500
    bool active;
}

// V3 彩票池地址（5 个，用于迁移）
address[] public v3Pools;
```

**核心函数**：

| 函数 | 说明 |
|---|---|
| `bind(address ref)` | 用户主动调用，绑定邀请人。永久有效，不可更改 |
| `importFromV3(address pool, address user)` | 无许可迁移：链上读取 V3 池的 `referrer(user)`，写入注册表。仅当用户未绑定时可执行 |
| `getUpline(address user)` | 返回 (l1, l2)，供适配器查询 |
| `setGameConfig(...)` | 多签+延迟执行，设置某游戏返佣规则 |

**绑定规则**（链上强制）：
- `ref != address(0)`，`ref != msg.sender`（防自邀）
- `referrer[ref] != msg.sender`（防 A↔B 循环）
- `!hasBound[msg.sender]`（首次绑定后永久不可改）
- 必须由用户本人调用（`msg.sender` 即被绑定人），前端引导钱包签名，不允许仅凭访问链接自动绑定

### 3.2 ReferralTreasury（返佣金库）

**职责**：分币种记账，用户主动领取。

```solidity
// 分币种记账：用户 => 代币 => 待领取金额（原精度，不混用）
mapping(address => mapping(address => uint256)) public claimable;
// 已领取累计：用户 => 代币 => 总额
mapping(address => mapping(address => uint256)) public claimedTotal;
// 游戏已上报收入：游戏 => 代币 => 总额（用于核验）
mapping(address => mapping(address => uint256)) public gameRevenue;
// 白名单适配器
mapping(address => bool) public authorizedAdapters;
// 单用户单币种单日上限（防刷）
mapping(address => uint256) public dailyCapPerUser; // 按游戏设置
```

**核心函数**：

| 函数 | 说明 |
|---|---|
| `recordCommission(game, token, user, l1, l2, l1Amt, l2Amt)` | 仅白名单适配器可调。记账：`claimable[l1][token] += l1Amt` |
| `claim(address token)` | 用户主动领取。先清零后转账，`nonReentrant` |
| `authorizeAdapter(addr)` / `revokeAdapter(addr)` | 多签管理 |

**安全机制**：
- 拉取式（pull）：用户主动 `claim`，合约不主动推送
- 先清零后转账 + `nonReentrant`，防重入和重复领取
- 每笔 `recordCommission` 检查 `l1Amt + l2Amt <= gameRevenue` 比例上限
- 分币种独立记账，前端按代币精度展示

### 3.3 结算适配器（每游戏一个）

- 由游戏方部署，Treasury 白名单授权
- 游戏产生平台收入时，适配器查 Registry 得上下级，按该游戏 `GameConfig` 算分成，调 `recordCommission`
- 适配器本身不持有资金，只做计算和转发

---

## 四、V3 彩票兼容方案

### 现状（已审计确认）
- 5 个 V3 池各有独立 `referrer` 映射和 `referralRewards`，30%/10% 从平台费出
- 合约不可升级，**绝不修改线上合约**

### 兼容策略：双轨并行 + 自愿迁移

1. **历史权益不动**：V3 池内已产生的返佣（`referralRewards`）用户继续在原池 `claimReferral` 提取，新系统不覆盖、不重复计算
2. **V3 不接适配器**：V3 彩票的收入不上报统一金库，避免重复返佣
3. **自愿迁移**：用户在新系统点"同步 V3 邀请关系"，调用 `importFromV3(pool, user)`，链上读取原池 `referrer(user)` 写入注册表。全程链上可验证，无需信任管理员
4. **新彩票版本**（如未来 V4）直接走统一系统，不再自建返佣

### 迁移安全
- `importFromV3` 仅当 `!hasBound[user]` 时可执行，防止覆盖用户在新系统的主动绑定
- 读取的是 V3 合约的公开 view 函数，数据不可伪造

---

## 五、返佣中心页面设计

### 5.1 页面结构

```
┌─────────────────────────────────────┐
│  统一返佣中心                         │
├─────────────────────────────────────┤
│ [我的邀请链接]  https://...?ref=0x.. │
│ [复制链接] [二维码] [分享]             │
├─────────────────────────────────────┤
│  一级邀请: 12 人   二级邀请: 45 人     │
├─────────────────────────────────────┤
│  待领取 (分币种)                      │
│  LGNS: 125.5   [领取]               │
│  USDT: 8.2     [领取]               │
│  DAI:  0       [领取]               │
│  已领取累计: LGNS 340.2 / USDT 15.0   │
├─────────────────────────────────────┤
│  各游戏返佣记录                       │
│  ┌─────────────────────────────────┐ │
│  │ 游戏A | LGNS +12.5 | 2026-10-14 │ │
│  │  tx: 0xabc...  [浏览器查看]      │ │
│  └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│  历史结算记录 (链上事件)               │
└─────────────────────────────────────┘
```

### 5.2 数据来源（全部链上可验证）
- 邀请人数：Registry 事件 `ReferrerBound` 统计
- 返佣余额：Treasury `claimable(user, token)` 直读
- 返佣记录：Treasury `CommissionRecorded` 事件
- 交易哈希：事件所在交易
- V3 历史：在原池 `referralRewards` / `ReferralClaimed` 事件（单独 tab 展示，标注"旧系统"）

---

## 六、安全设计

| 风险 | 对策 |
|---|---|
| 多钱包自刷 | 绑定需真实游戏行为；单用户单日返佣上限；异常监测（短时间内大量新地址绑定同一上级触发告警） |
| 手续费收入造假 | 仅白名单适配器可上报；`gameRevenue` 累计核验；单笔/单日上限 |
| 返佣超发 | `l1Bps + l2Bps <= maxTotalBps` 链上强制；Treasury 只记账不印钱（钱由游戏合约转入） |
| 重入/重复领取 | pull 模式 + 先清零后转账 + nonReentrant |
| 管理员作恶 | 多签（2/3）+ 24 小时延迟执行 + 紧急暂停 |
| 精度混乱 | 分币种独立记账，合约存原精度，前端按 decimals 展示 |
| 循环邀请 | `bind` 时检查 `referrer[ref] != msg.sender` |

**资金隔离**：Treasury 只接收各游戏转入的平台费分成，不触碰用户本金和奖池。游戏合约转入 Treasury 的是"已实现、可分配"的平台收入。

---

## 七、合规评估（非法律意见，需咨询律师）

| 事项 | 评估 |
|---|---|
| 传销风险 | 两级返佣在中国法律下相对低风险，但"拉人头+计酬"模式仍需律师确认；建议用户协议明确返佣来自平台收入分成 |
| 年龄限制 | 18+，前端加年龄确认 |
| 地区访问 | 部分地区禁止在线彩票/返佣，建议 geo-block 高风险地区 |
| 代币支付税务 | 返佣收入可能涉及税务，用户自行申报；平台不做税务代扣 |
| 免责 | 返佣规则变更需提前公告；历史已产生权益不受追溯影响 |

---

## 八、分阶段开发方案

### Phase 1：合约开发（2–3 周）
- ReferralRegistry + ReferralTreasury + 适配器模板
- 本地 forge 测试（绑定/防自邀/防循环/领取/重入/多签）
- DeepSeek 安全审查 → 修问题 → 再审
- 交付物：合约源码 + 测试报告

### Phase 2：V3 迁移 + 返佣中心前端（2 周）
- `importFromV3` 迁移页面
- 统一返佣中心（链接/人数/余额/领取/历史）
- V3 旧权益 tab（只读展示）
- 交付物：前端页面（dev 分支）

### Phase 3：首个新游戏接入（1–2 周）
- 为新游戏写结算适配器
- 端到端测试（游戏收入 → 适配器 → 金库 → 用户领取）
- 交付物：适配器合约 + 集成测试

### Phase 4：监控与风控（1 周）
- 异常行为监测（链上事件扫描 + 告警）
- 多签管理后台（绑定/解绑适配器、调规则）
- 交付物：监控脚本 + 管理页面

### 任务分配（AI 团队）
| 阶段 | Muse（总指挥） | DeepSeek | GPT（待接入） | Claude（待接入） |
|---|---|---|---|---|
| P1 | 架构+合约开发 | 安全审查 | 合约开发协助 | — |
| P2 | 集成+审核 | 前端安全审查 | — | 前端 UI 开发 |
| P3 | 适配器+测试 | 审查 | 适配器开发 | — |
| P4 | 监控脚本 | 审查 | — | 管理后台 UI |

---

## 九、成本预估

| 项目 | 预估 |
|---|---|
| 合约开发（Muse） | 无 API 费用（自带） |
| DeepSeek 安全审查 | 3–4 轮 × 约 1 万 tokens ≈ ¥0.1 |
| GPT 开发协助（待接入） | 按实际用量，预估 ¥10–30/月 |
| 部署 gas（Anubis，DAI 支付） | 2 合约 + 初始化 ≈ 0.5–1 DAI |
| 多签钱包搭建 | 无费用（Safe 或自研多签） |
| 专业审计（建议上线前） | 外部审计机构报价另计 |

**说明**：以上不含律师合规咨询费用。

---

## 十、安全红线重申

- 所有代码只在 dev/feature 分支，不动 main
- 不部署合约到主网（除非用户明确授权）
- 不修改任何线上合约（V3 五池）
- 不操作真实资金、不代签交易
- 密钥永不进仓库/聊天

---

*待 DeepSeek 安全审查 → 用户审查方案 → 再进入开发*

---

## 十一、DeepSeek 安全审查修订（v1.1，2026-10-14）

审查消耗：8,431 tokens（约 ¥0.0128）。以下为采纳的修订：

### P0 修订（必须改）

**R1. `importFromV3` 加本人限制**
```solidity
function importFromV3(address pool, address user) external {
    require(msg.sender == user, "ONLY_SELF");  // 新增：只能本人迁移自己
    require(!hasBound[user], "ALREADY_BOUND");
    require(isV3Pool[pool], "NOT_V3_POOL");
    address ref = ILotteryV3(pool).referrer(user);
    require(ref != address(0) && ref != user, "BAD_REF");
    // 复用 bind 的防循环检查
    _bind(user, ref);
}
```

**R2. `recordCommission` 改由 Treasury 自己算分成**
```solidity
// 旧签名：recordCommission(game, token, user, l1, l2, l1Amt, l2Amt) ← 适配器可伪造 l1/l2
// 新签名：
function recordCommission(address game, address token, address user, uint256 revenue)
    external onlyAdapter {
    (address l1, address l2) = registry.getUpline(user);  // Treasury 自己查
    GameConfig memory cfg = registry.gameConfig(game);
    uint256 l1Amt = revenue * cfg.l1Bps / DEN;
    uint256 l2Amt = revenue * cfg.l2Bps / DEN;
    // 资金到账校验：游戏合约必须先转钱到 Treasury
    require(IERC20(token).balanceOf(address(this)) >= totalClaimable(token) + l1Amt + l2Amt,
        "INSUFFICIENT_FUNDS");
    ...
}
```
适配器只上报收入，不碰分成计算。

**R3. 绑定防抢跑 + 冷静期**
- 支持签名绑定：用户离线签名 `bind(ref)`，任何人代提交，杜绝 mempool 抢跑
- 绑定后 24 小时冷静期：未产生任何返佣前用户可改绑一次；过期或已产生返佣后永久锁定

**R4. 循环检测：向上遍历整条链**
```solidity
function _checkNoCycle(address user, address ref) internal view {
    address cur = ref;
    for (uint i = 0; i < 10; i++) {
        require(cur != user, "CYCLE");
        cur = referrer[cur];
        if (cur == address(0)) break;
    }
}
```

### P1 修订

**R5. Registry 标记 V3 池，禁止接入适配器**
- `mapping(address => bool) public isV3Pool`
- `authorizeAdapter` 时校验其游戏合约 `!isV3Pool[game]`
- Treasury `recordCommission` 加 `require(!registry.isV3Pool(game))`

**R6. `setGameConfig` 加硬上限**
```solidity
require(cfg.l1Bps + cfg.l2Bps <= cfg.maxTotalBps, "EXCEED_MAX");
require(cfg.maxTotalBps <= 10000, "MAX_TOO_HIGH");
```

**R7. 暂停不影响 `claim`**
- 紧急暂停只停 `bind` / `recordCommission` / `authorizeAdapter`
- 用户已记账的返佣永远可 `claim`，暂停也不能锁用户资金

**R8. `getUpline` 固定深度，不用 while 循环**
- 只查 l1、l2 两层，无循环，避免死循环 gas 耗尽

### P2 修订

**R9. 限额三维**：`mapping(address => mapping(address => mapping(uint256 => uint256))) dailyUsed`
（user → token → day → 已用额度）

**R10. 事件补全**：`AdapterAuthorized` / `AdapterRevoked` / `GameConfigUpdated`
/ `Paused` / `Unpaused` / `Claimed` / `ReferralMigrated`

**R11. 多签细则**：2/3 多签，key 地理隔离；延迟执行支持多签投票取消；
大额操作（>阈值）延迟 48 小时

**R12. 绑定频率限制**：同一 `ref` 每小时最多被绑定 50 次（链上硬约束）
+ 链下异常告警（短时间大量新地址绑定同一上级）

### DeepSeek 指出的"已确认合理"（保持不变）
pull 领取、先清零后转账+nonReentrant、分币种记账、本人调用绑定、
V3 不修改、资金隔离、多签框架、链上可验证、两级不做多级

### 未采纳项
- "游戏合约直接调 Treasury，取消适配器"：保留适配器层，但按 R2 改为纯上报角色。
  理由：未来游戏逻辑各异，适配器做归一化仍有价值，且白名单+多签已控制信任边界。
- "返佣从 ownerFee 出而非 fee 中预扣"：这是 V3 旧系统的事，新系统 Treasury 只记账，
  资金由游戏合约转入，不存在预扣问题。

*修订完成，待用户审查方案*

---

## 十二、GPT 审查修订（v1.2，2026-10-14）

GPT 结论：同意进入 Phase 1 本地合约开发，但 4 个问题必须先解决。以下为修订：

### G1. Treasury 真实收入核验（替代"仅余额验证"）

**问题**：原设计 `require(balance >= totalOwed)` 只防"记账超发"，但防不住"虚假收入上报"（适配器谎报收入金额）。

**修订**：
```solidity
// 1. 结算 ID 去重
mapping(bytes32 => bool) public processedSettlements;

// 2. 游戏-适配器严格 1:1 绑定（授权时写死）
mapping(address => address) public adapterGame; // adapter => game
function authorizeAdapter(address adapter, address game) external onlyMultisig {
    require(!registry.isV3Pool(game), "V3_BLOCKED");
    require(adapterGame[adapter] == address(0), "ALREADY_BOUND");
    authorizedAdapters[adapter] = true;
    adapterGame[adapter] = game;  // 终身绑定，不可更改
    emit AdapterAuthorized(adapter, game);
}

// 3. recordCommission 改签名，Treasury 自己算分成
function recordCommission(bytes32 settlementId, address token, address user, uint256 revenue)
    external {
    require(authorizedAdapters[msg.sender], "NOT_ADAPTER");
    address game = adapterGame[msg.sender];  // 严格绑定：适配器只能报自己的游戏
    require(!processedSettlements[settlementId], "DUPLICATE_SETTLEMENT");
    processedSettlements[settlementId] = true;
    (address l1, address l2) = registry.getUpline(user);
    (uint16 l1Bps, uint16 l2Bps) = registry.gameBps(game);
    uint256 l1Amt = revenue * l1Bps / DEN;
    uint256 l2Amt = revenue * l2Bps / DEN;
    // 4. 资金守恒：记账总额永不超过实际到账（游戏必须先转账到 Treasury）
    totalOwed[token] += l1Amt + l2Amt;
    require(IERC20(token).balanceOf(address(this)) >= totalOwed[token], "UNDERFUNDED");
    ...
}
```

**标准资金流**（强制顺序）：
1. 游戏合约产生平台费 → `token.transfer(treasury, feeAmount)`
2. 适配器调用 `treasury.recordCommission(settlementId, token, user, revenueAmount)`
3. Treasury 校验：白名单 ✓ / 1:1 绑定 ✓ / settlementId 未用过 ✓ / 余额覆盖记账 ✓

`settlementId` 生成规范：`keccak256(abi.encode(game, token, user, revenue, blockNumber, nonce))`，
由适配器生成，链上唯一性保证防重复上报。

### G2. 无环保证：深度赋值替代 10 层遍历

**问题**：10 层遍历可被 11 层深环绕过。

**修订**：每次绑定时赋值 `depth[user] = depth[ref] + 1`，要求 `depth[ref] + 1 <= MAX_DEPTH(32)`。

**无环证明**：每条邀请边都从低 depth 指向高 depth（严格递增），
有向环要求 depth 沿环严格递增回到起点——数学上不可能。故**任何深度的环都无法形成**，
无需遍历。这是比遍历更强的保证。

```solidity
uint256 public constant MAX_DEPTH = 32;
mapping(address => uint256) public depth; // 0 = 未绑定/根节点

function _bind(address user, address ref) internal {
    require(!hasBound[user], "ALREADY_BOUND");
    require(ref != address(0) && ref != user, "BAD_REF");
    uint256 rd = depth[ref];
    require(rd + 1 <= MAX_DEPTH, "TOO_DEEP");
    referrer[user] = ref;
    depth[user] = rd + 1;
    hasBound[user] = true;
    boundAt[user] = block.timestamp;
    emit ReferrerBound(user, ref, depth[user]);
}
```

**V3 遗留环**（如 A↔B 互绑）导入时：depth 赋值依然一致（后导入者 depth 更高），
结构环存在但**派奖硬限 2 层 + `l2 != user` 检查**，无法无限套取。见 G4 冲突规则。

### G3. 冷静期 + 行为锁定

**问题**：24 小时冷静期内改绑可能产生归属争议。

**修订**：
```solidity
mapping(address => bool) public hasEarned; // 是否产生过返佣行为
uint256 public constant COOLDOWN = 24 hours;

// Treasury 在每次 recordCommission 时回调
function notifyActivity(address user) external {
    require(msg.sender == address(treasury), "ONLY_TREASURY");
    hasEarned[user] = true;
}

function rebind(address newRef) external {
    require(hasBound[msg.sender], "NOT_BOUND");
    require(block.timestamp <= boundAt[msg.sender] + COOLDOWN, "COOLDOWN_OVER");
    require(!hasEarned[msg.sender], "ALREADY_ACTIVE"); // ← 关键：有返佣行为后永久锁定
    // 通过同样的 _bind 检查（含无环、深度）
    ...
    emit ReferrerRebound(msg.sender, oldRef, newRef);
}
```

**规则**：冷静期内**且**未产生任何返佣行为 → 可改绑一次；
一旦产生过返佣（作为被邀请人消费），**永久锁定**，杜绝归属争议。

### G4. V3 迁移冲突确定性规则

**问题**：五个池邀请人不一致时无确定性规则；自动覆盖风险。

**修订**（`importFromV3(pool, user)`）：
```solidity
function importFromV3(address pool, address user) external {
    require(msg.sender == user, "ONLY_SELF");       // 规则1：只能本人迁移
    require(!hasBound[user], "ALREADY_BOUND");       // 规则2：已有绑定不覆盖
    require(isV3Pool[pool], "NOT_V3_POOL");
    // 规则3：读取全部五个池的 referrer，作为历史证据上链
    address[5] memory refs;
    for (uint i = 0; i < 5; i++) refs[i] = ILotteryV3(v3Pools[i]).referrer(user);
    address chosen = ILotteryV3(pool).referrer(user);
    require(chosen != address(0) && chosen != user, "BAD_REF"); // 规则4：零地址/自邀跳过
    _bind(user, chosen);  // 复用无环深度检查；若 V3 环导致深度超限则 revert
    emit MigrationRecord(user, pool, chosen, refs);  // 规则5：全部证据上链
}
```

**冲突规则表**：

| 情况 | 处理 | 证据 |
|---|---|---|
| 用户已在新系统绑定 | 跳过，保留现有 | `MigrationSkipped(user, "ALREADY_BOUND")` |
| 五个池邀请人不一致 | 用户自选其一（`pool` 参数），其余四个上链存证 | `MigrationRecord` 含全部 5 个 |
| V3 referrer 为零地址/自己 | 跳过不绑定 | `MigrationSkipped(user, "BAD_REF")` |
| V3 存在 A↔B 互绑环 | 按导入顺序赋 depth，派奖层 blocked | `MigrationRecord` 标注 `cyclic=true` |
| 迁移后 V3 原池 | 继续有效（双轨），新系统不重复计算 | 文档明确 |

**原则**：永不自动覆盖已有关系；所有冲突上链存证；用户自选。

### G5. 默认费率确认

- 一级 20%、二级 5%，基于各游戏**真实可分配**平台手续费
- 每游戏可独立配置，`l1Bps + l2Bps <= maxTotalBps <= 10000` 链上强制
- V3 五池保持 30%/10% 不变（双轨并行）

---

## 十三、法律合规风险评估（非法律意见，需咨询持牌律师）

> **前置声明**：两级结构**不等于**自动合法。以下为风险提示，不是法律意见。

| 风险项 | 评估 | 缓解 |
|---|---|---|
| 中国传销认定 | 传销三要素：入门费、拉人头、团队计酬。本系统**无入门费**、返佣来自**真实游戏消费**的平台收入分成，风险低于典型资金盘，**但"拉人头+计酬"形式仍可能被个案认定**，需律师逐案确认 | 用户协议明确返佣来源；不承诺收益率；不设"团队业绩"门槛 |
| 非法经营（彩票） | 彩票发行在中国需特许。ANUBIS PLAY 是链上游戏平台，**可能被认定为变相彩票** |  geo-block 中国大陆 IP；用户协议明确 |
| 年龄限制 | 必须 18+ | 前端强制年龄确认，链上无法验，靠前端+协议 |
| 地区访问 | 部分司法区禁止在线博彩/返佣推广 | 高风险地区 geo-block；名单由法务定 |
| 证券化风险 | 若返佣被宣传为"固定收益/理财"，可能触证券法 | **严禁**任何固定收益宣传；返佣=收入分成，非保本 |
| 税务 | 用户返佣收入自行申报 | 协议明确，不代扣 |
| 广告法 | "稳赚""必中"等用语违法 | 文案审查清单 |

**上线前必须**：持牌律师出具书面合规意见；用户协议+风险揭示由律师审定。

---

*方案 v1.2 修订完成，审查状态：GPT 通过（附条件）→ 进入 Phase 1 本地开发*

---

## 十四、Phase 1 开发完成（2026-10-14）

### 交付物
- 分支：`feature/referral-phase1`（从 main 建，代码在 `tools/lottery/referral-system/`）
- 合约：ReferralRegistry.sol / ReferralTreasury.sol / SettlementAdapter.sol / IERC20.sol
- 测试：33 个全过（单元/模糊/不变量/攻击模拟/权限）
- 未部署主网，无真实资金

### DeepSeek 代码复审（v1.2）
发现 4 高危，**已全部修复**：
- H-1 资金守恒绕过 → 修：每游戏 `gameFunded`/`gameRecorded` 隔离记账，妥协适配器只能动自己游戏的钱
- H-2 签名重放 → 修：nonce + deadline 上限 1h + user 非零检查
- H-3 V3 迁移环 → 修：`cyclic==true` 直接跳过不写入
- H-4 rebind 无限循环 → 修：终身限 1 次 + 不重置计时 + 频率限制
另修 M-2~M-7（多签/treasury 改延迟执行、opId 用 nonce、getUpline 防自环等）

### 审查状态
- 架构 v1.1 → DeepSeek（8 缺陷）→ v1.2
- GPT（4 必修）→ v1.2 → 代码
- 代码 v1.2 → DeepSeek 复审（4 高危已修）
- **当前状态：待用户确认，进 Phase 2**

### Token 消耗
- 方案审查：8,431（¥0.0128）
- 代码审计：9,823（¥0.0152）
- 合计：18,254 tokens（约 ¥0.028）
