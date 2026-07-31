/* Web3Origin 链上搜索与交易大白话解读工具
 * 只查公开链上数据:地址走 Worker /wallet(Etherscan V2/blockscout,key在服务端),单笔交易前端直连公共RPC/blockscout(免key)。
 * 敏感内容(助记词/私钥/密码)只在本地拦截,绝不发送/记录/写URL/写日志/写统计。
 * i18n:词典驱动。内置 zh-CN(源)+en(兜底),其余10语言懒加载 /tools/onchain-search/locales/<code>.json。
 *   分离"内部类型键"(typeKey,用于筛选/data-type/正则,绝不翻译)与"显示文案"(t('type_'+key))。
 */
(function () {
  "use strict";

  /* ================= i18n 引擎 ================= */
  var STORE_KEY = "web3origin_locale";
  var CUR = (function () { try { return localStorage.getItem(STORE_KEY) || (window.SITE_LANG === "en" ? "en" : "zh-CN"); } catch (e) { return "zh-CN"; } })();

  // 源语言(简体中文)——所有文案的权威原文
  var ZH = {
    // 外壳
    title_h1: "🔍 链上搜索",
    sub: "输入公开的钱包地址、合约地址或交易哈希，看懂真实链上记录。",
    safe: "🔒 本工具只需要<b>公开的地址或交易哈希</b>，只读查询、不连钱包、不发交易。<b>绝不要输入助记词、私钥或钱包密码。</b>",
    q_placeholder: "输入 0x 钱包地址、合约地址或交易哈希",
    go: "开始查询",
    net_auto: "自动查找",
    // 分隔符 / 引号
    list_sep: "、",
    list_sep_semi: "；",
    // 提示
    hint_empty: "请输入地址或交易哈希",
    hint_invalid: "请输入有效的钱包地址、合约地址（0x+40位）或交易哈希（0x+64位）",
    hint_pick_net: "请选择网络",
    hint_sensitive: "⚠️ 检测到疑似敏感内容，请勿输入助记词/私钥/密码",
    hint_addr: "检测到 EVM 地址（0x+40位）",
    hint_tx: "检测到可能的交易哈希（0x+64位）",
    // 敏感拦截 / 交易哈希确认
    sensitive_block: "<b>⚠️ 请不要在任何网站输入助记词、私钥或钱包密码。</b>Web3Origin 只需要公开的钱包地址或交易哈希。如果刚才输入的是真实私钥或助记词，请立即停止操作，并在安全设备上把资产转移到新钱包。",
    tx_confirm_body: "<b>⚠️ 请先确认这是「交易哈希」，不是私钥</b>你输入的是 0x + 64 位十六进制——<b>交易哈希和钱包私钥的格式完全一样</b>，本工具无法从格式上区分。如果这其实是你的私钥，<b>千万不要点下面的按钮</b>（点了会把它发送到区块链节点），请立即到安全设备把资产转移到新钱包。",
    tx_confirm_btn: "我确认这是公开交易哈希，查询",
    // 加载 / 错误
    loading: "正在从 {chains} 链读取真实链上数据…",
    err_query: "查询过程中出错，请稍后重试。",
    addr_err_source: "所选网络的数据源暂时不可用（超时/限流），无法确认这个地址的情况。请稍后重试，或换一条链。",
    addr_err_none: "没有查询到这个地址的数据。",
    tx_err_source: "数据源暂时不可用（超时/限流），无法确认这笔交易。请稍后重试。",
    tx_err_source_partial: "{chains} 链数据源暂时不可用；其余链未查到这笔交易。请稍后重试。",
    tx_err_notfound: "已启用的网络（{chains}）都没有查到这笔交易 —— 可能在其他链、尚未打包，或这串不是交易哈希。",
    errored_warn_addr: "⚠️ {chains} 链数据源暂时不可用，未计入上方结果（不代表该地址在这些链上没有交易）。",
    errored_warn_tx: "⚠️ {chains} 链数据源暂时不可用（不代表交易不存在）。",
    // 可信度
    conf_c1: "已确认", conf_c2: "高可信推断", conf_c3: "可能", conf_c4: "无法确认",
    // 通用小词
    copy: "复制", copied: "已复制",
    token_word: "代币", token_unknown: "未知代币", token_label: "代币",
    token_min_unit: "（最小单位）", token_min_unit_unknown: "（最小单位·精度未知）",
    src_verified: "Web3Origin核实",
    tag_contract: "合约地址", tag_eoa: "外部账户", tag_eoa_full: "外部账户 EOA",
    amount_unlimited: "【无限额度】",
    // 活动类型显示文案(内部键见 typeKey)
    type_fail: "失败交易",
    type_approve: "授权 Approve",
    type_swap: "兑换 Swap",
    type_multi: "多向转移",
    type_stake: "质押",
    type_unstake: "解除质押",
    type_claim: "领取奖励",
    type_addlp: "添加流动性",
    type_removelp: "移除流动性",
    type_out: "转出",
    type_in: "转入",
    type_call: "合约调用",
    type_unknown: "未知合约交互",
    // 活动大白话
    exp_fail: "这笔交易失败了，操作没有按预期完成。网络仍执行并验证了请求，所以可能已扣除了 Gas 手续费。",
    exp_approve: "这不是直接转币，而是一次 Token 授权——该地址允许某个合约在额度内动用它的代币。授权对象是否可信需自行核实；如果是本人操作且已不再使用，可在 revoke.cash 撤销。",
    exp_swap: "这看起来是一笔兑换：该地址支付了约 {pay}，收到约 {recv}。中间若有多次转账，属于兑换合约与流动池的自动处理，不是多笔独立操作。",
    exp_swap_short: "这看起来是一笔兑换，中间有多次代币流动，属于兑换合约的自动处理。",
    exp_multi: "这笔交易里该地址既有转出（{outs}）又有转入（{ins}）。缺少已验证方法，无法确认是兑换、质押换凭证还是加减流动性，点浏览器可进一步核对。",
    exp_out: "该地址转出了 {outs}，交易已上链。",
    exp_in: "这是一笔转入：有地址向该地址转来了 {ins}，它是接收方。",
    exp_stake: "这是一次质押相关操作，把代币存入了质押/合约。",
    exp_unstake: "这是一次解除质押操作，把之前质押的代币取回。",
    exp_claim: "这是一次领取操作，从合约领取奖励/解锁的代币。",
    exp_addlp: "这是一次添加流动性操作，把两种代币存入了流动池。",
    exp_removelp: "这是一次移除流动性操作，从流动池取回代币。",
    exp_call_m: "这笔交易调用了合约「{method}」。{note}",
    exp_call_nm: "这笔交易调用了合约。{note}",
    exp_call_note_has: "伴随的资产变化见下方。",
    exp_call_note_none: "没有明显的代币转移。",
    exp_unknown: "这笔交易调用了一个暂未识别的合约，缺少已验证 ABI，无法准确判断具体功能。可确认的是交易已上链，资产变化见下方（如有）。",
    // 地址视图
    card_overview: "📇 地址概览",
    lbl_address: "地址", lbl_label: "标签", lbl_type: "类型",
    note_contract_code: "（链上有代码；也可能是被 7702 委托的钱包）",
    note_eoa: "（当前没有合约代码；一般是个人钱包，但也可能是机器人或机构控制的账户）",
    lbl_native_balance: "原生余额",
    lbl_first_activity: "首次活动", lbl_recent_activity: "最近活动", lbl_query_time: "查询时间",
    open_explorer: "在 {name} 区块浏览器打开 ↗",
    card_assets: "💰 资产概览",
    assets_none: "未查询到有余额的主要 Token。",
    spam_toggle: "⚠️ 另有 {n} 个疑似垃圾/空投 Token 已隐藏，点击显示全部 ▾",
    spam_warn: "这些 Token 不在已知清单里，可能是垃圾空投——即使名称含「空投」「领取」也不代表可信资产，请勿点击其中的任何链接或授权。",
    assets_no_price: "仅显示可靠查询到的余额；暂无可靠价格来源，故不换算美元估值（估值以实际链上交易价格为准）。",
    card_approvals: "🔐 授权与风险",
    appr_grant_to: "授权给",
    tag_unlimited: "无限额度",
    tag_limited: "有限额度 {amount}",
    appr_warn: "⚠️ 该地址存在【无限额度】授权。若为本人钱包且某个被授权合约已不再使用，建议到 <a href=\"https://revoke.cash/\" target=\"_blank\" rel=\"noopener noreferrer\">revoke.cash</a> 撤销，降低风险。被授权合约是否可信需自行确认。",
    card_recent_overview: "📊 最近 {n} 笔交易概览",
    recent_overview: "这个地址最近 {n} 笔活动中，成功 {suc} 笔、失败 {fail} 笔；其中转入 {cin}、转出 {cout}、兑换 {cswap}、授权 {capp}、质押相关 {cstk} 笔。{note} 统计仅覆盖本次查询到的最近记录。",
    recent_overview_appr: "出现过授权操作，请确认被授权合约是否可信。",
    card_recent_tx: "🧾 最近交易",
    filter_all: "全部", filter_in: "转入", filter_out: "转出", filter_contract: "合约交互",
    filter_swap: "兑换", filter_approve: "授权", filter_stake: "质押", filter_fail: "失败",
    recent_source: "数据来源：{source}；标准 RPC 无法按地址列历史，本列表来自区块浏览器/索引接口，展示最近约 20 条。「加载更多」为后续版本（Phase-2）。",
    // 交易视图
    card_explain: "💬 大白话解读",
    parse_warn: "⚠️ 有部分事件日志无法解析，上面的资产变化可能不完整，请以区块浏览器为准。",
    conf_note: "可信度说明：已确认=来自回执/事件日志/已知代币；高可信推断=资产变化与方法吻合；可能=仅部分证据；无法确认=缺少已验证 ABI。以下为原始依据。",
    card_basic: "🧾 基础信息",
    lbl_status: "状态", status_ok: "成功", status_fail: "失败", status_unknown: "未知",
    lbl_type_tx: "类型",
    lbl_network: "网络", network_val: "{name}（Chain ID {id}）",
    lbl_txhash: "交易哈希", lbl_time: "时间", lbl_block: "区块",
    tx_creation_to: "（合约创建 → {addr}）",
    lbl_native_amount: "原生金额",
    lbl_fee: "手续费",
    card_asset_changes: "🔄 资产变化（按地址）",
    card_contract_call: "📞 合约调用",
    lbl_target_contract: "目标合约", lbl_method: "方法", method_unrecognized: "（未识别）",
    lbl_selector: "方法选择器", lbl_abi_source: "ABI 来源",
    abi_known: "已知选择器 / 浏览器解码", abi_unverified: "未验证 ABI，仅按资产变化推断",
    card_approval_changes: "🔐 授权变化",
    appr_owner: "授权人",
    tag_by_initiator: "发起地址本人", tag_not_initiator: "非发起地址",
    appr_to_spender: "→ 被授权合约", appr_amount: "；额度",
    appr_change_warn: "「授权人」是谁，这笔授权就属于谁。若授权人是本人钱包且已不再使用该合约，建议到 <a href=\"https://revoke.cash/\" target=\"_blank\" rel=\"noopener noreferrer\">revoke.cash</a> 撤销。",
    card_logs: "📜 事件日志与原始数据",
    logs_count: "（共 {n} 条事件）",
    lbl_contract: "合约",
    logs_none: "这笔交易没有产生事件日志。",
    expand_input: "展开完整 Input Data ▾",
    input_full: "Input（完整）：",
    data_source: "数据来源：{source}",
    // 交易大白话(explainTxFull)
    extx_pending: "节点已经看到这笔交易，但它还没有被打包确认（pending）。现在还不能确定成功还是失败，也不能说已经扣了手续费。请稍后再查。",
    extx_fail: "这笔交易失败了，资产操作没有按预期完成。但网络仍执行并验证了请求，所以可能已扣除了 Gas 手续费。失败原因需结合合约返回信息进一步判断。",
    extx_from: "发起地址 {from} ",
    extx_creation: "部署了一个新合约{addr}。",
    extx_creation_addr: "（{a}）",
    extx_approve_prefix: "进行了 Token 授权：",
    extx_approve_item: "允许 {spender} 动用它的 {sym}（额度{amount}）",
    extx_approve_unlimited_note: "其中有无限额度授权——被授权合约以后可在额度内调用该地址的代币，授权对象是否可信需自行核实，如是本人操作且不再使用建议到 revoke.cash 撤销。",
    extx_swap: "进行了一笔兑换：支付了 {pay}，收到了 {recv}。中间若有多次转账，属于兑换合约与流动池的自动处理，不代表多笔独立操作。",
    extx_multi: "既有转出（{outs}）又有转入（{ins}）。缺少已验证的方法/ABI，无法确认到底是兑换、质押换凭证还是加减流动性，请点浏览器进一步核对。",
    extx_out: "转出了 {outs}；",
    extx_in: "收到了 {ins}；",
    extx_native: "向 {to} 转出了 {amt} {sym}。",
    extx_call: "调用了合约方法「{method}」。",
    extx_call_note_none: "本次没有明显的代币转移。",
    extx_unknown: "调用了一个暂未识别的合约。目前可确认：交易已上链、支付了 Gas；由于缺少已验证 ABI，暂时无法准确判断具体功能。",
    extx_result: "交易{result}。",
    extx_result_ok: "成功",
    extx_result_unconfirmed: "结果未确认（未取到回执，以浏览器为准）",
    extx_gas: "支付了约 {amt} {sym} 的网络手续费。",
    // 交易类型 kind(explainTxFull)
    kind_pending: "待确认(pending)",
    kind_fail: "失败交易",
    kind_creation: "合约部署",
    kind_approve: "授权 Approve",
    kind_swap: "Token 兑换",
    kind_multi: "多种 Token 流入流出（可能是兑换/质押换凭证/加减流动性等）",
    kind_erc20_out: "ERC-20 转出",
    kind_erc20_in: "ERC-20 转入",
    kind_native: "原生币转账",
    kind_call: "合约调用（{method}）",
    kind_unknown: "未知合约交互"
  };

  // en 兜底(所有非中文语言在缺键时回退到此;非中文语言的完整译文来自 /locales/<code>.json)
  var EN = {
    title_h1: "🔍 On-chain Search",
    sub: "Enter a public wallet address, contract address or transaction hash to make sense of the real on-chain record.",
    safe: "🔒 This tool only needs a <b>public address or transaction hash</b> — read-only, no wallet connection, no transactions sent. <b>Never enter a seed phrase, private key or wallet password.</b>",
    q_placeholder: "Enter a 0x wallet address, contract address or transaction hash",
    go: "Search",
    net_auto: "Auto-detect",
    list_sep: ", ",
    list_sep_semi: "; ",
    hint_empty: "Please enter an address or transaction hash",
    hint_invalid: "Please enter a valid wallet/contract address (0x + 40 chars) or transaction hash (0x + 64 chars)",
    hint_pick_net: "Please choose a network",
    hint_sensitive: "⚠️ Possible sensitive content detected — never enter a seed phrase / private key / password",
    hint_addr: "EVM address detected (0x + 40 chars)",
    hint_tx: "Possible transaction hash detected (0x + 64 chars)",
    sensitive_block: "<b>⚠️ Never enter a seed phrase, private key or wallet password on any website.</b> Web3Origin only needs a public wallet address or transaction hash. If you just entered a real private key or seed phrase, stop now and move your assets to a new wallet from a secure device.",
    tx_confirm_body: "<b>⚠️ Confirm this is a transaction hash, not a private key</b> You entered 0x + 64 hex characters — <b>a transaction hash and a wallet private key look exactly the same</b>, and this tool cannot tell them apart by format. If this is actually your private key, <b>do NOT click the button below</b> (clicking sends it to a blockchain node). Move your assets to a new wallet from a secure device immediately.",
    tx_confirm_btn: "I confirm this is a public transaction hash — search",
    loading: "Reading real on-chain data from {chains}…",
    err_query: "Something went wrong during the query. Please try again later.",
    addr_err_source: "The data source for the selected network is temporarily unavailable (timeout / rate limit), so this address cannot be confirmed. Please retry later or switch chains.",
    addr_err_none: "No data found for this address.",
    tx_err_source: "The data source is temporarily unavailable (timeout / rate limit), so this transaction cannot be confirmed. Please retry later.",
    tx_err_source_partial: "The {chains} data source is temporarily unavailable; the transaction was not found on the other chains. Please retry later.",
    tx_err_notfound: "None of the enabled networks ({chains}) found this transaction — it may be on another chain, not yet mined, or this string is not a transaction hash.",
    errored_warn_addr: "⚠️ The {chains} data source is temporarily unavailable and was not included above (this does not mean the address has no transactions on those chains).",
    errored_warn_tx: "⚠️ The {chains} data source is temporarily unavailable (this does not mean the transaction does not exist).",
    conf_c1: "Confirmed", conf_c2: "High confidence", conf_c3: "Possible", conf_c4: "Unconfirmed",
    copy: "Copy", copied: "Copied",
    token_word: "token", token_unknown: "unknown token", token_label: "Token",
    token_min_unit: "(smallest unit)", token_min_unit_unknown: "(smallest unit · decimals unknown)",
    src_verified: "Web3Origin verified",
    tag_contract: "Contract", tag_eoa: "External account", tag_eoa_full: "External account (EOA)",
    amount_unlimited: "[unlimited]",
    type_fail: "Failed",
    type_approve: "Approve",
    type_swap: "Swap",
    type_multi: "Multi-directional transfer",
    type_stake: "Stake",
    type_unstake: "Unstake",
    type_claim: "Claim reward",
    type_addlp: "Add liquidity",
    type_removelp: "Remove liquidity",
    type_out: "Sent out",
    type_in: "Received",
    type_call: "Contract call",
    type_unknown: "Unknown contract interaction",
    exp_fail: "This transaction failed and did not complete as intended. The network still executed and validated the request, so a Gas fee may still have been charged.",
    exp_approve: "This is not a direct transfer but a token approval — the address lets a contract spend its tokens up to a limit. Verify the approved party yourself; if this was you and you no longer use it, you can revoke it at revoke.cash.",
    exp_swap: "This looks like a swap: the address paid about {pay} and received about {recv}. Any intermediate transfers are automatic handling by the swap contract and liquidity pool, not separate operations.",
    exp_swap_short: "This looks like a swap with several intermediate token movements, handled automatically by the swap contract.",
    exp_multi: "In this transaction the address both sent out ({outs}) and received ({ins}). Without a verified method it cannot be confirmed as a swap, a stake-for-receipt, or adding/removing liquidity — open the explorer to check further.",
    exp_out: "The address sent out {outs}; the transaction is on-chain.",
    exp_in: "This is an incoming transfer: an address sent {ins} to this address, which is the recipient.",
    exp_stake: "This is a staking-related operation, depositing tokens into a staking contract.",
    exp_unstake: "This is an unstake operation, withdrawing previously staked tokens.",
    exp_claim: "This is a claim operation, collecting rewards / unlocked tokens from a contract.",
    exp_addlp: "This is an add-liquidity operation, depositing two tokens into a liquidity pool.",
    exp_removelp: "This is a remove-liquidity operation, withdrawing tokens from a liquidity pool.",
    exp_call_m: "This transaction called the contract “{method}”. {note}",
    exp_call_nm: "This transaction called a contract. {note}",
    exp_call_note_has: "See the accompanying asset changes below.",
    exp_call_note_none: "No obvious token transfer.",
    exp_unknown: "This transaction called an as-yet unidentified contract; without a verified ABI its exact purpose cannot be determined. What is certain is that the transaction is on-chain; asset changes (if any) are below.",
    card_overview: "📇 Address overview",
    lbl_address: "Address", lbl_label: "Label", lbl_type: "Type",
    note_contract_code: "(has code on-chain; may also be a 7702-delegated wallet)",
    note_eoa: "(no contract code currently; usually a personal wallet, but could be a bot or an institution-controlled account)",
    lbl_native_balance: "Native balance",
    lbl_first_activity: "First activity", lbl_recent_activity: "Latest activity", lbl_query_time: "Query time",
    open_explorer: "Open in {name} block explorer ↗",
    card_assets: "💰 Assets overview",
    assets_none: "No major token with a balance was found.",
    spam_toggle: "⚠️ {n} more suspected junk / airdrop tokens are hidden. Click to show all ▾",
    spam_warn: "These tokens are not on the known list and may be junk airdrops — even names containing “airdrop” or “claim” do not make them trustworthy assets. Do not click any link inside them or approve them.",
    assets_no_price: "Only reliably queried balances are shown; there is no reliable price source, so no USD valuation is calculated (valuation follows actual on-chain trade prices).",
    card_approvals: "🔐 Approvals & risk",
    appr_grant_to: "Approved to",
    tag_unlimited: "Unlimited",
    tag_limited: "Limited {amount}",
    appr_warn: "⚠️ This address has an [unlimited] approval. If this is your wallet and an approved contract is no longer in use, consider revoking it at <a href=\"https://revoke.cash/\" target=\"_blank\" rel=\"noopener noreferrer\">revoke.cash</a> to reduce risk. Verify whether the approved contract is trustworthy yourself.",
    card_recent_overview: "📊 Last {n} transactions overview",
    recent_overview: "Of this address's last {n} activities, {suc} succeeded and {fail} failed; including {cin} received, {cout} sent out, {cswap} swaps, {capp} approvals and {cstk} staking-related. {note} Statistics only cover the most recent records fetched this time.",
    recent_overview_appr: "Approval operations occurred — confirm whether the approved contracts are trustworthy.",
    card_recent_tx: "🧾 Recent transactions",
    filter_all: "All", filter_in: "Received", filter_out: "Sent out", filter_contract: "Contract",
    filter_swap: "Swap", filter_approve: "Approve", filter_stake: "Stake", filter_fail: "Failed",
    recent_source: "Data source: {source}. Standard RPC cannot list history by address, so this list comes from block explorer / indexer APIs and shows the latest ~20 entries. “Load more” is planned for a later version (Phase-2).",
    card_explain: "💬 Plain-language explanation",
    parse_warn: "⚠️ Some event logs could not be parsed, so the asset changes above may be incomplete — refer to the block explorer.",
    conf_note: "Confidence: Confirmed = from receipt / event logs / known tokens; High confidence = asset changes match the method; Possible = only partial evidence; Unconfirmed = no verified ABI. The raw evidence follows.",
    card_basic: "🧾 Basic info",
    lbl_status: "Status", status_ok: "Success", status_fail: "Failed", status_unknown: "Unknown",
    lbl_type_tx: "Type",
    lbl_network: "Network", network_val: "{name} (Chain ID {id})",
    lbl_txhash: "Transaction hash", lbl_time: "Time", lbl_block: "Block",
    tx_creation_to: "(contract creation → {addr})",
    lbl_native_amount: "Native amount",
    lbl_fee: "Fee",
    card_asset_changes: "🔄 Asset changes (by address)",
    card_contract_call: "📞 Contract call",
    lbl_target_contract: "Target contract", lbl_method: "Method", method_unrecognized: "(unrecognized)",
    lbl_selector: "Method selector", lbl_abi_source: "ABI source",
    abi_known: "Known selector / explorer decode", abi_unverified: "No verified ABI; inferred only from asset changes",
    card_approval_changes: "🔐 Approval changes",
    appr_owner: "Owner",
    tag_by_initiator: "Initiator (self)", tag_not_initiator: "Not the initiator",
    appr_to_spender: "→ Spender contract", appr_amount: "; limit ",
    appr_change_warn: "Whoever the “owner” is, that is who this approval belongs to. If the owner is your wallet and you no longer use the contract, consider revoking it at <a href=\"https://revoke.cash/\" target=\"_blank\" rel=\"noopener noreferrer\">revoke.cash</a>.",
    card_logs: "📜 Event logs & raw data",
    logs_count: "({n} events total)",
    lbl_contract: "Contract",
    logs_none: "This transaction produced no event logs.",
    expand_input: "Expand full Input Data ▾",
    input_full: "Input (full): ",
    data_source: "Data source: {source}",
    extx_pending: "The node has seen this transaction, but it has not been mined/confirmed yet (pending). It cannot yet be said to have succeeded or failed, nor that a fee has been charged. Please check again later.",
    extx_fail: "This transaction failed and the asset operation did not complete as intended. The network still executed and validated the request, so a Gas fee may still have been charged. The failure reason needs the contract's return data to judge further.",
    extx_from: "The initiating address {from} ",
    extx_creation: "deployed a new contract{addr}.",
    extx_creation_addr: " ({a})",
    extx_approve_prefix: "made a token approval: ",
    extx_approve_item: "allowed {spender} to spend its {sym} (limit {amount})",
    extx_approve_unlimited_note: "One of them is an unlimited approval — the approved contract can spend this address's tokens within the limit from now on. Verify whether the approved party is trustworthy; if this was you and it is no longer used, consider revoking at revoke.cash.",
    extx_swap: "made a swap: paid {pay} and received {recv}. Any intermediate transfers are automatic handling by the swap contract and liquidity pool, not separate operations.",
    extx_multi: "both sent out ({outs}) and received ({ins}). Without a verified method/ABI it cannot be confirmed as a swap, a stake-for-receipt, or adding/removing liquidity — open the explorer to check.",
    extx_out: "sent out {outs}; ",
    extx_in: "received {ins}; ",
    extx_native: "sent {amt} {sym} to {to}.",
    extx_call: "called the contract method “{method}”. ",
    extx_call_note_none: "No obvious token transfer this time.",
    extx_unknown: "called an as-yet unidentified contract. What is certain: the transaction is on-chain and Gas was paid; without a verified ABI the exact purpose cannot be determined for now.",
    extx_result: "The transaction {result}.",
    extx_result_ok: "succeeded",
    extx_result_unconfirmed: "result is unconfirmed (no receipt fetched; refer to the explorer)",
    extx_gas: "About {amt} {sym} was paid as the network fee.",
    kind_pending: "Pending",
    kind_fail: "Failed",
    kind_creation: "Contract deployment",
    kind_approve: "Approve",
    kind_swap: "Token swap",
    kind_multi: "Multiple tokens in & out (possibly swap / stake-for-receipt / add-remove liquidity)",
    kind_erc20_out: "ERC-20 sent out",
    kind_erc20_in: "ERC-20 received",
    kind_native: "Native transfer",
    kind_call: "Contract call ({method})",
    kind_unknown: "Unknown contract interaction"
  };

  var DICT = { "zh-CN": ZH, en: EN }; // 其余语言运行时注入
  // 兜底:非中文语言缺键→en;中文变体缺键→zh-CN
  function fallbackDict(code) { return code.slice(0, 2) === "zh" ? ZH : EN; }
  function t(key) {
    var d = DICT[CUR];
    if (d && d[key] != null) return d[key];
    var fb = fallbackDict(CUR);
    if (fb[key] != null) return fb[key];
    return EN[key] != null ? EN[key] : (ZH[key] != null ? ZH[key] : key);
  }
  function tf(key, params) {
    params = params || {};
    return String(t(key)).replace(/\{(\w+)\}/g, function (_, k) { return params[k] != null ? params[k] : ""; });
  }
  function sep() { return t("list_sep"); }
  function loadPack(code) {
    if (code === "zh-CN" || code === "en" || DICT[code]) return Promise.resolve();
    return fetch("/tools/onchain-search/locales/" + code + ".json")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (p) { if (p && typeof p === "object") DICT[code] = p; })
      .catch(function () {}); // 拿不到就靠兜底
  }

  var WORKER = "https://count.web3origin.com";
  // 集中链配置(仅在数据查询与解析经过真实测试后才标 enabled:true)
  var CHAINS = [
    { chainId: 137, name: "Polygon", nativeSymbol: "POL", enabled: true,
      rpcUrl: "https://polygon.drpc.org", explorerUrl: "https://polygonscan.com",
      explorerAddr: "https://polygonscan.com/address/", explorerTx: "https://polygonscan.com/tx/",
      walletApi: WORKER + "/wallet?chain=polygon&addr=", source: "Etherscan V2(经 Worker) + Polygon 公共 RPC" },
    { chainId: 6714, name: "Anubis", nativeSymbol: "DAI", enabled: true,
      rpcUrl: "https://rpc.anubispace.org", explorerUrl: "https://browser.anubispace.org",
      explorerAddr: "https://browser.anubispace.org/address/", explorerTx: "https://browser.anubispace.org/tx/",
      blockscout: "https://browser.anubispace.org/api/v2",
      walletApi: WORKER + "/wallet?chain=anubis&addr=", source: "Blockscout(Anubis) + Anubis 公共 RPC" }
    // 预留(未经真实测试前不显示为已支持): Ethereum / BNB / Arbitrum / Base / Optimism
  ];
  function chainByName(n) { for (var i = 0; i < CHAINS.length; i++) if (CHAINS[i].name === n) return CHAINS[i]; return null; }

  // 已知代币(用于交易日志解码;精度必须正确)
  var KNOWN_TOKENS = {
    "0xeb51d9a39ad5eef215dc0bf39a8821ff804a0f01": { sym: "LGNS", dec: 9 },
    "0x99a57e6c8558bc6689f894e068733adf83c19725": { sym: "sLGNS", dec: 9 },
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063": { sym: "DAI", dec: 18 },
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": { sym: "USDT", dec: 6 },
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": { sym: "USDC.e", dec: 6 },
    "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359": { sym: "USDC", dec: 6 },
    "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270": { sym: "WMATIC", dec: 18 },
    "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619": { sym: "WETH", dec: 18 },
    "0x4d1d808a081fdac440703b3765fc61f8028c06b8": { sym: "LGNS", dec: 9 } // Anubis LGNS
  };
  // 方法选择器 → {名称, 类型}(证据不足时归为未知,绝不硬分类)
  var SELECTORS = {
    "0xa9059cbb": { n: "transfer", t: "erc20" },
    "0x23b872dd": { n: "transferFrom", t: "erc20" },
    "0x095ea7b3": { n: "approve", t: "approve" },
    "0xd505accf": { n: "permit", t: "approve" },
    "0x9ebea88c": { n: "unstake", t: "unstake" },
    "0xa694fc3a": { n: "stake", t: "stake" },
    "0x4e71d92d": { n: "claim", t: "claim" },
    "0x1e83409a": { n: "claim", t: "claim" },
    "0x379607f5": { n: "claim", t: "claim" },
    "0x3d18b912": { n: "getReward", t: "claim" },
    "0x38ed1739": { n: "swapExactTokensForTokens", t: "swap" },
    "0x8803dbee": { n: "swapTokensForExactTokens", t: "swap" },
    "0x7ff36ab5": { n: "swapExactETHForTokens", t: "swap" },
    "0x18cbafe5": { n: "swapExactTokensForETH", t: "swap" },
    "0x5c11d795": { n: "swapExactTokensForTokensSupportingFeeOnTransferTokens", t: "swap" },
    "0xe8e33700": { n: "addLiquidity", t: "addlp" },
    "0xf305d719": { n: "addLiquidityETH", t: "addlp" },
    "0xbaa2abde": { n: "removeLiquidity", t: "removelp" },
    "0x02751cec": { n: "removeLiquidityETH", t: "removelp" }
  };
  var TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
  var APPROVAL_TOPIC = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";

  var EVM_ADDR = /^0x[0-9a-fA-F]{40}$/, TX_HASH = /^0x[0-9a-fA-F]{64}$/;
  var MAX_Q = 80;

  /* ---------- 工具 ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); }
  function short(a) { a = String(a || ""); return a.length > 14 ? a.slice(0, 8) + "…" + a.slice(-6) : a; }
  function fmtBig(v, dec) { try { v = BigInt(v); var neg = v < 0n; if (neg) v = -v; if (dec <= 0) return (neg ? "-" : "") + v.toString(); var s = v.toString().padStart(dec + 1, "0"); var i = s.slice(0, -dec), f = s.slice(-dec).replace(/0+$/, ""); return (neg ? "-" : "") + i + (f ? "." + f : ""); } catch (e) { return "?"; } }
  function fmtShort(v, dec) { return fmtBig(v, dec); } // 完整精度显示(不再截断/不显示"少量")
  function BigIntSafe(v) { try { return BigInt(v); } catch (e) { return 0n; } }
  function fromDec(numStr, dec) { return fmtBig(BigIntSafe(numStr), dec); } // etherscan返回十进制整数字符串
  function tsFmt(ts) { if (!ts) return "-"; try { return new Date(ts * 1000).toLocaleString(); } catch (e) { return "-"; } }
  function tsDate(ts) { if (!ts) return ""; try { return new Date(ts * 1000).toLocaleDateString(); } catch (e) { return ""; } }
  function hex2num(h) { try { return parseInt(h, 16); } catch (e) { return null; } }
  function topicAddr(t) { return t ? ("0x" + String(t).slice(-40)) : ""; }
  function isHex32(x) { return typeof x === "string" && /^0x[0-9a-fA-F]{64}$/.test(x); }
  function decOf(raw) { if (raw == null) return null; var d = Number(raw); return (isFinite(d) && d >= 0 && d <= 36) ? d : null; } // decimals=0合法;缺失/非法=精度未知(返回null),不冒充18位
  // 解码 Transfer/Approval 事件(校验topic/data长度,坏数据跳过并标记 parseWarn)
  function decodeLogsInto(n, logs, addrOf, opt) {
    (logs || []).forEach(function (lg) {
      var tps = lg.topics || [], t0 = (tps[0] || "").toLowerCase(), ca = String(addrOf(lg) || ""), dv = String(lg.data || ""); // 用完整data,不截断(超长data=非标准,判为坏)
      if (opt.transfers && t0 === TRANSFER_TOPIC) {
        if (tps.length < 3 || !isHex32(tps[1]) || !isHex32(tps[2]) || !isHex32(dv)) { n.parseWarn = true; return; }
        var m = KNOWN_TOKENS[ca.toLowerCase()];
        n.tokenChanges.push({ tokenAddr: ca, sym: m ? m.sym : null, dec: m ? m.dec : null, from: topicAddr(tps[1]), to: topicAddr(tps[2]), value: BigInt(dv) });
      } else if (opt.approvals && t0 === APPROVAL_TOPIC) {
        if (tps.length < 3 || !isHex32(tps[1]) || !isHex32(tps[2]) || !isHex32(dv)) { n.parseWarn = true; return; }
        var m2 = KNOWN_TOKENS[ca.toLowerCase()], v = BigInt(dv);
        n.approvals.push({ tokenAddr: ca, sym: m2 ? m2.sym : null, dec: m2 ? m2.dec : null, owner: topicAddr(tps[1]), spender: topicAddr(tps[2]), value: v, unlimited: v > (2n ** 200n) });
      }
    });
  }
  function copyBtn(text) { return '<button class="copy" data-copy="' + esc(text) + '">' + esc(t("copy")) + "</button>"; }
  function $(id) { return document.getElementById(id); }

  // 地址标签(来源标注;禁止把未确认地址标成官方/黑客/骗子)
  var LABELS = {};
  function buildLabels() {
    LABELS = {};
    try {
      var C = window.CONTRACTS || [];
      C.forEach(function (c) { if (c.addr) LABELS[c.addr.toLowerCase()] = { name: c.name || c.cname || "", chain: c.chain, source: t("src_verified"), verified: !!c.verified }; });
    } catch (e) {}
    for (var a in KNOWN_TOKENS) if (!LABELS[a]) LABELS[a] = { name: KNOWN_TOKENS[a].sym + " " + t("token_label"), source: t("src_verified"), verified: true };
  }
  function labelOf(addr) { if (!addr) return null; return LABELS[addr.toLowerCase()] || null; }
  function addrHtml(addr, chain, typeHint) {
    if (!addr) return "-";
    var lab = labelOf(addr), url = (chain ? chain.explorerAddr : "https://polygonscan.com/address/") + addr;
    var s = '<a class="mono" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(addr) + "</a>" + copyBtn(addr); // 完整地址
    if (lab && lab.name) s += ' <span class="tag' + (lab.verified ? " green" : "") + '">📄 ' + esc(lab.name) + " · " + esc(lab.source) + "</span>"; // 已知合约
    else if (typeHint === "contract") s += ' <span class="tag">📄 ' + esc(t("tag_contract")) + '</span>';
    else if (typeHint === "eoa") s += ' <span class="tag green">👤 ' + esc(t("tag_eoa")) + '</span>';
    return s;
  }

  /* ---------- 输入识别 + 敏感拦截 ---------- */
  function isSensitive(s) {
    s = String(s || "").trim();
    var words = s.split(/\s+/).filter(Boolean);
    if ([12, 15, 18, 21, 24].indexOf(words.length) >= 0 && words.every(function (w) { return /^[a-z]{3,10}$/.test(w); })) return true; // BIP39样式助记词
    if (/^[0-9a-fA-F]{64}$/.test(s)) return true; // 裸64位十六进制=疑似私钥(0x+64=交易哈希另处理)
    if (/(私钥|助记词|mnemonic|seed\s*phrase|private\s*key|钱包密码|wallet\s*password|支付密码|api[_\s-]?key|secret\s*key)/i.test(s)) return true;
    return false;
  }
  function detectType(q) {
    q = q.trim();
    if (isSensitive(q)) return "sensitive";
    if (EVM_ADDR.test(q)) return "address";
    if (TX_HASH.test(q)) return "tx";
    return "invalid";
  }

  /* ---------- 埋点(禁止统计完整地址/哈希/资产明细) ---------- */
  function track(name, props) { try { if (window.W3OAnalytics && window.W3OAnalytics.track) window.W3OAnalytics.track(name, props || {}); } catch (e) {} }

  /* ---------- RPC(前端直连公共节点,12秒超时) ---------- */
  function rpc(url, method, params) {
    var ctrl = (typeof AbortController !== "undefined") ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 12000) : null;
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: method, params: params }), signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (j) { if (j.error) throw new Error((j.error && j.error.message) || "RPC error"); return j.result; })
      .then(function (x) { if (timer) clearTimeout(timer); return x; }, function (e) { if (timer) clearTimeout(timer); throw e; });
  }
  function getJson(url) {
    var ctrl = (typeof AbortController !== "undefined") ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 12000) : null;
    return fetch(url, { signal: ctrl ? ctrl.signal : undefined }).then(function (r) { if (timer) clearTimeout(timer); if (r.status === 404) return { _404: true }; if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }, function (e) { if (timer) clearTimeout(timer); throw e; });
  }

  /* ================= 地址查询(复用 Worker /wallet) ================= */
  function queryAddress(chain, addr) {
    return getJson(chain.walletApi + addr).then(function (w) {
      if (!w || w.ok === false) return { chain: chain, status: "error" };
      return { chain: chain, status: "found", w: w };
    }).catch(function () { return { chain: chain, status: "error" }; });
  }

  // 把 txs[] 与 transfers[] 按 hash 合并成"活动"
  function buildActivities(w, addr) {
    var lo = addr.toLowerCase(), byHash = {};
    (w.txs || []).forEach(function (t2) { byHash[t2.hash] = { hash: t2.hash, ts: t2.ts, from: t2.from, to: t2.to, method: t2.method || "", isError: t2.isError, mid: t2.mid, transfers: [], initiator: (t2.from || "").toLowerCase() === lo }; });
    (w.transfers || []).forEach(function (tr) {
      var a = byHash[tr.hash];
      if (!a) { a = byHash[tr.hash] = { hash: tr.hash, ts: tr.ts, from: tr.from, to: tr.to, method: "", transfers: [], initiator: false, transferOnly: true }; }
      a.transfers.push(tr);
    });
    var list = Object.keys(byHash).map(function (k) { return byHash[k]; });
    list.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    list = list.slice(0, 20); // 最近20笔
    list.forEach(function (a) { classify(a, lo); });
    return list;
  }
  // 可信代币白名单(已知起源生态+主流稳定币),其余默认当疑似垃圾折叠
  var TRUSTED_SYM = { LGNS: 1, sLGNS: 1, gLGNS: 1, DAI: 1, USDT: 1, USDC: 1, "USDC.e": 1, WMATIC: 1, WETH: 1, POL: 1 };
  function isTrustedToken(t2) { return (t2.addr && KNOWN_TOKENS[t2.addr.toLowerCase()]) || TRUSTED_SYM[t2.sym]; }
  // 分类:设置内部稳定键 a.typeKey(用于筛选/正则,绝不翻译)+可信度 a.conf。显示文案由 t('type_'+key) 取。
  function classify(a, lo) {
    var trs = a.transfers || [], outs = trs.filter(function (t2) { return t2.dir === "out"; }), ins = trs.filter(function (t2) { return t2.dir === "in"; });
    a.outs = outs; a.ins = ins;
    var m = (a.method || "").toLowerCase(), sel = SELECTORS[a.mid] || null, mt = sel ? sel.t : "";
    if (a.isError) { a.typeKey = "fail"; a.conf = "c1"; return; }
    // 授权:只在被查地址就是发起人时才判为"授权"(exp_approve 会说"该地址允许…",非发起人不能这么归属);与单笔交易路径 owner===initiator 一致
    if ((/approve|permit/.test(m) || mt === "approve") && a.initiator) { a.typeKey = "approve"; a.conf = a.method ? "c2" : "c3"; return; }
    if (mt === "swap") { a.typeKey = "swap"; a.conf = "c2"; return; } // 只认已知swap选择器,不靠方法名字面(防伪造名)
    if (outs.length && ins.length) { a.typeKey = "multi"; a.conf = "c3"; return; } // 既转出又转入,但无swap方法,不硬判兑换
    // unstake 必须先于 stake 判定:"unstake" 含子串满足 /stake\b/,否则解除质押会被误判成质押
    if (mt === "unstake" || /unstake/.test(m)) { a.typeKey = "unstake"; a.conf = "c2"; return; }
    if (mt === "stake" || /\bstake\b/.test(m)) { a.typeKey = "stake"; a.conf = "c2"; return; }
    if (mt === "claim" || /claim|reward|harvest/.test(m)) { a.typeKey = "claim"; a.conf = "c2"; return; }
    if (mt === "addlp" || /addliquidity/.test(m)) { a.typeKey = "addlp"; a.conf = "c2"; return; }
    if (mt === "removelp" || /removeliquidity/.test(m)) { a.typeKey = "removelp"; a.conf = "c2"; return; }
    if (outs.length && !ins.length) { a.typeKey = "out"; a.conf = "c2"; return; }
    if (ins.length && !outs.length) { a.typeKey = "in"; a.conf = "c2"; return; }
    if (a.method) { a.typeKey = "call"; a.conf = "c3"; return; }
    a.typeKey = "unknown"; a.conf = "c4";
  }
  function typeLabel(key) { return t("type_" + key); }
  function explainActivity(a, chain) {
    var outs = a.outs || [], ins = a.ins || [];
    function pair(t2) { return (t2.amount) + " " + (t2.token || t("token_word")); }
    switch (a.typeKey) {
      case "fail": return t("exp_fail");
      case "approve": return t("exp_approve");
      case "swap": {
        var o = outs[0], i = ins[0];
        if (o && i) return tf("exp_swap", { pay: pair(o), recv: pair(i) });
        return t("exp_swap_short");
      }
      case "multi": return tf("exp_multi", { outs: outs.map(pair).join(sep()), ins: ins.map(pair).join(sep()) });
      case "out": return tf("exp_out", { outs: outs.map(pair).join(sep()) });
      case "in": return tf("exp_in", { ins: ins.map(pair).join(sep()) });
      case "stake": return t("exp_stake");
      case "unstake": return t("exp_unstake");
      case "claim": return t("exp_claim");
      case "addlp": return t("exp_addlp");
      case "removelp": return t("exp_removelp");
      case "call": {
        var note = (outs.length || ins.length) ? t("exp_call_note_has") : t("exp_call_note_none");
        return a.method ? tf("exp_call_m", { method: a.method, note: note }) : tf("exp_call_nm", { note: note });
      }
      default: return t("exp_unknown");
    }
  }

  /* ================= 单笔交易查询(前端直连) ================= */
  function queryTx(chain, hash) {
    if (chain.name === "Anubis") return queryTxAnubis(chain, hash);
    return queryTxPolygonRpc(chain, hash);
  }
  // Polygon: 直连 drpc RPC
  function queryTxPolygonRpc(chain, hash) {
    return rpc(chain.rpcUrl, "eth_getTransactionByHash", [hash]).then(function (tx) {
      if (!tx) return { chain: chain, status: "not_found" };
      return Promise.all([
        rpc(chain.rpcUrl, "eth_getTransactionReceipt", [hash]).catch(function () { return null; }),
        tx.blockNumber ? rpc(chain.rpcUrl, "eth_getBlockByNumber", [tx.blockNumber, false]).catch(function () { return null; }) : null,
        tx.to ? rpc(chain.rpcUrl, "eth_getCode", [tx.to, "latest"]).catch(function () { return null; }) : null // 判断To是合约还是个人
      ]).then(function (rb) { var nn = normalizeEvmTx(chain, tx, rb[0], rb[1]); nn.fromIsContract = false; nn.toIsContract = (rb[2] == null) ? null : (rb[2] && rb[2] !== "0x"); return { chain: chain, status: "found", n: nn }; });
    }).catch(function () { return { chain: chain, status: "error" }; });
  }
  function normalizeEvmTx(chain, tx, rc, blk) {
    var n = { chain: chain, hash: tx.hash, from: tx.from, to: tx.to, nonce: hex2num(tx.nonce),
      value: BigIntSafe(tx.value || "0x0"), input: tx.input || "0x", block: hex2num(tx.blockNumber),
      time: blk && blk.timestamp ? hex2num(blk.timestamp) : null, isCreation: !tx.to,
      status: rc ? (rc.status === "0x1" ? "ok" : (rc.status === "0x0" ? "fail" : "unknown")) : "unknown",
      gasUsed: rc ? BigIntSafe(rc.gasUsed || "0x0") : null,
      gasPrice: rc && rc.effectiveGasPrice ? BigIntSafe(rc.effectiveGasPrice) : BigIntSafe(tx.gasPrice || "0x0"),
      contractAddress: rc && rc.contractAddress ? rc.contractAddress : null,
      tokenChanges: [], approvals: [], logs: (rc && rc.logs) || [] };
    n.gasCost = (n.gasUsed != null) ? (n.gasUsed * n.gasPrice) : null;
    var sel = (n.input || "0x").slice(0, 10);
    // 合约创建的 input 是字节码,开头不是方法选择器,不当调用解析
    n.method = n.isCreation ? null : (SELECTORS[sel] ? SELECTORS[sel].n : (n.input && n.input.length > 10 ? null : ""));
    n.selector = (!n.isCreation && n.input && n.input.length >= 10) ? sel : "";
    decodeLogsInto(n, n.logs, function (lg) { return lg.address; }, { transfers: true, approvals: true });
    return n;
  }
  // Anubis: blockscout 已预解码
  function queryTxAnubis(chain, hash) {
    var B = chain.blockscout + "/transactions/" + hash;
    return getJson(B).then(function (tx) {
      if (!tx || tx._404 || (tx.message && !tx.hash)) return { chain: chain, status: "not_found" };
      return Promise.all([ getJson(B + "/token-transfers").catch(function () { return {}; }), getJson(B + "/logs").catch(function () { return {}; }) ]).then(function (extra) {
        return { chain: chain, status: "found", n: normalizeAnubisTx(chain, tx, extra[0], extra[1]) };
      });
    }).catch(function () { return { chain: chain, status: "error" }; });
  }
  function normalizeAnubisTx(chain, tx, tt, logs) {
    var n = { chain: chain, hash: tx.hash, from: tx.from && tx.from.hash, to: tx.to && tx.to.hash,
      fromIsContract: (tx.from && typeof tx.from.is_contract === "boolean") ? tx.from.is_contract : null, toIsContract: (tx.to && typeof tx.to.is_contract === "boolean") ? tx.to.is_contract : null, // 保留三态,缺字段=null(未知)
      nonce: tx.nonce, value: BigIntSafe(tx.value || "0"), input: tx.raw_input || "0x",
      block: tx.block_number || tx.block, time: tx.timestamp ? Math.floor(Date.parse(tx.timestamp) / 1000) : null,
      isCreation: !!(tx.created_contract), contractAddress: tx.created_contract && tx.created_contract.hash,
      status: tx.status === "ok" ? "ok" : (tx.status === "error" ? "fail" : "unknown"),
      gasUsed: BigIntSafe(tx.gas_used || "0"), gasPrice: BigIntSafe(tx.gas_price || "0"),
      method: (tx.created_contract) ? null : (tx.method || (tx.decoded_input && tx.decoded_input.method_call) || null),
      selector: (tx.created_contract) ? "" : (tx.decoded_input && tx.decoded_input.method_id ? "0x" + tx.decoded_input.method_id : ((tx.raw_input || "0x").slice(0, 10))),
      tokenChanges: [], approvals: [], logs: (logs && logs.items) || [], _blockscout: true };
    n.gasCost = (tx.fee && tx.fee.value) ? BigIntSafe(tx.fee.value) : (n.gasUsed * n.gasPrice);
    (tt && tt.items ? tt.items : []).forEach(function (it) {
      var tk = it.token || {}, raw = (it.total && it.total.value);
      try { var val = BigInt(raw); n.tokenChanges.push({ tokenAddr: tk.address, sym: tk.symbol, dec: decOf(tk.decimals), from: it.from && it.from.hash, to: it.to && it.to.hash, value: val }); }
      catch (e) { n.parseWarn = true; }
    });
    // blockscout 日志里解码 Approval(token-transfers不含授权)
    decodeLogsInto(n, n.logs, function (lg) { return lg.address && (lg.address.hash || lg.address); }, { transfers: false, approvals: true });
    return n;
  }

  /* ---------- 交易大白话 + 可信度 ---------- */
  function tokenAmt(tc) { return (tc.dec != null ? fmtShort(tc.value, tc.dec) : (tc.value.toString() + " " + t("token_min_unit"))) + " " + (tc.sym || t("token_unknown")); }
  function netChanges(n) { // 按地址+代币合约聚合净额(以合约地址为主键,防同名假币被错误合并)
    var map = {}, meta = {};
    n.tokenChanges.forEach(function (tc, i) {
      var tkey = tc.tokenAddr ? tc.tokenAddr.toLowerCase() : ("__noaddr_" + i); // 无合约地址时每条独立,绝不按symbol合并(防同名假币)
      meta[tkey] = { sym: tc.sym, dec: tc.dec, addr: tc.tokenAddr };
      function add(addr, sign) { if (!addr) return; var k = addr.toLowerCase() + "@@" + tkey; map[k] = (map[k] || 0n) + sign * tc.value; }
      add(tc.from, -1n); add(tc.to, 1n);
    });
    var rows = [];
    for (var k in map) { if (map[k] === 0n) continue; var p = k.split("@@"); var m = meta[p[1]] || {}; rows.push({ addr: p[0], sym: m.sym || t("token_unknown"), dec: m.dec, tokenAddr: m.addr, value: map[k] }); }
    return rows;
  }
  function amtOrRaw(v, dec) { return dec == null ? (v.toString() + " " + t("token_min_unit_unknown")) : fmtShort(v, dec); }
  function explainTxFull(n) {
    var conf = "c1";
    var initiator = (n.from || "").toLowerCase();
    var sel = (n.selector || "").toLowerCase(), selInfo = SELECTORS[sel] || null;
    var isSwapSel = selInfo && selInfo.t === "swap";
    var myApprovals = (n.approvals || []).filter(function (a) { return (a.owner || "").toLowerCase() === initiator; }); // 只算发起者本人的授权
    // pending: 有交易但没区块/没回执
    if (n.status === "unknown" && (n.block == null)) return { text: t("extx_pending"), conf: "c4", kind: t("kind_pending") };
    // 类型判定 → kindKey(稳定键)
    var kindKey, kconf, kindText;
    if (n.status === "fail") { kindKey = "fail"; kconf = "c1"; }
    else if (n.isCreation) { kindKey = "creation"; kconf = "c1"; }
    else if (myApprovals.length) { kindKey = "approve"; kconf = "c1"; }
    else {
      var out = n.tokenChanges.filter(function (t2) { return (t2.from || "").toLowerCase() === initiator; });
      var inc = n.tokenChanges.filter(function (t2) { return (t2.to || "").toLowerCase() === initiator; });
      if (isSwapSel && out.length && inc.length) { kindKey = "swap"; kconf = "c2"; }
      else if (out.length && inc.length) { kindKey = "multi"; kconf = "c3"; }
      else if (n.tokenChanges.length && (out.length || inc.length)) { kindKey = out.length ? "erc20_out" : "erc20_in"; kconf = "c1"; }
      else if (n.value > 0n && !n.tokenChanges.length) { kindKey = "native"; kconf = "c1"; }
      else if (n.method) { kindKey = "call"; kconf = "c2"; }
      else { kindKey = "unknown"; kconf = "c4"; }
    }
    kindText = kindKey === "call" ? tf("kind_call", { method: n.method }) : t("kind_" + kindKey);
    conf = kconf;
    // 生成解释
    if (n.status === "fail") return { text: t("extx_fail"), conf: "c1", kind: kindText };
    var s = tf("extx_from", { from: short(n.from) });
    if (n.isCreation) { s += tf("extx_creation", { addr: n.contractAddress ? tf("extx_creation_addr", { a: short(n.contractAddress) }) : "" }); }
    else if (myApprovals.length) {
      s += t("extx_approve_prefix");
      s += myApprovals.map(function (ap) { return tf("extx_approve_item", { spender: short(ap.spender), sym: (ap.sym || t("token_word")), amount: (ap.unlimited ? t("amount_unlimited") : (ap.dec != null ? fmtShort(ap.value, ap.dec) : ap.value.toString())) }); }).join(t("list_sep_semi"));
      s += (CUR.slice(0, 2) === "zh" ? "。" : ". "); // 句末标点(中文句号/英文句点)
      s += (myApprovals.some(function (a) { return a.unlimited; }) ? t("extx_approve_unlimited_note") : "");
    } else {
      var chg = netChanges(n).filter(function (r) { return r.addr === initiator; });
      var outR = chg.filter(function (r) { return r.value < 0n; }), inR = chg.filter(function (r) { return r.value > 0n; });
      if (kindKey === "swap") {
        s += tf("extx_swap", { pay: outR.map(function (r) { return amtOrRaw(-r.value, r.dec) + " " + r.sym; }).join(sep()), recv: inR.map(function (r) { return amtOrRaw(r.value, r.dec) + " " + r.sym; }).join(sep()) });
      } else if (outR.length && inR.length) {
        s += tf("extx_multi", { outs: outR.map(function (r) { return amtOrRaw(-r.value, r.dec) + " " + r.sym; }).join(sep()), ins: inR.map(function (r) { return amtOrRaw(r.value, r.dec) + " " + r.sym; }).join(sep()) });
      } else if (outR.length || inR.length) {
        if (outR.length) s += tf("extx_out", { outs: outR.map(function (r) { return amtOrRaw(-r.value, r.dec) + " " + r.sym; }).join(sep()) });
        if (inR.length) s += tf("extx_in", { ins: inR.map(function (r) { return amtOrRaw(r.value, r.dec) + " " + r.sym; }).join(sep()) });
      } else if (n.value > 0n) {
        s += tf("extx_native", { to: short(n.to), amt: fmtShort(n.value, 18), sym: n.chain.nativeSymbol });
      } else if (n.method) {
        s += tf("extx_call", { method: n.method }) + (n.tokenChanges.length ? "" : t("extx_call_note_none"));
      } else {
        s += t("extx_unknown");
      }
    }
    s += tf("extx_result", { result: (n.status === "ok" ? t("extx_result_ok") : t("extx_result_unconfirmed")) });
    if (n.status === "ok" && n.gasCost != null && n.gasCost > 0n) s += tf("extx_gas", { amt: fmtShort(n.gasCost, 18), sym: n.chain.nativeSymbol });
    return { text: s, conf: conf, kind: kindText };
  }

  /* ================= 渲染 ================= */
  function confBadge(c) { return '<span class="conf ' + c + '">' + esc(t("conf_" + c)) + "</span>"; }

  function renderAddress(res, addr) {
    var found = res.filter(function (r) { return r.status === "found"; });
    var errored = res.filter(function (r) { return r.status === "error"; });
    if (!found.length) {
      return '<div class="err">' + esc(errored.length ? t("addr_err_source") : t("addr_err_none")) + "</div>";
    }
    var html = "";
    found.forEach(function (r) {
      var w = r.w, ch = r.chain, lab = labelOf(addr);
      var acts = buildActivities(w, addr);
      // 7.1 概览
      html += '<div class="card"><h2>' + esc(t("card_overview")) + " · " + esc(ch.name) + "</h2>";
      html += '<div class="kv"><span class="k">' + esc(t("lbl_address")) + '</span><span class="v mono">' + esc(addr) + copyBtn(addr) + "</span></div>";
      if (lab && lab.name) html += '<div class="kv"><span class="k">' + esc(t("lbl_label")) + '</span><span class="v"><span class="tag green">' + esc(lab.name) + " · " + esc(lab.source) + "</span></span></div>";
      var knownC = lab && lab.name; // contracts.js 里已知的合约
      var typeHtml = w.isContract
        ? '<span class="tag">📄 ' + esc(t("tag_contract")) + '</span>' + (knownC ? "" : " " + esc(t("note_contract_code")))
        : '<span class="tag green">👤 ' + esc(t("tag_eoa_full")) + '</span> ' + esc(t("note_eoa"));
      html += '<div class="kv"><span class="k">' + esc(t("lbl_type")) + '</span><span class="v">' + typeHtml + "</span></div>";
      html += '<div class="kv"><span class="k">' + esc(t("lbl_native_balance")) + '</span><span class="v mono">' + esc((w.native && w.native.amount != null ? w.native.amount : 0) + " " + (w.native && w.native.sym || ch.nativeSymbol)) + "</span></div>";
      if (w.firstTs) html += '<div class="kv"><span class="k">' + esc(t("lbl_first_activity")) + '</span><span class="v">' + esc(tsFmt(w.firstTs)) + "</span></div>";
      html += '<div class="kv"><span class="k">' + esc(t("lbl_recent_activity")) + '</span><span class="v">' + esc(acts[0] ? tsFmt(acts[0].ts) : "-") + "</span></div>";
      html += '<div class="kv"><span class="k">' + esc(t("lbl_query_time")) + '</span><span class="v">' + esc(new Date().toLocaleString()) + "</span></div>";
      html += '<div class="kv"><span class="k"></span><span class="v"><a href="' + esc(ch.explorerAddr + addr) + '" target="_blank" rel="noopener noreferrer">' + esc(tf("open_explorer", { name: ch.name })) + "</a></span></div>";
      html += "</div>";
      // 7.2 资产
      var toks = (w.tokens || []).filter(function (t2) { return t2.amount > 0; });
      var trusted = toks.filter(isTrustedToken), spam = toks.filter(function (t2) { return !isTrustedToken(t2); });
      html += '<div class="card"><h2>' + esc(t("card_assets")) + " · " + esc(ch.name) + "</h2>";
      html += '<div class="kv"><span class="k">' + esc(w.native.sym || ch.nativeSymbol) + "</span><span class=\"v mono\">" + esc(String(w.native.amount)) + "</span></div>";
      if (!trusted.length && !spam.length) html += '<div class="src">' + esc(t("assets_none")) + "</div>";
      trusted.forEach(function (t2) { html += '<div class="kv"><span class="k">' + esc(t2.sym) + '</span><span class="v mono">' + esc(String(t2.amount)) + " " + esc(t2.sym) + (t2.addr ? " " + copyBtn(t2.addr) : "") + "</span></div>"; });
      if (spam.length) {
        html += '<a class="act-more" data-toggle="spam' + esc(ch.name) + '">' + esc(tf("spam_toggle", { n: spam.length })) + '</a><div id="spam' + esc(ch.name) + '" style="display:none;margin-top:6px">';
        spam.forEach(function (t2) { html += '<div class="kv"><span class="k" style="color:#7a857c">' + esc(t2.sym) + '</span><span class="v mono" style="color:#7a857c">' + esc(String(t2.amount)) + " " + esc(t2.sym) + (t2.addr ? " " + copyBtn(t2.addr) : "") + '</span></div>'; });
        html += '<div class="warnrow">' + esc(t("spam_warn")) + "</div></div>";
      }
      html += '<div class="src">' + esc(t("assets_no_price")) + "</div></div>";
      // 7.3 授权风险
      var appr = (w.approvals || []).filter(function (a) { return a.amount !== "0"; });
      if (appr.length) {
        html += '<div class="card"><h2>' + esc(t("card_approvals")) + " · " + esc(ch.name) + "</h2>";
        appr.slice(0, 12).forEach(function (a) {
          html += '<div class="kv"><span class="k">' + esc(a.token) + '</span><span class="v">' + esc(t("appr_grant_to")) + " " + addrHtml(a.spender, ch) + ' ' + (a.unlimited ? '<span class="tag red">' + esc(t("tag_unlimited")) + '</span>' : '<span class="tag">' + esc(tf("tag_limited", { amount: a.amount })) + "</span>") + "</span></div>";
        });
        if (appr.some(function (a) { return a.unlimited; })) html += '<div class="warnrow">' + t("appr_warn") + "</div>";
        html += "</div>";
      }
      // 13 概览统计
      var suc = 0, fail = 0, cin = 0, cout = 0, capp = 0, cswap = 0, cstk = 0;
      acts.forEach(function (a) { if (a.isError) fail++; else suc++; if (a.typeKey === "in") cin++; if (a.typeKey === "out") cout++; if (a.typeKey === "approve") capp++; if (a.typeKey === "swap") cswap++; if (a.typeKey === "stake" || a.typeKey === "unstake") cstk++; });
      html += '<div class="card"><h2>' + esc(tf("card_recent_overview", { n: acts.length })) + " · " + esc(ch.name) + "</h2>";
      html += '<div class="explain">' + esc(tf("recent_overview", { n: acts.length, suc: suc, fail: fail, cin: cin, cout: cout, cswap: cswap, capp: capp, cstk: cstk, note: (capp ? t("recent_overview_appr") : "") })) + "</div></div>";
      // 7.3 最近交易列表
      html += '<div class="card"><h2>' + esc(t("card_recent_tx")) + " · " + esc(ch.name) + "</h2>";
      var FILTERS = ["all", "in", "out", "contract", "swap", "approve", "stake", "fail"];
      html += '<div class="filters" data-chain="' + esc(ch.name) + '">' + FILTERS.map(function (f, i) { return '<button class="fbtn' + (i === 0 ? " on" : "") + '" data-f="' + esc(f) + '">' + esc(t("filter_" + f)) + "</button>"; }).join("") + "</div>";
      html += '<div class="actlist">';
      acts.forEach(function (a, idx) { html += activityHtml(a, ch, idx); });
      html += "</div>";
      html += '<div class="src">' + esc(tf("recent_source", { source: ch.source })) + "</div></div>";
    });
    if (errored.length) html += '<div class="warnrow">' + esc(tf("errored_warn_addr", { chains: errored.map(function (r) { return r.chain.name; }).join(sep()) })) + "</div>";
    return html;
  }
  function activityHtml(a, ch, idx) {
    var typeCls = a.isError ? "red" : ((a.typeKey === "in" || a.typeKey === "claim") ? "green" : ((a.typeKey === "approve" || a.typeKey === "swap") ? "blue" : ""));
    var h = '<div class="act" data-type="' + esc(a.typeKey) + '" data-err="' + (a.isError ? "1" : "0") + '">';
    h += '<div class="act-h"><span class="tag ' + typeCls + '">' + esc(typeLabel(a.typeKey)) + "</span>" + confBadge(a.conf || "c3");
    h += '<span class="t">' + (a.method ? esc(a.method) : "") + "</span>";
    h += '<span class="time">' + esc(tsFmt(a.ts)) + "</span></div>";
    h += '<div class="act-body">' + esc(explainActivity(a, ch)) + "</div>";
    // 资产流
    if ((a.outs && a.outs.length) || (a.ins && a.ins.length)) {
      h += '<div class="detail">';
      (a.outs || []).forEach(function (t2) { h += '<div class="flow"><span class="neg">- ' + esc(t2.amount + " " + (t2.token || t("token_word"))) + '</span> → <span class="mono">' + esc(t2.to || "-") + "</span></div>"; });
      (a.ins || []).forEach(function (t2) { h += '<div class="flow"><span class="pos">+ ' + esc(t2.amount + " " + (t2.token || t("token_word"))) + '</span> ← <span class="mono">' + esc(t2.from || "-") + "</span></div>"; });
      h += "</div>";
    }
    h += '<div style="margin-top:6px"><a class="mono" href="' + esc(ch.explorerTx + a.hash) + '" target="_blank" rel="noopener noreferrer" data-ev="explorer">' + esc(a.hash) + " ↗</a>" + copyBtn(a.hash) + "</div>";
    h += "</div>";
    return h;
  }

  function renderTx(res, hash) {
    var found = res.filter(function (r) { return r.status === "found"; });
    var errored = res.filter(function (r) { return r.status === "error"; });
    var notfound = res.filter(function (r) { return r.status === "not_found"; });
    if (!found.length) {
      if (errored.length && !notfound.length) return '<div class="err">' + esc(t("tx_err_source")) + "</div>";
      if (errored.length) return '<div class="err">' + esc(tf("tx_err_source_partial", { chains: errored.map(function (r) { return r.chain.name; }).join(sep()) })) + "</div>";
      return '<div class="err">' + esc(tf("tx_err_notfound", { chains: res.map(function (r) { return r.chain.name; }).join(sep()) })) + "</div>";
    }
    var html = "";
    found.forEach(function (r) {
      var n = r.n, ch = n.chain, ex = explainTxFull(n);
      var showConf = n.parseWarn && (ex.conf === "c1" || ex.conf === "c2") ? "c3" : ex.conf; // 有日志解析失败→可信度降级
      html += '<div class="card"><h2>' + esc(t("card_explain")) + " · " + esc(ch.name) + confBadge(showConf) + "</h2>";
      html += '<div class="explain">' + esc(ex.text) + "</div>";
      if (n.parseWarn) html += '<div class="warnrow">' + esc(t("parse_warn")) + "</div>";
      html += '<div class="src">' + esc(t("conf_note")) + "</div></div>";
      // 基础信息
      html += '<div class="card"><h2>' + esc(t("card_basic")) + " · " + esc(ch.name) + "</h2>";
      html += kv(t("lbl_status"), n.status === "ok" ? '<span class="tag green">' + esc(t("status_ok")) + '</span>' : (n.status === "fail" ? '<span class="tag red">' + esc(t("status_fail")) + '</span>' : '<span class="tag">' + esc(t("status_unknown")) + '</span>'));
      html += kv(t("lbl_type_tx"), esc(ex.kind));
      html += kv(t("lbl_network"), esc(tf("network_val", { name: ch.name, id: ch.chainId })));
      html += kv(t("lbl_txhash"), '<span class="mono">' + esc(hash) + "</span>" + copyBtn(hash));
      html += kv(t("lbl_time"), esc(tsFmt(n.time)));
      html += kv(t("lbl_block"), esc(String(n.block || "-")));
      html += kv("From", addrHtml(n.from, ch, n.fromIsContract === true ? "contract" : (n.fromIsContract === false ? "eoa" : null)));
      html += kv("To", n.isCreation ? tf("tx_creation_to", { addr: addrHtml(n.contractAddress, ch, "contract") }) : addrHtml(n.to, ch, n.toIsContract === true ? "contract" : (n.toIsContract === false ? "eoa" : null)));
      if (n.nonce != null) html += kv("Nonce", esc(String(n.nonce)));
      html += kv(t("lbl_native_amount"), esc(fmtBig(n.value, 18) + " " + ch.nativeSymbol));
      if (n.gasUsed != null) html += kv("Gas Used", esc(n.gasUsed.toString()));
      if (n.gasPrice) html += kv("Gas Price", esc(fmtBig(n.gasPrice, 9) + " Gwei"));
      if (n.gasCost != null) html += kv(t("lbl_fee"), esc(fmtBig(n.gasCost, 18) + " " + ch.nativeSymbol));
      html += kv("", '<a href="' + esc(ch.explorerTx + hash) + '" target="_blank" rel="noopener noreferrer" data-ev="explorer">' + esc(tf("open_explorer", { name: ch.name })) + "</a>");
      html += "</div>";
      // 资产变化
      var rows = netChanges(n);
      if (rows.length) {
        html += '<div class="card"><h2>' + esc(t("card_asset_changes")) + " · " + esc(ch.name) + "</h2>";
        rows.forEach(function (rw) {
          var sign = rw.value < 0n ? "neg" : "pos", pfx = rw.value < 0n ? "- " : "+ ";
          html += '<div class="flow"><span class="mono">' + esc(rw.addr) + '</span> <span class="' + sign + '">' + pfx + esc(amtOrRaw((rw.value < 0n ? -rw.value : rw.value), rw.dec) + " " + rw.sym) + (rw.tokenAddr ? " " + esc(rw.tokenAddr) : "") + "</span></div>";
        });
        html += "</div>";
      }
      // 合约调用(合约部署不显示,它的input是字节码非方法调用)
      if (!n.isCreation && (n.method || n.selector)) {
        html += '<div class="card"><h2>' + esc(t("card_contract_call")) + " · " + esc(ch.name) + "</h2>";
        html += kv(t("lbl_target_contract"), addrHtml(n.to, ch));
        html += kv(t("lbl_method"), n.method ? esc(n.method) : esc(t("method_unrecognized")));
        if (n.selector) html += kv(t("lbl_selector"), '<span class="mono">' + esc(n.selector) + "</span>");
        html += kv(t("lbl_abi_source"), esc(n.method ? t("abi_known") : t("abi_unverified")));
        html += "</div>";
      }
      // 授权变化(逐条,标明授权人是否=发起地址)
      if (n.approvals.length) {
        html += '<div class="card"><h2>' + esc(t("card_approval_changes")) + " · " + esc(ch.name) + "</h2>";
        n.approvals.forEach(function (a) {
          var byInitiator = (a.owner || "").toLowerCase() === (n.from || "").toLowerCase();
          html += kv(a.sym || t("token_word"), esc(t("appr_owner")) + " " + addrHtml(a.owner, ch) + (byInitiator ? '<span class="tag green">' + esc(t("tag_by_initiator")) + '</span>' : '<span class="tag">' + esc(t("tag_not_initiator")) + '</span>') + " " + esc(t("appr_to_spender")) + " " + addrHtml(a.spender, ch) + esc(t("appr_amount")) + " " + (a.unlimited ? '<span class="tag red">' + esc(t("tag_unlimited")) + '</span>' : esc(amtOrRaw(a.value, a.dec))));
        });
        html += '<div class="warnrow">' + t("appr_change_warn") + "</div></div>";
      }
      // 事件日志 + 原始数据(完整展开)
      var logs = n.logs || [];
      html += '<div class="card"><h2>' + esc(t("card_logs")) + " · " + esc(ch.name) + esc(tf("logs_count", { n: logs.length })) + "</h2>";
      logs.forEach(function (lg, li) {
        var ca = String((lg.address && (lg.address.hash || lg.address)) || lg.address || ""), tps = lg.topics || [];
        var t0 = (tps[0] || "").toLowerCase(), evName = (t0 === TRANSFER_TOPIC ? "Transfer" : (t0 === APPROVAL_TOPIC ? "Approval" : (lg.decoded && lg.decoded.method_call) || "")); // 已识别的事件标出来
        html += '<div class="act" style="margin-bottom:8px"><div class="act-h"><span class="tag blue">#' + li + (evName ? " " + esc(evName) : "") + '</span></div>';
        html += '<div class="kv"><span class="k">' + esc(t("lbl_contract")) + '</span><span class="v mono">' + esc(ca) + "</span></div>";
        tps.forEach(function (tp, ti) { html += '<div class="kv"><span class="k">topic' + ti + '</span><span class="v mono" style="font-size:11px">' + esc(tp) + "</span></div>"; });
        html += '<div class="kv"><span class="k">data</span><span class="v mono" style="font-size:11px;word-break:break-all">' + esc(lg.data || "0x") + "</span></div>";
        html += "</div>";
      });
      if (!logs.length) html += '<div class="src">' + esc(t("logs_none")) + "</div>";
      html += '<a class="act-more" data-toggle="raw' + esc(ch.name) + '">' + esc(t("expand_input")) + '</a>';
      html += '<div id="raw' + esc(ch.name) + '" style="display:none;margin-top:8px">';
      html += '<div class="src mono" style="word-break:break-all">' + esc(t("input_full")) + esc(n.input || "0x") + "</div>";
      html += '<div class="src">' + esc(tf("data_source", { source: ch.source })) + "</div></div></div>";
    });
    if (errored.length) html += '<div class="warnrow">' + esc(tf("errored_warn_tx", { chains: errored.map(function (r) { return r.chain.name; }).join(sep()) })) + "</div>";
    return html;
  }
  function kv(k, vHtml) { return '<div class="kv"><span class="k">' + esc(k) + '</span><span class="v">' + vHtml + "</span></div>"; }

  /* ================= UI 连接 ================= */
  var state = { net: "auto" };
  function initNetbar() {
    var bar = $("netbar"), opts = [{ v: "auto", t: t("net_auto") }].concat(CHAINS.filter(function (c) { return c.enabled; }).map(function (c) { return { v: c.name, t: c.name, dim: c.nativeSymbol }; }));
    bar.innerHTML = opts.map(function (o) { return '<button class="netbtn' + (o.v === state.net ? " on" : "") + '" data-net="' + esc(o.v) + '">' + esc(o.t) + (o.dim ? '<span class="dim">' + esc(o.dim) + "</span>" : "") + "</button>"; }).join("");
    bar.querySelectorAll(".netbtn").forEach(function (b) { b.addEventListener("click", function () { state.net = b.getAttribute("data-net"); bar.querySelectorAll(".netbtn").forEach(function (x) { x.classList.toggle("on", x === b); }); }); });
  }
  function setHint(msg, warn) { var h = $("hint"); h.textContent = msg || ""; h.className = "hint" + (warn ? " warn" : ""); }
  function targetChains() { return state.net === "auto" ? CHAINS.filter(function (c) { return c.enabled; }) : [chainByName(state.net)].filter(Boolean); }

  function run() {
    var q = $("q").value.trim().slice(0, MAX_Q);
    if (!q) { setHint(t("hint_empty")); return; }
    var type = detectType(q);
    if (type === "sensitive") {
      track("tool_error", { tool_name: "链上搜索", error_code: "sensitive" });
      $("results").innerHTML = '<div class="sensitive">' + t("sensitive_block") + "</div>";
      $("q").value = ""; setHint(""); return; // 绝不发送/记录/写URL
    }
    if (type === "invalid") { setHint(t("hint_invalid"), true); return; }
    var chains = targetChains();
    if (!chains.length) { setHint(t("hint_pick_net"), true); return; }
    // 交易哈希(0x+64)与私钥同形——发送前必须用户确认,绝不自动发
    if (type === "tx") { confirmTxThenQuery(q, chains); return; }
    doQuery("address", q, chains);
  }
  function confirmTxThenQuery(q, chains) {
    setHint("");
    $("results").innerHTML = '<div class="sensitive">' + t("tx_confirm_body") + '<div style="margin-top:12px"><button id="txConfirm" style="background:linear-gradient(120deg,#d4af37,#b8912a);color:#1a1400;border:0;border-radius:9px;padding:10px 18px;font-weight:800;cursor:pointer;font-family:inherit">' + esc(t("tx_confirm_btn")) + "</button></div></div>";
    var b = $("txConfirm"); if (b) b.addEventListener("click", function () { doQuery("tx", q, chains); });
  }
  function doQuery(type, q, chains) {
    var net = state.net; // 固定本次网络,防查询中途切换导致完成事件记错链
    track("tool_start", { tool_name: "链上搜索", target_type: type, network: net });
    setHint(""); $("go").disabled = true;
    $("results").innerHTML = '<div class="loading">' + esc(tf("loading", { chains: chains.map(function (c) { return c.name; }).join(" / ") })) + "</div>";
    var job = type === "address"
      ? Promise.all(chains.map(function (c) { return queryAddress(c, q); }))
      : Promise.all(chains.map(function (c) { return queryTx(c, q); }));
    job.then(function (res) {
      var html = type === "address" ? renderAddress(res, q) : renderTx(res, q);
      $("results").innerHTML = html;
      wireResults();
      var okCount = res.filter(function (r) { return r.status === "found"; }).length;
      if (okCount) track("tool_success", { tool_name: "链上搜索", target_type: type, network: net });
      else track("tool_error", { tool_name: "链上搜索", target_type: type, network: net, error_code: "no_result" });
    }).catch(function () {
      $("results").innerHTML = '<div class="err">' + esc(t("err_query")) + "</div>";
      track("tool_error", { tool_name: "链上搜索", target_type: type, network: net, error_code: "exception" });
    }).then(function () { $("go").disabled = false; });
  }

  function wireResults() {
    var root = $("results");
    root.querySelectorAll("[data-copy]").forEach(function (b) { b.addEventListener("click", function () { try { navigator.clipboard.writeText(b.getAttribute("data-copy")); b.textContent = t("copied"); setTimeout(function () { b.textContent = t("copy"); }, 1200); } catch (e) {} }); });
    root.querySelectorAll("[data-toggle]").forEach(function (a) { a.addEventListener("click", function () { var el = $(a.getAttribute("data-toggle")); if (el) { el.style.display = el.style.display === "none" ? "block" : "none"; track("tool_result_view", { tool_name: "链上搜索" }); } }); });
    root.querySelectorAll('[data-ev="explorer"]').forEach(function (a) { a.addEventListener("click", function () { track("open_block_explorer", { tool_name: "链上搜索" }); }); });
    root.querySelectorAll(".filters").forEach(function (bar) {
      var list = bar.parentNode.querySelector(".actlist");
      bar.querySelectorAll(".fbtn").forEach(function (b) {
        b.addEventListener("click", function () {
          bar.querySelectorAll(".fbtn").forEach(function (x) { x.classList.toggle("on", x === b); });
          var f = b.getAttribute("data-f"); // 稳定键,与语言无关
          list.querySelectorAll(".act").forEach(function (row) {
            var ty = row.getAttribute("data-type"), err = row.getAttribute("data-err") === "1", show = true;
            if (f === "in") show = ty === "in";
            else if (f === "out") show = ty === "out";
            else if (f === "contract") show = (["call", "stake", "unstake", "claim", "addlp", "removelp", "unknown"].indexOf(ty) >= 0);
            else if (f === "swap") show = ty === "swap";
            else if (f === "approve") show = ty === "approve";
            else if (f === "stake") show = (ty === "stake" || ty === "unstake");
            else if (f === "fail") show = err;
            row.style.display = show ? "" : "none";
          });
        });
      });
    });
  }

  function bootDetect() {
    $("q").addEventListener("input", function () {
      var box = $("q"); if (box.value.length > MAX_Q) box.value = box.value.slice(0, MAX_Q); // 写回截断,防超长粘贴
      var q = box.value.trim();
      if (!q) { setHint(""); return; }
      var ty = detectType(q);
      if (ty === "sensitive") setHint(t("hint_sensitive"), true);
      else if (ty === "address") setHint(t("hint_addr"));
      else if (ty === "tx") setHint(t("hint_tx"));
      else setHint("");
    });
    $("q").addEventListener("keydown", function (e) { if (e.key === "Enter") run(); });
    $("go").addEventListener("click", run);
  }

  /* ---------- 外壳文案 + 语言切换 ---------- */
  function applyShell() {
    document.documentElement.lang = CUR;
    var h1 = document.querySelector("h1"); if (h1) h1.textContent = t("title_h1"); // 纯文本+emoji,不用innerHTML(缩小语言包被篡改时的注入面)
    var sub = document.querySelector(".sub"); if (sub) sub.textContent = t("sub");
    var safe = document.querySelector(".safe"); if (safe) safe.innerHTML = t("safe");
    var q = $("q"); if (q) q.setAttribute("placeholder", t("q_placeholder"));
    var go = $("go"); if (go) go.textContent = t("go");
    try { document.title = (CUR.slice(0, 2) === "zh") ? document.title : "On-chain Search · Web3Origin"; } catch (e) {}
  }
  // 监听 <html lang> 变化(i18n.js 抽屉切换语言时会改它)→ 换语言就 reload,让 app.js 用新语言重新渲染
  function watchLang() {
    try {
      var mo = new MutationObserver(function () {
        var lang = document.documentElement.getAttribute("lang") || "zh-CN";
        if (lang !== CUR) { try { localStorage.setItem("web3origin_locale", lang); } catch (e) {} location.reload(); } // reload 前先落库,防某处只改 lang 未持久化导致刷新后语言回退
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    } catch (e) {}
  }

  /* ================= 启动 ================= */
  // 调试/测试钩子(只读渲染函数,生产无副作用)
  window.__OS = { CHAINS: CHAINS, chainByName: chainByName, renderAddress: renderAddress, renderTx: renderTx, wireResults: wireResults, buildActivities: buildActivities, t: t, tf: tf, setLocale: function (c) { CUR = c; } };

  function boot() {
    loadPack(CUR).then(function () {
      buildLabels();
      applyShell();
      initNetbar();
      bootDetect();
      watchLang();
      track("tool_open", { tool_name: "链上搜索" });
      // 支持 ?q= 直接查, &net=Polygon|Anubis|auto 选网络
      // 安全:URL 里只接受"地址"(0x+40,公开无害);0x+64 与私钥同形,绝不从 URL 自动填/自动查(避免暴露到CDN日志/浏览器历史)
      try {
        var sp = new URLSearchParams(location.search), np = sp.get("net");
        if (np && (np === "auto" || chainByName(np))) { state.net = np; initNetbar(); }
        var qp = (sp.get("q") || "").trim(); if (qp && EVM_ADDR.test(qp) && !isSensitive(qp)) { $("q").value = qp; run(); }
      } catch (e) {}
    });
  }
  boot();
})();
