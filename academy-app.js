/* ═══════════ Web3Origin 链上学习学院 · 客户端逻辑 ═══════════
   进度/等级/收藏 = 浏览器 localStorage(不上传)；导师 = 学院知识库检索(不臆造)。
   同一份脚本服务学院首页(#acHub)和每节课静态页(#acLesson)。 */
(function(){
"use strict";
try{var _lc=localStorage.getItem("web3origin_locale")||"";if(_lc){window.SITE_LANG=(_lc==="zh-CN")?"zh":_lc;document.documentElement.lang=_lc;if(_lc==="ar")document.documentElement.dir="rtl";}}catch(e){}
var KEY="origin_academy_v1";
function EN(){return (window.SITE_LANG||"zh")!=="zh";}
var LV_ZH=["Web3新人","链上用户","DeFi探索者","链上分析师","Web3研究者"];
var LV_EN=["Web3 Novice","On-chain User","DeFi Explorer","On-chain Analyst","Web3 Researcher"];
var TH=[0,7,15,23,31]; // 完成课数 → 等级门槛(Lv1..Lv5)
var T={zh:{lv:"你的学习等级",done:"完成课程",cont:"继续学习",start:"开始学习",review:"复习",
  finished:"已完成 ✓",mark:"标记为已完成",unmark:"取消完成",fav:"收藏",searchph:"搜课程：钱包 / 合约 / LGNS / 质押…",
  noRes:"没找到相关课程，换个关键词试试",tutorph:"问导师：什么是 AMM？助记词能给别人吗？…",
  tutorAsk:"问导师",tutorHint:"AI 导师从学院知识库中检索作答，只讲能核实的内容，不替你做投资决定。",
  tutorNo:"知识库里暂时没有直接匹配的内容。试试更常见的关键词，比如「钱包」「授权」「质押」「LGNS」。",
  tutorOne:"一句话",tutorMore:"展开",tutorTool:"配套工具",toolsLabel:"配套工具",min:"分钟",
  q_submit:"提交答案",q_right:"答对",q_wrong:"答错",q_score:"本节测验得分",q_pass:"太棒了，本节已自动标记完成！",lvl:"Level"},
  en:{lv:"Your level",done:"Completed",cont:"Continue",start:"Start",review:"Review",
  finished:"Done ✓",mark:"Mark as done",unmark:"Mark undone",fav:"Save",searchph:"Search: wallet / contract / LGNS / staking…",
  noRes:"No matching course, try another keyword",tutorph:"Ask: what is AMM? can I share my seed phrase?…",
  tutorAsk:"Ask",tutorHint:"The tutor answers from the Academy knowledge base, only verifiable content, never investment advice.",
  tutorNo:"No direct match in the knowledge base. Try common keywords like wallet, approval, staking, LGNS.",
  tutorOne:"In one line",tutorMore:"More",tutorTool:"Tools",toolsLabel:"Related tools",min:"min",
  q_submit:"Submit",q_right:"Correct",q_wrong:"Wrong",q_score:"Quiz score",q_pass:"Great — this lesson is marked complete!",lvl:"Level"}};
function t(k){return (EN()?T.en:T.zh)[k];}
var TOOLNAME={openBrowser:{zh:"区块浏览器",en:"Block Explorer"},openWalletMonitor:{zh:"钱包体检",en:"Wallet Checkup"},
  openSecurity:{zh:"代币安全自查",en:"Token Safety"},openContractCenter:{zh:"合约验证中心",en:"Contract Verify"},
  openCalc:{zh:"收益计算器",en:"Yield Calc"},openStaking:{zh:"质押数据",en:"Staking Data"},
  openEvidenceDB:{zh:"链上证据库",en:"Evidence DB"},openDashboard:{zh:"链上数据面板",en:"Dashboard"},
  openReferrer:{zh:"查推荐人",en:"Referrer"},openWhale:{zh:"大额成交",en:"Whale Trades"},openDailyNews:{zh:"链上日报",en:"Daily"}};
function toolLabel(fn){var o=TOOLNAME[fn];return o?(EN()?o.en:o.zh):fn;}

function getState(){try{return JSON.parse(localStorage.getItem(KEY))||{done:{},fav:{}};}catch(e){return {done:{},fav:{}};}}
function setState(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch(e){}}
function isDone(id){return !!getState().done[id];}
function setDone(id,v){var s=getState();if(v)s.done[id]=1;else delete s.done[id];setState(s);}
function doneCount(){return Object.keys(getState().done).length;}
function levelIdx(n){var i=0;for(var k=0;k<TH.length;k++){if(n>=TH[k])i=k;}return i;}

/* ══════ 学院首页 ══════ */
function initHub(){
  var acad=window.ACADEMY||[];
  var total=acad.length;
  function refresh(){
    var n=doneCount(), li=levelIdx(n);
    var badge=document.getElementById("acLevelBadge"); if(badge)badge.textContent="Lv."+(li+1)+" "+(EN()?LV_EN[li]:LV_ZH[li]);
    var lvLabel=document.getElementById("acLvLabel"); if(lvLabel)lvLabel.textContent=t("lv");
    var dLabel=document.getElementById("acDoneLabel"); if(dLabel)dLabel.textContent=t("done");
    var pt=document.getElementById("acProgressText"); if(pt)pt.textContent=n+" / "+total;
    var pf=document.getElementById("acProgressFill"); if(pf)pf.style.width=(total?Math.round(n/total*100):0)+"%";
    // 卡片完成标记
    document.querySelectorAll(".ac-card").forEach(function(c){
      var id=c.getAttribute("data-id"), d=isDone(id);
      c.classList.toggle("done",d);
      var ck=c.querySelector(".ac-check"); if(ck)ck.textContent=d?"✓":"";
      var st=c.querySelector(".ac-status"); if(st)st.textContent=d?t("review"):t("start");
      var du=c.querySelector(".ac-dur"); if(du){var m=du.getAttribute("data-min");du.textContent="⏱ "+m+" "+t("min");}
    });
    // 继续学习 → 第一节未完成
    var cont=document.getElementById("acContinue");
    if(cont){ var nextC=null; for(var i=0;i<acad.length;i++){ if(!isDone(acad[i].id)){nextC=acad[i];break;} }
      if(nextC){ cont.href="./"+nextC.slug+"/"; cont.textContent=(n>0?t("cont"):t("start"))+" › "+(EN()?nextC.title_en:nextC.title); cont.style.display=""; }
      else { cont.href="#acLevels"; cont.textContent="🎉 "+(EN()?"All done!":"全部完成！"); }
    }
  }
  refresh();
  window.addEventListener("focus",refresh);
  window.__acRefresh=refresh;

  /* 搜索 */
  var si=document.getElementById("acSearch"), sr=document.getElementById("acSearchResults");
  if(si){ si.placeholder=t("searchph");
    si.addEventListener("input",function(){
      var q=si.value.trim().toLowerCase();
      if(!q){sr.innerHTML="";sr.style.display="none";return;}
      var hits=acad.filter(function(c){
        var hay=((c.title||"")+(c.title_en||"")+(c.plain||"")+(c.objective||"")+(c.tools||[]).join(" ")).toLowerCase();
        return q.split(/\s+/).every(function(w){return hay.indexOf(w)>=0;});
      }).slice(0,8);
      sr.style.display="block";
      sr.innerHTML=hits.length? hits.map(function(c){
        return '<a class="ac-sr" href="./'+c.slug+'/"><span class="ac-sr-lv">L'+c.level+'</span>'
          +'<span class="ac-sr-t">'+(EN()?c.title_en:c.title)+'</span>'
          +(isDone(c.id)?'<span class="ac-sr-done">✓</span>':'')+'</a>';
      }).join("") : '<div class="ac-sr-no">'+t("noRes")+'</div>';
    });
  }

  /* 知识库导师 */
  var ti=document.getElementById("acTutorInput"), tb=document.getElementById("acTutorAsk"), to=document.getElementById("acTutorOut");
  var th=document.getElementById("acTutorHint"); if(th)th.textContent=t("tutorHint");
  if(ti)ti.placeholder=t("tutorph"); if(tb)tb.textContent=t("tutorAsk");
  function ask(){
    var q=(ti.value||"").trim().toLowerCase(); if(!q){to.innerHTML="";return;}
    var etoks=(q.match(/[a-z0-9]{2,}/g)||[]);          // 英文/数字词
    var zh=q.replace(/[^一-龥]/g,""), grams=[]; // 中文 2-gram
    for(var gi=0;gi<zh.length-1;gi++)grams.push(zh.substr(gi,2));
    if(!etoks.length&&!grams.length)grams=[q];
    var scored=acad.map(function(c){
      var title=((c.title||"")+(c.title_en||"")).toLowerCase();
      var text=(title+(c.plain||"")+(c.objective||"")+((c.faq||[]).map(function(f){return f.q+f.a;}).join(""))).toLowerCase();
      var sc=0;
      etoks.forEach(function(w){ if(title.indexOf(w)>=0)sc+=6; else if(text.indexOf(w)>=0)sc+=2; });
      grams.forEach(function(g){ if(title.indexOf(g)>=0)sc+=3; else if(text.indexOf(g)>=0)sc+=1; });
      return {c:c,sc:sc};
    }).filter(function(x){return x.sc>0;}).sort(function(a,b){return b.sc-a.sc;}).slice(0,3);
    if(!scored.length){ to.innerHTML='<div class="ac-tut-no">'+t("tutorNo")+'</div>'; return; }
    to.innerHTML=scored.map(function(x){var c=x.c;
      var tools=(c.tools||[]).map(function(fn){return '<a class="ac-tut-tool" data-fn="'+fn+'">'+toolLabel(fn)+'</a>';}).join("");
      return '<div class="ac-tut-card">'
        +'<div class="ac-tut-q"><span class="ac-sr-lv">L'+c.level+'</span>'+(EN()?c.title_en:c.title)+'</div>'
        +'<div class="ac-tut-one"><b>'+t("tutorOne")+'：</b>'+(c.plain||"").replace(/^大白话：/,"")+'</div>'
        +(c.objective?'<div class="ac-tut-obj">'+c.objective+'</div>':'')
        +(c.example?'<div class="ac-tut-ex">'+c.example+'</div>':'')
        +(tools?'<div class="ac-tut-tools"><span>'+t("tutorTool")+'：</span>'+tools+'</div>':'')
        +'<a class="ac-tut-go" href="./'+c.slug+'/">'+(EN()?"Open lesson":"打开这节课")+' ›</a></div>';
    }).join("");
  }
  if(tb)tb.addEventListener("click",ask);
  if(ti)ti.addEventListener("keydown",function(e){if(e.key==="Enter")ask();});
  if(to)to.addEventListener("click",function(e){var a=e.target.closest(".ac-tut-tool");if(a){var fn=a.getAttribute("data-fn");location.href="/?tool="+fn;}});

  // 收藏切换 + 语言变化重渲染
  document.querySelectorAll(".ac-fav").forEach(function(b){
    var id=b.getAttribute("data-id");
    function paint(){b.classList.toggle("on",!!getState().fav[id]);b.textContent=getState().fav[id]?"★":"☆";}
    paint();
    b.addEventListener("click",function(e){e.preventDefault();var s=getState();if(s.fav[id])delete s.fav[id];else s.fav[id]=1;setState(s);paint();});
  });
  window.renderAcademy=function(){refresh();if(si)si.placeholder=t("searchph");if(ti)ti.placeholder=t("tutorph");if(tb)tb.textContent=t("tutorAsk");if(th)th.textContent=t("tutorHint");
    document.querySelectorAll(".ac-lvl-name").forEach(function(el){var i=+el.getAttribute("data-lvl");el.textContent=(EN()?LV_EN[i-1]:LV_ZH[i-1]);});};
}

/* ══════ 单节课页 ══════ */
function initLesson(){
  var el=document.getElementById("acLesson"), id=el.getAttribute("data-id");
  var mk=document.getElementById("acMarkDone");
  function paintMk(){ if(!mk)return; var d=isDone(id); mk.textContent=d?("✓ "+t("finished")):t("mark"); mk.classList.toggle("done",d); }
  paintMk();
  if(mk)mk.addEventListener("click",function(){ setDone(id,!isDone(id)); paintMk(); });
  // 测验
  var sub=document.getElementById("acQuizSubmit"), res=document.getElementById("acQuizResult");
  if(sub){ sub.textContent=t("q_submit");
    sub.addEventListener("click",function(){
      var qs=document.querySelectorAll(".ac-q"), score=0;
      qs.forEach(function(q,i){
        var a=+q.getAttribute("data-a"), picked=q.querySelector('input[type=radio]:checked');
        var exp=q.querySelector(".ac-exp"); if(exp)exp.hidden=false;
        q.querySelectorAll(".ac-opt").forEach(function(lb,j){ lb.classList.remove("right","wrong");
          if(j===a)lb.classList.add("right");
          if(picked&&+picked.value===j&&j!==a)lb.classList.add("wrong"); });
        if(picked&&+picked.value===a)score++;
      });
      var pass=score===qs.length;
      res.style.display="block";
      res.innerHTML='<b>'+t("q_score")+'：'+score+' / '+qs.length+'</b>'+(pass?' — '+t("q_pass"):'');
      res.className="ac-qres "+(pass?"pass":"part");
      if(pass){ setDone(id,true); paintMk(); }
    });
  }
  window.renderAcademy=function(){paintMk();if(sub)sub.textContent=t("q_submit");};
}

function boot(){
  if(document.getElementById("acHub"))initHub();
  else if(document.getElementById("acLesson"))initLesson();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();
