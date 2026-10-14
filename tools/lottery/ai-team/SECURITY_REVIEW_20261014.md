# Anubis 彩票前端安全审查报告

- 审查日期：2026-10-14
- 审查员：DeepSeek（代码审核员，首次实战）
- 审查对象：hyc199744/origin-learn `tools/lottery/`（app1.js / app2.js / index.html）
- 审查方式：只读代码分析，未修改文件、未部署、未操作钱包
- Token 消耗：9,525 tokens（prompt 3,888 / completion 5,637），估算费用 ¥0.0152

---

## 第一部分：钱包连接、代币授权、购票、前端交互



### 1. `connect()` 未校验 `wallet_switchEthereumChain` 后的实际链 ID —— 中
**位置：** `connect()`
```js
if (parseInt(cid,16)!==CFG.chainId){
  try{ await req('wallet_switchEthereumChain',[{chainId:CFG.chainHex}]); }
  ...
}
// 之后直接继续，未重新读取 eth_chainId 确认切换成功
```
`wallet_switchEthereumChain` 返回成功不代表链已切换（部分钱包异步、部分返回 `null`）。切换后没有再次 `eth_chainId` 复核，后续 `sendTx` 可能把交易发到错误链上。虽然 `chainChanged` 事件会 `location.reload()`，但存在竞态窗口。

### 2. `sendTx()` 未校验 `to` 地址与 `data` 的绑定关系 —— 中
**位置：** `sendTx(to, d)`
```js
const tx = {from:myAddr, to, data:d};
```
`to` 和 `data` 完全由调用方传入，没有白名单校验。`buy()` 里 `CFG.CONTRACT` 是硬编码常量，风险可控；但 `approve()` 里 `CFG.token` 也是硬编码。**真正的问题是**：如果 `CFG` 对象被任何方式污染（例如通过 `POOLS` 切换逻辑、URL 参数、localStorage 注入），`to` 就可能被替换成攻击者地址，而 `data` 仍是合法的 `approve` calldata —— 用户会在不知情下授权给恶意合约。建议在 `sendTx` 内对 `to` 做白名单断言。

### 3. `approve()` 授权额度为 `TICKET*200n`，但 `TICKET` 来自链上读取 —— 中
**位置：** `approve()` + `loadStatic()`
```js
TICKET = decUint(await ethCall(CFG.CONTRACT,'0x'+SEL.ticketPrice));
...
await sendTx(CFG.token, '0x'+SEL.approve+encAddr(CFG.CONTRACT)+encUint(TICKET*200n));
```
- 授权额度依赖 `TICKET` 的实时值。若 `ticketPrice` 可被 owner 修改（彩票合约常见），用户授权时按旧价计算，涨价后可能不够用，跌价后则**超额授权**（授权额 > 实际需要）。
- 更关键：`TICKET*200n` 是**一次性大额授权**，虽然比 `MaxUint256` 好，但 200 张票的额度对普通用户仍是显著敞口。若 `CFG.CONTRACT` 存在任意 `transferFrom` 漏洞或被升级/替换，用户资金可被一次性抽走。
- 注释说"额度有限，比无限授权更稳妥"——这个说法**不准确**：200 张票的额度对多数用户而言等同于无限授权（用户不会买 200 张）。

### 4. `buy()` 的 `buyN` 未在 calldata 构造处做边界校验 —— 中
**位置：** `buy()`
```js
if(ref) await sendTx(CFG.CONTRACT, '0x'+SEL.buyTicketsWithRef+encUint(buyN)+encAddr(ref));
else await sendTx(CFG.CONTRACT, '0x'+SEL.buyTickets+encUint(buyN));
```
`buyN` 是全局变量，其赋值点未在给出的代码中。若 `buyN` 可被 UI 输入、URL 参数或 localStorage 影响，且没有 `>0`、上限、整数校验，用户可能构造出 `buyN=0`（浪费 gas）或超大值（触发合约 revert 或超额扣款）。`encUint` 只做编码，不做范围检查。

### 5. `getRef()` 的 `ref` 来源可被 localStorage 污染 —— 中
**位置：** `getRef()`
```js
const saved = localStorage.getItem('anubis_joined_ref');
if(saved && /^0x[0-9a-fA-F]{40}$/.test(saved)){
  if(myAddr && saved.toLowerCase()===myAddr.toLowerCase()) return null;
  return saved;
}
```
- `localStorage` 可被同源 XSS 或用户手动修改。虽然格式校验了 40 位 hex，但**没有校验该地址是否为有效邀请人**（合约层会拒绝，但前端会先发一笔必然 revert 的交易，浪费 gas）。
- 优先级：`localStorage` 优先于 URL `?ref=`。若用户先被 A 邀请（写入 localStorage），之后通过 B 的链接进入，仍会归因给 A —— 这是**归因劫持**风险，且用户无法通过 URL 覆盖。
- 自邀请检查只在前端做，注释也承认"合约层也会拒绝"，但前端仍会构造并发送这笔交易。

