/* ═══════════ 起源视频学院 · 客户端逻辑 ═══════════
   播放进度 / 断点续播 / 收藏 / 稍后看 / 观看历史 = 浏览器 localStorage(不上传)。
   播放量 = Worker /vc 真实累计。同一脚本服务视频首页(#vidHub)与播放页(#vidDetail)。 */
(function(){
"use strict";
try{var _lc=localStorage.getItem("web3origin_locale")||"";if(_lc){window.SITE_LANG=(_lc==="zh-CN")?"zh":_lc;document.documentElement.lang=_lc;if(_lc==="ar")document.documentElement.dir="rtl";}}catch(e){}
var W="https://count.web3origin.com";
var VK="origin_video_v1";
function EN(){return (window.SITE_LANG||"zh")!=="zh";}
function st(){try{return JSON.parse(localStorage.getItem(VK))||{};}catch(e){return {};}}
function sv(d){try{localStorage.setItem(VK,JSON.stringify(d));}catch(e){}}
function get(k){var d=st();return d[k]||{};}
function fav(s){return !!get("fav")[s];}
function prog(s){return get("prog")[s]||0;}
function fmtViews(n){if(n==null)return "";if(n>=1e4)return (n/1e4).toFixed(1)+"万";if(n>=1e3)return (n/1e3).toFixed(1)+"k";return String(n);}

/* 播放量:批量读 + 单个自增(每会话每视频只+1) */
function loadViews(slugs,cb){
  if(!slugs.length)return cb({});
  fetch(W+"/vc?ids="+slugs.join(",")).then(function(r){return r.json();}).then(function(j){cb((j&&j.counts)||{});}).catch(function(){cb({});});
}
function hitView(slug){
  try{ var k="vhit_"+slug; if(sessionStorage.getItem(k))return; sessionStorage.setItem(k,"1"); }catch(e){}
  fetch(W+"/vc?id="+slug+"&hit=1").then(function(r){return r.json();}).then(function(j){
    var el=document.getElementById("vidViews"); if(el&&j&&j.count!=null)el.textContent="👁 "+fmtViews(j.count);
  }).catch(function(){});
}

/* ══════ 视频首页 ══════ */
function initHub(){
  var vids=window.VIDEOS||[];
  var reals=vids.filter(function(v){return v.src;});
  // 学习进度
  function refresh(){
    var watched=reals.filter(function(v){return prog(v.slug)>=90;}).length;
    var pt=document.getElementById("vidProgText"); if(pt)pt.textContent=watched+" / "+reals.length;
    var pf=document.getElementById("vidProgFill"); if(pf)pf.style.width=(reals.length?watched/reals.length*100:0)+"%";
    document.querySelectorAll(".vid-card").forEach(function(c){
      var s=c.getAttribute("data-slug"),pg=prog(s);
      var pb=c.querySelector(".vid-prog"); if(pb)pb.style.width=pg+"%";
      c.classList.toggle("watched",pg>=90);
      var fb=c.querySelector(".vid-fav"); if(fb){fb.textContent=fav(s)?"★":"☆";fb.classList.toggle("on",fav(s));}
    });
  }
  refresh(); window.addEventListener("focus",refresh); window.__vidRefresh=refresh;
  // 真实播放量
  loadViews(reals.map(function(v){return v.slug;}),function(counts){
    document.querySelectorAll(".vid-card[data-real=1]").forEach(function(c){
      var s=c.getAttribute("data-slug"),vv=c.querySelector(".vid-views");
      if(vv&&counts[s]!=null)vv.textContent="👁 "+fmtViews(counts[s]);
    });
  });
  // 收藏切换
  document.querySelectorAll(".vid-fav").forEach(function(b){
    b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();var s=b.getAttribute("data-slug");
      var d=st();d.fav=d.fav||{};if(d.fav[s])delete d.fav[s];else d.fav[s]=1;sv(d);refresh();});
  });
  // 分类筛选
  document.querySelectorAll(".vc-catbtn").forEach(function(b){
    b.addEventListener("click",function(){
      var cat=b.getAttribute("data-cat");
      document.querySelectorAll(".vc-catbtn").forEach(function(x){x.classList.toggle("on",x===b);});
      document.querySelectorAll(".vid-sec").forEach(function(sec){sec.style.display=(cat==="all"||sec.getAttribute("data-cat")===cat)?"":"none";});
      if(cat==="fav"){document.querySelectorAll(".vid-sec").forEach(function(sec){sec.style.display="";});
        document.querySelectorAll(".vid-card").forEach(function(c){c.style.display=fav(c.getAttribute("data-slug"))?"":"none";});
        document.querySelectorAll(".vid-sec").forEach(function(sec){var any=[].some.call(sec.querySelectorAll(".vid-card"),function(c){return c.style.display!=="none";});sec.style.display=any?"":"none";});
      } else document.querySelectorAll(".vid-card").forEach(function(c){c.style.display="";});
    });
  });
  // 搜索
  var si=document.getElementById("vidSearch"),sr=document.getElementById("vidSearchResults");
  if(si)si.addEventListener("input",function(){
    var q=si.value.trim().toLowerCase(); if(!q){sr.innerHTML="";sr.style.display="none";return;}
    var hits=vids.filter(function(v){return ((v.title||"")+(v.title_en||"")+(v.desc||"")).toLowerCase().indexOf(q)>=0;}).slice(0,8);
    sr.style.display="block";
    sr.innerHTML=hits.length?hits.map(function(v){var href=v.src?("./"+v.slug+"/"):("/academy/"+v.academy+"/");
      return '<a class="vid-sr" href="'+href+'">'+(v.src?"▶ ":"📖 ")+(EN()&&v.title_en?v.title_en:v.title)+'</a>';}).join(""):'<div class="vid-sr-no">没找到相关视频</div>';
  });
  // 短视频模式
  var sb=document.getElementById("vidShortBtn"),ov=document.getElementById("vidShort");
  if(sb&&ov){ sb.addEventListener("click",function(){ buildShort(ov,reals); ov.classList.add("open"); document.body.style.overflow="hidden"; });
    var cl=document.getElementById("vidShortClose"); if(cl)cl.addEventListener("click",function(){ov.classList.remove("open");document.body.style.overflow="";ov.querySelectorAll("video").forEach(function(v){v.pause();});});
  }
  window.renderVideo=refresh;
}
function buildShort(ov,reals){
  var wrap=ov.querySelector(".vid-short-feed"); if(!wrap||wrap.getAttribute("data-built"))return;
  wrap.setAttribute("data-built","1");
  wrap.innerHTML=reals.map(function(v){
    return '<div class="vid-short-item"><video src="'+v.src+'#t=0.1" playsinline preload="metadata" controls loop></video>'
      +'<div class="vid-short-meta"><div class="vs-cat">'+catName(v.cat)+' · '+(v.durText||"")+'</div>'
      +'<div class="vs-title">'+v.title+'</div><div class="vs-desc">'+(v.desc||"")+'</div>'
      +'<a class="vs-open" href="./'+v.slug+'/">看完整讲解 ›</a></div></div>';
  }).join("");
  // 滚动到中间的自动播放
  var io=new IntersectionObserver(function(es){es.forEach(function(e){var vd=e.target.querySelector("video");if(!vd)return;
    if(e.isIntersecting){vd.play().catch(function(){});}else vd.pause();});},{threshold:0.6});
  wrap.querySelectorAll(".vid-short-item").forEach(function(it){io.observe(it);});
}
function catName(k){var c=(window.VIDEO_CATS||[]).filter(function(x){return x.key===k;})[0];return c?c.name:k;}

