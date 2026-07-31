/* 起源直播提醒（右下角小浮标，支持两路：盟主线上直播 /live + 腾讯云直播 /live-cloud）
   打开网站→查真实直播状态→在直播的那路在右下角显示小浮标「● 直播中」，点了进对应直播页。
   两路都在播则上下叠放。不占顶部、不挡正文、不压黑背景、不自动跳转、不自动播声音、接口异常静默。 */
(function(){
  "use strict";
  var API="https://count.web3origin.com";
  var path=location.pathname||"";
  if(path.indexOf("/live")===0)return; // /live 和 /live-cloud 页本身不提示

  var enabledMaster=true, preRemindEnabled=true, preRemindMin=10;

  function sesGet(k){try{return sessionStorage.getItem(k);}catch(e){return null;}}
  function sesSet(k,v){try{sessionStorage.setItem(k,v);}catch(e){}}
  function locGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function locSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
  function esc(s){return String(s==null?"":s).replace(/[&<>\"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

  function injectCss(){
    if(document.getElementById("w3o-live-css"))return;
    var s=document.createElement("style");s.id="w3o-live-css";
    s.textContent=[
".w3o-pill,#w3oLiveSoon{font-family:'Microsoft YaHei','PingFang SC',system-ui,sans-serif;box-sizing:border-box}",
".w3o-pill *,#w3oLiveSoon *{box-sizing:border-box}",
".w3o-pill{position:fixed;right:16px;z-index:2147483000;display:none;align-items:center;gap:8px;background:linear-gradient(180deg,#0e0b08,#0a0d0b);border:1px solid #2f7d4f;color:#eafff2;font-size:13px;font-weight:700;padding:8px 10px 8px 13px;border-radius:24px;text-decoration:none;box-shadow:0 0 18px rgba(61,220,138,.28),0 6px 18px rgba(0,0,0,.5);touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab}",
".w3o-pill.on{display:inline-flex}",
".w3o-pill.dragging{cursor:grabbing;filter:none}",
".w3o-pill:hover{filter:brightness(1.1)}",
".w3o-pill:focus-visible{outline:2px solid #f0d48a;outline-offset:2px}",
".w3o-pill .pill-x{flex:0 0 auto;width:18px;height:18px;border-radius:50%;border:1px solid #3a2313;background:rgba(0,0,0,.35);color:#cdb;font-size:11px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}",
".w3o-pill .pill-x:hover{color:#fff;border-color:#5a1418}",
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
"@media(max-width:600px){.w3o-pill{right:12px}#w3oLiveSoon{left:12px;right:12px;max-width:none;bottom:84px}}",
"@media(prefers-reduced-motion:reduce){.w3o-dot{animation:none}}"
    ].join("");
    document.head.appendChild(s);
  }

  // ---- 可拖动 ----
  function makeDraggable(el,posKey){
    var ox,oy,sx,sy,moved,dragging=false;
    function move(e){
      if(!dragging)return;
      if(Math.abs(e.clientX-sx)+Math.abs(e.clientY-sy)>4)moved=true;
      var w=el.offsetWidth,h=el.offsetHeight;
      el.style.left=clamp(e.clientX-ox,4,window.innerWidth-w-4)+"px";
      el.style.top=clamp(e.clientY-oy,4,window.innerHeight-h-4)+"px";
      e.preventDefault();
    }
    function up(){
      if(!dragging)return;dragging=false;el.classList.remove("dragging");
      document.removeEventListener("pointermove",move);document.removeEventListener("pointerup",up);
      if(moved){el._dragged=true;setTimeout(function(){el._dragged=false;},60);
        try{var r=el.getBoundingClientRect();locSet(posKey,JSON.stringify({left:r.left,top:r.top}));}catch(e){}}
    }
    el.addEventListener("pointerdown",function(e){
      if(e.button!=null&&e.button!==0)return;
      if(e.target.closest&&e.target.closest(".pill-x"))return;
      var r=el.getBoundingClientRect();
      el.style.left=r.left+"px";el.style.top=r.top+"px";el.style.right="auto";el.style.bottom="auto";
      ox=e.clientX-r.left;oy=e.clientY-r.top;sx=e.clientX;sy=e.clientY;moved=false;dragging=true;
      el.classList.add("dragging");
      document.addEventListener("pointermove",move);document.addEventListener("pointerup",up);
    });
    el.addEventListener("click",function(e){if(el._dragged){e.preventDefault();e.stopPropagation();}});
  }
  function applyPos(el,posKey,slotIdx){
    var raw=null;try{raw=JSON.parse(locGet(posKey)||"null");}catch(e){}
    if(raw&&typeof raw.left==="number"&&typeof raw.top==="number"){
      var w=el.offsetWidth||120,h=el.offsetHeight||40;
      el.style.left=clamp(raw.left,4,window.innerWidth-w-4)+"px";
      el.style.top=clamp(raw.top,4,window.innerHeight-h-4)+"px";
      el.style.right="auto";el.style.bottom="auto";
    } else {
      el.style.bottom=(20+slotIdx*48)+"px"; // 未拖过→按顺序叠放
    }
  }

  // ---- 浮标 ----
  // src: {id,href,label,dismissKey,posKey}
  function showPill(src){
    if(sesGet(src.dismissKey)==="1")return;
    injectCss();
    if(document.getElementById(src.id))return;
    var slotIdx=document.querySelectorAll(".w3o-pill.on").length;
    var a=document.createElement("a");a.id=src.id;a.className="w3o-pill";a.href=src.href;
    a.setAttribute("aria-label",src.label+"，点击进入直播（可拖动）");a.title="点击进入直播 · 可拖动";
    a.innerHTML='<span class="w3o-dot"></span>'+esc(src.label)+'<button class="pill-x" aria-label="关闭">✕</button>';
    a.querySelector(".pill-x").addEventListener("click",function(e){e.preventDefault();e.stopPropagation();sesSet(src.dismissKey,"1");if(a.parentNode)a.parentNode.removeChild(a);});
    makeDraggable(a,src.posKey);
    document.body.appendChild(a);
    a.classList.add("on");
    applyPos(a,src.posKey,slotIdx);
  }
  function hidePill(id){var a=document.getElementById(id);if(a&&a.parentNode)a.parentNode.removeChild(a);}

  // ---- 开课前「即将开始」小卡（仅盟主课堂有排期概念） ----
  var soon;
  function showSoon(c,srv){
    injectCss();var mins=Math.max(1,Math.round((c.start-srv)/60));
    if(!soon){soon=document.createElement("div");soon.id="w3oLiveSoon";document.body.appendChild(soon);}
    soon.innerHTML='<div class="st"><span class="w3o-dot em"></span>线上课堂即将开始</div>'
      +'<div class="tx">「'+esc(c.title||"线上课堂")+'」将在 '+mins+' 分钟后开始。</div>'
      +'<div class="acts"><a class="sb p" href="/live/">查看课程</a><button class="sb" id="w3oSoonOk">知道了</button></div>';
    soon.classList.add("on");
    document.getElementById("w3oSoonOk").onclick=function(){soon.classList.remove("on");};
  }

  // ---- 盟主线上直播 /live ----
  function checkMengzhu(){
    try{
      fetch(API+"/live/today",{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).then(function(d){
        if(!d||d.ok===false)return;
        if(d.popup){enabledMaster=(d.popup.enabled!==false);preRemindEnabled=(d.popup.preRemindEnabled!==false);preRemindMin=d.popup.preRemindMin||10;}
        if(!enabledMaster){hidePill("w3oPillMz");return;}
        var c=d.course,srv=d.serverTime||Math.floor(Date.now()/1000);
        if(c&&c.status==="live"&&c.start&&c.end&&srv>=c.start&&srv<c.end){
          showPill({id:"w3oPillMz",href:"/live/",label:"直播中",dismissKey:"w3o_pill_mz_"+((c.id||"x")+"_"+c.start),posKey:"w3o_pillpos_mz"});
        }else{
          hidePill("w3oPillMz");
          if(preRemindEnabled&&c&&(c.status==="soon"||c.status==="upcoming"||c.status==="waiting")&&c.start){
            var left=c.start-srv;
            if(left>0&&left<=preRemindMin*60){var sk="w3o_soon_"+((c.id||"x")+"_"+c.start);if(sesGet(sk)!=="1"){sesSet(sk,"1");showSoon(c,srv);}}
          }
        }
      }).catch(function(){});
    }catch(e){}
  }
  function run(){checkMengzhu();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run);else run();
})();
