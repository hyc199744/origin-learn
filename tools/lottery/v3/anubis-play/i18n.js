/* ANUBIS PLAY 金花牌局 — 中英双语(i18n)
   方案:不改游戏逻辑。MutationObserver 监听 DOM 文本变化,英文模式下把中文短语按"长优先"替换成英文。
   语言:默认跟浏览器(非中文=英文),右上角按钮切换并刷新,存 localStorage ap_lang。
   覆盖:静态HTML + 所有动态渲染/提示/弹窗;数字/地址/币名(LGNS/DAI)原样保留。 */
(function(){
  'use strict';
  // [中文, English] —— 运行时按中文长度降序排序,长短语先替换,避免"看牌/已看牌"这类子串误伤
  var MAP = [
    // 长句 / 整段
    ["横过手机，或点右侧按钮一键横屏","Rotate your phone, or tap the button for landscape"],
    ["真人对战，押真 LGNS / DAI，链上公平结算。","Live PvP · real LGNS / DAI · provably fair on-chain."],
    ["真人链上牌局，押真 LGNS / DAI，公平可证明","Live on-chain card games · real LGNS / DAI · provably fair"],
    ["比牌支付你当前跟注额（看牌为 2 倍）。输的一方出局；牌力相同则发起方出局。","A showdown costs your current call (×2 if you looked). The loser is out; on a tie the challenger loses."],
    ["选择你的底注，开始一场金花对决。","Pick your ante and start a Golden Flower duel."],
    ["每位玩家 3 张牌，可暗牌或看牌后行动。牌型从大到小：","Each player gets 3 cards; act blind or after looking. Hands, high to low:"],
    ["各交一份底注入座。暗牌按当前本注跟注，看牌后按 2 倍跟注。","Each posts one ante to sit. Blind players call the current bet; after looking you call double."],
    ["加注把本注往上提一档；按钮显示本次实际支付。","Raising bumps the bet up a step; the button shows what you actually pay."],
    ["轮到你可比牌：挑一个对手单挑，输的出局；牌力相同发起方出局。","On your turn you can show down: pick one opponent; the loser is out, ties go against the challenger."],
    ["打到只剩 1 人或摊牌结算，赢家拿底池（扣 3% 手续费）。一局结束自动开下一局。","Play until one remains or showdown; the winner takes the pot (minus 3% fee). The next hand starts automatically."],
    ["A23 为最小顺子；花色不分大小。","A-2-3 is the lowest straight; suits have no rank."],
    ["选好即自动上传保存","Saved automatically once chosen"],
    ["点某一行展开看你的三张牌。记录存本浏览器本地，换设备或清缓存会清空；权威结果以链上为准。","Tap a row to see your three cards. Records are stored locally in this browser and clear on another device or cache wipe; the chain is authoritative."],
    ["记录存本浏览器本地，换设备或清缓存会清空；权威结果以链上为准。","Records live in this browser and clear on another device or cache wipe; the chain is authoritative."],
    ["暂无牌桌，点「创建我的牌桌」开一桌，或等别人开。","No tables yet — tap “Create my table” to open one, or wait for others."],
    ["暂无同档位牌桌。点上面「创建我的牌桌」开一桌，或等别人开。","No tables at this stake. Tap “Create my table” above, or wait for others."],
    ["本局结束后点「继续下一局」即可加入","Tap “Next hand” after this one ends to join"],
    ["连接 Anubis 链钱包后即可开桌、入座、押真","Connect an Anubis-chain wallet to open tables, sit in and stake real"],
    ["用别的钱包扫这个码（或复制地址），把 LGNS / DAI 转进来充值。地址在 Anubis 链两种币通用。","Scan this code (or copy the address) from another wallet and send LGNS / DAI to top up. The address works for both on Anubis."],
    ["请在本局倒计时内到账，超时会自动弃牌","Funds must arrive before the hand timer ends, or you auto-fold"],
    ["本月还可改","You can still change it"],
    ["次（每月最多 3 次），昵称会显示给同桌玩家。","more time(s) this month (max 3). Your nickname shows to tablemates."],
    ["私密牌桌不显示在大厅，只有拿到房号的人才能进。开桌后把房号发给朋友即可。","Private tables are hidden from the lobby; only players with the room number can join. Share it after opening."],
    ["开桌后各玩家先交一份底注入座，凑够 2 人自动发牌。押真","After opening, each player posts an ante to sit; with 2 players cards deal automatically. Real"],
    ["牌序由合约种子 + 区块哈希决定，后端按权威结果发牌，每局种子上链公开可事后核验。押真","Card order is set by a contract seed + block hash; the server deals the authoritative result and each seed is published on-chain to verify. Real"],
    ["，理性参与。",". Play responsibly."],
    ["请启用 JavaScript，以体验牌桌和横屏交互。","Please enable JavaScript to use the table and landscape features."],
    ["付不起跟注——可「全下比牌」押上剩余跟对手比，谁大谁赢；或弃牌","Can't call — tap “All-in showdown” to push your rest and compare, high hand wins; or fold"],
    ["扫码充值到账后继续，或弃牌","top up by scanning the code then continue, or fold"],
    ["正在连接并回到对局 #","Reconnecting and returning to hand #"],
    ["你还没入座牌桌，去大厅选一桌","You're not seated — pick a table in the lobby"],
    ["那局已结束，去大厅开新的一桌吧","That hand has ended — open a new table in the lobby"],
    ["你还有一局对局进行中","You have a hand in progress"],
    ["点此回到牌桌继续（别超时被判弃）","tap to return to the table (don't time out and fold)"],
    ["未连接对战服务，稍候重试","Not connected to the game service — try again shortly"],
    ["未连接对战服务，请稍候重试","Not connected to the game service — please retry shortly"],
    ["⚠ 上传超时，请检查网络后重试","⚠ Upload timed out — check your network and retry"],
    ["图片读取失败，换一张试试","Couldn't read the image — try another"],
    ["处理图片出错，换一张试试","Image processing failed — try another"],
    ["图片太大，请换一张更简单的图","Image too large — pick a simpler one"],
    ["本月改名次数已用完","No nickname changes left this month"],
    ["本月改名次数已用完(每月最多3次)","No nickname changes left this month (max 3)"],
    ["请在 OKX / MetaMask 钱包内置浏览器打开","Open in the OKX / MetaMask in-wallet browser"],
    ["请在 OKX / MetaMask 内置浏览器打开","Open in the OKX / MetaMask in-wallet browser"],
    // 导航 / 大厅
    ["← 返回游戏平台","← Game platform"],
    ["返回游戏平台","Game platform"],
    ["游戏平台","Game platform"],
    ["金花牌局","Golden Flower"],
    ["游戏大厅","Lobby"],
    ["我的战绩","My record"],
    ["我的牌桌","My table"],
    ["对局记录","History"],
    ["我的牌局记录","My game history"],
    ["我的余额","My balance"],
    ["发现牌桌","Find a table"],
    ["创建我的牌桌","Create my table"],
    ["创建你的牌桌","Create your table"],
    ["创建并进入牌桌","Create & enter"],
    ["创建牌桌","Create table"],
    ["加入房间","Join room"],
    ["加入牌桌","Join table"],
    ["本桌已满","Table full"],
    ["等待加入","Waiting"],
    ["已满","Full"],
    ["有空位","Open seat"],
    ["等待入座","Waiting for players"],
    ["人气推荐","Popular"],
    ["快速开桌","Quick table"],
    ["自己创建房间","Create your own room"],
    ["玩法指南","How to play"],
    ["玩法规则","Rules"],
    ["游戏规则","Rules"],
    ["从入门到高手","From beginner to pro"],
    ["好牌局，等你入座。","A good table awaits you."],
    ["选择币种池","Choose token pool"],
    ["底注筛选","Filter by ante"],
    ["选择底注","Choose ante"],
    ["牌桌人数","Table size"],
    ["牌桌类型","Table type"],
    ["牌桌布局","Table layout"],
    ["大厅可见","Visible in lobby"],
    ["仅凭房号进","Join by room number"],
    ["俱乐部","Club"],
    ["金花","Golden Flower"],
    ["一桌好牌","A fine table"],
    ["一场较量.","a real contest."],
    // 牌桌 / 行动
    ["本 局 底 池","P O T"],
    ["当前单注","Current bet"],
    ["本局底池","Pot"],
    ["已投入","Staked"],
    ["我的筹码","My chips"],
    ["等待开局","Waiting to start"],
    ["到大厅开桌或加入牌桌","Open or join a table in the lobby"],
    ["轮到你行动","Your turn"],
    ["其他玩家行动中","Other player acting"],
    ["比牌裁决中","Resolving showdown"],
    ["马上出结果","Result incoming"],
    ["本局已结算","Hand settled"],
    ["本局结束","Hand over"],
    ["继续下一局","Next hand"],
    ["处理中…","Processing…"],
    ["筹码不足","Not enough chips"],
    ["已弃牌","Folded"],
    ["等待本局结束","Waiting for the hand to end"],
    ["观战中","Spectating"],
    ["入座中…","Sitting in…"],
    ["未看牌","Not looked"],
    ["已看牌","Looked"],
    ["暗牌中","Still blind"],
    ["暗牌跟注","Call (blind)"],
    ["明牌跟注","Call (looked)"],
    ["暗牌","Blind"],
    ["明牌","Looked"],
    ["全下比牌","All-in showdown"],
    ["选择比牌对手","Choose an opponent"],
    ["比牌结果","Showdown result"],
    ["你赢了！对手出局","You win! Opponent is out"],
    ["你输了，本局出局","You lose — out this hand"],
    ["弃牌","Fold"],
    ["看牌","Look"],
    ["加注","Raise"],
    ["比牌","Show"],
    ["跟注","Call"],
    ["准备中…","Getting ready…"],
    ["准备","Ready"],
    ["退出","Leave"],
    ["刷新余额","Refresh balance"],
    ["刷新","Refresh"],
    ["先弃牌","Fold now"],
    ["复制地址","Copy address"],
    ["知道了","Got it"],
    ["收款码","Receive QR"],
    ["人桌","-player table"],
    ["已入座","seated"],
    ["人/局","players/hand"],
    // 弹窗 / 钱包 / 账户
    ["余额不足 · 扫码充值","Not enough — scan to top up"],
    ["余额不足","Not enough balance"],
    ["本局需","This hand needs"],
    ["你当前余额","your balance"],
    ["不够。","isn't enough."],
    ["用别的钱包","From another wallet"],
    ["转进来","send it in"],
    ["到账后自动可继续出牌","once it arrives you can keep playing"],
    ["连接钱包","Connect wallet"],
    ["钱包地址","Wallet address"],
    ["钱包","Wallet"],
    ["我的","Me"],
    ["游戏昵称（最多 3 个字）","Nickname (max 3 chars)"],
    ["未设置昵称","No nickname set"],
    ["保存","Save"],
    ["声音设置","Sound"],
    ["背景音乐","Music"],
    ["游戏音效","Sound FX"],
    ["公开","Public"],
    ["私密","Private"],
    ["三张牌，一场对决。","Three cards, one duel."],
    ["牌型 · 从大到小","Hand · high to low"],
    ["示例","Example"],
    ["豹子","Trips"],
    ["同花顺","Straight flush"],
    ["同花","Flush"],
    ["顺子","Straight"],
    ["对子","Pair"],
    ["单张","High card"],
    ["散牌","High card"],
    ["对局次数","Hands played"],
    ["局号","Hand"],
    ["牌型","Hand"],
    ["输赢","Result"],
    ["底池","Pot"],
    ["我的牌","My cards"],
    ["无对手牌面记录","No opponent cards recorded"],
    ["暂无记录，玩一局就有了。","No records yet — play a hand."],
    ["未亮牌","Not shown"],
    ["时间","Time"],
    ["底注","Ante"],
    ["关闭弹窗","Close"],
    ["关闭横屏提示","Dismiss"],
    ["一键横屏","Go landscape"],
    ["选择","Choose"],
    // 提示 toast / 动态
    ["开桌成功！房号 #","Table created! Room #"],
    ["私密牌桌已开！房号 #","Private table open! Room #"],
    ["大厅看不到这桌，把房号发给朋友，他输房号才能进；你点「准备」交底注开始","This table is hidden; share the room number so a friend can enter it; tap “Ready” to post your ante and start"],
    ["把这个号发给朋友，他输房号进同一桌；你点「准备」交底注开始","Share this number so a friend can join the same table; tap “Ready” to post your ante and start"],
    ["开桌中…","Creating table…"],
    ["准备中，交底注入座…","Getting ready, posting ante…"],
    ["已退座，底注退回可领取","Left the seat — your ante is refundable"],
    ["新一局开始","New hand started"],
    ["本局已退款","This hand was refunded"],
    ["已切到","Switched to"],
    ["已跟注，等其他玩家…","Called — waiting for others…"],
    ["已加注，等其他玩家…","Raised — waiting for others…"],
    ["全下比牌中…","All-in showdown…"],
    ["比牌中…","Showdown…"],
    ["看牌中…","Looking…"],
    ["暂无可比牌的对手","No opponent to show down with"],
    ["只有单挑(剩两人)才能全下比牌","All-in showdown only works heads-up (2 players)"],
    ["点一个对手比牌，或再次点比牌取消","Tap an opponent to show down, or tap Show again to cancel"],
    ["领取中…","Claiming…"],
    ["已领取到钱包","Claimed to your wallet"],
    ["暂无可领","Nothing to claim"],
    ["头像上传中…","Uploading avatar…"],
    ["头像保存成功","Avatar saved"],
    ["请选择图片文件","Please choose an image file"],
    ["读取文件失败","Failed to read file"],
    ["昵称已保存为「","Nickname saved as “"],
    ["昵称最多3个字","Nickname is max 3 characters"],
    ["昵称最多 3 个字","Nickname is max 3 characters"],
    ["请输入昵称","Enter a nickname"],
    ["请输入房号","Enter a room number"],
    ["房间 #","Room #"],
    ["不存在，请让朋友重新建桌","doesn't exist — ask your friend to recreate the table"],
    ["本局已结束，请换一个房号或新建牌桌","this hand has ended — try another room or create a table"],
    ["查询房间 #","Looking up room #"],
    ["第1步：授权代币额度（一次授权，之后免弹）…","Step 1: approve token allowance (once, no more popups)…"],
    ["第2步：授权免签代发…","Step 2: approve gasless play…"],
    ["授权失败","Authorization failed"],
    ["请先连接钱包","Connect your wallet first"],
    ["正在登录对战服务…","Signing in to the game service…"],
    ["连接失败","Connection failed"],
    ["交易失败","Transaction failed"],
    ["确认超时","Confirmation timed out"],
    ["复制失败，请长按上面的地址手动复制","Copy failed — long-press the address above to copy"],
    ["地址已复制","Address copied"],
    ["余额已到账，继续出牌","Funds arrived — keep playing"],
    ["余额已刷新","Balance refreshed"],
    ["刷新中…","Refreshing…"],
    ["你已入座","You're seated"],
    ["你 弃牌","You folded"],
    ["你 跟注","You called"],
    ["你 加注","You raised"],
    ["你 比牌","You showed down"],
    ["你 全下比牌","You went all-in"],
    ["你赢得","You won"],
    ["赢得","won"],
    ["好牌！你赢得了本局","Nice hand — you won!"],
    ["退出全屏","Exit fullscreen"],
    ["开启音效","Sound on"],
    ["关闭音效","Sound off"],
    ["正在回到对局 #","Returning to hand #"],
    ["每一手，皆有可能。","Every hand, anything can happen."],
    ["落子之间，胜负未定。","Between the plays, nothing is settled."],
    ["牌桌","Table"],
    ["等待","Waiting"],
    ["我","Me"],
    // 结尾兜底:常见词(放最后,长词已先替换)
    ["押真","Real"],
    ["链上公平结算","provably fair on-chain"],
    ["奖金自动到账","auto payout"],
    ["链上公平，可证明","provably fair on-chain"],
    ["每人每局","per player / hand"],
    ["每人","per player"],
    ["最多","Up to"],
    [" 人"," players"]
  ];
  MAP.sort(function(a,b){ return b[0].length - a[0].length; });
  var CN = /[一-鿿]/;

  function getLang(){
    try{ var s=localStorage.getItem('ap_lang'); if(s==='en'||s==='zh') return s; }catch(e){}
    return (navigator.language||navigator.userLanguage||'').toLowerCase().indexOf('zh')===0 ? 'zh' : 'en';
  }
  var LANG = getLang();

  function trStr(s){
    if(!s || !CN.test(s)) return s;
    var out = s;
    for(var i=0;i<MAP.length;i++){ if(out.indexOf(MAP[i][0])>=0) out = out.split(MAP[i][0]).join(MAP[i][1]); }
    return out;
  }
  var ATTRS=['placeholder','title','aria-label'];
  function walk(node){
    if(node.nodeType===3){ var t=node.nodeValue; if(t && CN.test(t)){ var nt=trStr(t); if(nt!==t) node.nodeValue=nt; } return; }
    if(node.nodeType!==1) return;
    if(node.nodeName==='SCRIPT'||node.nodeName==='STYLE') return;
    for(var i=0;i<ATTRS.length;i++){ var a=ATTRS[i]; var v=node.getAttribute&&node.getAttribute(a); if(v && CN.test(v)){ var nv=trStr(v); if(nv!==v) node.setAttribute(a,nv); } }
    for(var c=node.firstChild;c;c=c.nextSibling) walk(c);
  }

  var obs=null, pending=false;
  function localizeAll(){
    if(LANG!=='en') return;
    try{ if(obs) obs.disconnect(); walk(document.body); }
    catch(e){}
    finally{ if(obs) obs.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS}); }
  }
  function schedule(){ if(pending) return; pending=true; (window.requestAnimationFrame||setTimeout)(function(){ pending=false; localizeAll(); }); }

  function injectToggle(){
    if(document.getElementById('apLangToggle')) return;
    var b=document.createElement('button');
    b.id='apLangToggle';
    b.type='button';
    b.textContent = (LANG==='en' ? '中文' : 'EN');
    b.title = (LANG==='en' ? '切换到中文' : 'Switch to English');
    b.style.cssText='position:fixed;z-index:9999;top:calc(8px + env(safe-area-inset-top,0px));right:10px;font:700 12px/1 Inter,system-ui,sans-serif;color:#e8c783;background:rgba(10,16,13,.85);border:1px solid #e0bd6666;border-radius:999px;padding:7px 12px;cursor:pointer;backdrop-filter:blur(4px);box-shadow:0 4px 14px #0008';
    b.onclick=function(){ var nl = (LANG==='en'?'zh':'en'); try{ localStorage.setItem('ap_lang', nl); }catch(e){} location.reload(); };
    document.body.appendChild(b);
  }

  function start(){
    injectToggle();
    if(LANG==='en'){
      document.documentElement.lang='en';
      obs=new MutationObserver(schedule);
      obs.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS});
      localizeAll();
      // 开局几秒内多补几次,防首屏异步渲染漏翻
      setTimeout(localizeAll,300); setTimeout(localizeAll,1200); setTimeout(localizeAll,3000);
    }
  }
  if(document.readyState!=='loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
