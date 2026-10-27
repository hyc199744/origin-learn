/* ANUBIS PLAY 龙虎厅 — 中英双语(i18n)
   方案与炸金花 anubis-play/i18n.js 同款:不改游戏逻辑。按"文本节点/属性"扫描,英文模式下把中文按"长优先"替换成英文;
   MutationObserver 盯住 app.js 的重渲染与 100ms tick 写入,增量翻译。
   语言与全站共用 localStorage 键 aplang(cookie 兜底,钱包内置浏览器丢 localStorage 也跟随);非中文一律英文。
   切换:顶栏音效左边一个 EN/中 小钮,中英双向都"就地"切、不 reload(切回中文=派 hashchange 让 app.js 从中文源重渲染)。 */
(function(){
  'use strict';
  // [中文, English] —— 运行时按中文长度降序排序,长短语先替换,避免"和局/和"这类子串误伤
  var MAP = [
    // ===== 进站门禁(../gate.js) =====
    ["进入前请确认","Please confirm before entering"],
    ["本平台为链上真钱游戏,使用真实加密资产下注","This is a real-money on-chain gaming platform using real crypto assets"],
    ["仅限 ","Only "],["18 周岁以上","adults 18+"],[" 成年人参与"," may take part"],
    ["请确认链上博彩在你所在国家/地区","Make sure on-chain gambling is "],["合法","legal"],[",违法地区请勿使用"," where you live; do not use it where it is illegal"],
    ["博彩有风险,","Gambling carries risk — "],["可能损失全部本金","you may lose your entire stake"],[",请理性参与、量力而行,切勿借贷","; play responsibly, within your means, never with borrowed money"],
    ["结果由链上区块哈希决定,公平但","Results are decided by on-chain block hashes — fair but "],["不可逆","irreversible"],[",盈亏自负","; wins and losses are yours"],
    ["本平台内容不构成任何投资建议","Nothing here is investment advice"],
    ["点击\"同意并进入\"即表示:你已年满18周岁、所在地区允许参与、并自愿承担全部风险。","By tapping “Agree & enter” you confirm you are 18+, allowed to take part where you live, and accept all risk."],
    ["我已满18周岁 · 同意并进入","I'm 18+ · Agree & enter"],
    ["未满18岁 / 不同意,离开","Under 18 / Disagree — leave"],

    // ===== 顶栏 / 导航 =====
    ["ANUBIS PLAY 官方 LOGO","ANUBIS PLAY logo"],
    ["返回游戏大厅","Back to lobby"],
    ["← 返回大厅","← Lobby"],
    ["Anubis龙虎厅","Dragon Tiger"],
    ["龙虎斗三馆试玩","Dragon Tiger"],
    ["连接钱包","Connect wallet"],
    ["连接中…","Connecting…"],
    ["音效","Sound"],
    ["游戏信息","Game info"],
    ["关闭","Close"],

    // ===== 轮次状态 =====
    ["准备下一轮","Next round soon"],
    ["开放下注","Bets open"],
    ["停止下注，准备发牌","Bets closed, dealing next"],
    ["停止下注","Bets closed"],
    ["正在发牌","Dealing"],
    ["依次开牌","Revealing"],
    ["本轮已结算","Round settled"],

    // ===== 牌桌 =====
    ["龙虎牌桌","Dragon Tiger table"],
    ["一牌定胜负","One card decides"],
    ["选择你的阵营","Pick your side"],
    ["牌大者胜 · A 最小 / K 最大","Higher card wins · A low / K high"],
    ["先选筹码，再点区域，最后确认","Pick a chip, tap a zone, then confirm"],
    ["龙 方","Dragon"],["虎 方","Tiger"],
    ["等待发牌","Waiting for deal"],
    ["等待开牌","Waiting for reveal"],
    [" 点",""],
    // 结果横幅 / 喜报
    ["龙方胜出","Dragon wins"],["虎方胜出","Tiger wins"],
    ["实际派彩 ","Payout "],[" · 返还本金 "," · principal back "],
    ["本轮观战 · 下一轮即将开始","Watching this round · next one starts soon"],
    ["恭喜中奖","You win!"],
    [" · 奖金已到账"," · winnings paid"],
    ["龙赢","Dragon wins"],["虎赢","Tiger wins"],

    // ===== 下注区 =====
    ["下注区域","Betting area"],
    ["下注区"," bet zone"],
    ["选择阵营","Choose a side"],
    ["点击加入筹码","Tap to add chips"],
    ["点击下注","Tap to bet"],
    ["净赔率 ","Odds "],
    ["待确认 ","Pending "],["已确认 ","Confirmed "],
    ["每次 +","Each tap +"],[" 枚",""],
    ["本轮已锁定","Round locked"],

    // ===== 控制区 =====
    ["我的筹码","My chips"],
    ["余额：","Balance: "],
    ["选择筹码","Choose chip"],
    ["撤销上一笔未确认下注","Undo last pending bet"],
    ["清除","Clear"],
    ["确认下注","Confirm bet"],
    ["重复上轮","Repeat last"],
    ["仅扣除已确认筹码","Only confirmed chips are charged"],
    ["上轮筹码已加入，请确认下注","Last round's chips added — confirm your bet"],

    // ===== 路单 =====
    ["对局路单","Road map"],
    ["已完成 ","Completed "],
    ["珠盘路 ","Bead road "],
    ["从上到下，6 行一列","top to bottom, 6 per column"],
    ["查看记录 ↗","Records ↗"],
    ["路单来自链上已结算轮次。","Road map comes from settled on-chain rounds."],
    ["本轮已确认","Confirmed this round"],
    ["LGNS · 链上真钱结算","LGNS · settled on-chain"],
    ["第一局结果将在这里出现","The first result will appear here"],
    ["龙胜","Dragon wins"],["虎胜","Tiger wins"],
    ["第 ","Round "],[" 局 · "," · "],[" 局",""],

    // ===== 底栏 =====
    ["真钱对局 · Anubis 链 · LGNS 结算","Real money · Anubis chain · settled in LGNS"],
    ["我的记录","My records"],
    ["大厅","Lobby"],["规则","Rules"],["钱包","Wallet"],

    // ===== 规则弹窗 =====
    ["一张牌，见分晓。","One card decides it all."],
    ["选择筹码 → 点击龙、和或虎 → 确认下注。15 秒后封盘，依次发牌、翻牌并自动结算。","Pick a chip → tap Dragon, Tie or Tiger → confirm. Betting then closes; cards are dealt, revealed and settled automatically."],
    ["每局重新洗一副 52 张标准牌，抽取两张不同牌。只比较点数，花色不比较；点数相同为和。","Each round draws two different cards from a fresh 52-card deck. Only rank counts, suits don't; equal rank is a Tie."],
    ["押 10 的派彩","Payout on 10"],
    ["押龙且龙胜","Bet Dragon, Dragon wins"],["押虎且虎胜","Bet Tiger, Tiger wins"],["押和且和局","Bet Tie, it's a Tie"],
    ["（本金 10 + 盈利 "," (stake 10 + profit "],
    ["本轮和局时，龙 / 虎下注：","On a Tie, Dragon / Tiger bets: "],
    ["退回一半","half refunded"],["全额退回","fully refunded"],["全部损失","lost"],
    ["。设置里可以调整，下一轮生效。",". Adjustable in settings, takes effect next round."],
    ["确认时扣除下注，结算时入账派彩。","Bets are charged on confirm; payouts are credited on settlement."],
    ["净变化 = 派彩 − 全部已确认下注","Net = payout − all confirmed bets"],
    ["。多区域同时下注时，输掉区域的本金也计入净变化。",". When betting several zones, the stake of losing zones counts in the net."],
    ["未确认筹码在封盘时取消；已经确认的下注不能撤销。重复上轮只添加待确认筹码；连续下注需手动启用，最多 5 轮，刷新后自动停止。","Pending chips are cancelled when betting closes; confirmed bets can't be undone. Repeat last only adds pending chips; auto-repeat must be enabled manually, max 5 rounds, stops on refresh."],
    ["路单仅显示本标签页实际试玩历史，保存最近 300 局；统计保留本会话累计结果。暂未实现大路。安全随机源不代表链上可验证公平。本页仅供虚拟筹码试玩。","The road map only shows this tab's history, last 300 rounds; stats keep this session's totals. Big road not implemented. A secure RNG is not the same as on-chain verifiable fairness. This page is for virtual-chip play only."],
    ["净赔率","Net odds"],["结果","Result"],
    // 设置弹窗(无入口,顺带)
    ["按你的节奏。","At your pace."],["轻提示音","Soft sound"],["点击下注与结算时播放","plays on bet and settlement"],
    ["默认尊重系统“减少动态效果”设置。","Respects the system “reduce motion” setting."],

    // ===== 记录弹窗 =====
    ["我的试玩记录","My records"],
    ["最近 300 局内的已下注记录 · ","Bets in the last 300 rounds · "],[" 条"," entries"],
    ["原始下注","Stake"],["赢注盈利（不含本金）","Profit (ex. stake)"],["本金返还","Principal back"],
    ["实际派彩","Payout"],["本轮净变化","Net this round"],["结算后余额","Balance after"],
    [" / 和 "," / Tie "],[" / 虎 "," / Tiger "],["龙 ","Dragon "],
    ["牌面：","Cards: "],[" · 和局规则："," · tie rule: "],
    ["还没有下注记录。","No bets yet."],
    ["确认下注并完成一轮后，会在这里展示。","Confirm a bet and finish a round to see it here."],

    // ===== 钱包弹窗 / wallet.js =====
    ["钱包已连接","Wallet connected"],
    ["连接你的钱包","Connect your wallet"],
    ["当前网络 ","Current network "],[" · 请切换至 Anubis"," · please switch to Anubis"],
    ["切换至 Anubis","Switch to Anubis"],
    ["断开本页连接","Disconnect"],
    [" · 连接中…"," · connecting…"],
    ["未检测到钱包。请在 OKX、TokenPocket、imToken 等钱包的 DApp 浏览器中打开。你也可以关闭此窗口直接试玩。","No wallet detected. Open this page in the DApp browser of OKX, TokenPocket, imToken, etc."],
    ["未检测到钱包。请在 OKX / TP 等钱包 DApp 浏览器打开，试玩可直接继续。","No wallet detected. Open in the OKX / TP DApp browser."],
    ["重新检测钱包","Detect again"],
    ["钱包浏览器","Wallet browser"],
    ["你已取消钱包连接，可继续试玩","Wallet connection cancelled"],
    ["钱包连接失败，请重试","Wallet connection failed, try again"],
    ["钱包尚未添加 Anubis，请使用官方网络配置添加后重试","Anubis isn't added to your wallet; add it with the official network config and retry"],
    ["已取消切换网络","Network switch cancelled"],
    ["网络切换失败，请重试","Network switch failed, try again"],
    ["请切换到 Anubis 链(6714)","Switch to Anubis chain (6714)"],
    ["钱包不可用","Wallet unavailable"],
    ["请先连接钱包","Connect your wallet first"],

    // ===== 引擎通知 / 下注流程 / 合约报错(onchain-engine.js) =====
    ["连接钱包开始真钱对局","Connect a wallet to play for real"],
    ["等待开局…","Waiting for the round to open…"],
    ["请选择筹码，点击龙 / 和 / 虎下注","Pick a chip, tap Dragon / Tie / Tiger to bet"],
    ["（本轮奖池可接：龙/虎单注≤"," (pool this round: Dragon/Tiger ≤ "],
    ["，和暂不可押",", Tie unavailable"],["，和≤",", Tie ≤ "],[" LGNS）"," LGNS)"],
    ["发牌中…","Dealing…"],
    ["开牌结算中…","Revealing & settling…"],
    ["本轮已封盘，请等待下一轮","Betting is closed for this round, wait for the next"],
    ["本轮已封盘，请等下一轮","Betting closed, wait for the next round"],
    ["请选择有效筹码","Pick a valid chip"],
    ["LGNS 余额不足，无法重复上轮","Not enough LGNS to repeat last round"],
    ["LGNS 余额不足","Not enough LGNS"],
    ["首次下注需先授权一次（以后不再弹），请在钱包确认","First bet needs a one-time approval (never again) — confirm in your wallet"],
    ["授权成功，可以下注了","Approved — you can bet now"],
    ["授权成功","Approved"],
    ["还没有可重复的上一轮下注","No previous bet to repeat"],
    ["真钱模式不支持自动连投","Auto-repeat isn't available in real-money mode"],
    ["和局规则由合约固定（退一半）","Tie rule is fixed by the contract (half refund)"],
    ["正在刷新链上余额…","Refreshing on-chain balance…"],
    ["请先选择筹码点龙/和/虎","Pick a chip, then tap Dragon/Tie/Tiger"],
    ["单区最低 ","Min per zone "],
    ["奖池只能接龙/虎单注 ≤ ","Pool can only take a Dragon/Tiger bet ≤ "],
    ["奖池只能接和局注 ≤ ","Pool can only take a Tie bet ≤ "],
    ["当前奖池太小，暂不能押和（赔16倍需奖池≥","Pool too small for Tie bets right now (16× payout needs pool ≥ "],
    ["，请减少筹码",", reduce your chips"],
    ["等待钱包确认…","Waiting for wallet…"],
    ["请在钱包确认授权","Confirm the approval in your wallet"],
    ["请在钱包确认下注：","Confirm the bet in your wallet: "],
    ["（剩约 "," (about "],[" 秒）","s left)"],
    ["下注成功，等待自动开奖…","Bet placed — waiting for the draw…"],
    ["下注成功","Bet placed"],
    ["下注未完成","Bet not completed"],
    ["交易确认超时","Confirmation timed out"],
    ["交易失败","Transaction failed"],
    ["已取消","Cancelled"],
    ["本轮剩余时间不够钱包确认了，请等下一轮开盘后尽早下注","Not enough time left for wallet confirmation — bet early next round"],
    ["奖池不足，接不了这么大的注，请减少筹码","Pool too low for a bet this size, reduce your chips"],
    ["低于单注下限","Below minimum bet"],
    ["庄家钱包不能下注，请换一个钱包","The house wallet can't bet, use another wallet"],
    ["本轮注单已满","This round is full"],
    ["LGNS 扣款失败：余额或授权不足","LGNS charge failed: balance or allowance too low"],
    ["游戏已暂停","Game paused"],
    ["gas(DAI)或余额不足","Not enough gas (DAI) or balance"],
    ["操作未完成，请重试","Action failed, please retry"],
    ["操作未完成","Action failed"],
    ["存储不可用，刷新可能丢失本次试玩","Storage unavailable"],

    // ===== 兜底:单字/标点(最后替换) =====
    ["和局","Tie"],
    ["龙","Dragon"],["虎","Tiger"],["和","Tie"],
    ["（","("],["）",")"],["：",": "],["，",", "],["、",", "],["；","; "],["。","."],["“","“"],["”","”"]
  ];
  MAP.sort(function(a,b){ return b[0].length - a[0].length; });
  var CN = /[一-鿿]/;
  var SKIP_CLASS = /(^|\s)animal-seal(\s|$)/; // 龍/虎 印章是装饰字形,不翻

  function readLang(){
    try{ var s=localStorage.getItem('aplang'); if(!s){ var m=document.cookie.match('(?:^|; )aplang=([^;]*)'); if(m)s=decodeURIComponent(m[1]); } if(s){ return (s==='zh')?'zh':'en'; } }catch(e){}
    return (navigator.language||navigator.userLanguage||'').toLowerCase().indexOf('zh')===0 ? 'zh' : 'en';
  }
  function persist(l){
    try{ localStorage.setItem('aplang',l); }catch(e){}
    try{ document.cookie='aplang='+l+';path=/;max-age=31536000;samesite=lax'; }catch(e){}
  }
  var LANG = readLang();

  function trStr(s){
    if(!s || !CN.test(s)) return s;
    var out = s;
    for(var i=0;i<MAP.length;i++){ if(out.indexOf(MAP[i][0])>=0) out = out.split(MAP[i][0]).join(MAP[i][1]); }
    return out;
  }
  var ATTRS=['placeholder','title','aria-label','alt'];
  function walk(node){
    if(node.nodeType===3){ var t=node.nodeValue; if(t && CN.test(t)){ var nt=trStr(t); if(nt!==t) node.nodeValue=nt; } return; }
    if(node.nodeType!==1) return;
    if(node.nodeName==='SCRIPT'||node.nodeName==='STYLE'||node.nodeName==='NOSCRIPT') return;
    if(node.id==='dtLangToggle') return; // 切换钮自己管文案(EN/中)
    if(SKIP_CLASS.test(node.className||'')) return;
    for(var i=0;i<ATTRS.length;i++){ var a=ATTRS[i]; var v=node.getAttribute&&node.getAttribute(a); if(v && CN.test(v)){ var nv=trStr(v); if(nv!==v) node.setAttribute(a,nv); } }
    for(var c=node.firstChild;c;c=c.nextSibling) walk(c);
  }
  function trTitle(){ try{ var t=document.title; if(CN.test(t)){ var nt=trStr(t); if(nt!==t) document.title=nt; } }catch(e){} }

  // ---- 顶栏切换钮:放音效钮左边,随 app.js 重渲染自动补回 ----
  function ensureToggle(){
    try{
      if(document.getElementById('dtLangToggle')) return;
      var snd=document.getElementById('soundToggle'); if(!snd||!snd.parentNode) return;
      var b=document.createElement('button'); b.id='dtLangToggle'; b.type='button'; b.className='icon-btn lang-btn';
      b.setAttribute('aria-label','Language');
      b.addEventListener('click',function(ev){ ev.preventDefault(); ev.stopPropagation(); window.setLang(LANG==='en'?'zh':'en'); });
      snd.parentNode.insertBefore(b,snd);
      updateToggle();
    }catch(e){}
  }
  function updateToggle(){
    var b=document.getElementById('dtLangToggle'); if(!b) return;
    b.textContent=(LANG==='en'?'中':'EN');
    b.title=(LANG==='en'?'切换到中文':'Switch to English');
  }

  var OBSOPT={childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS};
  var obs=null, q=[], pending=false;
  function fullLocalize(){ // 首屏/切换:整页扫一次
    ensureToggle();
    if(LANG!=='en') return;
    try{ if(obs) obs.disconnect(); walk(document.body); trTitle(); }catch(e){}
    finally{ if(obs) obs.observe(document.body,OBSOPT); }
  }
  function flush(){ // 只翻译本批变化的节点(app.js 每 100ms tick 会重写状态文案)
    pending=false; ensureToggle();
    if(LANG!=='en'){ q=[]; return; }
    var batch=q; q=[];
    try{ if(obs) obs.disconnect(); for(var i=0;i<batch.length;i++){ try{ walk(batch[i]); }catch(e){} } trTitle(); }
    finally{ if(obs) obs.observe(document.body,OBSOPT); }
  }
  function onMut(muts){
    for(var i=0;i<muts.length;i++){ var m=muts[i];
      if(m.type==='childList'){ for(var j=0;j<m.addedNodes.length;j++) q.push(m.addedNodes[j]); }
      else q.push(m.target); // characterData / attributes
    }
    if(!pending){ pending=true; (window.requestAnimationFrame||function(f){setTimeout(f,16);})(flush); }
  }

  function applyLang(){
    try{ document.documentElement.lang=(LANG==='en'?'en':'zh-CN'); }catch(e){}
    if(LANG==='en'){
      fullLocalize(); setTimeout(fullLocalize,300); setTimeout(fullLocalize,1200);
    }else{
      // 切回中文:子串替换单向不可逆,让 app.js 自己从中文源整页重渲染(route 监听 hashchange);弹窗关掉下次打开即中文
      try{ var d=document.getElementById('dialog'); if(d&&d.open) d.close(); }catch(e){}
      try{ window.dispatchEvent(new Event('hashchange')); }catch(e){}
    }
    updateToggle();
  }
  // 全站统一入口(大厅/浮钮同名):就地切换,不 reload
  window.setLang=function(l){ l=(l==='zh')?'zh':'en'; persist(l); if(l===LANG){ updateToggle(); return; } LANG=l; applyLang(); };
  window.getLang=function(){ return LANG; };

  function start(){
    obs=new MutationObserver(onMut);
    obs.observe(document.body,OBSOPT);
    ensureToggle();
    if(LANG==='en'){
      document.documentElement.lang='en';
      fullLocalize();
      setTimeout(fullLocalize,300); setTimeout(fullLocalize,1200); setTimeout(fullLocalize,3000);
    }
  }
  if(document.readyState!=='loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
