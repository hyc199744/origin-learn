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
    +"@media(max-width:860px){#live-wrap .lv-main{grid-template-columns:1fr;gap:16px}#live-wrap .lv-head{padding-top:64px;padding-left:16px;padding-right:16px}#live-wrap .lv-eyebrow{letter-spacing:.16em;font-size:10.5px;word-break:break-word}#live-wrap .lv-ctrls .lv-btn{flex:1 1 auto;justify-content:center}}"
    +"#live-wrap .lv-stage:fullscreen,#live-wrap .lv-stage:-webkit-full-screen{width:100vw;height:100vh;aspect-ratio:auto;border-radius:0;border:0;box-shadow:none}"
    +"#live-wrap .lv-stage:fullscreen iframe,#live-wrap .lv-stage:-webkit-full-screen iframe{width:100%;height:100%}"
    +"#live-wrap .lv-fsbtn{position:absolute;right:14px;bottom:14px;z-index:20;padding:9px 13px;color:#fff;background:rgba(0,0,0,.72);border:1px solid rgba(214,168,75,.85);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;display:inline-flex;gap:6px;align-items:center;transition:.2s}"
    +"#live-wrap .lv-fsbtn:hover{background:rgba(0,0,0,.9);border-color:var(--glt);color:var(--glt)}"
    +"@media(max-width:768px){#live-wrap .lv-fsbtn{right:10px;bottom:10px;padding:8px 11px}}";

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
    if(c.repeat_rule==="slots")return (ZH?"每天 ":"Daily ")+String(c.daily_times||"").split(",").filter(Boolean).join(" / ");
    return T.repeat_none;}

  var state={course:null,offset:0,online:0,cum:0,iframeOn:false,failTimer:null,tick:null,mode:null,lastStatus:null,loaded:false};
  function serverNow(){return Math.floor(Date.now()/1000)+state.offset;}

  function statusInfo(st){var m={
    scheduled:["b-upcoming",ZH?"课程已安排":"Scheduled"],
    upcoming:["b-upcoming",ZH?"课程已安排":"Scheduled"],
    waiting:["b-soon",ZH?"等待开课":"Waiting to start"],
    soon:["b-soon",ZH?"即将开始":"Starting soon"],
    live:["b-live",ZH?"正在直播":"Live"],
    paused:["b-soon",ZH?"直播暂时中断":"Paused"],
    ended:["b-ended",ZH?"今日课程已结束":"Ended"],
    replay:["b-upcoming",ZH?"观看回放":"Replay"],
    unavailable:["b-fail",ZH?"平台暂时无法连接":"Platform unreachable"],
    unknown:["b-ended",ZH?"课程状态待确认":"Status pending"],
    fail:["b-fail",T.st_fail],block:["b-block",T.st_block],none:["b-ended",ZH?"暂无课程":"No course"]
  };return m[st]||m.scheduled;}

  function mountIframe(url){
    var stage=document.getElementById("lv-stage");if(!stage)return;
    state.iframeOn=false;
    stage.innerHTML='<div class="lv-overlay"><div class="lv-spin"></div><div class="lv-ovsub">'+esc(T.loading)+'</div></div>';
    var f=document.createElement("iframe");
    f.id="lv-iframe";f.src=url;f.title=T.page_title||"起源线上课堂";
    f.setAttribute("allow","autoplay; fullscreen; picture-in-picture; encrypted-media; microphone; clipboard-write");
    f.setAttribute("allowfullscreen","true");f.allowFullscreen=true;
    f.setAttribute("webkitallowfullscreen","true");f.setAttribute("mozallowfullscreen","true");
    f.setAttribute("loading","lazy");
    f.setAttribute("referrerpolicy","strict-origin-when-cross-origin");
    // sandbox:给足播放/登录/全屏/弹窗所需权限,但不过度(不放开 allow-top-navigation-by-user-activation 以外的顶层跳转)
    f.setAttribute("sandbox","allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-orientation-lock allow-modals");
    f.onload=function(){state.iframeOn=true;if(state.failTimer){clearTimeout(state.failTimer);state.failTimer=null;}var ov=stage.querySelector(".lv-overlay");if(ov)ov.remove();};
    // 加载超时:12秒未 onload → 显示"加载失败/进入原课堂"(不伪造成功)
    state.failTimer=setTimeout(function(){if(!state.iframeOn)showFail(stage);},12000);
    stage.appendChild(f);
    // 播放器右下角浮动「全屏观看」按钮:即使外部平台自带全屏失效,本站容器全屏依旧可用
    var fb=document.createElement("button");fb.type="button";fb.className="lv-fsbtn";fb.id="lv-fsbtn";fb.setAttribute("aria-label",T.btn_fs);
    fb.innerHTML="⛶ "+esc(T.btn_fs);fb.onclick=toggleFullscreen;stage.appendChild(fb);
    syncFsButtons();
  }
  // ===== 全屏:容器(#lv-stage)全屏,用户点击直接同步触发;iOS/微信不支持则给备用入口 =====
  function fsElement(){return document.fullscreenElement||document.webkitFullscreenElement||null;}
  function isIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent||"")||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);}
  function toggleFullscreen(){
    if(fsElement()){var ex=document.exitFullscreen||document.webkitExitFullscreen;if(ex)try{ex.call(document);}catch(e){}return;}
    var el=document.getElementById("lv-stage");if(!el){fsFallback();return;}
    var req=el.requestFullscreen||el.webkitRequestFullscreen;
    if(!req||isIOS()){fsFallback();return;} // iOS Safari 对非<video>元素不支持全屏 → 走备用,不假装成功
    try{var p=req.call(el);if(p&&p.catch)p.catch(function(){fsFallback();});}catch(e){fsFallback();}
  }
  function fsFallback(){
    var ctrls=document.querySelector("#live-wrap .lv-ctrls");
    var msg=ZH?"当前浏览器或课程平台限制了嵌入式全屏。请点「在原平台打开」，在原课堂里全屏观看。":"This browser or the course platform blocks embedded fullscreen. Use “Open on original platform” and go fullscreen there.";
    var note=document.getElementById("lv-fsnote");
    if(!note&&ctrls&&ctrls.parentNode){note=document.createElement("div");note.id="lv-fsnote";note.style.cssText="width:100%;margin-top:8px;font-size:12.5px;color:#ffb454;line-height:1.7";ctrls.parentNode.insertBefore(note,ctrls.nextSibling);}
    if(note){note.textContent="⚠ "+msg;clearTimeout(note._t);note._t=setTimeout(function(){if(note)note.textContent="";},9000);}
  }
  function syncFsButtons(){
    var on=!!fsElement();var lbl=on?(ZH?"✕ 退出全屏":"✕ Exit fullscreen"):("⛶ "+T.btn_fs);
    var b1=document.getElementById("lv-fs");if(b1)b1.innerHTML=lbl;
    var b2=document.getElementById("lv-fsbtn");if(b2)b2.innerHTML=lbl;
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
    if(st==="waiting"){ // 已到时段但原平台还没开播 → 等待开课(不显示"直播中")
      stage.innerHTML='<div class="lv-overlay">'+cover+'<div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:14px"><div class="lv-spin"></div>'
        +'<div class="lv-ovtitle">'+(ZH?"等待老师开课":"Waiting for the class to start")+'</div>'
        +'<div class="lv-ovsub">'+(ZH?"已到开课时段，正在等待老师在原平台开播；开播后本页会自动切换为直播。":"In the class window — waiting for the host to go live. It will switch automatically once the platform starts.")+'</div>'
        +(url?'<a class="lv-btn primary big" target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">'+esc(T.btn_enter)+' ↗</a>':"")+'</div></div>';
      return;
    }
    var hint=st==="soon"?T.soon_hint:T.upcoming_hint;
    stage.innerHTML='<div class="lv-overlay">'+cover+'<div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:14px">'
      +'<div class="lv-cd" id="lv-cd"><small>'+esc(T.countdown_start)+'</small><span id="lv-cdv">--:--</span></div>'
      +'<div class="lv-ovsub">'+esc(hint)+'</div>'
      +(st==="soon"&&url?'<a class="lv-btn primary big" target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">'+esc(T.btn_enter)+' ↗</a>':"")
      +'</div></div>';
  }
  function showEnded(stage,replay){
    var c=state.course,cover=c&&safeCover(c.cover_url)?'<img class="lv-cover" src="'+esc(safeCover(c.cover_url))+'" alt="">':"";
    var url=safeUrl(c&&c.external_url);
    var sub=replay?(ZH?"本场直播已结束，回放已就绪。":"This session has ended — replay is ready."):(ZH?"本场直播已结束。有回放时这里会显示「观看回放」。":"This session has ended. A replay button will appear here when available.");
    var btn=(replay&&url)?'<a class="lv-btn primary big" target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">▶ '+(ZH?"观看回放":"Watch replay")+' ↗</a>':'<div class="lv-ovsub" style="color:#8fa0a6">'+(ZH?"等待回放上传":"Waiting for replay upload")+'</div>';
    stage.innerHTML='<div class="lv-overlay">'+cover+'<div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:12px"><div style="font-size:34px">🌙</div><div class="lv-ovtitle">'+(ZH?"今日课程已结束":"Today's session has ended")+'</div><div class="lv-ovsub">'+esc(sub)+'</div>'+btn+'</div></div>';
  }
  function showUnavailable(stage){
    var c=state.course,url=safeUrl(c&&c.external_url),cover=c&&safeCover(c.cover_url)?'<img class="lv-cover" src="'+esc(safeCover(c.cover_url))+'" alt="">':"";
    var last=c&&c.lastSyncedAt?fmtClock(c.lastSyncedAt):"";
    stage.innerHTML='<div class="lv-overlay">'+cover+'<div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:12px"><div style="font-size:32px">🛰️</div><div class="lv-ovtitle">'+(ZH?"课程状态正在同步":"Syncing course status")+'</div><div class="lv-ovsub">'+(ZH?"暂时读不到课程平台的实时状态，正在自动重试。":"Temporarily can't read the platform's live status; auto-retrying.")+(last?(ZH?" 最后更新："+last:" Last update: "+last):"")+'</div>'+(url?'<a class="lv-btn primary big" target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">'+(ZH?"进入原课堂查看":"Open original classroom")+' ↗</a>':"")+'</div></div>';
  }
  function showUnknown(stage){
    var c=state.course,url=safeUrl(c&&c.external_url),cover=c&&safeCover(c.cover_url)?'<img class="lv-cover" src="'+esc(safeCover(c.cover_url))+'" alt="">':"";
    stage.innerHTML='<div class="lv-overlay">'+cover+'<div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:12px"><div style="font-size:32px">❔</div><div class="lv-ovtitle">'+(ZH?"课程状态待确认":"Course status pending")+'</div>'+(url?'<a class="lv-btn primary big" target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">'+(ZH?"进入原课堂查看":"Open original classroom")+' ↗</a>':"")+'</div></div>';
  }
  function togglePausedBanner(on){
    var stage=document.getElementById("lv-stage");if(!stage)return;var b=document.getElementById("lv-pausebar");
    if(on){if(!b){b=document.createElement("div");b.id="lv-pausebar";b.style.cssText="position:absolute;left:0;right:0;top:0;z-index:15;background:rgba(214,168,75,.94);color:#1a1206;font-size:13px;font-weight:700;text-align:center;padding:7px 10px";b.textContent=ZH?"⏸ 直播暂时中断，请稍候…正在自动检查恢复":"⏸ Stream paused, please wait… auto-checking for resume";stage.appendChild(b);}}
    else if(b){b.remove();}
  }

  // 完全按服务器(=原平台)状态呈现,前端不再本地重算"直播中"(遵"以原平台实际状态为准")
  function applyStage(){
    var stage=document.getElementById("lv-stage");if(!stage||!state.course)return;
    var c=state.course,st=c.status||"unknown";
    var changed=st!==state.lastStatus;state.lastStatus=st;
    updateBadge(st);
    if(st==="live"||st==="paused"||st==="replay"){ // 播放器状态:挂/保留 iframe,不重建正在播放的画面
      if(c.embed_mode==="redirect"){if(changed||state.mode!=="block"){state.mode="block";showRedirect(stage,"block");}}
      else{if(state.mode!=="embed"){state.mode="embed";mountIframe(safeUrl(c.external_url)||c.external_url);}}
      togglePausedBanner(st==="paused");
      return;
    }
    togglePausedBanner(false);
    if(st==="scheduled"||st==="soon"||st==="upcoming"||st==="waiting"){if(state.mode!=="cd_"+st){state.mode="cd_"+st;showCountdown(stage,st);}return;}
    if(st==="ended"){if(state.mode!=="ended"){state.mode="ended";showEnded(stage,!!c.replayAvailable);}return;}
    if(st==="unavailable"){if(state.mode!=="unavail"){state.mode="unavail";showUnavailable(stage);}return;}
    if(state.mode!=="unknown"){state.mode="unknown";showUnknown(stage);}
  }
  function updateBadge(st){var b=document.getElementById("lv-badge");if(!b)return;var si=statusInfo(st);b.className="lv-badge "+si[0];b.innerHTML='<span class="lv-dot"></span>'+esc(si[1]);}

  // 倒计时只更新数字显示;到点不本地判直播,等服务器(原平台)切换
  function tickCountdown(){
    if(!state.course)return;var c=state.course,now=serverNow();
    if(String(state.mode).indexOf("cd_")===0&&c.start){var cdv=document.getElementById("lv-cdv");if(cdv)cdv.textContent=now<c.start?fmtDur(c.start-now):"00:00";}
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
  function srcFootnote(c){
    var t=c.source==="page_json"?(ZH?"状态来自课程平台实时同步":"Live-synced from the course platform"):(c.source==="manual"?(ZH?"状态为管理员手动设置":"Set manually by admin"):(c.source==="unavailable"?(ZH?"平台状态暂时读取失败":"Platform status temporarily unavailable"):(ZH?"状态按排期时间显示":"Shown by schedule")));
    var last=c.lastSyncedAt?(" · "+(ZH?"更新于 ":"updated ")+fmtClock(c.lastSyncedAt)):"";
    return '<div style="margin-top:8px;font-size:11.5px;color:var(--muted)">'+esc(t+last)+'</div>';
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
      +'<div class="lv-meta">'+(c.teacher_name?'<span>'+esc(T.teacher)+'：<b>'+esc(c.teacher_name)+'</b></span>':"")+'<span>'+esc(T.time)+'：<b>'+esc(timeTxt)+'</b></span></div>'
      +srcFootnote(c)+'</div>'
      +'<div class="lv-stats"><div class="lv-stat"><div class="n" id="lv-online">'+state.online+'</div><div class="l">'+esc(T.online)+'</div></div><div class="lv-stat"><div class="n" id="lv-cum">'+state.cum+'</div><div class="l">'+esc(T.cum)+'</div></div></div>'
      +(c.notice?'<div class="lv-card" style="border-color:rgba(214,168,75,.45)"><div class="lv-h3">'+(ZH?"课程公告":"Notice")+'</div><div class="lv-desc">'+esc(c.notice)+'</div></div>':"")
      +(c.description?'<div class="lv-card"><div class="lv-h3">'+esc(T.intro)+'</div><div class="lv-desc">'+esc(c.description)+'</div></div>':"")
      +'</div></div>';
    // 控件绑定
    document.getElementById("lv-fs").onclick=toggleFullscreen;
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

  // 带超时的 fetch:AbortController 能中止请求;老浏览器无 AbortController 时也用 Promise.race 到点拒绝兜底,保证一定会 settle(不会永远 pending 卡转圈)
  function fetchJSON(path,ms){
    ms=ms||11000;
    var ctl=("AbortController" in window)?new AbortController():null;
    var timeout=new Promise(function(_,rej){setTimeout(function(){if(ctl){try{ctl.abort();}catch(e){}}rej(new Error("timeout"));},ms);});
    var req=fetch(API+path,ctl?{signal:ctl.signal}:{}).then(function(r){return r.json();});
    return Promise.race([req,timeout]);
  }
  function renderError(){
    if(state.loaded)return; // 已经出过课程/空状态就别用错误页盖掉,只在首屏没加载出来时提示
    var body=document.getElementById("lv-body");if(!body)return;
    body.innerHTML='<div class="lv-empty"><div style="font-size:38px;margin-bottom:12px">📡</div>'
      +'<div class="lv-ctitle" style="color:var(--glt)">'+(ZH?"课程数据加载失败":"Failed to load course data")+'</div>'
      +'<div style="margin-top:12px;font-size:14px;line-height:1.85">'+(ZH?"没能连上课程数据服务。多半是网络问题，或你的 VPN／广告拦截插件挡住了数据域名 count.web3origin.com（它名字叫 count，容易被误当成追踪器拦掉）。可以关掉拦截插件、或切换网络后点下面重试。":"Couldn't reach the course data service. This is usually a network issue, or your VPN / ad-blocker is blocking the data domain count.web3origin.com. Try disabling the blocker or switching network, then retry.")+'</div>'
      +'<div style="margin-top:18px"><button class="lv-btn primary big" id="lv-retry">'+(ZH?"↻ 重新加载":"↻ Retry")+'</button></div>'
      +'<div style="margin-top:14px;font-size:12px;color:var(--muted)"><a href="'+API+'/live/today" target="_blank" rel="noopener noreferrer" style="color:var(--soft)">'+(ZH?"自测：点这里，如果也打不开就是网络/拦截挡了数据接口":"Self-check: open this — if it also fails, the data endpoint is blocked")+'</a></div></div>';
    var rb=document.getElementById("lv-retry");
    if(rb)rb.onclick=function(){body.innerHTML='<div class="lv-empty"><div class="lv-spin" style="margin:0 auto 16px"></div>'+esc(T.loading_page)+'</div>';fetchToday().then(function(){beat();fetchHistory();});};
  }
  function fetchToday(){
    return fetchJSON("/live/today",11000).then(function(r){
      if(!r||!r.ok){renderError();return;}
      state.loaded=true;
      if(typeof r.serverTime==="number")state.offset=r.serverTime-Math.floor(Date.now()/1000);
      if(typeof r.online==="number")state.online=r.online;
      if(typeof r.cum==="number")state.cum=r.cum;
      var newCourse=r.course||null;
      // 播放器状态之间(live/paused/replay)互切不整块重建,以免打断正在播放的画面(遵规范十一)
      var playerSet={live:1,paused:1,replay:1},oldC=state.course,os=oldC&&oldC.status,ns=newCourse&&newCourse.status;
      var bothPlayer=oldC&&newCourse&&playerSet[os]&&playerSet[ns]&&oldC.id===newCourse.id&&oldC.embed_mode===newCourse.embed_mode;
      var changed=!oldC||!newCourse||oldC.id!==newCourse.id||oldC.embed_mode!==newCourse.embed_mode||(os!==ns&&!bothPlayer);
      state.course=newCourse;
      if(changed)renderCourse();
      else applyStage();
      var on=document.getElementById("lv-online"),cu=document.getElementById("lv-cum");if(on)on.textContent=state.online;if(cu)cu.textContent=state.cum;
    }).catch(function(){renderError();});
  }
  function fetchHistory(){fetchJSON("/live/list",10000).then(function(r){if(r&&r.ok)renderHistory(r.courses||[]);}).catch(function(){});}
  function beat(){fetchJSON("/live/beat?v="+encodeURIComponent(vid()),8000).then(function(r){if(r&&r.ok){if(typeof r.online==="number")state.online=r.online;if(typeof r.cum==="number")state.cum=r.cum;var on=document.getElementById("lv-online"),cu=document.getElementById("lv-cum");if(on)on.textContent=state.online;if(cu)cu.textContent=state.cum;}}).catch(function(){});}

  function boot(){
    var s=document.createElement("style");s.textContent=css;document.head.appendChild(s);
    renderShell();
    fetchToday().then(function(){beat();fetchHistory();});
    document.addEventListener("fullscreenchange",syncFsButtons);
    document.addEventListener("webkitfullscreenchange",syncFsButtons);
    state.tick=setInterval(tickCountdown,1000);
    setInterval(function(){if(!document.hidden)fetchToday();},30000);   // 可见时每30秒同步(遵规范八:后台标签页降频)
    setInterval(beat,45000);         // 观看心跳
    setInterval(fetchHistory,180000);
    // 标签页重新激活时立即刷新一次
    document.addEventListener("visibilitychange",function(){if(!document.hidden){fetchToday();beat();}});
    // 语言切换 → 重载(与 dashboard 一致)
    try{var l=document.documentElement.lang;new MutationObserver(function(){if(document.documentElement.lang!==l)location.reload();}).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});}catch(e){}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();