/* ══════ 播放页 ══════ */
function initDetail(){
  var el=document.getElementById("vidDetail"),slug=el.getAttribute("data-slug");
  var pl=document.getElementById("vidPlayer");
  // 播放量
  var vv=document.getElementById("vidViews");
  loadViews([slug],function(c){if(vv&&c[slug]!=null)vv.textContent="👁 "+fmtViews(c[slug]);});
  if(pl){
    // 断点续播
    var pos=get("pos")[slug]||0;
    var rz=document.getElementById("vidResume");
    if(pos>15){ if(rz){rz.style.display="";rz.querySelector("b").textContent=fmtTime(pos);
      rz.querySelector("button").onclick=function(){pl.currentTime=pos;pl.play();rz.style.display="none";};} }
    var hit=false,last=0;
    pl.addEventListener("play",function(){if(!hit){hit=true;hitView(slug);}});
    pl.addEventListener("timeupdate",function(){
      var now=Date.now(); if(now-last<3000)return; last=now;
      if(!pl.duration)return; var d=st();d.pos=d.pos||{};d.prog=d.prog||{};
      d.pos[slug]=Math.floor(pl.currentTime);
      d.prog[slug]=Math.min(100,Math.round(pl.currentTime/pl.duration*100));
      d.history=(d.history||[]).filter(function(h){return h.slug!==slug;});
      d.history.unshift({slug:slug,ts:Math.floor(now/1000)}); d.history=d.history.slice(0,30);
      sv(d);
    });
    pl.addEventListener("ended",function(){var d=st();d.prog=d.prog||{};d.prog[slug]=100;sv(d);});
  }
  // 收藏 / 稍后看
  var fb=document.getElementById("vidFav");
  if(fb){function pf(){fb.textContent=(fav(slug)?"★ 已收藏":"☆ 收藏");fb.classList.toggle("on",fav(slug));}pf();
    fb.onclick=function(){var d=st();d.fav=d.fav||{};if(d.fav[slug])delete d.fav[slug];else d.fav[slug]=1;sv(d);pf();};}
  var lb=document.getElementById("vidLater");
  if(lb){function pl2(){var later=get("later")[slug];lb.textContent=later?"✓ 已加入稍后看":"+ 稍后看";}pl2();
    lb.onclick=function(){var d=st();d.later=d.later||{};if(d.later[slug])delete d.later[slug];else d.later[slug]=1;sv(d);pl2();};}
}
function fmtTime(s){s=Math.floor(s);var m=Math.floor(s/60),ss=s%60;return m+":"+(ss<10?"0":"")+ss;}

function boot(){ if(document.getElementById("vidHub"))initHub(); else if(document.getElementById("vidDetail"))initDetail(); }
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();
