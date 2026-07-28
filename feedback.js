/* ═══════════ Web3Origin 留言区 / 社区反馈 ═══════════
   后端 = Cloudflare Worker + KV（/fb）。全部用户内容渲染时转义防 XSS；提交前客户端预检敏感信息。
   匿名提交返回查询码存本地，可查处理状态；管理员输入密钥进入审核后台。 */
(function(){
"use strict";
var W="https://count.web3origin.com";
var FK="origin_fb_v1", PS="https://polygonscan.com";
/* ---------- i18n（读 web3origin_locale，仿 academy-app.js） ---------- */
try{var _lc=localStorage.getItem("web3origin_locale")||"";if(_lc){window.SITE_LANG=(_lc==="zh-CN")?"zh":_lc;document.documentElement.lang=_lc;if(_lc==="ar")document.documentElement.dir="rtl";}}catch(e){}
function EN(){return (window.SITE_LANG||"zh")!=="zh";}
var T={zh:{
  cat_sug:"网站建议",cat_fun:"功能反馈",cat_fix:"内容纠错",cat_clue:"链上研究线索",cat_eco:"Origin 生态讨论",
  cat_lgns:"LGNS 问题",cat_anb:"Anubis 问题",cat_sec:"钱包安全问题",cat_other:"其他",
  st_pending:"待审核",st_public:"已公开",st_replied:"已回复",st_resolved:"已解决",st_hidden:"已隐藏",st_archived:"已归档",
  ago_now:"刚刚",ago_min:"分钟前",ago_hr:"小时前",ago_day:"天前",copied:"已复制",
  nav_brand:"起源 · ",nav_board:"留言区",nav_radar:"链上雷达",nav_academy:"学习学院",nav_dash:"个人中心",nav_home:"← 主站",
  head_title:"Web3Origin 留言区",head_sub:"你的建议、问题和链上研究线索，都会帮助我们把平台做得更好。",
  btn_new:"✍ 我要留言",btn_mine:"📋 我的留言",btn_admin:"🔐 管理",
  safe_note:"🔒 请勿在留言中填写助记词、私钥、钱包密码等敏感信息 · 联系方式仅管理员可见、不会公开",
  search_ph:"搜索留言标题 / 内容…",sort_new:"最新",sort_hot:"最热",only_rep:"只看已回复",loading:"加载中…",
  foot:"Web3Origin 留言区 · 内容经审核公开，仅供交流，不构成投资建议 · ",back_home:"返回主站",
  all:"全部",load_fail:"加载失败",empty_list:"还没有相关留言，来发第一条吧 →",
  prev_page:"‹ 上一页",next_page:"下一页 ›",net_retry:"网络错误，请稍后重试",
  official_replied:"官方已回复",resolved:"已解决",featured:"★ 精选",anon:"匿名用户",close:"关闭",
  w3_head_opt:"链上信息（选填）",f_chain:"所属网络",f_select:"选择",f_block:"区块高度",ph_block:"如 90626269",
  f_wallet:"钱包地址",ph_addr40:"0x… (40位)",f_contract:"合约地址",f_tx:"交易哈希",ph_tx64:"0x… (64位)",
  f_evsrc:"证据来源",ph_evsrc:"链接 / 出处（选填）",f_evnote:"你的说明",ph_evnote:"补充说明（选填）",
  form_title:"✍ 提交留言",f_cat:"留言分类",f_nick:"昵称（选填）",ph_nick:'不填显示“匿名用户”',
  f_contact:"联系方式（选填·仅管理员可见）",ph_contact:"邮箱 / Telegram",f_title:"标题",ph_title:"一句话概括（≤80字）",
  f_content:"内容",ph_content:"详细说说你的建议、问题或线索（10~2000字）",f_link:"相关链接（选填）",ph_link:"交易/文章/浏览器链接",
  priv_check:"仅管理员可见（不公开展示）",verify:"验证：",submit:"提交留言",
  form_note:"提交即表示同意公开展示（除非勾选仅管理员可见）。含大量外链或研究线索/纠错类会先经人工审核。",
  err_cat:"请先选择留言分类",err_title:"请填写标题",err_content_min:"留言内容至少 10 个字",
  err_wallet:"钱包地址格式不对（0x + 40 位）",err_contract:"合约地址格式不对",err_tx:"交易哈希格式不对（0x + 64 位）",
  err_sensitive:"⚠️ 请勿在留言中填写助记词、私钥、钱包密码等敏感信息！",submitting:"提交中…",submit_fail:"提交失败",
  done_title:"提交成功！",done_pending:"你的留言已提交，正在人工审核，通过后会公开显示。",done_public:"你的留言已公开发布。",
  code_label:"查询码：",copy:"复制",done_note:"凭查询码可在「我的留言」查看处理状态（也已自动记到本设备）。",got_it:"知道了",net_retry2:"网络错误，请重试",
  w3_head:"链上信息",f_network:"网络",lbl_wallet:"钱包",lbl_contract:"合约",lbl_tx:"交易",lbl_block:"区块",
  off_head:"✅ Web3Origin 官方回复",ost_adopt:"已采纳",ost_need:"需补充证据",ost_no:"不予公开",link_arrow:"相关链接 ↗",
  reply:"回复",report_btn:"⚑ 举报",ph_reply:"写下你的回复…",verify_sp:"验证 ",send:"发送",
  already_liked:"你已经赞过了",fail:"失败",reply_short:"回复太短",reply_sensitive:"请勿填写助记词/私钥等敏感信息",reply_ok:"回复成功",
  rp_spam:"垃圾广告",rp_scam:"诈骗信息",rp_lure:"恶意引流",rp_false:"不实信息",rp_key:"涉及私钥或助记词",rp_attack:"人身攻击",
  report_title:"⚑ 举报留言",report_reason:"举报原因",report_submit:"提交举报",report_done:"已提交举报，感谢反馈",
  mine_empty:"本设备还没有提交过留言。",mine_empty2:"提交后会自动记录在这里，也可用查询码跨设备查询。",querying:"查询中…",
  code_query_head:"凭查询码查询（跨设备）",ph_code:"输入查询码",query_btn:"查询",deleted_or_none:"已删除或不存在",
  no_code_local:"本设备没有该查询码对应的留言（查询码为每条留言独立）",
  admin_login_title:"🔐 管理后台",admin_login_note:"输入管理密钥进入审核后台。",ph_admin_key:"管理密钥",admin_enter:"进入",
  key_wrong:"密钥错误",key_expired:"密钥已失效，请重新登录",admin_title:"🔐 留言审核后台",
  st_pend_lbl:"待审",st_today:"今日",report_word:"举报",adm_handle:"处理",adm_handle_title:"处理留言",
  adm_contact:"联系方式（仅你可见）：",clear_reports:"清空举报",off_reply_head:"官方回复",ph_off_reply:"填写官方回复…",reply_status:"回复状态",
  publish_off:"发布官方回复",review_ops:"审核操作",op_public:"公开",op_pending:"退回待审",op_hidden:"隐藏",op_archived:"归档",
  op_feature:"★精选",op_unfeature:"取消精选",op_resolve:"标记已解决",op_delete:"删除",done_toast:"已处理",confirm_delete:"确定删除这条留言？不可恢复"},
  en:{
  cat_sug:"Site Suggestion",cat_fun:"Feature Feedback",cat_fix:"Content Correction",cat_clue:"On-chain Research Lead",cat_eco:"ORIGIN Ecosystem",
  cat_lgns:"LGNS Issues",cat_anb:"Anubis Issues",cat_sec:"Wallet Security",cat_other:"Other",
  st_pending:"Pending",st_public:"Public",st_replied:"Replied",st_resolved:"Resolved",st_hidden:"Hidden",st_archived:"Archived",
  ago_now:"just now",ago_min:" min ago",ago_hr:" h ago",ago_day:" d ago",copied:"Copied",
  nav_brand:"ORIGIN · ",nav_board:"Message Board",nav_radar:"On-chain Radar",nav_academy:"Academy",nav_dash:"Dashboard",nav_home:"← Main Site",
  head_title:"Web3Origin Message Board",head_sub:"Your suggestions, questions and on-chain research leads all help us make the platform better.",
  btn_new:"✍ Post a Message",btn_mine:"📋 My Messages",btn_admin:"🔐 Admin",
  safe_note:"🔒 Never enter your seed phrase, private key or wallet password · Contact info is visible only to admins and never made public",
  search_ph:"Search title / content…",sort_new:"Newest",sort_hot:"Hottest",only_rep:"Replied only",loading:"Loading…",
  foot:"Web3Origin Message Board · Content is public after review, for discussion only, not investment advice · ",back_home:"Back to Main Site",
  all:"All",load_fail:"Load failed",empty_list:"No messages yet — be the first to post →",
  prev_page:"‹ Prev",next_page:"Next ›",net_retry:"Network error, please try again later",
  official_replied:"Official Reply",resolved:"Resolved",featured:"★ Featured",anon:"Anonymous",close:"Close",
  w3_head_opt:"On-chain Info (optional)",f_chain:"Network",f_select:"Select",f_block:"Block Height",ph_block:"e.g. 90626269",
  f_wallet:"Wallet Address",ph_addr40:"0x… (40 chars)",f_contract:"Contract Address",f_tx:"Tx Hash",ph_tx64:"0x… (64 chars)",
  f_evsrc:"Evidence Source",ph_evsrc:"Link / source (optional)",f_evnote:"Your Note",ph_evnote:"Additional note (optional)",
  form_title:"✍ Submit Message",f_cat:"Category",f_nick:"Nickname (optional)",ph_nick:'Defaults to "Anonymous"',
  f_contact:"Contact (optional · admin only)",ph_contact:"Email / Telegram",f_title:"Title",ph_title:"One-line summary (≤80 chars)",
  f_content:"Content",ph_content:"Describe your suggestion, question or lead (10–2000 chars)",f_link:"Related Link (optional)",ph_link:"Tx / article / explorer link",
  priv_check:"Admin only (not shown publicly)",verify:"Verify: ",submit:"Submit",
  form_note:"Submitting means you agree to public display (unless marked admin-only). Posts with many external links or of the research-lead / correction type are reviewed first.",
  err_cat:"Please select a category first",err_title:"Please enter a title",err_content_min:"Message must be at least 10 characters",
  err_wallet:"Invalid wallet address (0x + 40 chars)",err_contract:"Invalid contract address",err_tx:"Invalid tx hash (0x + 64 chars)",
  err_sensitive:"⚠️ Never enter your seed phrase, private key or wallet password!",submitting:"Submitting…",submit_fail:"Submit failed",
  done_title:"Submitted!",done_pending:"Your message has been submitted and is under review; it will appear publicly once approved.",done_public:"Your message has been published.",
  code_label:"Query code: ",copy:"Copy",done_note:'Use the query code under "My Messages" to check status (also saved on this device automatically).',got_it:"Got it",net_retry2:"Network error, please retry",
  w3_head:"On-chain Info",f_network:"Network",lbl_wallet:"Wallet",lbl_contract:"Contract",lbl_tx:"Tx",lbl_block:"Block",
  off_head:"✅ Web3Origin Official Reply",ost_adopt:"Adopted",ost_need:"Needs more evidence",ost_no:"Not published",link_arrow:"Related link ↗",
  reply:"Reply",report_btn:"⚑ Report",ph_reply:"Write your reply…",verify_sp:"Verify ",send:"Send",
  already_liked:"You already liked this",fail:"Failed",reply_short:"Reply too short",reply_sensitive:"Don't include seed phrase / private key info",reply_ok:"Reply sent",
  rp_spam:"Spam",rp_scam:"Scam",rp_lure:"Malicious solicitation",rp_false:"False information",rp_key:"Contains private key or seed phrase",rp_attack:"Personal attack",
  report_title:"⚑ Report Message",report_reason:"Report reason",report_submit:"Submit report",report_done:"Report submitted, thanks",
  mine_empty:"No messages submitted from this device yet.",mine_empty2:"Submissions are auto-recorded here; use the query code to check from other devices.",querying:"Checking…",
  code_query_head:"Query by code (cross-device)",ph_code:"Enter query code",query_btn:"Query",deleted_or_none:"Deleted or not found",
  no_code_local:"No message on this device matches that code (each message has its own code)",
  admin_login_title:"🔐 Admin Panel",admin_login_note:"Enter admin key to access the review panel.",ph_admin_key:"Admin key",admin_enter:"Enter",
  key_wrong:"Wrong key",key_expired:"Key expired, please log in again",admin_title:"🔐 Message Review Panel",
  st_pend_lbl:"Pending",st_today:"Today",report_word:"Reports",adm_handle:"Handle",adm_handle_title:"Handle Message",
  adm_contact:"Contact (visible to you only): ",clear_reports:"Clear reports",off_reply_head:"Official Reply",ph_off_reply:"Enter official reply…",reply_status:"Reply status",
  publish_off:"Publish official reply",review_ops:"Review actions",op_public:"Publish",op_pending:"Back to pending",op_hidden:"Hide",op_archived:"Archive",
  op_feature:"★ Feature",op_unfeature:"Unfeature",op_resolve:"Mark resolved",op_delete:"Delete",done_toast:"Done",confirm_delete:"Delete this message? This cannot be undone"}};
function t(k){return (EN()?T.en:T.zh)[k]||T.zh[k];}
var CATS=[
  {k:"sug",n:t("cat_sug"),i:"💡"},{k:"fun",n:t("cat_fun"),i:"🛠️"},{k:"fix",n:t("cat_fix"),i:"✏️"},
  {k:"clue",n:t("cat_clue"),i:"🔎"},{k:"eco",n:t("cat_eco"),i:"🌐"},{k:"lgns",n:t("cat_lgns"),i:"🪙"},
  {k:"anb",n:t("cat_anb"),i:"⚓"},{k:"sec",n:t("cat_sec"),i:"🛡️"},{k:"other",n:t("cat_other"),i:"💬"}];
function catObj(k){for(var i=0;i<CATS.length;i++)if(CATS[i].k===k)return CATS[i];return {k:k,n:k,i:"💬"};}
var STAT={pending:{t:t("st_pending"),c:"#e0a24f"},public:{t:t("st_public"),c:"#25C96F"},replied:{t:t("st_replied"),c:"#3aa0e0"},resolved:{t:t("st_resolved"),c:"#76FF36"},hidden:{t:t("st_hidden"),c:"#c0503a"},archived:{t:t("st_archived"),c:"#7c6a4f"}};

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
function ago(ts){if(!ts)return"";var s=Math.floor((Date.now()-ts)/1000);if(s<60)return t("ago_now");if(s<3600)return Math.floor(s/60)+t("ago_min");if(s<86400)return Math.floor(s/3600)+t("ago_hr");if(s<2592000)return Math.floor(s/86400)+t("ago_day");return new Date(ts).toLocaleDateString();}
function toast(m,bad){var t2=document.getElementById("fbToast");if(!t2){t2=document.createElement("div");t2.id="fbToast";document.body.appendChild(t2);}t2.textContent=m;t2.className="show"+(bad?" bad":"");clearTimeout(t2._t);t2._t=setTimeout(function(){t2.className="";},2600);}
function copy(v){navigator.clipboard&&navigator.clipboard.writeText(v);toast(t("copied"));}
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
function nav(){return '<nav class="fb-nav"><a class="fb-brand" href="/"><img src="/assets/logo.png" alt=""><span>'+t("nav_brand")+'<b>'+t("nav_board")+'</b></span></a>'
  +'<span class="fb-sp"></span><a href="/#radar">'+t("nav_radar")+'</a><a href="/academy/">'+t("nav_academy")+'</a><a href="/dashboard/">'+t("nav_dash")+'</a><a href="/">'+t("nav_home")+'</a></nav>';}
function render(){
  css();var root=document.getElementById("fbRoot");if(!root)return;
  root.innerHTML=nav()
    +'<div class="fb-wrap">'
    +'<header class="fb-head"><h1>'+t("head_title")+'</h1><p>'+t("head_sub")+'</p>'
    +'<div class="fb-head-btns"><button class="fb-btn" id="fbNew">'+t("btn_new")+'</button>'
    +'<button class="fb-ghost" id="fbMine">'+t("btn_mine")+'</button><button class="fb-ghost" id="fbAdminBtn">'+t("btn_admin")+'</button></div></header>'
    +'<div class="fb-safe">'+t("safe_note")+'</div>'
    +'<div class="fb-tools"><div class="fb-cats" id="fbCats"></div>'
    +'<div class="fb-trow"><input id="fbSearch" placeholder="'+t("search_ph")+'">'
    +'<select id="fbSort" class="fb-sel"><option value="new">'+t("sort_new")+'</option><option value="hot">'+t("sort_hot")+'</option></select>'
    +'<label class="fb-chk"><input type="checkbox" id="fbRep"> '+t("only_rep")+'</label></div></div>'
    +'<div id="fbList" class="fb-list"><div class="fb-load">'+t("loading")+'</div></div>'
    +'<div id="fbPager" class="fb-pager"></div></div>'
    +'<footer class="fb-foot">'+t("foot")+'<a href="/">'+t("back_home")+'</a></footer>';
  // 分类chips
  var cc=document.getElementById("fbCats");
  cc.innerHTML='<button class="fb-cat on" data-c="all">'+t("all")+'</button>'+CATS.map(function(c){return '<button class="fb-cat" data-c="'+c.k+'">'+c.i+' '+c.n+'</button>';}).join("");
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
  var el=document.getElementById("fbList");if(el)el.innerHTML='<div class="fb-load">'+t("loading")+'</div>';
  var qs="?sort="+_sort+"&cat="+_cat+"&page="+_page+(_onlyRep?"&replied=1":"")+(_q?"&q="+encodeURIComponent(_q):"");
  api("/fb"+qs).then(function(d){
    if(!d.ok){el.innerHTML='<div class="fb-empty">'+t("load_fail")+'</div>';return;}
    _items=d.items||[];_total=d.total||0;
    if(!_items.length){el.innerHTML='<div class="fb-empty">'+t("empty_list")+'</div>';document.getElementById("fbPager").innerHTML="";return;}
    el.innerHTML=_items.map(card).join("");
    el.querySelectorAll(".fb-card").forEach(function(c){c.onclick=function(){openDetail(c.getAttribute("data-id"));};});
    var pages=Math.ceil(_total/20),pg=document.getElementById("fbPager");
    pg.innerHTML=pages>1?'<button class="fb-pg" '+(_page<=1?"disabled":"")+' data-d="-1">'+t("prev_page")+'</button><span>'+_page+' / '+pages+'</span><button class="fb-pg" '+(_page>=pages?"disabled":"")+' data-d="1">'+t("next_page")+'</button>':"";
    pg.querySelectorAll(".fb-pg").forEach(function(b){b.onclick=function(){_page+=+b.getAttribute("data-d");load();window.scrollTo(0,0);};});
  }).catch(function(){el.innerHTML='<div class="fb-empty">'+t("net_retry")+'</div>';});
}
function badge(m){var s="";var st=STAT[m.status];if(st&&m.status!=="public")s+='<span class="fb-tag" style="color:'+st.c+';border-color:'+st.c+'55">'+st.t+'</span>';
  if(m.official)s+='<span class="fb-tag" style="color:#3aa0e0;border-color:#3aa0e055">'+t("official_replied")+'</span>';
  if(m.resolved)s+='<span class="fb-tag" style="color:#76FF36;border-color:#76FF3655">'+t("resolved")+'</span>';
  if(m.featured)s+='<span class="fb-tag" style="color:#f0d48a;border-color:#f0d48a55">'+t("featured")+'</span>';return s;}
function card(m){var c=catObj(m.cat);
  return '<div class="fb-card" data-id="'+esc(m.id)+'"><div class="fb-card-top"><span class="fb-catb">'+c.i+' '+c.n+'</span>'+badge(m)+'<span class="fb-time">'+ago(m.ts)+'</span></div>'
    +'<h3 class="fb-title">'+esc(m.title)+'</h3><p class="fb-ex">'+esc(m.excerpt)+'</p>'
    +'<div class="fb-card-foot"><span class="fb-nick">'+esc(m.nick||t("anon"))+'</span><span class="fb-metric">👍 '+(m.likes||0)+' · 💬 '+(m.replies||0)+'</span></div></div>';}

/* ---------- 提交表单 ---------- */
function modal(html,cls){var m=document.createElement("div");m.className="fb-modal "+(cls||"");m.innerHTML='<div class="fb-modal-in"><button class="fb-x" aria-label="'+t("close")+'">✕</button>'+html+'</div>';document.body.appendChild(m);document.body.style.overflow="hidden";
  function close(){m.remove();document.body.style.overflow="";}
  m.querySelector(".fb-x").onclick=close;m.onclick=function(e){if(e.target===m)close();};
  document.addEventListener("keydown",function esc(e){if(e.key==="Escape"){close();document.removeEventListener("keydown",esc);}});
  return {el:m,close:close};}
function openForm(){
  var cap=newCap();
  var web3='<div id="fbWeb3" style="display:none"><div class="fb-fh">'+t("w3_head_opt")+'</div>'
    +'<div class="fb-grid"><label>'+t("f_chain")+'<select id="ffChain" class="fb-in"><option value="">'+t("f_select")+'</option><option>Polygon</option><option>Anubis Chain</option><option>Ethereum</option><option>'+t("cat_other")+'</option></select></label>'
    +'<label>'+t("f_block")+'<input id="ffBlock" class="fb-in" placeholder="'+t("ph_block")+'"></label></div>'
    +'<label>'+t("f_wallet")+'<input id="ffWallet" class="fb-in mono" placeholder="'+t("ph_addr40")+'"></label>'
    +'<label>'+t("f_contract")+'<input id="ffContract" class="fb-in mono" placeholder="'+t("ph_addr40")+'"></label>'
    +'<label>'+t("f_tx")+'<input id="ffTx" class="fb-in mono" placeholder="'+t("ph_tx64")+'"></label>'
    +'<label>'+t("f_evsrc")+'<input id="ffEvsrc" class="fb-in" placeholder="'+t("ph_evsrc")+'"></label>'
    +'<label>'+t("f_evnote")+'<textarea id="ffEvnote" class="fb-in" rows="2" placeholder="'+t("ph_evnote")+'"></textarea></label></div>';
  var h='<h2 class="fb-mh">'+t("form_title")+'</h2>'
    +'<div class="fb-fh">'+t("f_cat")+' <i>*</i></div><div class="fb-catsel" id="ffCat">'+CATS.map(function(c){return '<button type="button" class="fb-catpick" data-c="'+c.k+'">'+c.i+' '+c.n+'</button>';}).join("")+'</div>'
    +'<div class="fb-grid"><label>'+t("f_nick")+'<input id="ffNick" class="fb-in" maxlength="24" placeholder="'+t("ph_nick")+'"></label>'
    +'<label>'+t("f_contact")+'<input id="ffContact" class="fb-in" maxlength="120" placeholder="'+t("ph_contact")+'"></label></div>'
    +'<label>'+t("f_title")+' <i>*</i><input id="ffTitle" class="fb-in" maxlength="80" placeholder="'+t("ph_title")+'"></label>'
    +'<label>'+t("f_content")+' <i>*</i><textarea id="ffContent" class="fb-in" rows="5" maxlength="2000" placeholder="'+t("ph_content")+'"></textarea><div class="fb-count"><span id="ffCount">0</span>/2000</div></label>'
    +'<label>'+t("f_link")+'<input id="ffLink" class="fb-in" placeholder="'+t("ph_link")+'"></label>'
    +web3
    +'<label class="fb-chk2"><input type="checkbox" id="ffPriv"> '+t("priv_check")+'</label>'
    +'<div class="fb-cap"><span>'+t("verify")+'<b id="ffCapQ">'+cap.q+'</b> = </span><input id="ffCapA" class="fb-in" style="width:80px" inputmode="numeric"><span class="fb-refresh" id="ffCapR">↻</span></div>'
    +'<input type="text" id="ffHp" style="position:absolute;left:-9999px" tabindex="-1" autocomplete="off" aria-hidden="true">'
    +'<div id="ffWarn" class="fb-warn" style="display:none"></div>'
    +'<button class="fb-btn fb-submit" id="ffSubmit">'+t("submit")+'</button>'
    +'<div class="fb-note">'+t("form_note")+'</div>';
  var mo=modal(h,"fb-form");var el=mo.el;
  var chosen="";
  el.querySelector("#ffCat").addEventListener("click",function(e){var b=e.target.closest(".fb-catpick");if(!b)return;el.querySelectorAll(".fb-catpick").forEach(function(x){x.classList.toggle("on",x===b);});chosen=b.getAttribute("data-c");
    el.querySelector("#fbWeb3").style.display=(chosen==="clue"||chosen==="fix")?"block":"none";});
  var cont=el.querySelector("#ffContent");cont.addEventListener("input",function(){el.querySelector("#ffCount").textContent=cont.value.length;});
  el.querySelector("#ffCapR").onclick=function(){var c=newCap();el.querySelector("#ffCapQ").textContent=c.q;};
  el.querySelector("#ffSubmit").onclick=function(){
    var warn=el.querySelector("#ffWarn");warn.style.display="none";
    function fail(m){warn.textContent=m;warn.style.display="block";warn.scrollIntoView({block:"center"});}
    if(!chosen)return fail(t("err_cat"));
    var title=el.querySelector("#ffTitle").value.trim(),content=el.querySelector("#ffContent").value.trim();
    if(!title)return fail(t("err_title"));
    if(content.length<10)return fail(t("err_content_min"));
    var wallet=el.querySelector("#ffWallet")?el.querySelector("#ffWallet").value.trim():"",contract=el.querySelector("#ffContract")?el.querySelector("#ffContract").value.trim():"",tx=el.querySelector("#ffTx")?el.querySelector("#ffTx").value.trim():"";
    if(wallet&&!/^0x[0-9a-fA-F]{40}$/.test(wallet))return fail(t("err_wallet"));
    if(contract&&!/^0x[0-9a-fA-F]{40}$/.test(contract))return fail(t("err_contract"));
    if(tx&&!/^0x[0-9a-fA-F]{64}$/.test(tx))return fail(t("err_tx"));
    var evnote=el.querySelector("#ffEvnote")?el.querySelector("#ffEvnote").value:"",link=el.querySelector("#ffLink").value;
    if(sensitive(title+" "+content+" "+evnote+" "+link))return fail(t("err_sensitive"));
    var body={cat:chosen,title:title,content:content,nick:el.querySelector("#ffNick").value.trim(),contact:el.querySelector("#ffContact").value.trim(),
      vis:el.querySelector("#ffPriv").checked?"private":"public",link:link.trim(),
      chain:el.querySelector("#ffChain")?el.querySelector("#ffChain").value:"",wallet:wallet,contract:contract,tx:tx,
      block:el.querySelector("#ffBlock")?el.querySelector("#ffBlock").value.trim():"",evsrc:el.querySelector("#ffEvsrc")?el.querySelector("#ffEvsrc").value.trim():"",evnote:evnote.trim(),
      capQ:el.querySelector("#ffCapQ").textContent,capA:el.querySelector("#ffCapA").value,hp:el.querySelector("#ffHp").value};
    var btn=el.querySelector("#ffSubmit");btn.disabled=true;btn.textContent=t("submitting");
    api("/fb/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(function(d){
      btn.disabled=false;btn.textContent=t("submit");
      if(!d.ok){fail(d.error==="SENSITIVE"?d.msg:(d.error||t("submit_fail")));return;}
      addMine({id:d.id,code:d.code,title:title,ts:Date.now(),status:d.status});
      mo.close();
      modal('<div class="fb-done"><div class="fb-done-ic">✅</div><h2>'+t("done_title")+'</h2>'
        +'<p>'+(d.status==="pending"?t("done_pending"):t("done_public"))+'</p>'
        +'<div class="fb-code">'+t("code_label")+'<b>'+esc(d.code)+'</b> <button class="fb-mini" onclick="__fbcopy(\''+esc(d.code)+'\')">'+t("copy")+'</button></div>'
        +'<p class="fb-note">'+t("done_note")+'</p>'
        +'<button class="fb-btn" onclick="this.closest(\'.fb-modal\').remove();document.body.style.overflow=\'\';location.reload()">'+t("got_it")+'</button></div>','fb-mini-modal');
    }).catch(function(){btn.disabled=false;btn.textContent=t("submit");fail(t("net_retry2"));});
  };
}

/* ---------- 详情 ---------- */
function chainLink(m){return (m.chain==="Anubis Chain")?"https://browser.anubispace.org":PS;}
function addrRow(label,val,type,m){if(!val)return"";var base=chainLink(m);var url=type==="tx"?base+"/tx/"+val:base+"/address/"+val;
  return '<div class="fb-addr"><span class="fb-addr-l">'+label+'</span><a class="mono" href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(short(val))+'</a>'
    +'<button class="fb-mini" onclick="__fbcopy(\''+esc(val)+'\')">'+t("copy")+'</button></div>';}
function openDetail(id){
  var code="";mine().forEach(function(o){if(o.id===id)code=o.code;});
  var mo=modal('<div class="fb-load">'+t("loading")+'</div>',"fb-detail");
  api("/fb/get?id="+encodeURIComponent(id)+(code?"&code="+code:"")).then(function(d){
    if(!d.ok){mo.el.querySelector(".fb-modal-in").innerHTML='<button class="fb-x">✕</button><div class="fb-empty">'+esc(d.error||t("load_fail"))+'</div>';mo.el.querySelector(".fb-x").onclick=mo.close;return;}
    var m=d.msg,c=catObj(m.cat);
    var w3="";if(m.chain||m.wallet||m.contract||m.tx||m.block||m.evsrc||m.evnote){
      w3='<div class="fb-w3"><div class="fb-fh">'+t("w3_head")+'</div>'+(m.chain?'<div class="fb-addr"><span class="fb-addr-l">'+t("f_network")+'</span>'+esc(m.chain)+'</div>':'')
        +addrRow(t("lbl_wallet"),m.wallet,"addr",m)+addrRow(t("lbl_contract"),m.contract,"addr",m)+addrRow(t("lbl_tx"),m.tx,"tx",m)
        +(m.block?'<div class="fb-addr"><span class="fb-addr-l">'+t("lbl_block")+'</span>'+esc(m.block)+'</div>':'')
        +(m.evsrc?'<div class="fb-addr"><span class="fb-addr-l">'+t("f_evsrc")+'</span>'+esc(m.evsrc)+'</div>':'')
        +(m.evnote?'<div class="fb-evnote">'+nl2(m.evnote)+'</div>':'')+'</div>';}
    var off=m.official&&m.official.content?'<div class="fb-official"><div class="fb-off-h">'+t("off_head")+(m.official.status?' · '+esc({adopt:t("ost_adopt"),resolved:t("resolved"),need:t("ost_need"),no:t("ost_no")}[m.official.status]||m.official.status):'')+'</div><div class="fb-off-c">'+nl2(m.official.content)+'</div></div>':'';
    var reps=(m.replies||[]).map(function(r){return '<div class="fb-reply'+(r.official?" off":"")+'"><div class="fb-reply-h">'+(r.official?'<span class="fb-off-tag">'+t("official_replied")+'</span>':'')+esc(r.nick||t("anon"))+' · '+ago(r.ts)+'</div><div class="fb-reply-c">'+nl2(r.content)+'</div></div>';}).join("");
    var lk=liked(m.id);
    var cap=newCap();
    mo.el.querySelector(".fb-modal-in").innerHTML='<button class="fb-x">✕</button>'
      +'<div class="fb-d-top"><span class="fb-catb">'+c.i+' '+c.n+'</span>'+badge(m)+'</div>'
      +'<h2 class="fb-d-title">'+esc(m.title)+'</h2>'
      +'<div class="fb-d-meta">'+esc(m.nick||t("anon"))+' · '+ago(m.ts)+(m.link?' · <a href="'+esc(m.link)+'" target="_blank" rel="noopener" class="fb-d-link">'+t("link_arrow")+'</a>':'')+'</div>'
      +'<div class="fb-d-content">'+nl2(m.content)+'</div>'+w3+off
      +'<div class="fb-d-actions"><button class="fb-act like'+(lk?" on":"")+'" id="fbLikeBtn">👍 <span id="fbLikeN">'+(m.likes||0)+'</span></button>'
      +'<button class="fb-act" id="fbRepBtn">💬 '+t("reply")+'（'+(m.replies||0)+'）</button>'
      +'<button class="fb-act" id="fbRepoBtn">'+t("report_btn")+'</button></div>'
      +'<div class="fb-replies">'+reps+'</div>'
      +'<div class="fb-replybox" id="fbReplyBox" style="display:none"><textarea id="fbRepC" class="fb-in" rows="3" maxlength="1000" placeholder="'+t("ph_reply")+'"></textarea>'
      +'<div class="fb-cap"><input id="fbRepNick" class="fb-in" style="max-width:130px" maxlength="24" placeholder="'+t("f_nick")+'"><span>'+t("verify_sp")+'<b id="fbRepQ">'+cap.q+'</b>=</span><input id="fbRepCap" class="fb-in" style="width:70px"><button class="fb-btn" id="fbRepSend">'+t("send")+'</button></div></div>';
    var inn=mo.el;inn.querySelector(".fb-x").onclick=mo.close;
    inn.querySelector("#fbLikeBtn").onclick=function(){if(liked(m.id)){toast(t("already_liked"));return;}
      api("/fb/like",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:m.id,vid:vid()})}).then(function(r){if(r.ok){setLiked(m.id);inn.querySelector("#fbLikeN").textContent=r.likes;inn.querySelector("#fbLikeBtn").classList.add("on");}else if(r.liked){setLiked(m.id);toast(t("already_liked"));}else toast(r.error||t("fail"),1);});};
    inn.querySelector("#fbRepBtn").onclick=function(){var b=inn.querySelector("#fbReplyBox");b.style.display=b.style.display==="none"?"block":"none";};
    inn.querySelector("#fbRepSend").onclick=function(){
      var content=inn.querySelector("#fbRepC").value.trim();if(content.length<2){toast(t("reply_short"),1);return;}
      if(sensitive(content)){toast(t("reply_sensitive"),1);return;}
      var body={id:m.id,content:content,nick:inn.querySelector("#fbRepNick").value.trim(),capQ:inn.querySelector("#fbRepQ").textContent,capA:inn.querySelector("#fbRepCap").value};
      api("/fb/reply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(function(r){if(r.ok){toast(t("reply_ok"));openDetail(m.id);}else toast(r.error==="SENSITIVE"?r.msg:(r.error||t("fail")),1);});};
    inn.querySelector("#fbRepoBtn").onclick=function(){openReport(m.id);};
  }).catch(function(){mo.el.querySelector(".fb-modal-in").innerHTML='<button class="fb-x" onclick="this.closest(\'.fb-modal\').remove();document.body.style.overflow=\'\'">✕</button><div class="fb-empty">'+t("net_retry2")+'</div>';});
}
function openReport(id){
  var reasons=[t("rp_spam"),t("rp_scam"),t("rp_lure"),t("rp_false"),t("rp_key"),t("rp_attack"),t("cat_other")];
  var h='<h2 class="fb-mh">'+t("report_title")+'</h2><div class="fb-fh">'+t("report_reason")+'</div>'+reasons.map(function(r,i){return '<label class="fb-radio"><input type="radio" name="fbrp" value="'+esc(r)+'"'+(i===0?" checked":"")+'> '+r+'</label>';}).join("")
    +'<textarea id="fbRpD" class="fb-in" rows="2" placeholder="'+t("ph_evnote")+'" style="margin-top:10px"></textarea><button class="fb-btn" id="fbRpSend">'+t("report_submit")+'</button>';
  var mo=modal(h,"fb-mini-modal");
  mo.el.querySelector("#fbRpSend").onclick=function(){var reason=(mo.el.querySelector('input[name=fbrp]:checked')||{}).value||t("cat_other");
    api("/fb/report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:id,reason:reason,detail:mo.el.querySelector("#fbRpD").value.trim()})}).then(function(r){mo.close();toast(r.ok?t("report_done"):t("submit_fail"),!r.ok);});};
}

/* ---------- 我的留言 ---------- */
function openMine(){
  var list=mine();
  var h='<h2 class="fb-mh">'+t("btn_mine")+'</h2>';
  if(!list.length)h+='<div class="fb-empty">'+t("mine_empty")+'<br>'+t("mine_empty2")+'</div>';
  else h+='<div class="fb-mine-list" id="fbMineList">'+list.map(function(o){return '<div class="fb-mine-row" data-id="'+esc(o.id)+'" data-code="'+esc(o.code)+'"><div class="fb-mine-t">'+esc(o.title)+'</div><div class="fb-mine-s"><span class="s">'+t("querying")+'</span> · '+ago(o.ts)+'</div></div>';}).join("")+'</div>';
  h+='<div class="fb-fh" style="margin-top:14px">'+t("code_query_head")+'</div><div class="fb-cap"><input id="fbCodeIn" class="fb-in" placeholder="'+t("ph_code")+'"><button class="fb-ghost" id="fbCodeGo">'+t("query_btn")+'</button></div>';
  var mo=modal(h,"fb-mini-modal");
  mo.el.querySelectorAll(".fb-mine-row").forEach(function(row){
    var id=row.getAttribute("data-id"),code=row.getAttribute("data-code");
    api("/fb/get?id="+encodeURIComponent(id)+"&code="+code).then(function(d){var s=row.querySelector(".s");
      if(d.ok){var st=STAT[d.msg.status]||{t:d.msg.status,c:"#b79c74"};s.textContent=st.t+(d.msg.official?" · "+t("official_replied"):"");s.style.color=st.c;}else s.textContent=t("deleted_or_none");});
    row.onclick=function(){mo.close();openDetail(id);};
  });
  mo.el.querySelector("#fbCodeGo").onclick=function(){var code=mo.el.querySelector("#fbCodeIn").value.trim();if(!code)return;
    // 查询码对应某条留言：遍历本地找id；若无则提示（查询码是每条留言独立的）
    var hit=null;mine().forEach(function(o){if(o.code===code)hit=o.id;});
    if(hit){mo.close();openDetail(hit);}else toast(t("no_code_local"),1);};
}

/* ---------- 管理后台 ---------- */
function openAdmin(){
  var key=db().admin||"";
  if(!key){var h='<h2 class="fb-mh">'+t("admin_login_title")+'</h2><p class="fb-note">'+t("admin_login_note")+'</p><input id="fbAdmK" class="fb-in" type="password" placeholder="'+t("ph_admin_key")+'"><button class="fb-btn" id="fbAdmGo">'+t("admin_enter")+'</button>';
    var mo=modal(h,"fb-mini-modal");mo.el.querySelector("#fbAdmGo").onclick=function(){var k=mo.el.querySelector("#fbAdmK").value.trim();
      api("/fb/admin?key="+encodeURIComponent(k)).then(function(d){if(d.ok){var dd=db();dd.admin=k;save(dd);mo.close();adminPanel(d);}else toast(t("key_wrong"),1);});};
    return;}
  api("/fb/admin?key="+encodeURIComponent(key)).then(function(d){if(d.ok)adminPanel(d);else{var dd=db();dd.admin="";save(dd);toast(t("key_expired"),1);openAdmin();}});
}
function adminPanel(d){
  var s=d.stats||{};
  var h='<h2 class="fb-mh">'+t("admin_title")+'</h2>'
    +'<div class="fb-admin-stats"><span>'+t("all")+' <b>'+s.total+'</b></span><span>'+t("st_pend_lbl")+' <b style="color:#e0a24f">'+s.pending+'</b></span><span>'+t("st_today")+' <b>'+s.today+'</b></span><span>'+t("resolved")+' <b style="color:#76FF36">'+s.resolved+'</b></span><span>'+t("report_word")+' <b style="color:#c0503a">'+s.reports+'</b></span></div>'
    +'<div class="fb-admin-list">'+(d.items||[]).map(function(m){var st=STAT[m.status]||{t:m.status,c:"#b79c74"};
      return '<div class="fb-adm-row" data-id="'+esc(m.id)+'"><div class="fb-adm-main"><span class="fb-catb">'+catObj(m.cat).i+'</span> '+esc(m.title)
        +' <span class="fb-tag" style="color:'+st.c+'">'+st.t+'</span>'+(m.reportN?'<span class="fb-tag" style="color:#c0503a">'+t("report_word")+m.reportN+'</span>':'')+(m.official?'<span class="fb-tag" style="color:#3aa0e0">'+t("st_replied")+'</span>':'')
        +'<div class="fb-adm-sub">'+esc(m.nick)+' · '+ago(m.ts)+' · 👍'+(m.likes||0)+' 💬'+(m.replies||0)+'</div></div><button class="fb-mini fb-adm-open">'+t("adm_handle")+'</button></div>';}).join("")+'</div>';
  var mo=modal(h,"fb-admin");
  mo.el.querySelectorAll(".fb-adm-row").forEach(function(row){row.querySelector(".fb-adm-open").onclick=function(){adminOne(row.getAttribute("data-id"),mo);};});
}
function adminOne(id,parentMo){
  var key=db().admin;
  api("/fb/admin?key="+encodeURIComponent(key)+"&id="+encodeURIComponent(id)).then(function(d){
    var m=d.full;if(!m){toast(t("load_fail"),1);return;}
    var reports=(m.reports||[]).map(function(r){return '<div class="fb-rp">⚑ '+esc(r.reason)+(r.detail?'：'+esc(r.detail):'')+' · '+ago(r.ts)+'</div>';}).join("");
    var h='<h2 class="fb-mh">'+t("adm_handle_title")+'</h2><div class="fb-adm-detail"><b>'+esc(m.title)+'</b><div class="fb-adm-sub">'+catObj(m.cat).n+' · '+esc(m.nick)+' · '+ago(m.ts)+'</div>'
      +'<div class="fb-d-content" style="max-height:180px;overflow:auto">'+nl2(m.content)+'</div>'
      +(m.contact?'<div class="fb-adm-contact">'+t("adm_contact")+esc(m.contact)+'</div>':'')
      +(reports?'<div class="fb-adm-reports"><b>'+t("report_word")+'（'+m.reports.length+'）</b>'+reports+' <button class="fb-mini" id="fbClrRp">'+t("clear_reports")+'</button></div>':'')
      +'<div class="fb-fh">'+t("off_reply_head")+'</div><textarea id="fbOffC" class="fb-in" rows="3" placeholder="'+t("ph_off_reply")+'">'+(m.official?esc(m.official.content):'')+'</textarea>'
      +'<select id="fbOffS" class="fb-sel"><option value="">'+t("reply_status")+'</option><option value="adopt">'+t("ost_adopt")+'</option><option value="resolved">'+t("resolved")+'</option><option value="need">'+t("ost_need")+'</option><option value="no">'+t("ost_no")+'</option></select>'
      +'<button class="fb-btn" id="fbOffSend">'+t("publish_off")+'</button>'
      +'<div class="fb-fh" style="margin-top:14px">'+t("review_ops")+'</div><div class="fb-adm-ops">'
      +'<button class="fb-mini" data-a="status" data-v="public">'+t("op_public")+'</button><button class="fb-mini" data-a="status" data-v="pending">'+t("op_pending")+'</button>'
      +'<button class="fb-mini" data-a="status" data-v="hidden">'+t("op_hidden")+'</button><button class="fb-mini" data-a="status" data-v="archived">'+t("op_archived")+'</button>'
      +'<button class="fb-mini" data-a="feature" data-v="1">'+t("op_feature")+'</button><button class="fb-mini" data-a="feature" data-v="0">'+t("op_unfeature")+'</button>'
      +'<button class="fb-mini" data-a="resolve" data-v="1">'+t("op_resolve")+'</button>'
      +'<button class="fb-mini fb-danger" data-a="delete">'+t("op_delete")+'</button></div></div>';
    var mo=modal(h,"fb-mini-modal");var el=mo.el;
    function act(payload,done){payload.key=key;payload.id=id;api("/fb/admin?key="+encodeURIComponent(key),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}).then(function(r){if(r.ok){toast(t("done_toast"));if(done)done();}else toast(r.error||t("fail"),1);});}
    el.querySelectorAll(".fb-adm-ops .fb-mini").forEach(function(b){b.onclick=function(){var a=b.getAttribute("data-a");
      if(a==="delete"){if(!confirm(t("confirm_delete")))return;act({action:"delete"},function(){mo.close();parentMo.close();openAdmin();});}
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
