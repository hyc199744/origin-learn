/* 起源全站音频播放器 —— 跨页面持久:底部常驻播放条,用localStorage记住进度/曲目,翻页自动接着播。
   API: window.OriginPlayer.playList(items,index) / .play(url,title,cover) ; item={url,title,cover} */
(function(){
  "use strict";
  var LS="origin_player_v1";
  var ZH=document.documentElement.lang!=="en"&&!/^en/i.test(document.documentElement.lang||"");
  var A=null,BAR=null,items=[],idx=0,lastSave=0,drag=false;
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
      +"#op-x{width:28px;height:28px;border-radius:7px;border:1px solid #3a2313;color:#b79c74;font-size:12px}"
      +".op-btn:hover{color:#f0d48a;border-color:#D6A84B}"
      +"#op-ctrls{flex:0 0 auto;display:flex;align-items:center;gap:7px}"
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
      +'<button class="op-btn" id="op-x" aria-label="close">✕</button></div>';
    (document.body||document.documentElement).appendChild(BAR);
    $("op-play").onclick=toggle;
    $("op-next").onclick=function(){go(1);};
    $("op-prev").onclick=function(){go(-1);};
    $("op-x").onclick=stop;
    var rates=[1,1.25,1.5,2,0.75];
    $("op-rate").onclick=function(){if(!A)return;var i=rates.indexOf(A.playbackRate);i=(i+1)%rates.length;A.playbackRate=rates[i];$("op-rate").textContent=rates[i]+"x";save();};
    var bp=$("op-bar-p");
    function seek(e){var r=bp.getBoundingClientRect(),cx=(e.touches&&e.touches[0]?e.touches[0].clientX:e.clientX),x=(cx-r.left)/r.width;x=Math.min(1,Math.max(0,x));if(A&&isFinite(A.duration))A.currentTime=x*A.duration;}
    bp.addEventListener("click",seek);
    bp.addEventListener("mousedown",function(e){drag=true;seek(e);});
    bp.addEventListener("touchstart",function(e){seek(e);},{passive:true});
    bp.addEventListener("touchmove",function(e){seek(e);},{passive:true});
    document.addEventListener("mousemove",function(e){if(drag)seek(e);});
    document.addEventListener("mouseup",function(){drag=false;});
  }
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
      navigator.mediaSession.setActionHandler("play",function(){A&&A.play();});
      navigator.mediaSession.setActionHandler("pause",function(){A&&A.pause();});
      navigator.mediaSession.setActionHandler("seekbackward",function(){if(A)A.currentTime=Math.max(0,A.currentTime-15);});
      navigator.mediaSession.setActionHandler("seekforward",function(){if(A)A.currentTime=Math.min(A.duration||1e9,A.currentTime+15);});
      navigator.mediaSession.setActionHandler("nexttrack",items.length>1?function(){go(1);}:null);
      navigator.mediaSession.setActionHandler("previoustrack",items.length>1?function(){go(-1);}:null);
    }catch(e){}
  }
  function sync(){
    if(!A||!BAR)return;var d=A.duration||0,p=d?(A.currentTime/d*100):0;
    var f=$("op-fill"),k=$("op-knob"),cu=$("op-cur"),du=$("op-dur"),pb=$("op-play");
    if(f)f.style.width=p+"%";if(k)k.style.left=p+"%";if(cu)cu.textContent=fmt(A.currentTime);if(du&&d)du.textContent=fmt(d);
    if(pb)pb.textContent=A.paused?"▶":"⏸";
    var pv=$("op-prev"),nx=$("op-next");if(pv)pv.style.visibility=items.length>1?"visible":"hidden";if(nx)nx.style.visibility=items.length>1?"visible":"hidden";
    try{if("mediaSession" in navigator)navigator.mediaSession.playbackState=A.paused?"paused":"playing";}catch(e){}
  }
  function paint(){
    if(!BAR)return;var c=items[idx]||{};
    var art=$("op-art"),tt=$("op-t");
    if(art)art.innerHTML=c.cover?'<img src="'+esc(c.cover)+'" alt="">':'🎧';
    if(tt)tt.textContent=c.title||(ZH?"回放":"Replay");
    if($("op-rate"))$("op-rate").textContent=((A&&A.playbackRate)||1)+"x";
  }
  function show(){build();BAR.classList.add("on");paint();sync();}
  function toggle(){if(!A)return;if(A.paused){var p=A.play();if(p&&p.catch)p.catch(function(){});}else A.pause();}
  function loadIdx(i,seekTo,autoplay){
    var c=items[i];if(!c||!c.url)return;idx=i;ensureAudio();
    A.src=c.url;if(seekTo)try{A.currentTime=seekTo;}catch(e){}
    show();media();
    if(autoplay!==false){var p=A.play();if(p&&p.catch)p.catch(function(){sync();});}
    save();
  }
  function go(d){if(!items.length)return;var i=(idx+d+items.length)%items.length;loadIdx(i,0,true);}
  function stop(){if(A){try{A.pause();}catch(e){}A.removeAttribute("src");try{A.load();}catch(e){}}items=[];idx=0;if(BAR)BAR.classList.remove("on");try{localStorage.removeItem(LS);}catch(e){}}
  function save(){try{if(!items.length){localStorage.removeItem(LS);return;}localStorage.setItem(LS,JSON.stringify({items:items,idx:idx,time:A?A.currentTime:0,rate:A?A.playbackRate:1,playing:!!(A&&!A.paused)}));}catch(e){}}

  function norm(list){return (list||[]).map(function(c){return {url:safe(c.url||c.play_url),title:String(c.title||"").slice(0,120),cover:safe(c.cover||"")};}).filter(function(c){return c.url;});}
  window.OriginPlayer={
    playList:function(list,i){var L=norm(list);if(!L.length)return;items=L;loadIdx(Math.max(0,Math.min(i||0,L.length-1)),0,true);},
    play:function(url,title,cover){this.playList([{url:url,title:title,cover:cover}],0);},
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
