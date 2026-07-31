/* 起源线上课堂 · 直播开始提醒（顶部细横幅版）
   打开网站→查真实直播状态(/live/today)→直播中在页面顶部显示一条细横幅(点此进入/×关闭)。
   不遮挡正文、不压黑背景、不自动跳转、不自动播声音、接口异常静默。数据来自现有直播状态机。 */
(function(){
  "use strict";
  var API="https://count.web3origin.com";
  var LIVE_PATH="/live/";
  var path=location.pathname||"";
  if(path===LIVE_PATH||path.indexOf(LIVE_PATH)===0||path.indexOf("/live")===0)return; // 直播页本身不提醒

  var DEF={enabled:true,preRemindEnabled:true,preRemindMin:10,livePath:LIVE_PATH};
  var CFG=DEF;

  function sesGet(k){try{return sessionStorage.getItem(k);}catch(e){return null;}}
  function sesSet(k,v){try{sessionStorage.setItem(k,v);}catch(e){}}
  function liveKey(c){return (c.id||c.title||"x")+"_"+(c.start||0);}

  function injectCss(){
    if(document.getElementById("w3o-live-css"))return;
    var s=document.createElement("style");s.id="w3o-live-css";
    s.textContent=[
"#w3oLiveBar,#w3oLiveSoon{font-family:'Microsoft YaHei','PingFang SC',system-ui,sans-serif;box-sizing:border-box}",
"#w3oLiveBar *,#w3oLiveSoon *{box-sizing:border-box}",
"#w3oLiveBar{position:fixed;top:0;left:0;right:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;gap:9px;min-height:38px;padding:6px 42px 6px 16px;background:linear-gradient(90deg,#1a0406,#320a0e 45%,#320a0e 55%,#1a0406);border-bottom:1px solid #5a1418;box-shadow:0 2px 14px rgba(0,0,0,.4);font-size:13.5px;color:#ffe3e3;line-height:1.35}",
"#w3oLiveBar .bn-main{display:inline-flex;align-items:center;gap:8px;max-width:100%;min-width:0;text-decoration:none;color:#ffe3e3}",
"#w3oLiveBar .bn-txt{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}",
"#w3oLiveBar .bn-txt b{color:#fff;font-weight:700}",
"#w3oLiveBar .bn-cta{color:#5df0a6;font-weight:700;white-space:nowrap;flex:0 0 auto}",
"#w3oLiveBar .bn-x{position:absolute;right:9px;top:50%;transform:translateY(-50%);width:26px;height:26px;border-radius:50%;border:1px solid #5a1418;background:rgba(0,0,0,.28);color:#ffdede;cursor:pointer;font-size:13px;line-height:1;padding:0}",
"#w3oLiveBar .bn-x:hover{background:rgba(0,0,0,.5)}",
"#w3oLiveBar .bn-x:focus-visible,#w3oLiveBar .bn-main:focus-visible{outline:2px solid #f0d48a;outline-offset:2px}",
".w3o-dot{width:9px;height:9px;border-radius:50%;flex:0 0 auto;background:#ff4d4d;box-shadow:0 0 0 0 rgba(255,77,77,.7);animation:w3oPulse 1.5s infinite}",
".w3o-dot.em{background:#3ddc8a;box-shadow:0 0 0 0 rgba(61,220,138,.7)}",
"@keyframes w3oPulse{0%{box-shadow:0 0 0 0 rgba(255,77,77,.6)}70%{box-shadow:0 0 0 7px rgba(255,77,77,0)}100%{box-shadow:0 0 0 0 rgba(255,77,77,0)}}",
"#w3oLiveSoon{position:fixed;right:16px;bottom:20px;z-index:2147482000;display:none;max-width:300px;background:linear-gradient(180deg,#0e0b08,#0a0d0b);border:1px solid #3a2313;border-left:3px solid #3ddc8a;border-radius:12px;padding:12px 14px;color:#e8d9be;box-shadow:0 8px 26px rgba(0,0,0,.5)}",
"#w3oLiveSoon.on{display:block}",
"#w3oLiveSoon .st{display:flex;align-items:center;gap:7px;font-size:13px;color:#3ddc8a;font-weight:700;margin-bottom:6px}",
"#w3oLiveSoon .tx{font-size:13px;color:#e8d9be;margin-bottom:10px;line-height:1.5}",
"#w3oLiveSoon .acts{display:flex;gap:8px}",
"#w3oLiveSoon .sb{flex:1;text-align:center;border-radius:8px;font-size:13px;padding:8px;cursor:pointer;border:1px solid #3a2313;text-decoration:none;color:#f1dfc0}",
"#w3oLiveSoon .sb.p{background:linear-gradient(180deg,#2a6b47,#1c4d33);border-color:#2f7d4f;color:#eafff2}",
"@media(max-width:600px){#w3oLiveBar{font-size:12.5px;padding:6px 40px 6px 12px}#w3oLiveSoon{left:12px;right:12px;max-width:none;bottom:16px}}",
"@media(prefers-reduced-motion:reduce){.w3o-dot{animation:none}}"
    ].join("");
    document.head.appendChild(s);
  }

  function esc(s){return String(s==null?"":s).replace(/[&<>\"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function hm(sec){try{return new Intl.DateTimeFormat("zh-CN",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"Asia/Shanghai"}).format(new Date(sec*1000));}catch(e){var d=new Date(sec*1000);return ("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2);}}

  // 顶部有 fixed/sticky 导航时，整体下移横幅高度，避免遮挡
  var bar,shifted=[],padDone=false;
  function shiftBars(h){
    try{
      var els=document.querySelectorAll("header,nav,.nav,.navbar,.top,.topbar,.site-header,.header");
      Array.prototype.forEach.call(els,function(el){
        if(el===bar||el.closest&&el.closest("#w3oLiveBar"))return;
        var cs=getComputedStyle(el);
        if((cs.position==="fixed"||cs.position==="sticky")){
          var r=el.getBoundingClientRect();
          if(r.top<=4 && r.height<220){
            el.setAttribute("data-w3o-top",el.style.top||"");
            var cur=parseFloat(cs.top)||0;
            el.style.top=(cur+h)+"px";
            shifted.push(el);
          }
        }
      });
      var pad=parseFloat(getComputedStyle(document.body).paddingTop)||0;
      document.body.setAttribute("data-w3o-pad",document.body.style.paddingTop||"");
      document.body.style.paddingTop=(pad+h)+"px";padDone=true;
    }catch(e){}
  }
  function unshiftBars(){
    try{
      shifted.forEach(function(el){el.style.top=el.getAttribute("data-w3o-top")||"";el.removeAttribute("data-w3o-top");});
      shifted=[];
      if(padDone){document.body.style.paddingTop=document.body.getAttribute("data-w3o-pad")||"";document.body.removeAttribute("data-w3o-pad");padDone=false;}
    }catch(e){}
  }

  var curCourse;
  function showBar(c){
    if(sesGet("w3o_live_bn_"+liveKey(c))==="1")return; // 本场已关闭→不再显示
    injectCss();curCourse=c;
    if(bar)return;
    var url=CFG.livePath||LIVE_PATH;
    bar=document.createElement("div");bar.id="w3oLiveBar";bar.setAttribute("role","region");bar.setAttribute("aria-label","直播提醒");
    bar.innerHTML='<a class="bn-main" href="'+esc(url)+'"><span class="w3o-dot"></span>'
      +'<span class="bn-txt"><b>线上直播中</b></span>'
      +'<span class="bn-cta">进入 →</span></a>'
      +'<button class="bn-x" aria-label="关闭">✕</button>';
    document.body.insertBefore(bar,document.body.firstChild);
    var h=bar.offsetHeight||38;shiftBars(h);
    bar.querySelector(".bn-x").addEventListener("click",function(e){e.preventDefault();e.stopPropagation();closeBar(true);});
    document.addEventListener("keydown",onEsc);
  }
  function onEsc(e){if(e.key==="Escape"&&bar)closeBar(true);}
  function closeBar(remember){
    if(remember&&curCourse)sesSet("w3o_live_bn_"+liveKey(curCourse),"1");
    unshiftBars();
    if(bar&&bar.parentNode)bar.parentNode.removeChild(bar);
    bar=null;document.removeEventListener("keydown",onEsc);
  }

  // 即将开始（开课前 N 分钟，小卡，非全屏）
  var soon;
  function showSoon(c,srv){
    injectCss();var mins=Math.max(1,Math.round((c.start-srv)/60));
    if(!soon){soon=document.createElement("div");soon.id="w3oLiveSoon";document.body.appendChild(soon);}
    soon.innerHTML='<div class="st"><span class="w3o-dot em"></span>线上课堂即将开始</div>'
      +'<div class="tx">「'+esc(c.title||"线上课堂")+'」将在 '+mins+' 分钟后开始。</div>'
      +'<div class="acts"><a class="sb p" href="'+esc(CFG.livePath||LIVE_PATH)+'">查看课程</a><button class="sb" id="w3oSoonOk">知道了</button></div>';
    soon.classList.add("on");
    document.getElementById("w3oSoonOk").onclick=function(){soon.classList.remove("on");};
  }

  function decide(d){
    if(!d||d.ok===false)return;
    if(d.popup)CFG=Object.assign({},DEF,d.popup);
    if(CFG.enabled===false)return;
    var c=d.course,srv=d.serverTime||Math.floor(Date.now()/1000);
    if(!c||!c.status)return;
    if(c.status==="live" && c.start && c.end && srv>=c.start && srv<c.end){showBar(c);return;}
    if(bar)closeBar(false);
    if(CFG.preRemindEnabled!==false && (c.status==="soon"||c.status==="upcoming"||c.status==="waiting") && c.start){
      var left=c.start-srv;
      if(left>0 && left<=(CFG.preRemindMin||10)*60){
        var sk="w3o_live_soon_"+liveKey(c);
        if(sesGet(sk)!=="1"){sesSet(sk,"1");showSoon(c,srv);}
      }
    }
  }

  function run(){
    if(window.__LIVE_REMINDER_MOCK__){decide(window.__LIVE_REMINDER_MOCK__);return;}
    try{fetch(API+"/live/today",{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).then(function(d){decide(d);}).catch(function(){});}catch(e){}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run);else run();
})();
