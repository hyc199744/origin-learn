# ANUBIS PLAY · 统一返佣系统 Phase 2 前端演示

## 文件

| 文件 | 说明 |
|---|---|
| `index.html` | 单文件应用（37KB，零外部依赖），4 个视图 |
| `README.md` | 本说明 |

## 预览

直接用浏览器打开 `index.html` 即可（file:// 或任意静态服务器）。

4 个视图（顶部标签切换，URL hash 记忆）：
1. **01 邀请加入** — `?ref=0x…` 落地页：显示邀请人缩写地址、「加入邀请」按钮（只写 localStorage）、防自邀检查、「复制我的邀请链接」
2. **02 主动绑定** — 输入双方地址 → 预览一级(20%)/二级(5%)关系链 → 确认（本地模拟，不上链）
3. **03 五池关系** — 输入地址 → 经公共 RPC 只读查询 V3 五池 `referrer` → 跨池不一致时显示冲突警告（只读展示）
4. **04 返佣中心** — 演示数据：20%/5% 规则、一级12/二级34人、待领1.25/已领3.80 DAI（全部标注"演示数据"）

## 技术要点

- 纯静态，无后端；不引用 `window.ethereum`，不发起任何交易
- 链上只读：`https://rpc.anubispace.org`，`eth_call` 查 `referrer(address)`（selector `0x2cf003c2`）
- 五池地址：LGNS `0xb8A2…300C7` / USDT `0x88f9…2859` / DAI `0x7EC7…c01A0` / A `0x6100…D6fb` / RM `0x5beA…96A3`
- I18N：中英双语词典，右上角切换，`localStorage` 记忆（`referral_demo_lang`）
- 响应式：手机单列 / 平板两列 / 电脑三列（stats），表格在手机端隐藏合约列
- 本地演示记录：`referral_demo_joined` / `referral_demo_bound` / `referral_demo_me`

## 安全红线遵守情况

- ✅ 未调用未验收的返佣合约（Registry/Treasury 地址未出现在代码中）
- ✅ 未发起真实资金交易（无 sendTransaction，无钱包连接）
- ✅ 所有模拟数据标注「演示数据 / Demo Data」
- ✅ V3 查询为只读 `eth_call`，不上链
