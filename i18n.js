/* ═══════════ Web3Origin 多语言系统 ═══════════
   12 语言 · 右侧抽屉 · 懒加载语言包 · localStorage 持久化 · 浏览器检测 · RTL(阿拉伯语) · 无障碍。
   依赖 index.html 内联已建好的 window.PACKS.en(={ui,tools,faqs})和 renderTools/renderFAQ 等。
   新增语言：①在 LOCALES 里加一条 ②放一个 /locales/<code>.json（结构同 _source_en.json）。 */
(function(){
"use strict";
var STORE="web3origin_locale", OLD="site_lang";
var LOCALES=[
  {code:"zh-CN",label:"Simplified Chinese",native:"简体中文",flag:"🇨🇳",dir:"ltr",ab:"简"},
  {code:"zh-TW",label:"Traditional Chinese",native:"繁體中文",flag:"🇭🇰",dir:"ltr",ab:"繁"},
  {code:"en",label:"English",native:"English",flag:"🇬🇧",dir:"ltr",ab:"EN"},
  {code:"ja",label:"Japanese",native:"日本語",flag:"🇯🇵",dir:"ltr",ab:"日"},
  {code:"ko",label:"Korean",native:"한국어",flag:"🇰🇷",dir:"ltr",ab:"한"},
  {code:"hi",label:"Hindi",native:"हिन्दी",flag:"🇮🇳",dir:"ltr",ab:"HI"},
  {code:"id",label:"Indonesian",native:"Bahasa Indonesia",flag:"🇮🇩",dir:"ltr",ab:"ID"},
  {code:"it",label:"Italian",native:"Italiano",flag:"🇮🇹",dir:"ltr",ab:"IT"},
  {code:"de",label:"German",native:"Deutsch",flag:"🇩🇪",dir:"ltr",ab:"DE"},
  {code:"fr",label:"French",native:"Français",flag:"🇫🇷",dir:"ltr",ab:"FR"},
  {code:"es",label:"Spanish",native:"Español",flag:"🇪🇸",dir:"ltr",ab:"ES"},
  {code:"ar",label:"Arabic",native:"العربية",flag:"🇸🇦",dir:"rtl",ab:"AR"}
];
window.LOCALES=LOCALES;
function byCode(c){for(var i=0;i<LOCALES.length;i++)if(LOCALES[i].code===c)return LOCALES[i];return null;}
window.PACKS=window.PACKS||{};

/* ---------- 样式 ---------- */
function css(){ if(document.getElementById("i18nCss"))return; var s=document.createElement("style");s.id="i18nCss";
s.textContent=[
"#langOverlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);opacity:0;visibility:hidden;transition:opacity .25s;z-index:300}",
"#langOverlay.open{opacity:1;visibility:visible}",
"#langDrawer{position:fixed;top:0;right:0;height:100vh;height:100dvh;width:78vw;max-width:360px;background:#0c0a08;border-left:1px solid var(--line,#3a2313);z-index:301;transform:translateX(100%);transition:transform .28s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;box-shadow:-12px 0 40px rgba(0,0,0,.5)}",
"#langDrawer.open{transform:translateX(0)}",
"html[dir=rtl] #langDrawer{right:auto;left:0;border-left:none;border-right:1px solid var(--line,#3a2313);transform:translateX(-100%);box-shadow:12px 0 40px rgba(0,0,0,.5)}",
"html[dir=rtl] #langDrawer.open{transform:translateX(0)}",
".ld-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--line,#3a2313);flex:0 0 auto}",
".ld-head h3{margin:0;font-size:16px;color:var(--gold-lt,#f0d48a);font-family:var(--serif,serif);font-weight:400}",
".ld-close{background:none;border:none;color:var(--soft,#b79c74);font-size:22px;cursor:pointer;line-height:1;padding:2px 6px;border-radius:6px}",
".ld-close:hover{color:var(--bone,#F1DFC0);background:rgba(214,168,75,.08)}",
".ld-list{flex:1;overflow-y:auto;padding:8px}",
".ld-opt{display:flex;align-items:center;gap:12px;width:100%;background:none;border:none;color:var(--ink,#e8d9be);font-size:15px;font-family:inherit;text-align:start;padding:0 14px;min-height:52px;border-radius:10px;cursor:pointer;transition:background .15s}",
".ld-opt:hover{background:rgba(214,168,75,.06)}",
".ld-opt .flag{font-size:22px;flex:0 0 auto}",
".ld-opt .name{flex:1}",
".ld-opt .chk{color:var(--green,#25C96F);font-size:17px;opacity:0}",
".ld-opt.on{background:rgba(37,201,111,.1)}",
".ld-opt.on .name{color:var(--green-lt,#76FF36);font-weight:600}",
".ld-opt.on .chk{opacity:1}",
".ld-foot{padding:12px 18px;border-top:1px solid var(--line,#3a2313);font-size:11px;color:var(--muted,#7c6a4f);flex:0 0 auto}",
/* 触发按钮显示 flag */
"#langBtn .lg-flag,#mLang .lg-flag{font-size:14px}",
/* 浏览器语言建议条 */
"#langSuggest{position:fixed;left:50%;bottom:18px;transform:translateX(-50%) translateY(30px);background:#12100c;border:1px solid var(--gold,#D6A84B);border-radius:12px;padding:11px 15px;z-index:250;display:flex;align-items:center;gap:12px;font-size:13px;color:var(--ink,#e8d9be);box-shadow:0 10px 40px rgba(0,0,0,.45);opacity:0;transition:.3s;max-width:92vw}",
"#langSuggest.show{opacity:1;transform:translateX(-50%) translateY(0)}",
"#langSuggest button{font:inherit;border-radius:7px;padding:6px 13px;cursor:pointer;border:1px solid var(--line,#3a2313)}",
"#langSuggest .yes{background:linear-gradient(180deg,#1c8f2d,#12100c);border-color:var(--green,#25C96F);color:#fff}",
"#langSuggest .no{background:transparent;color:var(--muted,#7c6a4f)}",
/* RTL 细节 */
"html[dir=rtl] body{text-align:right}",
"html[dir=rtl] .nav .links{flex-direction:row-reverse}"
].join("\n");
document.head.appendChild(s);}

/* ---------- 抽屉 DOM ---------- */
function buildDrawer(){
  if(document.getElementById("langDrawer"))return;
  var ov=document.createElement("div");ov.id="langOverlay";document.body.appendChild(ov);
  var dr=document.createElement("nav");dr.id="langDrawer";dr.setAttribute("role","dialog");dr.setAttribute("aria-modal","true");dr.setAttribute("aria-label","Language selection");dr.setAttribute("aria-hidden","true");
  var lang=(window.SITE_LANG==="zh"||!window.SITE_LANG)?"选择语言":"Select language";
  dr.innerHTML='<div class="ld-head"><h3 id="ldTitle">'+lang+'</h3><button class="ld-close" aria-label="Close">✕</button></div>'
    +'<div class="ld-list" role="listbox">'+LOCALES.map(function(l){
      return '<button class="ld-opt" role="option" data-code="'+l.code+'" lang="'+l.code+'"><span class="flag">'+l.flag+'</span><span class="name">'+l.native+'</span><span class="chk">✓</span></button>';
    }).join("")+'</div><div class="ld-foot">🌐 12 languages · more coming</div>';
  document.body.appendChild(dr);
  ov.addEventListener("click",closeDrawer);
  dr.querySelector(".ld-close").addEventListener("click",closeDrawer);
  dr.querySelectorAll(".ld-opt").forEach(function(b){ b.addEventListener("click",function(){ applyLocale(b.getAttribute("data-code")); }); });
}
var _scrollY=0;
function openDrawer(){
  var dr=document.getElementById("langDrawer"),ov=document.getElementById("langOverlay");
  paintDrawer(curCode());
  _scrollY=window.scrollY;
  document.body.style.position="fixed";document.body.style.top="-"+_scrollY+"px";document.body.style.width="100%";
  ov.classList.add("open");dr.classList.add("open");dr.setAttribute("aria-hidden","false");
  var t=dr.querySelector(".ld-opt.on")||dr.querySelector(".ld-opt");if(t)t.focus();
  document.addEventListener("keydown",onKey);
}
function closeDrawer(){
  var dr=document.getElementById("langDrawer"),ov=document.getElementById("langOverlay");
  if(!dr)return;
  ov.classList.remove("open");dr.classList.remove("open");dr.setAttribute("aria-hidden","true");
  document.body.style.position="";document.body.style.top="";document.body.style.width="";
  window.scrollTo(0,_scrollY);
  document.removeEventListener("keydown",onKey);
}
function onKey(e){
  if(e.key==="Escape"){closeDrawer();return;}
  if(e.key==="Tab"){ // 焦点锁定
    var f=document.getElementById("langDrawer").querySelectorAll("button");if(!f.length)return;
    var first=f[0],last=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
}
function paintDrawer(code){
  var dr=document.getElementById("langDrawer");if(!dr)return;
  dr.querySelectorAll(".ld-opt").forEach(function(b){
    var on=b.getAttribute("data-code")===code;
    b.classList.toggle("on",on);
    if(on)b.setAttribute("aria-current","true");else b.removeAttribute("aria-current");
  });
  var t=document.getElementById("ldTitle");
  if(t)t.textContent=(code==="zh-CN"?"选择语言":code==="zh-TW"?"選擇語言":code==="ja"?"言語を選択":code==="ko"?"언어 선택":code==="ar"?"اختر اللغة":"Select language");
}

/* ---------- 应用语言 ---------- */
function curCode(){ try{return localStorage.getItem(STORE)||"zh-CN";}catch(e){return "zh-CN";} }
function updateTrigger(code){
  var l=byCode(code)||LOCALES[0];
  [document.getElementById("langBtn"),document.getElementById("mLang")].forEach(function(b){
    if(b){b.innerHTML='<span class="lg-flag">'+l.flag+'</span> '+l.ab;b.setAttribute("aria-label","Language: "+l.native);b.setAttribute("aria-expanded","false");}
  });
}
function applyUI(pack){
  var enui=(window.PACKS.en&&window.PACKS.en.ui)||{};
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    if(el._zh===undefined)el._zh=el.innerHTML;
    var k=el.getAttribute('data-i18n');
    var v=(pack&&pack.ui&&pack.ui[k]!==undefined)?pack.ui[k]:(enui[k]!==undefined?enui[k]:el._zh);
    el.innerHTML=v;
  });
}
function rerender(){ ["renderTools","renderFAQ","renderLib","renderCodices","renderGeo","renderRadar"].forEach(function(fn){ if(typeof window[fn]==="function"){try{window[fn]();}catch(e){}} }); }
function setChrome(code){
  var l=byCode(code)||{dir:"ltr"};
  document.documentElement.lang=code;
  document.documentElement.dir=l.dir;
  window.SITE_LANG=(code==="zh-CN"?"zh":code);   // 中文简体→'zh'走原生;其余为完整code(渲染函数非zh即回退英文)
}
function persist(code){ try{localStorage.setItem(STORE,code);localStorage.setItem(OLD,code==="zh-CN"?"zh":(code==="en"?"en":"en"));}catch(e){} }
function ensurePack(code,cb){
  if(code==="zh-CN"){cb(null);return;}
  if(window.PACKS[code]){cb(window.PACKS[code]);return;}
  var url="/locales/"+code+".json";
  fetch(url).then(function(r){return r.ok?r.json():Promise.reject();}).then(function(p){window.PACKS[code]=p;cb(p);})
    .catch(function(){cb(window.PACKS.en||null);});   // 拿不到就回退英文
}
function applyLocale(code){
  if(!byCode(code))code="zh-CN";
  ensurePack(code,function(pack){
    if(code==="zh-CN"){
      document.querySelectorAll('[data-i18n]').forEach(function(el){if(el._zh!==undefined)el.innerHTML=el._zh;});
    } else { applyUI(pack); }
    setChrome(code); rerender(); persist(code); paintDrawer(code); updateTrigger(code); closeDrawer();
  });
}
window.applyLocale=applyLocale;

/* ---------- 浏览器语言建议 ---------- */
function detectSuggest(){
  var navs=(navigator.languages||[navigator.language||""]);
  for(var i=0;i<navs.length;i++){
    var n=(navs[i]||"").toLowerCase();
    if(n.indexOf("zh")===0)return null;                 // 中文用户默认已是中文,不建议
    var hit=null;
    LOCALES.forEach(function(l){ if(l.code==="zh-CN")return; var lc=l.code.toLowerCase();
      if(n===lc||n.split("-")[0]===lc.split("-")[0]) hit=hit||l; });
    if(hit&&hit.code!=="zh-CN")return hit;
  }
  return null;
}
function showSuggest(l){
  if(document.getElementById("langSuggest"))return;
  var b=document.createElement("div");b.id="langSuggest";
  b.innerHTML='<span>'+l.flag+' Switch to <b>'+l.native+'</b>?</span><button class="yes">'+l.native+'</button><button class="no" aria-label="Dismiss">✕</button>';
  document.body.appendChild(b);
  setTimeout(function(){b.classList.add("show");},400);
  b.querySelector(".yes").onclick=function(){applyLocale(l.code);b.remove();};
  b.querySelector(".no").onclick=function(){try{localStorage.setItem(STORE,"zh-CN");}catch(e){}b.remove();};
}

/* ---------- 初始化 ---------- */
function init(){
  css(); buildDrawer();
  // 触发按钮 → 打开抽屉
  ["langBtn","mLang"].forEach(function(id){var b=document.getElementById(id);if(b){b.setAttribute("aria-haspopup","dialog");b.setAttribute("aria-controls","langDrawer");b.onclick=openDrawer;}});
  // 读取偏好:web3origin_locale > 旧site_lang > ?lang= > 无
  var stored=null;
  try{ stored=localStorage.getItem(STORE); }catch(e){}
  if(!stored){ try{var o=localStorage.getItem(OLD); if(o==="en")stored="en"; else if(o==="zh")stored="zh-CN";}catch(e){} }
  try{ var p=new URLSearchParams(location.search).get("lang"); if(p&&byCode(p))stored=p; }catch(e){}
  if(stored&&byCode(stored)){
    applyLocale(stored);
  } else {
    updateTrigger("zh-CN"); setChrome("zh-CN"); paintDrawer("zh-CN");
    var sug=detectSuggest(); if(sug)showSuggest(sug);
  }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
