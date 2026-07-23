/* ═══════════════ 起源链上雷达 Origin On-chain Radar ═══════════════
   数据源：起源官方后台 + PolygonScan(Etherscan V2) + Anubis 区块浏览器
   经 Cloudflare Worker /radar 聚合，KV 缓存 + 每 2 分钟 cron 保鲜。
   前端只读一个接口，60 秒自动刷新。拿不到的字段一律显示 "—"，绝不编造。 */
(function(){
"use strict";
var API="https://count.web3origin.com/radar";
var PS="https://polygonscan.com/tx/";

/* ---------- 双语标签 ---------- */
function EN(){return (window.SITE_LANG||"zh")!=="zh";}
var L={
  zh:{title:"起源链上雷达",sub:"实时追踪 LGNS、Anubis Chain 生态链上状态 · 数据可逐一核实",
    upd:"数据更新",loading:"加载中…",anbOk:"Anubis 正常",polOk:"Polygon 正常",offline:"离线",
    c1:"LGNS 市场",c1h:"现价 (DAI)",vol:"24h 成交量",supply:"流通量",mcap:"市值",bs:"24h 买/卖",
    c2:"Anubis 链",c2h:"区块高度",btime:"出块",tps:"TPS",gas:"Gas",addrs:"总地址",
    c3:"生态规模",c3h:"质押率",staked:"质押量",tsupply:"总供应",tvl:"TVL",lp:"LP 流动性",
    c4:"钱包数据",c4h:"Anubis 总地址",txtoday:"今日交易",txtotal:"累计交易",
    c5:"国库数据",c5h:"国库市值",rfv:"无风险价值",mvchg:"24h 变化",burn:"累计销毁",
    feed:"实时链上事件",whale:"鲸鱼动态",health:"生态健康指数",risk:"链上风险雷达",flow:"资金流向",
    buy:"买入",sell:"卖出",noev:"近期暂无达标成交",nowhale:"近期暂无大额成交（≥1000 LGNS）",
    view:"查看",ago_now:"刚刚",ago_m:"分钟前",ago_h:"小时前",ago_d:"天前",
    hbasis:"评分依据",hnote:"仅按流动性 / 链上活跃 / 质押 / 供应等公开表面指标机械计算，不含治理集中度与合约权限风险；结构性风险请查「合约验证中心」与「链上证据库」。非官方评级，不构成投资建议。",
    hliq:"流动性",hact:"链上活跃",hstk:"质押参与",hsup:"供应稳定",hsec:"安全透明",
    q1:"钱包查询",q2:"收益计算器",q3:"合约安全检测",q4:"链上证据库",
    flowU:"用户",flowD:"DEX 交易",flowL:"LP 池",flowT:"国库",flowG:"DAO 治理",
    foot:"数据来源：起源官方后台 · PolygonScan(Etherscan V2) · Anubis 区块浏览器。健康指数为本站按公开链上指标机械计算的参考值，非官方评级，不构成投资建议。",
    err:"数据加载失败，请稍后重试或检查网络（部分地区需科学上网）。"},
  en:{title:"Origin On-chain Radar",sub:"Live tracking of LGNS & Anubis Chain on-chain state · every figure verifiable",
    upd:"Updated",loading:"Loading…",anbOk:"Anubis OK",polOk:"Polygon OK",offline:"Offline",
    c1:"LGNS Market",c1h:"Price (DAI)",vol:"24h Volume",supply:"Circulating",mcap:"Mkt Cap",bs:"24h Buy/Sell",
    c2:"Anubis Chain",c2h:"Block Height",btime:"Block",tps:"TPS",gas:"Gas",addrs:"Addresses",
    c3:"Ecosystem",c3h:"Staking Rate",staked:"Staked",tsupply:"Total Supply",tvl:"TVL",lp:"LP",
    c4:"Wallets",c4h:"Anubis Addresses",txtoday:"Tx Today",txtotal:"Tx Total",
    c5:"Treasury",c5h:"Treasury MV",rfv:"Risk-free Value",mvchg:"24h Change",burn:"Total Burn",
    feed:"Live On-chain Events",whale:"Whale Watch",health:"Ecosystem Health",risk:"On-chain Risk Radar",flow:"Fund Flow",
    buy:"Buy",sell:"Sell",noev:"No events",nowhale:"No large trades in 24h (≥1000 LGNS)",
    view:"View",ago_now:"just now",ago_m:"m ago",ago_h:"h ago",ago_d:"d ago",
    hbasis:"Score basis",hnote:"Computed mechanically from public surface metrics (liquidity / activity / staking / supply) only — it does NOT capture governance centralization or contract-permission risk; see Contract Verification & Evidence DB for those. Not an official rating, not investment advice.",
    hliq:"Liquidity",hact:"Activity",hstk:"Staking",hsup:"Supply",hsec:"Security",
    q1:"Wallet Lookup",q2:"Yield Calc",q3:"Contract Check",q4:"Evidence DB",
    flowU:"Users",flowD:"DEX Swap",flowL:"LP Pool",flowT:"Treasury",flowG:"DAO",
    foot:"Sources: Origin official API · PolygonScan (Etherscan V2) · Anubis explorer. The health index is a mechanical reference computed from public on-chain metrics — not an official rating, not investment advice.",
    err:"Failed to load data. Please retry later or check your network."}
};
function t(k){return (EN()?L.en:L.zh)[k];}

/* ---------- 格式化 ---------- */
function fUSD(n){ if(n==null||isNaN(n))return "—"; var a=Math.abs(n);
  if(a>=1e9)return "$"+(n/1e9).toFixed(2)+"B"; if(a>=1e6)return "$"+(n/1e6).toFixed(2)+"M";
  if(a>=1e3)return "$"+(n/1e3).toFixed(1)+"K"; return "$"+n.toFixed(2); }
function fNum(n){ if(n==null||isNaN(n))return "—"; var a=Math.abs(n);
  if(a>=1e9)return (n/1e9).toFixed(2)+"B"; if(a>=1e6)return (n/1e6).toFixed(2)+"M";
  if(a>=1e3)return (n/1e3).toFixed(1)+"K"; return String(Math.round(n)); }
function fInt(n){ if(n==null||isNaN(n))return "—"; return Math.round(n).toLocaleString("en-US"); }
function fPrice(n){ return n==null||isNaN(n)?"—":(+n).toFixed(4); }
function short(a){ if(!a||a.length<12)return a||"—"; return a.slice(0,6)+"…"+a.slice(-4); }
function ago(ts){ if(!ts)return ""; var s=Math.floor(Date.now()/1000)-ts;
  if(s<60)return t("ago_now"); if(s<3600)return Math.floor(s/60)+t("ago_m");
  if(s<86400)return Math.floor(s/3600)+t("ago_h"); return Math.floor(s/86400)+t("ago_d"); }
function chgPill(c){ if(c==null||isNaN(c))return '<span class="rdr-pill flat">—</span>';
  var up=c>=0; return '<span class="rdr-pill '+(up?"up":"dn")+'">'+(up?"▲":"▼")+" "+Math.abs(c).toFixed(2)+"%</span>"; }

/* ---------- 迷你走势线 ---------- */
function spark(arr,w,h,col){ if(!arr||arr.length<2)return "";
  var mn=Math.min.apply(null,arr),mx=Math.max.apply(null,arr),rg=(mx-mn)||1;
  var pts=arr.map(function(v,i){var x=i/(arr.length-1)*w;var y=h-((v-mn)/rg)*(h-4)-2;return x.toFixed(1)+","+y.toFixed(1);});
  var area="0,"+h+" "+pts.join(" ")+" "+w+","+h;
  return '<svg class="rdr-spark" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none">'
    +'<polygon points="'+area+'" fill="'+col+'" opacity=".08"/>'
    +'<polyline points="'+pts.join(" ")+'" fill="none" stroke="'+col+'" stroke-width="1.6" stroke-linejoin="round"/></svg>'; }

/* ---------- 健康仪表 ---------- */
function gauge(score){ var r=52,c=2*Math.PI*r,off=c*(1-score/100);
  var col=score>=80?"#25C96F":score>=60?"#D6A84B":"#c0503a";
  return '<svg class="rdr-gauge" viewBox="0 0 130 130">'
    +'<circle cx="65" cy="65" r="'+r+'" fill="none" stroke="#231a10" stroke-width="10"/>'
    +'<circle cx="65" cy="65" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="10" stroke-linecap="round"'
    +' stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'" transform="rotate(-90 65 65)"/>'
    +'<text x="65" y="62" text-anchor="middle" class="rdr-gnum" fill="'+col+'">'+score+'</text>'
    +'<text x="65" y="84" text-anchor="middle" class="rdr-gsub">/ 100</text></svg>'; }

/* ---------- 卡片 ---------- */
function stat(label,val){ return '<div class="rdr-kv"><span>'+label+'</span><b>'+val+'</b></div>'; }
function card(cls,tag,head,headVal,rows,sparkSvg){
  return '<div class="rdr-card '+cls+'"><div class="rdr-card-tag">'+tag+'</div>'
    +'<div class="rdr-card-head"><span>'+head+'</span><div class="rdr-card-big">'+headVal+'</div></div>'
    +(sparkSvg||"")+'<div class="rdr-card-rows">'+rows+'</div></div>'; }

/* ---------- 主渲染 ---------- */
function render(){
  var R=window.__RADAR, root=document.getElementById("rdrBody");
  if(!root)return;
  if(!R||!R.ok){ root.innerHTML='<div class="rdr-err">'+t("err")+'</div>'; return; }
  var m=R.market||{},an=R.anubis||{},ec=R.eco||{},tr=R.treasury||{},wa=R.wallets||{},net=R.net||{};

  /* 顶部更新时间 + 网络状态 */
  var d=new Date(R.ts||Date.now());
  var pad=function(n){return (n<10?"0":"")+n;};
  var upd=d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+" "+pad(d.getHours())+":"+pad(d.getMinutes());
  var updEl=document.getElementById("rdrUpd"); if(updEl)updEl.textContent=upd;
  var netEl=document.getElementById("rdrNet");
  if(netEl){ var dotA=net.anubis!==false, dotP=net.polygon!==false;
    netEl.innerHTML='<span class="rdr-dot '+(dotA?"ok":"off")+'"></span>'+(dotA?t("anbOk"):"Anubis "+t("offline"))
      +'<span class="rdr-dot '+(dotP?"ok":"off")+'" style="margin-left:14px"></span>'+(dotP?t("polOk"):"Polygon "+t("offline")); }

  /* 5 张核心卡 */
  var cards="";
  var bsRow=(m.buys24h!=null)?stat(t("bs"),'<span style="color:#25C96F">'+fInt(m.buys24h)+'</span> / <span style="color:#e56a54">'+fInt(m.sells24h)+'</span>'):"";
  cards+=card("green","LGNS",t("c1h"),fPrice(m.price)+" "+chgPill(m.change24h),
    stat(t("vol"),fUSD(m.vol24h))+stat(t("mcap"),fUSD(m.mcap))+stat(t("supply"),fNum(m.supply))+bsRow,
    spark(m.spark,220,34,"#25C96F"));
  cards+=card("blue","ANUBIS",t("c2h"),fInt(an.height),
    stat(t("btime"),an.blockTime!=null?an.blockTime+"s":"—")+stat(t("tps"),an.tps!=null?an.tps:"—")
    +stat(t("gas"),an.gasGwei!=null?an.gasGwei+" gwei":"—")+stat(t("addrs"),fNum(an.addresses)),"");
  cards+=card("gold","ECO",t("c3h"),(ec.stakeRate!=null?ec.stakeRate.toFixed(1)+"%":"—"),
    stat(t("staked"),fNum(ec.staked)+" LGNS")+stat(t("tsupply"),fNum(ec.supply))
    +stat(t("lp"),fUSD(ec.lp)),"");
  cards+=card("cyan","WALLET",t("c4h"),fNum(wa.anbAddresses),
    stat(t("txtoday"),fInt(wa.txToday))+stat(t("txtotal"),fNum(wa.txTotal)),"");
  var tch=(tr.mvChange24h!=null)?chgPill(tr.mvChange24h):"—";
  cards+=card("amber","TREASURY",t("c5h"),fUSD(tr.marketValue),
    stat(t("mvchg"),tch)+stat(t("burn"),fNum(tr.burn)+" LGNS"),
    spark(tr.spark,220,34,"#D6A84B"));
  document.getElementById("rdrCards").innerHTML=cards;

  /* 实时事件流 */
  var ev=R.events||[], feed="";
  if(!ev.length) feed='<div class="rdr-empty">'+t("noev")+'</div>';
  else feed=ev.map(function(e){
    var isBuy=e.dir==="buy";
    return '<a class="rdr-row" href="'+PS+e.tx+'" target="_blank" rel="noopener">'
      +'<span class="rdr-badge '+(isBuy?"b":"s")+'">'+(isBuy?t("buy"):t("sell"))+'</span>'
      +'<span class="rdr-amt">'+fNum(e.lgns)+' LGNS</span>'
      +'<span class="rdr-dai">'+fUSD(e.dai)+'</span>'
      +'<span class="rdr-who">'+short(e.who)+'</span>'
      +'<span class="rdr-time">'+ago(e.ts)+'</span></a>';
  }).join("");
  document.getElementById("rdrFeed").innerHTML=feed;

  /* 鲸鱼 */
  var wh=R.whales||[], whale="";
  if(!wh.length) whale='<div class="rdr-empty">'+t("nowhale")+'</div>';
  else whale=wh.map(function(e){ var isBuy=e.dir==="buy";
    return '<a class="rdr-row rdr-wrow" href="'+PS+e.tx+'" target="_blank" rel="noopener">'
      +'<span class="rdr-whale-ic">🐋</span>'
      +'<span class="rdr-badge '+(isBuy?"b":"s")+'">'+(isBuy?t("buy"):t("sell"))+'</span>'
      +'<span class="rdr-amt big">'+fNum(e.lgns)+' LGNS</span>'
      +'<span class="rdr-dai">'+fUSD(e.dai)+'</span>'
      +'<span class="rdr-time">'+ago(e.ts)+'</span></a>';
  }).join("");
  document.getElementById("rdrWhale").innerHTML=whale;

  /* 健康指数 */
  var H=R.health||{parts:[]}, labels={liq:t("hliq"),act:t("hact"),stk:t("hstk"),sup:t("hsup"),sec:t("hsec")};
  var bars=(H.parts||[]).map(function(p){ var pct=Math.round(p.got/p.max*100);
    return '<div class="rdr-hbar"><div class="rdr-hbar-top"><span>'+(labels[p.k]||p.k)+'</span>'
      +'<b>'+p.got+'<i>/'+p.max+'</i></b></div>'
      +'<div class="rdr-hbar-track"><div class="rdr-hbar-fill" style="width:'+pct+'%"></div></div>'
      +'<div class="rdr-hbasis">'+ (p.basis||"") +'</div></div>';
  }).join("");
  document.getElementById("rdrHealth").innerHTML=
    '<div class="rdr-hgauge">'+gauge(H.score||0)+'</div>'
    +'<div class="rdr-hbars">'+bars+'</div>'
    +'<div class="rdr-hnote">'+t("hnote")+'</div>';

  /* 风险雷达 */
  var risk=R.risk||{items:[]};
  var ri=(risk.items||[]).map(function(x){ var ic=x.t==="warn"?"⚠️":x.t==="ok"?"✅":"🔹";
    return '<div class="rdr-risk-item '+x.t+'"><span>'+ic+'</span>'+x.m+'</div>'; }).join("");
  document.getElementById("rdrRisk").innerHTML=ri;

  /* 快捷入口本地化 */
  var q=document.getElementById("rdrQuick");
  if(q){ var b=q.querySelectorAll(".rdr-q span.lbl");
    if(b[0])b[0].textContent=t("q1"); if(b[1])b[1].textContent=t("q2");
    if(b[2])b[2].textContent=t("q3"); if(b[3])b[3].textContent=t("q4"); }
  /* 资金流向标签本地化 */
  var fl=document.getElementById("rdrFlow");
  if(fl){ var fn=fl.querySelectorAll("[data-fl]");
    fn.forEach(function(n){ n.textContent=t(n.getAttribute("data-fl")); }); }

  /* 标题区文案 */
  var sT=document.getElementById("rdrTitle"), sS=document.getElementById("rdrSubt");
  if(sT)sT.firstChild.textContent=t("title")+" ";
  if(sS)sS.textContent=t("sub");
  document.getElementById("rdrUpdLabel").textContent=t("upd")+"：";
  var ft=document.getElementById("rdrFoot"); if(ft)ft.textContent=t("foot");
  /* 面板标题 */
  setTx("rdrH-feed",t("feed"));setTx("rdrH-whale",t("whale"));setTx("rdrH-health",t("health"));
  setTx("rdrH-risk",t("risk"));setTx("rdrH-flow",t("flow"));
}
function setTx(id,txt){ var e=document.getElementById(id); if(e)e.lastChild.textContent=" "+txt; }
window.renderRadar=render;

/* ---------- 客户端补 24h 成交量/买卖笔数(浏览器直连 GeckoTerminal，CF Worker 被 DEX 聚合器拦) ---------- */
var GT="https://api.geckoterminal.com/api/v2/networks/polygon_pos/pools/0x882df4B0fB50a229C3B4124EB18c759911485bFb";
function loadVol(){
  fetch(GT,{headers:{"Accept":"application/json"}}).then(function(r){return r.json();}).then(function(g){
    var a=g&&g.data&&g.data.attributes; if(!a||!window.__RADAR||!window.__RADAR.market)return;
    var m=window.__RADAR.market;
    if(a.volume_usd&&a.volume_usd.h24!=null)m.vol24h=+a.volume_usd.h24;
    if(a.price_change_percentage&&a.price_change_percentage.h24!=null)m.change24h=+a.price_change_percentage.h24;
    if(a.transactions&&a.transactions.h24){m.buys24h=a.transactions.h24.buys;m.sells24h=a.transactions.h24.sells;}
    render();
  }).catch(function(){});
}

/* ---------- 拉数据 ---------- */
function load(){
  fetch(API,{cache:"no-store"}).then(function(r){return r.json();}).then(function(j){
    window.__RADAR=j; render(); loadVol();
  }).catch(function(){ if(!window.__RADAR){ var b=document.getElementById("rdrBody"); if(b)b.innerHTML='<div class="rdr-err">'+t("err")+'</div>'; } });
}

/* ---------- 样式注入 ---------- */
function css(){ if(document.getElementById("rdrCss"))return;
  var s=document.createElement("style"); s.id="rdrCss";
  s.textContent=[
"#radar{--rg:#25C96F;--rgd:#0d1f16;position:relative;max-width:1200px;margin:0 auto;padding:34px 20px 20px}",
".rdr-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:18px}",
".rdr-title{display:flex;align-items:center;gap:14px}",
".rdr-title .rdr-mk{width:40px;height:40px;flex:0 0 auto}",
"#rdrTitle{font-size:clamp(21px,3.4vw,29px);color:var(--gold-lt);margin:0;font-family:var(--serif);display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}",
"#rdrTitle em{font-style:normal;font-size:14px;letter-spacing:.14em;color:var(--rg);font-family:var(--sans)}",
"#rdrSubt{margin:4px 0 0;font-size:12.5px;color:var(--soft)}",
".rdr-meta{text-align:right;font-size:12px;color:var(--muted)}",
".rdr-meta .rdr-net{margin-top:5px;color:var(--soft)}",
".rdr-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px;vertical-align:middle}",
".rdr-dot.ok{background:var(--rg);box-shadow:0 0 6px var(--rg);animation:rdrpulse 2s infinite}",
".rdr-dot.off{background:#c0503a}",
"@keyframes rdrpulse{0%,100%{opacity:1}50%{opacity:.4}}",
"#rdrUpd{color:var(--gold-lt);font-variant-numeric:tabular-nums}",
/* 卡片 */
".rdr-cards{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:14px}",
".rdr-card{background:linear-gradient(160deg,#12100c,#0b0908);border:1px solid var(--line);border-radius:13px;padding:14px 14px 12px;position:relative;overflow:hidden;min-width:0}",
".rdr-card::before{content:'';position:absolute;top:0;left:0;width:100%;height:2px;opacity:.85}",
".rdr-card.green::before{background:linear-gradient(90deg,#25C96F,transparent)}",
".rdr-card.blue::before{background:linear-gradient(90deg,#3aa0ff,transparent)}",
".rdr-card.gold::before{background:linear-gradient(90deg,#D6A84B,transparent)}",
".rdr-card.cyan::before{background:linear-gradient(90deg,#2fd6c7,transparent)}",
".rdr-card.amber::before{background:linear-gradient(90deg,#e0a24f,transparent)}",
".rdr-card-tag{font-size:10.5px;letter-spacing:.16em;color:var(--muted);font-weight:700}",
".rdr-card-head>span{font-size:11.5px;color:var(--soft);display:block;margin-top:9px}",
".rdr-card-big{font-size:23px;font-weight:800;color:var(--bone);letter-spacing:.5px;font-variant-numeric:tabular-nums;margin-top:1px;line-height:1.15;display:flex;align-items:baseline;gap:7px;flex-wrap:wrap}",
".rdr-card.green .rdr-card-big{color:var(--rg)}",
".rdr-spark{width:100%;height:30px;margin:6px 0 2px;display:block}",
".rdr-card-rows{margin-top:7px;border-top:1px solid rgba(58,35,19,.6);padding-top:7px}",
".rdr-kv{display:flex;justify-content:space-between;font-size:12px;padding:2.5px 0}",
".rdr-kv span{color:var(--muted)}.rdr-kv b{color:var(--ink);font-weight:600;font-variant-numeric:tabular-nums}",
".rdr-pill{font-size:12px;font-weight:700;padding:1px 7px;border-radius:20px}",
".rdr-pill.up{color:#25C96F;background:rgba(37,201,111,.12)}",
".rdr-pill.dn{color:#e56a54;background:rgba(229,106,84,.12)}",
".rdr-pill.flat{color:var(--muted)}",
/* 中部网格 */
".rdr-grid{display:grid;grid-template-columns:1.15fr 1fr;gap:12px}",
".rdr-panel{background:linear-gradient(160deg,#100e0b,#0a0807);border:1px solid var(--line);border-radius:13px;padding:13px 15px;margin-bottom:12px}",
".rdr-panel h3{font-size:14px;color:var(--gold-lt);margin:0 0 10px;font-family:var(--sans);font-weight:700;display:flex;align-items:center}",
".rdr-panel h3 .hi{margin-right:2px}",
".rdr-row{display:flex;align-items:center;gap:9px;padding:7px 6px;border-radius:7px;font-size:12.5px;color:var(--ink);border-bottom:1px solid rgba(58,35,19,.4)}",
".rdr-row:hover{background:rgba(214,168,75,.05)}",
".rdr-badge{font-size:11px;font-weight:700;padding:1px 7px;border-radius:5px;flex:0 0 auto}",
".rdr-badge.b{color:#25C96F;background:rgba(37,201,111,.13)}",
".rdr-badge.s{color:#e56a54;background:rgba(229,106,84,.13)}",
".rdr-amt{font-weight:700;color:var(--bone);font-variant-numeric:tabular-nums;min-width:82px}",
".rdr-amt.big{color:var(--gold-lt)}",
".rdr-dai{color:var(--soft);font-variant-numeric:tabular-nums;flex:1}",
".rdr-who{color:var(--muted);font-family:var(--mono,monospace);font-size:11.5px}",
".rdr-time{color:var(--muted);font-size:11px;white-space:nowrap;margin-left:auto}",
".rdr-whale-ic{flex:0 0 auto}",
".rdr-empty{color:var(--muted);font-size:12.5px;text-align:center;padding:18px 0}",
/* 健康 */
".rdr-health-wrap{display:flex;gap:16px;align-items:flex-start}",
"#rdrHealth{display:flex;gap:15px;align-items:flex-start;flex-wrap:wrap}",
".rdr-hgauge{flex:0 0 auto}",
".rdr-gauge{width:112px;height:112px}",
".rdr-gnum{font-size:34px;font-weight:800}.rdr-gsub{font-size:11px;fill:var(--muted)}",
".rdr-hbars{flex:1;min-width:180px}",
".rdr-hbar{margin-bottom:8px}",
".rdr-hbar-top{display:flex;justify-content:space-between;font-size:11.5px;color:var(--soft)}",
".rdr-hbar-top b{color:var(--ink);font-weight:700}.rdr-hbar-top i{color:var(--muted);font-style:normal;font-size:10.5px}",
".rdr-hbar-track{height:5px;background:#231a10;border-radius:4px;margin:3px 0 1px;overflow:hidden}",
".rdr-hbar-fill{height:100%;background:linear-gradient(90deg,#1c8f2d,#25C96F);border-radius:4px}",
".rdr-hbasis{font-size:10.5px;color:var(--muted)}",
".rdr-hnote{flex-basis:100%;font-size:10.5px;color:var(--muted);border-top:1px dashed var(--line);padding-top:7px;margin-top:2px}",
/* 风险 */
".rdr-risk-item{font-size:12.5px;padding:7px 9px;border-radius:7px;margin-bottom:6px;color:var(--ink);display:flex;gap:8px;align-items:flex-start}",
".rdr-risk-item span{flex:0 0 auto}",
".rdr-risk-item.warn{background:rgba(229,106,84,.09);border:1px solid rgba(229,106,84,.25)}",
".rdr-risk-item.info{background:rgba(214,168,75,.07);border:1px solid rgba(214,168,75,.18)}",
".rdr-risk-item.ok{background:rgba(37,201,111,.07);border:1px solid rgba(37,201,111,.2)}",
/* 资金流向 */
"#rdrFlow{display:flex;align-items:center;justify-content:space-between;gap:4px;flex-wrap:wrap;padding:6px 0}",
".rdr-node{flex:1;min-width:54px;text-align:center;font-size:11.5px;color:var(--ink);background:#0d1712;border:1px solid var(--line);border-radius:9px;padding:9px 4px}",
".rdr-node b{display:block;font-size:16px;margin-bottom:2px}",
".rdr-node.t1{border-color:rgba(37,201,111,.4)}.rdr-node.t5{border-color:rgba(214,168,75,.4)}",
".rdr-arrow{flex:0 0 auto;color:var(--rg);font-size:15px;opacity:.7}",
".rdr-flow-note{font-size:10.5px;color:var(--muted);text-align:center;margin-top:8px}",
/* 快捷入口 */
".rdr-quick{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0 6px}",
".rdr-q{display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(160deg,#161009,#0d0a07);border:1px solid var(--line);border-radius:11px;padding:13px 8px;cursor:pointer;color:var(--gold-lt);font-size:13.5px;font-weight:600;transition:.15s}",
".rdr-q:hover{border-color:var(--rg);color:var(--bone);transform:translateY(-1px)}",
".rdr-q b{font-size:17px}",
".rdr-foot{font-size:11px;color:var(--muted);line-height:1.7;margin:14px 0 0;border-top:1px solid var(--line);padding-top:12px}",
".rdr-err{text-align:center;color:var(--soft);padding:40px 20px;font-size:13px}",
/* 手机端 */
"@media(max-width:900px){",
"  .rdr-cards{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:78%;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:6px;-webkit-overflow-scrolling:touch}",
"  .rdr-card{scroll-snap-align:start}",
"  .rdr-grid{grid-template-columns:none}",
"  .rdr-quick{grid-template-columns:repeat(2,1fr)}",
"  .rdr-head{align-items:flex-start}.rdr-meta{text-align:left}",
"  .rdr-dai{display:none}",
"}",
"@media(prefers-reduced-motion:reduce){.rdr-dot.ok{animation:none}}"
  ].join("\n");
  document.head.appendChild(s);
}

/* ---------- 初始化 ---------- */
function init(){
  css();
  var q=document.getElementById("rdrQuick");
  if(q) q.addEventListener("click",function(e){ var b=e.target.closest(".rdr-q"); if(!b)return;
    var fn=b.getAttribute("data-fn"); if(fn&&typeof window[fn]==="function")window[fn](); });
  load();
  setInterval(load,60000);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