### 6. `sendTx()` 轮询等待回执无超时取消、无 `eth_getTransactionByHash` 校验 —— 低
**位置：** `sendTx()`
```js
for (let i=0;i<150;i++){
  await new Promise(r=>setTimeout(r,2000));
  const rc = await req('eth_getTransactionReceipt',[hash]);
  if (rc && rc.blockNumber && rc.blockNumber!=='0x0'){ ... }
}
```
- 150 次 × 2s = 5 分钟。期间若 RPC 返回错误（非 `null`），`req` 抛异常会直接跳出循环，用户看到的是原始错误而非"超时"。
- 未校验 `rc.transactionHash === hash`，理论上 RPC 可返回错误回执（恶意 RPC 场景）。
- 未处理 `eth_sendTransaction` 返回 `null`（用户拒绝）的情况——`hash` 为 `null` 时后续轮询会一直查 `null`。

### 7. `chainChanged` 直接 `location.reload()` —— 低
**位置：** `connect()`
```js
window.ethereum.on('chainChanged', ()=> location.reload());
```
粗暴 reload 会丢失用户当前输入（`buyN`、`ref` 等）。更重要的是：reload 后 `connect()` 不会自动重新执行，用户可能处于"已连接但未重新初始化"的状态，`myAddr` 为旧值或 `null`，此时点击购买可能用错误的 `from` 发交易。

### 8. `accountsChanged` 未重新校验链 ID —— 低
**位置：** `connect()`
```js
window.ethereum.on('accountsChanged', accs=>{
  myAddr = (accs&&accs[0])||null;
  ...
  refresh();
});
```
账户切换后没有重新 `eth_chainId`。若用户在钱包里同时切换了账户和网络，`chainKey`/`CFG` 仍是旧值，`sendTx` 可能发到错误链。

### 9. `sendTx()` 对 Anubis 强制 `type: '0x0'` 但未设置 `nonce`/`gas` —— 低
**位置：** `sendTx()`
```js
if (chainKey === 'anubis'){
  tx.type = '0x0';
  const gp = await req('eth_gasPrice',[]);
  tx.gasPrice = gp;
}
```
- 未设置 `gas`，依赖钱包估算。若合约 `buyTickets` 逻辑复杂（返佣、多池），估算可能不足导致 out-of-gas revert。
- 未设置 `nonce`，依赖钱包管理。在快速连续购买时可能出现 nonce 冲突。
- `gasPrice` 直接取 `eth_gasPrice`，未加缓冲，网络拥堵时可能长时间 pending。

### 10. `loadStatic()` 中 `FEE` 计算 `Number(FEE)/100` 精度问题 —— 低
**位置：** `loadStatic()`
```js
FEE = decUint(await ethCall(CFG.CONTRACT,'0x'+SEL.feeBps));
const pf = $('poolFormula'); if(pf){ pf.dataset.pct = Number(FEE)/100; ... }
```
`feeBps` 是基点（1/10000），`Number(FEE)/100` 得到的是百分比。若 `FEE` 是 `BigInt`，`Number()` 转换在极大值下会丢精度（此处 bps 通常 < 10000，风险低）。但 `dataset.pct` 直接写入 DOM，若 `FEE` 被合约 owner 设为异常值，UI 会显示错误比例，误导用户。

---

## 【待核查的风险】

### A. `SEL.buyTicketsWithRef` 的 calldata 编码顺序 —— 高（需合约源码）
**位置：** `buy()`
```js
'0x'+SEL.buyTicketsWithRef+encUint(buyN)+encAddr(ref)
```
需确认合约函数签名是 `buyTicketsWithRef(uint256,address)` 还是 `(address,uint256)`。若顺序反了，`encUint(buyN)` 会被当作地址解析，`encAddr(ref)` 被当作数量——**参数篡改空间**。必须对照 ABI 验证。

