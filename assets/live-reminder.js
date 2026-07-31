/* 起源线上课堂 · 直播开始自动提醒
   打开网站→查真实直播状态(/live/today)→直播中弹提醒(用户自选进入/继续浏览/本次不再提醒)。
   不自动跳转、不自动播放声音、不用假数据；接口异常静默隐藏。数据来自现有直播状态机。 */
(function(){
  "use strict";
  var API="https://count.web3origin.com";
  var LIVE_PATH="/live/";
  // 直播页本身不提醒
  var path=location.pathname||"";
  if(path===LIVE_PATH||path.indexOf(LIVE_PATH)===0||path.indexOf("/live")===0)return;

  var DEF={enabled:true,preRemindEnabled:true,preRemindMin:10,snoozeMin:30,floatingEntry:true,
    btnEnter:"立即进入直播",btnLater:"继续浏览网站",btnNoMore:"本次访问不再提醒",livePath:LIVE_PATH};
  var CFG=DEF;

  // ---- 本地存储：尊重用户选择、防重复 ----
  function sesGet(k){try{return sessionStorage.getItem(k);}catch(e){return null;}}
  function sesSet(k,v){try{sessionStorage.setItem(k,v);}catch(e){}}
  function locGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function locSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
  var K_NOMORE="w3o_live_nomore";           // 本次访问不再提醒(会话级)
  var K_SNOOZE="w3o_live_snooze";            // 稍后再看，30分钟(带过期)
  function liveKey(c){return "w3o_live_shown_"+(c.id||c.title||"x")+"_"+(c.start||0);}
  function isSnoozed(){var t=Number(locGet(K_SNOOZE))||0;return t>Date.now();}
  function noMoreThisSession(){return sesGet(K_NOMORE)==="1";}

  // ---- 样式(注入，翡翠绿呼吸灯 + 黑金) ----
  function injectCss(){
    if(document.getElementById("w3o-live-css"))return;
    var s=document.createElement("style");s.id="w3o-live-css";
    s.textContent=[
"#w3oLiveWrap,#w3oLiveFab,#w3oLiveSoon{font-family:'Microsoft YaHei','PingFang SC',system-ui,sans-serif;box-sizing:border-box}",
"#w3oLiveWrap *,#w3oLiveSoon *{box-sizing:border-box}",
"#w3oLiveWrap{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;background:rgba(2,1,1,.72);backdrop-filter:blur(3px);padding:16px}",
"#w3oLiveWrap.on{display:flex}",
".w3o-live-card{width:100%;max-width:420px;background:linear-gradient(180deg,#0e0b08,#0a0d0b);border:1px solid #2f7d4f;border-radius:16px;overflow:hidden;box-shadow:0 0 42px rgba(61,220,138,.22),0 10px 40px rgba(0,0,0,.6);position:relative;color:#e8d9be}",
".w3o-live-close{position:absolute;top:10px;right:10px;z-index:3;width:34px;height:34px;border-radius:50%;border:1px solid #3a2313;background:rgba(12,10,8,.8);color:#f1dfc0;font-size:18px;cursor:pointer;line-height:1}",
".w3o-live-cover{position:relative;width:100%;aspect-ratio:16/9;background:#07100b center/cover no-repeat;border-bottom:1px solid #26301f}",
".w3o-live-badge{position:absolute;left:12px;top:12px;display:flex;align-items:center;gap:7px;background:rgba(122,11,18,.85);border:1px solid #ff8a8a;color:#ffe3e3;font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;letter-spacing:.05em}",
".w3o-dot{width:9px;height:9px;border-radius:50%;background:#ff4d4d;box-shadow:0 0 0 0 rgba(255,77,77,.7);animation:w3oPulse 1.6s infinite}",
".w3o-dot.em{background:#3ddc8a;box-shadow:0 0 0 0 rgba(61,220,138,.7)}",
"@keyframes w3oPulse{0%{box-shadow:0 0 0 0 rgba(255,77,77,.6)}70%{box-shadow:0 0 0 8px rgba(255,77,77,0)}100%{box-shadow:0 0 0 0 rgba(255,77,77,0)}}",
".w3o-live-body{padding:16px 18px 18px}",
".w3o-live-h{font-family:'STZhongsong','Songti SC',serif;color:#f1dfc0;font-size:19px;margin:0 0 6px}",
".w3o-live-intro{color:#b79c74;font-size:13.5px;line-height:1.6;margin:0 0 12px}",
".w3o-live-info{border:1px solid #26301f;border-radius:10px;overflow:hidden;margin-bottom:14px}",
".w3o-live-info .r{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;align-items:start;padding:8px 12px;font-size:13px;border-top:1px solid #191d16}",
".w3o-live-info .r:first-child{border-top:0}",
".w3o-live-info .k{color:#7c6a4f;white-space:nowrap}",".w3o-live-info .v{color:#e8d9be;text-align:right;min-width:0;overflow-wrap:anywhere}",
".w3o-live-info .v.live{color:#3ddc8a;font-weight:700}",
".w3o-btn{display:block;width:100%;text-align:center;text-decoration:none;border-radius:11px;font-size:15px;font-weight:700;padding:12px;cursor:pointer;border:1px solid #3a2313}",
".w3o-btn.primary{background:linear-gradient(180deg,#2a6b47,#1c4d33);border-color:#2f7d4f;color:#eafff2;box-shadow:0 0 18px rgba(61,220,138,.25);margin-bottom:9px}",
".w3o-btn.ghost{background:#141009;color:#f1dfc0;margin-bottom:9px}",
".w3o-btn.mini{background:transparent;border:0;color:#7c6a4f;font-size:12.5px;font-weight:400;padding:4px;text-decoration:underline}",
".w3o-btn:focus-visible{outline:2px solid #f0d48a;outline-offset:2px}",
"#w3oLiveFab{position:fixed;right:16px;bottom:20px;z-index:99990;display:none;align-items:center;gap:8px;background:linear-gradient(180deg,#0e0b08,#0a0d0b);border:1px solid #2f7d4f;color:#eafff2;font-size:13px;font-weight:700;padding:9px 14px;border-radius:24px;cursor:pointer;box-shadow:0 0 20px rgba(61,220,138,.3),0 6px 18px rgba(0,0,0,.5)}",
"#w3oLiveFab.on{display:flex}",
"#w3oLiveSoon{position:fixed;right:16px;bottom:20px;z-index:99988;display:none;max-width:300px;background:linear-gradient(180deg,#0e0b08,#0a0d0b);border:1px solid #3a2313;border-left:3px solid #3ddc8a;border-radius:12px;padding:12px 14px;color:#e8d9be;box-shadow:0 8px 26px rgba(0,0,0,.5)}",
"#w3oLiveSoon.on{display:block}",
"#w3oLiveSoon .st{display:flex;align-items:center;gap:7px;font-size:13px;color:#3ddc8a;font-weight:700;margin-bottom:6px}",
"#w3oLiveSoon .tx{font-size:13.5px;color:#e8d9be;margin-bottom:10px}",
"#w3oLiveSoon .acts{display:flex;gap:8px}",
"#w3oLiveSoon .sb{flex:1;text-align:center;border-radius:8px;font-size:13px;padding:8px;cursor:pointer;border:1px solid #3a2313;text-decoration:none}",
"#w3oLiveSoon .sb.p{background:linear-gradient(180deg,#2a6b47,#1c4d33);border-color:#2f7d4f;color:#eafff2}",
"#w3oLiveSoon .sb.g{background:#141009;color:#f1dfc0}",
"@media(max-width:600px){",
"  #w3oLiveWrap{align-items:flex-end;padding:0}",
"  .w3o-live-card{max-width:100%;border-radius:18px 18px 0 0;border-bottom:0}",
"  #w3oLiveFab{bottom:84px;right:12px}",
"  #w3oLiveSoon{left:12px;right:12px;max-width:none;bottom:84px}",
"}",
"@media(prefers-reduced-motion:reduce){.w3o-dot{animation:none}}"
    ].join("");
    document.head.appendChild(s);
  }

  // ---- 工具 ----
  function esc(s){return String(s==null?"":s).replace(/[&<>\"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function hm(sec){try{return new Intl.DateTimeFormat("zh-CN",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"Asia/Shanghai"}).format(new Date(sec*1000));}catch(e){var d=new Date(sec*1000);return ("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2);}}
  function dur(sec){sec=Math.max(0,Math.floor(sec));var h=Math.floor(sec/3600),m=Math.floor(sec%3600/60);return h>0?(h+" 小时 "+m+" 分"):(m+" 分钟");}

  var STC={live:"直播进行中",waiting:"等待开课",soon:"即将开始",scheduled:"课程已安排",upcoming:"课程已安排",paused:"直播暂时中断",ended:"今日课程已结束",replay:"回放",unavailable:"暂时无法确认",unknown:"暂时无法确认"};

  // ---- DOM ----
  var wrap,fab,soon,lastFocus,curCourse;
  function goLive(){location.href=CFG.livePath||LIVE_PATH;}
  function buildModal(c,srv){
    var elapsed=srv&&c.start?dur(srv-c.start):"";
    var cover=c.cover_url?("background-image:url('"+String(c.cover_url).replace(/'/g,"%27")+"')"):"";
    var rows=""
      +'<div class="r"><span class="k">直播标题</span><span class="v">'+esc(c.title||"线上课堂")+'</span></div>'
      +(c.teacher_name?'<div class="r"><span class="k">主讲人</span><span class="v">'+esc(c.teacher_name)+'</span></div>':"")
      +(c.start?'<div class="r"><span class="k">开始时间</span><span class="v">'+hm(c.start)+'</span></div>':"")
      +(elapsed?'<div class="r"><span class="k">已直播</span><span class="v live">'+elapsed+'</span></div>':"")
      +(c.end?'<div class="r"><span class="k">预计结束</span><span class="v">'+hm(c.end)+'</span></div>':"")
      +'<div class="r"><span class="k">当前状态</span><span class="v live">'+esc(STC[c.status]||"直播进行中")+'</span></div>';
    wrap.innerHTML='<div class="w3o-live-card" role="dialog" aria-modal="true" aria-label="起源线上课堂正在直播">'
      +'<button class="w3o-live-close" id="w3oLiveX" aria-label="关闭">×</button>'
      +'<div class="w3o-live-cover" style="'+cover+'"><span class="w3o-live-badge"><span class="w3o-dot"></span>LIVE · 直播进行中</span></div>'
      +'<div class="w3o-live-body">'
      +'<h3 class="w3o-live-h">起源线上课堂正在直播</h3>'
      +'<p class="w3o-live-intro">今天的线上课程已经开始，你可以立即进入直播间观看，也可以继续浏览网站。</p>'
      +'<div class="w3o-live-info">'+rows+'</div>'
      +'<a class="w3o-btn primary" id="w3oLiveGo" href="'+esc(CFG.livePath||LIVE_PATH)+'">'+esc(CFG.btnEnter||DEF.btnEnter)+'</a>'
      +'<button class="w3o-btn ghost" id="w3oLiveLater">'+esc(CFG.btnLater||DEF.btnLater)+'</button>'
      +'<button class="w3o-btn mini" id="w3oLiveNoMore">'+esc(CFG.btnNoMore||DEF.btnNoMore)+'</button>'
      +'</div></div>';
    document.getElementById("w3oLiveX").onclick=function(){closeModal("close");};
    document.getElementById("w3oLiveLater").onclick=function(){closeModal("later");};
    document.getElementById("w3oLiveNoMore").onclick=function(){closeModal("nomore");};
    // 进入直播用a的默认跳转(本站/live/)，无需拦截
  }
  function openModal(c,srv){
    injectCss();curCourse=c;hideFab();
    if(!wrap){wrap=document.createElement("div");wrap.id="w3oLiveWrap";document.body.appendChild(wrap);
      wrap.addEventListener("click",function(e){if(e.target===wrap)closeModal("close");});}
    buildModal(c,srv);
    lastFocus=document.activeElement;wrap.classList.add("on");
    var go=document.getElementById("w3oLiveGo");if(go)go.focus();
    if(!window.__w3oLiveEsc__){window.__w3oLiveEsc__=true;
      document.addEventListener("keydown",function(e){if(e.key==="Escape"&&wrap&&wrap.classList.contains("on"))closeModal("close");});
      window.addEventListener("popstate",function(){if(wrap&&wrap.classList.contains("on"))closeModal("close");});}
    try{history.pushState({w3oLive:1},"");}catch(e){}
  }
  function closeModal(reason){
    if(!wrap)return;wrap.classList.remove("on");
    if(reason==="later")locSet(K_SNOOZE,String(Date.now()+ (CFG.snoozeMin||30)*60000));
    if(reason==="nomore")sesSet(K_NOMORE,"1");
    if(lastFocus)try{lastFocus.focus();}catch(e){}
    showFab(); // 关闭后保留右下角入口(若仍直播)
  }
  function showFab(){
    if(!CFG.floatingEntry||!curCourse||curCourse.status!=="live")return;
    injectCss();
    if(!fab){fab=document.createElement("button");fab.id="w3oLiveFab";fab.type="button";
      fab.innerHTML='<span class="w3o-dot"></span>正在直播';
      fab.onclick=function(){if(curCourse)openModal(curCourse,curSrv);};
      document.body.appendChild(fab);}
    fab.classList.add("on");
  }
  function hideFab(){if(fab)fab.classList.remove("on");}

  // ---- 即将开始提示(非全屏) ----
  function showSoon(c,srv){
    injectCss();var mins=Math.max(1,Math.round((c.start-srv)/60));
    if(!soon){soon=document.createElement("div");soon.id="w3oLiveSoon";document.body.appendChild(soon);}
    soon.innerHTML='<div class="st"><span class="w3o-dot em"></span>线上课堂即将开始</div>'
      +'<div class="tx">「'+esc(c.title||"线上课堂")+'」将在 '+mins+' 分钟后开始。</div>'
      +'<div class="acts"><a class="sb p" href="'+esc(CFG.livePath||LIVE_PATH)+'">查看课程</a><button class="sb g" id="w3oSoonOk">知道了</button></div>';
    soon.classList.add("on");
    document.getElementById("w3oSoonOk").onclick=function(){soon.classList.remove("on");};
  }

  // ---- 主逻辑 ----
  var curSrv=0;
  function decide(d){
    if(!d||d.ok===false)return;              // 接口异常→静默
    if(d.popup)CFG=Object.assign({},DEF,d.popup);
    if(CFG.enabled===false)return;
    var c=d.course,srv=d.serverTime||Math.floor(Date.now()/1000);curSrv=srv;
    if(!c||!c.status)return;                  // 无课→不弹
    // 直播中
    if(c.status==="live" && c.start && c.end && srv>=c.start && srv<c.end){
      curCourse=c;
      var shownKey=liveKey(c);
      if(noMoreThisSession()||isSnoozed()||sesGet(shownKey)==="1"){showFab();return;} // 尊重用户选择→只留右下角入口
      sesSet(shownKey,"1");                    // 本场本次访问只自动弹一次
      openModal(c,srv);                        // 关闭后再显示右下角入口
      return;
    }
    hideFab();
    // 即将开始(开课前 preRemindMin 分钟内)
    if(CFG.preRemindEnabled!==false && (c.status==="soon"||c.status==="upcoming"||c.status==="waiting") && c.start){
      var left=c.start-srv;
      if(left>0 && left<=(CFG.preRemindMin||10)*60){
        var sk="w3o_live_soon_"+(c.id||c.title||"x")+"_"+(c.start||0);
        if(sesGet(sk)!=="1"){sesSet(sk,"1");showSoon(c,srv);}
      }
    }
  }

  function run(){
    // 预览注入：window.__LIVE_REMINDER_MOCK__
    if(window.__LIVE_REMINDER_MOCK__){decide(window.__LIVE_REMINDER_MOCK__);return;}
    try{
      fetch(API+"/live/today",{cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).then(function(d){decide(d);}).catch(function(){});
    }catch(e){}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run);else run();
})();
