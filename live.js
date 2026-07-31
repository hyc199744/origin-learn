/* 起源线上课堂 /live —— 自包含前台(播放器状态机 + 倒计时 + iframe超时检测 + 跳转备用 + 中英)
   数据全部来自后台 Worker(count.web3origin.com),外链不硬编码。 */
(function(){
  "use strict";
  var API="https://count.web3origin.com";
  var ZH=document.documentElement.lang!=="en"&&!/^en/i.test(document.documentElement.lang||"");
  var T=ZH?{
    eyebrow:"ORIGIN LIVE · 起源生态学习课堂",
    page_title:"起源线上课堂",
    subtitle:"每日直播课程入口 · 服务器自动排期 · 无需管理员在线",
    teacher:"主讲老师",time:"上课时间",to:"至",
    countdown_start:"距开课",countdown_end:"距下课",started:"已开课",
    st_upcoming:"未开始",st_soon:"即将开始",st_live:"直播中",st_ended:"已结束",st_fail:"加载失败",st_block:"外部平台禁止嵌入",st_none:"暂无课程",
    online:"当前观看",cum:"累计访问",people:"人",
    intro:"今日课程介绍",history:"历史课程",no_course:"今日暂无排期课程",no_course_sub:"课程由老师在后台排期后自动显示,请稍后再来,或关注社区通知。",
    btn_enter:"进入今日课堂",btn_fs:"全屏观看",btn_refresh:"刷新播放器",btn_open:"在原平台打开",btn_open_new:"在新窗口打开原课堂",
    loading:"播放器加载中…",
    fail_title:"播放器加载失败或被拦截",
    fail_sub:"若长时间黑屏或无法播放,请点击下方按钮进入原课堂观看。跨域播放器本站无法读取其内部状态,这不代表课程未开播。",
    block_title:"本课程平台不支持页面内嵌入",
    block_sub:"该平台设置了嵌入限制,已自动切换为跳转模式。点击下方按钮在新窗口进入原课堂。",
    ended_title:"本场课程已结束",ended_sub:"感谢观看。可在下方查看历史课程,或等待下一场排期。",
    soon_hint:"课程即将开始,可先进入课堂等候。",
    upcoming_hint:"课程尚未开始,开课后播放器将自动显示。",
    disclaimer_t:"课程与安全声明",
    disc:["本站仅提供起源生态学习课程入口。课程内容与播放服务由对应课程平台提供,本站不推流、不保存、不代理任何视频流。",
      "本站不会保存你的钱包私钥、助记词或任何课程平台的账号密码。请勿在任何页面向他人透露上述信息。",
      "直播内容仅供学习交流,不构成任何投资建议或收益承诺。数字资产有风险,参与需谨慎、自行判断(DYOR)。",
      "所有外部链接均经过 https 协议校验。如遇要求转账、索要助记词/私钥的情况,一律为诈骗,请立即停止并向社区举报。"],
    repeat_daily:"每天",repeat_weekly:"每周",repeat_custom:"指定日期",repeat_none:"单场",
    wk:["一","二","三","四","五","六","日"],
    server_time:"服务器时间",loading_page:"课堂加载中…"
  }:{
    eyebrow:"ORIGIN LIVE · Learning Classroom",
    page_title:"Origin Live Classroom",
    subtitle:"Daily live course entry · auto-scheduled by server · no admin online required",
    teacher:"Instructor",time:"Time",to:"–",
    countdown_start:"Starts in",countdown_end:"Ends in",started:"Started",
    st_upcoming:"Not started",st_soon:"Starting soon",st_live:"Live",st_ended:"Ended",st_fail:"Load failed",st_block:"Embedding blocked",st_none:"No course",
    online:"Watching now",cum:"Total visits",people:"",
    intro:"Today's course",history:"Past courses",no_course:"No course scheduled today",no_course_sub:"Courses appear automatically once scheduled in the admin panel. Please check back later.",
    btn_enter:"Enter classroom",btn_fs:"Fullscreen",btn_refresh:"Reload player",btn_open:"Open on original platform",btn_open_new:"Open original classroom in new tab",
    loading:"Loading player…",
    fail_title:"Player failed to load or was blocked",
    fail_sub:"If the screen stays blank, click below to open the original classroom. Cross-origin players cannot be inspected by this site, so this does not mean the class is offline.",
    block_title:"This platform does not allow in-page embedding",
    block_sub:"The platform blocks embedding, so redirect mode is enabled. Click below to open the original classroom in a new tab.",
    ended_title:"This session has ended",ended_sub:"Thanks for watching. See past courses below or wait for the next session.",
    soon_hint:"The class is about to start. You may enter and wait.",
    upcoming_hint:"The class has not started. The player will appear automatically once it begins.",
    disclaimer_t:"Course & Safety Notice",
    disc:["This site only provides an entry to Origin ecosystem learning courses. Course content and streaming are provided by the respective platform; this site does not stream, store, or proxy any video.",
      "This site never stores your wallet private key, seed phrase, or any course-platform password. Never disclose such information to anyone on any page.",
      "Live content is for learning only and is not investment advice or any profit promise. Crypto assets carry risk — DYOR.",
      "All external links are https-validated. Any request to transfer funds or reveal your seed phrase/private key is a scam — stop and report it to the community."],
    repeat_daily:"Daily",repeat_weekly:"Weekly",repeat_custom:"Custom dates",repeat_none:"One-off",
    wk:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    server_time:"Server time",loading_page:"Loading…"
  };

  var css="#live-wrap *{box-sizing:border-box}"
    +"#live-wrap{--g:#D6A84B;--glt:#f0d48a;--grn:#76FF36;--grn2:#25c96f;--bg:#070A08;--pnl:#0e0b07;--soft:#b79c74;--muted:#7c6a4f;--line:#3a2313;--bone:#E9EFEA;"
    +"font-family:system-ui,-apple-system,'Microsoft YaHei',sans-serif;color:var(--bone);background:radial-gradient(1200px 600px at 50% -10%,rgba(214,168,75,.08),transparent),var(--bg);min-height:100vh;overflow-x:hidden;padding:0 0 60px}"
    +"#live-wrap .serif{font-family:'STZhongsong','Songti SC',Georgia,serif}"
    +"#live-wrap .lv-head{max-width:1180px;margin:0 auto;padding:74px 20px 8px;text-align:center}"
    +"#live-wrap .lv-eyebrow{font-size:12px;letter-spacing:.4em;color:var(--g);text-transform:uppercase;margin-bottom:12px}"
    +"#live-wrap h1{font-family:'STZhongsong','Songti SC',Georgia,serif;font-weight:400;font-size:clamp(28px,5vw,44px);color:var(--glt);letter-spacing:.06em;text-shadow:0 0 30px rgba(214,168,75,.35);margin:0}"
    +"#live-wrap .lv-sub{color:var(--soft);font-size:14px;margin-top:12px}"
    +"#live-wrap .lv-main{max-width:1180px;margin:26px auto 0;padding:0 20px;display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:22px;align-items:start}"
    +"#live-wrap .lv-playercol{min-width:0}"
    +"#live-wrap .lv-stage{position:relative;width:100%;aspect-ratio:16/9;background:#000;border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.5)}"
    +"#live-wrap .lv-stage iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}"
    +"#live-wrap .lv-cover{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.5}"
    +"#live-wrap .lv-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;padding:24px;background:linear-gradient(180deg,rgba(7,10,8,.55),rgba(7,10,8,.82))}"
    +"#live-wrap .lv-ovtitle{font-family:'STZhongsong',serif;font-size:clamp(18px,3vw,26px);color:var(--glt)}"
    +"#live-wrap .lv-ovsub{font-size:13px;color:var(--soft);max-width:520px;line-height:1.7}"
    +"#live-wrap .lv-cd{font-variant-numeric:tabular-nums;font-size:clamp(26px,6vw,46px);letter-spacing:.04em;color:var(--grn);text-shadow:0 0 24px rgba(118,255,54,.4);font-weight:700}"
    +"#live-wrap .lv-cd small{display:block;font-size:12px;letter-spacing:.3em;color:var(--soft);font-weight:400;margin-bottom:6px;text-shadow:none}"
    +"#live-wrap .lv-spin{width:38px;height:38px;border:3px solid rgba(214,168,75,.25);border-top-color:var(--g);border-radius:50%;animation:lvspin 1s linear infinite}"
    +"@keyframes lvspin{to{transform:rotate(360deg)}}"
    +"#live-wrap .lv-ctrls{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}"
    +"#live-wrap .lv-btn{appearance:none;cursor:pointer;font:inherit;font-size:14px;padding:11px 18px;border-radius:10px;border:1px solid var(--line);background:rgba(255,255,255,.03);color:var(--bone);display:inline-flex;align-items:center;gap:8px;transition:.2s;text-decoration:none}"
    +"#live-wrap .lv-btn:hover{border-color:var(--g);color:var(--glt);background:rgba(214,168,75,.08)}"
    +"#live-wrap .lv-btn.primary{background:linear-gradient(90deg,var(--g),#b8842f);border-color:var(--g);color:#1a1206;font-weight:700}"
    +"#live-wrap .lv-btn.primary:hover{filter:brightness(1.08);color:#1a1206}"
    +"#live-wrap .lv-btn.big{font-size:15px;padding:13px 26px}"
    +"#live-wrap .lv-infocol{min-width:0;display:flex;flex-direction:column;gap:16px}"
    +"#live-wrap .lv-card{background:var(--pnl);border:1px solid var(--line);border-radius:14px;padding:18px}"
    +"#live-wrap .lv-ctitle{font-family:'STZhongsong',serif;font-size:20px;color:var(--glt);line-height:1.4;word-break:break-word}"
    +"#live-wrap .lv-meta{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:12px;font-size:13.5px;color:var(--soft)}"
    +"#live-wrap .lv-meta b{color:var(--bone);font-weight:600}"
    +"#live-wrap .lv-badge{display:inline-flex;align-items:center;gap:7px;padding:6px 13px;border-radius:999px;font-size:13px;font-weight:700;border:1px solid}"
    +"#live-wrap .lv-dot{width:8px;height:8px;border-radius:50%;background:currentColor}"
    +"#live-wrap .b-live{color:#ff5a5a;border-color:rgba(255,90,90,.5);background:rgba(255,90,90,.1)}#live-wrap .b-live .lv-dot{animation:lvpulse 1.2s infinite}"
    +"@keyframes lvpulse{0%,100%{opacity:1}50%{opacity:.25}}"
    +"#live-wrap .b-soon{color:var(--glt);border-color:rgba(240,212,138,.5);background:rgba(214,168,75,.1)}"
    +"#live-wrap .b-upcoming{color:var(--soft);border-color:var(--line);background:rgba(255,255,255,.02)}"
    +"#live-wrap .b-ended{color:#8fa0a6;border-color:rgba(143,160,166,.4);background:rgba(143,160,166,.08)}"
    +"#live-wrap .b-fail,#live-wrap .b-block{color:#ffb454;border-color:rgba(255,180,84,.5);background:rgba(255,180,84,.1)}"
    +"#live-wrap .lv-stats{display:flex;gap:10px}"
    +"#live-wrap .lv-stat{flex:1;text-align:center;background:rgba(255,255,255,.02);border:1px solid var(--line);border-radius:10px;padding:12px 8px}"
    +"#live-wrap .lv-stat .n{font-size:22px;font-weight:700;color:var(--grn2);font-variant-numeric:tabular-nums}"
    +"#live-wrap .lv-stat .l{font-size:11.5px;color:var(--muted);margin-top:3px;letter-spacing:.05em}"
    +"#live-wrap .lv-h3{font-size:13px;letter-spacing:.24em;color:var(--g);text-transform:uppercase;margin:0 0 10px}"
    +"#live-wrap .lv-desc{font-size:14px;color:var(--soft);line-height:1.85;white-space:pre-wrap;word-break:break-word}"
    +"#live-wrap .lv-section{max-width:1180px;margin:34px auto 0;padding:0 20px}"
    +"#live-wrap .lv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;margin-top:14px}"
    +"#live-wrap .lv-hc{background:var(--pnl);border:1px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;transition:.2s}"
    +"#live-wrap .lv-hc:hover{border-color:var(--g);transform:translateY(-2px)}"
    +"#live-wrap .lv-hc .cv{aspect-ratio:16/9;background:linear-gradient(135deg,#1a1206,#0c0a08);position:relative;overflow:hidden}"
    +"#live-wrap .lv-hc .cv img{width:100%;height:100%;object-fit:cover}"
    +"#live-wrap .lv-hc .cv .ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:30px;opacity:.5}"
    +"#live-wrap .lv-hc .bd{padding:12px 13px;flex:1;display:flex;flex-direction:column;gap:6px}"
    +"#live-wrap .lv-hc .ht{font-size:14.5px;color:var(--bone);font-weight:600;line-height:1.4;word-break:break-word}"
    +"#live-wrap .lv-hc .hm{font-size:12px;color:var(--muted);margin-top:auto}"
    +"#live-wrap .lv-hc .mini{position:absolute;top:8px;left:8px;font-size:11px;padding:3px 9px;border-radius:999px;font-weight:700}"
    +"#live-wrap .lv-disc{font-size:12.5px;color:var(--muted);line-height:1.85}"
    +"#live-wrap .lv-disc li{margin-bottom:8px}"
    +"#live-wrap .lv-disc ul{margin:0;padding-left:18px}"
    +"#live-wrap .lv-empty{max-width:640px;margin:40px auto;text-align:center;color:var(--soft);background:var(--pnl);border:1px solid var(--line);border-radius:14px;padding:40px 26px}"
    +"#live-wrap .lv-back{display:inline-block;margin:26px auto 0;color:var(--soft);text-decoration:none;font-size:13px}#live-wrap .lv-back:hover{color:var(--glt)}"
    +"#live-wrap .lv-foot{text-align:center;margin-top:30px}"
    +"@media(max-width:860px){#live-wrap .lv-main{grid-template-columns:1fr;gap:16px}#live-wrap .lv-head{padding-top:64px}}"
    +"#live-wrap.lv-fs .lv-stage{border-radius:0}";

  function esc(s){return String(s==null?"":s).replace(/[&<>\"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];});}
  function safeUrl(u){u=String(u||"").trim();if(!/^https:\/\//i.test(u))return "";if(/[\s<>"'`\\]/.test(u))return "";try{var x=new URL(u);return x.protocol==="https:"?x.href:"";}catch(e){return "";}}
  // 封面:只放行 https 图片链接 或 严格 base64 光栅图(排除 svg，防脚本)
  function safeCover(u){u=String(u||"").trim();if(!u)return "";var h=safeUrl(u);if(h)return h;return /^data:image\/(png|jpe?g|gif|webp|avif);base64,[A-Za-z0-9+/=]+$/i.test(u)?u:"";}
  function pad(n){return (n<10?"0":"")+n;}
  function fmtClock(sec){if(!sec)return "—";var d=new Date(sec*1000+8*3600*1000);return d.getUTCFullYear()+"-"+pad(d.getUTCMonth()+1)+"-"+pad(d.getUTCDate())+" "+pad(d.getUTCHours())+":"+pad(d.getUTCMinutes());}
  function fmtDur(sec){sec=Math.max(0,Math.floor(sec));var h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return (h>0?h+":":"")+pad(m)+":"+pad(s);}
  function vid(){try{var k=localStorage.getItem("live_vid");if(!k){k="lv_"+Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem("live_vid",k);}return k;}catch(e){return "lv_anon_"+Math.floor(Math.random()*1e9);}}
  function repeatText(c){if(!c||!c.repeat_rule||c.repeat_rule==="none")return T.repeat_none;
    if(c.repeat_rule==="daily")return T.repeat_daily+(c.start_hm?(" "+c.start_hm+"–"+(c.end_hm||"")):"");
    if(c.repeat_rule==="weekly"){var ds=String(c.repeat_days||"").split(",").filter(Boolean).map(function(x){var i=parseInt(x,10)-1;return (i>=0&&i<7)?T.wk[i]:"";}).filter(Boolean).join("/");return T.repeat_weekly+" "+ds+(c.start_hm?(" "+c.start_hm+"–"+(c.end_hm||"")):"");}
    if(c.repeat_rule==="custom")return T.repeat_custom+(c.start_hm?(" "+c.start_hm+"–"+(c.end_hm||"")):"");
    return T.repeat_none;}

  var state={course:null,offset:0,online:0,cum:0,iframeOn:false,failTimer:null,tick:null,mode:null,lastStatus:null};
  function serverNow(){return Math.floor(Date.now()/1000)+state.offset;}

  function statusInfo(st){return {
    upcoming:["b-upcoming",T.st_upcoming],soon:["b-soon",T.st_soon],live:["b-live",T.st_live],
    ended:["b-ended",T.st_ended],fail:["b-fail",T.st_fail],block:["b-block",T.st_block],none:["b-ended",T.st_none]
  }[st]||["b-upcoming",T.st_upcoming];}

  function mountIframe(url){
    var stage=document.getElementById("lv-stage");if(!stage)return;
    state.iframeOn=false;
    stage.innerHTML='<div class="lv-overlay"><div class="lv-spin"></div><div class="lv-ovsub">'+esc(T.loading)+'</div></div>';
    var f=document.createElement("iframe");
    f.id="lv-iframe";f.src=url;
    f.setAttribute("allow","autoplay; fullscreen; picture-in-picture; microphone; encrypted-media; clipboard-write");
    f.setAttribute("allowfullscreen","true");f.allowFullscreen=true;
    f.setAttribute("loading","lazy");
    f.setAttribute("referrerpolicy","no-referrer-when-downgrade");
    // sandbox:给足播放/登录/全屏/弹窗所需权限,但不过度(不放开 allow-top-navigation-by-user-activation 以外的顶层跳转)
    f.setAttribute("sandbox","allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-orientation-lock allow-modals");
    f.onload=function(){state.iframeOn=true;if(state.failTimer){clearTimeout(state.failTimer);state.failTimer=null;}var ov=stage.querySelector(".lv-overlay");if(ov)ov.remove();};
    // 加载超时:12秒未 onload → 显示"加载失败/进入原课堂"(不伪造成功)
    state.failTimer=setTimeout(function(){if(!state.iframeOn)showFail(stage);},12000);
    stage.appendChild(f);
  }
  function showFail(stage){
    var url=safeUrl(state.course&&state.course.external_url);
    stage.insertAdjacentHTML("beforeend",'<div class="lv-overlay" id="lv-failov"><div style="font-size:34px">⚠️</div><div class="lv-ovtitle">'+esc(T.fail_title)+'</div><div class="lv-ovsub">'+esc(T.fail_sub)+'</div>'+(url?'<a class="lv-btn primary big" target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">'+esc(T.btn_enter)+' ↗</a>':"")+'</div>');
    reportError("iframe_timeout",(state.course&&state.course.external_url)||"");
  }
  function showRedirect(stage,titleKey){
    var url=safeUrl(state.course&&state.course.external_url);
    stage.innerHTML='<div class="lv-overlay">'+(state.course&&safeCover(state.course.cover_url)?'<img class="lv-cover" src="'+esc(safeCover(state.course.cover_url))+'" alt="">':"")
      +'<div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:14px"><div style="font-size:34px">🚪</div><div class="lv-ovtitle">'+esc(T[titleKey+"_title"])+'</div><div class="lv-ovsub">'+esc(T[titleKey+"_sub"])+'</div>'
      +(url?'<a class="lv-btn primary big" target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">'+esc(T.btn_enter)+' ↗</a>':"")+'</div></div>';
  }
  function showCountdown(stage,st){
    var c=state.course,cover=c&&safeCover(c.cover_url)?'<img class="lv-cover" src="'+esc(safeCover(c.cover_url))+'" alt="">':"";
    var url=safeUrl(c&&c.external_url);
    var hint=st==="soon"?T.soon_hint:T.upcoming_hint;
    stage.innerHTML='<div class="lv-overlay">'+cover+'<div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:14px">'
      +'<div class="lv-cd" id="lv-cd"><small>'+esc(T.countdown_start)+'</small><span id="lv-cdv">--:--</span></div>'
      +'<div class="lv-ovsub">'+esc(hint)+'</div>'
      +(st==="soon"&&url?'<a class="lv-btn primary big" target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">'+esc(T.btn_enter)+' ↗</a>':"")
      +'</div></div>';
  }
  function showEnded(stage){
    var c=state.course,cover=c&&safeCover(c.cover_url)?'<img class="lv-cover" src="'+esc(safeCover(c.cover_url))+'" alt="">':"";
    stage.innerHTML='<div class="lv-overlay">'+cover+'<div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:12px"><div style="font-size:34px">🌙</div><div class="lv-ovtitle">'+esc(T.ended_title)+'</div><div class="lv-ovsub">'+esc(T.ended_sub)+'</div></div></div>';
  }

  // 根据服务器判定的 status + 本地校准时间,决定舞台呈现
  function applyStage(){
    var stage=document.getElementById("lv-stage");if(!stage||!state.course)return;
    var c=state.course,now=serverNow(),st=c.status;
    // 本地时间穿越边界的即时修正(无人值守核心)
    if(c.start&&c.end){if(now>=c.start&&now<c.end)st="live";else if(now>=c.end)st="ended";else st=(c.start-now<=1800)?"soon":"upcoming";}
    var changed=st!==state.lastStatus;state.lastStatus=st;
    if(st==="live"){
      if(c.embed_mode==="redirect"){if(changed||state.mode!=="block"){state.mode="block";showRedirect(stage,"block");updateBadge("block");}return;}
      if(changed||state.mode!=="embed"){state.mode="embed";updateBadge("live");mountIframe(safeUrl(c.external_url)||c.external_url);}
      return;
    }
    if(st==="soon"||st==="upcoming"){if(changed||state.mode!=="cd"){state.mode="cd";showCountdown(stage,st);}updateBadge(st);return;}
    if(st==="ended"){if(changed||state.mode!=="ended"){state.mode="ended";showEnded(stage);}updateBadge("ended");return;}
  }
  function updateBadge(st){var b=document.getElementById("lv-badge");if(!b)return;var si=statusInfo(st);b.className="lv-badge "+si[0];b.innerHTML='<span class="lv-dot"></span>'+esc(si[1]);}

  function tickCountdown(){
    if(!state.course)return;var c=state.course,now=serverNow();
    var cdv=document.getElementById("lv-cdv"),cd=document.getElementById("lv-cd");
    if(state.mode==="cd"&&c.start){
      if(now<c.start){if(cdv)cdv.textContent=fmtDur(c.start-now);}
      else{applyStage();} // 到点自动切播放器
    } else if(state.mode==="embed"&&c.end){
      if(now>=c.end)applyStage(); // 到结束自动切"已结束"
    }
  }

  function renderShell(){
    var root=document.getElementById("live-root");
    root.innerHTML='<div id="live-wrap">'
      +'<div class="lv-head"><div class="lv-eyebrow">'+esc(T.eyebrow)+'</div><h1>'+esc(T.page_title)+'</h1><div class="lv-sub">'+esc(T.subtitle)+'</div></div>'
      +'<div id="lv-body"><div class="lv-empty"><div class="lv-spin" style="margin:0 auto 16px"></div>'+esc(T.loading_page)+'</div></div>'
      +'<div class="lv-section" id="lv-history-sec" style="display:none"><div class="lv-h3">'+esc(T.history)+'</div><div class="lv-grid" id="lv-history"></div></div>'
      +'<div class="lv-section"><div class="lv-card"><div class="lv-h3">🛡 '+esc(T.disclaimer_t)+'</div><div class="lv-disc"><ul>'+T.disc.map(function(d){return "<li>"+esc(d)+"</li>";}).join("")+'</ul></div></div>'
      +'<div class="lv-foot"><a class="lv-back" href="/">← '+(ZH?"返回起源首页":"Back to Origin home")+'</a></div></div>'
      +'</div>';
  }
  function renderCourse(){
    var body=document.getElementById("lv-body"),c=state.course;
    if(!c){body.innerHTML='<div class="lv-empty"><div style="font-size:40px;margin-bottom:12px">📭</div><div class="lv-ctitle" style="color:var(--glt)">'+esc(T.no_course)+'</div><div style="margin-top:12px;font-size:14px">'+esc(T.no_course_sub)+'</div></div>';return;}
    var timeTxt=(c.repeat_rule&&c.repeat_rule!=="none")?repeatText(c):(fmtClock(c.start)+" "+T.to+" "+fmtClock(c.end));
    body.innerHTML='<div class="lv-main"><div class="lv-playercol">'
      +'<div class="lv-stage" id="lv-stage"><div class="lv-overlay"><div class="lv-spin"></div></div></div>'
      +'<div class="lv-ctrls">'
      +'<button class="lv-btn" id="lv-fs">⛶ '+esc(T.btn_fs)+'</button>'
      +'<button class="lv-btn" id="lv-refresh">↻ '+esc(T.btn_refresh)+'</button>'
      +'<a class="lv-btn" id="lv-open" target="_blank" rel="noopener noreferrer" href="'+esc(safeUrl(c.external_url)||"#")+'">↗ '+esc(T.btn_open)+'</a>'
      +'</div></div>'
      +'<div class="lv-infocol">'
      +'<div class="lv-card"><span class="lv-badge b-upcoming" id="lv-badge"><span class="lv-dot"></span>—</span>'
      +'<div class="lv-ctitle" style="margin-top:12px">'+esc(c.title)+'</div>'
      +'<div class="lv-meta">'+(c.teacher_name?'<span>'+esc(T.teacher)+'：<b>'+esc(c.teacher_name)+'</b></span>':"")+'<span>'+esc(T.time)+'：<b>'+esc(timeTxt)+'</b></span></div></div>'
      +'<div class="lv-stats"><div class="lv-stat"><div class="n" id="lv-online">'+state.online+'</div><div class="l">'+esc(T.online)+'</div></div><div class="lv-stat"><div class="n" id="lv-cum">'+state.cum+'</div><div class="l">'+esc(T.cum)+'</div></div></div>'
      +(c.description?'<div class="lv-card"><div class="lv-h3">'+esc(T.intro)+'</div><div class="lv-desc">'+esc(c.description)+'</div></div>':"")
      +'</div></div>';
    // 控件绑定
    document.getElementById("lv-fs").onclick=function(){var el=document.getElementById("lv-stage");var f=el&&(el.requestFullscreen||el.webkitRequestFullscreen);if(f)f.call(el);else{var ifr=document.getElementById("lv-iframe");if(ifr&&ifr.requestFullscreen)ifr.requestFullscreen();}};
    document.getElementById("lv-refresh").onclick=function(){state.mode=null;state.lastStatus=null;applyStage();};
    state.mode=null;state.lastStatus=null;applyStage();
  }
  function renderHistory(list){
    var sec=document.getElementById("lv-history-sec"),grid=document.getElementById("lv-history");
    if(!list||!list.length){sec.style.display="none";return;}
    sec.style.display="";
    grid.innerHTML=list.map(function(c){
      var url=safeUrl(c.external_url),cov=safeCover(c.cover_url);
      var si=statusInfo(c.status),miniBg=c.status==="live"?"background:rgba(255,90,90,.9);color:#fff":(c.status==="ended"?"background:rgba(60,60,60,.85);color:#ccc":"background:rgba(214,168,75,.9);color:#1a1206");
      var when=(c.repeat_rule&&c.repeat_rule!=="none")?repeatText(c):fmtClock(c.start);
      var inner='<div class="cv">'+(cov?'<img src="'+esc(cov)+'" alt="" loading="lazy">':'<div class="ph">🎬</div>')+'<span class="mini" style="'+miniBg+'">'+esc(si[1])+'</span></div>'
        +'<div class="bd"><div class="ht">'+esc(c.title)+'</div>'+(c.teacher_name?'<div style="font-size:12px;color:var(--soft)">'+esc(c.teacher_name)+'</div>':"")+'<div class="hm">'+esc(when)+'</div></div>';
      return url?'<a class="lv-hc" target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">'+inner+'</a>':'<div class="lv-hc">'+inner+'</div>';
    }).join("");
  }

  function reportError(type,detail){try{navigator.sendBeacon&&navigator.sendBeacon(API+"/api/collect/error",JSON.stringify({visitorId:vid(),sessionId:vid(),pathname:"/live/",error_type:type,message:String(detail).slice(0,120),source:"live"}));}catch(e){}}

  function fetchToday(){
    return fetch(API+"/live/today").then(function(r){return r.json();}).then(function(r){
      if(!r||!r.ok){return;}
      if(typeof r.serverTime==="number")state.offset=r.serverTime-Math.floor(Date.now()/1000);
      if(typeof r.online==="number")state.online=r.online;
      if(typeof r.cum==="number")state.cum=r.cum;
      var newCourse=r.course||null;
      var changed=!state.course||!newCourse||state.course.id!==newCourse.id||state.course.status!==newCourse.status||state.course.embed_mode!==newCourse.embed_mode;
      state.course=newCourse;
      if(changed)renderCourse();
      else applyStage();
      var on=document.getElementById("lv-online"),cu=document.getElementById("lv-cum");if(on)on.textContent=state.online;if(cu)cu.textContent=state.cum;
    }).catch(function(){});
  }
  function fetchHistory(){fetch(API+"/live/list").then(function(r){return r.json();}).then(function(r){if(r&&r.ok)renderHistory(r.courses||[]);}).catch(function(){});}
  function beat(){fetch(API+"/live/beat?v="+encodeURIComponent(vid())).then(function(r){return r.json();}).then(function(r){if(r&&r.ok){if(typeof r.online==="number")state.online=r.online;if(typeof r.cum==="number")state.cum=r.cum;var on=document.getElementById("lv-online"),cu=document.getElementById("lv-cum");if(on)on.textContent=state.online;if(cu)cu.textContent=state.cum;}}).catch(function(){});}

  function boot(){
    var s=document.createElement("style");s.textContent=css;document.head.appendChild(s);
    renderShell();
    fetchToday().then(function(){beat();fetchHistory();});
    state.tick=setInterval(tickCountdown,1000);
    setInterval(fetchToday,60000);   // 每60秒服务器重判状态(无人值守)
    setInterval(beat,45000);         // 观看心跳
    setInterval(fetchHistory,180000);
    // 语言切换 → 重载(与 dashboard 一致)
    try{var l=document.documentElement.lang;new MutationObserver(function(){if(document.documentElement.lang!==l)location.reload();}).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});}catch(e){}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();
