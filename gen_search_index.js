#!/usr/bin/env node
/* Web3Origin 全站搜索索引生成器
 * 从真实内容源(contracts.js/events.js/academy_index.js/videos_data.json + FAQ + 页面 + 工具)生成
 * /search-index/{zh-CN,zh-TW,en}.json。原子替换:先写.tmp→校验→重命名;生成失败不覆盖正常索引。
 * 用法: node gen_search_index.js        (生成)
 *       node gen_search_index.js --check (仅校验现有索引)
 */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname, OUT = path.join(ROOT, "search-index");
const CLEAN = s => String(s == null ? "" : s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const CLIP = (s, n) => CLEAN(s).slice(0, n || 600);
const SHORT = a => a ? (a.slice(0, 6) + "…" + a.slice(-4)) : "";

function loadJs(file) { // window 垫片加载 window.X=... 的数据文件
  const w = {};
  try { new Function("window", fs.readFileSync(path.join(ROOT, file), "utf8"))(w); } catch (e) { console.error(file, "加载失败:", e.message); }
  return w;
}
function extractFaqs() { // 从 index.html 抽 FAQS 数组
  try {
    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    const m = html.match(/FAQS\s*=\s*(\[[\s\S]*?\]);/);
    if (m) { const w = {}; new Function("return " + m[1])(); return eval(m[1]); }
  } catch (e) { console.error("FAQ抽取失败:", e.message); }
  return [];
}

function build(lang) {
  const en = lang === "en";
  const w1 = loadJs("contracts.js"), w2 = loadJs("events.js"), w3 = loadJs("academy_index.js");
  const CONTRACTS = w1.CONTRACTS || [], EVENTS = w2.EVENTS || [], ACADEMY = w3.ACADEMY || [];
  let VIDEOS = [];
  try { VIDEOS = (JSON.parse(fs.readFileSync(path.join(ROOT, "videos_data.json"), "utf8")).videos) || []; } catch (e) {}
  const FAQS = extractFaqs();
  const idx = [];
  const push = o => { if (o.title && o.url) idx.push(o); };

  // 合约
  CONTRACTS.forEach((c, i) => { const addr = String((c.addr && c.addr.a) || c.addr || ""); push({
    id: "contract-" + i, type: "contract", title: String(c.name || c.cname || addr || ""),
    description: [c.cat, c.chain, c.verified ? (en ? "verified" : "已开源") : "", c.proxy ? (en ? "proxy" : "代理") : ""].filter(Boolean).join(" · "),
    content: CLIP([c.name, c.cname, addr, c.deployer].filter(Boolean).join(" "), 200),
    url: "/contracts/", language: lang, category: c.cat || "", tags: [c.chain, c.cat].filter(Boolean).map(String),
    aliases: [c.cname, addr].filter(Boolean).map(String), updated_at: "", network: String(c.chain || ""), address: addr, verified: !!c.verified,
    extra: { cname: c.cname || "", proxy: !!c.proxy, upgradeable: !!c.upgradeable }
  }); });
  // 链上证据
  EVENTS.forEach(e => push({
    id: "evidence-" + e.id, type: "evidence", title: e.title,
    description: CLIP(e.summary, 160), content: CLIP([e.title, e.summary, e.cat].filter(Boolean).join(" "), 400),
    url: "/?tool=openEvidenceDB", language: lang, category: e.cat || "", tags: [e.chain, e.cat].filter(Boolean),
    aliases: [e.id].filter(Boolean), updated_at: (e.date || "").slice(0, 10), network: e.chain || "",
    address: String(e.tx || (e.addresses && e.addresses[0] && e.addresses[0].a) || ""), verified: (e.level || 0) >= 4,
    extra: { evType: e.cat || "", source: e.source || "", block: e.block || "" }
  }));
  // 学院课程
  ACADEMY.forEach(c => push({
    id: "course-" + c.id, type: "course", title: en && c.title_en ? c.title_en : c.title,
    description: CLIP(c.objective, 160), content: CLIP([c.title, c.title_en, c.objective, c.plain, c.example].filter(Boolean).join(" "), 500),
    url: "/academy/" + c.slug + "/", language: lang, category: "L" + c.level, tags: ["Level " + c.level].concat((c.tools || [])),
    aliases: [c.slug, c.title_en, c.title].filter(Boolean), updated_at: "", network: "", address: "", verified: true
  }));
  // 视频(仅收录已上线的真实视频页;planned=规划中占位,对应话题已在学院课程收录,跳过避免404)
  VIDEOS.filter(v => !v.planned).forEach(v => push({
    id: "video-" + v.id, type: "video", title: en && v.title_en ? v.title_en : v.title,
    description: CLIP(v.desc, 140), content: CLIP([v.title, v.title_en, v.desc].filter(Boolean).join(" "), 300),
    url: "/video/" + v.slug + "/", language: lang, category: v.cat || "", tags: [v.cat].filter(Boolean),
    aliases: [v.slug, v.title_en, v.title].filter(Boolean), updated_at: "", network: "", address: "", verified: true
  }));
  // FAQ
  FAQS.forEach((f, i) => { const q = en && f.q_en ? f.q_en : f.q, a = en && f.a_en ? f.a_en : f.a; if (q) push({
    id: "faq-" + i, type: "faq", title: q, description: CLIP(a, 160), content: CLIP((q || "") + " " + (a || ""), 500),
    url: "/faq/", language: lang, category: "FAQ", tags: [], aliases: [], updated_at: "", network: "", address: "", verified: true
  }); });
  // 百科 + 页面 + 工具(真实入口)
  const wiki = en ? [
    ["LGNS Wiki", "/baike/lgns/", "LGNS token, staking, rebase, treasury"],
    ["Anubis Chain Wiki", "/baike/anubis/", "Anubis Chain, ChainID 6714, gas in DAI"],
    ["Awake DAO", "/baike/awake-dao/", "Governance, proposals, GLGNS voting"]
  ] : [
    ["LGNS 百科", "/baike/lgns/", "LGNS 代币、质押、rebase、国库、(3,3) OHM 分叉"],
    ["Anubis Chain 百科", "/baike/anubis/", "Anubis 公链、ChainID 6714、gas 用 DAI、双链"],
    ["Awake DAO 治理", "/baike/awake-dao/", "治理提案流程、GLGNS 投票权"]
  ];
  wiki.forEach((p, i) => push({ id: "wiki-" + i, type: "wiki", title: p[0], description: p[2], content: p[2], url: p[1], language: lang, category: en ? "Wiki" : "百科", tags: [], aliases: [], updated_at: "", network: "", address: "", verified: true }));

  const pages = en ? [
    ["Research Articles", "/articles/", "Research articles and evidence hub"],
    ["Data Sources & Credibility", "/sources/", "Data sources, tx hashes, verification"],
    ["About Web3Origin", "/about/", "Who we are, what data we provide"],
    ["All Contracts", "/contracts/", "Origin contract addresses on Polygon and Anubis"],
    ["Video Academy", "/video/", "Video tutorials and courses"],
    ["My Dashboard", "/dashboard/", "Personal on-chain center"],
    ["Feedback", "/feedback/", "Community feedback"]
  ] : [
    ["研究文章", "/articles/", "研究文章与证据中心"],
    ["数据来源与可信度", "/sources/", "数据来源、交易哈希、核实状态"],
    ["关于 Web3Origin", "/about/", "我们是谁、提供什么数据"],
    ["合约地址大全", "/contracts/", "起源在 Polygon 与 Anubis 的合约地址"],
    ["视频学院", "/video/", "视频教程与课程"],
    ["个人中心", "/dashboard/", "我的链上中心"],
    ["留言区", "/feedback/", "社区反馈"]
  ];
  pages.forEach((p, i) => push({ id: "page-" + i, type: "page", title: p[0], description: p[2], content: p[2], url: p[1], language: lang, category: en ? "Page" : "页面", tags: [], aliases: [], updated_at: "", network: "", address: "", verified: true }));

  const tools = en ? [
    ["Wallet Monitor · Checkup", "/?tool=openWalletMonitor", "onchain"], ["Referrer Lookup", "/?tool=openReferrer", "onchain"],
    ["On-chain Withdraw", "/tools/onchain-withdraw/", "onchain"], ["Token Safety Check", "/?tool=openSecurity", "onchain"],
    ["Contract Verify Center", "/?tool=openContractCenter", "onchain"], ["Yield Calculator", "/?tool=openCalc", "onchain"],
    ["Staking Panel", "/?tool=openStaking", "onchain"], ["Whale Trade Monitor", "/?tool=openWhale", "onchain"],
    ["On-chain Address Lookup", "/?tool=openBrowser", "onchain"], ["Daily Report", "/?tool=openDailyNews", "onchain"]
  ] : [
    ["钱包监控 · 链上体检", "/?tool=openWalletMonitor", "钱包"], ["查推荐人", "/?tool=openReferrer", "钱包"],
    ["链上提币", "/tools/onchain-withdraw/", "钱包"], ["代币安全自查", "/?tool=openSecurity", "安全"],
    ["合约验证中心", "/?tool=openContractCenter", "安全"], ["收益计算器", "/?tool=openCalc", "数据"],
    ["质押数据面板", "/?tool=openStaking", "数据"], ["大额成交监测", "/?tool=openWhale", "数据"],
    ["链上地址查询", "/?tool=openBrowser", "数据"], ["链上日报", "/?tool=openDailyNews", "数据"]
  ];
  tools.forEach((t, i) => push({ id: "tool-" + i, type: "tool", title: t[0], description: t[2], content: t[0] + " " + t[2], url: t[1], language: lang, category: en ? "Tool" : "工具", tags: [t[2]], aliases: [], updated_at: "", network: "", address: "", verified: true }));

  return idx;
}

// 按类型最低数量:动态源(合约/证据/课程/视频/FAQ)任一加载失败会跌到0而不达标,
// 从而拒绝用残缺索引覆盖正常索引(阈值远低于真实量:合约61/证据14/课程36/视频36/FAQ7)
const MIN_BY_TYPE = { contract: 20, evidence: 5, course: 20, video: 20, faq: 3 };
function validate(idx) {
  if (!Array.isArray(idx) || idx.length < 20) return "条目过少(<20),疑似生成失败";
  const cnt = {};
  for (const e of idx) {
    if (typeof e.title !== "string" || !e.title || typeof e.url !== "string" || !e.url) return "存在缺/非字符串 title|url 的条目: " + (e.id || "?");
    if (typeof e.address !== "string" || typeof e.content !== "string") return "address/content 非字符串: " + (e.id || "?");
    if (!Array.isArray(e.tags) || !Array.isArray(e.aliases) || e.tags.some(x => typeof x !== "string") || e.aliases.some(x => typeof x !== "string")) return "tags/aliases 必须是字符串数组: " + (e.id || "?");
    if (!/^\/(?![\/\\])[^\s\\]*$/.test(e.url)) return "非法URL(须站内绝对路径,禁//与\\): " + e.url; // 拒协议相对//evil与反斜杠
    if (e.content.length > 600) return "content 超长: " + e.id;
    cnt[e.type] = (cnt[e.type] || 0) + 1;
  }
  for (const t in MIN_BY_TYPE) if ((cnt[t] || 0) < MIN_BY_TYPE[t]) return "类型[" + t + "]数量" + (cnt[t] || 0) + "少于最低" + MIN_BY_TYPE[t] + ",疑似数据源加载失败";
  return null;
}

function stageTmp(file, data) { // 写.tmp并回读校验,通过才返回tmp路径(不重命名)
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
  const err = validate(JSON.parse(fs.readFileSync(tmp, "utf8"))); // 回读校验
  if (err) throw new Error("校验失败,不替换 " + path.basename(file) + ": " + err);
  return tmp;
}
function cleanupTmps(tmps) { for (const t of tmps) { try { fs.unlinkSync(t); } catch (e) {} } }

function main() {
  if (process.argv.includes("--check")) {
    let ok = true;
    for (const l of ["zh-CN", "zh-TW", "en"]) {
      const f = path.join(OUT, l + ".json");
      try { const d = JSON.parse(fs.readFileSync(f, "utf8")); const e = validate(d); console.log(l + ":", e ? ("✗ " + e) : ("✓ " + d.length + " 条")); if (e) ok = false; }
      catch (e) { console.log(l + ": ✗ 读取失败 " + e.message); ok = false; }
    }
    process.exit(ok ? 0 : 1);
  }
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const zh = build("zh-CN"), enIdx = build("en");
  const tw = zh.map(o => Object.assign({}, o, { language: "zh-TW" })); // 无 TW 译文,复用简体(站点惯例回退)
  // 两阶段提交:先写好并校验全部三个.tmp(任一失败则清理全部tmp、不动线上),全部通过后再统一重命名
  const jobs = [["zh-CN", zh], ["zh-TW", tw], ["en", enIdx]].map(([l, d]) => ({ file: path.join(OUT, l + ".json"), data: d }));
  const staged = [];
  try { for (const j of jobs) staged.push({ tmp: stageTmp(j.file, j.data), file: j.file }); }
  catch (e) { cleanupTmps(staged.map(s => s.tmp)); throw e; }
  for (const s of staged) fs.renameSync(s.tmp, s.file); // 三次重命名各自原子,窗口极小
  const cnt = t => zh.filter(x => x.type === t).length;
  console.log("✓ 索引生成完成:");
  console.log("  zh-CN:", zh.length, "| zh-TW:", tw.length, "| en:", enIdx.length);
  console.log("  分类: 合约" + cnt("contract") + " 证据" + cnt("evidence") + " 课程" + cnt("course") + " 视频" + cnt("video") + " FAQ" + cnt("faq") + " 百科" + cnt("wiki") + " 页面" + cnt("page") + " 工具" + cnt("tool"));
}
try { main(); } catch (e) { console.error("✗ 生成失败(未覆盖正常索引):", e.message); process.exit(1); }
