/* Web3Origin 链上搜索与交易大白话解读工具
 * 只查公开链上数据:地址走 Worker /wallet(Etherscan V2/blockscout,key在服务端),单笔交易前端直连公共RPC/blockscout(免key)。
 * 敏感内容(助记词/私钥/密码)只在本地拦截,绝不发送/记录/写URL/写日志/写统计。
 */
(function () {
  "use strict";
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
  function fmtShort(v, dec) { var s = fmtBig(v, dec); var d = s.indexOf("."); if (d < 0) return s; var out = s.slice(0, d + 5); if (parseFloat(out) === 0 && BigIntSafe(v) > 0n) return "少量"; return out; }
  function BigIntSafe(v) { try { return BigInt(v); } catch (e) { return 0n; } }
  function fromDec(numStr, dec) { return fmtBig(BigIntSafe(numStr), dec); } // etherscan返回十进制整数字符串
  function tsFmt(ts) { if (!ts) return "-"; try { return new Date(ts * 1000).toLocaleString(); } catch (e) { return "-"; } }
  function tsDate(ts) { if (!ts) return ""; try { return new Date(ts * 1000).toLocaleDateString(); } catch (e) { return ""; } }
  function hex2num(h) { try { return parseInt(h, 16); } catch (e) { return null; } }
  function topicAddr(t) { return t ? ("0x" + String(t).slice(-40)) : ""; }
  function isHex32(x) { return typeof x === "string" && /^0x[0-9a-fA-F]{64}$/.test(x); }
  function decOf(raw) { if (raw == null) return 18; var d = Number(raw); return (isFinite(d) && d >= 0 && d <= 36) ? d : 18; } // decimals=0合法,非法值退18
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
  function copyBtn(text) { return '<button class="copy" data-copy="' + esc(text) + '">复制</button>'; }
  function $(id) { return document.getElementById(id); }

  // 地址标签(来源标注;禁止把未确认地址标成官方/黑客/骗子)
  var LABELS = {};
  (function buildLabels() {
    try {
      var C = window.CONTRACTS || [];
      C.forEach(function (c) { if (c.addr) LABELS[c.addr.toLowerCase()] = { name: c.name || c.cname || "", chain: c.chain, source: "Web3Origin核实", verified: !!c.verified }; });
    } catch (e) {}
    for (var a in KNOWN_TOKENS) if (!LABELS[a]) LABELS[a] = { name: KNOWN_TOKENS[a].sym + " 代币", source: "Web3Origin核实", verified: true };
  })();
  function labelOf(addr) { if (!addr) return null; return LABELS[addr.toLowerCase()] || null; }
  function addrHtml(addr, chain) {
    if (!addr) return "-";
    var lab = labelOf(addr), url = (chain ? chain.explorerAddr : "https://polygonscan.com/address/") + addr;
    var s = '<a class="mono" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(short(addr)) + "</a>";
    if (lab && lab.name) s += ' <span class="tag' + (lab.verified ? " green" : "") + '">' + esc(lab.name) + " · " + esc(lab.source) + "</span>";
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
  function fetchWallet(chain) { return chain._wallet ? Promise.resolve(chain._wallet) : chain; }
  function queryAddress(chain, addr) {
    return getJson(chain.walletApi + addr).then(function (w) {
      if (!w || w.ok === false) return { chain: chain, status: "error" };
      return { chain: chain, status: "found", w: w };
    }).catch(function () { return { chain: chain, status: "error" }; });
  }

  // 把 txs[] 与 transfers[] 按 hash 合并成"活动"
  function buildActivities(w, addr) {
    var lo = addr.toLowerCase(), byHash = {};
    (w.txs || []).forEach(function (t) { byHash[t.hash] = { hash: t.hash, ts: t.ts, from: t.from, to: t.to, method: t.method || "", isError: t.isError, mid: t.mid, transfers: [], initiator: (t.from || "").toLowerCase() === lo }; });
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
  function isTrustedToken(t) { return (t.addr && KNOWN_TOKENS[t.addr.toLowerCase()]) || TRUSTED_SYM[t.sym]; }
  function classify(a, lo) {
    var trs = a.transfers || [], outs = trs.filter(function (t) { return t.dir === "out"; }), ins = trs.filter(function (t) { return t.dir === "in"; });
    a.outs = outs; a.ins = ins;
    var m = (a.method || "").toLowerCase(), sel = SELECTORS[a.mid] || null, mt = sel ? sel.t : "";
    var conf = "c3"; // 默认"可能"
    if (a.isError) { a.type = "失败交易"; a.conf = "c1"; return; }
    if (/approve|permit/.test(m) || mt === "approve") { a.type = "授权 Approve"; a.conf = a.method ? "c2" : "c3"; return; }
    if (mt === "swap") { a.type = "兑换 Swap"; a.conf = "c2"; return; } // 只认已知swap选择器,不靠方法名字面(防伪造名)
    if (outs.length && ins.length) { a.type = "多向转移"; a.conf = "c3"; return; } // 既转出又转入,但无swap方法,不硬判兑换
    if (mt === "stake" || /stake\b/.test(m)) { a.type = "质押"; a.conf = "c2"; return; }
    if (mt === "unstake" || /unstake/.test(m)) { a.type = "解除质押"; a.conf = "c2"; return; }
    if (mt === "claim" || /claim|reward|harvest/.test(m)) { a.type = "领取奖励"; a.conf = "c2"; return; }
    if (mt === "addlp" || /addliquidity/.test(m)) { a.type = "添加流动性"; a.conf = "c2"; return; }
    if (mt === "removelp" || /removeliquidity/.test(m)) { a.type = "移除流动性"; a.conf = "c2"; return; }
    if (outs.length && !ins.length) { a.type = "转出"; a.conf = "c2"; return; }
    if (ins.length && !outs.length) { a.type = "转入"; a.conf = "c2"; return; }
    if (a.method) { a.type = "合约调用"; a.conf = "c3"; return; }
    a.type = "未知合约交互"; a.conf = "c4";
  }
  function explainActivity(a, chain) {
    var outs = a.outs || [], ins = a.ins || [];
    function pair(t) { return (t.amount) + " " + (t.token || "代币"); }
    if (a.type === "失败交易") return "这笔交易失败了，操作没有按预期完成。网络仍执行并验证了请求，所以可能已扣除了 Gas 手续费。";
    if (a.type === "授权 Approve") return "这不是直接转币，而是一次 Token 授权——你允许某个合约在额度内动用你的代币。请确认是你信任的合约；不用了可以在 revoke.cash 撤销。";
    if (a.type === "兑换 Swap") {
      var o = outs[0], i = ins[0];
      if (o && i) return "这看起来是一笔兑换：你支付了约 " + pair(o) + "，收到约 " + pair(i) + "。中间若有多次转账，属于兑换合约与流动池的自动处理，不是你的多笔独立操作。";
      return "这看起来是一笔兑换，中间有多次代币流动，属于兑换合约的自动处理。";
    }
    if (a.type === "多向转移") return "这笔交易里这个地址既有转出（" + outs.map(pair).join("、") + "）又有转入（" + ins.map(pair).join("、") + "）。缺少已验证方法，无法确认是兑换、质押换凭证还是加减流动性，点浏览器可进一步核对。";
    if (a.type === "转出") return "你从这个地址转出了 " + (outs.map(pair).join("、")) + "，交易已上链。";
    if (a.type === "转入") return "这是一笔转入：有地址向你转来了 " + (ins.map(pair).join("、")) + "，你是接收方。";
    if (a.type === "质押") return "这是一次质押相关操作，把代币存入了质押/合约。";
    if (a.type === "解除质押") return "这是一次解除质押操作，把之前质押的代币取回。";
    if (a.type === "领取奖励") return "这是一次领取操作，从合约领取奖励/解锁的代币。";
    if (a.type === "添加流动性") return "这是一次添加流动性操作，把两种代币存入了流动池。";
    if (a.type === "移除流动性") return "这是一次移除流动性操作，从流动池取回代币。";
    if (a.type === "合约调用") return "这笔交易调用了合约" + (a.method ? "「" + a.method + "」" : "") + "。" + (outs.length || ins.length ? "伴随的资产变化见下方。" : "没有明显的代币转移。");
    return "这笔交易调用了一个暂未识别的合约，缺少已验证 ABI，无法准确判断具体功能。可确认的是交易已上链，资产变化见下方（如有）。";
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
        tx.blockNumber ? rpc(chain.rpcUrl, "eth_getBlockByNumber", [tx.blockNumber, false]).catch(function () { return null; }) : null
      ]).then(function (rb) { return { chain: chain, status: "found", n: normalizeEvmTx(chain, tx, rb[0], rb[1]) }; });
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
  function tokenAmt(tc) { return (tc.dec != null ? fmtShort(tc.value, tc.dec) : (tc.value.toString() + " (最小单位)")) + " " + (tc.sym || "未知代币"); }
  function netChanges(n) { // 按地址+代币合约聚合净额(以合约地址为主键,防同名假币被错误合并)
    var map = {}, meta = {};
    n.tokenChanges.forEach(function (tc, i) {
      var tkey = tc.tokenAddr ? tc.tokenAddr.toLowerCase() : ("__noaddr_" + i); // 无合约地址时每条独立,绝不按symbol合并(防同名假币)
      meta[tkey] = { sym: tc.sym, dec: tc.dec, addr: tc.tokenAddr };
      function add(addr, sign) { if (!addr) return; var k = addr.toLowerCase() + "@@" + tkey; map[k] = (map[k] || 0n) + sign * tc.value; }
      add(tc.from, -1n); add(tc.to, 1n);
    });
    var rows = [];
    for (var k in map) { if (map[k] === 0n) continue; var p = k.split("@@"); var m = meta[p[1]] || {}; rows.push({ addr: p[0], sym: m.sym || "未知代币", dec: m.dec, tokenAddr: m.addr, value: map[k] }); }
    return rows;
  }
  function amtOrRaw(v, dec) { return dec == null ? (v.toString() + " (最小单位·精度未知)") : fmtShort(v, dec); }
  function explainTxFull(n) {
    var parts = [], conf = "c1";
    var initiator = (n.from || "").toLowerCase();
    var sel = (n.selector || "").toLowerCase(), selInfo = SELECTORS[sel] || null;
    var isSwapSel = selInfo && selInfo.t === "swap";
    var myApprovals = (n.approvals || []).filter(function (a) { return (a.owner || "").toLowerCase() === initiator; }); // 只算发起者本人的授权
    // pending: 有交易但没区块/没回执
    if (n.status === "unknown" && (n.block == null)) return { text: "节点已经看到这笔交易，但它还没有被打包确认（pending）。现在还不能确定成功还是失败，也不能说已经扣了手续费。请稍后再查。", conf: "c4", kind: "待确认(pending)" };
    // 类型判定
    var kind, kconf;
    if (n.status === "fail") { kind = "失败交易"; kconf = "c1"; }
    else if (n.isCreation) { kind = "合约部署"; kconf = "c1"; }
    else if (myApprovals.length) { kind = "授权 Approve"; kconf = "c1"; }
    else {
      var out = n.tokenChanges.filter(function (t) { return (t.from || "").toLowerCase() === initiator; });
      var inc = n.tokenChanges.filter(function (t) { return (t.to || "").toLowerCase() === initiator; });
      if (isSwapSel && out.length && inc.length) { kind = "Token 兑换"; kconf = "c2"; }
      else if (out.length && inc.length) { kind = "多种 Token 流入流出（可能是兑换/质押换凭证/加减流动性等）"; kconf = "c3"; }
      else if (n.tokenChanges.length && (out.length || inc.length)) { kind = out.length ? "ERC-20 转出" : "ERC-20 转入"; kconf = "c1"; }
      else if (n.value > 0n && !n.tokenChanges.length) { kind = "原生币转账"; kconf = "c1"; }
      else if (n.method) { kind = "合约调用（" + n.method + "）"; kconf = "c2"; }
      else { kind = "未知合约交互"; kconf = "c4"; }
    }
    conf = kconf;
    // 生成解释
    if (n.status === "fail") return { text: "这笔交易失败了，资产操作没有按预期完成。但网络仍执行并验证了请求，所以可能已扣除了 Gas 手续费。失败原因需结合合约返回信息进一步判断。", conf: "c1", kind: kind };
    var s = "发起地址 " + short(n.from) + " ";
    if (n.isCreation) { s += "部署了一个新合约" + (n.contractAddress ? "（" + short(n.contractAddress) + "）" : "") + "。"; }
    else if (myApprovals.length) {
      s += "进行了 Token 授权：";
      s += myApprovals.map(function (ap) { return "允许 " + short(ap.spender) + " 动用它的 " + (ap.sym || "代币") + "（额度" + (ap.unlimited ? "【无限额度】" : (ap.dec != null ? fmtShort(ap.value, ap.dec) : ap.value.toString())) + "）"; }).join("；");
      s += "。" + (myApprovals.some(function (a) { return a.unlimited; }) ? "其中有无限额度授权——该合约以后可在额度内调用你的代币，请确认是你信任的合约，不用了建议到 revoke.cash 撤销。" : "");
    } else {
      var chg = netChanges(n).filter(function (r) { return r.addr === initiator; });
      var outR = chg.filter(function (r) { return r.value < 0n; }), inR = chg.filter(function (r) { return r.value > 0n; });
      if (kind === "Token 兑换") {
        s += "进行了一笔兑换：支付了 " + outR.map(function (r) { return amtOrRaw(-r.value, r.dec) + " " + r.sym; }).join("、") + "，收到了 " + inR.map(function (r) { return amtOrRaw(r.value, r.dec) + " " + r.sym; }).join("、") + "。中间若有多次转账，属于兑换合约与流动池的自动处理，不代表多笔独立操作。";
      } else if (outR.length && inR.length) {
        s += "既有转出（" + outR.map(function (r) { return amtOrRaw(-r.value, r.dec) + " " + r.sym; }).join("、") + "）又有转入（" + inR.map(function (r) { return amtOrRaw(r.value, r.dec) + " " + r.sym; }).join("、") + "）。缺少已验证的方法/ABI，无法确认到底是兑换、质押换凭证还是加减流动性，请点浏览器进一步核对。";
      } else if (outR.length || inR.length) {
        if (outR.length) s += "转出了 " + outR.map(function (r) { return amtOrRaw(-r.value, r.dec) + " " + r.sym; }).join("、") + "；";
        if (inR.length) s += "收到了 " + inR.map(function (r) { return amtOrRaw(r.value, r.dec) + " " + r.sym; }).join("、") + "；";
      } else if (n.value > 0n) {
        s += "向 " + short(n.to) + " 转出了 " + fmtShort(n.value, 18) + " " + n.chain.nativeSymbol + "。";
      } else if (n.method) {
        s += "调用了合约方法「" + n.method + "」。" + (n.tokenChanges.length ? "" : "本次没有明显的代币转移。");
      } else {
        s += "调用了一个暂未识别的合约。目前可确认：交易已上链、支付了 Gas；由于缺少已验证 ABI，暂时无法准确判断具体功能。";
      }
    }
    s += "交易" + (n.status === "ok" ? "成功" : "结果未确认（未取到回执，以浏览器为准）") + "。";
    if (n.status === "ok" && n.gasCost != null && n.gasCost > 0n) s += "支付了约 " + fmtShort(n.gasCost, 18) + " " + n.chain.nativeSymbol + " 的网络手续费。";
    return { text: s, conf: conf, kind: kind };
  }

  /* ================= 渲染 ================= */
  var CONF_CN = { c1: "已确认", c2: "高可信推断", c3: "可能", c4: "无法确认" };
  function confBadge(c) { return '<span class="conf ' + c + '">' + CONF_CN[c] + "</span>"; }

  function renderAddress(res, addr) {
    var found = res.filter(function (r) { return r.status === "found"; });
    var errored = res.filter(function (r) { return r.status === "error"; });
    if (!found.length) {
      return '<div class="err">' + (errored.length ? "所选网络的数据源暂时不可用（超时/限流），无法确认这个地址的情况。请稍后重试，或换一条链。" : "没有查询到这个地址的数据。") + "</div>";
    }
    var html = "";
    found.forEach(function (r) {
      var w = r.w, ch = r.chain, lab = labelOf(addr);
      var acts = buildActivities(w, addr);
      // 7.1 概览
      html += '<div class="card"><h2>📇 地址概览 · ' + esc(ch.name) + "</h2>";
      html += '<div class="kv"><span class="k">地址</span><span class="v mono">' + esc(addr) + copyBtn(addr) + "</span></div>";
      if (lab && lab.name) html += '<div class="kv"><span class="k">标签</span><span class="v"><span class="tag green">' + esc(lab.name) + " · " + esc(lab.source) + "</span></span></div>";
      html += '<div class="kv"><span class="k">类型</span><span class="v">' + (w.isContract ? "有代码（合约，或被 7702 委托的钱包）" : "目前没有合约代码（一般是普通钱包）") + "</span></div>";
      html += '<div class="kv"><span class="k">原生余额</span><span class="v mono">' + esc((w.native && w.native.amount != null ? w.native.amount : 0) + " " + (w.native && w.native.sym || ch.nativeSymbol)) + "</span></div>";
      if (w.firstTs) html += '<div class="kv"><span class="k">首次活动</span><span class="v">' + esc(tsFmt(w.firstTs)) + "</span></div>";
      html += '<div class="kv"><span class="k">最近活动</span><span class="v">' + esc(acts[0] ? tsFmt(acts[0].ts) : "-") + "</span></div>";
      html += '<div class="kv"><span class="k">查询时间</span><span class="v">' + esc(new Date().toLocaleString()) + "</span></div>";
      html += '<div class="kv"><span class="k"></span><span class="v"><a href="' + esc(ch.explorerAddr + addr) + '" target="_blank" rel="noopener noreferrer">在 ' + esc(ch.name) + " 区块浏览器打开 ↗</a></span></div>";
      html += "</div>";
      // 7.2 资产
      var toks = (w.tokens || []).filter(function (t) { return t.amount > 0; });
      var trusted = toks.filter(isTrustedToken), spam = toks.filter(function (t) { return !isTrustedToken(t); });
      html += '<div class="card"><h2>💰 资产概览 · ' + esc(ch.name) + "</h2>";
      html += '<div class="kv"><span class="k">' + esc(w.native.sym || ch.nativeSymbol) + "</span><span class=\"v mono\">" + esc(String(w.native.amount)) + "</span></div>";
      if (!trusted.length && !spam.length) html += '<div class="src">未查询到有余额的主要 Token。</div>';
      trusted.forEach(function (t) { html += '<div class="kv"><span class="k">' + esc(t.sym) + '</span><span class="v mono">' + esc(String(t.amount)) + " " + esc(t.sym) + (t.addr ? " " + copyBtn(t.addr) : "") + "</span></div>"; });
      if (spam.length) {
        html += '<a class="act-more" data-toggle="spam' + esc(ch.name) + '">⚠️ 另有 ' + spam.length + ' 个疑似垃圾/空投 Token 已隐藏，点击显示全部 ▾</a><div id="spam' + esc(ch.name) + '" style="display:none;margin-top:6px">';
        spam.forEach(function (t) { html += '<div class="kv"><span class="k" style="color:#7a857c">' + esc(t.sym) + '</span><span class="v mono" style="color:#7a857c">' + esc(String(t.amount)) + " " + esc(t.sym) + (t.addr ? " " + copyBtn(t.addr) : "") + '</span></div>'; });
        html += '<div class="warnrow">这些 Token 不在已知清单里，可能是垃圾空投——即使名称含「空投」「领取」也不代表可信资产，请勿点击其中的任何链接或授权。</div></div>';
      }
      html += '<div class="src">仅显示可靠查询到的余额；暂无可靠价格来源，故不换算美元估值（估值以实际链上交易价格为准）。</div></div>';
      // 7.3 授权风险
      var appr = (w.approvals || []).filter(function (a) { return a.amount !== "0"; });
      if (appr.length) {
        html += '<div class="card"><h2>🔐 授权与风险 · ' + esc(ch.name) + "</h2>";
        appr.slice(0, 12).forEach(function (a) {
          html += '<div class="kv"><span class="k">' + esc(a.token) + '</span><span class="v mono">授权给 ' + esc(short(a.spender)) + ' ' + (a.unlimited ? '<span class="tag red">无限额度</span>' : '<span class="tag">有限额度</span>') + "</span></div>";
        });
        if (appr.some(function (a) { return a.unlimited; })) html += '<div class="warnrow">⚠️ 存在【无限额度】授权。若某个被授权合约你已不再使用，建议到 <a href="https://revoke.cash/" target="_blank" rel="noopener noreferrer">revoke.cash</a> 撤销，降低风险。请自行确认被授权合约是否可信。</div>';
        html += "</div>";
      }
      // 13 概览统计
      var suc = 0, fail = 0, cin = 0, cout = 0, capp = 0, cswap = 0, cstk = 0;
      acts.forEach(function (a) { if (a.isError) fail++; else suc++; if (a.type === "转入") cin++; if (a.type === "转出") cout++; if (a.type === "授权 Approve") capp++; if (a.type === "兑换 Swap") cswap++; if (/质押/.test(a.type)) cstk++; });
      html += '<div class="card"><h2>📊 最近 ' + acts.length + " 笔交易概览 · " + esc(ch.name) + "</h2>";
      html += '<div class="explain">这个地址最近 ' + acts.length + " 笔活动中，成功 " + suc + " 笔、失败 " + fail + " 笔；其中转入 " + cin + "、转出 " + cout + "、兑换 " + cswap + "、授权 " + capp + "、质押相关 " + cstk + " 笔。" + (capp ? "出现过授权操作，请确认被授权合约是否可信。" : "") + " 统计仅覆盖本次查询到的最近记录。</div></div>";
      // 7.3 最近交易列表
      html += '<div class="card"><h2>🧾 最近交易 · ' + esc(ch.name) + "</h2>";
      html += '<div class="filters" data-chain="' + esc(ch.name) + '">' + ["全部", "转入", "转出", "合约交互", "兑换", "授权", "质押", "失败"].map(function (f, i) { return '<button class="fbtn' + (i === 0 ? " on" : "") + '" data-f="' + esc(f) + '">' + f + "</button>"; }).join("") + "</div>";
      html += '<div class="actlist">';
      acts.forEach(function (a, idx) { html += activityHtml(a, ch, idx); });
      html += "</div>";
      html += '<div class="src">数据来源：' + esc(ch.source) + "；标准 RPC 无法按地址列历史，本列表来自区块浏览器/索引接口，展示最近约 20 条。「加载更多」为后续版本（Phase-2）。</div></div>";
    });
    if (errored.length) html += '<div class="warnrow">⚠️ ' + errored.map(function (r) { return r.chain.name; }).join("、") + " 链数据源暂时不可用，未计入上方结果（不代表该地址在这些链上没有交易）。</div>";
    return html;
  }
  function activityHtml(a, ch, idx) {
    var typeCls = a.isError ? "red" : (/转入|领取/.test(a.type) ? "green" : (/授权|兑换/.test(a.type) ? "blue" : ""));
    var h = '<div class="act" data-type="' + esc(a.type) + '" data-err="' + (a.isError ? "1" : "0") + '">';
    h += '<div class="act-h"><span class="tag ' + typeCls + '">' + esc(a.type) + "</span>" + confBadge(a.conf || "c3");
    h += '<span class="t">' + (a.method ? esc(a.method) : "") + "</span>";
    h += '<span class="time">' + esc(tsFmt(a.ts)) + "</span></div>";
    h += '<div class="act-body">' + esc(explainActivity(a, ch)) + "</div>";
    // 资产流
    if ((a.outs && a.outs.length) || (a.ins && a.ins.length)) {
      h += '<div class="detail">';
      (a.outs || []).forEach(function (t) { h += '<div class="flow"><span class="neg">- ' + esc(t.amount + " " + (t.token || "代币")) + '</span> → ' + esc(short(t.to)) + "</div>"; });
      (a.ins || []).forEach(function (t) { h += '<div class="flow"><span class="pos">+ ' + esc(t.amount + " " + (t.token || "代币")) + '</span> ← ' + esc(short(t.from)) + "</div>"; });
      h += "</div>";
    }
    h += '<div style="margin-top:6px"><a class="mono" href="' + esc(ch.explorerTx + a.hash) + '" target="_blank" rel="noopener noreferrer" data-ev="explorer">' + esc(short(a.hash)) + " ↗</a></div>";
    h += "</div>";
    return h;
  }

  function renderTx(res, hash) {
    var found = res.filter(function (r) { return r.status === "found"; });
    var errored = res.filter(function (r) { return r.status === "error"; });
    var notfound = res.filter(function (r) { return r.status === "not_found"; });
    if (!found.length) {
      if (errored.length && !notfound.length) return '<div class="err">数据源暂时不可用（超时/限流），无法确认这笔交易。请稍后重试。</div>';
      if (errored.length) return '<div class="err">' + errored.map(function (r) { return r.chain.name; }).join("、") + " 链数据源暂时不可用；其余链未查到这笔交易。请稍后重试。</div>";
      return '<div class="err">已启用的网络（' + res.map(function (r) { return r.chain.name; }).join("、") + "）都没有查到这笔交易 —— 可能在其他链、尚未打包，或这串不是交易哈希。</div>";
    }
    var html = "";
    found.forEach(function (r) {
      var n = r.n, ch = n.chain, ex = explainTxFull(n);
      var showConf = n.parseWarn && (ex.conf === "c1" || ex.conf === "c2") ? "c3" : ex.conf; // 有日志解析失败→可信度降级
      html += '<div class="card"><h2>💬 大白话解读 · ' + esc(ch.name) + confBadge(showConf) + "</h2>";
      html += '<div class="explain">' + esc(ex.text) + "</div>";
      if (n.parseWarn) html += '<div class="warnrow">⚠️ 有部分事件日志无法解析，上面的资产变化可能不完整，请以区块浏览器为准。</div>';
      html += '<div class="src">可信度说明：已确认=来自回执/事件日志/已知代币；高可信推断=资产变化与方法吻合；可能=仅部分证据；无法确认=缺少已验证 ABI。以下为原始依据。</div></div>';
      // 基础信息
      html += '<div class="card"><h2>🧾 基础信息 · ' + esc(ch.name) + "</h2>";
      html += kv("状态", n.status === "ok" ? '<span class="tag green">成功</span>' : (n.status === "fail" ? '<span class="tag red">失败</span>' : '<span class="tag">未知</span>'));
      html += kv("类型", esc(ex.kind));
      html += kv("网络", esc(ch.name) + "（Chain ID " + ch.chainId + "）");
      html += kv("交易哈希", '<span class="mono">' + esc(hash) + "</span>" + copyBtn(hash));
      html += kv("时间", esc(tsFmt(n.time)));
      html += kv("区块", esc(String(n.block || "-")));
      html += kv("From", addrHtml(n.from, ch) + copyBtn(n.from || ""));
      html += kv("To", n.isCreation ? ("（合约创建 → " + addrHtml(n.contractAddress, ch) + "）") : (addrHtml(n.to, ch) + copyBtn(n.to || "")));
      if (n.nonce != null) html += kv("Nonce", esc(String(n.nonce)));
      html += kv("原生金额", esc(fmtBig(n.value, 18) + " " + ch.nativeSymbol));
      if (n.gasUsed != null) html += kv("Gas Used", esc(n.gasUsed.toString()));
      if (n.gasPrice) html += kv("Gas Price", esc(fmtBig(n.gasPrice, 9) + " Gwei"));
      if (n.gasCost != null) html += kv("手续费", esc(fmtBig(n.gasCost, 18) + " " + ch.nativeSymbol));
      html += kv("", '<a href="' + esc(ch.explorerTx + hash) + '" target="_blank" rel="noopener noreferrer" data-ev="explorer">在 ' + esc(ch.name) + " 区块浏览器打开 ↗</a>");
      html += "</div>";
      // 资产变化
      var rows = netChanges(n);
      if (rows.length) {
        html += '<div class="card"><h2>🔄 资产变化（按地址）· ' + esc(ch.name) + "</h2>";
        rows.forEach(function (rw) {
          var sign = rw.value < 0n ? "neg" : "pos", pfx = rw.value < 0n ? "- " : "+ ";
          html += '<div class="flow"><span class="mono">' + esc(short(rw.addr)) + '</span> <span class="' + sign + '">' + pfx + esc(amtOrRaw((rw.value < 0n ? -rw.value : rw.value), rw.dec) + " " + rw.sym) + "</span></div>";
        });
        html += "</div>";
      }
      // 合约调用(合约部署不显示,它的input是字节码非方法调用)
      if (!n.isCreation && (n.method || n.selector)) {
        html += '<div class="card"><h2>📞 合约调用 · ' + esc(ch.name) + "</h2>";
        html += kv("目标合约", addrHtml(n.to, ch));
        html += kv("方法", n.method ? esc(n.method) : "（未识别）");
        if (n.selector) html += kv("方法选择器", '<span class="mono">' + esc(n.selector) + "</span>");
        html += kv("ABI 来源", n.method ? "已知选择器 / 浏览器解码" : "未验证 ABI，仅按资产变化推断");
        html += "</div>";
      }
      // 授权变化(逐条,标明授权人是否=发起地址)
      if (n.approvals.length) {
        html += '<div class="card"><h2>🔐 授权变化 · ' + esc(ch.name) + "</h2>";
        n.approvals.forEach(function (a) {
          var byInitiator = (a.owner || "").toLowerCase() === (n.from || "").toLowerCase();
          html += kv(a.sym || "代币", "授权人 " + addrHtml(a.owner, ch) + (byInitiator ? '<span class="tag green">发起地址本人</span>' : '<span class="tag">非发起地址</span>') + " → 被授权合约 " + addrHtml(a.spender, ch) + "；额度 " + (a.unlimited ? '<span class="tag red">无限额度</span>' : esc(amtOrRaw(a.value, a.dec))));
        });
        html += '<div class="warnrow">仅当「授权人」是你本人时才是你的授权。如果是你的授权且已不再使用，建议到 <a href="https://revoke.cash/" target="_blank" rel="noopener noreferrer">revoke.cash</a> 撤销。</div></div>';
      }
      // 事件日志 + 原始数据(折叠)
      html += '<div class="card"><h2>📜 事件日志与原始数据 · ' + esc(ch.name) + "</h2>";
      html += '<div class="kv"><span class="k">事件数</span><span class="v">' + (n.logs ? n.logs.length : 0) + " 条</span></div>";
      html += '<a class="act-more" data-toggle="raw' + esc(ch.name) + '">展开原始 Input Data / 依据 ▾</a>';
      html += '<div id="raw' + esc(ch.name) + '" style="display:none;margin-top:8px">';
      html += '<div class="src mono" style="word-break:break-all">Input: ' + esc((n.input || "0x").slice(0, 400)) + ((n.input || "").length > 400 ? "…" : "") + "</div>";
      html += '<div class="src">数据来源：' + esc(ch.source) + "</div></div></div>";
    });
    if (errored.length) html += '<div class="warnrow">⚠️ ' + errored.map(function (r) { return r.chain.name; }).join("、") + " 链数据源暂时不可用（不代表交易不存在）。</div>";
    return html;
  }
  function kv(k, vHtml) { return '<div class="kv"><span class="k">' + esc(k) + '</span><span class="v">' + vHtml + "</span></div>"; }

  /* ================= UI 连接 ================= */
  var state = { net: "auto" };
  function initNetbar() {
    var bar = $("netbar"), opts = [{ v: "auto", t: "自动查找" }].concat(CHAINS.filter(function (c) { return c.enabled; }).map(function (c) { return { v: c.name, t: c.name, dim: c.nativeSymbol }; }));
    bar.innerHTML = opts.map(function (o) { return '<button class="netbtn' + (o.v === state.net ? " on" : "") + '" data-net="' + esc(o.v) + '">' + esc(o.t) + (o.dim ? '<span class="dim">' + esc(o.dim) + "</span>" : "") + "</button>"; }).join("");
    bar.querySelectorAll(".netbtn").forEach(function (b) { b.addEventListener("click", function () { state.net = b.getAttribute("data-net"); bar.querySelectorAll(".netbtn").forEach(function (x) { x.classList.toggle("on", x === b); }); }); });
  }
  function setHint(msg, warn) { var h = $("hint"); h.textContent = msg || ""; h.className = "hint" + (warn ? " warn" : ""); }
  function targetChains() { return state.net === "auto" ? CHAINS.filter(function (c) { return c.enabled; }) : [chainByName(state.net)].filter(Boolean); }

  function run() {
    var q = $("q").value.trim().slice(0, MAX_Q);
    if (!q) { setHint("请输入地址或交易哈希"); return; }
    var type = detectType(q);
    if (type === "sensitive") {
      track("onchain_search_error", { reason: "sensitive" });
      $("results").innerHTML = '<div class="sensitive"><b>⚠️ 请不要在任何网站输入助记词、私钥或钱包密码。</b>Web3Origin 只需要公开的钱包地址或交易哈希。如果刚才输入的是真实私钥或助记词，请立即停止操作，并在安全设备上把资产转移到新钱包。</div>';
      $("q").value = ""; setHint(""); return; // 绝不发送/记录/写URL
    }
    if (type === "invalid") { setHint("请输入有效的钱包地址、合约地址（0x+40位）或交易哈希（0x+64位）", true); return; }
    var chains = targetChains();
    if (!chains.length) { setHint("请选择网络", true); return; }
    // 交易哈希(0x+64)与私钥同形——发送前必须用户确认,绝不自动发
    if (type === "tx") { confirmTxThenQuery(q, chains); return; }
    doQuery("address", q, chains);
  }
  function confirmTxThenQuery(q, chains) {
    setHint("");
    $("results").innerHTML = '<div class="sensitive"><b>⚠️ 请先确认这是「交易哈希」，不是私钥</b>你输入的是 0x + 64 位十六进制——<b>交易哈希和钱包私钥的格式完全一样</b>，本工具无法从格式上区分。如果这其实是你的私钥，<b>千万不要点下面的按钮</b>（点了会把它发送到区块链节点），请立即到安全设备把资产转移到新钱包。<div style="margin-top:12px"><button id="txConfirm" style="background:linear-gradient(120deg,#d4af37,#b8912a);color:#1a1400;border:0;border-radius:9px;padding:10px 18px;font-weight:800;cursor:pointer;font-family:inherit">我确认这是公开交易哈希，查询</button></div></div>';
    var b = $("txConfirm"); if (b) b.addEventListener("click", function () { doQuery("tx", q, chains); });
  }
  function doQuery(type, q, chains) {
    track("onchain_search_submit", { type: type, net: state.net });
    setHint(""); $("go").disabled = true;
    $("results").innerHTML = '<div class="loading">正在从 ' + chains.map(function (c) { return c.name; }).join(" / ") + " 链读取真实链上数据…</div>";
    var job = type === "address"
      ? Promise.all(chains.map(function (c) { return queryAddress(c, q); }))
      : Promise.all(chains.map(function (c) { return queryTx(c, q); }));
    job.then(function (res) {
      var html = type === "address" ? renderAddress(res, q) : renderTx(res, q);
      $("results").innerHTML = html;
      wireResults();
      var okCount = res.filter(function (r) { return r.status === "found"; }).length;
      track(okCount ? "onchain_search_success" : "onchain_search_error", { type: type, net: state.net, results: okCount });
    }).catch(function () {
      $("results").innerHTML = '<div class="err">查询过程中出错，请稍后重试。</div>';
      track("onchain_search_error", { type: type, reason: "exception" });
    }).then(function () { $("go").disabled = false; });
  }

  function wireResults() {
    var root = $("results");
    root.querySelectorAll("[data-copy]").forEach(function (b) { b.addEventListener("click", function () { try { navigator.clipboard.writeText(b.getAttribute("data-copy")); b.textContent = "已复制"; setTimeout(function () { b.textContent = "复制"; }, 1200); } catch (e) {} }); });
    root.querySelectorAll("[data-toggle]").forEach(function (a) { a.addEventListener("click", function () { var el = $(a.getAttribute("data-toggle")); if (el) { el.style.display = el.style.display === "none" ? "block" : "none"; track("onchain_transaction_expand", {}); } }); });
    root.querySelectorAll('[data-ev="explorer"]').forEach(function (a) { a.addEventListener("click", function () { track("onchain_explorer_click", {}); }); });
    root.querySelectorAll(".filters").forEach(function (bar) {
      var list = bar.parentNode.querySelector(".actlist");
      bar.querySelectorAll(".fbtn").forEach(function (b) {
        b.addEventListener("click", function () {
          bar.querySelectorAll(".fbtn").forEach(function (x) { x.classList.toggle("on", x === b); });
          var f = b.getAttribute("data-f");
          list.querySelectorAll(".act").forEach(function (row) {
            var ty = row.getAttribute("data-type"), err = row.getAttribute("data-err") === "1", show = true;
            if (f === "转入") show = ty === "转入"; else if (f === "转出") show = ty === "转出";
            else if (f === "合约交互") show = /合约|质押|解除质押|领取|流动性|未知/.test(ty); else if (f === "兑换") show = ty === "兑换 Swap";
            else if (f === "授权") show = ty === "授权 Approve"; else if (f === "质押") show = /质押/.test(ty); else if (f === "失败") show = err;
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
      var t = detectType(q);
      if (t === "sensitive") setHint("⚠️ 检测到疑似敏感内容，请勿输入助记词/私钥/密码", true);
      else if (t === "address") setHint("检测到 EVM 地址（0x+40位）");
      else if (t === "tx") setHint("检测到可能的交易哈希（0x+64位）");
      else setHint("");
    });
    $("q").addEventListener("keydown", function (e) { if (e.key === "Enter") run(); });
    $("go").addEventListener("click", run);
  }

  // 调试/测试钩子(只读渲染函数,生产无副作用)
  window.__OS = { CHAINS: CHAINS, chainByName: chainByName, renderAddress: renderAddress, renderTx: renderTx, wireResults: wireResults, buildActivities: buildActivities };
  initNetbar(); bootDetect(); track("onchain_search_open", {});
  // 支持 ?q= 直接查, &net=Polygon|Anubis|auto 选网络
  // 安全:URL 里只接受"地址"(0x+40,公开无害);0x+64 与私钥同形,绝不从 URL 自动填/自动查(避免暴露到CDN日志/浏览器历史)
  try {
    var sp = new URLSearchParams(location.search), np = sp.get("net");
    if (np && (np === "auto" || chainByName(np))) { state.net = np; initNetbar(); }
    var qp = (sp.get("q") || "").trim(); if (qp && EVM_ADDR.test(qp) && !isSensitive(qp)) { $("q").value = qp; run(); }
  } catch (e) {}
})();