### B. `SEL.approve` 的 selector 是否对应标准 ERC20 `approve(address,uint256)` —— 高（需合约源码）
**位置：** `approve()`
```js
'0x'+SEL.approve+encAddr(CFG.CONTRACT)+encUint(TICKET*200n)
```
LGNS 是 9 位精度代币，需确认其 `approve` 是标准 ERC20 还是自定义（如 `approve(address,uint256,bytes)`）。若 selector 错误，交易会 revert 或调用到 fallback 函数。

### C. `CFG.CONTRACT` 是否可升级/可替换 —— 高（需合约源码）
**位置：** `CFG.CONTRACT`
```js
CONTRACT: '0xb8A20cEFDDAE4b298A4086f3376F01Bdb2d300C7', // 2026-10-11 V3 返佣版部署
```
若合约是代理模式（Proxy），owner 可升级逻辑，用户对 `approve` 的授权额度可能被新逻辑滥用。需确认是否 `immutable`。

### D. `buyTickets` 是否校验 `msg.value`/代币余额/授权额度 —— 中（需合约源码）
前端 `buy()` 不传 `value`，依赖合约 `transferFrom` 扣款。需确认合约是否：
- 校验 `allowance >= TICKET*buyN`
- 校验 `balanceOf(msg.sender) >= TICKET*buyN`
- 是否有重入保护（返佣逻辑常见重入点）

### E. `ref` 归因逻辑是否可被前端绕过 —— 中（需合约源码）
前端 `getRef()` 只做格式校验，合约层是否：
- 校验 `ref != msg.sender`
- 校验 `ref` 是有效用户（非零地址、非合约）
- 是否有归因时间窗口（如首次购买后不可改）

### F. `TICKET` 读取与 `buy()` 之间的价格变动 —— 中（需合约源码）
`loadStatic()` 读一次 `ticketPrice`，`buy()` 时不再读。若 owner 在两者之间改价，用户按旧价授权、按新价扣款，可能授权不足或超额扣款。需确认合约 `buyTickets` 是否用当前价还是传入价。

### G. `POOLS` 切换逻辑是否可被前端操纵 —— 中（需完整代码）
代码片段显示 `POOLS` 数组和 `chainKey`/`CFG` 全局变量，但切换函数未给出。若切换通过 URL 参数或 localStorage 控制，攻击者可诱导用户切换到恶意池合约。

### H. `ethCall` 的实现是否校验返回数据 —— 中（需完整代码）
`loadStatic()` 中 `decUint(await ethCall(...))` 直接解码。若 `ethCall` 不校验返回长度/selector，恶意 RPC 可返回伪造数据，导致 `TICKET`、`FEE`、`OWNER` 被污染。

### I. `req()` 的实现是否校验 `window.ethereum` 来源 —— 中（需完整代码）
若 `req` 直接调用 `window.ethereum.request`，在 iframe 或多钱包注入场景下可能被劫持。需确认是否有 `isMetaMask` 等校验。

### J. `deployBlock: 16182340` 与 `2026-10-11` 的时间矛盾 —— 低（需核实）
**位置：** `CFG.anubis.deployBlock`
```js
deployBlock: 16182340 // 2026-10-11 V3 部署块
```
Anubis 链 2026 年的部署块号不太可能是 1600 万（除非链已运行多年）。若 `deployBlock` 错误，历史事件扫描会遗漏或重复。需核实实际部署块。

### K. `native: {name:'DAI', symbol:'DAI', decimals:18}` 与 Anubis 原生币不符 —— 低（需核实）
**位置：** `CFG.anubis.native`
Anubis 链原生币通常不是 DAI。若 `wallet_addEthereumChain` 用此配置，用户钱包会显示错误的原生币符号，可能误导用户。需核实 Anubis 实际原生币。

---

## 总结

| 严重程度 | 数量 | 关键项 |
|---------|------|--------|
| 高 | 3 | calldata 编码顺序、approve selector、合约可升级性 |
| 中 | 8 | 链 ID 复核、sendTx 白名单、授权额度、buyN 校验、ref 归因、价格变动、POOLS 切换、ethCall 校验 |
| 低 | 5 | 轮询超时、chainChanged reload、accountsChanged、gas/nonce、FEE 精度 |

**最需要立即处理：**
1. 对照 ABI 验证 `SEL.buyTicketsWithRef` 和 `SEL.approve` 的 selector 与参数顺序（高）。
2. 在 `sendTx` 内对 `to` 做白名单断言（中）。
3. `approve` 改为按需授权（`TICKET*buyN`）而非固定 200 张（中）。
4. `connect` 在 `wallet_switchEthereumChain` 后重新读取 `eth_chainId` 确认（中）。
5. `getRef` 的 localStorage 优先级改为 URL 优先，或增加归因确认 UI（中）。

