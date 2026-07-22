/* ═══════════ Web3Origin 个人中心 · 我的链上中心 ═══════════
   钱包连接(注入式) + personal_sign 身份签名(只读·不发交易·不碰私钥/助记词)。
   个人数据(多钱包/监控/收藏/报告/提醒/等级)全部存浏览器 localStorage，不上传、不收集。
   资产/授权读自建 Worker /wallet；行情读 /radar。需真后端的(邮件/TG推送/跨设备同步/公开主页)界面标「预留」。 */
(function(){
"use strict";
var W="https://count.web3origin.com";
var DK="origin_dash_v1", AK="origin_dash_addr", ACADK="origin_academy_v1";
var PS="https://polygonscan.com/address/";

/* ---------- 数据层 ---------- */
function db(){try{return JSON.parse(localStorage.getItem(DK))||{};}catch(e){return {};}}
function save(d){try{localStorage.setItem(DK,JSON.stringify(d));}catch(e){}}
function def(){var d=db();d.wallets=d.wallets||[];d.monitors=d.monitors||[];d.bookmarks=d.bookmarks||[];
  d.reports=d.reports||[];d.pref=d.pref||{pricePct:10,largeLGNS:1000,email:"",tg:""};d.seen=d.seen||{};d.profile=d.profile||{nick:"",pub:false};return d;}
function addr(){try{return localStorage.getItem(AK)||"";}catch(e){return "";}}
function setAddr(a){try{if(a)localStorage.setItem(AK,a);else localStorage.removeItem(AK);}catch(e){}}
function acad(){try{return JSON.parse(localStorage.getItem(ACADK))||{done:{},fav:{}};}catch(e){return {done:{},fav:{}};}}

/* ---------- 工具 ---------- */
function short(a){return a&&a.length>12?a.slice(0,6)+"…"+a.slice(-4):(a||"");}
function fUSD(n){if(n==null||isNaN(n))return "—";var a=Math.abs(n);if(a>=1e6)return "$"+(n/1e6).toFixed(2)+"M";if(a>=1e3)return "$"+(n/1e3).toFixed(1)+"K";return "$"+n.toFixed(2);}
function fNum(n){if(n==null||isNaN(n))return "—";if(Math.abs(n)>=1e6)return (n/1e6).toFixed(2)+"M";if(Math.abs(n)>=1e3)return (n/1e3).toFixed(1)+"K";return (+n).toLocaleString("en-US",{maximumFractionDigits:4});}
function ago(ts){if(!ts)return "";var s=Math.floor(Date.now()/1000)-ts;if(s<60)return "刚刚";if(s<3600)return Math.floor(s/60)+"分钟前";if(s<86400)return Math.floor(s/3600)+"小时前";return Math.floor(s/86400)+"天前";}
function avatarBg(a){a=(a||"0x000000").toLowerCase();var x=parseInt(a.slice(2,8),16)||0,y=parseInt(a.slice(8,14),16)||0;return "linear-gradient(135deg,hsl("+(x%360)+",65%,48%),hsl("+(y%360)+",70%,34%))";}
function chainName(id){var m={"0x1":"Ethereum","0x89":"Polygon","0x1a3a":"Anubis","0x38":"BNB Chain"};return m[id]||("Chain "+(id?parseInt(id,16):"?"));}
function esc(s){return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function toast(m){var t=document.getElementById("dashToast");if(!t){t=document.createElement("div");t.id="dashToast";document.body.appendChild(t);}t.textContent=m;t.className="show";clearTimeout(t._t);t._t=setTimeout(function(){t.className="";},2200);}

/* ---------- 钱包连接 ---------- */
var NET="0x89";
function getEth(){return window.ethereum||null;}
function walletName(){var e=getEth();if(!e)return "";if(e.isMetaMask)return "MetaMask";if(e.isOkxWallet||e.isOKExWallet)return "OKX";if(e.isTokenPocket)return "TokenPocket";return "钱包";}
async function connect(){
  var e=getEth();
  if(!e){ toast("未检测到钱包插件，请在 MetaMask / OKX / TokenPocket 等钱包内打开"); return; }
  try{
    var accts=await e.request({method:"eth_requestAccounts"});
    var a=(accts&&accts[0]||"").toLowerCase(); if(!a)return;
    try{ NET=await e.request({method:"eth_chainId"}); }catch(_){}
    // 身份签名(仅验证身份，不发交易)
    var msg="登录 Web3Origin 个人中心\n地址："+a+"\n用途：仅用于身份验证，本操作不会发起任何链上交易、不会转移任何资产。\n时间："+new Date().toLocaleString();
    try{ await e.request({method:"personal_sign",params:[msg,a]}); }
    catch(se){ toast("已取消签名，未登录"); return; }
    setAddr(a);
    var d=def(); if(!d.wallets.some(function(w){return w.addr===a;})){ d.wallets.unshift({addr:a,label:"主钱包",added:Date.now()}); save(d); }
    bindEvents(); render();
  }catch(err){ toast("连接失败："+(err&&err.message||"用户拒绝")); }
}
function disconnect(){ setAddr(""); render(); }
var _bound=false;
function bindEvents(){ var e=getEth(); if(!e||_bound)return; _bound=true;
  if(e.on){ e.on("accountsChanged",function(ac){ if(!ac||!ac.length){disconnect();} else { setAddr(ac[0].toLowerCase()); render(); } });
    e.on("chainChanged",function(id){ NET=id; render(); }); } }

/* ---------- 拉链上数据(Worker /wallet 双链) ---------- */
var _cache={},_acache={};
// 快:只查余额(/assets,约2-3秒) — 资产卡/概览用
async function assetsData(a){
  if(_acache[a]&&Date.now()-_acache[a].t<45000)return _acache[a].d;
  var out={polygon:null,anubis:null};
  try{ var r=await Promise.all([
    fetch(W+"/assets?chain=polygon&addr="+a).then(function(x){return x.json();}),
    fetch(W+"/assets?chain=anubis&addr="+a).then(function(x){return x.json();}) ]);
    out.polygon=r[0]&&r[0].ok?r[0]:null; out.anubis=r[1]&&r[1].ok?r[1]:null;
  }catch(e){}
  _acache[a]={t:Date.now(),d:out}; return out;
}
// 全:含转账/授权(/wallet,首次较慢) — 安全/监控/报告用
async function walletData(a){
  if(_cache[a]&&Date.now()-_cache[a].t<45000)return _cache[a].d;
  var out={polygon:null,anubis:null};
  try{ var r=await Promise.all([
    fetch(W+"/wallet?chain=polygon&addr="+a).then(function(x){return x.json();}),
    fetch(W+"/wallet?chain=anubis&addr="+a).then(function(x){return x.json();}) ]);
    out.polygon=r[0]&&r[0].ok?r[0]:null; out.anubis=r[1]&&r[1].ok?r[1]:null;
  }catch(e){}
  _cache[a]={t:Date.now(),d:out}; return out;
}
var _radar=null;
async function radar(){ if(_radar&&Date.now()-_radar.t<60000)return _radar.d; try{var d=await fetch(W+"/radar").then(function(x){return x.json();});_radar={t:Date.now(),d:d};return d;}catch(e){return null;} }
function priceOf(sym,rd){ var p=(rd&&rd.market&&rd.market.price)||null; if(sym==="DAI"||sym==="USDT")return 1; if(sym==="LGNS"||sym==="sLGNS")return p; return null; }

/* ---------- 等级(Web3Origin Rank) ---------- */
var RANKS=["Web3新人","链上用户","DeFi探索者","链上研究员","Origin专家"];
var RTH=[0,15,40,80,140];
function rankInfo(){ var d=def(),ac=acad();
  var done=Object.keys(ac.done||{}).length;
  var pts=done*3 + d.wallets.length*2 + d.monitors.length*2 + d.reports.length*5 + d.bookmarks.length*1;
  var i=0;for(var k=0;k<RTH.length;k++){if(pts>=RTH[k])i=k;}
  var next=i<4?RTH[i+1]:null;
  return {lv:i+1,name:RANKS[i],pts:pts,next:next,done:done};
}

/* ---------- 提醒计算(打开时客户端计算) ---------- */
async function computeAlerts(){
  var d=def(),out=[],a=addr();
  var rd=await radar();
  if(rd&&rd.market&&rd.market.change24h!=null&&Math.abs(rd.market.change24h)>=(d.pref.pricePct||10))
    out.push({t:"price",lv:"info",m:"LGNS 24h 价格变化 "+rd.market.change24h.toFixed(1)+"%（阈值 "+(d.pref.pricePct||10)+"%）",ts:Math.floor(Date.now()/1000)});
  // 监控地址近期转账
  for(var i=0;i<d.monitors.length;i++){ var mo=d.monitors[i];
    try{ var wd=await walletData(mo.addr); var tr=(wd.polygon&&wd.polygon.transfers)||[];
      tr.slice(0,6).forEach(function(x){ if(mo.lastSeenTs&&x.ts<=mo.lastSeenTs)return;
        var big=(x.token==="LGNS"&&x.amount>=(d.pref.largeLGNS||1000));
        if(!mo.lastSeenTs||big||x.amount>0) out.push({t:"monitor",lv:big?"warn":"info",
          m:(mo.label||short(mo.addr))+" "+(x.dir==="in"?"转入":"转出")+" "+fNum(x.amount)+" "+(x.token||"")+(big?"（大额）":""),ts:x.ts,hash:x.hash}); });
      if(tr[0]){ mo.lastSeenTs=tr[0].ts; }
    }catch(e){}
  }
  save(d);
  // 风险授权
  if(a){ try{ var w=await walletData(a); var ap=(w.polygon&&w.polygon.approvals)||[]; var unl=ap.filter(function(x){return x.unlimited;});
    if(unl.length) out.push({t:"risk",lv:"warn",m:"检测到 "+unl.length+" 个无限授权，建议尽快撤销",ts:Math.floor(Date.now()/1000)}); }catch(e){} }
  // 新闻:最新日报一句话
  try{ var dl=await fetch(W+"/daily").then(function(x){return x.json();}); if(dl&&dl.ok&&dl.market&&dl.market.price!=null){
    out.push({t:"news",lv:"info",m:"今日 LGNS 约 "+(+dl.market.price).toFixed(3)+" DAI"+(dl.buys!=null?"，买 "+dl.buys+" / 卖 "+dl.sells+" 笔":""),ts:dl.generatedAt?Math.floor(dl.generatedAt/1000):Math.floor(Date.now()/1000)}); } }catch(e){}
  out.sort(function(x,y){return y.ts-x.ts;});
  return out;
}

/* ═══════════ 渲染 ═══════════ */
var NAV=[["overview","🏠","概览"],["assets","💰","资产"],["wallets","👛","我的钱包"],["monitor","📡","钱包监控"],
  ["alerts","🔔","提醒中心"],["research","⭐","研究收藏"],["reports","📄","链上报告"],["learn","🎓","学习中心"],
  ["security","🛡️","安全中心"],["rank","🏆","我的等级"]];
var MNAV=[["overview","🏠","首页"],["assets","💰","资产"],["monitor","📡","监控"],["learn","🎓","学习"],["rank","🏆","我的"]];
var _active="overview";

function render(){
  css(); var root=document.getElementById("dashRoot"); if(!root)return;
  if(!addr()){ root.innerHTML=gateHTML(); wireGate(); return; }
  root.innerHTML=shellHTML();
  wireShell(); go(_active);
}
function gateHTML(){
  var has=!!getEth();
  return '<div class="d-gate">'+topbar()+
    '<div class="d-gate-in"><div class="d-gate-logo">◎</div>'
    +'<h1>我的链上中心</h1><p class="d-en">Web3Origin Dashboard</p>'
    +'<p class="d-gate-sub">连接钱包，管理你自己的链上资产、监控、收藏、学习进度与研究报告——每个 Origin 用户自己的链上工作空间。</p>'
    +'<button class="d-connect" id="dGateConnect">🔗 连接钱包'+(has?"（"+walletName()+"）":"")+'</button>'
    +'<div class="d-wallets-hint">支持 MetaMask · OKX · TokenPocket 等注入式钱包 · WalletConnect（预留）</div>'
    +'<div class="d-safe">🔒 只做<b>身份签名</b>与<b>只读</b>公开数据 · 本站<b>绝不索要</b>你的助记词 / 私钥 / 钱包密码，也<b>不会发起任何交易</b></div>'
    +'</div></div>';
}
function wireGate(){ var b=document.getElementById("dGateConnect"); if(b)b.onclick=connect; }

function topbar(){
  return '<nav class="d-top"><a class="d-brand" href="/"><img src="/assets/logo.svg" alt=""><span>起源 · <b>个人中心</b></span></a>'
    +'<span class="d-sp"></span><a href="/academy/">学习学院</a><a href="/#radar">链上雷达</a><a href="/">返回主站</a></nav>';
}
function shellHTML(){
  var a=addr(),d=def(),ri=rankInfo();
  var head='<div class="d-userhead"><div class="d-ava" style="background:'+avatarBg(a)+'"></div>'
    +'<div class="d-uinfo"><div class="d-uaddr">'+short(a)+' <button class="d-copy" data-copy="'+a+'" title="复制地址">⧉</button></div>'
    +'<div class="d-umeta"><span class="d-net"><span class="d-dot"></span>'+chainName(NET)+'</span> · <span>Lv.'+ri.lv+' '+ri.name+'</span></div></div>'
    +'<div class="d-uact"><a class="d-mini" href="'+PS+a+'" target="_blank" rel="noopener">链上记录 ↗</a>'
    +'<button class="d-mini d-dis" id="dDisc">断开</button></div></div>';
  var side='<aside class="d-side">'+NAV.map(function(n){return '<button class="d-navi" data-go="'+n[0]+'"><span>'+n[1]+'</span>'+n[2]+'</button>';}).join("")+'</aside>';
  var mnav='<nav class="d-bottom">'+MNAV.map(function(n){return '<button class="d-bi" data-go="'+n[0]+'"><span>'+n[1]+'</span>'+n[2]+'</button>';}).join("")+'</nav>';
  return topbar()+'<div class="d-body">'+side+'<main class="d-main">'+head+'<div id="dPanel"></div></main></div>'+mnav;
}
function wireShell(){
  document.getElementById("dRootBind")||0;
  document.querySelectorAll("[data-go]").forEach(function(b){b.onclick=function(){go(b.getAttribute("data-go"));};});
  var dc=document.getElementById("dDisc"); if(dc)dc.onclick=disconnect;
  document.querySelectorAll(".d-copy").forEach(function(b){b.onclick=function(){navigator.clipboard&&navigator.clipboard.writeText(b.getAttribute("data-copy"));toast("地址已复制");};});
}
function go(p){ _active=p;
  document.querySelectorAll(".d-navi").forEach(function(b){b.classList.toggle("on",b.getAttribute("data-go")===p);});
  document.querySelectorAll(".d-bi").forEach(function(b){b.classList.toggle("on",b.getAttribute("data-go")===p);});
  var el=document.getElementById("dPanel"); if(!el)return; el.innerHTML='<div class="d-load">加载中…</div>';
  var fn={overview:pOverview,assets:pAssets,wallets:pWallets,monitor:pMonitor,alerts:pAlerts,research:pResearch,reports:pReports,learn:pLearn,security:pSecurity,rank:pRank}[p];
  if(fn)fn(el);
}
function panel(el,title,sub,body){ el.innerHTML='<div class="d-phead"><h2>'+title+'</h2>'+(sub?'<p>'+sub+'</p>':'')+'</div>'+body; }

/* ---------- 概览 ---------- */
async function pOverview(el){
  var d=def(),ri=rankInfo(),ac=acad();
  var rd=await radar();
  var wd=await assetsData(addr());
  var val=assetValue(wd,rd);
  var alerts=[];
  if(rd&&rd.market&&rd.market.change24h!=null&&Math.abs(rd.market.change24h)>=(d.pref.pricePct||10))
    alerts.push({t:"price",lv:"info",m:"LGNS 24h 价格变化 "+rd.market.change24h.toFixed(1)+"%（阈值 "+(d.pref.pricePct||10)+"%）",ts:Math.floor(Date.now()/1000)});
  var acTotal=(window.ACADEMY||[]).length||36, acDone=Object.keys(ac.done||{}).length;
  var cards='<div class="d-stats">'
    +stat("💰","资产估值",fUSD(val),"assets")
    +stat("👛","我的钱包",d.wallets.length+" 个","wallets")
    +stat("📡","监控地址",d.monitors.length+" 个","monitor")
    +stat("🎓","学习进度",acDone+"/"+acTotal,"learn")
    +stat("⭐","研究收藏",d.bookmarks.length+" 条","research")
    +stat("🏆","我的等级","Lv."+ri.lv,"rank")+'</div>';
  if(_active!=="overview")return;
  var al=alerts.slice(0,5).map(alertRow).join("")||'<div class="d-empty">暂无提醒</div>';
  panel(el,"概览","你的链上工作台一览",
    cards+'<div class="d-2col"><div class="d-card"><h3>🔔 最近提醒</h3>'+al+'<button class="d-more" data-go="alerts">查看全部提醒 ›</button></div>'
    +'<div class="d-card"><h3>🏆 我的等级</h3>'+rankBody(ri)+'</div></div>');
  wireShell(); document.querySelectorAll(".d-stat,[data-go]").forEach(function(b){var g=b.getAttribute("data-go");if(g)b.onclick=function(){go(g);};});
}
function stat(ic,label,val,go){return '<button class="d-stat" data-go="'+go+'"><div class="d-stat-ic">'+ic+'</div><div class="d-stat-v">'+val+'</div><div class="d-stat-l">'+label+'</div></button>';}
function assetValue(wd,rd){ var v=0; ["polygon","anubis"].forEach(function(c){ var w=wd&&wd[c]; if(!w)return;
  (w.tokens||[]).forEach(function(tk){var p=priceOf(tk.sym,rd);if(p!=null)v+=tk.amount*p;});
  if(w.native&&(w.native.sym==="DAI"))v+=w.native.amount; }); return v; }

/* ---------- 资产 ---------- */
async function pAssets(el){
  var rd=await radar(), wd=await assetsData(addr());
  var rows=[],total=0;
  ["polygon","anubis"].forEach(function(c){ var w=wd&&wd[c]; if(!w)return;
    if(w.native&&w.native.amount>0){ var pv=w.native.sym==="DAI"?w.native.amount:null; if(pv!=null)total+=pv;
      rows.push({sym:w.native.sym,chain:c,amt:w.native.amount,val:pv}); }
    (w.tokens||[]).forEach(function(tk){ if(tk.amount<=0)return; var p=priceOf(tk.sym,rd); var val=p!=null?tk.amount*p:null; if(val)total+=val;
      rows.push({sym:tk.sym,chain:c,amt:tk.amount,val:val,price:p}); }); });
  // 合并同名(跨链)
  rows.sort(function(a,b){return (b.val||0)-(a.val||0);});
  var chg=rd&&rd.market&&rd.market.change24h;
  var body='<div class="d-card d-asset-sum"><div class="d-asset-total">'+fUSD(total)+'</div><div class="d-asset-sub">估算总价值（LGNS/sLGNS 按现价，DAI/USDT 按 $1；其它仅计数）'
    +(chg!=null?' · LGNS 24h <b class="'+(chg>=0?"up":"dn")+'">'+(chg>=0?"+":"")+chg.toFixed(1)+'%</b>':'')+'</div></div>';
  if(_active!=="assets")return;
  body+='<div class="d-card"><table class="d-tbl"><thead><tr><th>代币</th><th>链</th><th>数量</th><th>现价</th><th>估值</th></tr></thead><tbody>'
    +(rows.length?rows.map(function(r){return '<tr><td><b>'+esc(r.sym)+'</b></td><td><span class="d-chip '+r.chain+'">'+(r.chain==="polygon"?"Polygon":"Anubis")+'</span></td>'
      +'<td>'+fNum(r.amt)+'</td><td>'+(r.price!=null?"$"+(+r.price).toFixed(4):"—")+'</td><td>'+(r.val!=null?fUSD(r.val):"—")+'</td></tr>';}).join("")
      :'<tr><td colspan="5" class="d-empty">该地址暂无可显示的代币余额</td></tr>')+'</tbody></table></div>';
  panel(el,"我的资产","连接地址在 Polygon 与 Anubis 两条链上的公开代币余额",body);
}

/* ---------- 我的钱包 ---------- */
function pWallets(el){
  var d=def();
  var list=d.wallets.map(function(w,i){return '<div class="d-wrow"><div class="d-ava sm" style="background:'+avatarBg(w.addr)+'"></div>'
    +'<div class="d-wmid"><input class="d-wlabel" data-i="'+i+'" value="'+esc(w.label||"")+'" placeholder="备注名"><div class="d-waddr">'+esc(w.addr)+(w.addr===addr()?' <span class="d-tag-cur">当前</span>':'')+'</div></div>'
    +'<div class="d-wact"><button class="d-mini" data-view="'+esc(w.addr)+'">查看资产</button><button class="d-mini d-del" data-del="'+i+'">删除</button></div></div>';}).join("")
    ||'<div class="d-empty">还没有添加钱包</div>';
  panel(el,"我的钱包","添加多个地址统一查看（主钱包 / 观察钱包 / 团队钱包）。备注只存在你本地。",
    '<div class="d-card"><div class="d-addwrap"><input id="dNewAddr" placeholder="粘贴要添加的地址 0x…"><input id="dNewLabel" placeholder="备注名（如 观察钱包）" style="max-width:160px"><button class="d-btn" id="dAddW">添加</button></div></div>'
    +'<div class="d-card">'+list+'</div>');
  document.getElementById("dAddW").onclick=function(){ var a=(document.getElementById("dNewAddr").value||"").trim().toLowerCase();
    if(!/^0x[0-9a-f]{40}$/.test(a)){toast("地址格式不对");return;}
    var d=def(); if(d.wallets.some(function(w){return w.addr===a;})){toast("已添加过");return;}
    d.wallets.push({addr:a,label:(document.getElementById("dNewLabel").value||"").trim()||"钱包",added:Date.now()});save(d);go("wallets");toast("已添加"); };
  el.querySelectorAll(".d-wlabel").forEach(function(inp){inp.onchange=function(){var d=def();d.wallets[+inp.getAttribute("data-i")].label=inp.value;save(d);toast("已保存备注");};});
  el.querySelectorAll("[data-del]").forEach(function(b){b.onclick=function(){var d=def();d.wallets.splice(+b.getAttribute("data-del"),1);save(d);go("wallets");};});
  el.querySelectorAll("[data-view]").forEach(function(b){b.onclick=function(){setAddr(b.getAttribute("data-view"));_cache={};render();};});
}

/* ---------- 钱包监控 ---------- */
function pMonitor(el){
  var d=def();
  var list=d.monitors.map(function(m,i){var wt=m.watch||{};
    return '<div class="d-mrow"><div class="d-mmid"><div class="d-maddr"><b>'+esc(m.label||"监控地址")+'</b> '+short(m.addr)+'</div>'
    +'<div class="d-mtags">'+["transfer:转账","buy:买入","sell:卖出","stake:质押","approval:授权"].map(function(t){var k=t.split(":")[0];return '<label class="d-mt"><input type="checkbox" data-i="'+i+'" data-k="'+k+'"'+(wt[k]?" checked":"")+'>'+t.split(":")[1]+'</label>';}).join("")+'</div></div>'
    +'<button class="d-mini d-del" data-mdel="'+i+'">移除</button></div>';}).join("")||'<div class="d-empty">还没有设置监控地址</div>';
  panel(el,"钱包监控","设置要盯的地址与事件类型。<b>打开本页时</b>会检查监控地址的近期链上活动并汇总到「提醒中心」。定时推送到 邮件/Telegram 属常驻后端能力（预留）。",
    '<div class="d-card"><div class="d-addwrap"><input id="dMonAddr" placeholder="监控地址 0x…"><input id="dMonLabel" placeholder="名称（如 LGNS 大户）" style="max-width:160px"><button class="d-btn" id="dAddM">添加监控</button></div></div>'
    +'<div class="d-card">'+list+'</div>');
  document.getElementById("dAddM").onclick=function(){var a=(document.getElementById("dMonAddr").value||"").trim().toLowerCase();
    if(!/^0x[0-9a-f]{40}$/.test(a)){toast("地址格式不对");return;}var d=def();
    if(d.monitors.some(function(m){return m.addr===a;})){toast("已在监控");return;}
    d.monitors.push({addr:a,label:(document.getElementById("dMonLabel").value||"").trim()||"监控地址",watch:{transfer:true,buy:true,sell:true,stake:false,approval:true},lastSeenTs:0});save(d);go("monitor");toast("已加入监控");};
  el.querySelectorAll(".d-mt input").forEach(function(c){c.onchange=function(){var d=def();var m=d.monitors[+c.getAttribute("data-i")];m.watch=m.watch||{};m.watch[c.getAttribute("data-k")]=c.checked;save(d);};});
  el.querySelectorAll("[data-mdel]").forEach(function(b){b.onclick=function(){var d=def();d.monitors.splice(+b.getAttribute("data-mdel"),1);save(d);go("monitor");};});
}

/* ---------- 提醒中心 ---------- */
async function pAlerts(el){
  var d=def();
  panel(el,"提醒中心","价格波动、监控地址动向、风险授权、链上快讯——打开本页实时计算。",'<div class="d-card"><div class="d-load">正在检查…</div></div>'
    +'<div class="d-card"><h3>⚙️ 提醒设置</h3><div class="d-pref">'
    +'<label>价格波动阈值 <input type="number" id="dPP" value="'+(d.pref.pricePct||10)+'" min="1" max="90"> %</label>'
    +'<label>大额转账阈值 <input type="number" id="dPL" value="'+(d.pref.largeLGNS||1000)+'"> LGNS</label></div>'
    +'<div class="d-pref2"><label class="d-ch"><input type="checkbox" checked disabled> 网站通知</label>'
    +'<label class="d-ch"><input type="checkbox" id="dChMail"'+(d.pref.email?" checked":"")+' disabled> 邮件 <input id="dMail" placeholder="邮箱（预留）" value="'+esc(d.pref.email||"")+'"></label>'
    +'<label class="d-ch"><input type="checkbox" disabled> Telegram（预留）</label></div>'
    +'<button class="d-btn" id="dSavePref">保存设置</button><div class="d-note">邮件 / Telegram 推送需常驻后端，当前为预留项；网站通知即打开本页时的实时汇总。</div></div>');
  document.getElementById("dSavePref").onclick=function(){var d=def();d.pref.pricePct=+document.getElementById("dPP").value||10;d.pref.largeLGNS=+document.getElementById("dPL").value||1000;d.pref.email=document.getElementById("dMail").value.trim();save(d);toast("设置已保存");go("alerts");};
  var alerts=await computeAlerts();
  if(_active!=="alerts")return;
  var box=el.querySelector(".d-card .d-load"); if(box){ box.parentNode.innerHTML='<h3>🔔 提醒（'+alerts.length+'）</h3>'+(alerts.length?alerts.map(alertRow).join(""):'<div class="d-empty">暂无提醒，一切平静</div>'); }
}
function alertRow(a){var ic={price:"📈",monitor:"📡",risk:"⚠️",news:"📰"}[a.t]||"🔹";
  return '<div class="d-alert '+(a.lv||"info")+'"><span class="d-al-ic">'+ic+'</span><span class="d-al-m">'+esc(a.m)+'</span>'
    +(a.hash?'<a class="d-al-x" href="https://polygonscan.com/tx/'+a.hash+'" target="_blank" rel="noopener">↗</a>':'')
    +'<span class="d-al-t">'+ago(a.ts)+'</span></div>';}

/* ---------- 研究收藏 ---------- */
function pResearch(el){
  var d=def(),ac=acad();
  var favCourses=(window.ACADEMY||[]).filter(function(c){return ac.fav&&ac.fav[c.id];});
  var groups={article:"📄 文章",evidence:"🔎 证据",address:"👛 地址",tx:"🔗 交易",course:"🎓 收藏课程"};
  var items=d.bookmarks.slice();
  favCourses.forEach(function(c){items.push({type:"course",value:c.slug,label:c.title,note:"Level "+c.level});});
  var byType={};items.forEach(function(b){(byType[b.type]=byType[b.type]||[]).push(b);});
  var body='<div class="d-card"><div class="d-addwrap"><select id="dBkType" class="d-sel"><option value="article">文章</option><option value="evidence">证据</option><option value="address">地址</option><option value="tx">交易</option></select>'
    +'<input id="dBkVal" placeholder="链接 / 地址 / Tx Hash"><input id="dBkNote" placeholder="备注" style="max-width:140px"><button class="d-btn" id="dAddBk">收藏</button></div></div>';
  Object.keys(groups).forEach(function(tp){ var arr=byType[tp]; if(!arr||!arr.length)return;
    body+='<div class="d-card"><h3>'+groups[tp]+'（'+arr.length+'）</h3>'+arr.map(function(b,i){
      var link=b.type==="address"?("https://polygonscan.com/address/"+b.value):b.type==="tx"?("https://polygonscan.com/tx/"+b.value):b.type==="course"?("/academy/"+b.value+"/"):b.value;
      return '<div class="d-bk"><a class="d-bk-l" href="'+esc(link)+'" target="_blank" rel="noopener">'+esc(b.label||b.value)+'</a>'
        +(b.note?'<span class="d-bk-n">'+esc(b.note)+'</span>':'')
        +(b.type!=="course"?'<button class="d-bk-x" data-bkdel="'+d.bookmarks.indexOf(b)+'">✕</button>':'')+'</div>';}).join("")+'</div>';});
  if(!items.length)body+='<div class="d-empty">还没有收藏。可在上方添加文章/证据/地址/交易，或在学习学院收藏课程。</div>';
  panel(el,"我的研究收藏","把文章、链上证据、关键地址与交易攒成你自己的研究资料库（存在本地）。",body);
  document.getElementById("dAddBk").onclick=function(){var v=(document.getElementById("dBkVal").value||"").trim();if(!v){toast("请输入内容");return;}
    var d=def();d.bookmarks.unshift({type:document.getElementById("dBkType").value,value:v,label:v.length>50?v.slice(0,50)+"…":v,note:(document.getElementById("dBkNote").value||"").trim(),added:Date.now()});save(d);go("research");toast("已收藏");};
  el.querySelectorAll("[data-bkdel]").forEach(function(b){b.onclick=function(){var d=def();d.bookmarks.splice(+b.getAttribute("data-bkdel"),1);save(d);go("research");};});
}

/* ---------- 链上报告 ---------- */
async function pReports(el){
  var d=def();
  var list=d.reports.map(function(r){return '<div class="d-rep"><div class="d-rep-t"><b>'+esc(r.title)+'</b><span>'+new Date(r.created).toLocaleString()+'</span></div>'
    +'<div class="d-rep-b">'+esc(r.summary||"")+'</div><div class="d-rep-act"><button class="d-mini" data-rview="'+r.id+'">查看</button>'
    +'<button class="d-mini" data-rprint="'+r.id+'">下载 PDF</button><button class="d-mini d-del" data-rdel="'+r.id+'">删除</button></div></div>';}).join("")||'<div class="d-empty">还没有报告</div>';
  panel(el,"我的链上报告","为任意地址生成钱包分析快照（身份 / 资产 / 授权 / 活动），保存到本地，可打印为 PDF。",
    '<div class="d-card"><div class="d-addwrap"><input id="dRepAddr" placeholder="要分析的地址（默认当前 '+short(addr())+'）"><button class="d-btn" id="dGenRep">生成钱包分析报告</button></div><div class="d-note">资金流报告需跨多跳追踪，属进阶功能（预留）。</div></div>'
    +'<div class="d-card">'+list+'</div>');
  document.getElementById("dGenRep").onclick=async function(){ var a=(document.getElementById("dRepAddr").value||"").trim().toLowerCase()||addr();
    if(!/^0x[0-9a-f]{40}$/.test(a)){toast("地址格式不对");return;} toast("生成中…（首次约 10-25 秒）");
    var rd=await radar(),wd=await walletData(a); var w=wd.polygon||{}; var ap=(w.approvals||[]),unl=ap.filter(function(x){return x.unlimited;});
    var val=assetValue(wd,rd); var risk=unl.length?"高":(ap.length?"中":"低");
    var toks=[]; ["polygon","anubis"].forEach(function(c){var ww=wd[c];if(ww)(ww.tokens||[]).forEach(function(t){if(t.amount>0)toks.push(t.sym+" "+fNum(t.amount)+"("+(c==="polygon"?"Poly":"ANB")+")");});});
    var rep={id:"R"+Date.now(),kind:"wallet",addr:a,title:"钱包分析报告 "+short(a),created:Date.now(),
      summary:"估值 "+fUSD(val)+" · 授权 "+ap.length+"（无限 "+unl.length+"）· 风险 "+risk,
      data:{addr:a,isContract:!!w.isContract,firstTs:w.firstTs,value:val,tokens:toks,approvals:ap.length,unlimited:unl.length,risk:risk,
        transfers:(w.transfers||[]).slice(0,10)}};
    var d=def();d.reports.unshift(rep);save(d);go("reports");toast("报告已保存");};
  el.querySelectorAll("[data-rdel]").forEach(function(b){b.onclick=function(){var d=def();d.reports=d.reports.filter(function(r){return r.id!==b.getAttribute("data-rdel");});save(d);go("reports");};});
  el.querySelectorAll("[data-rview]").forEach(function(b){b.onclick=function(){showReport(b.getAttribute("data-rview"));};});
  el.querySelectorAll("[data-rprint]").forEach(function(b){b.onclick=function(){printReport(b.getAttribute("data-rprint"));};});
}
function findRep(id){return def().reports.filter(function(r){return r.id===id;})[0];}
function reportHTML(r){var dt=r.data||{};
  return '<h2>'+esc(r.title)+'</h2><p>生成时间：'+new Date(r.created).toLocaleString()+'</p>'
    +'<table class="d-tbl"><tr><th>地址</th><td>'+esc(dt.addr)+'</td></tr>'
    +'<tr><th>类型</th><td>'+(dt.isContract?"合约":"外部账户 EOA")+'</td></tr>'
    +'<tr><th>首次活跃</th><td>'+(dt.firstTs?new Date(dt.firstTs*1000).toLocaleDateString():"—")+'</td></tr>'
    +'<tr><th>估算资产</th><td>'+fUSD(dt.value)+'</td></tr>'
    +'<tr><th>持有代币</th><td>'+(dt.tokens&&dt.tokens.length?esc(dt.tokens.join("、")):"—")+'</td></tr>'
    +'<tr><th>授权总数</th><td>'+dt.approvals+'（无限授权 '+dt.unlimited+'）</td></tr>'
    +'<tr><th>风险评分</th><td><b>'+dt.risk+'</b></td></tr></table>'
    +'<h3>近期转账</h3><table class="d-tbl"><thead><tr><th>时间</th><th>方向</th><th>数量</th><th>代币</th></tr></thead><tbody>'
    +((dt.transfers||[]).map(function(x){return '<tr><td>'+new Date(x.ts*1000).toLocaleDateString()+'</td><td>'+(x.dir==="in"?"转入":"转出")+'</td><td>'+fNum(x.amount)+'</td><td>'+esc(x.token||"")+'</td></tr>';}).join("")||'<tr><td colspan="4">—</td></tr>')
    +'</tbody></table><p class="d-note">本报告基于公开链上数据自动生成，仅供研究参考，不构成投资建议。</p>';
}
function showReport(id){var r=findRep(id);if(!r)return;var m=document.createElement("div");m.className="d-modal";m.innerHTML='<div class="d-modal-in"><button class="d-modal-x">✕</button><div class="d-rep-doc">'+reportHTML(r)+'</div></div>';document.body.appendChild(m);m.querySelector(".d-modal-x").onclick=function(){m.remove();};m.onclick=function(e){if(e.target===m)m.remove();};}
function printReport(id){var r=findRep(id);if(!r)return;var w=window.open("","_blank");w.document.write('<html><head><meta charset="utf-8"><title>'+esc(r.title)+'</title><style>body{font-family:system-ui;max-width:720px;margin:30px auto;color:#222;padding:0 20px}h2{border-bottom:2px solid #1c8f2d;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{text-align:left;padding:7px 10px;border-bottom:1px solid #ddd}.d-note{color:#888;font-size:12px}</style></head><body>'+reportHTML(r)+'<script>window.onload=function(){window.print();}<\/script></body></html>');w.document.close();}

/* ---------- 学习中心 ---------- */
function pLearn(el){
  var ac=acad(),acad_=window.ACADEMY||[];var total=acad_.length||36,done=Object.keys(ac.done||{}).length;
  var favN=Object.keys(ac.fav||{}).length;var pct=total?Math.round(done/total*100):0;
  var LV=["Web3新人","链上用户","DeFi探索者","链上分析师","Web3研究者"],TH=[0,7,15,23,31];var li=0;for(var k=0;k<TH.length;k++){if(done>=TH[k])li=k;}
  var byLvl={};acad_.forEach(function(c){(byLvl[c.level]=byLvl[c.level]||[]).push(c);});
  var levels="";[1,2,3,4,5].forEach(function(lv){var cs=byLvl[lv]||[];var dn=cs.filter(function(c){return ac.done&&ac.done[c.id];}).length;
    levels+='<div class="d-lvrow"><span class="d-lvname">Level '+lv+'</span><div class="d-lvbar"><div style="width:'+(cs.length?dn/cs.length*100:0)+'%"></div></div><span class="d-lvn">'+dn+'/'+cs.length+'</span></div>';});
  panel(el,"学习中心","与 Web3Origin 链上学习学院同步（进度存在本地）。",
    '<div class="d-2col"><div class="d-card"><h3>🎓 我的学习</h3>'
    +'<div class="d-learn-big">Lv.'+(li+1)+' <span>'+LV[li]+'</span></div>'
    +'<div class="d-bar"><div style="width:'+pct+'%"></div></div>'
    +'<div class="d-learn-meta">已完成 <b>'+done+'</b> / '+total+' 课 · 进度 <b>'+pct+'%</b> · 收藏 <b>'+favN+'</b> 课</div>'
    +'<a class="d-btn" href="/academy/">前往学习学院 ›</a></div>'
    +'<div class="d-card"><h3>各等级进度</h3>'+levels+'</div></div>');
}

/* ---------- 安全中心 ---------- */
async function pSecurity(el){
  panel(el,"安全中心","检查当前地址的代币授权，识别风险，一键跳转撤销。",'<div class="d-card"><div class="d-load">检查授权中…（首次约 10-25 秒，之后有缓存会很快）</div></div>'
    +'<div class="d-safebar">🔒 Web3Origin 永远不会索要你的助记词、私钥或钱包密码，也不会请求任何转账/授权类签名。</div>');
  var wd=await walletData(addr()); var ap=(wd.polygon&&wd.polygon.approvals)||[];
  ap.sort(function(a,b){return (b.unlimited?1:0)-(a.unlimited?1:0);});
  var rows=ap.length?ap.map(function(x){var risk=x.unlimited?"高":"中";
    return '<tr class="'+(x.unlimited?"hi":"")+'"><td><b>'+esc(x.token)+'</b></td><td class="d-mono">'+short(x.spender)+'</td>'
      +'<td>'+(x.unlimited?"♾ 无限":"有限")+'</td><td><span class="d-risk '+(x.unlimited?"hi":"mid")+'">'+risk+'</span></td>'
      +'<td><a class="d-mini" href="https://revoke.cash/address/'+addr()+'?chainId=137" target="_blank" rel="noopener">去撤销 ↗</a></td></tr>';}).join("")
    :'<tr><td colspan="5" class="d-empty">当前地址在 Polygon 上未发现代币授权记录</td></tr>';
  if(_active!=="security")return;
  var box=el.querySelector(".d-card .d-load");
  if(box)box.parentNode.innerHTML='<h3>🛡️ 已授权合约（'+ap.length+'）</h3><table class="d-tbl"><thead><tr><th>代币</th><th>被授权方</th><th>额度</th><th>风险</th><th>操作</th></tr></thead><tbody>'+rows+'</tbody></table>'
    +'<div class="d-note">撤销通过第三方公开工具 revoke.cash 进行（跳转后由你在自己钱包确认），本站不经手你的任何签名。无限授权风险较高，建议用完即撤。</div>';
}

/* ---------- 我的等级 ---------- */
function pRank(el){ var ri=rankInfo();
  panel(el,"我的等级","Web3Origin Rank：通过学习课程、使用工具、添加监控、生成报告积累成长值。",
    '<div class="d-card">'+rankBody(ri)+'</div>'
    +'<div class="d-card"><h3>如何升级</h3><ul class="d-uplist"><li>🎓 完成学习学院课程（每节 +3）</li><li>👛 添加钱包地址（每个 +2）</li><li>📡 设置监控地址（每个 +2）</li><li>📄 生成链上报告（每份 +5）</li><li>⭐ 收藏研究内容（每条 +1）</li></ul>'
    +'<div class="d-note">成长值与等级存在你本地浏览器。个人主页（web3origin.com/user/…）与徽章分享为进阶功能，需常驻后端（预留）。</div></div>');
}
function rankBody(ri){var pct=ri.next?Math.min(100,Math.round((ri.pts-RTH[ri.lv-1])/(ri.next-RTH[ri.lv-1])*100)):100;
  return '<div class="d-rank-big">🏆 Lv.'+ri.lv+' <span>'+ri.name+'</span></div>'
    +'<div class="d-bar"><div style="width:'+pct+'%"></div></div>'
    +'<div class="d-rank-meta">成长值 <b>'+ri.pts+'</b>'+(ri.next?' · 距下一级还需 <b>'+(ri.next-ri.pts)+'</b>':' · 已满级')+'</div>'
    +'<div class="d-rank-ladder">'+RANKS.map(function(n,i){return '<span class="'+(i+1===ri.lv?"on":"")+'">Lv'+(i+1)+' '+n+'</span>';}).join("")+'</div>';}

/* ---------- 样式 ---------- */
function css(){ if(document.getElementById("dashCss"))return; var s=document.createElement("style");s.id="dashCss";
s.textContent=[
":root{--ob:#050303;--gold:#D6A84B;--gold-lt:#f0d48a;--bone:#F1DFC0;--ink:#e8d9be;--soft:#b79c74;--muted:#7c6a4f;--line:#3a2313;--green:#25C96F;--green-lt:#76FF36;--serif:'STZhongsong','Songti SC',Georgia,serif;--sans:'Microsoft YaHei','PingFang SC',system-ui,sans-serif}",
"*{box-sizing:border-box}body{margin:0;background:radial-gradient(1100px 560px at 50% -10%,#0f2318,#050303 60%) fixed,#050303;color:var(--ink);font-family:var(--sans);line-height:1.7}",
"a{color:var(--gold-lt);text-decoration:none}button{font-family:inherit}",
".d-top{display:flex;align-items:center;gap:14px;padding:12px 20px;border-bottom:1px solid var(--line);position:sticky;top:0;background:rgba(5,3,3,.92);backdrop-filter:blur(8px);z-index:30}",
".d-brand{display:flex;align-items:center;gap:9px;color:var(--bone);font-family:var(--serif);font-size:16px}.d-brand img{width:25px;height:25px}.d-brand b{color:var(--green)}",
".d-top a{font-size:13px;color:var(--soft)}.d-sp{margin-left:auto}",
/* gate */
".d-gate{min-height:100vh}.d-gate-in{max-width:560px;margin:0 auto;padding:60px 22px;text-align:center}",
".d-gate-logo{font-size:52px;color:var(--green);text-shadow:0 0 30px rgba(37,201,111,.5)}",
".d-gate h1{font-family:var(--serif);font-size:34px;color:var(--gold-lt);margin:14px 0 2px}",
".d-en{letter-spacing:.24em;color:var(--green);font-size:13px;text-transform:uppercase;margin:0}",
".d-gate-sub{color:var(--soft);font-size:14.5px;margin:16px 0 24px}",
".d-connect{background:linear-gradient(180deg,#1c8f2d,#0d3a1c);border:1px solid var(--green);color:#fff;font-size:16px;font-weight:700;padding:14px 34px;border-radius:12px;cursor:pointer;box-shadow:0 8px 30px rgba(37,201,111,.25)}",
".d-connect:hover{background:#1c8f2d}.d-wallets-hint{color:var(--muted);font-size:12px;margin:14px 0}",
".d-safe{margin-top:22px;background:rgba(37,201,111,.06);border:1px solid rgba(37,201,111,.25);border-radius:11px;padding:13px 16px;font-size:12.5px;color:var(--soft);line-height:1.8}.d-safe b{color:var(--green-lt)}",
/* shell */
".d-body{display:flex;max-width:1200px;margin:0 auto;min-height:80vh}",
".d-side{flex:0 0 190px;padding:16px 10px;border-right:1px solid var(--line)}",
".d-navi{display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;color:var(--soft);font-size:14px;padding:10px 13px;border-radius:9px;cursor:pointer;text-align:left;margin-bottom:2px}",
".d-navi span{font-size:16px}.d-navi:hover{background:rgba(214,168,75,.06);color:var(--bone)}.d-navi.on{background:rgba(37,201,111,.12);color:var(--green-lt);font-weight:600}",
".d-main{flex:1;padding:18px 22px;min-width:0}",
".d-userhead{display:flex;align-items:center;gap:13px;background:linear-gradient(160deg,#100e0b,#0a0807);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin-bottom:16px}",
".d-ava{width:46px;height:46px;border-radius:50%;flex:0 0 auto;border:2px solid var(--line)}.d-ava.sm{width:34px;height:34px}",
".d-uinfo{flex:1;min-width:0}.d-uaddr{font-size:16px;color:var(--bone);font-weight:600;font-family:var(--serif)}",
".d-copy{background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px}.d-copy:hover{color:var(--gold-lt)}",
".d-umeta{font-size:12.5px;color:var(--muted);margin-top:2px}.d-net{color:var(--green)}.d-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 6px var(--green);margin-right:4px}",
".d-uact{display:flex;flex-direction:column;gap:6px}",
".d-mini{background:#12100c;border:1px solid var(--line);border-radius:7px;color:var(--gold-lt);font-size:12px;padding:5px 11px;cursor:pointer;white-space:nowrap;text-align:center}.d-mini:hover{border-color:var(--green);text-decoration:none}.d-dis{color:#e56a54}.d-del{color:#e56a54}",
".d-phead{margin-bottom:14px}.d-phead h2{font-family:var(--serif);color:var(--gold-lt);font-size:22px;margin:0}.d-phead p{color:var(--muted);font-size:12.5px;margin:4px 0 0}",
".d-card{background:linear-gradient(160deg,#100e0b,#0a0807);border:1px solid var(--line);border-radius:13px;padding:15px 17px;margin-bottom:13px}",
".d-card h3{font-size:14px;color:var(--gold-lt);margin:0 0 11px;font-weight:700}",
".d-2col{display:grid;grid-template-columns:1fr 1fr;gap:13px}",
".d-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;margin-bottom:14px}",
".d-stat{background:linear-gradient(160deg,#12100c,#0a0807);border:1px solid var(--line);border-radius:12px;padding:14px;cursor:pointer;text-align:left;transition:.15s}.d-stat:hover{border-color:var(--green);transform:translateY(-2px)}",
".d-stat-ic{font-size:20px}.d-stat-v{font-size:21px;font-weight:800;color:var(--bone);margin-top:5px}.d-stat-l{font-size:12px;color:var(--muted)}",
".d-empty{color:var(--muted);font-size:13px;text-align:center;padding:18px}.d-load{color:var(--soft);font-size:13px;text-align:center;padding:16px}",
".d-tbl{width:100%;border-collapse:collapse;font-size:13px}.d-tbl th{color:var(--muted);font-weight:400;text-align:left;padding:8px 9px;border-bottom:1px solid var(--line);font-size:12px}",
".d-tbl td{padding:9px 9px;border-bottom:1px solid rgba(58,35,19,.5);color:var(--ink)}.d-tbl td b{color:var(--bone)}",
".d-chip{font-size:10.5px;padding:1px 7px;border-radius:5px;background:#1a130b;color:var(--soft)}.d-chip.polygon{color:#a98bff}.d-chip.anubis{color:#3ad6c7}",
".d-asset-sum{text-align:center}.d-asset-total{font-size:34px;font-weight:800;color:var(--green-lt)}.d-asset-sub{font-size:11.5px;color:var(--muted);margin-top:3px}.d-asset-sub .up{color:var(--green)}.d-asset-sub .dn{color:#e56a54}",
".d-addwrap{display:flex;gap:8px;flex-wrap:wrap}.d-addwrap input,.d-sel{flex:1;min-width:120px;background:#08110c;border:1px solid var(--line);border-radius:8px;color:var(--bone);padding:9px 11px;font:inherit;font-size:13px}.d-addwrap input:focus{outline:none;border-color:var(--green)}",
".d-btn{background:linear-gradient(180deg,#1c8f2d,#12100c);border:1px solid var(--green);color:#fff;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;display:inline-block}.d-btn:hover{text-decoration:none;background:#1c8f2d}",
".d-wrow,.d-mrow{display:flex;align-items:center;gap:11px;padding:10px 4px;border-bottom:1px solid rgba(58,35,19,.5)}.d-wmid,.d-mmid{flex:1;min-width:0}",
".d-wlabel{background:#08110c;border:1px solid var(--line);border-radius:6px;color:var(--bone);padding:4px 8px;font:inherit;font-size:13px;width:150px}",
".d-waddr,.d-maddr{font-size:12px;color:var(--muted);font-family:ui-monospace,monospace;word-break:break-all}.d-tag-cur{color:var(--green);font-family:var(--sans)}",
".d-wact{display:flex;gap:6px;flex-wrap:wrap}",
".d-mtags{margin-top:6px;display:flex;gap:10px;flex-wrap:wrap}.d-mt{font-size:12px;color:var(--soft)}.d-mt input{margin-right:3px}",
".d-alert{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:9px;font-size:13px;margin-bottom:7px;border:1px solid var(--line)}",
".d-alert.warn{background:rgba(229,106,84,.08);border-color:rgba(229,106,84,.3)}.d-alert.info{background:rgba(214,168,75,.05)}",
".d-al-m{flex:1;color:var(--ink)}.d-al-t{color:var(--muted);font-size:11px;white-space:nowrap}.d-al-x{color:var(--gold-lt)}",
".d-more{background:none;border:none;color:var(--green-lt);cursor:pointer;font-size:12.5px;margin-top:6px;padding:0}",
".d-pref{display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:var(--soft)}.d-pref input{width:70px;background:#08110c;border:1px solid var(--line);border-radius:6px;color:var(--bone);padding:5px 8px;font:inherit}",
".d-pref2{margin:11px 0;display:flex;flex-direction:column;gap:7px;font-size:13px;color:var(--soft)}.d-ch input[type=text],.d-ch input:not([type]){width:180px;background:#08110c;border:1px solid var(--line);border-radius:6px;color:var(--bone);padding:5px 8px;margin-left:6px;font:inherit}",
".d-note{font-size:11px;color:var(--muted);margin-top:9px;line-height:1.7}",
".d-bk{display:flex;align-items:center;gap:9px;padding:7px 3px;border-bottom:1px solid rgba(58,35,19,.4);font-size:13px}.d-bk-l{flex:1;color:var(--ink);word-break:break-all}.d-bk-n{color:var(--muted);font-size:11.5px}.d-bk-x{background:none;border:none;color:#e56a54;cursor:pointer}",
".d-rep{border-bottom:1px solid rgba(58,35,19,.5);padding:11px 3px}.d-rep-t{display:flex;justify-content:space-between;font-size:14px;color:var(--bone)}.d-rep-t span{color:var(--muted);font-size:11px}.d-rep-b{color:var(--soft);font-size:12.5px;margin:5px 0}.d-rep-act{display:flex;gap:7px}",
".d-modal{position:fixed;inset:0;background:rgba(0,0,0,.72);display:grid;place-items:center;z-index:100;padding:20px}.d-modal-in{background:#0d0b09;border:1px solid var(--line);border-radius:14px;max-width:640px;width:100%;max-height:88vh;overflow:auto;padding:22px;position:relative}.d-modal-x{position:absolute;top:12px;right:14px;background:none;border:none;color:var(--soft);font-size:18px;cursor:pointer}",
".d-rep-doc h2{color:var(--gold-lt);font-family:var(--serif)}.d-rep-doc h3{color:var(--gold-lt);font-size:15px;margin-top:18px}",
".d-learn-big,.d-rank-big{font-size:22px;font-weight:800;color:var(--green-lt);margin-bottom:9px}.d-learn-big span,.d-rank-big span{color:var(--bone)}",
".d-bar{height:9px;background:#1a130b;border-radius:6px;overflow:hidden;margin:8px 0}.d-bar>div{height:100%;background:linear-gradient(90deg,#1c8f2d,#25C96F,#76FF36);border-radius:6px;transition:width .5s}",
".d-learn-meta,.d-rank-meta{font-size:12.5px;color:var(--soft);margin:8px 0}.d-learn-meta b,.d-rank-meta b{color:var(--bone)}",
".d-lvrow{display:flex;align-items:center;gap:10px;margin:8px 0;font-size:12.5px}.d-lvname{width:64px;color:var(--soft)}.d-lvbar{flex:1;height:6px;background:#1a130b;border-radius:4px;overflow:hidden}.d-lvbar>div{height:100%;background:var(--green);border-radius:4px}.d-lvn{color:var(--muted);width:44px;text-align:right}",
".d-uplist{padding-left:18px;font-size:13px;color:var(--soft);line-height:1.9}",
".d-rank-ladder{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.d-rank-ladder span{font-size:11px;color:var(--muted);background:#12100c;border:1px solid var(--line);border-radius:20px;padding:3px 10px}.d-rank-ladder .on{color:var(--green-lt);border-color:var(--green)}",
".d-risk{font-size:11px;padding:1px 8px;border-radius:5px}.d-risk.hi{color:#e56a54;background:rgba(229,106,84,.13)}.d-risk.mid{color:var(--gold-lt);background:rgba(214,168,75,.13)}",
".d-tbl tr.hi td{background:rgba(229,106,84,.05)}.d-mono{font-family:ui-monospace,monospace;font-size:11.5px}",
".d-safebar{background:rgba(37,201,111,.06);border:1px solid rgba(37,201,111,.25);border-radius:10px;padding:11px 14px;font-size:12px;color:var(--soft)}",
"#dashToast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);background:#12100c;border:1px solid var(--green);color:var(--bone);padding:10px 20px;border-radius:24px;font-size:13px;opacity:0;transition:.25s;z-index:200;pointer-events:none}#dashToast.show{opacity:1;transform:translateX(-50%) translateY(0)}",
".d-bottom{display:none}",
/* mobile */
"@media(max-width:820px){.d-side{display:none}.d-body{display:block}.d-main{padding:14px 13px 90px}.d-2col{grid-template-columns:none}.d-stats{grid-template-columns:1fr 1fr}",
".d-bottom{display:flex;position:fixed;bottom:0;left:0;right:0;background:rgba(9,7,6,.97);border-top:1px solid var(--line);z-index:40;backdrop-filter:blur(8px)}",
".d-bi{flex:1;background:none;border:none;color:var(--muted);font-size:11px;padding:9px 2px 8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px}.d-bi span{font-size:19px}.d-bi.on{color:var(--green-lt)}",
".d-userhead{flex-wrap:wrap}.d-uact{flex-direction:row}}"
].join("\n");
document.head.appendChild(s);}

/* ---------- 启动 ---------- */
function boot(){ bindEvents(); render(); }
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
window.__dashTest=function(a){setAddr(a);render();}; // 测试用:免钱包直接进
})();
