/* Web3Origin 全站搜索中心 —— 引擎 + 弹层 + 交互
 * 按需加载(首次打开才拉索引)、按语言加载、防抖、同义词、地址/哈希识别、敏感拦截、键盘操作、安全高亮、统计。
 * 安全:搜索词长度限制;高亮用文本节点不用innerHTML;所有字段esc;URL白名单(站内/)+外链noopener。
 * 公开API: window.W3OSearch.open() / .renderInto(el, query, opts)
 */
(function () {
  "use strict";
  var IDX_BASE = "/search-index/", MAX_Q = 120, MAX_RESULTS = 40, DEBOUNCE = 200;
  var _index = null, _lang = null, _loading = false, _scrollY = 0, _cache = {};
  var EVM_ADDR = /^0x[0-9a-fA-F]{40}$/, TX_HASH = /^0x[0-9a-fA-F]{64}$/;

  function siteLang() { var s = window.SITE_LANG || "zh"; return s === "zh" ? "zh-CN" : (s === "zh-TW" ? "zh-TW" : (s === "en" ? "en" : "en")); }
  function isZh() { return siteLang() !== "en"; }
  function T(zh, en) { return isZh() ? zh : en; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function track(name, props) { try { if (window.W3OAnalytics && window.W3OAnalytics.track) window.W3OAnalytics.track(name, props || {}); } catch (e) {} }
  function short(a) { a = String(a || ""); return a.length > 12 ? a.slice(0, 6) + "…" + a.slice(-4) : a; }
  // 运行端URL守卫(纵深防御,即便索引被绕过也不点到伪协议/外站):只放行站内绝对路径(禁//与\),否则退化为不可跳转
  function safeUrl(u) { u = String(u || ""); return /^\/(?![\/\\])[^\s\\]*$/.test(u) ? u : ""; }

  /* ---- 敏感内容检测(绝不发送/记录原文) ---- */
  function isSensitive(q) {
    var s = String(q || "").trim();
    var words = s.split(/\s+/).filter(Boolean);
    if ([12, 15, 18, 21, 24].indexOf(words.length) >= 0 && words.every(function (w) { return /^[a-z]{3,10}$/.test(w); })) return true;
    if (/^[0-9a-fA-F]{64}$/.test(s)) return true;   // 裸64位十六进制=疑似私钥(0x+64是交易哈希另处理)
    if (/(私钥|助记词|mnemonic|seed\s*phrase|private\s*key|钱包密码|wallet\s*password|支付密码|api[_\s-]?key|secret\s*key)/i.test(s)) return true;
    return false;
  }

  /* ---- 索引加载(按语言,缓存,失败不崩) ---- */
  function loadIndex(cb) {
    var l = siteLang();
    if (_cache[l]) { _index = _cache[l]; _lang = l; cb(_index); return; }
    if (_loading) { setTimeout(function () { loadIndex(cb); }, 120); return; }
    _loading = true;
    fetch(IDX_BASE + l + ".json").then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { _cache[l] = d; _index = d; _lang = l; _loading = false; cb(d); })
      .catch(function () { _loading = false; cb(null); });
  }

  /* ---- 同义词展开 ---- */
  function expand(terms) {
    var syn = window.W3O_SYNONYMS || {}, out = terms.slice();
    terms.forEach(function (t) {
      for (var k in syn) { var low = [k].concat(syn[k]).map(function (x) { return String(x).toLowerCase(); }); if (low.indexOf(t) >= 0) low.forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); }); }
    });
    return out;
  }

  /* ---- 打分排序 ---- */
  function scoreItem(item, q, terms) {
    var title = (item.title || "").toLowerCase(), desc = (item.description || "").toLowerCase(), content = (item.content || "").toLowerCase();
    var meta = ((item.tags || []).join(" ") + " " + (item.aliases || []).join(" ")).toLowerCase(), addr = String(item.address || "").toLowerCase();
    var s = 0;
    if (addr && addr === q) s += 1000;
    if (title === q) s += 500;
    else if (title.indexOf(q) === 0) s += 200;
    else if (title.indexOf(q) >= 0) s += 120;
    terms.forEach(function (t) { if (!t) return; if (title.indexOf(t) >= 0) s += 60; if (meta.indexOf(t) >= 0) s += 40; if (desc.indexOf(t) >= 0) s += 20; if (content.indexOf(t) >= 0) s += 8; });
    if (item.updated_at) s += 1;
    return s;
  }

  function runSearch(rawQ, opts) {
    opts = opts || {};
    var d = _index || []; if (!d.length) return [];
    var q = String(rawQ || "").trim().toLowerCase().slice(0, MAX_Q);
    var baseTerms = q.split(/\s+/).filter(Boolean), terms = expand(baseTerms), res = [];
    d.forEach(function (item) {
      if (opts.type && opts.type !== "all" && item.type !== opts.type) return;
      if (opts.langAll !== true && opts.lang && item.language !== opts.lang) { /* 单语言由索引文件保证,忽略 */ }
      var sc = scoreItem(item, q, terms); if (sc > 0) res.push({ i: item, s: sc });
    });
    if (baseTerms.length > 1) {
      res = res.filter(function (r) {
        var hay = ((r.i.title || "") + " " + (r.i.description || "") + " " + (r.i.content || "") + " " + (r.i.tags || []).join(" ") + " " + (r.i.aliases || []).join(" ")).toLowerCase();
        return baseTerms.every(function (t) { return expand([t]).some(function (g) { return hay.indexOf(g) >= 0; }); });
      });
    }
    if (opts.sort === "updated") res.sort(function (a, b) { return String(b.i.updated_at || "").localeCompare(String(a.i.updated_at || "")); });
    else if (opts.sort === "type") res.sort(function (a, b) { return String(a.i.type).localeCompare(String(b.i.type)) || b.s - a.s; });
    else res.sort(function (a, b) { return b.s - a.s || String(b.i.updated_at || "").localeCompare(String(a.i.updated_at || "")); });
    return res.map(function (r) { return r.i; }).slice(0, MAX_RESULTS);
  }

  /* ---- 类型中文名/图标 ---- */
  var TYPE_META = { contract: ["合约", "Contract", "📜"], evidence: ["链上证据", "Evidence", "🔗"], course: ["课程", "Course", "🎓"], video: ["视频", "Video", "🎬"], faq: ["FAQ", "FAQ", "❓"], wiki: ["百科", "Wiki", "📖"], page: ["页面", "Page", "📄"], tool: ["工具", "Tool", "🛠"], daily: ["链上日报", "Daily", "📰"] };
  function typeName(t) { var m = TYPE_META[t]; return m ? (isZh() ? m[0] : m[1]) : t; }
  function typeIcon(t) { var m = TYPE_META[t]; return m ? m[2] : "•"; }

  /* ---- 安全高亮(文本节点,不用innerHTML拼查询) ---- */
  function highlight(text, q) {
    text = String(text || ""); var frag = document.createDocumentFragment();
    if (!q) { frag.appendChild(document.createTextNode(text)); return frag; }
    var low = text.toLowerCase(), lq = q.toLowerCase(), i = 0, idx;
    while ((idx = low.indexOf(lq, i)) >= 0 && lq) {
      if (idx > i) frag.appendChild(document.createTextNode(text.slice(i, idx)));
      var mk = document.createElement("mark"); mk.className = "s-hl"; mk.textContent = text.slice(idx, idx + lq.length); frag.appendChild(mk);
      i = idx + lq.length;
    }
    if (i < text.length) frag.appendChild(document.createTextNode(text.slice(i)));
    return frag;
  }

  /* ---- 渲染单条结果(安全) ---- */
  function resultRow(item, q, kbIndex) {
    var a = document.createElement("a");
    var su = safeUrl(item.url); a.className = "s-row"; if (su) a.href = su; else { a.setAttribute("aria-disabled", "true"); a.style.pointerEvents = "none"; } a.setAttribute("role", "option"); a.dataset.kb = kbIndex;
    var head = document.createElement("div"); head.className = "s-row-head";
    var tag = document.createElement("span"); tag.className = "s-type"; tag.textContent = typeIcon(item.type) + " " + typeName(item.type); head.appendChild(tag);
    var title = document.createElement("span"); title.className = "s-title"; title.appendChild(highlight(item.title, q)); head.appendChild(title);
    if (item.verified) { var v = document.createElement("span"); v.className = "s-verified"; v.textContent = "✓" + T("已核实", "verified"); head.appendChild(v); }
    a.appendChild(head);
    if (item.description) { var d = document.createElement("div"); d.className = "s-desc"; d.appendChild(highlight(item.description, q)); a.appendChild(d); }
    var meta = document.createElement("div"); meta.className = "s-meta";
    var bits = [];
    if (item.type === "contract" || item.type === "evidence") { if (item.address) bits.push(short(item.address)); if (item.network) bits.push(item.network); }
    if (item.category) bits.push(item.category);
    if (item.updated_at) bits.push(item.updated_at);
    meta.textContent = bits.join(" · "); if (bits.length) a.appendChild(meta);
    a.addEventListener("click", function () { track("search_result_click", { content_type: item.type, target: (item.url || "").slice(0, 120) }); });
    return a;
  }

  /* ---- 交易哈希链上只读查询(点击才发请求,防私钥误发;两链并发) ---- */
  var TX_CHAINS = [
    { cn: "Polygon", en: "Polygon", id: 137, rpc: "https://polygon.drpc.org", sym: "POL", tx: "https://polygonscan.com/tx/", addr: "https://polygonscan.com/address/",
      tokens: [{ sym: "LGNS", a: "0xeB51D9A39AD5EEF215dC0Bf39a8821ff804A0F01", dec: 9 }, { sym: "sLGNS", a: "0x99a57E6C8558BC6689f894e068733ADf83C19725", dec: 9 }] },
    { cn: "Anubis", en: "Anubis", id: 6714, rpc: "https://rpc.anubispace.org", sym: "DAI", tx: "https://browser.anubispace.org/tx/", addr: "https://browser.anubispace.org/address/",
      tokens: [{ sym: "LGNS", a: "0x4D1D808a081FdAc440703b3765FC61f8028C06B8", dec: 9 }] }
  ];
  function rpcCall(url, method, params) {
    var ctrl = (typeof AbortController !== "undefined") ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 12000) : null; // 12秒超时,防RPC挂起导致永久pending
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: method, params: params }), signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (j) { if (j.error) throw new Error((j.error && j.error.message) || "RPC error"); return j.result; })
      .then(function (res) { if (timer) clearTimeout(timer); return res; }, function (err) { if (timer) clearTimeout(timer); throw err; });
  }
  function fmtAmt(hexWei) { return fmtUnit(hexWei, 18); }
  function fmtUnit(hex, dec) { try { var v = BigInt(hex || "0x0"); if (dec <= 0) return v.toString(); var s = v.toString().padStart(dec + 1, "0"); var i = s.slice(0, -dec), f = s.slice(-dec).replace(/0+$/, ""); return i + (f ? "." + f : ""); } catch (e) { return "?"; } }
  function bnPos(hex) { try { return hex && hex !== "0x" && BigInt(hex) > 0n; } catch (e) { return false; } }
  // 大白话用:余额截断到4位小数,灰尘(截断后为0但确有余额)显示"少量"
  function amtWord(hex, dec, sym) { var full = fmtUnit(hex, dec); var dot = full.indexOf("."); var num = dot >= 0 ? full.slice(0, dot + 5) : full; if (bnPos(hex) && parseFloat(num) === 0) return T("少量 " + sym, "a dust amount of " + sym); return num + " " + sym; }
  // 三态:found=明确查到 / not_found=该链明确无此交易(result:null) / error=查询失败(网络/限流/超时,≠不存在)
  function queryOneChain(chain, hash) {
    return rpcCall(chain.rpc, "eth_getTransactionByHash", [hash]).then(function (tx) {
      if (!tx) return { chain: chain, status: "not_found" };
      return Promise.all([
        rpcCall(chain.rpc, "eth_getTransactionReceipt", [hash]).catch(function () { return null; }),
        tx.blockNumber ? rpcCall(chain.rpc, "eth_getBlockByNumber", [tx.blockNumber, false]).catch(function () { return null; }) : null
      ]).then(function (rb) { return { chain: chain, status: "found", tx: tx, receipt: rb[0], block: rb[1] }; });
    }).catch(function (e) { return { chain: chain, status: "error", error: (e && e.message) || "error" }; });
  }
  function queryTxOnChain(hash) { return Promise.all(TX_CHAINS.map(function (c) { return queryOneChain(c, hash); })); }
  function txRow(label, valueNode) { var r = document.createElement("div"); r.className = "s-tx-row"; var k = document.createElement("span"); k.className = "s-tx-k"; k.textContent = label; var v = document.createElement("span"); v.className = "s-tx-v"; if (typeof valueNode === "string") v.textContent = valueNode; else v.appendChild(valueNode); r.appendChild(k); r.appendChild(v); return r; }
  function addrLink(chain, a) { if (!a) { var s = document.createElement("span"); s.textContent = "-"; return s; } var el = document.createElement("a"); el.href = chain.addr + a; el.target = "_blank"; el.rel = "noopener noreferrer"; el.textContent = a; el.className = "s-tx-addr"; return el; }
  function renderTxData(results, box, hash) {
    box.textContent = "";
    var found = results.filter(function (r) { return r.status === "found"; });
    var errored = results.filter(function (r) { return r.status === "error"; });
    found.forEach(function (f) {
      var tx = f.tx, rc = f.receipt, blk = f.block, ch = f.chain;
      var card = document.createElement("div"); card.className = "s-tx-card";
      var hd = document.createElement("div"); hd.className = "s-tx-hd"; hd.textContent = T("在 " + ch.cn + " 链查到(只读)", "Found on " + ch.en + " (read-only)"); card.appendChild(hd);
      var status = rc ? (rc.status === "0x1" ? T("✓ 成功", "✓ Success") : (rc.status === "0x0" ? T("✗ 失败", "✗ Failed") : T("未知", "Unknown"))) : T("未知(未取到回执)", "Unknown");
      card.appendChild(txRow(T("状态", "Status"), status));
      card.appendChild(txRow(T("区块", "Block"), tx.blockNumber ? String(parseInt(tx.blockNumber, 16)) : "-"));
      card.appendChild(txRow(T("时间", "Time"), blk && blk.timestamp ? new Date(parseInt(blk.timestamp, 16) * 1000).toLocaleString() : T("-(未取到区块)", "-")));
      card.appendChild(txRow("From", addrLink(ch, tx.from)));
      var toNode = tx.to ? addrLink(ch, tx.to) : (function () { var s = document.createElement("span"); s.textContent = rc && rc.contractAddress ? T("合约创建 → ", "Contract created → ") + rc.contractAddress : T("合约创建", "Contract creation"); return s; })();
      card.appendChild(txRow("To", toNode));
      card.appendChild(txRow(T("金额", "Amount"), fmtAmt(tx.value) + " " + ch.sym));
      if (rc && rc.gasUsed) card.appendChild(txRow("Gas", String(parseInt(rc.gasUsed, 16))));
      if (fmtAmt(tx.value) === "0") { var note = document.createElement("div"); note.className = "s-tx-note"; note.textContent = T("原生转账为 0,可能是合约调用或代币(ERC-20)转账,代币明细请点下方浏览器查看。", "Native transfer is 0 — likely a contract call or ERC-20 transfer; see the explorer for token details."); card.appendChild(note); }
      var exp = document.createElement("a"); exp.href = ch.tx + hash; exp.target = "_blank"; exp.rel = "noopener noreferrer"; exp.className = "s-chip"; exp.textContent = T("在 " + ch.cn + " 浏览器打开", "Open in " + ch.en + " explorer"); card.appendChild(exp);
      var ex = document.createElement("div"); ex.className = "s-tx-explain"; ex.textContent = "💬 " + explainTx(f); card.appendChild(ex); // 大白话
      box.appendChild(card);
    });
    // 仅当所有链都"明确无此交易"(无一失败)才敢说不存在
    if (!found.length && !errored.length) { var n = document.createElement("div"); n.className = "s-tx-none"; n.textContent = T("Polygon 和 Anubis 两条链都没查到这笔交易 —— 可能在其他链、尚未打包,或这串并非交易哈希。", "Not found on either Polygon or Anubis — it may be on another chain, not yet mined, or not a transaction hash."); box.appendChild(n); }
    // 有链查询失败:如实说明,绝不把"失败"谎报成"不存在"
    if (errored.length) { var er = document.createElement("div"); er.className = "s-tx-err"; er.textContent = "⚠️ " + T(errored.map(function (r) { return r.chain.cn; }).join("、") + " 链查询失败(网络/限流/超时),无法确认这笔交易在该链是否存在,请点下方重试或用浏览器链接核对。", errored.map(function (r) { return r.chain.en; }).join(", ") + " query failed (network/rate-limit/timeout) — can't confirm existence there; retry below or check via explorer."); box.appendChild(er); }
    if (found.length) { var src = document.createElement("div"); src.className = "s-tx-note"; src.textContent = T("数据来自各链公共 RPC 只读查询,仅供参考。", "Data from each chain's public RPC (read-only), for reference."); box.appendChild(src); }
    return errored.length > 0; // 有失败→调用方保留重试按钮
  }
  // 交易大白话一句话
  function explainTx(f) {
    var tx = f.tx, rc = f.receipt, blk = f.block, ch = f.chain;
    var st = rc ? (rc.status === "0x1" ? "ok" : "fail") : "unknown"; // 无回执=结果未知,不谎报成功
    var hasVal = bnPos(tx.value);
    var kind = tx.to ? (hasVal ? T("转账", "transfer") : T("合约调用", "contract call")) : T("合约创建", "contract creation");
    var when = blk && blk.timestamp ? new Date(parseInt(blk.timestamp, 16) * 1000).toLocaleDateString() : "";
    var head = st === "ok" ? T("这是一笔成功的" + kind + "交易,", "A successful " + kind + " ") : (st === "fail" ? T("这是一笔失败的" + kind + "交易,", "A failed " + kind + " ") : T("这是一笔" + kind + "交易(执行结果暂时没取到,以浏览器为准),", "A " + kind + " (result not yet confirmed — see explorer), "));
    var s = head + (when ? T("发生在 " + when + ",", "on " + when + ", ") : "") + T("在 " + ch.cn + " 链上。", "on " + ch.en + ". ");
    if (!tx.to) s += T("它创建了一个新合约" + (rc && rc.contractAddress ? "(" + short(rc.contractAddress) + ")" : "") + "。", "It created a new contract" + (rc && rc.contractAddress ? " (" + short(rc.contractAddress) + ")" : "") + ". ");
    s += hasVal ? T("转了 " + amtWord(tx.value, 18, ch.sym) + "。", "Moved " + amtWord(tx.value, 18, ch.sym) + ". ") : T("没有原生币转账(多半是代币转账或合约操作,代币明细看浏览器)。", "No native transfer (likely a token transfer or contract op — see explorer for tokens).");
    return s;
  }

  /* ---- 地址链上只读查询(点击才发请求;两链并发) ---- */
  function queryAddrOnChain(chain, addr) {
    return Promise.all([
      rpcCall(chain.rpc, "eth_getCode", [addr, "latest"]),
      rpcCall(chain.rpc, "eth_getBalance", [addr, "latest"]),
      rpcCall(chain.rpc, "eth_getTransactionCount", [addr, "latest"])
    ]).then(function (base) {
      var toks = (chain.tokens || []).map(function (t) {
        var data = "0x70a08231" + addr.slice(2).toLowerCase().padStart(64, "0"); // balanceOf(addr)
        return rpcCall(chain.rpc, "eth_call", [{ to: t.a, data: data }, "latest"]).then(function (r) { return { sym: t.sym, dec: t.dec, bal: r, ok: true }; }).catch(function () { return { sym: t.sym, dec: t.dec, bal: null, ok: false }; });
      });
      return Promise.all(toks).then(function (tk) { return { chain: chain, status: "found", hasCode: !!(base[0] && base[0] !== "0x"), balance: base[1], nonce: base[2], tokens: tk }; });
    }).catch(function (e) { return { chain: chain, status: "error", error: (e && e.message) || "error" }; });
  }
  function queryAddr(addr) { return Promise.all(TX_CHAINS.map(function (c) { return queryAddrOnChain(c, addr); })); }
  // 地址大白话解读
  function explainAddr(results) {
    var ok = results.filter(function (r) { return r.status === "found"; });
    if (!ok.length) return T("两条链都没查到数据(可能网络问题),请点重试。", "No data from either chain (network issue) — please retry.");
    var parts = [], anyCode = false;
    ok.forEach(function (r) {
      var bits = [amtWord(r.balance, 18, r.chain.sym)];
      (r.tokens || []).forEach(function (t) { if (t.ok && bnPos(t.bal)) bits.push(amtWord(t.bal, t.dec, t.sym)); }); // 只讲查到的,失败的不冒充0
      var n = r.nonce != null ? parseInt(r.nonce, 16) : 0;
      var seg = T("在 " + r.chain.cn + " 上", "On " + r.chain.en);
      if (r.hasCode) { anyCode = true; parts.push(seg + T("检测到合约代码(可能是合约,也可能是被 7702 委托的钱包),持有 " + bits.join(" + ") + "。", ": has contract code (a contract, or a 7702-delegated wallet); holds " + bits.join(" + ") + ".")); }
      else { var act = n > 500 ? T(",很活跃", ", very active") : (n < 10 ? T(",几乎没怎么用过", ", barely used") : ""); parts.push(seg + T("目前没有合约代码(一般是普通钱包),持有 " + bits.join(" + ") + ";发起过约 " + n + " 笔交易" + act + "。", ": no contract code (usually a regular wallet), holds " + bits.join(" + ") + "; ~" + n + " sent txs" + act + ".")); }
    });
    var hasStake = ok.some(function (r) { return (r.tokens || []).some(function (t) { return t.ok && (t.sym === "LGNS" || t.sym === "sLGNS") && bnPos(t.bal); }); });
    if (hasStake) parts.push(T("它持有 LGNS/sLGNS,在参与起源生态(持币或质押)。", "It holds LGNS/sLGNS — active in the Origin ecosystem (holding or staking)."));
    if (anyCode) parts.push(T("提示:显示「有代码」的地址可能是合约,也可能是被 7702 委托的钱包(被盗钱包常见),交互前先确认它的功能和安全性。", "Note: an address with code may be a contract or a 7702-delegated wallet (common for compromised wallets) — verify purpose/safety before interacting."));
    return parts.join(" ");
  }
  function renderAddrData(results, box, addr) {
    box.textContent = "";
    var found = results.filter(function (r) { return r.status === "found"; });
    var errored = results.filter(function (r) { return r.status === "error"; });
    var tokFail = false;
    if (found.length) { var ex = document.createElement("div"); ex.className = "s-tx-explain"; ex.textContent = "💬 " + explainAddr(results); box.appendChild(ex); }
    found.forEach(function (r) {
      var card = document.createElement("div"); card.className = "s-tx-card";
      var hd = document.createElement("div"); hd.className = "s-tx-hd"; hd.textContent = T("在 " + r.chain.cn + " 链(只读)", "On " + r.chain.en + " (read-only)"); card.appendChild(hd);
      card.appendChild(txRow(T("类型", "Type"), r.hasCode ? T("有代码(合约或 7702 委托)", "Has code (contract or 7702)") : T("普通钱包(未检测到代码)", "Wallet (no code)")));
      card.appendChild(txRow(T("原生余额", "Native"), fmtUnit(r.balance, 18) + " " + r.chain.sym));
      (r.tokens || []).forEach(function (t) { if (!t.ok) tokFail = true; card.appendChild(txRow(t.sym, t.ok ? ((bnPos(t.bal) ? fmtUnit(t.bal, t.dec) : "0") + " " + t.sym) : T("查询失败", "query failed"))); });
      card.appendChild(txRow(T("账户 nonce", "Nonce"), r.nonce != null ? String(parseInt(r.nonce, 16)) : "-"));
      var exp = document.createElement("a"); exp.href = r.chain.addr + addr; exp.target = "_blank"; exp.rel = "noopener noreferrer"; exp.className = "s-chip"; exp.textContent = T("在 " + r.chain.cn + " 浏览器打开", "Open in " + r.chain.en + " explorer"); card.appendChild(exp);
      box.appendChild(card);
    });
    if (!found.length && !errored.length) { var n = document.createElement("div"); n.className = "s-tx-none"; n.textContent = T("两条链都没查到这个地址的数据。", "No data found for this address on either chain."); box.appendChild(n); }
    if (errored.length) { var er = document.createElement("div"); er.className = "s-tx-err"; er.textContent = "⚠️ " + T(errored.map(function (r) { return r.chain.cn; }).join("、") + " 链查询失败(网络/限流/超时),请点下方重试。", errored.map(function (r) { return r.chain.en; }).join(", ") + " query failed — please retry."); box.appendChild(er); }
    if (tokFail) { var tw = document.createElement("div"); tw.className = "s-tx-err"; tw.textContent = "⚠️ " + T("部分代币余额查询失败(限流/超时),标为「查询失败」的不代表余额为 0,可点重试。", "Some token balances failed (rate-limit/timeout); 'query failed' does NOT mean zero — retry."); box.appendChild(tw); }
    if (found.length) { var src = document.createElement("div"); src.className = "s-tx-note"; src.textContent = T("数据来自各链公共 RPC 只读查询;nonce≈已发起交易数(合约除外);完整交易/授权明细可用「钱包监控·链上体检」工具。", "Read-only public RPC data; nonce ≈ txs sent (except contracts); for full tx/approval details use the Wallet Monitor tool."); box.appendChild(src); }
    return errored.length > 0 || tokFail; // 代币查询失败也保留重试
  }

  /* ---- 地址/交易哈希特判横幅 ---- */
  function specialBanner(q, container) {
    var raw = q.trim();
    if (EVM_ADDR.test(raw)) {
      var matched = (_index || []).filter(function (x) { return String(x.address || "").toLowerCase() === raw.toLowerCase() && x.type === "contract"; });
      var box = document.createElement("div"); box.className = "s-banner";
      var h = document.createElement("div"); h.className = "s-banner-h"; h.textContent = "🔍 " + T("检测到可能的钱包地址或合约地址", "Looks like a wallet or contract address"); box.appendChild(h);
      if (!matched.length) {
        var links = [["钱包查询", "/?tool=openWalletMonitor"], ["钱包安全体检", "/?tool=openWalletMonitor"], ["Token安全检测", "/?tool=openSecurity"], ["合约验证", "/?tool=openContractCenter"], ["PolygonScan", "https://polygonscan.com/address/" + raw]];
        var p = document.createElement("div"); p.className = "s-banner-acts";
        links.forEach(function (l) { var a = document.createElement("a"); a.href = l[1]; a.className = "s-chip"; a.textContent = l[0]; if (/^https?:/.test(l[1])) { a.target = "_blank"; a.rel = "noopener noreferrer"; } p.appendChild(a); });
        box.appendChild(p);
      } else { var n = document.createElement("div"); n.className = "s-banner-note"; n.textContent = T("在合约库中找到匹配,见下方结果。", "Matched in contract DB, see results below."); box.appendChild(n); }
      var abtn = document.createElement("button"); abtn.type = "button"; abtn.className = "s-tx-btn";
      abtn.textContent = T("🔎 查这个地址的链上数据(Polygon + Anubis)", "🔎 Fetch on-chain data (Polygon + Anubis)");
      var ares = document.createElement("div"); ares.className = "s-tx-res";
      abtn.addEventListener("click", function () {
        abtn.disabled = true; abtn.textContent = T("查询中…(两条链只读查询)", "Querying both chains (read-only)…");
        queryAddr(raw).then(function (results) { var hadErr = renderAddrData(results, ares, raw); if (hadErr) { abtn.disabled = false; abtn.textContent = T("🔎 重试查询", "🔎 Retry"); } else { abtn.style.display = "none"; } })
          .catch(function () { ares.textContent = T("查询失败,请稍后重试。", "Query failed — please retry."); abtn.disabled = false; abtn.textContent = T("🔎 重试", "🔎 Retry"); });
      });
      box.appendChild(abtn); box.appendChild(ares);
      container.appendChild(box);
    } else if (TX_HASH.test(raw)) {
      var box2 = document.createElement("div"); box2.className = "s-banner";
      var h2 = document.createElement("div"); h2.className = "s-banner-h"; h2.textContent = "🔗 " + T("检测到可能的交易哈希", "Looks like a transaction hash"); box2.appendChild(h2);
      var p2 = document.createElement("div"); p2.className = "s-banner-acts";
      [["链上证据搜索", "/?tool=openEvidenceDB"], ["PolygonScan", "https://polygonscan.com/tx/" + raw], ["Anubis Explorer", "https://browser.anubispace.org/tx/" + raw]].forEach(function (l) { var a = document.createElement("a"); a.href = l[1]; a.className = "s-chip"; a.textContent = l[0]; if (/^https?:/.test(l[1])) { a.target = "_blank"; a.rel = "noopener noreferrer"; } p2.appendChild(a); });
      box2.appendChild(p2);
      var warn2 = document.createElement("div"); warn2.className = "s-banner-warn"; warn2.textContent = "⚠️ " + T("私钥也是0x+64位十六进制,外观与交易哈希一致。若这串其实是你的私钥,切勿点击下方链接(会把它发给第三方浏览器),请立即把资产转移到新钱包。", "A private key is also 0x + 64 hex and looks identical to a tx hash. If this is actually your private key, do NOT click the links below (they'd send it to a third-party explorer) — move your assets to a new wallet now."); box2.appendChild(warn2);
      var note2 = document.createElement("div"); note2.className = "s-banner-note"; note2.textContent = T("未确定网络前不断言归属哪条链。", "Network not asserted until confirmed."); box2.appendChild(note2);
      var qbtn = document.createElement("button"); qbtn.type = "button"; qbtn.className = "s-tx-btn";
      qbtn.textContent = T("🔎 查这笔交易的链上数据(Polygon + Anubis)", "🔎 Fetch on-chain data (Polygon + Anubis)");
      var qres = document.createElement("div"); qres.className = "s-tx-res";
      qbtn.addEventListener("click", function () {
        qbtn.disabled = true; qbtn.textContent = T("查询中…(两条链只读查询)", "Querying both chains (read-only)…");
        queryTxOnChain(raw).then(function (results) { var hadErr = renderTxData(results, qres, raw); if (hadErr) { qbtn.disabled = false; qbtn.textContent = T("🔎 重试查询", "🔎 Retry"); } else { qbtn.style.display = "none"; } })
          .catch(function () { qres.textContent = T("查询失败,请稍后重试,或点上方浏览器链接。", "Query failed — retry later or use the explorer links above."); qbtn.disabled = false; qbtn.textContent = T("🔎 重试", "🔎 Retry"); });
      });
      box2.appendChild(qbtn); box2.appendChild(qres);
      container.appendChild(box2);
    }
  }

  /* ---- 敏感警告 ---- */
  function sensitiveWarn(container) {
    var box = document.createElement("div"); box.className = "s-sensitive";
    box.innerHTML = '<b>⚠️ ' + T("请不要在任何网站输入助记词、私钥或钱包密码。", "Never enter your seed phrase, private key or wallet password on any site.") + '</b><p>' +
      T("Web3Origin 不会保存或搜索这些内容。如果这是真实助记词或私钥,请立即停止操作,并在安全设备上把资产转移到新钱包。",
        "Web3Origin never stores or searches these. If this is a real seed/private key, stop now and move your assets to a new wallet on a safe device.") + '</p>';
    container.appendChild(box);
  }

  /* ---- 推荐搜索(无真实统计,只叫"推荐") ---- */
  var SUGGEST = isZh() ? ["起源是什么", "LGNS", "Anubis Chain", "质押", "Rebase", "合约地址", "钱包安全", "链上提币"] : ["What is Origin", "LGNS", "Anubis Chain", "Staking", "Rebase", "Contracts", "Wallet safety", "Withdraw"];

  /* ---- 主渲染:把结果渲染进容器 ---- */
  function renderInto(container, query, opts) {
    opts = opts || {};
    injectCss();
    container.innerHTML = "";
    var q = String(query || "").trim();
    if (isSensitive(q)) { sensitiveWarn(container); track("search_sensitive_blocked", { query_len: q.length }); return; }
    if (!q) {
      var sg = document.createElement("div"); sg.className = "s-suggest";
      var t = document.createElement("div"); t.className = "s-suggest-t"; t.textContent = T("推荐搜索", "Suggested"); sg.appendChild(t);
      var wrap = document.createElement("div"); wrap.className = "s-suggest-list";
      SUGGEST.forEach(function (kw) { var b = document.createElement("button"); b.type = "button"; b.className = "s-chip"; b.textContent = kw; b.addEventListener("click", function () { var inp = document.querySelector(".s-input, #searchPageInput"); if (inp) { inp.value = kw; inp.dispatchEvent(new Event("input")); inp.focus(); } }); wrap.appendChild(b); });
      sg.appendChild(wrap); container.appendChild(sg); return;
    }
    specialBanner(q, container);
    var results = runSearch(q, opts);
    track("search", { query_len: q.length, result_count: results.length, search_lang: siteLang() });
    if (!results.length) {
      if (!TX_HASH.test(q) && !EVM_ADDR.test(q)) { track("search_no_result", { query_len: q.length }); }
      var no = document.createElement("div"); no.className = "s-empty";
      no.innerHTML = '<div class="s-empty-t">' + esc(T("没有找到相关内容", "No results found")) + '</div><ul class="s-empty-tips"><li>' +
        [T("尝试更短的关键词", "Try shorter keywords"), T("检查拼写", "Check spelling"), '<a href="/faq/">' + T("查看常见问题", "See FAQ") + '</a>', '<a href="/?tool=openWalletMonitor">' + T("使用链上工具", "Use on-chain tools") + '</a>', '<a href="/#contact">' + T("联系 Web3Origin", "Contact Web3Origin") + '</a>'].join('</li><li>') + '</li></ul>';
      container.appendChild(no); return;
    }
    var cnt = document.createElement("div"); cnt.className = "s-count"; cnt.textContent = T("共 " + results.length + " 条结果", results.length + " results"); container.appendChild(cnt);
    var list = document.createElement("div"); list.className = "s-list"; list.setAttribute("role", "listbox");
    results.forEach(function (item, i) { list.appendChild(resultRow(item, q, i)); });
    container.appendChild(list);
    return results.length;
  }

  /* ---- 键盘选择(上下/Enter) ---- */
  function bindKeyboardNav(root, inputEl) {
    var sel = -1;
    function rows() { return [].slice.call(root.querySelectorAll(".s-row")); }
    function paint() { rows().forEach(function (r, i) { r.classList.toggle("kb", i === sel); if (i === sel) r.scrollIntoView({ block: "nearest" }); }); }
    inputEl.addEventListener("keydown", function (e) {
      var rs = rows();
      if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(rs.length - 1, sel + 1); paint(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); paint(); }
      else if (e.key === "Enter") { if (sel >= 0 && rs[sel]) { e.preventDefault(); rs[sel].click(); } else if (rs[0]) { e.preventDefault(); rs[0].click(); } }
    });
    return function reset() { sel = -1; };
  }

  /* ---- 弹层 ---- */
  var modal = null, debTimer = null;
  function ensureModal() {
    if (modal) return modal;
    injectCss();
    modal = document.createElement("div"); modal.className = "s-modal"; modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
    modal.innerHTML = '<div class="s-mask"></div><div class="s-box"><div class="s-inputwrap"><span class="s-ic">🔍</span>'
      + '<input type="text" class="s-input" autocomplete="off" spellcheck="false" aria-label="' + esc(T("搜索", "Search")) + '" placeholder="' + esc(T("搜索文章、课程、工具、合约或问题", "Search articles, courses, tools, contracts or FAQ")) + '">'
      + '<a class="s-full" href="/search/">' + esc(T("完整搜索页", "Full page")) + '</a><button type="button" class="s-close" aria-label="' + esc(T("关闭", "Close")) + '">✕</button></div>'
      + '<div class="s-results" role="listbox"></div><div class="s-foot">' + esc(T("↑↓ 选择 · Enter 打开 · Esc 关闭", "↑↓ navigate · Enter open · Esc close")) + '</div></div>';
    document.body.appendChild(modal);
    var inp = modal.querySelector(".s-input"), res = modal.querySelector(".s-results");
    var reset = bindKeyboardNav(res, inp);
    inp.addEventListener("input", function () {
      var v = inp.value.slice(0, MAX_Q); clearTimeout(debTimer);
      debTimer = setTimeout(function () { loadIndex(function () { renderInto(res, v); reset(); }); }, DEBOUNCE);
    });
    modal.querySelector(".s-mask").addEventListener("click", closeModal);
    modal.querySelector(".s-close").addEventListener("click", closeModal);
    modal.querySelector(".s-full").addEventListener("click", function (e) { var q = inp.value.trim(); if (q) { e.preventDefault(); location.href = "/search/?q=" + encodeURIComponent(q.slice(0, MAX_Q)); } });
    return modal;
  }
  function openModal() {
    ensureModal(); _scrollY = window.scrollY || 0;
    document.body.style.position = "fixed"; document.body.style.top = -_scrollY + "px"; document.body.style.width = "100%";
    modal.classList.add("open");
    var inp = modal.querySelector(".s-input"), res = modal.querySelector(".s-results");
    inp.value = ""; loadIndex(function () { renderInto(res, ""); });
    setTimeout(function () { inp.focus(); }, 40);
    track("search_open", {});
  }
  function closeModal() {
    if (!modal) return; modal.classList.remove("open");
    document.body.style.position = ""; document.body.style.top = ""; document.body.style.width = "";
    window.scrollTo(0, _scrollY);
  }
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); modal && modal.classList.contains("open") ? closeModal() : openModal(); }
    else if (e.key === "Escape" && modal && modal.classList.contains("open")) closeModal();
  });

  /* ---- CSS ---- */
  function injectCss() {
    if (document.getElementById("s-css")) return;
    var css = document.createElement("style"); css.id = "s-css";
    css.textContent = [
      '.s-modal{position:fixed;inset:0;z-index:400;display:none}.s-modal.open{display:block}',
      '.s-mask{position:absolute;inset:0;background:rgba(0,0,0,.6);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}',
      '.s-box{position:absolute;top:9vh;left:50%;transform:translateX(-50%);width:min(680px,94vw);max-height:80vh;display:flex;flex-direction:column;background:rgba(12,14,12,.98);border:1px solid rgba(212,175,55,.24);border-radius:16px;box-shadow:0 30px 70px rgba(0,0,0,.65);overflow:hidden}',
      '.s-inputwrap{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid rgba(212,175,55,.14)}',
      '.s-ic{font-size:16px;opacity:.8}.s-input{flex:1;background:none;border:0;outline:none;color:#e9efea;font-size:16px;font-family:inherit}',
      '.s-full{color:#e8cf7e;font-size:12px;text-decoration:none;border:1px solid rgba(212,175,55,.25);padding:4px 9px;border-radius:7px;white-space:nowrap}.s-full:hover{background:rgba(212,175,55,.1)}',
      '.s-close{width:32px;height:32px;border:0;background:none;color:#9aa39a;font-size:16px;cursor:pointer;border-radius:7px}.s-close:hover{background:rgba(255,255,255,.06);color:#e8cf7e}',
      '.s-results{overflow-y:auto;padding:8px}.s-count{color:#7a857c;font-size:12px;padding:6px 10px}',
      '.s-row{display:block;text-decoration:none;padding:10px 12px;border-radius:10px;color:#e9efea}.s-row:hover,.s-row.kb{background:rgba(212,175,55,.12);outline:none}',
      '.s-row-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.s-type{font-size:11px;color:#d4af37;background:rgba(212,175,55,.12);border:1px solid rgba(212,175,55,.22);border-radius:20px;padding:1px 8px;white-space:nowrap}',
      '.s-title{font-size:14.5px;font-weight:600}.s-verified{font-size:11px;color:#7bff45}.s-desc{color:#c3cbc4;font-size:12.5px;margin-top:3px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.s-meta{color:#7a857c;font-size:11.5px;margin-top:4px}.s-hl{background:rgba(212,175,55,.32);color:#fff;border-radius:3px;padding:0 1px}',
      '.s-banner{background:rgba(212,175,55,.08);border:1px solid rgba(212,175,55,.22);border-radius:11px;padding:11px 13px;margin:6px 4px 10px}.s-banner-h{color:#e8cf7e;font-size:13.5px;font-weight:600}.s-banner-note{color:#7a857c;font-size:11.5px;margin-top:5px}.s-banner-warn{color:#ffb4a8;background:rgba(255,60,40,.08);border:1px solid rgba(255,80,60,.3);border-radius:8px;padding:7px 9px;font-size:12px;margin-top:7px;line-height:1.55}.s-tx-btn{margin-top:9px;background:rgba(212,175,55,.14);color:#e8cf7e;border:1px solid rgba(212,175,55,.4);border-radius:8px;padding:8px 13px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}.s-tx-btn:hover{background:rgba(212,175,55,.22)}.s-tx-btn:disabled{opacity:.6;cursor:default}.s-tx-res{margin-top:8px}.s-tx-card{background:rgba(255,255,255,.03);border:1px solid rgba(212,175,55,.18);border-radius:9px;padding:10px 12px;margin-top:7px}.s-tx-hd{color:#e8cf7e;font-size:12.5px;font-weight:700;margin-bottom:6px}.s-tx-row{display:flex;gap:8px;font-size:12.5px;padding:2px 0;line-height:1.5}.s-tx-k{color:#7a857c;min-width:52px;flex:none}.s-tx-v{color:#c3cbc4;word-break:break-all}.s-tx-addr{color:#8fb7ff;text-decoration:none;word-break:break-all}.s-tx-addr:hover{text-decoration:underline}.s-tx-note{color:#7a857c;font-size:11px;margin-top:6px;line-height:1.5}.s-tx-none{color:#c3cbc4;font-size:12.5px;padding:6px 2px}.s-tx-explain{color:#eef3ef;background:rgba(212,175,55,.1);border-left:3px solid #d4af37;border-radius:6px;padding:8px 11px;font-size:12.5px;line-height:1.65;margin-top:8px}.s-tx-err{color:#ffcf9a;background:rgba(255,160,60,.08);border:1px solid rgba(255,160,60,.28);border-radius:8px;padding:7px 9px;font-size:12px;margin-top:7px;line-height:1.5}.s-tx-card .s-chip{margin-top:8px}',
      '.s-banner-acts,.s-suggest-list{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}',
      '.s-chip{display:inline-block;font-size:12.5px;color:#e8cf7e;background:rgba(212,175,55,.1);border:1px solid rgba(212,175,55,.25);border-radius:8px;padding:5px 11px;text-decoration:none;cursor:pointer;font-family:inherit}.s-chip:hover{background:rgba(212,175,55,.2)}',
      '.s-sensitive{background:rgba(229,115,115,.1);border:1px solid rgba(229,115,115,.4);border-radius:12px;padding:14px 16px;margin:8px 4px}.s-sensitive b{color:#e57373;display:block;font-size:14px}.s-sensitive p{color:#c3cbc4;font-size:12.5px;line-height:1.6;margin:8px 0 0}',
      '.s-suggest{padding:12px 8px}.s-suggest-t{color:#7a857c;font-size:12px;margin-bottom:8px;padding:0 4px}',
      '.s-empty{padding:22px 14px;text-align:center}.s-empty-t{color:#e9efea;font-size:15px;margin-bottom:12px}.s-empty-tips{list-style:none;padding:0;margin:0;color:#7a857c;font-size:13px;line-height:2}.s-empty-tips a{color:#e8cf7e;text-decoration:none}',
      '.s-foot{color:#6a746c;font-size:11px;padding:9px 14px;border-top:1px solid rgba(255,255,255,.05);text-align:center}',
      '@media(max-width:600px){.s-box{top:0;left:0;transform:none;width:100vw;max-height:100vh;height:100vh;border-radius:0}}'
    ].join("");
    document.head.appendChild(css);
  }

  /* ---- 自动注入搜索入口到现有导航(桌面#langBtn旁 + 移动#mLang旁) ---- */
  function injectEntry() {
    try {
      if (!document.getElementById("s-entry-css")) { var ec = document.createElement("style"); ec.id = "s-entry-css"; ec.textContent = "@media(min-width:768px){#mSearchBtn{display:none}}";document.head.appendChild(ec); }
      var lb = document.getElementById("langBtn");
      if (lb && !document.getElementById("navSearchBtn")) {
        var b = document.createElement("button"); b.id = "navSearchBtn"; b.type = "button"; b.title = T("搜索 (Ctrl+K)", "Search (Ctrl+K)"); b.setAttribute("aria-label", T("搜索", "Search")); b.textContent = "🔍";
        b.style.cssText = "font:inherit;font-size:14px;cursor:pointer;background:transparent;border:1px solid var(--line,rgba(212,175,55,.22));color:var(--gold-lt,#e8cf7e);border-radius:6px;padding:5px 11px;margin-left:8px";
        b.addEventListener("click", openModal); lb.parentNode.insertBefore(b, lb);
      }
      var ml = document.getElementById("mLang");
      if (ml && !document.getElementById("mSearchBtn")) {
        var mb = document.createElement("button"); mb.id = "mSearchBtn"; mb.type = "button"; mb.setAttribute("aria-label", T("搜索", "Search")); mb.textContent = "🔍";
        mb.style.cssText = "font:inherit;font-size:16px;cursor:pointer;background:transparent;border:0;color:var(--gold-lt,#e8cf7e);padding:4px 8px";
        mb.addEventListener("click", openModal); ml.parentNode.insertBefore(mb, ml);
      }
    } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectEntry); else injectEntry();

  window.W3OSearch = { open: openModal, close: closeModal, renderInto: function (el, q, opts) { loadIndex(function () { renderInto(el, q, opts); }); }, loadIndex: loadIndex, isSensitive: isSensitive, run: runSearch, bindKeyboardNav: bindKeyboardNav };
})();
