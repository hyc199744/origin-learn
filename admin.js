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
var NAV=[["dashboard","🏠","总览"],["traffic","📈","流量分析"],["analytics","📊","网站分析"],["events","🎯","事件统计"],["utm","🔗","推广链接"],["feedback","💬","留言管理"],["orders","🧾","订单记录"],["onchain","⛓","链上状态"],["audit","📜","审计日志"],["system","🖥","系统状态"]];
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
  ({dashboard:pDash,traffic:pTraffic,analytics:pAnalytics,events:pEvents,utm:pUtm,feedback:pFeedback,orders:pOrders,onchain:pOnchain,audit:pAudit,system:pSystem}[page]||pDash)(el);
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
var GEO_NAMES={CN:"中国",HK:"香港",TW:"台湾",MO:"澳门",US:"美国",SG:"新加坡",JP:"日本",KR:"韩国",GB:"英国",DE:"德国",FR:"法国",CA:"加拿大",AU:"澳大利亚",MY:"马来西亚",TH:"泰国",VN:"越南",ID:"印尼",IN:"印度",RU:"俄罗斯",PH:"菲律宾",NL:"荷兰",BR:"巴西",TR:"土耳其",AE:"阿联酋",IT:"意大利",ES:"西班牙",PT:"葡萄牙",UA:"乌克兰",PL:"波兰",SA:"沙特",EG:"埃及",NG:"尼日利亚",ZA:"南非",MX:"墨西哥",AR:"阿根廷",SE:"瑞典",CH:"瑞士",BE:"比利时",AT:"奥地利",NZ:"新西兰",KH:"柬埔寨",LA:"老挝",MM:"缅甸",BD:"孟加拉",PK:"巴基斯坦",KZ:"哈萨克",IR:"伊朗"};
function geoFlag(cc){ if(!cc||cc.length!==2) return "🏳️"; try{return String.fromCodePoint.apply(String,[].map.call(cc.toUpperCase(),function(c){return 127397+c.charCodeAt(0);}));}catch(e){return "🏳️";} }
function pTraffic(el){get("/traffic").then(function(r){
  var rows=(r.geo||[]).map(function(g,i){var pct=r.total?(g.n/r.total*100).toFixed(1):0;var cc=g.country||"";var nm=GEO_NAMES[cc]||cc;return '<tr><td>'+(i+1)+'</td><td>'+geoFlag(cc)+' '+esc(nm)+'</td><td>'+g.n+'</td><td><div class="a-bar"><div style="width:'+pct+'%"></div></div>'+pct+'%</td></tr>';}).join("");
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

/* ---------- 网站分析 ---------- */
var AN_RANGE="7d",AN_FROM="",AN_TO="";
function anDur(s){s=Number(s)||0;if(s<60)return s+"秒";var m=Math.floor(s/60),ss=s%60;if(m<60)return m+"分"+(ss?ss+"秒":"");var h=Math.floor(m/60);return h+"时"+(m%60)+"分";}
function anBarList(rows,nameKey,valKey){
  if(!rows||!rows.length)return '<div class="a-center" style="padding:14px;color:var(--muted)">暂无数据</div>';
  var total=rows.reduce(function(s,r){return s+(Number(r[valKey])||0);},0)||1;
  return rows.map(function(r){var n=Number(r[valKey])||0;var pct=n/total*100;var nm=(r[nameKey]==null||r[nameKey]==="")?"(未知)":r[nameKey];
    return '<div class="an-row"><div class="an-lab" title="'+esc(String(nm))+'">'+esc(String(nm))+'</div><div class="an-bar"><div style="width:'+pct.toFixed(1)+'%"></div></div><div class="an-val">'+fmtN(n)+' <i>'+pct.toFixed(0)+'%</i></div></div>';
  }).join("");
}
function anEnsureCss(){ if(document.getElementById("anCss"))return;
  var st=document.createElement("style");st.id="anCss";
  st.textContent=".an-tabs{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px}"
    +".an-tab{background:var(--card);border:1px solid var(--line);color:var(--sub);padding:7px 13px;border-radius:8px;cursor:pointer;font-size:13px}"
    +".an-tab.on{background:rgba(123,255,69,.14);color:var(--green);border-color:var(--green)}"
    +".an-custom{display:inline-flex;gap:6px;align-items:center;margin-left:auto;flex-wrap:wrap}"
    +".an-custom input{background:var(--card);border:1px solid var(--line);color:var(--ink);border-radius:7px;padding:6px;font-size:12px}"
    +".an-row{display:flex;align-items:center;gap:10px;margin:7px 0}"
    +".an-lab{width:34%;min-width:100px;font-size:13px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"
    +".an-bar{flex:1;height:9px;background:rgba(255,255,255,.05);border-radius:6px;overflow:hidden}"
    +".an-bar>div{height:100%;background:linear-gradient(90deg,var(--green),var(--gold));border-radius:6px}"
    +".an-val{width:92px;text-align:right;font-size:12px;color:var(--sub)}.an-val i{color:var(--muted);font-style:normal;font-size:11px}"
    +".an-trend{display:flex;align-items:flex-end;gap:3px;height:130px;padding:8px 0;overflow-x:auto}"
    +".an-tcol{flex:1;min-width:16px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:4px}"
    +".an-tbar{width:70%;max-width:22px;background:linear-gradient(180deg,var(--green),rgba(123,255,69,.3));border-radius:3px 3px 0 0;min-height:3px}"
    +".an-tcol span{font-size:9px;color:var(--muted);white-space:nowrap}";
  document.head.appendChild(st);
}
function anTime(sec){var d=new Date((Number(sec)||0)*1000+8*3600*1000);function z(n){return String(n).padStart(2,"0");}return d.getUTCFullYear()+"-"+z(d.getUTCMonth()+1)+"-"+z(d.getUTCDate())+" "+z(d.getUTCHours())+":"+z(d.getUTCMinutes());}
function anRecentTable(rows){
  if(!rows||!rows.length)return '<div class="a-center" style="padding:14px;color:var(--muted)">暂无数据</div>';
  return '<div style="overflow-x:auto"><table class="a-tbl"><thead><tr><th>时间</th><th>来源</th><th>引荐域名</th><th>推广(utm)</th><th>落地页</th><th>设备</th><th>国家</th><th>页数</th></tr></thead><tbody>'
    +rows.map(function(o){return '<tr><td>'+anTime(o.started_at)+'</td><td>'+esc(o.source||"—")+'</td><td>'+esc(o.referrer_domain||"—")+'</td><td>'+esc(o.campaign||"—")+'</td><td>'+esc(o.landing_page||"—")+'</td><td>'+esc(o.device_type||"—")+'</td><td>'+esc(o.country||"—")+'</td><td>'+(o.pageview_count||0)+(o.bounced?' <i style="color:var(--muted);font-style:normal;font-size:11px">跳出</i>':"")+'</td></tr>';}).join("")
    +'</tbody></table></div>';
}
function loadAn(el){
  var host=el.querySelector("#anBody"); if(host)host.innerHTML='<div class="a-note-real">加载中…</div>';
  var q=(AN_RANGE==="custom"&&AN_FROM&&AN_TO)?("range=custom&from="+encodeURIComponent(AN_FROM)+"&to="+encodeURIComponent(AN_TO)):("range="+encodeURIComponent(AN_RANGE));
  get("/an?"+q).then(function(r){
    if(!host)return;
    if(r&&r.nodb){ host.innerHTML='<div class="a-panel-box"><div class="a-note-real">'+esc(r.note||"D1 未接入")+'</div></div>'; return; }
    if(!r||!r.ok){ host.innerHTML='<div class="a-panel-box"><div class="a-note-real">分析数据加载失败,请稍后重试。</div></div>'; return; }
    var o=r.overview||{};
    var cards='<div class="a-cards">'
      +card("👣","会话数",fmtN(o.sessions||0),"独立访客 "+fmtN(o.visitors||0),"")
      +card("📄","页面浏览",fmtN(o.pageviews||0),"人均 "+(o.pagesPerSession||0)+" 页","")
      +card("🆕","新/回访",fmtN(o.newVisitors||0)+" / "+fmtN(o.returningVisitors||0),"新访客 / 回访","")
      +card("⏱","平均时长",anDur(o.avgDuration||0),"中位 "+anDur(o.medianDuration||0),"ok")
      +card("↩️","跳出率",(o.bounceRate||0)+"%","仅看一页即离开","")
      +card("✅","互动会话",fmtN(o.engagedSessions||0),"有点击/滚动等","ok")
      +'</div>';
    function box(t,inner){return '<div class="a-panel-box"><h3>'+t+' <span class="a-real">真实</span></h3>'+inner+'</div>';}
    var tr=r.trend||[]; var tmax=tr.reduce(function(m,x){return Math.max(m,Number(x.sessions)||0);},0)||1;
    var trend=tr.length?('<div class="an-trend">'+tr.map(function(x){var h=Math.round((Number(x.sessions)||0)/tmax*100);return '<div class="an-tcol" title="'+esc(x.d)+': '+(x.sessions||0)+'会话 / '+(x.pv||0)+'PV"><div class="an-tbar" style="height:'+Math.max(3,h)+'%"></div><span>'+esc(String(x.d).slice(5))+'</span></div>';}).join("")+'</div>'):'<div class="a-center" style="color:var(--muted);padding:12px">暂无数据</div>';
    host.innerHTML=cards+box("每日趋势(会话)",trend)
      +box("一级渠道分组",anBarList(r.channelGroups,"group","sessions"))
      +box("🤖 AI 平台来源",anBarList(r.aiSources,"source","sessions"))
      +box("来源渠道(细分)",anBarList(r.sources,"source","sessions"))
      +box("设备类型",anBarList(r.devices,"device_type","n"))
      +box("浏览器",anBarList(r.browsers,"browser","n"))
      +box("操作系统",anBarList(r.os,"os","n"))
      +box("热门页面",anBarList(r.pages,"pathname","n"))
      +box("落地页面",anBarList(r.landings,"landing_page","n"))
      +box("来源域名(引荐站)",anBarList(r.referrers,"referrer_domain","n"))
      +box("最近来源记录(近100条)",anRecentTable(r.recent))
      +'<div class="a-note-real">时间按新加坡时区(UTC+8)展示;机器人与 /adm 后台访问不计入;数据自接入D1当天起累计。</div>';
  }).catch(function(){ if(host)host.innerHTML='<div class="a-panel-box"><div class="a-note-real">分析数据加载失败。</div></div>'; });
}
function pAnalytics(el){
  anEnsureCss();
  var ranges=[["today","今天"],["yesterday","昨天"],["7d","最近7天"],["30d","最近30天"]];
  el.innerHTML='<div class="an-tabs">'+ranges.map(function(x){return '<button class="an-tab'+(x[0]===AN_RANGE?" on":"")+'" data-r="'+x[0]+'">'+x[1]+'</button>';}).join("")
    +'<span class="an-custom"><input type="date" id="anFrom" value="'+esc(AN_FROM)+'"><span style="color:var(--muted)">至</span><input type="date" id="anTo" value="'+esc(AN_TO)+'"><button class="an-tab'+(AN_RANGE==="custom"?" on":"")+'" id="anGo">自定义查询</button></span></div><div id="anBody"></div>';
  el.querySelectorAll(".an-tab[data-r]").forEach(function(b){b.onclick=function(){AN_RANGE=b.getAttribute("data-r");pAnalytics(el);};});
  var go=el.querySelector("#anGo"); if(go)go.onclick=function(){var f=el.querySelector("#anFrom").value,t=el.querySelector("#anTo").value;if(f&&t){AN_FROM=f;AN_TO=t;AN_RANGE="custom";pAnalytics(el);}};
  loadAn(el);
}
/* ---------- 推广链接生成器 ---------- */
var UTM_PRESETS=[["","— 选择平台预设 —","",""],["ChatGPT (AI平台)","","chatgpt","ai"],["豆包 (AI平台)","","doubao","ai"],["DeepSeek (AI平台)","","deepseek","ai"],["Claude (AI平台)","","claude","ai"],["Gemini (AI平台)","","gemini","ai"],["Perplexity (AI平台)","","perplexity","ai"],["Kimi (AI平台)","","kimi","ai"],["腾讯元宝 (AI平台)","","yuanbao","ai"],["通义千问 (AI平台)","","tongyi","ai"],["秘塔AI搜索 (AI平台)","","metaso","ai"],["X / Twitter (社交)","","twitter","social"],["Telegram (社交)","","telegram","social"],["YouTube (社交)","","youtube","social"],["微信 (社交)","","wechat","social"],["旧站 originweb3 (自有)","","originweb3","owned_site"]];
function utmClean(s){return String(s||"").trim().replace(/[^\w\-一-龥]/g,"_").slice(0,60);}
function utmGroup(m){if(m==="ai")return "AI平台";if(m==="social")return "社交媒体";if(m==="owned_site")return "自有网站";if(m==="cpc"||m==="ads")return "广告推广";if(m==="email")return "邮件";return "其他";}
function pUtm(el){
  anEnsureCss();
  el.innerHTML='<div class="a-panel-box"><h3>推广链接生成器</h3>'
    +'<div style="display:grid;gap:10px;max-width:640px">'
    +'<label>目标页面 URL<br><input id="uUrl" class="an-tab" style="width:100%" value="https://web3origin.com/"></label>'
    +'<label>平台预设<br><select id="uPreset" class="an-tab" style="width:100%">'+UTM_PRESETS.map(function(p,i){return '<option value="'+i+'">'+esc(p[1])+'</option>';}).join("")+'</select></label>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
    +'<label>utm_source<br><input id="uSrc" class="an-tab" style="width:100%" placeholder="chatgpt"></label>'
    +'<label>utm_medium<br><input id="uMed" class="an-tab" style="width:100%" placeholder="ai / social / owned_site"></label>'
    +'<label>utm_campaign<br><input id="uCam" class="an-tab" style="width:100%" placeholder="ai_recommend"></label>'
    +'<label>utm_content<br><input id="uCon" class="an-tab" style="width:100%"></label>'
    +'<label>utm_term<br><input id="uTerm" class="an-tab" style="width:100%"></label>'
    +'</div><button class="an-tab on" id="uGen" style="justify-self:start">生成链接</button>'
    +'</div><div id="uOut" style="margin-top:12px"></div>'
    +'<div class="a-note-real">只含 utm 参数、不含任何用户隐私;utm 值自动清洗非法字符。AI平台用 medium=ai、社交用 social、旧站导流用 owned_site,后台据此自动分渠道。</div></div>';
  var ps=el.querySelector("#uPreset");
  ps.onchange=function(){var p=UTM_PRESETS[+ps.value]; if(p&&p[2]){el.querySelector("#uSrc").value=p[2];el.querySelector("#uMed").value=p[3];if(!el.querySelector("#uCam").value)el.querySelector("#uCam").value=(p[3]==="ai"?"ai_recommend":(p[3]==="owned_site"?"old_site_redirect":""));}};
  el.querySelector("#uGen").onclick=function(){
    var out=el.querySelector("#uOut"),base=el.querySelector("#uUrl").value.trim(),u;
    try{u=new URL(base);}catch(e){out.innerHTML='<div style="color:#e57373;padding:8px">URL 格式不对,请以 https:// 开头</div>';return;}
    var src=utmClean(el.querySelector("#uSrc").value),med=utmClean(el.querySelector("#uMed").value),cam=utmClean(el.querySelector("#uCam").value),con=utmClean(el.querySelector("#uCon").value),term=utmClean(el.querySelector("#uTerm").value);
    if(!src){out.innerHTML='<div style="color:#e57373;padding:8px">请填 utm_source 或选平台预设</div>';return;}
    u.searchParams.set("utm_source",src); if(med)u.searchParams.set("utm_medium",med); if(cam)u.searchParams.set("utm_campaign",cam); if(con)u.searchParams.set("utm_content",con); if(term)u.searchParams.set("utm_term",term);
    var link=u.toString();
    out.innerHTML='<div class="a-panel-box"><div style="word-break:break-all;color:var(--green);font-size:13px">'+esc(link)+'</div>'
      +'<div style="margin-top:8px"><button class="an-tab on" id="uCopy">复制链接</button> <span style="color:var(--muted);margin-left:8px">归类到 <b style="color:var(--gold)">'+esc(utmGroup(med))+(med==="ai"?" / "+esc(src):"")+'</b></span></div></div>';
    var cp=out.querySelector("#uCopy"); cp.onclick=function(){try{navigator.clipboard.writeText(link);cp.textContent="已复制 ✓";setTimeout(function(){cp.textContent="复制链接";},1500);}catch(e){}};
  };
}
/* ---------- 事件统计 ---------- */
var EV_CN={tool_open:"工具打开",tool_start:"工具启动",tool_success:"工具成功",tool_error:"工具失败",tool_result_view:"查看结果",tool_retry:"工具重试",article_open:"文章打开",article_read_30s:"阅读30秒",article_read_60s:"阅读60秒",article_scroll_25:"滚动25%",article_scroll_50:"滚动50%",article_scroll_75:"滚动75%",article_complete:"读完文章",related_article_click:"点相关文章",article_share_click:"点分享",video_play:"视频播放",video_pause:"视频暂停",video_progress_25:"看到25%",video_progress_50:"看到50%",video_progress_75:"看到75%",video_complete:"看完视频",video_error:"视频出错",contact_open:"打开联系方式",wechat_click:"点微信",qq_click:"点QQ",telegram_click:"点Telegram",x_click:"点X",youtube_click:"点YouTube",register_start:"开始注册",register_success:"注册成功",login_success:"登录成功",payment_start:"开始支付",payment_success:"支付成功",payment_failed:"支付失败",copy_contract:"复制合约",open_block_explorer:"打开浏览器",copy_wallet_address:"复制钱包",open_transaction:"打开交易",network_switch:"切换网络",search:"搜索",search_no_result:"搜索无结果",language_switch:"切换语言",navigation_click:"导航点击",outbound_click:"外链点击",download:"下载",form_start:"开始填表",form_submit:"提交表单",form_success:"表单成功",form_error:"表单出错"};
function evcn(n){return EV_CN[n]||n;}
var EV_RANGE="7d",EV_F={};
function loadEv(el){
  var host=el.querySelector("#evBody"); if(host)host.innerHTML='<div class="a-note-real">加载中…</div>';
  var q="range="+encodeURIComponent(EV_RANGE); if(EV_F.category)q+="&category="+encodeURIComponent(EV_F.category); if(EV_F.event_name)q+="&event_name="+encodeURIComponent(EV_F.event_name);
  get("/events?"+q).then(function(r){
    if(!host)return;
    if(r&&r.nodb){host.innerHTML='<div class="a-panel-box"><div class="a-note-real">'+esc(r.note||"D1未接入")+'</div></div>';return;}
    if(!r||!r.ok){host.innerHTML='<div class="a-panel-box"><div class="a-note-real">事件数据加载失败,请稍后重试。</div></div>';return;}
    var o=r.overview||{};
    function box(t,inner){return '<div class="a-panel-box"><h3>'+t+' <span class="a-real">真实</span></h3>'+inner+'</div>';}
    var cards='<div class="a-cards">'
      +card("🎯","总事件",fmtN(o.total||0),"独立用户 "+fmtN(o.users||0)+" · 人均 "+(o.perUser||0),"")
      +card("🛠","工具启动",fmtN(o.tool_start||0),"打开 "+fmtN(o.tool_open||0),"")
      +card("✅","工具成功率",(o.tool_rate||0)+"%","成功"+(o.tool_success||0)+" / 失败"+(o.tool_error||0),"ok")
      +card("📞","转化点击",fmtN(o.conversions||0),"联系/注册/支付等","")
      +card("📖","有效阅读",fmtN(o.reads||0),"阅读≥30秒","")
      +card("🎬","视频完播",fmtN(o.videoComplete||0),"看完整片","ok")
      +'</div>';
    var top=(r.ranking&&r.ranking[0])?r.ranking[0].n:1;
    var rk=(r.ranking||[]).map(function(x){return '<div class="an-row"><div class="an-lab" title="'+esc(x.event_name)+'">'+esc(evcn(x.event_name))+'</div><div class="an-bar"><div style="width:'+(x.n/top*100).toFixed(1)+'%"></div></div><div class="an-val">'+fmtN(x.n)+' <i>'+fmtN(x.u)+'人</i></div></div>';}).join("")||'<div class="a-center" style="color:var(--muted);padding:12px">暂无数据</div>';
    var tl=(r.tools||[]);
    var tools=tl.length?('<div style="overflow-x:auto"><table class="a-tbl"><thead><tr><th>工具</th><th>打开</th><th>启动</th><th>成功</th><th>失败</th><th>成功率</th><th>看结果</th><th>重试</th><th>用户</th></tr></thead><tbody>'+tl.map(function(x){return '<tr><td>'+esc(x.tool_name||"—")+'</td><td>'+(x.open||0)+'</td><td>'+(x.start||0)+'</td><td style="color:var(--green)">'+(x.success||0)+'</td><td style="color:#e57373">'+(x.error||0)+'</td><td>'+(x.rate||0)+'%</td><td>'+(x.result_view||0)+'</td><td>'+(x.retry||0)+'</td><td>'+(x.users||0)+'</td></tr>';}).join("")+'</tbody></table></div>'):'<div class="a-center" style="color:var(--muted);padding:12px">暂无数据</div>';
    var cv=anBarList((r.conversions||[]).map(function(x){return {name:evcn(x.event_name),n:x.n};}),"name","n");
    var tr=r.trend||[]; var tmax=tr.reduce(function(m,x){return Math.max(m,Number(x.n)||0);},0)||1;
    var trend=tr.length?('<div class="an-trend">'+tr.map(function(x){var h=Math.round((Number(x.n)||0)/tmax*100);return '<div class="an-tcol" title="'+esc(x.d)+': '+(x.n||0)+'事件 / 成功'+(x.succ||0)+' / 失败'+(x.err||0)+'"><div class="an-tbar" style="height:'+Math.max(3,h)+'%"></div><span>'+esc(String(x.d).slice(5))+'</span></div>';}).join("")+'</div>'):'<div class="a-center" style="color:var(--muted);padding:12px">暂无数据</div>';
    var rc=(r.recent||[]);
    var recent=rc.length?('<div style="overflow-x:auto"><table class="a-tbl"><thead><tr><th>时间</th><th>事件</th><th>访客</th><th>页面</th><th>国家</th><th>设备</th><th>来源</th><th>工具/状态</th></tr></thead><tbody>'+rc.map(function(x){return '<tr><td>'+anTime(x.created_at)+'</td><td>'+esc(evcn(x.event_name))+'</td><td><code style="font-size:11px">'+esc(String(x.visitor_id||"").slice(0,6))+'</code></td><td>'+esc(x.pathname||"—")+'</td><td>'+esc(x.country||"—")+'</td><td>'+esc(x.device_type||"—")+'</td><td>'+esc(x.source||"—")+'</td><td>'+esc(x.tool_name||"—")+(x.success===1?' <span style="color:var(--green)">成功</span>':(x.success===0?' <span style="color:#e57373">失败</span>':''))+'</td></tr>';}).join("")+'</tbody></table></div>'):'<div class="a-center" style="color:var(--muted);padding:12px">暂无数据</div>';
    host.innerHTML=cards+box("事件排行榜",rk)+box("工具统计",tools)+box("转化事件",cv)+box("事件趋势",trend)+box("最近事件明细(匿名,近100条)",recent)
      +'<div class="a-note-real">时间按UTC+8;不记录完整IP/钱包地址/私钥/助记词/密码/敏感搜索;/adm与机器人不计入。</div>';
  }).catch(function(){if(host)host.innerHTML='<div class="a-panel-box"><div class="a-note-real">事件数据加载失败。</div></div>';});
}
function pEvents(el){
  anEnsureCss();
  var ranges=[["today","今天"],["yesterday","昨天"],["7d","最近7天"],["30d","最近30天"]];
  var cats=[["","全部分类"],["tool","工具"],["content","内容"],["video","视频"],["conversion","转化"],["onchain","链上"],["general","通用"]];
  el.innerHTML='<div class="an-tabs">'+ranges.map(function(x){return '<button class="an-tab'+(x[0]===EV_RANGE?" on":"")+'" data-r="'+x[0]+'">'+x[1]+'</button>';}).join("")
    +'<span class="an-custom"><select id="evCat" class="an-tab">'+cats.map(function(c){return '<option value="'+c[0]+'"'+(EV_F.category===c[0]?" selected":"")+'>'+c[1]+'</option>';}).join("")+'</select>'
    +'<input type="text" id="evName" placeholder="事件名 如 tool_start" value="'+esc(EV_F.event_name||"")+'" style="width:150px"><button class="an-tab" id="evGo">筛选</button></span></div><div id="evBody"></div>';
  el.querySelectorAll(".an-tab[data-r]").forEach(function(b){b.onclick=function(){EV_RANGE=b.getAttribute("data-r");pEvents(el);};});
  var go=el.querySelector("#evGo"); if(go)go.onclick=function(){EV_F.category=el.querySelector("#evCat").value;EV_F.event_name=el.querySelector("#evName").value.trim();pEvents(el);};
  loadEv(el);
}
/* ---------- 订单记录 ---------- */
function ordShort(a){a=String(a||"");return a.length>14?a.slice(0,6)+"…"+a.slice(-4):a;}
function ordRows(list){return (list||[]).slice(0,300).map(function(o){
  var st=o.status==="paid"?'<span style="color:var(--green)">已付</span>':'<span style="color:var(--muted)">待付</span>';
  var tx=o.txHash?'<a href="https://polygonscan.com/tx/'+esc(o.txHash)+'" target="_blank" rel="noopener" style="color:var(--gold-lt)">查</a>':'—';
  var t=o.paidAt||o.created;
  return '<tr><td>'+esc(ordShort(o.addr))+'</td><td>'+esc(o.amount)+'</td><td>'+st+'</td><td>'+(o.payer?esc(ordShort(o.payer)):'—')+'</td><td>'+tx+'</td><td>'+(t?new Date(t).toLocaleString():'—')+'</td></tr>';
}).join("");}
function pOrders(el){el.innerHTML='<div class="a-note-real">加载订单中…</div>';get("/orders").then(function(r){
  var ref=r.referrer||{},wd=r.withdraw||{};
  var refIncome=(ref.orders||[]).filter(function(o){return o.status==="paid";}).reduce(function(s,o){return s+Number(o.amount||0);},0).toFixed(2);
  el.innerHTML=''
    +'<div class="a-cards">'
    +card("🔎","查询推荐人 · 订单",fmtN(ref.count||0),"已付 "+(ref.paid||0)+" · 待付 "+(ref.pending||0),"")
    +card("💰","查询推荐人 · 收入",refIncome+" LGNS","约 2 LGNS/单","ok")
    +card("💸","链上提币 · 订单",fmtN(wd.count||0),"已付 "+(wd.paid||0)+" · 活跃 "+(wd.active||0),"")
    +card("💰","链上提币 · 收入",(wd.income||"0")+" LGNS","约 5 LGNS/单 · 成功"+(wd.wsucc||0)+"/失败"+(wd.wfail||0),"ok")
    +'</div>'
    +'<div class="a-panel-box"><h3>查询推荐人订单（'+(ref.count||0)+'） <span class="a-real">真实</span></h3>'
    +'<table class="a-tbl"><thead><tr><th>查询地址</th><th>金额</th><th>状态</th><th>付款方</th><th>tx</th><th>时间</th></tr></thead><tbody>'
    +(ordRows(ref.orders)||'<tr><td colspan=6 class="a-center">暂无数据</td></tr>')+'</tbody></table></div>'
    +'<div class="a-panel-box"><h3>链上提币订单（'+(wd.count||0)+'） <span class="a-real">真实</span></h3>'
    +'<table class="a-tbl"><thead><tr><th>用户地址</th><th>金额</th><th>状态</th><th>付款方</th><th>tx</th><th>时间</th></tr></thead><tbody>'
    +(ordRows(wd.orders)||'<tr><td colspan=6 class="a-center">暂无数据</td></tr>')+'</tbody></table>'
    +'<div class="a-note-real">收款钱包 0xbd06474d…；金额为精确指纹金额（尾数用于自动对账）。仅读取展示，不涉及任何私钥/助记词。</div></div>';
}).catch(function(){el.innerHTML='<div class="a-note-real">订单加载失败，请刷新重试。</div>';});}
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
