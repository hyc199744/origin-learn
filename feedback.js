/* ═══════════ Web3Origin 留言区 / 社区反馈 ═══════════
   后端 = Cloudflare Worker + KV（/fb）。全部用户内容渲染时转义防 XSS；提交前客户端预检敏感信息。
   匿名提交返回查询码存本地，可查处理状态；管理员输入密钥进入审核后台。 */
(function(){
"use strict";
var W="https://count.web3origin.com";
var FK="origin_fb_v1", PS="https://polygonscan.com";
var CATS=[
  {k:"sug",n:"网站建议",i:"💡"},{k:"fun",n:"功能反馈",i:"🛠️"},{k:"fix",n:"内容纠错",i:"✏️"},
  {k:"clue",n:"链上研究线索",i:"🔎"},{k:"eco",n:"Origin 生态讨论",i:"🌐"},{k:"lgns",n:"LGNS 问题",i:"🪙"},
  {k:"anb",n:"Anubis 问题",i:"⚓"},{k:"sec",n:"钱包安全问题",i:"🛡️"},{k:"other",n:"其他",i:"💬"}];
function catObj(k){for(var i=0;i<CATS.length;i++)if(CATS[i].k===k)return CATS[i];return {k:k,n:k,i:"💬"};}
var STAT={pending:{t:"待审核",c:"#e0a24f"},public:{t:"已公开",c:"#25C96F"},replied:{t:"已回复",c:"#3aa0e0"},resolved:{t:"已解决",c:"#76FF36"},hidden:{t:"已隐藏",c:"#c0503a"},archived:{t:"已归档",c:"#7c6a4f"}};

/* ---------- 本地状态 ---------- */
function db(){try{return JSON.parse(localStorage.getItem(FK))||{};}catch(e){return {};}}
function save(d){try{localStorage.setItem(FK,JSON.stringify(d));}catch(e){}}
function mine(){return db().mine||[];}
function addMine(o){var d=db();d.mine=d.mine||[];d.mine.unshift(o);d.mine=d.mine.slice(0,100);save(d);}
function liked(id){return !!(db().liked||{})[id];}
function setLiked(id){var d=db();d.liked=d.liked||{};d.liked[id]=1;save(d);}
function vid(){var d=db();if(!d.vid){d.vid=Math.random().toString(36).slice(2,10);save(d);}return d.vid;}

/* ---------- 工具 ---------- */
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function nl2(s){return esc(s).replace(/\n/g,"<br>");}
function short(a){return a&&a.length>14?a.slice(0,8)+"…"+a.slice(-6):(a||"");}
function ago(ts){if(!ts)return"";var s=Math.floor((Date.now()-ts)/1000);if(s<60)return"刚刚";if(s<3600)return Math.floor(s/60)+"分钟前";if(s<86400)return Math.floor(s/3600)+"小时前";if(s<2592000)return Math.floor(s/86400)+"天前";return new Date(ts).toLocaleDateString();}
function toast(m,bad){var t=document.getElementById("fbToast");if(!t){t=document.createElement("div");t.id="fbToast";document.body.appendChild(t);}t.textContent=m;t.className="show"+(bad?" bad":"");clearTimeout(t._t);t._t=setTimeout(function(){t.className="";},2600);}
function copy(v){navigator.clipboard&&navigator.clipboard.writeText(v);toast("已复制");}
window.__fbcopy=copy;
/* 客户端敏感信息预检（与服务端一致，提交前拦截） */
function sensitive(t){t=String(t||"");
  if(/助记词|私\s*钥|钱包私钥|keystore|钱包密码|mnemonic|seed\s*phrase|private\s*key/i.test(t))return true;
  if(/(?:\b[a-z]{3,}\b[\s,，]+){11,}\b[a-z]{3,}\b/i.test(t))return true;
  var noTx=t.replace(/0x[0-9a-fA-F]{64}/g," ");
  if(/(?:^|[^0-9a-fA-Fx])[0-9a-fA-F]{64}(?:[^0-9a-fA-F]|$)/.test(noTx))return true;
  return false;}
/* 数学验证码 */
var _cap={};
function newCap(){var a=2+Math.floor(Math.random()*8),b=1+Math.floor(Math.random()*8);_cap={q:a+" + "+b,a:a+b};return _cap;}
function api(path,opt){return fetch(W+path,opt).then(function(r){return r.json();});}

/* ---------- 渲染主体 ---------- */
var _items=[],_cat="all",_sort="new",_q="",_onlyRep=false,_page=1,_total=0;
function nav(){return '<nav class="fb-nav"><a class="fb-brand" href="/"><img src="/assets/logo.png" alt=""><span>起源 · <b>留言区</b></span></a>'
  +'<span class="fb-sp"></span><a href="/#radar">链上雷达</a><a href="/academy/">学习学院</a><a href="/dashboard/">个人中心</a><a href="/">← 主站</a></nav>';}
function render(){
  css();var root=document.getElementById("fbRoot");if(!root)return;
  root.innerHTML=nav()
    +'<div class="fb-wrap">'
    +'<header class="fb-head"><h1>Web3Origin 留言区</h1><p>你的建议、问题和链上研究线索，都会帮助我们把平台做得更好。</p>'
    +'<div class="fb-head-btns"><button class="fb-btn" id="fbNew">✍ 我要留言</button>'
    +'<button class="fb-ghost" id="fbMine">📋 我的留言</button><button class="fb-ghost" id="fbAdminBtn">🔐 管理</button></div></header>'
    +'<div class="fb-safe">🔒 请勿在留言中填写助记词、私钥、钱包密码等敏感信息 · 联系方式仅管理员可见、不会公开</div>'
    +'<div class="fb-tools"><div class="fb-cats" id="fbCats"></div>'
    +'<div class="fb-trow"><input id="fbSearch" placeholder="搜索留言标题 / 内容…">'
    +'<select id="fbSort" class="fb-sel"><option value="new">最新</option><option value="hot">最热</option></select>'
    +'<label class="fb-chk"><input type="checkbox" id="fbRep"> 只看已回复</label></div></div>'
    +'<div id="fbList" class="fb-list"><div class="fb-load">加载中…</div></div>'
    +'<div id="fbPager" class="fb-pager"></div></div>'
    +'<footer class="fb-foot">Web3Origin 留言区 · 内容经审核公开，仅供交流，不构成投资建议 · <a href="/">返回主站</a></footer>';
  // 分类chips
  var cc=document.getElementById("fbCats");
  cc.innerHTML='<button class="fb-cat on" data-c="all">全部</button>'+CATS.map(function(c){return '<button class="fb-cat" data-c="'+c.k+'">'+c.i+' '+c.n+'</button>';}).join("");
  cc.addEventListener("click",function(e){var b=e.target.closest(".fb-cat");if(!b)return;cc.querySelectorAll(".fb-cat").forEach(function(x){x.classList.toggle("on",x===b);});_cat=b.getAttribute("data-c");_page=1;load();});
  document.getElementById("fbNew").onclick=openForm;
  document.getElementById("fbMine").onclick=openMine;
  document.getElementById("fbAdminBtn").onclick=openAdmin;
  var si=document.getElementById("fbSearch");si.addEventListener("input",function(){_q=si.value.trim();clearTimeout(si._t);si._t=setTimeout(function(){_page=1;load();},350);});
  document.getElementById("fbSort").onchange=function(e){_sort=e.target.value;_page=1;load();};
  document.getElementById("fbRep").onchange=function(e){_onlyRep=e.target.checked;_page=1;load();};
  load();
  // URL ?id= 直达详情
  try{var qid=new URLSearchParams(location.search).get("id");if(qid)openDetail(qid);}catch(e){}
}
function load(){
  var el=document.getElementById("fbList");if(el)el.innerHTML='<div class="fb-load">加载中…</div>';
  var qs="?sort="+_sort+"&cat="+_cat+"&page="+_page+(_onlyRep?"&replied=1":"")+(_q?"&q="+encodeURIComponent(_q):"");
  api("/fb"+qs).then(function(d){
    if(!d.ok){el.innerHTML='<div class="fb-empty">加载失败</div>';return;}
    _items=d.items||[];_total=d.total||0;
    if(!_items.length){el.innerHTML='<div class="fb-empty">还没有相关留言，来发第一条吧 →</div>';document.getElementById("fbPager").innerHTML="";return;}
    el.innerHTML=_items.map(card).join("");
    el.querySelectorAll(".fb-card").forEach(function(c){c.onclick=function(){openDetail(c.getAttribute("data-id"));};});
    var pages=Math.ceil(_total/20),pg=document.getElementById("fbPager");
    pg.innerHTML=pages>1?'<button class="fb-pg" '+(_page<=1?"disabled":"")+' data-d="-1">‹ 上一页</button><span>'+_page+' / '+pages+'</span><button class="fb-pg" '+(_page>=pages?"disabled":"")+' data-d="1">下一页 ›</button>':"";
    pg.querySelectorAll(".fb-pg").forEach(function(b){b.onclick=function(){_page+=+b.getAttribute("data-d");load();window.scrollTo(0,0);};});
  }).catch(function(){el.innerHTML='<div class="fb-empty">网络错误，请稍后重试</div>';});
}
function badge(m){var s="";var st=STAT[m.status];if(st&&m.status!=="public")s+='<span class="fb-tag" style="color:'+st.c+';border-color:'+st.c+'55">'+st.t+'</span>';
  if(m.official)s+='<span class="fb-tag" style="color:#3aa0e0;border-color:#3aa0e055">官方已回复</span>';
  if(m.resolved)s+='<span class="fb-tag" style="color:#76FF36;border-color:#76FF3655">已解决</span>';
  if(m.featured)s+='<span class="fb-tag" style="color:#f0d48a;border-color:#f0d48a55">★ 精选</span>';return s;}
function card(m){var c=catObj(m.cat);
  return '<div class="fb-card" data-id="'+esc(m.id)+'"><div class="fb-card-top"><span class="fb-catb">'+c.i+' '+c.n+'</span>'+badge(m)+'<span class="fb-time">'+ago(m.ts)+'</span></div>'
    +'<h3 class="fb-title">'+esc(m.title)+'</h3><p class="fb-ex">'+esc(m.excerpt)+'</p>'
    +'<div class="fb-card-foot"><span class="fb-nick">'+esc(m.nick||"匿名用户")+'</span><span class="fb-metric">👍 '+(m.likes||0)+' · 💬 '+(m.replies||0)+'</span></div></div>';}

/* ---------- 提交表单 ---------- */
function modal(html,cls){var m=document.createElement("div");m.className="fb-modal "+(cls||"");m.innerHTML='<div class="fb-modal-in"><button class="fb-x" aria-label="关闭">✕</button>'+html+'</div>';document.body.appendChild(m);document.body.style.overflow="hidden";
  function close(){m.remove();document.body.style.overflow="";}
  m.querySelector(".fb-x").onclick=close;m.onclick=function(e){if(e.target===m)close();};
  document.addEventListener("keydown",function esc(e){if(e.key==="Escape"){close();document.removeEventListener("keydown",esc);}});
  return {el:m,close:close};}
function openForm(){
  var cap=newCap();
  var web3='<div id="fbWeb3" style="display:none"><div class="fb-fh">链上信息（选填）</div>'
    +'<div class="fb-grid"><label>所属网络<select id="ffChain" class="fb-in"><option value="">选择</option><option>Polygon</option><option>Anubis Chain</option><option>Ethereum</option><option>其他</option></select></label>'
    +'<label>区块高度<input id="ffBlock" class="fb-in" placeholder="如 90626269"></label></div>'
    +'<label>钱包地址<input id="ffWallet" class="fb-in mono" placeholder="0x… (40位)"></label>'
    +'<label>合约地址<input id="ffContract" class="fb-in mono" placeholder="0x… (40位)"></label>'
    +'<label>交易哈希<input id="ffTx" class="fb-in mono" placeholder="0x… (64位)"></label>'
    +'<label>证据来源<input id="ffEvsrc" class="fb-in" placeholder="链接 / 出处（选填）"></label>'
    +'<label>你的说明<textarea id="ffEvnote" class="fb-in" rows="2" placeholder="补充说明（选填）"></textarea></label></div>';
  var h='<h2 class="fb-mh">✍ 提交留言</h2>'
    +'<div class="fb-fh">留言分类 <i>*</i></div><div class="fb-catsel" id="ffCat">'+CATS.map(function(c){return '<button type="button" class="fb-catpick" data-c="'+c.k+'">'+c.i+' '+c.n+'</button>';}).join("")+'</div>'
    +'<div class="fb-grid"><label>昵称（选填）<input id="ffNick" class="fb-in" maxlength="24" placeholder="不填显示“匿名用户”"></label>'
    +'<label>联系方式（选填·仅管理员可见）<input id="ffContact" class="fb-in" maxlength="120" placeholder="邮箱 / Telegram"></label></div>'
    +'<label>标题 <i>*</i><input id="ffTitle" class="fb-in" maxlength="80" placeholder="一句话概括（≤80字）"></label>'
    +'<label>内容 <i>*</i><textarea id="ffContent" class="fb-in" rows="5" maxlength="2000" placeholder="详细说说你的建议、问题或线索（10~2000字）"></textarea><div class="fb-count"><span id="ffCount">0</span>/2000</div></label>'
    +'<label>相关链接（选填）<input id="ffLink" class="fb-in" placeholder="交易/文章/浏览器链接"></label>'
    +web3
    +'<label class="fb-chk2"><input type="checkbox" id="ffPriv"> 仅管理员可见（不公开展示）</label>'
    +'<div class="fb-cap"><span>验证：<b id="ffCapQ">'+cap.q+'</b> = </span><input id="ffCapA" class="fb-in" style="width:80px" inputmode="numeric"><span class="fb-refresh" id="ffCapR">↻</span></div>'
    +'<input type="text" id="ffHp" style="position:absolute;left:-9999px" tabindex="-1" autocomplete="off" aria-hidden="true">'
    +'<div id="ffWarn" class="fb-warn" style="display:none"></div>'
    +'<button class="fb-btn fb-submit" id="ffSubmit">提交留言</button>'
    +'<div class="fb-note">提交即表示同意公开展示（除非勾选仅管理员可见）。含大量外链或研究线索/纠错类会先经人工审核。</div>';
  var mo=modal(h,"fb-form");var el=mo.el;
  var chosen="";
  el.querySelector("#ffCat").addEventListener("click",function(e){var b=e.target.closest(".fb-catpick");if(!b)return;el.querySelectorAll(".fb-catpick").forEach(function(x){x.classList.toggle("on",x===b);});chosen=b.getAttribute("data-c");
    el.querySelector("#fbWeb3").style.display=(chosen==="clue"||chosen==="fix")?"block":"none";});
  var cont=el.querySelector("#ffContent");cont.addEventListener("input",function(){el.querySelector("#ffCount").textContent=cont.value.length;});
  el.querySelector("#ffCapR").onclick=function(){var c=newCap();el.querySelector("#ffCapQ").textContent=c.q;};
  el.querySelector("#ffSubmit").onclick=function(){
    var warn=el.querySelector("#ffWarn");warn.style.display="none";
    function fail(m){warn.textContent=m;warn.style.display="block";warn.scrollIntoView({block:"center"});}
    if(!chosen)return fail("请先选择留言分类");
    var title=el.querySelector("#ffTitle").value.trim(),content=el.querySelector("#ffContent").value.trim();
    if(!title)return fail("请填写标题");
    if(content.length<10)return fail("留言内容至少 10 个字");
    var wallet=el.querySelector("#ffWallet")?el.querySelector("#ffWallet").value.trim():"",contract=el.querySelector("#ffContract")?el.querySelector("#ffContract").value.trim():"",tx=el.querySelector("#ffTx")?el.querySelector("#ffTx").value.trim():"";
    if(wallet&&!/^0x[0-9a-fA-F]{40}$/.test(wallet))return fail("钱包地址格式不对（0x + 40 位）");
    if(contract&&!/^0x[0-9a-fA-F]{40}$/.test(contract))return fail("合约地址格式不对");
    if(tx&&!/^0x[0-9a-fA-F]{64}$/.test(tx))return fail("交易哈希格式不对（0x + 64 位）");
    var evnote=el.querySelector("#ffEvnote")?el.querySelector("#ffEvnote").value:"",link=el.querySelector("#ffLink").value;
    if(sensitive(title+" "+content+" "+evnote+" "+link))return fail("⚠️ 请勿在留言中填写助记词、私钥、钱包密码等敏感信息！");
    var body={cat:chosen,title:title,content:content,nick:el.querySelector("#ffNick").value.trim(),contact:el.querySelector("#ffContact").value.trim(),
      vis:el.querySelector("#ffPriv").checked?"private":"public",link:link.trim(),
      chain:el.querySelector("#ffChain")?el.querySelector("#ffChain").value:"",wallet:wallet,contract:contract,tx:tx,
      block:el.querySelector("#ffBlock")?el.querySelector("#ffBlock").value.trim():"",evsrc:el.querySelector("#ffEvsrc")?el.querySelector("#ffEvsrc").value.trim():"",evnote:evnote.trim(),
      capQ:el.querySelector("#ffCapQ").textContent,capA:el.querySelector("#ffCapA").value,hp:el.querySelector("#ffHp").value};
    var btn=el.querySelector("#ffSubmit");btn.disabled=true;btn.textContent="提交中…";
    api("/fb/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(function(d){
      btn.disabled=false;btn.textContent="提交留言";
      if(!d.ok){fail(d.error==="SENSITIVE"?d.msg:(d.error||"提交失败"));return;}
      addMine({id:d.id,code:d.code,title:title,ts:Date.now(),status:d.status});
      mo.close();
      modal('<div class="fb-done"><div class="fb-done-ic">✅</div><h2>提交成功！</h2>'
        +'<p>'+(d.status==="pending"?"你的留言已提交，正在人工审核，通过后会公开显示。":"你的留言已公开发布。")+'</p>'
        +'<div class="fb-code">查询码：<b>'+esc(d.code)+'</b> <button class="fb-mini" onclick="__fbcopy(\''+esc(d.code)+'\')">复制</button></div>'
        +'<p class="fb-note">凭查询码可在「我的留言」查看处理状态（也已自动记到本设备）。</p>'
        +'<button class="fb-btn" onclick="this.closest(\'.fb-modal\').remove();document.body.style.overflow=\'\';location.reload()">知道了</button></div>','fb-mini-modal');
    }).catch(function(){btn.disabled=false;btn.textContent="提交留言";fail("网络错误，请重试");});
  };
}

/* ---------- 详情 ---------- */
function chainLink(m){return (m.chain==="Anubis Chain")?"https://browser.anubispace.org":PS;}
function addrRow(label,val,type,m){if(!val)return"";var base=chainLink(m);var url=type==="tx"?base+"/tx/"+val:base+"/address/"+val;
  return '<div class="fb-addr"><span class="fb-addr-l">'+label+'</span><a class="mono" href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(short(val))+'</a>'
    +'<button class="fb-mini" onclick="__fbcopy(\''+esc(val)+'\')">复制</button></div>';}
function openDetail(id){
  var code="";mine().forEach(function(o){if(o.id===id)code=o.code;});
  var mo=modal('<div class="fb-load">加载中…</div>',"fb-detail");
  api("/fb/get?id="+encodeURIComponent(id)+(code?"&code="+code:"")).then(function(d){
    if(!d.ok){mo.el.querySelector(".fb-modal-in").innerHTML='<button class="fb-x">✕</button><div class="fb-empty">'+esc(d.error||"加载失败")+'</div>';mo.el.querySelector(".fb-x").onclick=mo.close;return;}
    var m=d.msg,c=catObj(m.cat);
    var w3="";if(m.chain||m.wallet||m.contract||m.tx||m.block||m.evsrc||m.evnote){
      w3='<div class="fb-w3"><div class="fb-fh">链上信息</div>'+(m.chain?'<div class="fb-addr"><span class="fb-addr-l">网络</span>'+esc(m.chain)+'</div>':'')
        +addrRow("钱包",m.wallet,"addr",m)+addrRow("合约",m.contract,"addr",m)+addrRow("交易",m.tx,"tx",m)
        +(m.block?'<div class="fb-addr"><span class="fb-addr-l">区块</span>'+esc(m.block)+'</div>':'')
        +(m.evsrc?'<div class="fb-addr"><span class="fb-addr-l">证据来源</span>'+esc(m.evsrc)+'</div>':'')
        +(m.evnote?'<div class="fb-evnote">'+nl2(m.evnote)+'</div>':'')+'</div>';}
    var off=m.official&&m.official.content?'<div class="fb-official"><div class="fb-off-h">✅ Web3Origin 官方回复'+(m.official.status?' · '+esc({adopt:"已采纳",resolved:"已解决",need:"需补充证据",no:"不予公开"}[m.official.status]||m.official.status):'')+'</div><div class="fb-off-c">'+nl2(m.official.content)+'</div></div>':'';
    var reps=(m.replies||[]).map(function(r){return '<div class="fb-reply'+(r.official?" off":"")+'"><div class="fb-reply-h">'+(r.official?'<span class="fb-off-tag">官方</span>':'')+esc(r.nick||"匿名用户")+' · '+ago(r.ts)+'</div><div class="fb-reply-c">'+nl2(r.content)+'</div></div>';}).join("");
    var lk=liked(m.id);
    var cap=newCap();
    mo.el.querySelector(".fb-modal-in").innerHTML='<button class="fb-x">✕</button>'
      +'<div class="fb-d-top"><span class="fb-catb">'+c.i+' '+c.n+'</span>'+badge(m)+'</div>'
      +'<h2 class="fb-d-title">'+esc(m.title)+'</h2>'
      +'<div class="fb-d-meta">'+esc(m.nick||"匿名用户")+' · '+ago(m.ts)+(m.link?' · <a href="'+esc(m.link)+'" target="_blank" rel="noopener" class="fb-d-link">相关链接 ↗</a>':'')+'</div>'
      +'<div class="fb-d-content">'+nl2(m.content)+'</div>'+w3+off
      +'<div class="fb-d-actions"><button class="fb-act like'+(lk?" on":"")+'" id="fbLikeBtn">👍 <span id="fbLikeN">'+(m.likes||0)+'</span></button>'
      +'<button class="fb-act" id="fbRepBtn">💬 回复（'+(m.replies||0)+'）</button>'
      +'<button class="fb-act" id="fbRepoBtn">⚑ 举报</button></div>'
      +'<div class="fb-replies">'+reps+'</div>'
      +'<div class="fb-replybox" id="fbReplyBox" style="display:none"><textarea id="fbRepC" class="fb-in" rows="3" maxlength="1000" placeholder="写下你的回复…"></textarea>'
      +'<div class="fb-cap"><input id="fbRepNick" class="fb-in" style="max-width:130px" maxlength="24" placeholder="昵称（选填）"><span>验证 <b id="fbRepQ">'+cap.q+'</b>=</span><input id="fbRepCap" class="fb-in" style="width:70px"><button class="fb-btn" id="fbRepSend">发送</button></div></div>';
    var inn=mo.el;inn.querySelector(".fb-x").onclick=mo.close;
    inn.querySelector("#fbLikeBtn").onclick=function(){if(liked(m.id)){toast("你已经赞过了");return;}
      api("/fb/like",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:m.id,vid:vid()})}).then(function(r){if(r.ok){setLiked(m.id);inn.querySelector("#fbLikeN").textContent=r.likes;inn.querySelector("#fbLikeBtn").classList.add("on");}else if(r.liked){setLiked(m.id);toast("你已经赞过了");}else toast(r.error||"失败",1);});};
    inn.querySelector("#fbRepBtn").onclick=function(){var b=inn.querySelector("#fbReplyBox");b.style.display=b.style.display==="none"?"block":"none";};
    inn.querySelector("#fbRepSend").onclick=function(){
      var content=inn.querySelector("#fbRepC").value.trim();if(content.length<2){toast("回复太短",1);return;}
      if(sensitive(content)){toast("请勿填写助记词/私钥等敏感信息",1);return;}
      var body={id:m.id,content:content,nick:inn.querySelector("#fbRepNick").value.trim(),capQ:inn.querySelector("#fbRepQ").textContent,capA:inn.querySelector("#fbRepCap").value};
      api("/fb/reply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(function(r){if(r.ok){toast("回复成功");openDetail(m.id);}else toast(r.error==="SENSITIVE"?r.msg:(r.error||"失败"),1);});};
    inn.querySelector("#fbRepoBtn").onclick=function(){openReport(m.id);};
  }).catch(function(){mo.el.querySelector(".fb-modal-in").innerHTML='<button class="fb-x" onclick="this.closest(\'.fb-modal\').remove();document.body.style.overflow=\'\'">✕</button><div class="fb-empty">网络错误</div>';});
}
function openReport(id){
  var reasons=["垃圾广告","诈骗信息","恶意引流","不实信息","涉及私钥或助记词","人身攻击","其他"];
  var h='<h2 class="fb-mh">⚑ 举报留言</h2><div class="fb-fh">举报原因</div>'+reasons.map(function(r,i){return '<label class="fb-radio"><input type="radio" name="fbrp" value="'+esc(r)+'"'+(i===0?" checked":"")+'> '+r+'</label>';}).join("")
    +'<textarea id="fbRpD" class="fb-in" rows="2" placeholder="补充说明（选填）" style="margin-top:10px"></textarea><button class="fb-btn" id="fbRpSend">提交举报</button>';
  var mo=modal(h,"fb-mini-modal");
  mo.el.querySelector("#fbRpSend").onclick=function(){var reason=(mo.el.querySelector('input[name=fbrp]:checked')||{}).value||"其他";
    api("/fb/report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:id,reason:reason,detail:mo.el.querySelector("#fbRpD").value.trim()})}).then(function(r){mo.close();toast(r.ok?"已提交举报，感谢反馈":"提交失败",!r.ok);});};
}

/* ---------- 我的留言 ---------- */
function openMine(){
  var list=mine();
  var h='<h2 class="fb-mh">📋 我的留言</h2>';
  if(!list.length)h+='<div class="fb-empty">本设备还没有提交过留言。<br>提交后会自动记录在这里，也可用查询码跨设备查询。</div>';
  else h+='<div class="fb-mine-list" id="fbMineList">'+list.map(function(o){return '<div class="fb-mine-row" data-id="'+esc(o.id)+'" data-code="'+esc(o.code)+'"><div class="fb-mine-t">'+esc(o.title)+'</div><div class="fb-mine-s"><span class="s">查询中…</span> · '+ago(o.ts)+'</div></div>';}).join("")+'</div>';
  h+='<div class="fb-fh" style="margin-top:14px">凭查询码查询（跨设备）</div><div class="fb-cap"><input id="fbCodeIn" class="fb-in" placeholder="输入查询码"><button class="fb-ghost" id="fbCodeGo">查询</button></div>';
  var mo=modal(h,"fb-mini-modal");
  mo.el.querySelectorAll(".fb-mine-row").forEach(function(row){
    var id=row.getAttribute("data-id"),code=row.getAttribute("data-code");
    api("/fb/get?id="+encodeURIComponent(id)+"&code="+code).then(function(d){var s=row.querySelector(".s");
      if(d.ok){var st=STAT[d.msg.status]||{t:d.msg.status,c:"#b79c74"};s.textContent=st.t+(d.msg.official?" · 官方已回复":"");s.style.color=st.c;}else s.textContent="已删除或不存在";});
    row.onclick=function(){mo.close();openDetail(id);};
  });
  mo.el.querySelector("#fbCodeGo").onclick=function(){var code=mo.el.querySelector("#fbCodeIn").value.trim();if(!code)return;
    // 查询码对应某条留言：遍历本地找id；若无则提示（查询码是每条留言独立的）
    var hit=null;mine().forEach(function(o){if(o.code===code)hit=o.id;});
    if(hit){mo.close();openDetail(hit);}else toast("本设备没有该查询码对应的留言（查询码为每条留言独立）",1);};
}

/* ---------- 管理后台 ---------- */
function openAdmin(){
  var key=db().admin||"";
  if(!key){var h='<h2 class="fb-mh">🔐 管理后台</h2><p class="fb-note">输入管理密钥进入审核后台。</p><input id="fbAdmK" class="fb-in" type="password" placeholder="管理密钥"><button class="fb-btn" id="fbAdmGo">进入</button>';
    var mo=modal(h,"fb-mini-modal");mo.el.querySelector("#fbAdmGo").onclick=function(){var k=mo.el.querySelector("#fbAdmK").value.trim();
      api("/fb/admin?key="+encodeURIComponent(k)).then(function(d){if(d.ok){var dd=db();dd.admin=k;save(dd);mo.close();adminPanel(d);}else toast("密钥错误",1);});};
    return;}
  api("/fb/admin?key="+encodeURIComponent(key)).then(function(d){if(d.ok)adminPanel(d);else{var dd=db();dd.admin="";save(dd);toast("密钥已失效，请重新登录",1);openAdmin();}});
}
function adminPanel(d){
  var s=d.stats||{};
  var h='<h2 class="fb-mh">🔐 留言审核后台</h2>'
    +'<div class="fb-admin-stats"><span>全部 <b>'+s.total+'</b></span><span>待审 <b style="color:#e0a24f">'+s.pending+'</b></span><span>今日 <b>'+s.today+'</b></span><span>已解决 <b style="color:#76FF36">'+s.resolved+'</b></span><span>举报 <b style="color:#c0503a">'+s.reports+'</b></span></div>'
    +'<div class="fb-admin-list">'+(d.items||[]).map(function(m){var st=STAT[m.status]||{t:m.status,c:"#b79c74"};
      return '<div class="fb-adm-row" data-id="'+esc(m.id)+'"><div class="fb-adm-main"><span class="fb-catb">'+catObj(m.cat).i+'</span> '+esc(m.title)
        +' <span class="fb-tag" style="color:'+st.c+'">'+st.t+'</span>'+(m.reportN?'<span class="fb-tag" style="color:#c0503a">举报'+m.reportN+'</span>':'')+(m.official?'<span class="fb-tag" style="color:#3aa0e0">已回复</span>':'')
        +'<div class="fb-adm-sub">'+esc(m.nick)+' · '+ago(m.ts)+' · 👍'+(m.likes||0)+' 💬'+(m.replies||0)+'</div></div><button class="fb-mini fb-adm-open">处理</button></div>';}).join("")+'</div>';
  var mo=modal(h,"fb-admin");
  mo.el.querySelectorAll(".fb-adm-row").forEach(function(row){row.querySelector(".fb-adm-open").onclick=function(){adminOne(row.getAttribute("data-id"),mo);};});
}
function adminOne(id,parentMo){
  var key=db().admin;
  api("/fb/admin?key="+encodeURIComponent(key)+"&id="+encodeURIComponent(id)).then(function(d){
    var m=d.full;if(!m){toast("加载失败",1);return;}
    var reports=(m.reports||[]).map(function(r){return '<div class="fb-rp">⚑ '+esc(r.reason)+(r.detail?'：'+esc(r.detail):'')+' · '+ago(r.ts)+'</div>';}).join("");
    var h='<h2 class="fb-mh">处理留言</h2><div class="fb-adm-detail"><b>'+esc(m.title)+'</b><div class="fb-adm-sub">'+catObj(m.cat).n+' · '+esc(m.nick)+' · '+ago(m.ts)+'</div>'
      +'<div class="fb-d-content" style="max-height:180px;overflow:auto">'+nl2(m.content)+'</div>'
      +(m.contact?'<div class="fb-adm-contact">联系方式（仅你可见）：'+esc(m.contact)+'</div>':'')
      +(reports?'<div class="fb-adm-reports"><b>举报（'+m.reports.length+'）</b>'+reports+' <button class="fb-mini" id="fbClrRp">清空举报</button></div>':'')
      +'<div class="fb-fh">官方回复</div><textarea id="fbOffC" class="fb-in" rows="3" placeholder="填写官方回复…">'+(m.official?esc(m.official.content):'')+'</textarea>'
      +'<select id="fbOffS" class="fb-sel"><option value="">回复状态</option><option value="adopt">已采纳</option><option value="resolved">已解决</option><option value="need">需补充证据</option><option value="no">不予公开</option></select>'
      +'<button class="fb-btn" id="fbOffSend">发布官方回复</button>'
      +'<div class="fb-fh" style="margin-top:14px">审核操作</div><div class="fb-adm-ops">'
      +'<button class="fb-mini" data-a="status" data-v="public">公开</button><button class="fb-mini" data-a="status" data-v="pending">退回待审</button>'
      +'<button class="fb-mini" data-a="status" data-v="hidden">隐藏</button><button class="fb-mini" data-a="status" data-v="archived">归档</button>'
      +'<button class="fb-mini" data-a="feature" data-v="1">★精选</button><button class="fb-mini" data-a="feature" data-v="0">取消精选</button>'
      +'<button class="fb-mini" data-a="resolve" data-v="1">标记已解决</button>'
      +'<button class="fb-mini fb-danger" data-a="delete">删除</button></div></div>';
    var mo=modal(h,"fb-mini-modal");var el=mo.el;
    function act(payload,done){payload.key=key;payload.id=id;api("/fb/admin?key="+encodeURIComponent(key),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}).then(function(r){if(r.ok){toast("已处理");if(done)done();}else toast(r.error||"失败",1);});}
    el.querySelectorAll(".fb-adm-ops .fb-mini").forEach(function(b){b.onclick=function(){var a=b.getAttribute("data-a");
      if(a==="delete"){if(!confirm("确定删除这条留言？不可恢复"))return;act({action:"delete"},function(){mo.close();parentMo.close();openAdmin();});}
      else act({action:a,status:b.getAttribute("data-v"),val:b.getAttribute("data-v")==="1"},function(){mo.close();parentMo.close();openAdmin();});};});
    el.querySelector("#fbOffSend").onclick=function(){act({action:"official",content:el.querySelector("#fbOffC").value.trim(),ostatus:el.querySelector("#fbOffS").value},function(){mo.close();parentMo.close();openAdmin();});};
    var clr=el.querySelector("#fbClrRp");if(clr)clr.onclick=function(){act({action:"clearReports"},function(){mo.close();parentMo.close();openAdmin();});};
  });
}

/* ---------- 样式 ---------- */
function css(){if(document.getElementById("fbCss"))return;var s=document.createElement("style");s.id="fbCss";
s.textContent=[
":root{--ob:#050303;--gold:#D6A84B;--gold-lt:#f0d48a;--bone:#F1DFC0;--ink:#e8d9be;--soft:#b79c74;--muted:#7c6a4f;--line:#3a2313;--green:#25C96F;--green-lt:#76FF36;--serif:'STZhongsong','Songti SC',Georgia,serif;--sans:'Microsoft YaHei','PingFang SC',system-ui,sans-serif}",
"*{box-sizing:border-box}body{margin:0;background:radial-gradient(1100px 560px at 50% -8%,#0f2318,#050303 60%) fixed,#050303;color:var(--ink);font-family:var(--sans);line-height:1.7}",
"a{color:var(--gold-lt);text-decoration:none}button{font-family:inherit}",
".fb-nav{display:flex;align-items:center;gap:14px;padding:12px 20px;border-bottom:1px solid var(--line);position:sticky;top:0;background:rgba(5,3,3,.92);backdrop-filter:blur(8px);z-index:30}",
".fb-brand{display:flex;align-items:center;gap:9px;color:var(--bone);font-family:var(--serif);font-size:16px}.fb-brand img{width:25px;height:25px}.fb-brand b{color:var(--green)}",
".fb-nav a{font-size:13px;color:var(--soft)}.fb-sp{margin-left:auto}",
".fb-wrap{max-width:860px;margin:0 auto;padding:26px 18px 60px}",
".fb-head{text-align:center;margin-bottom:16px}.fb-head h1{font-family:var(--serif);font-size:clamp(24px,5vw,34px);color:var(--gold-lt);margin:0 0 6px}",
".fb-head p{color:var(--soft);font-size:14px;margin:0 0 16px}",
".fb-head-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}",
".fb-btn{background:linear-gradient(180deg,#2fe07d,#12812f);border:1px solid #35e884;color:#04240c;font-weight:700;font-size:14px;padding:11px 22px;border-radius:10px;cursor:pointer}.fb-btn:hover{filter:brightness(1.06)}",
".fb-ghost{background:#12100c;border:1px solid var(--line);color:var(--gold-lt);font-size:13.5px;padding:11px 18px;border-radius:10px;cursor:pointer}.fb-ghost:hover{border-color:var(--green)}",
".fb-safe{background:rgba(37,201,111,.06);border:1px solid rgba(37,201,111,.25);border-radius:10px;padding:10px 14px;font-size:12px;color:var(--soft);text-align:center;margin-bottom:16px}",
".fb-tools{margin-bottom:14px}.fb-cats{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:11px}",
".fb-cat{background:#12100c;border:1px solid var(--line);border-radius:20px;color:var(--soft);font-size:12.5px;padding:6px 13px;cursor:pointer;white-space:nowrap}.fb-cat.on{background:rgba(37,201,111,.12);border-color:var(--green);color:var(--green-lt)}",
".fb-trow{display:flex;gap:9px;flex-wrap:wrap;align-items:center}",
".fb-trow input#fbSearch{flex:1;min-width:150px;background:#08110c;border:1px solid var(--line);border-radius:9px;color:var(--bone);padding:9px 12px;font:inherit;font-size:13.5px}",
".fb-sel{background:#08110c;border:1px solid var(--line);border-radius:9px;color:var(--bone);padding:9px 11px;font:inherit;font-size:13px}",
".fb-chk,.fb-chk2{font-size:13px;color:var(--soft);display:flex;align-items:center;gap:5px;cursor:pointer}",
".fb-list{display:flex;flex-direction:column;gap:11px;margin-top:6px}",
".fb-card{background:linear-gradient(160deg,#100e0b,#0a0807);border:1px solid var(--line);border-radius:13px;padding:14px 16px;cursor:pointer;transition:.15s}.fb-card:hover{border-color:var(--green);transform:translateY(-1px)}",
".fb-card-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
".fb-catb{font-size:11.5px;color:var(--gold-lt);background:rgba(214,168,75,.1);border-radius:5px;padding:2px 8px;white-space:nowrap}",
".fb-tag{font-size:10.5px;border:1px solid;border-radius:4px;padding:1px 6px}",
".fb-time{margin-left:auto;color:var(--muted);font-size:11.5px;white-space:nowrap}",
".fb-title{font-size:15.5px;color:var(--bone);margin:9px 0 5px;font-weight:600}",
".fb-ex{font-size:13px;color:var(--muted);margin:0;line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
".fb-card-foot{display:flex;justify-content:space-between;margin-top:10px;font-size:12px}.fb-nick{color:var(--soft)}.fb-metric{color:var(--muted)}",
".fb-load,.fb-empty{text-align:center;color:var(--muted);padding:34px 16px;font-size:13.5px}",
".fb-pager{display:flex;justify-content:center;align-items:center;gap:14px;margin-top:20px;color:var(--muted);font-size:13px}.fb-pg{background:#12100c;border:1px solid var(--line);border-radius:8px;color:var(--gold-lt);padding:7px 14px;cursor:pointer}.fb-pg:disabled{opacity:.4}",
".fb-foot{border-top:1px solid var(--line);text-align:center;padding:20px;color:var(--muted);font-size:12.5px}",
/* modal */
".fb-modal{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(3px);z-index:200;display:grid;place-items:start center;overflow-y:auto;padding:24px 14px}",
".fb-modal-in{background:#0c0a08;border:1px solid var(--line);border-radius:15px;max-width:640px;width:100%;padding:22px;position:relative;margin:auto}",
".fb-mini-modal .fb-modal-in{max-width:460px}",
".fb-x{position:absolute;top:12px;right:14px;background:none;border:none;color:var(--soft);font-size:19px;cursor:pointer;z-index:2}.fb-x:hover{color:var(--bone)}",
".fb-mh{font-family:var(--serif);color:var(--gold-lt);font-size:20px;margin:0 0 14px}",
".fb-fh{font-size:12.5px;color:var(--gold-lt);margin:14px 0 8px;font-weight:700}.fb-fh i{color:#e56a54;font-style:normal}",
".fb-form label{display:block;font-size:12.5px;color:var(--soft);margin-bottom:11px}.fb-form label i{color:#e56a54;font-style:normal}",
".fb-in{width:100%;background:#08110c;border:1px solid var(--line);border-radius:9px;color:var(--bone);padding:9px 11px;font:inherit;font-size:13.5px;margin-top:4px}.fb-in:focus{outline:none;border-color:var(--green)}",
".fb-in.mono{font-family:ui-monospace,monospace;font-size:12.5px}",
".fb-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}",
".fb-catsel{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:6px}",
".fb-catpick{background:#12100c;border:1px solid var(--line);border-radius:8px;color:var(--soft);font-size:12.5px;padding:7px 11px;cursor:pointer}.fb-catpick.on{background:rgba(37,201,111,.14);border-color:var(--green);color:var(--green-lt)}",
".fb-count{text-align:right;font-size:11px;color:var(--muted);margin-top:2px}",
".fb-chk2{margin:10px 0}",
".fb-cap{display:flex;align-items:center;gap:8px;margin:12px 0;font-size:13.5px;color:var(--soft);flex-wrap:wrap}.fb-cap b{color:var(--gold-lt)}.fb-refresh{cursor:pointer;color:var(--gold-lt)}",
".fb-warn{background:rgba(229,106,84,.1);border:1px solid rgba(229,106,84,.4);border-radius:9px;padding:10px 13px;font-size:13px;color:#f0a58f;margin:10px 0}",
".fb-submit{width:100%;margin-top:6px}",
".fb-note{font-size:11px;color:var(--muted);margin-top:10px;line-height:1.7}",
".fb-done{text-align:center}.fb-done-ic{font-size:44px}.fb-done h2{color:var(--gold-lt);font-family:var(--serif)}.fb-done p{color:var(--soft);font-size:14px}",
".fb-code{background:#12100c;border:1px solid var(--line);border-radius:9px;padding:10px;margin:12px 0;font-size:14px}.fb-code b{color:var(--green-lt);font-family:ui-monospace,monospace}",
".fb-mini{background:#12100c;border:1px solid var(--line);border-radius:6px;color:var(--gold-lt);font-size:12px;padding:4px 10px;cursor:pointer}.fb-mini:hover{border-color:var(--green)}.fb-danger{color:#e56a54;border-color:#5a2318}",
/* detail */
".fb-d-top{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-right:30px}",
".fb-d-title{font-family:var(--serif);color:var(--bone);font-size:20px;margin:12px 0 6px}",
".fb-d-meta{color:var(--muted);font-size:12.5px;margin-bottom:14px}.fb-d-link{color:var(--gold-lt)}",
".fb-d-content{color:var(--ink);font-size:14.5px;line-height:1.85;word-break:break-word}",
".fb-w3{background:#0d1712;border:1px solid var(--line);border-radius:11px;padding:12px 14px;margin:16px 0}",
".fb-addr{display:flex;align-items:center;gap:9px;font-size:13px;padding:4px 0;flex-wrap:wrap}.fb-addr-l{color:var(--muted);min-width:56px}.fb-addr .mono{font-family:ui-monospace,monospace;font-size:12px;color:var(--soft)}",
".fb-evnote{color:var(--soft);font-size:13px;margin-top:8px;line-height:1.7}",
".fb-official{background:rgba(58,160,224,.07);border:1px solid rgba(58,160,224,.3);border-radius:11px;padding:13px 15px;margin:16px 0}.fb-off-h{color:#5cb3ea;font-weight:700;font-size:13.5px;margin-bottom:7px}.fb-off-c{color:var(--ink);font-size:14px;line-height:1.8}",
".fb-d-actions{display:flex;gap:10px;margin:18px 0 8px;flex-wrap:wrap}",
".fb-act{background:#12100c;border:1px solid var(--line);border-radius:9px;color:var(--soft);font-size:13px;padding:8px 15px;cursor:pointer}.fb-act:hover{border-color:var(--green)}.fb-act.like.on{color:var(--green-lt);border-color:var(--green)}",
".fb-replies{margin-top:8px}",
".fb-reply{border-top:1px solid rgba(58,35,19,.5);padding:11px 2px}.fb-reply.off{background:rgba(58,160,224,.05);border-radius:8px;padding:11px}",
".fb-reply-h{font-size:12px;color:var(--muted);margin-bottom:5px}.fb-off-tag{color:#5cb3ea;border:1px solid #5cb3ea55;border-radius:4px;padding:0 6px;margin-right:6px;font-size:11px}",
".fb-reply-c{color:var(--ink);font-size:13.5px;line-height:1.7;word-break:break-word}",
".fb-replybox{margin-top:14px;border-top:1px solid var(--line);padding-top:12px}",
".fb-radio{display:block;font-size:13.5px;color:var(--ink);padding:6px 0;cursor:pointer}",
".fb-mine-row{background:#100e0b;border:1px solid var(--line);border-radius:9px;padding:11px 13px;margin-bottom:8px;cursor:pointer}.fb-mine-row:hover{border-color:var(--green)}.fb-mine-t{color:var(--bone);font-size:14px}.fb-mine-s{font-size:11.5px;color:var(--muted);margin-top:3px}",
".fb-admin .fb-modal-in{max-width:760px}",
".fb-admin-stats{display:flex;gap:16px;flex-wrap:wrap;background:#100e0b;border:1px solid var(--line);border-radius:10px;padding:11px 15px;font-size:13px;color:var(--soft);margin-bottom:14px}.fb-admin-stats b{color:var(--bone)}",
".fb-adm-row{display:flex;align-items:center;gap:10px;background:#100e0b;border:1px solid var(--line);border-radius:9px;padding:10px 12px;margin-bottom:7px}.fb-adm-main{flex:1;min-width:0;font-size:13.5px;color:var(--ink)}.fb-adm-sub{font-size:11.5px;color:var(--muted);margin-top:3px}",
".fb-adm-contact{background:rgba(214,168,75,.08);border-radius:7px;padding:7px 10px;font-size:12.5px;color:var(--gold-lt);margin:10px 0}",
".fb-adm-reports{background:rgba(192,80,58,.07);border:1px solid rgba(192,80,58,.25);border-radius:9px;padding:9px 12px;margin:12px 0;font-size:12.5px;color:var(--soft)}.fb-rp{padding:3px 0}",
".fb-adm-ops{display:flex;gap:7px;flex-wrap:wrap}",
"#fbToast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%) translateY(20px);background:#12100c;border:1px solid var(--green);color:var(--bone);padding:10px 20px;border-radius:24px;font-size:13px;z-index:400;opacity:0;transition:.25s;pointer-events:none;max-width:90vw;text-align:center}#fbToast.show{opacity:1;transform:translateX(-50%) translateY(0)}#fbToast.bad{border-color:#c0503a}",
"@media(max-width:560px){.fb-grid{grid-template-columns:1fr}.fb-head-btns{flex-direction:column}.fb-btn,.fb-ghost{width:100%}.fb-cats{overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px}.fb-modal{padding:12px 8px}.fb-modal-in{padding:18px 15px}}"
].join("\n");
document.head.appendChild(s);}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",render);else render();
})();
