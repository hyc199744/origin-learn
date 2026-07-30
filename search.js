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
      container.appendChild(box);
    } else if (TX_HASH.test(raw)) {
      var box2 = document.createElement("div"); box2.className = "s-banner";
      var h2 = document.createElement("div"); h2.className = "s-banner-h"; h2.textContent = "🔗 " + T("检测到可能的交易哈希", "Looks like a transaction hash"); box2.appendChild(h2);
      var p2 = document.createElement("div"); p2.className = "s-banner-acts";
      [["链上证据搜索", "/?tool=openEvidenceDB"], ["PolygonScan", "https://polygonscan.com/tx/" + raw], ["Anubis Explorer", "https://browser.anubispace.org/tx/" + raw]].forEach(function (l) { var a = document.createElement("a"); a.href = l[1]; a.className = "s-chip"; a.textContent = l[0]; if (/^https?:/.test(l[1])) { a.target = "_blank"; a.rel = "noopener noreferrer"; } p2.appendChild(a); });
      box2.appendChild(p2);
      var warn2 = document.createElement("div"); warn2.className = "s-banner-warn"; warn2.textContent = "⚠️ " + T("私钥也是0x+64位十六进制,外观与交易哈希一致。若这串其实是你的私钥,切勿点击下方链接(会把它发给第三方浏览器),请立即把资产转移到新钱包。", "A private key is also 0x + 64 hex and looks identical to a tx hash. If this is actually your private key, do NOT click the links below (they'd send it to a third-party explorer) — move your assets to a new wallet now."); box2.appendChild(warn2);
      var note2 = document.createElement("div"); note2.className = "s-banner-note"; note2.textContent = T("未确定网络前不断言归属哪条链。", "Network not asserted until confirmed."); box2.appendChild(note2);
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
      '.s-banner{background:rgba(212,175,55,.08);border:1px solid rgba(212,175,55,.22);border-radius:11px;padding:11px 13px;margin:6px 4px 10px}.s-banner-h{color:#e8cf7e;font-size:13.5px;font-weight:600}.s-banner-note{color:#7a857c;font-size:11.5px;margin-top:5px}.s-banner-warn{color:#ffb4a8;background:rgba(255,60,40,.08);border:1px solid rgba(255,80,60,.3);border-radius:8px;padding:7px 9px;font-size:12px;margin-top:7px;line-height:1.55}',
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