---

## 第二部分：开奖随机数、邀请返佣



## 【已证实的问题】

### 1. 开奖动画与链上结果完全脱钩，存在误导用户风险 —— 中
**位置：`drawVisual()`**
- 14 个球用 `Math.random()` 生成滚动数字和动画时长，与链上随机源（未来区块哈希）毫无关系。
- 真正的开奖结果在 `sendTxQuiet(...draw)` 之后才通过 `getLastWinners` 拉取，然后**直接覆盖**球面文字为 `prize1/2/3` 的首字。
- 用户看到的是"前端随机滚动 → 揭晓"，容易误以为前端/浏览器决定了结果。虽然合约层随机源是区块哈希，但前端没有任何文案或 UI 提示"结果由链上区块哈希决定"，属于**误导性 UI**。
- 更严重的是：`ridAfter <= ridBefore` 时只显示 `hashExpired`，但**没有回滚已展示的动画**，用户可能已经看到"中奖球"再被告知失败，体验与信任受损。

### 2. `drawVisual()` 任何人可触发，前端无任何抢跑/MEV 防护或提示 —— 中
**位置：`drawVisual()` 中 `await sendTxQuiet(CFG.CONTRACT,'0x'+SEL.draw)`**
- 前端直接调用 `draw`，没有检查调用者是否有利可图、没有延迟、没有 commit-reveal 提示。
- 若合约的随机源是"截止后未来区块哈希"，则**开奖交易本身所在区块的哈希**可能被矿工/验证者操纵（取决于合约取的是哪个区块）。前端对此零提示。
- 前端没有对 `draw` 的 gas 竞价做任何限制，用户可能被诱导支付高 gas 抢跑，反而成为 MEV 的受害者。

### 3. `getRef()` 优先级错误：localStorage 覆盖 URL 参数 —— 中
**位置：`getRef()`**
```js
const saved = localStorage.getItem('anubis_joined_ref');
if(saved && ...) return saved;   // 先读 localStorage
...
const r = new URLSearchParams(location.search).get('ref');  // 后读 URL
```
- **localStorage 优先于 URL**。一旦用户曾通过某邀请链接写入 `anubis_joined_ref`，之后即使访问 `?ref=新地址` 也不会生效。
- 攻击场景：恶意站点/脚本在用户浏览器写入 `anubis_joined_ref = 攻击者地址`，用户之后所有通过正常邀请链接进入的绑定都会被劫持到攻击者名下。虽然合约"首次购票时绑定"，但前端 `joinRef()` 会把这个被污染的值当作"已加入"。
- 更糟的是 `joinRef()` **只写 URL 参数，不校验是否已有 localStorage**，与 `getRef()` 的优先级逻辑不一致，行为不可预测。

### 4. `joinRef()` 无地址校验、无签名、无过期 —— 中
**位置：`joinRef()`**
```js
const r = new URLSearchParams(location.search).get('ref');
if(r && /^0x[0-9a-fA-F]{40}$/.test(r)){
  localStorage.setItem('anubis_joined_ref', r);
}
```
- 只做正则格式校验，**不校验该地址是否真实存在、是否是合约、是否是用户自己**（自邀检查在 `getRef()`/`pendingRef()` 里做，但 `joinRef()` 本身不做）。
- 任何人构造 `?ref=0x...` 链接即可让受害者 localStorage 被写入任意地址。若受害者之后首次购票，合约会按这个地址绑定上级。
- **前端防自邀完全不够**：`getRef()` 里 `saved.toLowerCase()===myAddr.toLowerCase()` 只在读取时判断，但 `joinRef()` 写入时不判断；且用户可清空 localStorage 后重新用自己地址的链接进入。合约层"拒绝自邀"是唯一可靠防线，前端这层只是 UX 过滤。

### 5. `claimReferral()` 无重入/重复领取的前端防护 —— 低（前端侧）
**位置：`claimReferral()`**
```js
async function claimReferral(){
  await sendTx(CFG.CONTRACT, '0x'+SEL.claimReferral);
  toast(t('claimOk'));
}
```
- 前端**没有禁用按钮、没有 pending 状态、没有 nonce 管理**。用户快速双击或脚本循环调用会发出多笔交易。
- 是否真的能重复领取取决于合约（见待核查），但前端至少应做 `disabled` + 等待 receipt 的防抖。当前实现把"防重复"完全推给合约，属于**前端侧缺失防护**。
- `toast(t('claimOk'))` 在 `sendTx` 返回后立即弹出，**未等待交易确认**，用户可能误以为已到账。

