/* ═══════════ Web3Origin Admin · 私有数据中心 前端 ═══════════
   由 Worker 在 count.web3origin.com/adm 提供页面并加载本脚本；所有数据经同源 /adm/api/* 服务端验证会话才返回。
   会话=HttpOnly 签名 Cookie(JS 读不到)；CSRF 令牌仅存内存、每次会话刷新。公开站不含任何后台入口。 */
(function(){
"use strict";
var API="/adm/api";      // 同源(count.web3origin.com)
var csrf="", meUser="";
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function ago(ts){if(!ts)return"";var s=Math.floor((Date.now()-ts)/1000);if(s<60)return"刚刚";if(s<3600)return Math.floor(s/60)+"分钟前";if(s<86400)return Math.floor(s/3600)+"小时前";return new Date(ts).toLocaleString();}
function fmtN(n){if(n==null)return"—";if(Math.abs(n)>=1e6)return (n/1e6).toFixed(2)+"M";if(Math.abs(n)>=1e3)return (n/1e3).toFixed(1)+"K";return String(n);}
function toast(m,bad){var t=document.getElementById("aToast");if(!t){t=document.createElement("div");t.id="aToast";document.body.appendChild(t);}t.textContent=m;t.className="show"+(bad?" bad":"");clearTimeout(t._t);t._t=setTimeout(function(){t.className="";},2600);}
function get(path){return fetch(API+path,{credentials:"same-origin"}).then(function(r){return r.json();});}
function post(path,body,useCsrf){return fetch(API+path,{method:"POST",credentials:"same-origin",headers:Object.assign({"Content-Type":"application/json"},useCsrf?{"X-CSRF":csrf}:{}),body:JSON.stringify(body||{})}).then(function(r){return r.json();});}
function root(){return document.getElementById("admRoot");}
function na(note){return '<span class="a-na" title="'+esc(note||"未接入")+'">未接入</span>';}

/* ---------- 启动 ---------- */
function boot(){css();
  get("/status").then(function(s){
    if(!s.setup){setupView();return;}
    get("/me").then(function(m){if(m.ok){csrf=m.csrf;meUser=m.user;app("dashboard");}else loginView();}).catch(loginView);
  }).catch(function(){root().innerHTML='<div class="a-center">无法连接后台服务</div>';});
}

/* ---------- 首次初始化 ---------- */
function setupView(){
  root().innerHTML='<div class="a-auth"><div class="a-auth-box"><h1>🔐 首次初始化</h1><p class="a-sub">创建唯一的站长超级管理员。密码 ≥8 位、需含字母和数字，设个自己记得住的。</p>'
    +'<input id="sKey" class="a-in" type="password" placeholder="初始化密钥(setup key)">'
    +'<input id="sUser" class="a-in" placeholder="管理员用户名">'
    +'<input id="sPw" class="a-in" type="password" placeholder="密码 ≥8位(含字母+数字)">'
    +'<div id="sErr" class="a-err" style="display:none"></div>'
    +'<button class="a-btn" id="sGo">创建管理员</button></div></div>';
  document.getElementById("sGo").onclick=function(){
    var e=document.getElementById("sErr");e.style.display="none";
    post("/setup",{key:document.getElementById("sKey").value.trim(),user:document.getElementById("sUser").value.trim(),password:document.getElementById("sPw").value}).then(function(r){
      if(!r.ok){e.textContent=r.error;e.style.display="block";return;}
      root().innerHTML='<div class="a-auth"><div class="a-auth-box"><h1>✅ 管理员已创建</h1>'
        +'<p class="a-sub">用刚才设的用户名和密码登录即可。</p>'
        +'<button class="a-btn" onclick="location.reload()">去登录</button></div></div>';
    }).catch(function(){e.textContent="网络错误";e.style.display="block";});
  };
}

/* ---------- 登录(用户名+密码) ---------- */
function loginView(){
  root().innerHTML='<div class="a-auth"><div class="a-auth-box"><div class="a-logo">◎ Web3Origin Admin</div><h1>登录</h1>'
    +'<input id="lUser" class="a-in" placeholder="用户名" autocomplete="username">'
    +'<input id="lPw" class="a-in" type="password" placeholder="密码" autocomplete="current-password">'
    +'<div id="lErr" class="a-err" style="display:none"></div><button class="a-btn" id="lGo">登录</button></div></div>';
  var lGo=document.getElementById("lGo");
  function fail(m){var e=document.getElementById("lErr");e.textContent=m;e.style.display="block";}
  lGo.onclick=function(){lGo.disabled=true;lGo.textContent="…";
    post("/login",{user:document.getElementById("lUser").value.trim(),password:document.getElementById("lPw").value}).then(function(r){
      lGo.disabled=false;lGo.textContent="登录";
      if(!r.ok){fail(r.error);return;}
      csrf=r.csrf;meUser=r.user;app("dashboard");
    }).catch(function(){lGo.disabled=false;lGo.textContent="登录";fail("网络错误");});};
  document.getElementById("lPw").addEventListener("keydown",function(e){if(e.key==="Enter")lGo.click();});
}

/* ---------- 后台主框架 ---------- */
var NAV=[["dashboard","🏠","总览"],["traffic","📈","流量分析"],["feedback","💬","留言管理"],["onchain","⛓","链上状态"],["audit","📜","审计日志"],["system","🖥","系统状态"]];
var _cur="dashboard";
function app(page){_cur=page;
  root().innerHTML='<div class="a-shell"><aside class="a-side"><div class="a-brand">◎ <b>Admin</b></div>'
    +NAV.map(function(n){return '<button class="a-navi" data-go="'+n[0]+'"><span>'+n[1]+'</span>'+n[2]+'</button>';}).join("")
    +'<div class="a-side-foot"><button class="a-navi a-logout" id="aLogout"><span>⏻</span>退出登录</button></div></aside>'
    +'<main class="a-main"><header class="a-top"><button class="a-burger" id="aBurger">☰</button><div class="a-top-title" id="aTitle"></div>'
    +'<div class="a-top-r"><span class="a-user">👤 '+esc(meUser)+'</span></div></header><div id="aPanel"></div></main>'
    +'<div class="a-overlay" id="aOverlay"></div></div>';
  root().querySelectorAll(".a-navi[data-go]").forEach(function(b){b.onclick=function(){go(b.getAttribute("data-go"));closeDrawer();};});
  document.getElementById("aLogout").onclick=function(){post("/logout",{},true).then(function(){location.reload();});};
  var bg=document.getElementById("aBurger"),ov=document.getElementById("aOverlay");
  bg.onclick=function(){document.querySelector(".a-side").classList.toggle("open");ov.classList.toggle("on");};
  ov.onclick=closeDrawer;
  go(page);
}
function closeDrawer(){var s=document.querySelector(".a-side");if(s)s.classList.remove("open");var o=document.getElementById("aOverlay");if(o)o.classList.remove("on");}
function go(page){_cur=page;
  document.querySelectorAll(".a-navi").forEach(function(b){b.classList.toggle("on",b.getAttribute("data-go")===page);});
  var t=(NAV.filter(function(n){return n[0]===page;})[0]||["","","后台"]);document.getElementById("aTitle").textContent=t[2];
  var el=document.getElementById("aPanel");el.innerHTML='<div class="a-center">加载中…</div>';
  ({dashboard:pDash,traffic:pTraffic,feedback:pFeedback,onchain:pOnchain,audit:pAudit,system:pSystem}[page]||pDash)(el);
}
function card(ic,label,val,sub,cls){return '<div class="a-card '+(cls||"")+'"><div class="a-card-ic">'+ic+'</div><div class="a-card-v">'+val+'</div><div class="a-card-l">'+label+'</div>'+(sub?'<div class="a-card-s">'+sub+'</div>':'')+'</div>';}

/* ---------- 总览 ---------- */
function pDash(el){get("/dashboard").then(function(r){
  if(!r.ok){el.innerHTML='<div class="a-center">加载失败</div>';return;}
  var d=r.data;
  el.innerHTML='<div class="a-note-real">✔ 真实数据来自 Worker/KV 与链上雷达；标注“未接入”的项目为尚未埋点，<b>不会用假数据冒充</b>。</div>'
    +'<div class="a-cards">'
    +card("👀","累计访客(去重)",fmtN(d.visitors.v),"来源：Worker 访客统计")
    +card("💬","今日留言",fmtN(d.feedbackToday.v),"来源：留言区 KV")
    +card("🕒","待审留言",fmtN(d.feedbackPending.v),d.feedbackReports.v?("举报 "+d.feedbackReports.v+" 条"):"")
    +card("⛓","链上同步",d.chain.ok?"正常":"异常",d.chain.ok?("Anubis #"+fmtN(d.chain.anbHeight)):"雷达无数据",d.chain.ok?"ok":"bad")
    +card("📄","页面浏览量 PV",d.pv.src==="real"?fmtN(d.pv.v):na(d.pv.note),d.pv.src==="real"?("今日 PV "+fmtN(d.pv.today)+" · 今日独立访客 "+fmtN(d.pv.uvToday)):"")
    +card("🛠","工具使用",na(d.toolUsage.note),"")
    +card("🎬","视频播放",d.videoViews.src==="real"?fmtN(d.videoViews.v):na(d.videoViews.note),d.videoViews.src==="real"?("覆盖 "+fmtN(d.videoViews.videos)+" 个视频"):"")
    +card("⚠️","告警",na(d.alerts.note),"")
    +'</div>'
    +'<div class="a-panel-box"><h3>说明</h3><ul class="a-ul"><li>访客/留言/链上/PV·UV/视频播放为真实数据，实时读取。</li>'
    +'<li>工具使用埋点、来源渠道、跳出率、视频完播、漏斗、告警系统尚未接入——需要在前台注入事件采集或让 VPS 推送，接入后这里自动显示真实值。</li>'
    +'<li>严格的即时会话注销、TOTP 单次不可重放、精确限流锁定，在纯 KV 上是“尽力而为”；强一致保证需升级 Durable Objects（已在方案中标注）。</li></ul></div>';
});}

/* ---------- 流量 ---------- */
function pTraffic(el){get("/traffic").then(function(r){
  var rows=(r.geo||[]).map(function(g,i){var pct=r.total?(g.n/r.total*100).toFixed(1):0;return '<tr><td>'+(i+1)+'</td><td>'+esc(g.country)+'</td><td>'+g.n+'</td><td><div class="a-bar"><div style="width:'+pct+'%"></div></div>'+pct+'%</td></tr>';}).join("");
  el.innerHTML='<div class="a-panel-box"><h3>访客国家/地区分布 <span class="a-real">真实</span></h3>'
    +'<table class="a-tbl"><thead><tr><th>#</th><th>国家/地区</th><th>访客</th><th>占比</th></tr></thead><tbody>'+(rows||'<tr><td colspan=4 class="a-center">暂无数据</td></tr>')+'</tbody></table>'
    +'<div class="a-total">总访客(去重) '+fmtN(r.total)+'</div></div>'
    +'<div class="a-cards" style="margin-top:14px">'
    +card("🔗","来源渠道",na("百度/Google/微信/X 等来源未接入"),"")
    +card("📱","设备分布",na("未接入"),"")+card("↩","跳出率",na("未接入"),"")+card("⏱","会话时长",na("未接入"),"")+'</div>'
    +'<div class="a-note-real">来源渠道/设备/跳出率/会话时长需在前台注入采集或对接搜索站长平台，接入前如实显示“未接入”。</div>';
});}

/* ---------- 留言管理 ---------- */
var STAT={pending:"待审核",public:"已公开",replied:"已回复",resolved:"已解决",hidden:"已隐藏",archived:"已归档"};
function pFeedback(el){get("/feedback").then(function(r){
  var items=r.items||[];
  el.innerHTML='<div class="a-panel-box"><h3>留言列表（'+items.length+'）</h3>'
    +(items.length?'<table class="a-tbl"><thead><tr><th>时间</th><th>分类</th><th>标题</th><th>状态</th><th>数据</th><th>操作</th></tr></thead><tbody>'
      +items.map(function(m){return '<tr data-id="'+esc(m.id)+'"><td>'+ago(m.ts)+'</td><td>'+esc(m.cat)+'</td><td class="a-td-t">'+esc(m.title)+'</td>'
        +'<td><span class="a-st '+m.status+'">'+(STAT[m.status]||m.status)+'</span>'+(m.official?' <span class="a-st replied">已回复</span>':'')+(m.reportN?' <span class="a-st hidden">举报'+m.reportN+'</span>':'')+'</td>'
        +'<td>👍'+(m.likes||0)+' 💬'+(m.replies||0)+'</td><td><button class="a-mini a-fbopen">处理</button></td></tr>';}).join("")+'</tbody></table>'
      :'<div class="a-center">暂无留言</div>')+'</div>';
  el.querySelectorAll(".a-fbopen").forEach(function(b){b.onclick=function(){fbOne(b.closest("tr").getAttribute("data-id"));};});
});}
function fbOne(id){get("/feedback/get?id="+encodeURIComponent(id)).then(function(r){
  var m=r.full;if(!m){toast("加载失败",1);return;}
  var reports=(m.reports||[]).map(function(x){return '<div class="a-rp">⚑ '+esc(x.reason)+(x.detail?"："+esc(x.detail):"")+' · '+ago(x.ts)+'</div>';}).join("");
  var ov=document.createElement("div");ov.className="a-modal";
  ov.innerHTML='<div class="a-modal-in"><button class="a-x">✕</button><h2>'+esc(m.title)+'</h2>'
    +'<div class="a-sub">'+esc(m.cat)+' · '+esc(m.nick)+' · '+ago(m.ts)+' · '+(STAT[m.status]||m.status)+'</div>'
    +'<div class="a-fb-content">'+esc(m.content).replace(/\n/g,"<br>")+'</div>'
    +(m.wallet||m.contract||m.tx?'<div class="a-fb-w3">链上：'+[m.chain,m.wallet,m.contract,m.tx].filter(Boolean).map(esc).join(" · ")+'</div>':'')
    +(m.contact?'<div class="a-fb-contact">联系方式(仅管理员)：'+esc(m.contact)+'</div>':'')
    +(reports?'<div class="a-fb-reports"><b>举报('+m.reports.length+')</b>'+reports+'<button class="a-mini" data-a="clearReports">清空举报</button></div>':'')
    +'<div class="a-fh">官方回复</div><textarea id="fbOff" class="a-in" rows="3" placeholder="填写官方回复">'+(m.official?esc(m.official.content):"")+'</textarea>'
    +'<select id="fbOffS" class="a-in"><option value="">回复状态</option><option value="adopt">已采纳</option><option value="resolved">已解决</option><option value="need">需补充证据</option><option value="no">不予公开</option></select>'
    +'<button class="a-btn sm" id="fbOffGo">发布官方回复</button>'
    +'<div class="a-fh">审核</div><div class="a-ops">'
    +'<button class="a-mini" data-a="status" data-v="public">公开</button><button class="a-mini" data-a="status" data-v="pending">退回待审</button>'
    +'<button class="a-mini" data-a="status" data-v="hidden">隐藏</button><button class="a-mini" data-a="status" data-v="archived">归档</button>'
    +'<button class="a-mini" data-a="feature" data-v="1">★精选</button><button class="a-mini" data-a="resolve" data-v="1">标记已解决</button>'
    +'<button class="a-mini a-danger" data-a="delete">删除</button></div></div>';
  document.body.appendChild(ov);document.body.style.overflow="hidden";
  function close(){ov.remove();document.body.style.overflow="";}
  ov.querySelector(".a-x").onclick=close;ov.onclick=function(e){if(e.target===ov)close();};
  function act(p,after){post("/feedback/act",Object.assign({id:id},p),true).then(function(rr){if(rr.ok){toast("已处理");close();go("feedback");}else toast(rr.error||"失败",1);});}
  ov.querySelectorAll(".a-ops .a-mini,.a-fb-reports .a-mini").forEach(function(b){b.onclick=function(){var a=b.getAttribute("data-a");
    if(a==="delete"){if(!confirm("确定删除？不可恢复"))return;act({action:"delete"});}
    else if(a==="clearReports")act({action:"clearReports"});
    else act({action:a,status:b.getAttribute("data-v"),val:b.getAttribute("data-v")==="1"});};});
  ov.querySelector("#fbOffGo").onclick=function(){act({action:"official",content:ov.querySelector("#fbOff").value.trim(),ostatus:ov.querySelector("#fbOffS").value});};
});}

/* ---------- 链上状态 ---------- */
function pOnchain(el){get("/onchain").then(function(r){
  if(!r.ok||!r.anubis){el.innerHTML='<div class="a-center">雷达数据暂无</div>';return;}
  var a=r.anubis,m=r.market||{},ec=r.eco||{},tr=r.treasury||{};
  el.innerHTML='<div class="a-cards">'
    +card("⚓","Anubis 区块",fmtN(a.height),"出块 "+(a.blockTime||"—")+"s · TPS "+(a.tps||"—"),"ok")
    +card("🟣","Polygon",r.polygon&&r.polygon.ok?"正常":"—","主池实时","ok")
    +card("💲","LGNS 现价",m.price?("$"+(+m.price).toFixed(4)):"—",(m.change24h!=null?(m.change24h>=0?"+":"")+m.change24h.toFixed(1)+"% 24h":""))
    +card("📊","质押率",ec.stakeRate!=null?ec.stakeRate.toFixed(1)+"%":"—","")
    +card("🏛","国库市值",tr.marketValue?("$"+(tr.marketValue/1e6).toFixed(1)+"M"):"—","")
    +card("🔗","Anubis 地址",fmtN(a.addresses),"今日交易 "+fmtN(a.txToday))
    +'</div><div class="a-note-real">以上为链上雷达实时聚合(真实)。链上事件逐条解析/重同步/失败任务重试属独立索引任务，'+na("未接入")+'——当前用实时聚合而非事件索引库。更新时间：'+(r.updated?new Date(r.updated).toLocaleString():"—")+'</div>';
});}

/* ---------- 审计日志 ---------- */
var ACT={login:"登录",logout:"退出",login_fail:"登录失败",'2fa_fail':"2FA失败",'2fa_replay':"验证码重放",setup:"初始化",change_password:"改密码",fb_delete:"删留言",fb_status:"改状态",fb_official:"官方回复",fb_feature:"精选",fb_resolve:"标记解决",fb_clearReports:"清举报"};
function pAudit(el){get("/audit").then(function(r){
  var items=r.items||[];
  el.innerHTML='<div class="a-panel-box"><h3>审计日志（近 '+items.length+' 条）</h3>'
    +'<table class="a-tbl"><thead><tr><th>时间</th><th>操作</th><th>对象</th><th>IP(哈希)</th><th>说明</th></tr></thead><tbody>'
    +(items.length?items.map(function(x){return '<tr><td>'+ago(x.ts)+'</td><td>'+esc(ACT[x.action]||x.action)+'</td><td class="a-td-t">'+esc(x.obj||"—")+'</td><td class="a-mono">'+esc(x.ip)+'</td><td>'+esc(x.extra||"")+'</td></tr>';}).join(""):'<tr><td colspan=5 class="a-center">暂无</td></tr>')
    +'</tbody></table><div class="a-note-real">IP 仅存哈希(不存明文)；审计日志不通过普通后台删除，保留 90 天。</div></div>';
});}

/* ---------- 系统状态 ---------- */
function pSystem(el){
  el.innerHTML='<div class="a-cards">'
    +card("🟢","后台服务","运行中","Cloudflare Worker","ok")
    +card("🗄","存储","KV 正常","Workers KV","ok")
    +card("⚡","API 响应",na("未埋点"),"")
    +card("📉","错误率",na("未接入"),"")
    +card("💾","自动备份",na("未接入"),"")
    +card("🔁","任务队列",na("无队列"),"")
    +'</div><div class="a-panel-box"><h3>安全设置</h3>'
    +'<button class="a-btn sm" id="aChgPw">修改管理员密码</button>'
    +'<div class="a-note-real">修改密码需验证当前密码，改后其它会话全部失效。<br>API 响应时间/错误率/自动备份/数据恢复需常驻基建，'+na("未接入")+'（Worker 无内置定时备份，可对接外部；Postgres/Redis/队列本架构不适用）。</div></div>';
  document.getElementById("aChgPw").onclick=chgPw;
}
function chgPw(){
  var ov=document.createElement("div");ov.className="a-modal";
  ov.innerHTML='<div class="a-modal-in" style="max-width:420px"><button class="a-x">✕</button><h2>修改管理员密码</h2>'
    +'<input id="cCur" class="a-in" type="password" placeholder="当前密码"><input id="cNew" class="a-in" type="password" placeholder="新密码 ≥8位(含字母+数字)">'
    +'<div id="cErr" class="a-err" style="display:none"></div><button class="a-btn" id="cGo">确认修改</button></div>';
  document.body.appendChild(ov);document.body.style.overflow="hidden";
  function close(){ov.remove();document.body.style.overflow="";}ov.querySelector(".a-x").onclick=close;ov.onclick=function(e){if(e.target===ov)close();};
  ov.querySelector("#cGo").onclick=function(){var e=ov.querySelector("#cErr");e.style.display="none";
    post("/change-password",{current:ov.querySelector("#cCur").value,next:ov.querySelector("#cNew").value},true).then(function(r){
      if(r.ok){toast("密码已修改，其它会话已失效");close();}else{e.textContent=r.error;e.style.display="block";}});};
}

/* ---------- 样式 ---------- */
function css(){if(document.getElementById("admCss"))return;var s=document.createElement("style");s.id="admCss";
s.textContent=[
":root{--bg:#070A08;--side:#0B100D;--card:#111713;--green:#7BFF45;--gold:#D9A83E;--ink:#E9EFEA;--sub:#909A93;--line:#1e2a22;--warn:#FFB547;--crit:#FF5A5F}",
"*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:'Microsoft YaHei','PingFang SC',system-ui,sans-serif;line-height:1.6}",
".a-center{text-align:center;color:var(--sub);padding:40px}",
/* auth */
".a-auth{min-height:100vh;display:grid;place-items:center;padding:20px}.a-auth-box{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:30px 26px;width:100%;max-width:380px}",
".a-auth-box h1{font-size:22px;margin:0 0 6px}.a-logo{color:var(--green);font-weight:700;margin-bottom:10px}.a-sub{color:var(--sub);font-size:13px;margin:0 0 16px}",
".a-in{width:100%;background:#0a0f0c;border:1px solid var(--line);border-radius:9px;color:var(--ink);padding:11px 13px;font:inherit;font-size:14px;margin-bottom:11px}.a-in:focus{outline:none;border-color:var(--green)}",
".a-code-in{font-size:20px;letter-spacing:4px;text-align:center}",
".a-btn{width:100%;background:linear-gradient(180deg,#8fff5f,#3fbf22);border:none;border-radius:10px;color:#04240c;font-weight:700;font-size:15px;padding:12px;cursor:pointer}.a-btn:hover{filter:brightness(1.05)}.a-btn.sm{width:auto;padding:9px 18px;font-size:13.5px}.a-btn:disabled{opacity:.6}",
".a-link{background:none;border:none;color:var(--sub);font-size:13px;cursor:pointer;margin-top:10px;width:100%}",
".a-err{background:rgba(255,90,95,.1);border:1px solid rgba(255,90,95,.4);color:#ff9a9d;border-radius:8px;padding:9px 12px;font-size:13px;margin-bottom:11px}",
".a-fh{font-size:12.5px;color:var(--gold);margin:14px 0 6px;font-weight:700}",
".a-code2{background:#0a0f0c;border:1px solid var(--line);border-radius:8px;padding:11px;font-family:ui-monospace,monospace;color:var(--green);word-break:break-all;font-size:15px}.a-code2.sm{font-size:11px;color:var(--sub)}",
".a-recov{display:flex;flex-wrap:wrap;gap:7px}.a-recov span{background:#0a0f0c;border:1px solid var(--line);border-radius:6px;padding:5px 9px;font-family:ui-monospace,monospace;font-size:13px;color:var(--ink)}",
".a-warn2{background:rgba(255,181,71,.1);border:1px solid rgba(255,181,71,.35);color:var(--warn);border-radius:9px;padding:11px;font-size:12.5px;margin:14px 0}",
/* shell */
".a-shell{display:flex;min-height:100vh}",
".a-side{width:210px;background:var(--side);border-right:1px solid var(--line);padding:16px 12px;flex:0 0 auto;display:flex;flex-direction:column}",
".a-brand{color:var(--ink);font-size:17px;margin:4px 8px 18px}.a-brand b{color:var(--green)}",
".a-navi{display:flex;align-items:center;gap:11px;width:100%;background:none;border:none;color:var(--sub);font-size:14px;padding:11px 13px;border-radius:9px;cursor:pointer;text-align:left;margin-bottom:2px}.a-navi span{font-size:16px}",
".a-navi:hover{background:rgba(123,255,69,.06);color:var(--ink)}.a-navi.on{background:rgba(123,255,69,.12);color:var(--green);font-weight:600}",
".a-side-foot{margin-top:auto}.a-logout{color:#e88}",
".a-main{flex:1;min-width:0;display:flex;flex-direction:column}",
".a-top{display:flex;align-items:center;gap:12px;padding:14px 22px;border-bottom:1px solid var(--line);background:var(--side)}",
".a-burger{display:none;background:none;border:none;color:var(--ink);font-size:20px;cursor:pointer}",
".a-top-title{font-size:17px;font-weight:600}.a-top-r{margin-left:auto}.a-user{color:var(--sub);font-size:13px}",
"#aPanel{padding:20px 22px}",
".a-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:13px}",
".a-card{background:var(--card);border:1px solid var(--line);border-radius:13px;padding:15px}",
".a-card-ic{font-size:19px}.a-card-v{font-size:23px;font-weight:800;margin-top:6px}.a-card-l{font-size:12.5px;color:var(--sub);margin-top:2px}.a-card-s{font-size:11px;color:var(--sub);margin-top:4px;opacity:.8}",
".a-card.ok .a-card-v{color:var(--green)}.a-card.bad .a-card-v{color:var(--crit)}",
".a-na{display:inline-block;background:rgba(144,154,147,.15);color:var(--sub);border:1px dashed var(--line);border-radius:5px;padding:1px 8px;font-size:12px}",
".a-panel-box{background:var(--card);border:1px solid var(--line);border-radius:13px;padding:16px 18px;margin-top:14px}.a-panel-box h3{margin:0 0 12px;font-size:15px;color:var(--gold)}",
".a-real{font-size:11px;color:var(--green);border:1px solid rgba(123,255,69,.4);border-radius:4px;padding:1px 7px;margin-left:8px}",
".a-note-real{background:rgba(123,255,69,.05);border:1px solid rgba(123,255,69,.2);border-radius:10px;padding:11px 14px;font-size:12px;color:var(--sub);margin-top:14px;line-height:1.8}.a-note-real b{color:var(--green)}",
".a-ul{margin:0;padding-left:18px;font-size:12.5px;color:var(--sub);line-height:1.9}",
".a-tbl{width:100%;border-collapse:collapse;font-size:13px}.a-tbl th{text-align:left;color:var(--sub);font-weight:400;padding:8px 9px;border-bottom:1px solid var(--line);font-size:12px}.a-tbl td{padding:9px 9px;border-bottom:1px solid rgba(30,42,34,.6)}.a-td-t{max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
".a-mono{font-family:ui-monospace,monospace;font-size:11.5px;color:var(--sub)}",
".a-bar{display:inline-block;width:90px;height:6px;background:#0a0f0c;border-radius:4px;overflow:hidden;vertical-align:middle;margin-right:6px}.a-bar>div{height:100%;background:var(--green)}",
".a-total{margin-top:10px;color:var(--sub);font-size:12.5px}",
".a-st{font-size:11px;border-radius:4px;padding:1px 7px;border:1px solid}.a-st.pending{color:var(--warn);border-color:#5a4520}.a-st.public{color:var(--green);border-color:#2a5a1e}.a-st.replied{color:#5cb3ea;border-color:#245a70}.a-st.resolved{color:var(--green);border-color:#2a5a1e}.a-st.hidden{color:var(--crit);border-color:#5a2020}.a-st.archived{color:var(--sub);border-color:var(--line)}",
".a-mini{background:#0a0f0c;border:1px solid var(--line);border-radius:6px;color:var(--gold);font-size:12px;padding:4px 10px;cursor:pointer;margin:2px}.a-mini:hover{border-color:var(--green)}.a-danger{color:var(--crit);border-color:#5a2020}",
".a-modal{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:100;display:grid;place-items:start center;overflow-y:auto;padding:24px 14px}.a-modal-in{background:var(--card);border:1px solid var(--line);border-radius:14px;max-width:560px;width:100%;padding:22px;position:relative;margin:auto}",
".a-x{position:absolute;top:12px;right:14px;background:none;border:none;color:var(--sub);font-size:18px;cursor:pointer}",
".a-fb-content{color:var(--ink);font-size:14px;margin:12px 0;line-height:1.8;max-height:200px;overflow:auto;word-break:break-word}",
".a-fb-w3{background:#0a0f0c;border-radius:8px;padding:8px 11px;font-family:ui-monospace,monospace;font-size:11.5px;color:var(--sub);word-break:break-all;margin:8px 0}",
".a-fb-contact{background:rgba(217,168,62,.1);border-radius:7px;padding:8px 11px;font-size:12.5px;color:var(--gold);margin:8px 0}",
".a-fb-reports{background:rgba(255,90,95,.07);border:1px solid rgba(255,90,95,.25);border-radius:9px;padding:9px 12px;font-size:12.5px;color:var(--sub);margin:10px 0}.a-rp{padding:2px 0}",
".a-ops{display:flex;flex-wrap:wrap;gap:6px}",
"#aToast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--card);border:1px solid var(--green);color:var(--ink);padding:10px 20px;border-radius:22px;font-size:13px;z-index:300;opacity:0;transition:.25s;pointer-events:none}#aToast.show{opacity:1;transform:translateX(-50%) translateY(0)}#aToast.bad{border-color:var(--crit)}",
".a-overlay{display:none}",
"@media(max-width:820px){.a-cards{grid-template-columns:1fr 1fr}.a-side{position:fixed;left:0;top:0;height:100vh;z-index:60;transform:translateX(-100%);transition:.25s}.a-side.open{transform:none}.a-burger{display:block}.a-overlay.on{display:block;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:55}#aPanel{padding:14px}.a-td-t{max-width:130px}}"
].join("\n");
document.head.appendChild(s);}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();
