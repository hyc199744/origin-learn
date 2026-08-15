/* 起源全站音频播放器 —— 跨页面持久:底部常驻播放条,用localStorage记住进度/曲目,翻页自动接着播。
   API: window.OriginPlayer.playList(items,index) / .play(url,title,cover) ; item={url,title,cover} */
(function(){
  "use strict";
  var LS="origin_player_v1";
  var ZH=document.documentElement.lang!=="en"&&!/^en/i.test(document.documentElement.lang||"");
  var A=null,BAR=null,items=[],idx=0,lastSave=0,drag=false,POS=null,LIVE=false,LA=null,ONCLOSE=null;
  function M(){return LIVE?LA:A;}
  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];});}
  function safe(u){u=String(u||"").trim();if(!/^https:\/\//i.test(u))return "";if(/[\s<>"'`\\]/.test(u))return "";try{var x=new URL(u);return x.protocol==="https:"?x.href:"";}catch(e){return "";}}
  function fmt(s){s=Math.max(0,Math.floor(s||0));var m=Math.floor(s/60),ss=s%60;return m+":"+(ss<10?"0":"")+ss;}
  function $(id){return document.getElementById(id);}

  function injectCss(){
    if($("op-style"))return;
    var s=document.createElement("style");s.id="op-style";
    s.textContent="#op-bar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%) translateY(160%);z-index:2147483000;display:flex;align-items:center;gap:11px;width:min(560px,94vw);padding:10px 12px;"
      +"background:rgba(14,11,7,.97);border:1px solid #D6A84B;border-radius:15px;box-shadow:0 16px 46px rgba(0,0,0,.6);backdrop-filter:blur(7px);opacity:0;transition:.3s;pointer-events:none;font-family:system-ui,-apple-system,'Microsoft YaHei',sans-serif}"
      +"#op-bar.on{transform:translateX(-50%) translateY(0);opacity:1;pointer-events:auto}"
      +"#op-art{flex:0 0 auto;width:44px;height:44px;border-radius:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:22px;background:linear-gradient(135deg,rgba(214,168,75,.32),rgba(214,168,75,.06));border:1px solid #3a2313}"
      +"#op-art img{width:100%;height:100%;object-fit:cover}"
      +"#op-mid{flex:1;min-width:0}"
      +"#op-t{font-size:13.5px;color:#f0d48a;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"
      +"#op-row{display:flex;align-items:center;gap:8px;margin-top:6px}"
      +"#op-cur,#op-dur{font-size:11px;color:#b79c74;font-variant-numeric:tabular-nums;flex:0 0 auto;min-width:32px;text-align:center}"
      +"#op-bar-p{position:relative;flex:1;height:5px;background:rgba(255,255,255,.14);border-radius:999px;cursor:pointer;touch-action:none}"
      +"#op-fill{position:absolute;left:0;top:0;height:100%;width:0;background:linear-gradient(90deg,#D6A84B,#f0d48a);border-radius:999px}"
      +"#op-knob{position:absolute;top:50%;left:0;width:12px;height:12px;border-radius:50%;background:#f0d48a;transform:translate(-50%,-50%);box-shadow:0 2px 6px rgba(0,0,0,.45)}"
      +".op-btn{flex:0 0 auto;border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;background:transparent;color:#f0d48a}"
      +"#op-prev,#op-next{width:30px;height:30px;font-size:15px;border-radius:50%;border:1px solid #3a2313;background:rgba(255,255,255,.04)}"
      +"#op-play{width:42px;height:42px;font-size:16px;border-radius:50%;background:linear-gradient(135deg,#f0d48a,#b8842f);color:#1a1206;box-shadow:0 6px 16px rgba(214,168,75,.35)}"
      +"#op-rate{width:42px;height:30px;border-radius:8px;border:1px solid #3a2313;background:rgba(255,255,255,.04);color:#b79c74;font-size:12px;font-weight:700;font-variant-numeric:tabular-nums}"
      +"#op-x,#op-collapse{width:28px;height:28px;border-radius:7px;border:1px solid #3a2313;color:#b79c74;font-size:13px}"
      +".op-btn:hover{color:#f0d48a;border-color:#D6A84B}"
      +"#op-ctrls{flex:0 0 auto;display:flex;align-items:center;gap:7px}"
      +"#op-art{cursor:grab;touch-action:none;user-select:none}#op-art:active{cursor:grabbing}"
      +"#op-bar.op-min{width:auto;min-width:0;padding:0;background:transparent;border:0;box-shadow:none;backdrop-filter:none;gap:0}"
      +"#op-bar.op-min #op-mid,#op-bar.op-min #op-ctrls{display:none}"
      +"#op-bar.op-min #op-art{width:58px;height:58px;border-radius:50%;border:2px solid #D6A84B;box-shadow:0 12px 32px rgba(0,0,0,.55);font-size:26px;position:relative}"
      +"#op-bar.op-min #op-art:after{content:'▸';position:absolute;right:-3px;bottom:-3px;width:21px;height:21px;border-radius:50%;background:#D6A84B;color:#1a1206;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 7px rgba(0,0,0,.45)}"
      +"#op-bar.op-live #op-row,#op-bar.op-live #op-rate,#op-bar.op-live #op-prev,#op-bar.op-live #op-next{display:none}"
      +"#op-bar.op-live #op-t{color:#ff8a8a}"
      +"@media(max-width:640px){#op-bar{bottom:78px;gap:8px;padding:9px 10px}#op-rate{display:none}#op-prev{display:none}}";
    document.head.appendChild(s);
  }
  function build(){
    if(BAR)return;
    injectCss();
    BAR=document.createElement("div");BAR.id="op-bar";
    BAR.innerHTML='<div id="op-art"></div>'
      +'<div id="op-mid"><div id="op-t"></div>'
      +'<div id="op-row"><span id="op-cur">0:00</span>'
      +'<div id="op-bar-p"><div id="op-fill"></div><div id="op-knob"></div></div>'
      +'<span id="op-dur">0:00</span></div></div>'
      +'<div id="op-ctrls">'
      +'<button class="op-btn" id="op-prev" aria-label="'+(ZH?"上一节":"prev")+'">⏮</button>'
      +'<button class="op-btn" id="op-play" aria-label="play/pause">▶</button>'
      +'<button class="op-btn" id="op-next" aria-label="'+(ZH?"下一节":"next")+'">⏭</button>'
      +'<button class="op-btn" id="op-rate" aria-label="'+(ZH?"倍速":"speed")+'">1x</button>'
      +'<button class="op-btn" id="op-collapse" aria-label="'+(ZH?"收起":"minimize")+'">▾</button>'
      +'<button class="op-btn" id="op-x" aria-label="close">✕</button></div>';
    (document.body||document.documentElement).appendChild(BAR);
    $("op-play").onclick=toggle;
    $("op-next").onclick=function(){go(1);};
    $("op-prev").onclick=function(){go(-1);};
    $("op-x").onclick=function(){if(LIVE){if(ONCLOSE)ONCLOSE();detachLive();}else stop();};
    var rates=[1,1.25,1.5,2,0.75];
    $("op-rate").onclick=function(){if(!A)return;var i=rates.indexOf(A.playbackRate);i=(i+1)%rates.length;A.playbackRate=rates[i];$("op-rate").textContent=rates[i]+"x";save();};
    var bp=$("op-bar-p");
    function seek(e){if(LIVE)return;var r=bp.getBoundingClientRect(),cx=(e.touches&&e.touches[0]?e.touches[0].clientX:e.clientX),x=(cx-r.left)/r.width;x=Math.min(1,Math.max(0,x));if(A&&isFinite(A.duration))A.currentTime=x*A.duration;}
    bp.addEventListener("click",seek);
    bp.addEventListener("mousedown",function(e){drag=true;seek(e);});
    bp.addEventListener("touchstart",function(e){seek(e);},{passive:true});
    bp.addEventListener("touchmove",function(e){seek(e);},{passive:true});
    document.addEventListener("mousemove",function(e){if(drag)seek(e);});
    document.addEventListener("mouseup",function(){drag=false;});
    // ==== 拖动 + 收缩 ====
    var art=$("op-art"),dr={on:false,moved:false,sx:0,sy:0,ox:0,oy:0};
    function dstart(e){var t=e.touches&&e.touches[0];dr.on=true;dr.moved=false;dr.sx=t?t.clientX:e.clientX;dr.sy=t?t.clientY:e.clientY;var r=BAR.getBoundingClientRect();dr.ox=r.left;dr.oy=r.top;}
    function dmove(e){if(!dr.on)return;var t=e.touches&&e.touches[0],cx=t?t.clientX:e.clientX,cy=t?t.clientY:e.clientY,dx=cx-dr.sx,dy=cy-dr.sy;if(Math.abs(dx)+Math.abs(dy)>4)dr.moved=true;if(dr.moved){BAR.style.left=(dr.ox+dx)+"px";BAR.style.top=(dr.oy+dy)+"px";BAR.style.bottom="auto";BAR.style.transform="none";if(e.cancelable)e.preventDefault();}}
    function dend(){if(!dr.on)return;dr.on=false;if(dr.moved){clampPos();savePos();}else if(BAR.classList.contains("op-min")){BAR.classList.remove("op-min");setTimeout(clampPos,0);}}
    art.addEventListener("mousedown",dstart);document.addEventListener("mousemove",dmove);document.addEventListener("mouseup",dend);
    art.addEventListener("touchstart",dstart,{passive:true});art.addEventListener("touchmove",dmove,{passive:false});art.addEventListener("touchend",dend);
    $("op-collapse").onclick=function(){BAR.classList.add("op-min");setTimeout(clampPos,0);};
    window.addEventListener("resize",function(){if(POS)clampPos();});
    applyPos();
  }
  function savePos(){var r=BAR.getBoundingClientRect();POS={x:r.left,y:r.top};try{localStorage.setItem("origin_player_pos",JSON.stringify(POS));}catch(e){}}
  function clampPos(){if(!BAR)return;var r=BAR.getBoundingClientRect(),x=Math.min(Math.max(6,parseFloat(BAR.style.left)||r.left),window.innerWidth-r.width-6),y=Math.min(Math.max(6,parseFloat(BAR.style.top)||r.top),window.innerHeight-r.height-6);BAR.style.left=x+"px";BAR.style.top=y+"px";BAR.style.bottom="auto";BAR.style.transform="none";}
  function applyPos(){if(!BAR)return;if(!POS){try{POS=JSON.parse(localStorage.getItem("origin_player_pos"));}catch(e){POS=null;}}if(POS&&typeof POS.x==="number"){BAR.style.left=POS.x+"px";BAR.style.top=POS.y+"px";BAR.style.bottom="auto";BAR.style.transform="none";clampPos();}}
  function ensureAudio(){
    if(A)return A;
    A=document.createElement("audio");A.id="op-audio";A.preload="metadata";
    A.setAttribute("playsinline","");A.setAttribute("webkit-playsinline","");
    (document.body||document.documentElement).appendChild(A);
    A.addEventListener("play",sync);A.addEventListener("pause",sync);
    A.addEventListener("timeupdate",function(){sync();var t=Date.now();if(t-lastSave>2500){lastSave=t;save();}});
    A.addEventListener("loadedmetadata",sync);
    A.addEventListener("ended",function(){if(items.length>1)go(1);else{sync();save();}});
    return A;
  }
  function media(){
    try{if(!("mediaSession" in navigator))return;var c=items[idx]||{},art=[];if(c.cover)art.push({src:c.cover,sizes:"512x512",type:"image/jpeg"});
      navigator.mediaSession.metadata=new MediaMetadata({title:c.title||"回放",artist:ZH?"起源线上课堂":"Origin Live",album:"Origin",artwork:art});
      navigator.mediaSession.setActionHandler("play",function(){var m=M();m&&m.play();});
      navigator.mediaSession.setActionHandler("pause",function(){var m=M();m&&m.pause();});
      navigator.mediaSession.setActionHandler("seekbackward",LIVE?null:function(){if(A)A.currentTime=Math.max(0,A.currentTime-15);});
      navigator.mediaSession.setActionHandler("seekforward",LIVE?null:function(){if(A)A.currentTime=Math.min(A.duration||1e9,A.currentTime+15);});
      navigator.mediaSession.setActionHandler("nexttrack",(!LIVE&&items.length>1)?function(){go(1);}:null);
      navigator.mediaSession.setActionHandler("previoustrack",(!LIVE&&items.length>1)?function(){go(-1);}:null);
    }catch(e){}
  }
  function sync(){
    var m=M();if(!m||!BAR)return;var pb=$("op-play");
    if(pb)pb.textContent=m.paused?"▶":"⏸";
    try{if("mediaSession" in navigator)navigator.mediaSession.playbackState=m.paused?"paused":"playing";}catch(e){}
    if(LIVE)return;
    var d=m.duration||0,p=d?(m.currentTime/d*100):0,f=$("op-fill"),k=$("op-knob"),cu=$("op-cur"),du=$("op-dur");
    if(f)f.style.width=p+"%";if(k)k.style.left=p+"%";if(cu)cu.textContent=fmt(m.currentTime);if(du&&d)du.textContent=fmt(d);
    var pv=$("op-prev"),nx=$("op-next");if(pv)pv.style.visibility=items.length>1?"visible":"hidden";if(nx)nx.style.visibility=items.length>1?"visible":"hidden";
  }
  function paint(){
    if(!BAR)return;var c=items[idx]||{};
    var art=$("op-art"),tt=$("op-t");
    if(art)art.innerHTML=c.cover?'<img src="'+esc(c.cover)+'" alt="">':'🎧';
    if(tt)tt.textContent=(LIVE?("🔴 "+(ZH?"直播":"LIVE")+" · "):"")+(c.title||(ZH?"回放":"Replay"));
    if($("op-rate"))$("op-rate").textContent=((A&&A.playbackRate)||1)+"x";
  }
  function show(){build();BAR.classList.add("on");BAR.classList.toggle("op-live",!!LIVE);paint();sync();applyPos();}
  function toggle(){var m=M();if(!m)return;if(m.paused){var p=m.play();if(p&&p.catch)p.catch(function(){});}else m.pause();}
  function loadIdx(i,seekTo,autoplay){
    var c=items[i];if(!c||!c.url)return;idx=i;ensureAudio();
    A.src=c.url;if(seekTo)try{A.currentTime=seekTo;}catch(e){}
    show();media();
    if(autoplay!==false){var p=A.play();if(p&&p.catch)p.catch(function(){sync();});}
    save();
  }
  function go(d){if(!items.length)return;var i=(idx+d+items.length)%items.length;loadIdx(i,0,true);}
  function stop(){if(A){try{A.pause();}catch(e){}A.removeAttribute("src");try{A.load();}catch(e){}}items=[];idx=0;if(BAR)BAR.classList.remove("on");try{localStorage.removeItem(LS);}catch(e){}}
  function save(){if(LIVE)return;try{if(!items.length){localStorage.removeItem(LS);return;}localStorage.setItem(LS,JSON.stringify({items:items,idx:idx,time:A?A.currentTime:0,rate:A?A.playbackRate:1,playing:!!(A&&!A.paused)}));}catch(e){}}

  function norm(list){return (list||[]).map(function(c){return {url:safe(c.url||c.play_url),title:String(c.title||"").slice(0,120),cover:safe(c.cover||"")};}).filter(function(c){return c.url;});}
  // 接管外部音频(直播:hls已由调用方attach到该audio元素),用同一悬浮条控制
  function attachLive(el,meta){meta=meta||{};LIVE=true;LA=el;ONCLOSE=meta.onClose||null;items=[{url:"",title:String(meta.title||"").slice(0,120),cover:safe(meta.cover||"")}];idx=0;
    if(el&&!el._opw){el._opw=1;el.addEventListener("play",sync);el.addEventListener("pause",sync);}
    build();show();media();sync();}
  function detachLive(){LIVE=false;LA=null;ONCLOSE=null;items=[];if(BAR){BAR.classList.remove("op-live");BAR.classList.remove("on");}}
  window.OriginPlayer={
    playList:function(list,i){var L=norm(list);if(!L.length)return;LIVE=false;LA=null;if(BAR)BAR.classList.remove("op-live");items=L;loadIdx(Math.max(0,Math.min(i||0,L.length-1)),0,true);},
    play:function(url,title,cover){this.playList([{url:url,title:title,cover:cover}],0);},
    attachLive:attachLive,
    detachLive:detachLive,
    current:function(){return items[idx]||null;},
    isActive:function(){return items.length>0;}
  };

  // 翻页恢复:读上次状态,续播(自动播放被拦时显示▶,点一下继续)
  function restore(){
    var st;try{st=JSON.parse(localStorage.getItem(LS));}catch(e){st=null;}
    if(!st||!st.items||!st.items.length)return;
    items=norm(st.items);if(!items.length)return;idx=Math.max(0,Math.min(st.idx||0,items.length-1));
    ensureAudio();A.src=items[idx].url;if(st.rate)A.playbackRate=st.rate;
    var seekTo=st.time||0;A.addEventListener("loadedmetadata",function once(){A.removeEventListener("loadedmetadata",once);try{A.currentTime=seekTo;}catch(e){}sync();});
    show();media();
    if(st.playing){var p=A.play();if(p&&p.catch)p.catch(function(){sync();});}
  }
  window.addEventListener("pagehide",save);window.addEventListener("beforeunload",save);
  document.addEventListener("visibilitychange",function(){if(document.hidden)save();});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",restore);else restore();
})();