### 6. `copyRefLink()` 使用已废弃 API 且无失败反馈 —— 低
**位置：`copyRefLink()`**
- `document.execCommand('copy')` 已废弃，且 `catch(e){}` 静默吞掉异常。
- `navigator.clipboard.writeText` 的 `.catch(()=>{})` 也静默失败。
- 结果：复制失败时用户仍看到 `toast(t('copyOk'))`，可能把错误链接分享出去。虽非直接安全漏洞，但影响邀请体系可信度。

### 7. `refreshReferral()` 直接拼接 `myAddr` 到 URL，无编码 —— 低
**位置：`refreshReferral()`**
```js
link.value = location.origin + location.pathname + '?ref=' + myAddr;
```
- `myAddr` 来自钱包，通常是 `0x` 开头，风险低。但若 `myAddr` 被污染（如某些注入钱包返回异常字符串），会生成畸形链接。建议 `encodeURIComponent`。

---

## 【待核查的风险】（需合约源码/实测）

### A. `draw` 的随机源与开奖区块 —— 高（若合约设计不当）
- 需确认合约取的是**哪一区块**的哈希：是 `draw` 交易所在区块，还是"截止后第 N 个区块"。
- 若是前者，矿工/验证者可选择性打包或重排 `draw` 交易来影响结果，前端 `drawVisual()` 任何人可触发会放大此风险。
- 前端无任何提示，用户无法感知。

### B. `claimReferral` 是否可重入/重复领取 —— 高（若合约无防护）
- 需看合约是否用 `nonReentrant`、是否在转账前清零余额、是否用 pull-over-push。
- 前端 `claimReferral()` 无防抖，若合约有漏洞，前端会成为批量攻击的便利入口。

### C. 邀请绑定是否可被"换地址刷单" —— 高
- 合约"首次购票时绑定上下级"：需确认绑定后**是否可更改**、**是否校验上级地址有效性**、**是否限制同一地址只能被绑定一次**。
- 前端 `localStorage` 可被任意脚本写入，若合约不校验 `msg.sender` 与邀请关系，攻击者可用大量新地址 + 伪造 `?ref=` 刷返佣。
- 需确认 30%/10% 返佣是否从平台费出、是否会导致平台费被薅空。

### D. 自邀防护是否只在合约层 —— 中
- 前端 `getRef()`/`pendingRef()` 做了 `saved === myAddr` 判断，但 `joinRef()` 不做，且用户可清空 localStorage 绕过。
- 需确认合约是否在 `buy` 时校验 `ref != msg.sender`，以及是否校验 `ref != 0x0`、`ref` 是否为合约地址。

### E. `getLastWinners` 返回数据的解析 —— 中
**位置：`drawVisual()` 中 `decAddrArray`/`decUintArray`**
- 需确认 ABI 编码与合约返回一致，否则可能解析出错误中奖者，前端展示与链上实际不符。
- `offW`/`offA` 用 `Number(decUint(...))*2` 计算偏移，若数组长度大或编码非标准，可能越界。

### F. `sendTxQuiet` 与 `sendTx` 的差异 —— 中
- `drawVisual` 用 `sendTxQuiet`，`claimReferral` 用 `sendTx`。需确认 `sendTxQuiet` 是否吞掉 revert 原因，导致用户看不到失败原因（如"随机源未就绪"），只看到 `hashExpired` 这种模糊提示。

### G. `ridAfter <= ridBefore` 判断的可靠性 —— 中
- 用 `currentRound` 变化判断开奖是否成功，若合约在同一区块内多次开奖或 round 回绕，可能误判。
- 未检查 `draw` 交易本身的 receipt status，仅靠 round 变化推断，可能把"交易成功但 round 未变"误报为失败。

---

## 建议优先级

| 优先级 | 问题 | 动作 |
|---|---|---|
| P0 | A/B/C | 立即审合约随机源、claimReferral 重入、邀请绑定逻辑 |
| P1 | 1/2/3/4 | 前端加"结果由链上决定"提示；修正 getRef 优先级；joinRef 加自邀校验；draw 加防抖 |
| P2 | 5/6/7 | claimReferral 加 pending/disabled；copy 加失败反馈；URL 编码 |

**核心结论**：前端在开奖、邀请、返佣三处都**把安全责任完全推给合约**，自身只做 UX 过滤。若合约层任一环节有缺陷，前端这些"便利"实现（localStorage 可写、URL 可伪造、无防抖、无提示）会成为攻击面的放大器。