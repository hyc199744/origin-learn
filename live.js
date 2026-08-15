/* 起源线上课堂 /live —— 自包含前台(播放器状态机 + 倒计时 + iframe超时检测 + 跳转备用 + 中英)
   数据全部来自后台 Worker(count.web3origin.com),外链不硬编码。 */
(function(){
  "use strict";
  var API="https://count.web3origin.com";
  var EP=window.LV_EP||{};
  var EPtoday=EP.today||"/live/today",EPstream=EP.stream||"/live/stream",EPchat=EP.chat||"/live/chat",EPsend=EP.send||"/live/chat/send",EPlike=EP.like||"/live/like",EPbeat=EP.beat||"/live/beat";
  var ZH=document.documentElement.lang!=="en"&&!/^en/i.test(document.documentElement.lang||"");
  var T=ZH?{
    eyebrow:"ORIGIN LIVE · 起源生态学习课堂",
    page_title:"线上直播",
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
    server_time:"服务器时间",loading_page:"课堂加载中…",
    replays_title:"往期回放",replays_sub:"过去录播课程 · 点击任意一节即可在本页回看",no_replays:"暂无往期回放，录制过的课程结束后会自动出现在这里",watch_replay:"观看回放",replay_min:"分钟"
  }:{
    eyebrow:"ORIGIN LIVE · Learning Classroom",
    page_title:"Live Stream",
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
    server_time:"Server time",loading_page:"Loading…",
    replays_title:"Past Replays",replays_sub:"Recorded past sessions · tap any one to watch it here",no_replays:"No replays yet — recorded sessions will appear here automatically after they end",watch_replay:"Watch replay",replay_min:"min"
  };
  if(window.LV_TITLE){T.page_title=window.LV_TITLE;}
  if(window.LV_EYEBROW){T.eyebrow=window.LV_EYEBROW;}
  if(window.LV_SUB){T.subtitle=window.LV_SUB;}

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
    +"@media(max-width:768px){#live-wrap .lv-fsbtn{right:10px;bottom:10px;padding:8px 11px}}"
    +"#live-wrap #lv-video::-webkit-media-controls-timeline,#live-wrap #lv-video::-webkit-media-controls-current-time-display,#live-wrap #lv-video::-webkit-media-controls-time-remaining-display,#live-wrap #lv-video::-webkit-media-controls-seek-back-button,#live-wrap #lv-video::-webkit-media-controls-seek-forward-button{display:none!important}"
    +"#live-wrap .lv-playercol{position:relative}"
    +"#live-wrap .lv-hearts{position:absolute;left:0;right:0;top:0;bottom:64px;pointer-events:none;overflow:hidden;z-index:12}"
    +"#live-wrap .lv-heart{position:absolute;bottom:6px;font-size:22px;will-change:transform,opacity;animation:lvfloat 1.9s ease-out forwards}"
    +"@keyframes lvfloat{0%{opacity:0;transform:translateY(0) scale(.5)}12%{opacity:1}100%{opacity:0;transform:translateY(-170px) translateX(var(--dx,0)) scale(1.25)}}"
    +"#live-wrap .lv-chat{background:var(--pnl);border:1px solid var(--line);border-radius:14px;display:flex;flex-direction:column;overflow:hidden;height:360px}"
    +"#live-wrap .lv-chat-hd{padding:10px 13px;border-bottom:1px solid var(--line);font-size:13px;color:var(--g);display:flex;justify-content:space-between;align-items:center;gap:8px}"
    +"#live-wrap .lv-chat-list{flex:1;overflow-y:auto;padding:10px 13px;display:flex;flex-direction:column;gap:7px}"
    +"#live-wrap .lv-msg{font-size:13.5px;line-height:1.5;word-break:break-word;color:var(--soft)}"
    +"#live-wrap .lv-msg b{color:var(--glt);font-weight:600;margin-right:6px}#live-wrap .lv-msg.me b{color:var(--grn2)}"
    +"#live-wrap .lv-chat-empty{color:var(--muted);font-size:13px;text-align:center;margin:auto}"
    +"#live-wrap .lv-chat-in{display:flex;gap:8px;padding:9px;border-top:1px solid var(--line)}"
    +"#live-wrap .lv-chat-in input{flex:1;min-width:0;background:#0b0906;border:1px solid var(--line);border-radius:8px;color:var(--bone);font:inherit;font-size:13.5px;padding:8px 11px}"
    +"#live-wrap .lv-chat-in button{flex:0 0 auto;background:linear-gradient(90deg,var(--g),#b8842f);border:0;color:#1a1206;font-weight:700;border-radius:8px;padding:8px 15px;cursor:pointer;font:inherit;font-size:13.5px}"
    +"#live-wrap .lv-chat-in button:disabled{opacity:.5}"
    +"#live-wrap .lv-nick{width:96px;background:#0b0906;border:1px solid var(--line);border-radius:6px;color:var(--soft);font:inherit;font-size:12px;padding:3px 7px}"
    +"#live-wrap #lv-like b{color:var(--grn2);margin-left:4px}"
    +"#live-wrap .lv-rep-head{display:flex;align-items:center;gap:13px;margin-bottom:16px}"
    +"#live-wrap .lv-rep-ic{flex:0 0 auto;width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,rgba(214,168,75,.22),rgba(214,168,75,.06));border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:21px}"
    +"#live-wrap .lv-rep-title{font-family:'STZhongsong',serif;font-size:20px;color:var(--glt);letter-spacing:.08em}"
    +"#live-wrap .lv-rep-desc{font-size:12.5px;color:var(--soft);margin-top:2px}"
    +"#live-wrap .lv-rep-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}"
    +"#live-wrap .lv-rep-item{display:flex;align-items:center;gap:14px;padding:13px 15px;background:linear-gradient(180deg,rgba(255,255,255,.028),rgba(255,255,255,0));border:1px solid var(--line);border-radius:14px;cursor:pointer;transition:.2s;text-align:left}"
    +"#live-wrap .lv-rep-item:hover,#live-wrap .lv-rep-item:focus{border-color:var(--g);transform:translateY(-2px);background:rgba(214,168,75,.06);box-shadow:0 12px 28px rgba(0,0,0,.35);outline:none}"
    +"#live-wrap .lv-rep-play{position:relative;flex:0 0 auto;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--glt),#b8842f);display:flex;align-items:center;justify-content:center;color:#1a1206;font-size:17px;box-shadow:0 6px 16px rgba(214,168,75,.32);transition:.2s;overflow:hidden}"
    +"#live-wrap .lv-rep-play img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.9}"
    +"#live-wrap .lv-rep-play span{position:relative;z-index:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))}"
    +"#live-wrap .lv-rep-item:hover .lv-rep-play{transform:scale(1.07)}"
    +"#live-wrap .lv-rep-body{min-width:0;flex:1}"
    +"#live-wrap .lv-rep-h{font-size:15px;color:var(--bone);font-weight:600;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"
    +"#live-wrap .lv-rep-m{display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px;margin-top:5px;font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}"
    +"#live-wrap .lv-rep-tag{font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(118,255,54,.12);color:var(--grn2);border:1px solid rgba(37,201,111,.4);font-weight:600}"
    +"#live-wrap .lv-rep-plays{color:var(--g);font-weight:700;font-variant-numeric:tabular-nums}"
    +"#live-wrap .lv-rep-share{flex:0 0 auto;width:38px;height:38px;border-radius:10px;border:1px solid var(--line);background:rgba(255,255,255,.03);color:var(--glt);font-size:16px;cursor:pointer;transition:.15s}#live-wrap .lv-rep-share:hover{border-color:var(--g);background:rgba(214,168,75,.1);transform:scale(1.06)}"
    +"#live-wrap .lv-modal{position:fixed;inset:0;z-index:100000;background:rgba(3,5,4,.86);backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;padding:20px}"
    +"#live-wrap .lv-modal.on{display:flex}"
    +"#live-wrap .lv-modal-box{width:min(1000px,96vw);background:var(--pnl);border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6);display:flex;flex-direction:column;max-height:92vh}"
    +"#live-wrap .lv-modal-hd{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid var(--line)}"
    +"#live-wrap .lv-modal-hd .t{font-family:'STZhongsong',serif;font-size:16px;color:var(--glt);line-height:1.4;word-break:break-word;min-width:0}"
    +"#live-wrap .lv-modal-hd .x{flex:0 0 auto;appearance:none;cursor:pointer;background:rgba(255,255,255,.05);border:1px solid var(--line);color:var(--bone);border-radius:8px;padding:7px 12px;font:inherit;font-size:14px}"
    +"#live-wrap .lv-modal-hd .x:hover{border-color:var(--g);color:var(--glt)}"
    +"#live-wrap .lv-modal-stage{position:relative;width:100%;aspect-ratio:16/9;background:#000}"
    +"#live-wrap .lv-modal-stage iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}"
    +"@media(max-width:600px){#live-wrap .lv-modal{padding:0}#live-wrap .lv-modal-box{width:100vw;height:100vh;max-height:100vh;border-radius:0;border:0}}"
    +"#live-wrap .lv-ap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:26px;background:radial-gradient(620px 340px at 50% 22%,rgba(214,168,75,.16),transparent),#0b0906}"
    +"#live-wrap .lv-ap-art{width:clamp(120px,30vw,176px);height:clamp(120px,30vw,176px);border-radius:20px;overflow:hidden;box-shadow:0 22px 54px rgba(0,0,0,.55);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(214,168,75,.28),rgba(214,168,75,.05))}"
    +"#live-wrap .lv-ap-art img{width:100%;height:100%;object-fit:cover}#live-wrap .lv-ap-art span{font-size:62px;filter:drop-shadow(0 8px 20px rgba(214,168,75,.4))}"
    +"#live-wrap .lv-ap-title{font-family:'STZhongsong',serif;font-size:clamp(17px,3.4vw,21px);color:var(--glt);text-align:center;max-width:92%;line-height:1.4;word-break:break-word}"
    +"#live-wrap .lv-ap-transport{display:flex;align-items:center;justify-content:center;gap:22px;margin-top:2px}"
    +"#live-wrap .lv-ap-nav{width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:rgba(255,255,255,.04);color:var(--glt);font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.15s}#live-wrap .lv-ap-nav:hover{border-color:var(--g);background:rgba(214,168,75,.1);transform:scale(1.06)}"
    +"#live-wrap .lv-ap-ctrls{display:flex;align-items:center;gap:11px;width:min(560px,94%);margin-top:4px}"
    +"#live-wrap .lv-ap-btn{flex:0 0 auto;width:52px;height:52px;border-radius:50%;border:0;cursor:pointer;background:linear-gradient(135deg,var(--glt),#b8842f);color:#1a1206;font-size:19px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 22px rgba(214,168,75,.36);transition:.15s}#live-wrap .lv-ap-btn:hover{transform:scale(1.06)}"
    +"#live-wrap .lv-ap-time{flex:0 0 auto;font-size:12.5px;color:var(--soft);font-variant-numeric:tabular-nums;min-width:40px;text-align:center}"
    +"#live-wrap .lv-ap-bar{position:relative;flex:1;height:6px;background:rgba(255,255,255,.13);border-radius:999px;cursor:pointer;touch-action:none}"
    +"#live-wrap .lv-ap-fill{position:absolute;left:0;top:0;height:100%;width:0;background:linear-gradient(90deg,var(--g),var(--glt));border-radius:999px}"
    +"#live-wrap .lv-ap-knob{position:absolute;top:50%;left:0;width:13px;height:13px;border-radius:50%;background:var(--glt);transform:translate(-50%,-50%);box-shadow:0 2px 7px rgba(0,0,0,.45)}"
    +"#live-wrap .lv-ap-rate{flex:0 0 auto;min-width:44px;padding:6px 9px;border-radius:8px;border:1px solid var(--line);background:rgba(255,255,255,.04);color:var(--soft);font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;font-variant-numeric:tabular-nums;transition:.15s}#live-wrap .lv-ap-rate:hover{border-color:var(--g);color:var(--glt)}"
    +"#live-wrap .lv-mini{position:fixed;left:50%;bottom:16px;transform:translateX(-50%) translateY(150%);z-index:99998;display:flex;align-items:center;gap:10px;width:min(430px,94vw);padding:9px 11px;background:rgba(14,11,7,.97);border:1px solid var(--g);border-radius:14px;box-shadow:0 16px 44px rgba(0,0,0,.55);backdrop-filter:blur(6px);opacity:0;transition:.28s;pointer-events:none}"
    +"#live-wrap .lv-mini.on{transform:translateX(-50%) translateY(0);opacity:1;pointer-events:auto}"
    +"#live-wrap .lv-mini-art{flex:0 0 auto;width:40px;height:40px;border-radius:9px;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:20px;background:linear-gradient(135deg,rgba(214,168,75,.3),rgba(214,168,75,.05));border:1px solid var(--line)}#live-wrap .lv-mini-art img{width:100%;height:100%;object-fit:cover}"
    +"#live-wrap .lv-mini-info{flex:1;min-width:0;cursor:pointer}"
    +"#live-wrap .lv-mini-t{font-size:13px;color:var(--glt);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"
    +"#live-wrap .lv-mini-p{margin-top:5px;height:4px;background:rgba(255,255,255,.13);border-radius:999px;overflow:hidden}#live-wrap .lv-mini-fill{height:100%;width:0;background:linear-gradient(90deg,var(--g),var(--glt))}"
    +"#live-wrap .lv-mini-btn{flex:0 0 auto;width:38px;height:38px;border-radius:50%;border:0;cursor:pointer;background:linear-gradient(135deg,var(--glt),#b8842f);color:#1a1206;font-size:15px;display:flex;align-items:center;justify-content:center}"
    +"#live-wrap .lv-mini-next{flex:0 0 auto;width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:rgba(255,255,255,.04);color:var(--glt);cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center}#live-wrap .lv-mini-next:hover{border-color:var(--g)}"
    +"#live-wrap .lv-mini-x{flex:0 0 auto;width:30px;height:30px;border-radius:8px;border:1px solid var(--line);background:transparent;color:var(--soft);cursor:pointer;font-size:13px}#live-wrap .lv-mini-x:hover{color:var(--glt);border-color:var(--g)}"
    +"@media(max-width:600px){#live-wrap .lv-mini{bottom:78px}}";

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

  var state={course:null,offset:0,online:0,cum:0,iframeOn:false,failTimer:null,tick:null,mode:null,lastStatus:null,loaded:false,hls:null,streamFallback:false};
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

  // ===== 自建播放器:直接播直播流(hls.js/原生HLS),原生全屏完美,断流换token重连,不行回退iframe =====
  function lvCanHls(){try{return !!(window.Hls&&window.Hls.isSupported())||!!document.createElement("video").canPlayType("application/vnd.apple.mpegurl");}catch(e){return false;}}
  function lvDestroyHls(){if(state.hls){try{state.hls.destroy();}catch(e){}state.hls=null;}}
  var _streamFails=0;
  function lvOnStreamError(){
    _streamFails++;
    if(_streamFails>3){lvDestroyHls();state.streamFallback=true;state.mode=null;state.lastStatus=null;applyStage();return;} // 多次失败→回退iframe
    fetchJSON(EPstream,10000).then(function(r){ // 拉最新流地址(换token)重连
      if(r&&r.ok&&r.live&&r.streamUrl){if(state.course)state.course.streamUrl=r.streamUrl;state.mode=null;applyStage();}
      else{lvDestroyHls();state.streamFallback=true;state.mode=null;state.lastStatus=null;applyStage();}
    }).catch(function(){lvDestroyHls();state.streamFallback=true;state.mode=null;applyStage();});
  }
  function lvTryPlay(v){var p=v.play&&v.play();if(p&&p.catch)p.catch(function(){if(!v.muted){v.muted=true;var p2=v.play&&v.play();if(p2&&p2.catch)p2.catch(function(){});}});}
  function mountVideo(url){
    var stage=document.getElementById("lv-stage");if(!stage)return;
    lvDestroyHls();state.iframeOn=false;if(state.failTimer){clearTimeout(state.failTimer);state.failTimer=null;}
    stage.innerHTML='<div class="lv-overlay"><div class="lv-spin"></div></div>';
    var v=document.createElement("video");v.id="lv-video";
    v.setAttribute("playsinline","");v.setAttribute("webkit-playsinline","");v.controls=true;v.autoplay=true;var _ws=false;try{_ws=/[?&](sound|snd)=1/.test(location.search);}catch(e){}v.muted=!_ws;
    v.style.cssText="position:absolute;inset:0;width:100%;height:100%;background:#000;object-fit:contain;display:block";
    stage.appendChild(v);
    var un=document.createElement("button");un.type="button";un.id="lv-unmute";un.className="lv-fsbtn";un.style.left="14px";un.style.right="auto";un.innerHTML="🔊 "+(ZH?"开启声音":"Sound");
    un.onclick=function(){v.muted=false;var pr=v.play();if(pr&&pr.catch)pr.catch(function(){});un.remove();};
    var readied=false;
    function ready(){if(readied)return;readied=true;_streamFails=0;if(state.failTimer){clearTimeout(state.failTimer);state.failTimer=null;}var ov=stage.querySelector(".lv-overlay");if(ov)ov.remove();if(!document.getElementById("lv-unmute"))stage.appendChild(un);syncFsButtons();}
    v.addEventListener("playing",ready);v.addEventListener("loadeddata",ready);
    v.addEventListener("playing",function(){if(!v.muted){var _b=document.getElementById("lv-unmute");if(_b)_b.remove();}});
    v.addEventListener("error",function(){lvOnStreamError();});
    if(v.canPlayType("application/vnd.apple.mpegurl")){v.src=url;lvTryPlay(v);}
    else if(window.Hls&&window.Hls.isSupported()){
      var hls=new window.Hls({liveDurationInfinity:true,enableWorker:true,lowLatencyMode:false,
        backBufferLength:30,maxBufferLength:90,maxMaxBufferLength:200,
        liveSyncDurationCount:8,liveMaxLatencyDurationCount:40,
        maxBufferHole:0.5,nudgeMaxRetry:12,nudgeOffset:0.2,
        fragLoadingMaxRetry:12,fragLoadingRetryDelay:500,manifestLoadingMaxRetry:8,levelLoadingMaxRetry:8});state.hls=hls;
      hls.loadSource(url);hls.attachMedia(v);
      hls.on(window.Hls.Events.MANIFEST_PARSED,function(){lvTryPlay(v);});
      hls.on(window.Hls.Events.ERROR,function(e,data){if(data&&data.fatal)lvOnStreamError();});
    } else {state.streamFallback=true;state.mode=null;applyStage();return;}
    state.failTimer=setTimeout(function(){if(v.readyState<2&&!readied)lvOnStreamError();},15000);
  }
  function mountIframe(url){
    var stage=document.getElementById("lv-stage");if(!stage)return;
    state.iframeOn=false;
    stage.innerHTML='<div class="lv-overlay"><div class="lv-spin"></div><div class="lv-ovsub">'+esc(T.loading)+'</div></div>';
    var f=document.createElement("iframe");
    f.id="lv-iframe";f.src=url;f.title=T.page_title||"线上直播";
    f.setAttribute("allow","autoplay; fullscreen; picture-in-picture; encrypted-media; microphone; clipboard-write");
    f.setAttribute("allowfullscreen","true");f.allowFullscreen=true;
    f.setAttribute("webkitallowfullscreen","true");f.setAttribute("mozallowfullscreen","true");
    f.setAttribute("loading","lazy");
    f.setAttribute("referrerpolicy","strict-origin-when-cross-origin");
    // sandbox:给足播放/登录/全屏/弹窗所需权限,但不过度(不放开 allow-top-navigation-by-user-activation 以外的顶层跳转)
    f.setAttribute("sandbox","allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-orientation-lock allow-modals");
    f.onload=function(){state.iframeOn=true;if(state.failTimer){clearTimeout(state.failTimer);state.failTimer=null;}var ovs=stage.querySelectorAll(".lv-overlay,#lv-failbar");for(var oi=0;oi<ovs.length;oi++)ovs[oi].remove();};
    // 加载超时:20秒未 onload → 底部小条提示刷新(播放器页较重给足时间;不遮挡画面、不伪造成功、不外跳)
    state.failTimer=setTimeout(function(){if(!state.iframeOn)showFail(stage);},20000);
    stage.appendChild(f);
    cropIframe();
    syncFsButtons();
  }
  // ===== 全屏:容器(#lv-stage)全屏,用户点击直接同步触发;iOS/微信不支持则给备用入口 =====
  function fsElement(){return document.fullscreenElement||document.webkitFullscreenElement||null;}
  function isIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent||"")||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);}
  function isTouch(){return ("ontouchstart" in window)||(navigator.maxTouchPoints>0);}
  var LV_HDR=46; // 盟主播放页顶部信息条("直播/人气")估算高度(px),裁掉它让视频铺满
  // 播放器嵌的是整页,顶部有信息条会把视频往下挤致底部被裁。裁掉头部:普通视图让视频铺满16:9;手机全屏按屏高把16:9视频居中
  function cropIframe(){
    var f=document.getElementById("lv-iframe");if(!f)return;
    f.style.position="absolute";
    if(fsElement()&&isTouch()){
      var W=window.innerWidth,H=window.innerHeight,hdr=Math.round(H*0.12),vw=Math.min(W,Math.round(H*16/9));
      f.style.left=Math.round((W-vw)/2)+"px";f.style.top=(-hdr)+"px";f.style.width=vw+"px";f.style.height=(H+hdr)+"px";
    } else {
      f.style.left="0";f.style.width="100%";f.style.top=(-LV_HDR)+"px";f.style.height="calc(100% + "+LV_HDR+"px)";
    }
  }
  function toggleFullscreen(){
    if(fsElement()){var ex=document.exitFullscreen||document.webkitExitFullscreen;if(ex)try{ex.call(document);}catch(e){}return;}
    var v=document.getElementById("lv-video");
    if(v){ // 自建视频播放器:用视频原生全屏(iOS webkitEnterFullscreen 也能完美铺满,手机全屏就靠这条)
      if(v.webkitEnterFullscreen){try{v.webkitEnterFullscreen();return;}catch(e){}}
      var vr=v.requestFullscreen||v.webkitRequestFullscreen;
      if(vr){try{var vp=vr.call(v);if(vp&&vp.catch)vp.catch(function(){fsFallback();});return;}catch(e){}}
      fsFallback();return;
    }
    var el=document.getElementById("lv-stage");if(!el){fsFallback();return;}
    var req=el.requestFullscreen||el.webkitRequestFullscreen;
    if(!req||isIOS()){fsFallback();return;} // iOS Safari 对非<video>容器不支持全屏 → 走备用(视频路径见下,不受此限)
    var after=function(){if(isTouch()&&screen.orientation&&screen.orientation.lock){try{screen.orientation.lock("landscape").catch(function(){});}catch(e){}}setTimeout(cropIframe,60);setTimeout(cropIframe,450);};
    try{var p=req.call(el);if(p&&p.then)p.then(after,function(){fsFallback();});else after();}catch(e){fsFallback();}
  }
  function fsFallback(){
    var ctrls=document.querySelector("#live-wrap .lv-ctrls");
    var msg=ZH?"当前设备暂不支持容器全屏（常见于 iPhone Safari／微信内置浏览器）。请将手机横屏观看，或改用电脑 Chrome／Edge 打开本页全屏。":"This device doesn't support container fullscreen (common on iPhone Safari / in-app browsers). Please rotate to landscape, or open this page in desktop Chrome/Edge for fullscreen.";
    var note=document.getElementById("lv-fsnote");
    if(!note&&ctrls&&ctrls.parentNode){note=document.createElement("div");note.id="lv-fsnote";note.style.cssText="width:100%;margin-top:8px;font-size:12.5px;color:#ffb454;line-height:1.7";ctrls.parentNode.insertBefore(note,ctrls.nextSibling);}
    if(note){note.textContent="⚠ "+msg;clearTimeout(note._t);note._t=setTimeout(function(){if(note)note.textContent="";},9000);}
  }
  function syncFsButtons(){
    var on=!!fsElement();var lbl=on?(ZH?"✕ 退出全屏":"✕ Exit fullscreen"):("⛶ "+T.btn_fs);
    var b1=document.getElementById("lv-fs");if(b1)b1.innerHTML=lbl;
    var b2=document.getElementById("lv-fsbtn");if(b2)b2.innerHTML=lbl;
  }
  function showFail(stage){ // 底部小条,不遮挡正在加载的播放器
    if(document.getElementById("lv-failbar"))return;
    var bar=document.createElement("div");bar.id="lv-failbar";
    bar.style.cssText="position:absolute;left:0;right:0;bottom:0;z-index:16;background:rgba(20,14,6,.9);color:#ffd9a0;font-size:12.5px;padding:8px 12px;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap";
    bar.innerHTML='<span>'+(ZH?"若画面未出现，点右侧刷新（无需离开本页）":"If the video hasn't appeared, tap refresh — no need to leave this page")+'</span><button class="lv-btn" style="padding:5px 12px" id="lv-failreload">↻ '+esc(T.btn_refresh)+'</button>';
    stage.appendChild(bar);
    var rb=document.getElementById("lv-failreload");if(rb)rb.onclick=function(){state.mode=null;state.lastStatus=null;applyStage();};
    reportError("iframe_timeout",(state.course&&state.course.external_url)||"");
  }
  function showCountdown(stage,st){
    var c=state.course,cover=c&&safeCover(c.cover_url)?'<img class="lv-cover" src="'+esc(safeCover(c.cover_url))+'" alt="">':"";
    if(st==="waiting"){ // 已到时段但原平台还没开播 → 等待开课(不显示"直播中",不外跳)
      stage.innerHTML='<div class="lv-overlay">'+cover+'<div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:14px"><div class="lv-spin"></div>'
        +'<div class="lv-ovtitle">'+(ZH?"等待老师开课":"Waiting for the class to start")+'</div>'
        +'<div class="lv-ovsub">'+(ZH?"已到开课时段，正在等待老师开播；开播后本页会自动进入直播，无需离开本页。":"In the class window — waiting for the host to go live. This page will switch to live automatically; no need to leave.")+'</div></div></div>';
      return;
    }
    var hint=st==="soon"?T.soon_hint:T.upcoming_hint;
    stage.innerHTML='<div class="lv-overlay">'+cover+'<div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:14px">'
      +'<div class="lv-cd" id="lv-cd"><small>'+esc(T.countdown_start)+'</small><span id="lv-cdv">--:--</span></div>'
      +'<div class="lv-ovsub">'+esc(hint)+'</div></div></div>';
  }
  function showEnded(stage,replay){
    var c=state.course,cover=c&&safeCover(c.cover_url)?'<img class="lv-cover" src="'+esc(safeCover(c.cover_url))+'" alt="">':"";
    var sub=replay?(ZH?"本场直播已结束，回放即将在本页开始，请稍候…":"This session has ended — replay will start here shortly…"):(ZH?"本场直播已结束。有回放时会在本页自动播放。":"This session has ended. The replay will play here automatically when available.");
    stage.innerHTML='<div class="lv-overlay">'+cover+'<div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:12px"><div style="font-size:34px">🌙</div><div class="lv-ovtitle">'+(ZH?"今日课程已结束":"Today's session has ended")+'</div><div class="lv-ovsub">'+esc(sub)+'</div></div></div>';
  }
  function showUnavailable(stage){
    var c=state.course,cover=c&&safeCover(c.cover_url)?'<img class="lv-cover" src="'+esc(safeCover(c.cover_url))+'" alt="">':"";
    var last=c&&c.lastSyncedAt?fmtClock(c.lastSyncedAt):"";
    stage.innerHTML='<div class="lv-overlay">'+cover+'<div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:12px"><div style="font-size:32px">🛰️</div><div class="lv-ovtitle">'+(ZH?"课程状态正在同步":"Syncing course status")+'</div><div class="lv-ovsub">'+(ZH?"暂时读不到课程平台的实时状态，正在自动重试。":"Temporarily can't read the platform's live status; auto-retrying.")+(last?(ZH?" 最后更新："+last:" Last update: "+last):"")+'</div><button class="lv-btn primary big" id="lv-unavreload">↻ '+esc(T.btn_refresh)+'</button></div></div>';
    var rb=document.getElementById("lv-unavreload");if(rb)rb.onclick=function(){fetchToday();};
  }
  function showUnknown(stage){
    var c=state.course,cover=c&&safeCover(c.cover_url)?'<img class="lv-cover" src="'+esc(safeCover(c.cover_url))+'" alt="">':"";
    stage.innerHTML='<div class="lv-overlay">'+cover+'<div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:12px"><div style="font-size:32px">❔</div><div class="lv-ovtitle">'+(ZH?"课程状态待确认":"Course status pending")+'</div><button class="lv-btn primary big" id="lv-unkreload">↻ '+esc(T.btn_refresh)+'</button></div></div>';
    var rb=document.getElementById("lv-unkreload");if(rb)rb.onclick=function(){fetchToday();};
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
    // 返回直播页时若悬浮播放器正在后台听直播(本地标记),别再挂视频(避免双声道),显示后台收听提示
    if(!state.bgOn&&st==="live"){try{if(localStorage.getItem("origin_player_live")){state.bgOn=true;updateBadge("live");renderBgNote(c);bgSyncBtn();return;}}catch(e){}}
    if(state.bgOn){if(st==="live"){updateBadge("live");return;}else{stopBgListen(false);}}// 后台收听中:直播继续则不动,结束则退出后台模式再正常渲染
    var changed=st!==state.lastStatus;state.lastStatus=st;
    updateBadge(st);
    if(st==="live"||st==="paused"||st==="replay"){ // 播放器:优先自建视频播放器(直播流),无流/不支持则回退iframe;不重建正在播放的画面
      var su=(!state.streamFallback&&c.streamUrl&&/^https:\/\//i.test(c.streamUrl)&&lvCanHls())?c.streamUrl:"";
      var want=su?"video":"embed";
      if(state.mode!==want){state.mode=want;if(want==="video")mountVideo(su);else{lvDestroyHls();mountIframe(safeUrl(c.external_url)||c.external_url);}}
      togglePausedBanner(st==="paused");
      return;
    }
    togglePausedBanner(false);lvDestroyHls();
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
      +'<div class="lv-section" id="lv-replays-sec" style="display:none"><div class="lv-rep-head"><div class="lv-rep-ic">🎧</div><div><div class="lv-rep-title">'+esc(T.replays_title)+'</div><div class="lv-rep-desc">'+esc(T.replays_sub)+'</div></div></div><div class="lv-rep-grid" id="lv-replays"></div></div>'
      +'<div class="lv-section"><div class="lv-card"><div class="lv-h3">🛡 '+esc(T.disclaimer_t)+'</div><div class="lv-disc"><ul>'+T.disc.map(function(d){return "<li>"+esc(d)+"</li>";}).join("")+'</ul></div></div>'
      +'<div class="lv-foot"><a class="lv-back" href="/">← '+(ZH?"返回起源首页":"Back to Origin home")+'</a></div></div>'
      +'</div>';
  }
  // ===== 直播互动:公屏聊天(轮询) + 点赞 =====
  function postJSON(path,body,ms){
    var ctl=("AbortController" in window)?new AbortController():null;
    var to=new Promise(function(_,rej){setTimeout(function(){if(ctl)try{ctl.abort();}catch(e){}rej(new Error("t"));},ms||10000);});
    var req=fetch(API+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body||{}),signal:ctl?ctl.signal:undefined}).then(function(r){return r.json();});
    return Promise.race([req,to]);
  }
  function lvToast(m){var w=document.getElementById("live-wrap");if(!w)return;var t=document.getElementById("lv-toast");if(!t){t=document.createElement("div");t.id="lv-toast";t.style.cssText="position:fixed;left:50%;bottom:42px;transform:translateX(-50%);background:rgba(20,14,6,.96);color:#ffd9a0;padding:10px 18px;border-radius:10px;font-size:14px;z-index:99999;border:1px solid #3a2313;transition:opacity .3s;max-width:88vw;text-align:center";w.appendChild(t);}t.textContent=m;t.style.opacity="1";clearTimeout(t._t);t._t=setTimeout(function(){t.style.opacity="0";},2600);}
  function lvFmtN(n){n=n||0;return n>=10000?((n/10000).toFixed(1)+"w"):(n>=1000?((n/1000).toFixed(1)+"k"):String(n));}
  var _chat={lastId:0,nick:""};
  function lvNick(){try{return localStorage.getItem("live_nick")||"";}catch(e){return "";}}
  function lvSetNick(n){_chat.nick=n;try{localStorage.setItem("live_nick",n);}catch(e){}}
  function appendMsgs(msgs){
    var list=document.getElementById("lv-chat-list");if(!list)return;
    var empty=document.getElementById("lv-chat-empty");if(empty&&msgs.length)empty.remove();
    var near=list.scrollHeight-list.scrollTop-list.clientHeight<60;
    msgs.forEach(function(m){if(m.id>_chat.lastId)_chat.lastId=m.id;var d=document.createElement("div");d.className="lv-msg"+(m.nick&&m.nick===_chat.nick?" me":"");d.innerHTML="<b>"+esc(m.nick||"游客")+"</b>"+esc(m.text);list.appendChild(d);});
    while(list.children.length>200)list.removeChild(list.firstChild);
    if(near)list.scrollTop=list.scrollHeight;
  }
  function pollChat(){var list=document.getElementById("lv-chat-list");if(!list)return;fetchJSON(EPchat+(_chat.lastId?("?after="+_chat.lastId):""),8000).then(function(r){if(r&&r.ok&&r.msgs&&r.msgs.length)appendMsgs(r.msgs);}).catch(function(){});}
  function sendChat(){
    var inp=document.getElementById("lv-chat-text");if(!inp)return;var text=inp.value.replace(/\s+/g," ").trim();if(!text)return;
    var btn=document.getElementById("lv-chat-send");if(btn)btn.disabled=true;
    postJSON(EPsend,{text:text,nick:_chat.nick},10000).then(function(r){
      if(btn)btn.disabled=false;
      if(r&&r.ok){inp.value="";if(r.nick){lvSetNick(r.nick);var ni=document.getElementById("lv-chat-nick");if(ni&&!ni.value)ni.value=r.nick;}pollChat();}
      else lvToast((r&&(r.msg||r.error))||"发送失败");
    }).catch(function(){if(btn)btn.disabled=false;lvToast("网络错误，稍后再试");});
  }
  var _like={pending:0,total:0,timer:null};
  function spawnHeart(){var box=document.getElementById("lv-hearts");if(!box)return;var em=["❤️","💛","💚","👍","🎉","🔥"];var h=document.createElement("div");h.className="lv-heart";h.textContent=em[Math.floor(Math.random()*em.length)];h.style.left=(8+Math.random()*76)+"%";h.style.setProperty("--dx",(Math.random()*44-22)+"px");box.appendChild(h);setTimeout(function(){if(h.parentNode)h.parentNode.removeChild(h);},1950);}
  function doLike(){spawnHeart();_like.pending++;if(_like.timer)return;_like.timer=setTimeout(function(){var n=_like.pending;_like.pending=0;_like.timer=null;fetchJSON(EPlike+"?n="+n,8000).then(function(r){if(r&&r.ok&&typeof r.total==="number"){_like.total=r.total;var el=document.getElementById("lv-likeN");if(el)el.textContent=lvFmtN(r.total);}}).catch(function(){});},800);}
  function loadLikes(){fetchJSON(EPlike+"?read=1",8000).then(function(r){if(r&&r.ok&&typeof r.total==="number"){_like.total=r.total;var el=document.getElementById("lv-likeN");if(el)el.textContent=lvFmtN(r.total);}}).catch(function(){});}
  function bindChat(){
    _chat.nick=lvNick();
    var send=document.getElementById("lv-chat-send"),inp=document.getElementById("lv-chat-text"),ni=document.getElementById("lv-chat-nick"),like=document.getElementById("lv-like");
    if(send)send.onclick=sendChat;
    if(inp)inp.addEventListener("keydown",function(e){if(e.key==="Enter")sendChat();});
    if(ni){ni.value=_chat.nick;ni.addEventListener("change",function(){lvSetNick(ni.value.trim().slice(0,20));});}
    if(like)like.onclick=doLike;
    _chat.lastId=0;pollChat();loadLikes();
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
      +'<div class="lv-hearts" id="lv-hearts"></div>'
      +'<div class="lv-stage" id="lv-stage"><div class="lv-overlay"><div class="lv-spin"></div></div></div>'
      +'<div class="lv-ctrls">'
      +'<button class="lv-btn" id="lv-fs">⛶ '+esc(T.btn_fs)+'</button>'
      +'<button class="lv-btn" id="lv-bg">🎧 '+(ZH?"后台收听":"Listen in background")+'</button>'
      +'<button class="lv-btn" id="lv-refresh">↻ '+esc(T.btn_refresh)+'</button>'
      +'<button class="lv-btn" id="lv-like">❤ '+(ZH?"点赞":"Like")+' <b id="lv-likeN">0</b></button>'
      +'</div></div>'
      +'<div class="lv-infocol">'
      +'<div class="lv-card"><span class="lv-badge b-upcoming" id="lv-badge"><span class="lv-dot"></span>—</span>'
      +'<div class="lv-ctitle" style="margin-top:12px">'+esc(c.title)+'</div>'
      +'<div class="lv-meta">'+(c.teacher_name?'<span>'+esc(T.teacher)+'：<b>'+esc(c.teacher_name)+'</b></span>':"")+'<span>'+esc(T.time)+'：<b>'+esc(timeTxt)+'</b></span></div>'
      +srcFootnote(c)+'</div>'
      +'<div class="lv-stats"><div class="lv-stat"><div class="n" id="lv-online">'+state.online+'</div><div class="l">'+esc(T.online)+'</div></div><div class="lv-stat"><div class="n" id="lv-cum">'+state.cum+'</div><div class="l">'+esc(T.cum)+'</div></div></div>'
      +(c.notice?'<div class="lv-card" style="border-color:rgba(214,168,75,.45)"><div class="lv-h3">'+(ZH?"课程公告":"Notice")+'</div><div class="lv-desc">'+esc(c.notice)+'</div></div>':"")
      +(c.description?'<div class="lv-card"><div class="lv-h3">'+esc(T.intro)+'</div><div class="lv-desc">'+esc(c.description)+'</div></div>':"")
      +'<div class="lv-chat"><div class="lv-chat-hd"><span>💬 '+(ZH?"直播互动":"Live Chat")+'</span><input class="lv-nick" id="lv-chat-nick" placeholder="'+(ZH?"昵称":"Name")+'" maxlength="20"></div>'
      +'<div class="lv-chat-list" id="lv-chat-list"><div class="lv-chat-empty" id="lv-chat-empty">'+(ZH?"来发第一条消息吧～":"Say hi in the chat~")+'</div></div>'
      +'<div class="lv-chat-in"><input id="lv-chat-text" maxlength="200" placeholder="'+(ZH?"和大家聊聊…":"Type a message…")+'"><button id="lv-chat-send">'+(ZH?"发送":"Send")+'</button></div></div>'
      +'</div></div>';
    // 控件绑定
    document.getElementById("lv-fs").onclick=toggleFullscreen;
    var bgb=document.getElementById("lv-bg");if(bgb)bgb.onclick=function(){if(state.bgOn)stopBgListen(true);else startBgListen();};
    document.getElementById("lv-refresh").onclick=function(){state.mode=null;state.lastStatus=null;applyStage();};
    state.mode=null;state.lastStatus=null;applyStage();
    bindChat();
  }
  function renderHistory(list){
    var sec=document.getElementById("lv-history-sec"),grid=document.getElementById("lv-history");
    if(!list||!list.length){sec.style.display="none";return;}
    sec.style.display="";
    grid.innerHTML=list.map(function(c){
      var cov=safeCover(c.cover_url);
      var si=statusInfo(c.status),miniBg=c.status==="live"?"background:rgba(255,90,90,.9);color:#fff":(c.status==="ended"?"background:rgba(60,60,60,.85);color:#ccc":"background:rgba(214,168,75,.9);color:#1a1206");
      var when=(c.repeat_rule&&c.repeat_rule!=="none")?repeatText(c):fmtClock(c.start);
      var inner='<div class="cv">'+(cov?'<img src="'+esc(cov)+'" alt="" loading="lazy">':'<div class="ph">🎬</div>')+'<span class="mini" style="'+miniBg+'">'+esc(si[1])+'</span></div>'
        +'<div class="bd"><div class="ht">'+esc(c.title)+'</div>'+(c.teacher_name?'<div style="font-size:12px;color:var(--soft)">'+esc(c.teacher_name)+'</div>':"")+'<div class="hm">'+esc(when)+'</div></div>';
      return '<div class="lv-hc">'+inner+'</div>';
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
      +'<div style="margin-top:14px;font-size:12px;color:var(--muted)"><a href="'+API+EPtoday+'" target="_blank" rel="noopener noreferrer" style="color:var(--soft)">'+(ZH?"自测：点这里，如果也打不开就是网络/拦截挡了数据接口":"Self-check: open this — if it also fails, the data endpoint is blocked")+'</a></div></div>';
    var rb=document.getElementById("lv-retry");
    if(rb)rb.onclick=function(){body.innerHTML='<div class="lv-empty"><div class="lv-spin" style="margin:0 auto 16px"></div>'+esc(T.loading_page)+'</div>';fetchToday().then(function(){beat();});};
  }
  function fetchToday(){
    return fetchJSON(EPtoday,11000).then(function(r){
      if(!r||!r.ok){renderError();return;}
      state.loaded=true;
      if(typeof r.serverTime==="number")state.offset=r.serverTime-Math.floor(Date.now()/1000);
      if(typeof r.online==="number")state.online=r.online;
      if(typeof r.cum==="number")state.cum=r.cum;
      var newCourse=r.course||null;
      // 播放器状态之间(live/paused/replay)互切不整块重建,以免打断正在播放的画面(遵规范十一)
      var playerSet={live:1,paused:1,replay:1},oldC=state.course,os=oldC&&oldC.status,ns=newCourse&&newCourse.status;
      if(oldC&&newCourse&&oldC.id!==newCourse.id){state.streamFallback=false;_streamFails=0;lvDestroyHls();}
      var bothPlayer=oldC&&newCourse&&playerSet[os]&&playerSet[ns]&&oldC.id===newCourse.id&&oldC.embed_mode===newCourse.embed_mode;
      var changed=!oldC||!newCourse||oldC.id!==newCourse.id||oldC.embed_mode!==newCourse.embed_mode||(os!==ns&&!bothPlayer);
      state.course=newCourse;
      if(changed)renderCourse();
      else applyStage();
      var on=document.getElementById("lv-online"),cu=document.getElementById("lv-cum");if(on)on.textContent=state.online;if(cu)cu.textContent=state.cum;
    }).catch(function(){renderError();});
  }
  function fetchHistory(){fetchJSON("/live/list",10000).then(function(r){if(r&&r.ok)renderHistory(r.courses||[]);}).catch(function(){});}
  // ===== 往期回放:自动存档的历史录播,点卡片→本页弹层内嵌播放(不外跳) =====
  function fetchReplays(){
    fetchJSON("/live/replays",10000).then(function(r){
      if(!r||!r.ok)return;renderReplays(r.replays||[]);
    }).catch(function(){});
  }
  function renderReplays(list){
    var sec=document.getElementById("lv-replays-sec"),grid=document.getElementById("lv-replays");
    if(!sec||!grid)return;
    state.replays=list||[];
    if(!list||!list.length){sec.style.display="";grid.innerHTML='<div class="lv-empty" style="grid-column:1/-1;margin:8px auto">'+esc(T.no_replays)+'</div>';return;}
    sec.style.display="";
    grid.innerHTML=list.map(function(c){
      var url=safeUrl(c.play_url);if(!url)return "";
      var kind=(c.kind==="video"||c.kind==="embed")?c.kind:"audio";
      var cov=safeCover(c.cover),when=c.live_time?fmtClock(c.live_time):"",dur=c.duration?fmtDur(c.duration):"";
      var tag=kind==="audio"?(ZH?"🎧 音频":"🎧 Audio"):(kind==="video"?(ZH?"▶ 视频":"▶ Video"):(ZH?"直播回放":"Replay"));
      var tkt=esc(c.ticket_id||""),plays=Number(c.plays)||0;
      var label=when||(c.title||T.replays_title);// 标题位改成 日期+时间(取消觉醒14:30那种场次名)
      return '<div class="lv-rep-item" data-url="'+esc(url)+'" data-title="'+esc(label)+'" data-kind="'+esc(kind)+'" data-cover="'+esc(cov)+'" data-ticket="'+tkt+'" tabindex="0" role="button" aria-label="'+esc(T.watch_replay+" "+label)+'">'
        +'<div class="lv-rep-play">'+(cov?'<img src="'+esc(cov)+'" alt="">':"")+'<span>▶</span></div>'
        +'<div class="lv-rep-body"><div class="lv-rep-h">'+esc(label)+'</div>'
        +'<div class="lv-rep-m"><span class="lv-rep-tag">'+esc(tag)+'</span>'
        +(dur?'<span>⏱ '+(ZH?"时长 ":"")+esc(dur)+'</span>':"")
        +'<span class="lv-rep-plays" data-t="'+tkt+'">▶ '+plays+(ZH?" 次":"")+'</span>'
        +'</div></div>'
        +'<button type="button" class="lv-rep-share" data-t="'+tkt+'" aria-label="'+(ZH?"转发":"share")+'" title="'+(ZH?"转发到微信":"Share")+'">↗</button>'
        +'</div>';
    }).join("");
    var cards=grid.querySelectorAll(".lv-rep-item");
    for(var i=0;i<cards.length;i++){(function(el){
      var go=function(){var k=el.getAttribute("data-kind"),u=el.getAttribute("data-url"),ti=el.getAttribute("data-title"),cv=el.getAttribute("data-cover"),tkt=el.getAttribute("data-ticket");
        if(k==="video"||k==="embed"){openReplay(u,ti,k,cv);return;}
        // 播放量+1(后台同IP同曲30min去重),更新显示
        if(tkt){fetchJSON("/live/replays/play?ticket="+encodeURIComponent(tkt),8000).then(function(r){if(r&&r.ok&&typeof r.plays==="number"){var pe=el.querySelector(".lv-rep-plays");if(pe)pe.textContent="▶ "+r.plays+(ZH?" 次":"");}}).catch(function(){});}
        // 音频:交给全站持久播放器(跨页面不停),点一下直接播
        if(window.OriginPlayer){
          var au=(state.replays||[]).filter(function(c){return (c.kind||"audio")==="audio"&&c.play_url;}).map(function(c){return {url:c.play_url,title:c.title,cover:c.cover};});
          var ci=0;for(var q=0;q<au.length;q++){if(safeUrl(au[q].url)===safeUrl(u)){ci=q;break;}}
          window.OriginPlayer.playList(au,ci);
        } else { playAudio(safeUrl(u),ti,cv,true); }
      };
      el.addEventListener("click",go);
      el.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();go();}});
      var sb=el.querySelector(".lv-rep-share");
      if(sb)sb.addEventListener("click",function(e){e.stopPropagation();shareReplay(el.getAttribute("data-ticket"),el.getAttribute("data-title"));});
    })(cards[i]);}
  }
  function shareReplay(tkt,label){
    if(!tkt)return;
    var fileUrl=API+"/live/replays/file?r="+encodeURIComponent(tkt);
    var fname=(ZH?"起源回放_":"origin_")+String(label||tkt).replace(/[^\w一-鿿\-]/g,"_").slice(0,40)+".mp3";
    lvToast(ZH?"正在准备音频…":"Preparing audio…");
    fetch(fileUrl).then(function(r){if(!r.ok)throw 0;return r.blob();}).then(function(blob){
      var file=null;try{file=new File([blob],fname,{type:"audio/mpeg"});}catch(e){}
      if(file&&navigator.canShare&&navigator.canShare({files:[file]})&&navigator.share){
        navigator.share({files:[file],title:ZH?"起源课程回放":"Origin replay",text:(ZH?"🎧 起源线上课堂回放":"Origin class replay")}).catch(function(){});
      }else{
        var a=document.createElement("a"),ou=URL.createObjectURL(blob);a.href=ou;a.download=fname;document.body.appendChild(a);a.click();
        setTimeout(function(){a.remove();URL.revokeObjectURL(ou);},1500);
        lvToast(ZH?"已下载音频，在微信里发送这个文件给好友即可":"Audio downloaded — send this file in WeChat");
      }
    }).catch(function(){lvToast(ZH?"获取音频失败，请重试":"Failed, try again");});
  }
  function ensureReplayModal(){
    var m=document.getElementById("lv-replay-modal");if(m)return m;
    var wrap=document.getElementById("live-wrap");if(!wrap)return null;
    m=document.createElement("div");m.id="lv-replay-modal";m.className="lv-modal";
    m.innerHTML='<div class="lv-modal-box"><div class="lv-modal-hd"><span class="t" id="lv-modal-title"></span><button class="x" id="lv-modal-close" aria-label="close">✕</button></div><div class="lv-modal-stage" id="lv-modal-stage"></div></div>';
    wrap.appendChild(m);
    m.addEventListener("click",function(e){if(e.target===m)closeReplay();});
    document.getElementById("lv-modal-close").onclick=closeReplay;
    return m;
  }
  function apFmt(s){s=Math.max(0,Math.floor(s||0));var m=Math.floor(s/60),ss=s%60;return m+":"+(ss<10?"0":"")+ss;}
  // 常驻音频:关掉大播放器/站内翻页/切到微信 都不停;悬浮小条继续控制
  function ensurePA(){
    if(state.pa)return state.pa;
    var a=document.createElement("audio");a.id="lv-persist-audio";a.preload="metadata";
    a.setAttribute("playsinline","");a.setAttribute("webkit-playsinline","");
    document.body.appendChild(a);state.pa=a;
    a.addEventListener("play",pSync);a.addEventListener("pause",pSync);
    a.addEventListener("timeupdate",pSync);a.addEventListener("loadedmetadata",pSync);
    a.addEventListener("ended",function(){pSync();if(replayList().length>1)playNext();});
    return a;
  }
  function replayList(){return (state.replays||[]).filter(function(c){return c.play_url&&((c.kind||"audio")==="audio");});}
  function curIndex(){var l=replayList();if(!state.pmeta)return -1;for(var i=0;i<l.length;i++){if(safeUrl(l[i].play_url)===state.pmeta.url)return i;}return -1;}
  function gotoDelta(d){var l=replayList();if(!l.length)return;var i=curIndex();i=(i<0)?0:((i+d+l.length)%l.length);var c=l[i],url=safeUrl(c.play_url);if(!url)return;
    playAudio(url,c.title,c.cover,true);}
  function playNext(){gotoDelta(1);}
  function playPrev(){gotoDelta(-1);}
  function setMedia(meta){
    try{if(!("mediaSession" in navigator))return;var art=[];if(meta.cover)art.push({src:meta.cover,sizes:"512x512",type:"image/jpeg"});
      navigator.mediaSession.metadata=new MediaMetadata({title:meta.title||T.replays_title,artist:ZH?"起源线上课堂":"Origin Live",album:"Origin",artwork:art});
      navigator.mediaSession.setActionHandler("play",function(){var p=state.pa&&state.pa.play();if(p&&p.catch)p.catch(function(){});});
      navigator.mediaSession.setActionHandler("pause",function(){if(state.pa)state.pa.pause();});
      navigator.mediaSession.setActionHandler("seekbackward",function(){if(state.pa)state.pa.currentTime=Math.max(0,state.pa.currentTime-15);});
      navigator.mediaSession.setActionHandler("seekforward",function(){if(state.pa)state.pa.currentTime=Math.min(state.pa.duration||1e9,state.pa.currentTime+15);});
      try{navigator.mediaSession.setActionHandler("nexttrack",replayList().length>1?function(){playNext();}:null);}catch(e){}
      try{navigator.mediaSession.setActionHandler("previoustrack",replayList().length>1?function(){playPrev();}:null);}catch(e){}
    }catch(e){}
  }
  function pSync(){
    var a=state.pa;if(!a)return;var d=a.duration||0,p=d?(a.currentTime/d*100):0,icon=a.paused?"▶":"⏸";
    var fill=document.getElementById("lv-ap-fill"),knob=document.getElementById("lv-ap-knob"),cur=document.getElementById("lv-ap-cur"),dur=document.getElementById("lv-ap-dur"),tog=document.getElementById("lv-ap-toggle");
    if(fill){fill.style.width=p+"%";if(knob)knob.style.left=p+"%";if(cur)cur.textContent=apFmt(a.currentTime);if(dur&&d)dur.textContent=apFmt(d);if(tog)tog.textContent=icon;}
    var mf=document.getElementById("lv-mini-fill"),mt=document.getElementById("lv-mini-toggle");
    if(mf)mf.style.width=p+"%";if(mt)mt.textContent=icon;
    try{if("mediaSession" in navigator)navigator.mediaSession.playbackState=a.paused?"paused":"playing";}catch(e){}
  }
  function playAudio(url,title,cover,restart){
    var a=ensurePA();cover=safeCover(cover);state.pmeta={url:url,title:title||T.replays_title,cover:cover};
    if(state.paurl!==url){state.paurl=url;a.src=url;a.currentTime=0;var p=a.play();if(p&&p.catch)p.catch(function(){});}
    else if(restart&&a.paused){var p2=a.play();if(p2&&p2.catch)p2.catch(function(){});}
    setMedia(state.pmeta);showMini();pSync();
    var modal=document.getElementById("lv-replay-modal");// 大播放器若开着,同步换成当前曲
    if(modal&&modal.classList.contains("on")){var t=document.getElementById("lv-modal-title");if(t)t.textContent=state.pmeta.title;renderBigAudio(state.pmeta.title,cover);}
  }
  function renderBigAudio(title,cover){
    var stage=document.getElementById("lv-modal-stage");if(!stage)return;
    stage.innerHTML='<div class="lv-ap">'
      +'<div class="lv-ap-art">'+(cover?'<img src="'+esc(cover)+'" alt="">':'<span>🎧</span>')+'</div>'
      +'<div class="lv-ap-title">'+esc(title||T.replays_title)+'</div>'
      +'<div class="lv-ap-transport"><button type="button" class="lv-ap-nav" id="lv-ap-prev" aria-label="'+(ZH?"上一曲":"prev")+'">⏮</button>'
      +'<button type="button" class="lv-ap-btn" id="lv-ap-toggle" aria-label="play/pause">▶</button>'
      +'<button type="button" class="lv-ap-nav" id="lv-ap-next" aria-label="'+(ZH?"下一曲":"next")+'">⏭</button></div>'
      +'<div class="lv-ap-ctrls"><span class="lv-ap-time" id="lv-ap-cur">0:00</span>'
      +'<div class="lv-ap-bar" id="lv-ap-bar"><div class="lv-ap-fill" id="lv-ap-fill"></div><div class="lv-ap-knob" id="lv-ap-knob"></div></div>'
      +'<span class="lv-ap-time" id="lv-ap-dur">0:00</span>'
      +'<button type="button" class="lv-ap-rate" id="lv-ap-rate" aria-label="'+(ZH?"倍速":"speed")+'">'+((state.pa&&state.pa.playbackRate)||1)+'x</button></div></div>';
    var a=state.pa,bar=document.getElementById("lv-ap-bar"),tog=document.getElementById("lv-ap-toggle"),rate=document.getElementById("lv-ap-rate");
    var pv=document.getElementById("lv-ap-prev"),nx=document.getElementById("lv-ap-next");
    if(pv)pv.onclick=playPrev;if(nx)nx.onclick=playNext;
    if(replayList().length<2){if(pv)pv.style.display="none";if(nx)nx.style.display="none";}
    if(tog)tog.onclick=function(){if(a.paused){var p=a.play();if(p&&p.catch)p.catch(function(){});}else a.pause();};
    function seek(e){var r=bar.getBoundingClientRect(),cx=(e.touches&&e.touches[0]?e.touches[0].clientX:e.clientX),x=(cx-r.left)/r.width;x=Math.min(1,Math.max(0,x));if(isFinite(a.duration))a.currentTime=x*a.duration;}
    if(bar){bar.addEventListener("click",seek);bar.addEventListener("mousedown",function(e){state._drag=1;seek(e);});bar.addEventListener("touchstart",function(e){seek(e);},{passive:true});bar.addEventListener("touchmove",function(e){seek(e);},{passive:true});
      if(!renderBigAudio._g){renderBigAudio._g=1;document.addEventListener("mousemove",function(e){if(state._drag){var b=document.getElementById("lv-ap-bar");if(b){var r=b.getBoundingClientRect(),x=(e.clientX-r.left)/r.width;x=Math.min(1,Math.max(0,x));if(isFinite(state.pa.duration))state.pa.currentTime=x*state.pa.duration;}}});document.addEventListener("mouseup",function(){state._drag=0;});}}
    var rates=[1,1.25,1.5,2,0.75];
    if(rate)rate.onclick=function(){var cr=state.pa.playbackRate||1,i=rates.indexOf(cr);i=(i+1)%rates.length;state.pa.playbackRate=rates[i];rate.textContent=rates[i]+"x";};
    pSync();
  }
  function openReplay(url,title,kind,cover){
    url=safeUrl(url);if(!url)return;kind=(kind==="video"||kind==="embed")?kind:"audio";
    var m=ensureReplayModal();if(!m)return;
    var t=document.getElementById("lv-modal-title");if(t)t.textContent=title||T.replays_title;
    var stage=document.getElementById("lv-modal-stage");
    if(kind==="audio"){
      playAudio(url,title,cover,true);
      renderBigAudio(title,safeCover(cover));
    } else if(kind==="video"){
      stage.innerHTML='<video class="lv-video-el" controls autoplay playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;background:#000;object-fit:contain" src="'+esc(url)+'"></video>';
      var v=stage.querySelector("video");if(v){var pv=v.play&&v.play();if(pv&&pv.catch)pv.catch(function(){});}
    } else {
      stage.innerHTML='<div class="lv-overlay"><div class="lv-spin"></div></div>';
      var f=document.createElement("iframe");
      f.src=url;f.title=title||T.replays_title;
      f.setAttribute("allow","autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write");
      f.setAttribute("allowfullscreen","true");f.allowFullscreen=true;f.setAttribute("webkitallowfullscreen","true");f.setAttribute("mozallowfullscreen","true");
      f.setAttribute("referrerpolicy","strict-origin-when-cross-origin");
      f.setAttribute("sandbox","allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-orientation-lock allow-modals");
      f.onload=function(){var ov=stage.querySelector(".lv-overlay");if(ov)ov.remove();};
      stage.appendChild(f);
    }
    m.classList.add("on");
  }
  function renderMini(){
    var mini=document.getElementById("lv-mini");if(mini)return mini;
    var wrap=document.getElementById("live-wrap");if(!wrap)return null;
    mini=document.createElement("div");mini.id="lv-mini";mini.className="lv-mini";
    mini.innerHTML='<div class="lv-mini-art" id="lv-mini-art"></div>'
      +'<div class="lv-mini-info" id="lv-mini-open"><div class="lv-mini-t" id="lv-mini-t"></div><div class="lv-mini-p"><div class="lv-mini-fill" id="lv-mini-fill"></div></div></div>'
      +'<button type="button" class="lv-mini-btn" id="lv-mini-toggle" aria-label="play/pause">⏸</button>'
      +'<button type="button" class="lv-mini-next" id="lv-mini-next" aria-label="'+(ZH?"下一曲":"next")+'">⏭</button>'
      +'<button type="button" class="lv-mini-x" id="lv-mini-x" aria-label="close">✕</button>';
    wrap.appendChild(mini);
    document.getElementById("lv-mini-toggle").onclick=function(){var a=state.pa;if(!a)return;if(a.paused){var p=a.play();if(p&&p.catch)p.catch(function(){});}else a.pause();};
    document.getElementById("lv-mini-next").onclick=playNext;
    document.getElementById("lv-mini-x").onclick=stopReplay;
    document.getElementById("lv-mini-open").onclick=function(){if(state.pmeta)openReplay(state.pmeta.url,state.pmeta.title,"audio",state.pmeta.cover);};
    return mini;
  }
  function showMini(){
    var mini=renderMini();if(!mini||!state.pmeta)return;
    var art=document.getElementById("lv-mini-art"),tt=document.getElementById("lv-mini-t");
    if(art)art.innerHTML=state.pmeta.cover?'<img src="'+esc(state.pmeta.cover)+'" alt="">':'🎧';
    if(tt)tt.textContent=state.pmeta.title||T.replays_title;
    var mn=document.getElementById("lv-mini-next");if(mn)mn.style.display=replayList().length<2?"none":"";
    mini.classList.add("on");pSync();
  }
  function hideMini(){var mini=document.getElementById("lv-mini");if(mini)mini.classList.remove("on");}
  function stopReplay(){if(state.pa){try{state.pa.pause();}catch(e){}state.pa.removeAttribute("src");try{state.pa.load();}catch(e){}}state.paurl=null;state.pmeta=null;hideMini();}
  function closeReplay(){
    var m=document.getElementById("lv-replay-modal");if(!m)return;
    var stage=document.getElementById("lv-modal-stage"),wasAudio=stage&&stage.querySelector(".lv-ap");
    if(stage&&!wasAudio)stage.innerHTML="";// 视频/iframe:关闭即停;音频:保留常驻不停
    if(stage&&wasAudio)stage.innerHTML="";// 清大播放器DOM(音频靠常驻audio继续放)
    m.classList.remove("on");
    if(state.pmeta)showMini();// 音频还在→显示悬浮小条继续听
  }
  // ===== 直播后台收听:切成纯音频(hls attach 到 audio),可切微信继续放+锁屏控制 =====
  function bgSyncBtn(){var b=document.getElementById("lv-bg");if(b)b.innerHTML=state.bgOn?("🎬 "+(ZH?"切回视频":"Back to video")):("🎧 "+(ZH?"后台收听":"Listen in background"));var pp=document.getElementById("lv-bg-toggle");if(pp&&state.laudio)pp.textContent=state.laudio.paused?"▶":"⏸";}
  function setLiveMedia(c){try{if(!("mediaSession" in navigator))return;var art=[],cov=safeCover(c.cover_url);if(cov)art.push({src:cov,sizes:"512x512",type:"image/jpeg"});navigator.mediaSession.metadata=new MediaMetadata({title:c.title||(ZH?"起源直播":"Origin Live"),artist:ZH?"起源线上直播":"Origin Live",artwork:art});navigator.mediaSession.setActionHandler("play",function(){state.laudio&&state.laudio.play();});navigator.mediaSession.setActionHandler("pause",function(){state.laudio&&state.laudio.pause();});navigator.mediaSession.playbackState="playing";}catch(e){}}
  function renderBgPanel(c){
    var stage=document.getElementById("lv-stage");if(!stage)return;var cov=safeCover(c.cover_url);
    stage.innerHTML='<div class="lv-ap" style="background:radial-gradient(620px 340px at 50% 22%,rgba(255,90,90,.16),transparent),#0b0906">'
      +'<div class="lv-ap-art">'+(cov?'<img src="'+esc(cov)+'" alt="">':'<span>🎧</span>')+'</div>'
      +'<div class="lv-ap-title">'+esc(c.title||(ZH?"起源直播":"Origin Live"))+'</div>'
      +'<div style="font-size:13px;color:var(--soft);text-align:center;max-width:92%;line-height:1.6">'+(ZH?"🔴 正在后台收听直播 —— 可以切到微信回消息，声音继续播放；手机锁屏也能控制":"🔴 Listening to the live audio — switch to WeChat freely, audio keeps playing")+'</div>'
      +'<div class="lv-ap-transport"><button type="button" class="lv-ap-btn" id="lv-bg-toggle" aria-label="play/pause">⏸</button>'
      +'<button type="button" class="lv-btn" id="lv-bg-back" style="padding:11px 16px">🎬 '+(ZH?"切回视频":"Back to video")+'</button></div></div>';
    var tg=document.getElementById("lv-bg-toggle");if(tg)tg.onclick=function(){var a=state.laudio;if(!a)return;if(a.paused){var p=a.play();if(p&&p.catch)p.catch(function(){});}else a.pause();};
    var bk=document.getElementById("lv-bg-back");if(bk)bk.onclick=function(){stopBgListen(true);};
  }
  function lvBgError(){fetchJSON(EPstream,10000).then(function(r){if(r&&r.ok&&r.live&&r.streamUrl){if(state.course)state.course.streamUrl=r.streamUrl;if(state.bgOn)startBgListen();}else stopBgListen(true);}).catch(function(){if(state.bgOn)stopBgListen(true);});}
  function liveClosed(){state.bgOn=false;state.mode=null;state.lastStatus=null;bgSyncBtn();setTimeout(function(){if(state.course)applyStage();},0);}
  function startBgListen(){
    var c=state.course;if(!c||c.status!=="live"){lvToast(ZH?"直播进行中才能后台收听":"Only available during live");return;}
    if(!(window.OriginPlayer&&window.OriginPlayer.startLive)){lvToast(ZH?"播放器未就绪，请刷新":"Player not ready");return;}
    lvDestroyHls();state.iframeOn=false;if(state.failTimer){clearTimeout(state.failTimer);state.failTimer=null;}
    state.bgOn=true;state.mode="bg";
    // 交给全站播放器接管直播音频(自己取流+断流重连+跨页面续播),不停在本页
    window.OriginPlayer.startLive({title:c.title||(ZH?"起源直播":"Origin Live"),cover:safeCover(c.cover_url),onClose:liveClosed});
    renderBgNote(c);bgSyncBtn();
  }
  function renderBgNote(c){
    var stage=document.getElementById("lv-stage");if(!stage)return;var cov=safeCover(c.cover_url);
    stage.innerHTML='<div class="lv-ap" style="background:radial-gradient(620px 340px at 50% 22%,rgba(255,90,90,.16),transparent),#0b0906">'
      +'<div class="lv-ap-art">'+(cov?'<img src="'+esc(cov)+'" alt="">':'<span>🎧</span>')+'</div>'
      +'<div class="lv-ap-title">'+esc(c.title||(ZH?"起源直播":"Origin Live"))+'</div>'
      +'<div style="font-size:13px;color:var(--soft);text-align:center;max-width:92%;line-height:1.6">'+(ZH?"🔴 后台收听中 —— 用屏幕底部的悬浮条控制，可切到微信继续听；点下面切回视频":"🔴 Listening in background — use the floating bar at the bottom")+'</div>'
      +'<button type="button" class="lv-btn" id="lv-bg-back" style="padding:11px 18px">🎬 '+(ZH?"切回视频":"Back to video")+'</button></div>';
    var bk=document.getElementById("lv-bg-back");if(bk)bk.onclick=function(){stopBgListen(true);};
  }
  function stopBgListen(back){
    // 交给播放器停止(→endLive→liveClosed 会重置状态并切回视频)
    if(window.OriginPlayer&&window.OriginPlayer.stopLive){window.OriginPlayer.stopLive();}
    else{state.bgOn=false;state.mode=null;state.lastStatus=null;bgSyncBtn();if(back!==false)applyStage();}
  }
  function beat(){fetchJSON(EPbeat+"?v="+encodeURIComponent(vid()),8000).then(function(r){if(r&&r.ok){if(typeof r.online==="number")state.online=r.online;if(typeof r.cum==="number")state.cum=r.cum;var on=document.getElementById("lv-online"),cu=document.getElementById("lv-cum");if(on)on.textContent=state.online;if(cu)cu.textContent=state.cum;}}).catch(function(){});}

  function boot(){
    var s=document.createElement("style");s.textContent=css;document.head.appendChild(s);
    renderShell();
    fetchToday().then(function(){beat();});
    // 往期回放:仅主直播页(/live)显示,木火夜聊(/live-cloud,自定义LV_EP)不显示;开屏拉一次+每5分钟刷新
    if(EPtoday==="/live/today"){fetchReplays();setInterval(function(){if(!document.hidden)fetchReplays();},300000);}
    document.addEventListener("keydown",function(e){if(e.key==="Escape")closeReplay();});
    function onFsChange(){syncFsButtons();cropIframe();}
    document.addEventListener("fullscreenchange",onFsChange);
    document.addEventListener("webkitfullscreenchange",onFsChange);
    window.addEventListener("resize",function(){cropIframe();});
    window.addEventListener("orientationchange",function(){setTimeout(cropIframe,300);});
    state.tick=setInterval(tickCountdown,1000);
    setInterval(function(){if(!document.hidden)fetchToday();},30000);   // 可见时每30秒同步(遵规范八:后台标签页降频)
    setInterval(function(){if(!document.hidden)pollChat();},5000);      // 公屏聊天轮询
    setInterval(beat,45000);         // 观看心跳
    // 标签页重新激活时立即刷新一次
    document.addEventListener("visibilitychange",function(){if(!document.hidden){fetchToday();beat();}});
    // 语言切换 → 重载(与 dashboard 一致)
    try{var l=document.documentElement.lang;new MutationObserver(function(){if(document.documentElement.lang!==l)location.reload();}).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});}catch(e){}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();
