/* 起源全站音频播放器 —— 「灵动胶囊」:平时缩成右下角小球(带进度圈)不挡内容,点一下展开成小条;
   跨页面持久:localStorage记住进度/曲目,翻页自动接着播。
   API: window.OriginPlayer.playList(items,index) / .play(url,title,cover) ; item={url,title,cover} */
(function(){
  "use strict";
  var LS="origin_player_v1";
  var ZH=document.documentElement.lang!=="en"&&!/^en/i.test(document.documentElement.lang||"");
  var A=null,BAR=null,items=[],idx=0,lastSave=0,POS=null,LIVE=false,LA=null,ONCLOSE=null,acTimer=null;
  var DRAGERS=[];
  function M(){return LIVE?LA:A;}
  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];});}
  function safe(u){u=String(u||"").trim();if(!/^https:\/\//i.test(u))return "";if(/[\s<>"'`\\]/.test(u))return "";try{var x=new URL(u);return x.protocol==="https:"?x.href:"";}catch(e){return "";}}
  function fmt(s){s=Math.max(0,Math.floor(s||0));var m=Math.floor(s/60),ss=s%60;return m+":"+(ss<10?"0":"")+ss;}
  function $(id){return document.getElementById(id);}

  function injectCss(){
    if($("op-style"))return;
    var s=document.createElement("style");s.id="op-style";
    s.textContent="#op-bar{position:fixed;right:16px;bottom:16px;z-index:2147483000;box-sizing:border-box;font-family:system-ui,-apple-system,'Microsoft YaHei',sans-serif;opacity:0;transform:translateY(24px);transition:opacity .25s,transform .25s;pointer-events:none}"
      +"#op-bar.on{opacity:1;transform:none;pointer-events:auto}"
      +"#op-bar *{box-sizing:border-box}"
      // 小球
      +"#op-ball{width:60px;height:60px;border-radius:50%;position:relative;cursor:pointer;touch-action:none;user-select:none;margin-left:auto;background:linear-gradient(135deg,#241a0e,#130d07);box-shadow:0 12px 30px rgba(0,0,0,.55);display:grid;place-items:center}"
      +"#op-ring{position:absolute;inset:-3px;border-radius:50%;background:conic-gradient(#f0d48a 0%,rgba(255,255,255,.15) 0);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 3px));mask:radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 3px))}"
      +"#op-ball:after{content:'';position:absolute;inset:0;border-radius:50%;border:1px solid #3a2a15}"
      +"#op-ballic{position:relative;z-index:1;color:#f0d48a;font-size:23px;line-height:1}"
      // 展开小条
      +"#op-pill{display:none;align-items:center;gap:10px;width:min(340px,calc(100vw - 28px));background:rgba(24,17,9,.97);border:1px solid #D6A84B;border-radius:999px;padding:7px 12px 7px 7px;box-shadow:0 16px 40px rgba(0,0,0,.6);backdrop-filter:blur(7px)}"
      +"#op-cover{flex:0 0 auto;width:44px;height:44px;border-radius:50%;border:0;cursor:pointer;position:relative;background:radial-gradient(circle at 35% 30%,#f0d48a,#b8842f);color:#1a1206;font-size:17px;display:grid;place-items:center;overflow:hidden;touch-action:none;user-select:none}"
      +"#op-cover img{width:100%;height:100%;object-fit:cover}"
      +"#op-mid{flex:1;min-width:0;cursor:pointer}"
      +"#op-t{font-size:13px;font-weight:700;color:#f0d48a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"
      +"#op-s{font-size:10.5px;color:#b79c74;margin-top:2px;display:flex;align-items:center;gap:7px;font-variant-numeric:tabular-nums}"
      +"#op-rate{flex:0 0 auto;cursor:pointer;color:#D6A84B;font-weight:700;border:1px solid #3a2a15;border-radius:6px;padding:0 5px;background:transparent;font-size:10px}"
      +"#op-pill .op-btn{flex:0 0 auto;border:1px solid #3a2a15;cursor:pointer;display:grid;place-items:center;background:rgba(255,255,255,.05);color:#f0d48a;border-radius:50%}"
      +"#op-prev,#op-next{width:30px;height:30px;font-size:14px}"
      +"#op-x{width:28px;height:28px;font-size:12px;color:#b79c74}"
      +"#op-pill .op-btn:hover{border-color:#D6A84B;color:#f0d48a}"
      +"#op-bar.op-open #op-ball{display:none}"
      +"#op-bar.op-open #op-pill{display:flex}"
      // 直播态:隐藏进度/上下曲/倍速
      +"#op-bar.op-live #op-prev,#op-bar.op-live #op-next,#op-bar.op-live #op-rate,#op-bar.op-live #op-s{display:none}"
      +"#op-bar.op-live #op-t{color:#ff8a8a}"
      +"#op-bar.op-live #op-ring{background:conic-gradient(#ff8a8a 100%,#ff8a8a 0)}";
    document.head.appendChild(s);
  }
  // 通用:某元素可拖动整条;未拖动(点按)则触发 onTap
  function draggable(el,onTap){
    var d={on:false,moved:false,sx:0,sy:0,ox:0,oy:0};
    function start(e){var t=e.touches&&e.touches[0];d.on=true;d.moved=false;d.sx=t?t.clientX:e.clientX;d.sy=t?t.clientY:e.clientY;var r=BAR.getBoundingClientRect();d.ox=r.left;d.oy=r.top;}
    function move(e){if(!d.on)return;var t=e.touches&&e.touches[0],cx=t?t.clientX:e.clientX,cy=t?t.clientY:e.clientY,dx=cx-d.sx,dy=cy-d.sy;if(Math.abs(dx)+Math.abs(dy)>5)d.moved=true;if(d.moved){BAR.style.left=(d.ox+dx)+"px";BAR.style.top=(d.oy+dy)+"px";BAR.style.right="auto";BAR.style.bottom="auto";if(e.cancelable&&e.type==="touchmove")e.preventDefault();}}
    function end(){if(!d.on)return;d.on=false;if(d.moved){clampPos();savePos();}else if(onTap){onTap();}}
    el.addEventListener("mousedown",start);
    el.addEventListener("touchstart",start,{passive:true});
    el.addEventListener("touchmove",move,{passive:false});
    el.addEventListener("touchend",end);
    DRAGERS.push({move:move,end:end});
  }
  function build(){
    if(BAR)return;
    injectCss();
    BAR=document.createElement("div");BAR.id="op-bar";
    BAR.innerHTML='<div id="op-ball"><div id="op-ring"></div><div id="op-ballic">▶</div></div>'
      +'<div id="op-pill">'
      +'<button id="op-cover" aria-label="play/pause">▶</button>'
      +'<div id="op-mid"><div id="op-t"></div>'
      +'<div id="op-s"><span id="op-tm"><span id="op-cur">0:00</span> / <span id="op-dur">0:00</span></span>'
      +'<button id="op-rate" aria-label="'+(ZH?"倍速":"speed")+'">1x</button></div></div>'
      +'<button class="op-btn" id="op-prev" aria-label="'+(ZH?"上一节":"prev")+'">⏮</button>'
      +'<button class="op-btn" id="op-next" aria-label="'+(ZH?"下一节":"next")+'">⏭</button>'
      +'<button class="op-btn" id="op-x" aria-label="close">✕</button></div>';
    (document.body||document.documentElement).appendChild(BAR);
    // 小球:拖动=移动,点按=展开
    draggable($("op-ball"),expand);
    // 封面:拖动=移动,点按=播放/暂停
    draggable($("op-cover"),function(){toggle();arm();});
    // 标题区:点一下收回小球
    $("op-mid").addEventListener("click",function(e){if(e.target&&e.target.id==="op-rate")return;collapse();});
    $("op-next").onclick=function(){go(1);arm();};
    $("op-prev").onclick=function(){go(-1);arm();};
    $("op-x").onclick=function(){if(LIVE)endLive();else stop();};
    var rates=[1,1.25,1.5,2,0.75];
    $("op-rate").onclick=function(e){e.stopPropagation();if(!A)return;var i=rates.indexOf(A.playbackRate);i=(i+1)%rates.length;A.playbackRate=rates[i];$("op-rate").textContent=rates[i]+"x";arm();save();};
    // 一次性的 document 级鼠标事件,派发给活动中的拖动
    document.addEventListener("mousemove",function(e){for(var i=0;i<DRAGERS.length;i++)DRAGERS[i].move(e);});
    document.addEventListener("mouseup",function(e){for(var i=0;i<DRAGERS.length;i++)DRAGERS[i].end(e);});
    window.addEventListener("resize",function(){clampPos();});
    applyPos();
  }
  // 展开/收起 + 自动收回
  function expand(){if(!BAR)return;BAR.classList.add("op-open");clampPos();arm();}
  function collapse(){if(!BAR)return;BAR.classList.remove("op-open");if(acTimer){clearTimeout(acTimer);acTimer=null;}clampPos();}
  function arm(){if(acTimer)clearTimeout(acTimer);acTimer=setTimeout(function(){collapse();},8000);}// 8秒没动缩回小球

  function savePos(){var r=BAR.getBoundingClientRect();POS={x:r.left,y:r.top};try{localStorage.setItem("origin_player_pos",JSON.stringify(POS));}catch(e){}}
  function clampPos(){if(!BAR||!BAR.style.left)return;var r=BAR.getBoundingClientRect(),x=Math.min(Math.max(6,parseFloat(BAR.style.left)),window.innerWidth-r.width-6),y=Math.min(Math.max(6,parseFloat(BAR.style.top)),window.innerHeight-r.height-6);BAR.style.left=x+"px";BAR.style.top=y+"px";BAR.style.right="auto";BAR.style.bottom="auto";}
  function applyPos(){if(!BAR)return;if(!POS){try{POS=JSON.parse(localStorage.getItem("origin_player_pos"));}catch(e){POS=null;}}if(POS&&typeof POS.x==="number"){BAR.style.left=POS.x+"px";BAR.style.top=POS.y+"px";BAR.style.right="auto";BAR.style.bottom="auto";clampPos();}}
  function ensureAudio(){
    if(A)return A;
    A=document.createElement("audio");A.id="op-audio";A.preload="metadata";
    A.setAttribute("playsinline","");A.setAttribute("webkit-playsinline","");
    (document.body||document.documentElement).appendChild(A);
    A.addEventListener("play",sync);A.addEventListener("pause",sync);
    A.addEventListener("playing",function(){media();try{navigator.mediaSession.playbackState="playing";}catch(e){}});
    A.addEventListener("timeupdate",function(){sync();var t=Date.now();if(t-lastSave>2500){lastSave=t;save();}});
    A.addEventListener("loadedmetadata",sync);
    A.addEventListener("ended",function(){if(items.length>1)go(1);else{sync();save();}});
    return A;
  }
  function media(){
    try{if(!("mediaSession" in navigator))return;var c=items[idx]||{};
      var cov=c.cover||"https://web3origin.com/assets/og-image.png";// 锁屏需要封面图,没有就用站点默认图
      var art=[{src:cov,sizes:"256x256"},{src:cov,sizes:"512x512"}];
      navigator.mediaSession.metadata=new MediaMetadata({title:c.title||(LIVE?(ZH?"起源直播":"Origin Live"):(ZH?"回放":"Replay")),artist:ZH?"起源线上课堂":"Origin Live",album:"Origin",artwork:art});
      navigator.mediaSession.setActionHandler("play",function(){var m=M();m&&m.play();});
      navigator.mediaSession.setActionHandler("pause",function(){var m=M();m&&m.pause();});
      navigator.mediaSession.setActionHandler("seekbackward",LIVE?null:function(){if(A)A.currentTime=Math.max(0,A.currentTime-15);});
      navigator.mediaSession.setActionHandler("seekforward",LIVE?null:function(){if(A)A.currentTime=Math.min(A.duration||1e9,A.currentTime+15);});
      navigator.mediaSession.setActionHandler("nexttrack",(!LIVE&&items.length>1)?function(){go(1);}:null);
      navigator.mediaSession.setActionHandler("previoustrack",(!LIVE&&items.length>1)?function(){go(-1);}:null);
    }catch(e){}
  }
  function sync(){
    var m=M();if(!m||!BAR)return;var g=m.paused?"▶":"⏸";
    var bi=$("op-ballic"),cv=$("op-cover");if(bi)bi.textContent=g;if(cv&&!cv.querySelector("img"))cv.textContent=g;
    try{if("mediaSession" in navigator)navigator.mediaSession.playbackState=m.paused?"paused":"playing";}catch(e){}
    if(LIVE)return;
    var d=m.duration||0,p=d?(m.currentTime/d):0,cu=$("op-cur"),du=$("op-dur"),ring=$("op-ring");
    if(cu)cu.textContent=fmt(m.currentTime);if(du&&d)du.textContent=fmt(d);
    if(ring)ring.style.background="conic-gradient(#f0d48a "+(p*100).toFixed(1)+"%,rgba(255,255,255,.15) 0)";
    var pv=$("op-prev"),nx=$("op-next");if(pv)pv.style.display=items.length>1?"":"none";if(nx)nx.style.display=items.length>1?"":"none";
  }
  function paint(){
    if(!BAR)return;var c=items[idx]||{};
    var cv=$("op-cover"),tt=$("op-t");
    if(cv)cv.innerHTML=c.cover?'<img src="'+esc(c.cover)+'" alt="">':(M()&&!M().paused?"⏸":"▶");
    if(tt)tt.textContent=(LIVE?("🔴 "+(ZH?"直播":"LIVE")+" · "):"")+(c.title||(ZH?"回放":"Replay"));
    if($("op-rate"))$("op-rate").textContent=((A&&A.playbackRate)||1)+"x";
  }
  function show(){build();BAR.classList.add("on");BAR.classList.toggle("op-live",!!LIVE);paint();sync();applyPos();}
  function toggle(){var m=M();if(!m)return;if(m.paused){var p=m.play();if(p&&p.catch)p.catch(function(){});}else m.pause();}
  function loadIdx(i,seekTo,autoplay){
    var c=items[i];if(!c||!c.url)return;idx=i;ensureAudio();
    A.src=c.url;if(seekTo)try{A.currentTime=seekTo;}catch(e){}
    show();media();expand();// 新点开一节:先展开让用户看到,几秒后自动缩回小球
    if(autoplay!==false){var p=A.play();if(p&&p.catch)p.catch(function(){sync();});}
    save();
  }
  function go(d){if(!items.length)return;var i=(idx+d+items.length)%items.length;loadIdx(i,0,true);}
  function stop(){if(A){try{A.pause();}catch(e){}A.removeAttribute("src");try{A.load();}catch(e){}}items=[];idx=0;if(BAR){BAR.classList.remove("on");BAR.classList.remove("op-open");}try{localStorage.removeItem(LS);}catch(e){}}
  function save(){if(LIVE)return;try{if(!items.length){localStorage.removeItem(LS);return;}localStorage.setItem(LS,JSON.stringify({items:items,idx:idx,time:A?A.currentTime:0,rate:A?A.playbackRate:1,playing:!!(A&&!A.paused)}));}catch(e){}}

  function norm(list){return (list||[]).map(function(c){return {url:safe(c.url||c.play_url),title:String(c.title||"").slice(0,120),cover:safe(c.cover||"")};}).filter(function(c){return c.url;});}
  // ===== 直播:播放器自己接管(纯音频),跨页面续播(本地标记+重新取流) =====
  var API="https://count.web3origin.com",LHLS=null,liveT=null;
  var LIVEMARK="origin_player_live";
  function isiOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent||"")||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);}
  function ensureLA(){if(LA)return LA;LA=document.createElement("audio");LA.setAttribute("playsinline","");LA.setAttribute("webkit-playsinline","");(document.body||document.documentElement).appendChild(LA);LA.addEventListener("play",sync);LA.addEventListener("pause",sync);LA.addEventListener("playing",function(){media();try{navigator.mediaSession.playbackState="playing";}catch(e){}});return LA;}
  function loadHls(cb){if(window.Hls){cb();return;}var ex=document.getElementById("op-hls");if(ex){var t=setInterval(function(){if(window.Hls){clearInterval(t);cb();}},200);setTimeout(function(){clearInterval(t);cb();},8000);return;}var s=document.createElement("script");s.id="op-hls";s.src="/assets/hls.min.js";s.onload=function(){cb();};s.onerror=function(){cb();};document.head.appendChild(s);}
  function fetchStream(){return fetch(API+"/live/stream").then(function(r){return r.json();}).catch(function(){return null;});}
  function playLiveUrl(url){var a=ensureLA();if(LHLS){try{LHLS.destroy();}catch(e){}LHLS=null;}
    // iOS 必须用原生HLS(hls.js的MSE在iOS锁屏/后台会被系统掐掉,原生才能后台放)
    if(isiOS()||a.canPlayType("application/vnd.apple.mpegurl")){a.src=url;var p=a.play();if(p&&p.catch)p.catch(function(){});media();}
    else{loadHls(function(){if(window.Hls&&window.Hls.isSupported()){var h=new window.Hls({liveDurationInfinity:true,enableWorker:true,lowLatencyMode:false,liveSyncDurationCount:8,liveMaxLatencyDurationCount:40,maxBufferLength:90,maxMaxBufferLength:180,backBufferLength:30,fragLoadingMaxRetry:10,manifestLoadingMaxRetry:8,levelLoadingMaxRetry:8});LHLS=h;h.loadSource(url);h.attachMedia(a);h.on(window.Hls.Events.ERROR,function(e,d){if(d&&d.fatal)refreshLive();});var p2=a.play&&a.play();if(p2&&p2.catch)p2.catch(function(){});}else{a.src=url;a.play&&a.play();}});}}
  function refreshLive(){fetchStream().then(function(r){if(r&&r.ok&&r.live&&r.streamUrl)playLiveUrl(r.streamUrl);else endLive();});}
  function checkLive(){if(!LIVE)return;fetchStream().then(function(r){if(!r||!r.ok||!r.live)endLive();});}
  function startLive(meta){meta=meta||{};LIVE=true;ONCLOSE=meta.onClose||null;items=[{url:"",title:String(meta.title||(ZH?"起源直播":"Origin Live")).slice(0,120),cover:safe(meta.cover||"")}];idx=0;ensureLA();
    try{localStorage.setItem(LIVEMARK,JSON.stringify({title:items[0].title,cover:items[0].cover}));}catch(e){}
    build();show();media();sync();expand();
    fetchStream().then(function(r){if(r&&r.ok&&r.live&&r.streamUrl)playLiveUrl(r.streamUrl);else endLive();});
    if(!liveT)liveT=setInterval(checkLive,30000);}
  function endLive(){LIVE=false;if(LHLS){try{LHLS.destroy();}catch(e){}LHLS=null;}if(LA){try{LA.pause();}catch(e){}LA.removeAttribute("src");try{LA.load();}catch(e){}}if(liveT){clearInterval(liveT);liveT=null;}try{localStorage.removeItem(LIVEMARK);}catch(e){}items=[];if(BAR){BAR.classList.remove("op-live");BAR.classList.remove("op-open");BAR.classList.remove("on");}try{if("mediaSession" in navigator)navigator.mediaSession.playbackState="none";}catch(e){}var cb=ONCLOSE;ONCLOSE=null;if(cb)try{cb();}catch(e){}}
  window.OriginPlayer={
    playList:function(list,i){var L=norm(list);if(!L.length)return;if(LIVE)endLive();items=L;loadIdx(Math.max(0,Math.min(i||0,L.length-1)),0,true);},
    play:function(url,title,cover){this.playList([{url:url,title:title,cover:cover}],0);},
    startLive:startLive,
    stopLive:endLive,
    isLive:function(){return !!LIVE;},
    current:function(){return items[idx]||null;},
    isActive:function(){return items.length>0||!!LIVE;}
  };

  // 翻页恢复:读上次状态,续播(自动播放被拦时显示▶,点一下继续)。恢复时保持小球态,不打扰。
  function restore(){
    var lv=null;try{lv=JSON.parse(localStorage.getItem(LIVEMARK));}catch(e){lv=null;}
    if(lv){startLive({title:lv.title,cover:lv.cover});return;}
    var st;try{st=JSON.parse(localStorage.getItem(LS));}catch(e){st=null;}
    if(!st||!st.items||!st.items.length)return;
    items=norm(st.items);if(!items.length)return;idx=Math.max(0,Math.min(st.idx||0,items.length-1));
    ensureAudio();A.src=items[idx].url;if(st.rate)A.playbackRate=st.rate;
    var seekTo=st.time||0;A.addEventListener("loadedmetadata",function once(){A.removeEventListener("loadedmetadata",once);try{A.currentTime=seekTo;}catch(e){}sync();});
    show();media();// 保持小球态(不expand)
    if(st.playing){var p=A.play();if(p&&p.catch)p.catch(function(){sync();});}
  }
  window.addEventListener("pagehide",save);window.addEventListener("beforeunload",save);
  document.addEventListener("visibilitychange",function(){if(document.hidden)save();});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",restore);else restore();
})();
