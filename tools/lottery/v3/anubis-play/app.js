/* ANUBIS PLAY 金花牌局 — 真人实时对战前端(黑金皮肤 + 真实链上逻辑)
   视觉皮套复用 styles.css;逻辑连 Anubis 链 + 发牌后端(wss),押真 LGNS,授权一次免签玩牌。
   不在前端产生随机结果:牌序由合约种子+blockhash决定,后端按权威结果发牌,可事后核验。 */
(function(){
  'use strict';
  const A=window.APPlatform;
  const $=id=>document.getElementById(id);
  const icon=name=>`<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // ---- 多池配置:LGNS/DAI/RM/USDT,各自独立后端(WSS)/合约/代币/小数/档位。正式合约,owner=feeTo=0x4A5f8D ----
  const TOKENS={
    lgns:{ key:'lgns', label:'LGNS', sym:'LGNS', wss:'wss://zjgame.web3origin.com',     contract:'0x628e54169677551b1C6cF77a3d68C04Bd76789E1', token:'0x4D1D808a081FdAc440703b3765FC61f8028C06B8', dec:9,  tiers:[10,50,100],     delegate:'0xC7fd978C49c69447313C22E8c57fC29adBb64fC9' },
    dai: { key:'dai',  label:'DAI',  sym:'DAI',  wss:'wss://zjgame.web3origin.com/dai', contract:'0x01ece8971b658483Cb0Dc33F071d1EcEFfA07A6D', token:'0x83fd06F0846d9D90B3016bF670Efe2E0B11cDe14', dec:18, tiers:[1,5,10,50],      delegate:'0xfaE7F7c17F10269760eb3AaF162161F362367b22' },
    rm:  { key:'rm',   label:'RM',   sym:'RM',   wss:'wss://zjgame.web3origin.com/rm',  contract:'0x143905b577A13aeC122C37eB6e88636AF3e1b470', token:'0x2e045e1380f5f5b6e7550328910a7377c9fce59d', dec:9,  tiers:[0.1,0.2,0.5,1], delegate:'0xc199963Bd66a104c40989a1749C85118232475A8' },
    usdt:{ key:'usdt', label:'USDT', sym:'USDT', wss:'wss://zjgame.web3origin.com/usdt',contract:'0xB8d3ca7A5ae0FB079a4D0b2bffd2C2244455B7f4', token:'0xDfb6a28BC6DC51fed17c27C880F2c66cDd040A3e', dec:6,  tiers:[1,5,10,50],      delegate:'0xAe88781f9B88f774A4F2254499F3ff0FF69bAD8f' }
  };
  let curToken='lgns'; try{ const _t=localStorage.getItem('ap_token'); if(_t&&TOKENS[_t])curToken=_t; }catch(e){}
  let WSS, CONTRACT, LGNS, DEC, SYM, TIERS;
  function applyToken(){ const c=TOKENS[curToken]; WSS=c.wss; CONTRACT=c.contract; LGNS=c.token; DEC=c.dec; SYM=c.sym; TIERS=c.tiers; }
  applyToken();
  // 授权额度由用户输入，连接和登录不自动发起授权。
  const ZERO='0x0000000000000000000000000000000000000000';
  const ANUBIS={id:6714,hex:'0x1A3A',name:'Anubis',rpc:'https://rpc.anubispace.org',exp:'https://browser.anubispace.org',native:{name:'DAI',symbol:'DAI',decimals:18}};
  const SEL={withdraw:'3ccfd60b',approve:'095ea7b3',allowance:'dd62ed3e',bal:'70a08231',authorize:'b6a5d7de',deleg:'8d22ea2a',wd:'ce513b6f'};
  const SUITS=['♠','♥','♣','♦'];               // 后端 s:0-3
  const LABELS=['单张','对子','顺子','同花','同花顺','豹子'];

  // ---- 状态 ----
  let myAddr=null, ws=null, authed=false, delegate=null, authorized=false, authInProgress=false, pendingAutoAuth=false, _triedToken=false;
  let allowLoginSignature=false,reconnectTimer=null,reconnectDelay=1000,roomsLoaded=false,claimBusy=false,createBusy=false,createTimer=null;
  let curHand=null, myCards=null, state=null, picking=false, lastPot='0';
  let view='table', filter='all', newAnte=10, newCount=6, newPrivate=false;
  let sound=false, bgmOn=false, bgmNodes=null, audioCtx=null, modalFocus=null, toastTimer, msgTimer, fsBusy=false;
  let lastDealtHand=null, startedHands=new Set(), activity=[], results=[];
  let prevPlayers=null, cdActive=false, cdBase='', pending=false, joining=false, myLookedLocal=false, pendingLook=false, myNick='', myNickRem=3, myBalStr='—', myClaimStr='0 LGNS', myClaimPos=false, myBalNum=0, _balT=0, balFetched=false, qrOpen=false, walletBals={}, _topupSeen=false, _topupOpen=false;
  let tableLayout='split';
  let avatarCache={}; // 地址(小写)->头像data URL,给座位展示
  let pendingAvatar=null; // 选好但还没点保存上传的头像

  const LAYOUTS={split:'02 对席分区',focus:'03 单手操作'}; // 01经典环桌已取消
  // 牌桌布局切换(经典环桌/对席分区/单手操作),存本地,默认01
  function applyLayout(){ const g=$('jtGame'); if(g)g.dataset.layout=tableLayout; }
  function setTableLayout(name){ if(!LAYOUTS[name])return; tableLayout=name; applyLayout(); try{localStorage.setItem('ap_layout',name);}catch(e){} resizeGame(); if($('modal').open)showWallet(); toast('牌桌布局：'+LAYOUTS[name]); }
  // 响应式:按牌桌容器宽度切 wide(电脑/平板宽布局),横屏矮屏切 compact;同时给 --vh 兜底(DApp 钱包浏览器 100vh 不准)
  function resizeGame(){ const g=$('jtGame'); if(!g)return; try{document.documentElement.style.setProperty('--vh',(window.innerHeight*0.01)+'px');}catch(e){} const w=g.getBoundingClientRect().width; let landscape=false; try{ landscape = window.matchMedia ? matchMedia('(orientation:landscape)').matches : (window.innerWidth>window.innerHeight); }catch(e){ landscape=window.innerWidth>window.innerHeight; } const compact = landscape && window.innerHeight<=550; g.classList.toggle('wide', w>620&&!compact); g.classList.toggle('compact', compact); }
  function resizeSoon(){ resizeGame(); setTimeout(resizeGame,80); setTimeout(resizeGame,350); setTimeout(resizeGame,900); } // DApp浏览器视口常晚settle,多补几次防布局误判

  // ---- 工具 ----
  const short=a=>a?a.slice(0,6)+'…'+a.slice(-4):'';
  const e9=v=>Number(BigInt(v))/Math.pow(10,DEC);   // 按当前池代币小数位换算显示(名字沿用e9,实为e^DEC)
  function toBase(n){ // 人类档位(可带小数,如0.1)→基础单位,按位精确(避免浮点)
    const t=String(n); const [ip,fp='']=t.split('.');
    const frac=(fp+'0'.repeat(DEC)).slice(0,DEC);
    return BigInt((ip+frac).replace(/^0+(?=\d)/,'')||'0');
  }
  const fmt=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:3});
  // 房间档位名/标记:按当前池档位相对定(最高档=大师,最低=经典,中间=进阶)
  const tierName=av=>{const mx=TIERS[TIERS.length-1],mn=TIERS[0];return av>=mx?'大师':(av<=mn?'经典':'进阶');};
  const tierMark=av=>{const mx=TIERS[TIERS.length-1],mn=TIERS[0];return av>=mx?'♣':(av<=mn?'♠':'♥');};
  const tierCls=av=>{const mx=TIERS[TIERS.length-1],mn=TIERS[0];return av>=mx?'blue':(av<=mn?'':'red');};
  const nz=a=>a&&a.toLowerCase()!==ZERO;
  function toast(t){clearTimeout(toastTimer);const el=$('toast');el.textContent=t;el.classList.add('show');toastTimer=setTimeout(()=>el.classList.remove('show'),3600);}
  function message(t){ toast(t); } // 牌桌内提示改用 toast
  function enc(v){return BigInt(v).toString(16).padStart(64,'0');}
  function encA(a){return '0'.repeat(24)+a.toLowerCase().replace(/^0x/,'');}
  function rcall(to,d){return A.call(to,d);}
  async function roomPhase(id){ // 查房间当前阶段:0不存在/1等待/2下注/3摊牌/4结束/5退款, -1出错
    try{ const r=await rcall(CONTRACT,'d47f269e'+enc(id)); if(!r||r.length<64)return 0; return parseInt(r.slice(62,64),16)||0; }catch(e){ return -1; }
  }
  // ---- 回到对局(防手滑点返回丢失当前局) ----
  async function phaseOfContract(contract,id){ try{ const r=await rcall(contract,'d47f269e'+enc(id)); if(!r||r.length<64)return 0; return parseInt(r.slice(62,64),16)||0; }catch(e){ return -1; } }
  function saveActiveHand(pool,id){ try{localStorage.setItem(A.activeKey(myAddr),JSON.stringify({pool,id:String(id)}));}catch(e){} }
  function clearActiveHand(id){ try{ const r=JSON.parse(localStorage.getItem(A.activeKey(myAddr))||'null'); if(r && (id==null||String(r.id)===String(id))) localStorage.removeItem(A.activeKey(myAddr)); }catch(e){} }
  function rememberHand(m){ try{ const me=(m.players||[]).find(p=>isMe(p.addr)); if(me && !me.folded && Number(m.phase)>=1 && Number(m.phase)<4){ saveActiveHand(curToken, m.handId); } else { clearActiveHand(m.handId); } }catch(e){} }
  // 回到对局(确保连上并认证后再进桌,防电脑端点了进不去)
  function doResume(pool,id){
    const pk=(pool&&TOKENS[pool])?pool:curToken;
    if(pk!==curToken){ window._pendingResume=id; setPool(pk); return; }   // 跨池:切池后由authed自动回局
    if(authed && ws && ws.readyState===1){ joinRoom(id); return; }         // 已就绪直接进
    window._pendingResume=id;                                              // 没就绪:登记,连上认证后authed处理里自动回局
    if(!myAddr){ connect(); } else if(!ws || ws.readyState>1){ connectWS(); }
    toast('正在连接并回到对局 #'+id+'…');
  }
  async function checkResume(){
    const old=$('resumeBar'); if(old)old.remove();
    let rec=null; try{ rec=JSON.parse(localStorage.getItem(A.activeKey(myAddr))||'null'); }catch(e){}
    if(!rec||!rec.id) return;
    const pk=(rec.pool&&TOKENS[rec.pool])?rec.pool:curToken;
    const ph=await phaseOfContract(TOKENS[pk].contract, rec.id);
    if([0,4,5].includes(ph)){ clearActiveHand(rec.id); return; }
    const lob=$('lobbyView'); if(!lob||view!=='lobby') return;
    const old2=$('resumeBar'); if(old2)old2.remove();
    const bar=document.createElement('button'); bar.id='resumeBar';bar.type='button';
    bar.style.cssText='margin:12px 0;padding:14px 16px;border-radius:14px;background:linear-gradient(90deg,#2a1e08,#16281f);border:1px solid #e0bd6666;display:flex;align-items:center;gap:12px;cursor:pointer';
    bar.style.width='100%';bar.style.textAlign='left';
    bar.innerHTML='<span style="font-size:22px">⏳</span><span style="flex:1;min-width:0"><strong style="display:block;color:#e0bd68">'+A.L(ph===-1?'对局状态查询失败，记录已保留':ph===3?'对局正在等待结算':'你还有一局对局进行中',ph===-1?'Game status unavailable; record preserved':ph===3?'Game awaiting settlement':'You have an active game')+'</strong><span style="font-size:12px;color:#8ba398">'+TOKENS[pk].label+' · #'+esc(rec.id)+'</span></span><span style="background:#e0bd68;color:#1a1200;font-weight:800;padding:9px 16px;border-radius:10px;white-space:nowrap">'+A.L('回到对局','Resume')+'</span>';
    bar.onclick=()=>{ doResume(pk, rec.id); };
    lob.insertBefore(bar, lob.firstChild);
  }
  // 点「我的牌桌」时:没在桌就尝试回到记录的进行中对局(手滑点返回后从这里回去)
  async function resumeActiveHand(){
    let rec=null; try{ rec=JSON.parse(localStorage.getItem(A.activeKey(myAddr))||'null'); }catch(e){}
    if(!rec||!rec.id){ toast('你还没入座牌桌，去大厅选一桌'); return; }
    const pk=(rec.pool&&TOKENS[rec.pool])?rec.pool:curToken;
    toast('正在回到对局 #'+rec.id+'…');
    const ph=await phaseOfContract(TOKENS[pk].contract, rec.id);
    if(ph===-1){toast(A.L('查询失败，已保留对局记录，请稍后重试','Query failed; game record preserved. Retry shortly.'));return;}
    if([0,4,5].includes(ph)){ clearActiveHand(rec.id); toast(A.L('对局已结束，请核对资产与退款','Game ended; check Assets & refunds')); return; }
    doResume(pk, rec.id);
  }
  function loadResults(){return myAddr?A.results(myAddr):[];}
  function saveResults(){if(myAddr&&results[0])results=A.saveResult(myAddr,results[0]);}
  function logAct(t){activity.unshift({text:t,time:new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})});activity=activity.slice(0,40);}

  // 牌:后端 {r:0..12(0=2..12=A), s:0..3} → 展示 {value:2..14, suit}
  const conv=c=>({value:c.r+2, suit:SUITS[c.s]});
  function rankHand(cards){ // cards: {value,suit} 三张;返回 {group,label}
    const v=cards.map(c=>c.value).sort((a,b)=>b-a);
    const flush=cards.every(c=>c.suit===cards[0].suit);
    const wheel=v.join(',')==='14,3,2';
    const straight=wheel||(v[0]-v[1]===1&&v[1]-v[2]===1);
    const trips=v[0]===v[2];
    const pair=v[0]===v[1]||v[1]===v[2];
    let g;
    if(trips)g=5; else if(flush&&straight)g=4; else if(flush)g=3; else if(straight)g=2; else if(pair)g=1; else g=0;
    return {group:g,label:LABELS[g]};
  }
  function score(cs){ // cs:{r,s} 后端编码,与合约一致,用于定赢家
    const r=cs.map(c=>c.r).sort((a,b)=>b-a),s=cs.map(c=>c.s);
    const fl=s[0]===s[1]&&s[1]===s[2];let st=false,sh=0;
    if(r[0]===r[1]+1&&r[1]===r[2]+1){st=true;sh=r[0];}else if(r[0]===12&&r[1]===1&&r[2]===0){st=true;sh=1;}
    const tr=r[0]===r[1]&&r[1]===r[2];let cat,t0=0,t1=0,t2=0;
    if(tr){cat=6;t0=r[0];}else if(st&&fl){cat=5;t0=sh;}else if(fl){cat=4;t0=r[0];t1=r[1];t2=r[2];}else if(st){cat=3;t0=sh;}
    else if(r[0]===r[1]||r[1]===r[2]){cat=2;if(r[0]===r[1]){t0=r[0];t1=r[2];}else{t0=r[1];t1=r[0];}}else{cat=1;t0=r[0];t1=r[1];t2=r[2];}
    return cat*0x1000000+t0*0x10000+t1*0x100+t2;
  }

  // ---------- 钱包 ----------
  async function connect(){
    try{
      myAddr=await A.connect();results=loadResults();
      $('walletLabel').textContent=short(myAddr);
      const cb=$('mConnectBtn');if(cb&&cb.querySelector('span'))cb.querySelector('span').textContent=short(myAddr);
      await A.requireReferral(myAddr);
      await refreshBalances();
      if(!authed){allowLoginSignature=true;connectWS();for(let i=0;i<150&&!authed;i++)await new Promise(r=>setTimeout(r,100));if(!authed)throw new Error(A.L('对战登录未完成，请重新连接','Game login incomplete; reconnect'));}
      await checkAuth();
      return true;
    }catch(e){toast(e.message||A.L('连接失败','Connection failed'));return false;}
  }
  async function sendTxTo(to,data){return A.send(myAddr,to,'0x'+data.replace(/^0x/,''),A.L('炸金花交易 ','Card-game transaction ')+SYM);}
  const sendTx=data=>sendTxTo(CONTRACT,data);
  async function refreshBalances(){
    if(!myAddr)return;const op=curToken,a=myAddr,token=LGNS,contract=CONTRACT;
    let ok=true;
    try{const b=await A.uintCall(token,SEL.bal+encA(a));if(op!==curToken||a!==myAddr)return;myBalNum=e9(b);balFetched=true;myBalStr=fmt(myBalNum);if($('jtBal'))$('jtBal').textContent=myBalStr;}
    catch(e){ok=false;if(op===curToken&&a===myAddr){balFetched=false;myBalStr=A.L('查询失败','Unavailable');myBalNum=0;if($('jtBal'))$('jtBal').textContent=myBalStr;}}
    try{const wd=await A.uintCall(contract,SEL.wd+encA(a));if(op!==curToken||a!==myAddr)return;myClaimStr=A.format(wd,DEC)+' '+SYM;myClaimPos=wd>0n;}
    catch(e){ok=false;if(op===curToken&&a===myAddr){myClaimStr=A.L('查询失败，请重试','Query failed; retry');myClaimPos=false;}}
    if($('mwClaim'))$('mwClaim').textContent=myClaimStr;if($('mwClaimBtn'))$('mwClaimBtn').disabled=!myClaimPos||claimBusy;
    return ok;
  }
  async function checkAuth(){
    if(!myAddr||!delegate){authorized=false;return;}
    const op=curToken,a=myAddr,t=TOKENS[op];
    try{const d=await rcall(t.contract,SEL.deleg+encA(a)),al=await A.uintCall(t.token,SEL.allowance+encA(a)+encA(t.contract));if(op===curToken&&a===myAddr)authorized=(('0x'+d.slice(-40)).toLowerCase()===t.delegate.toLowerCase())&&al>=toBase(TIERS[0]);}
    catch(e){if(op===curToken&&a===myAddr)authorized=false;}
  }
  async function doAuthorize(){
    if(!myAddr||!authed){toast(A.L('请先连接对战服务','Connect to the game service first'));return false;}
    const t=TOKENS[curToken],defaultAmount=String(TIERS[0]*100);
    openModal(A.L('确认本池操作权限','Confirm permissions for this pool'),'<p>'+A.L('授权代币额度和指定代发服务各需要一次钱包确认。额度有限，耗尽后需重新授权。','Token allowance and the designated delegate each require wallet confirmation. The allowance is finite and must be renewed when used up.')+'</p><label class="form-label" for="authAmount">'+A.L('最高可用代币额度','Maximum token allowance')+' ('+t.sym+')</label><input class="ap-input" id="authAmount" inputmode="decimal" value="'+defaultAmount+'"><p class="form-note">'+A.L('代币合约：','Token: ')+esc(t.token)+'<br>'+A.L('游戏合约：','Game: ')+esc(t.contract)+'<br>'+A.L('代发地址：','Delegate: ')+esc(t.delegate)+'</p><button class="gold-button" data-action="authorize-confirm" data-auth-pool="'+curToken+'">'+A.L('按此额度授权','Authorize this allowance')+'</button>','PERMISSIONS');return false;
  }
  async function confirmAuthorize(b){
    if(authInProgress)return;authInProgress=true;b.disabled=true;const op=b.dataset.authPool,a=myAddr;
    try{if(op!==curToken)throw new Error(A.L('币种池已改变，请重新确认','Pool changed; confirm again'));const t=TOKENS[op],amount=A.parseAmount($('authAmount').value,t.dec);await A.requireReferral(a);await A.authorize(t,a,amount);if(op!==curToken||a!==myAddr)throw new Error(A.L('钱包或币种已改变，请重新查询','Wallet or pool changed; refresh'));await checkAuth();if(!authorized)throw new Error(A.L('授权额度低于本池最低底注','Allowance is below the minimum ante'));closeModal();toast(A.L('授权已确认，请再次准备或创建牌桌','Permissions confirmed; prepare or create your table again'));}
    catch(e){authorized=false;toast(e.message||A.L('授权未完成','Authorization incomplete'));}
    finally{authInProgress=false;b.disabled=false;}
  }
  async function revokeAllowance(){
    if(!myAddr||authInProgress)return;authInProgress=true;
    try{await sendTxTo(LGNS,SEL.approve+encA(CONTRACT)+enc(0));authorized=false;toast(A.L('代币额度已撤销','Token allowance revoked'));showWallet();}catch(e){toast(e.message);}finally{authInProgress=false;}
  }

  // ---------- WSS ----------
  function connectWS(){
    if(!myAddr)return;clearTimeout(reconnectTimer);_triedToken=false;
    if(ws){ws.onclose=null;try{ws.close();}catch(e){}}
    authed=false;roomsLoaded=false;renderRooms();ws=new WebSocket(WSS);const sock=ws;
    sock.onopen=()=>{if(sock===ws)setNet(false);};
    sock.onclose=()=>{if(sock!==ws)return;authed=false;authorized=false;roomsLoaded=false;setNet(false);renderRooms();if(state)render();reconnectTimer=setTimeout(()=>{allowLoginSignature=false;connectWS();},reconnectDelay);reconnectDelay=Math.min(30000,reconnectDelay*2);};
    sock.onerror=()=>{if(sock===ws)setNet(false);};
    sock.onmessage=async ev=>{if(sock!==ws)return;let m;try{m=JSON.parse(ev.data);await onMsg(m);}catch(e){toast(A.L('对战消息处理失败，请重新连接','Game message failed; reconnect'));}};
  }
  function setNet(ok){const el=document.querySelector('.network');if(el){el.classList.toggle('offline',!ok);el.textContent=ok?A.L('Anubis · 对战已连接','Anubis · Game connected'):A.L('Anubis · 对战未连接','Anubis · Game disconnected');}}
  function wsend(o){if(!ws||ws.readyState!==1)return false;try{ws.send(JSON.stringify(o));return true;}catch(e){return false;}}
  // ---- 多池切换(LGNS/DAI)+档位筛选条,按当前池动态生成 ----
  function poolBtns(activeCls){ return Object.values(TOKENS).map(t=>'<button class="'+(curToken===t.key?activeCls:'')+'" data-pool="'+t.key+'">'+t.label+A.L(' 池',' Pool')+'</button>').join(''); }
  function tierBtns(attr,activeCls){ return '<button class="'+(filter==='all'?activeCls:'')+'" '+attr+'="all">'+A.L('全部','All')+'</button>'+TIERS.map(n=>'<button class="'+(String(filter)===String(n)?activeCls:'')+'" '+attr+'="'+n+'">'+n+' '+SYM+'</button>').join(''); }
  function renderLobbyBars(){ const ps=$('poolSwitch'); if(ps)ps.innerHTML=poolBtns('selected'); const mps=$('mPoolSwitch'); if(mps)mps.innerHTML=poolBtns('active'); const f=$('filters'); if(f)f.innerHTML=tierBtns('data-filter','selected'); const mf=$('mFilters'); if(mf)mf.innerHTML=tierBtns('data-mfilter','active'); }
  function validHandId(id){if(!/^\d{1,78}$/.test(String(id))||BigInt(id)>=2n**256n)throw new Error(A.L('房间数据无效，请重新查询','Invalid room data; refresh'));return String(id);}
  function tableData(r){if(!r||!/^\d+$/.test(String(r.ante)))throw new Error(A.L('牌桌金额无效','Invalid table amount'));const n=Number(r.nPlayers||0),mx=Number(r.maxPlayers);if(!Number.isInteger(n)||!Number.isInteger(mx)||n<0||mx<2||mx>6||n>mx)throw new Error(A.L('牌桌人数无效','Invalid table size'));return Object.assign({},r,{handId:validHandId(r.handId),nPlayers:n,maxPlayers:mx});}
  function setPool(key){
    if(!TOKENS[key]||key===curToken)return;
    if(authInProgress||claimBusy||pending||joining||createBusy){toast(A.L('请等待当前操作确认后再切换币种池','Wait for the current action before switching pools'));return;}
    curToken=key; try{localStorage.setItem('ap_token',key);}catch(e){} applyToken();
    filter='all';
    authed=false; delegate=null; authorized=false; authInProgress=false;
    myBalStr='—';myClaimStr='—';myClaimPos=false;myBalNum=0;balFetched=false;roomsLoaded=false;
    try{ if(ws){ ws.onclose=null; ws.close(); } }catch(e){}   // 断开旧池,避免旧连接自动重连
    renderLobbyBars();
    backToLobby(true);          // 回大厅并清当前对局态(内部会 setView lobby)
    renderRooms([]);            // 先清空旧池房间列表,等新池 authed 后重列
    if(myAddr)connectWS();                // 连新池:challenge→签名→authed→自动 listTables+余额
    if($('modal').open)showWallet();
    toast('已切到 '+SYM+' 池');
  }
  async function onMsg(m){
    if(m.t==='challenge'){
      let tok=null; try{ tok=localStorage.getItem(A.scope('session-'+curToken,myAddr)); }catch(e){}
      if(tok && !_triedToken){ _triedToken=true; wsend({t:'auth',token:tok}); return; } // 有令牌先免签登录,失败后端会重发challenge再签
      if(!allowLoginSignature){toast(A.L('会话已失效，请点击连接对战服务','Session expired; connect to the game service'));return;}allowLoginSignature=false;if(typeof m.nonce!=='string'||m.nonce.length>2048)throw new Error('Invalid login challenge');const a=myAddr,sock=ws,op=curToken;const sig=await window.ethereum.request({method:'personal_sign',params:[m.nonce,a]});if(await A.account()!==a||sock!==ws||op!==curToken)throw new Error('Wallet or connection changed');wsend({t:'auth',addr:a,sig});
    }
    else if(m.t==='authed'){if(!m.delegate||m.delegate.toLowerCase()!==TOKENS[curToken].delegate.toLowerCase()){authed=false;authorized=false;toast(A.L('代发地址校验失败，请停止操作并联系维护','Delegate verification failed; stop and contact support'));return;}authed=true;setNet(true);reconnectDelay=1000;delegate=m.delegate; myNick=m.nick||''; myNickRem=Number.isInteger(m.nickRemaining)?Math.max(0,Math.min(3,m.nickRemaining)):3; if(m.token){try{localStorage.setItem(A.scope('session-'+curToken,myAddr),m.token);}catch(e){}} if(m.avatar&&myAddr)avatarCache[myAddr.toLowerCase()]=m.avatar; wsend({t:'listTables'}); checkAuth(); if(curHand)wsend({t:'subscribe',handId:curHand}); if(window._pendingResume){ const _r=window._pendingResume; window._pendingResume=null; setTimeout(()=>joinRoom(_r),120); } } // 不再连上就自动授权;真要玩(准备/建桌/继续)时才按需授权
    else if(m.t==='avatars'){ const mp=m.map||{}; Object.keys(mp).forEach(a=>{ avatarCache[a.toLowerCase()]=mp[a]; }); if(state&&view==='table')render(); }
    else if(m.t==='avatarUpdate'){ const a=String(m.addr||'').toLowerCase(); if(a){ if(m.avatar)avatarCache[a]=m.avatar; else delete avatarCache[a]; } if(state&&view==='table')render(); if($('modal').open&&isMe(m.addr))showWallet(); }
    else if(m.t==='avatarSet'){ clearTimeout(window._avT); window._avT=null; if(pendingAvatar&&myAddr)avatarCache[myAddr.toLowerCase()]=pendingAvatar; pendingAvatar=null; toast('✅ 头像保存成功'); if($('modal').open)showWallet(); if(state&&view==='table')render(); }
    else if(m.t==='nickname'){ clearTimeout(window._nickTimer); window._nickTimer=null; myNick=m.name; myNickRem=Number.isInteger(m.remaining)?Math.max(0,Math.min(3,m.remaining)):0; toast('✅ 昵称已保存为「'+m.name+'」'+(m.remaining!=null?'，本月还可改 '+m.remaining+' 次':'')); if($('modal').open)showWallet(); if(state)render(); }
    else if(m.t==='tables'){if(!Array.isArray(m.tables))throw new Error('Invalid table list');const tables=m.tables.map(tableData);roomsLoaded=true;renderRooms(tables);toast(A.L('牌桌列表已更新','Table list updated'));}
    else if(m.t==='tableCreated'){validHandId(m.handId);createBusy=false;clearTimeout(createTimer);curHand=String(m.handId); myCards=null; myLookedLocal=false; pendingLook=false; prevPlayers=null; joining=false;
      wsend({t:'subscribe',handId:curHand}); toast(m.private?('🔒 私密牌桌已开！房号 #'+m.handId+' —— 大厅看不到这桌，把房号发给朋友，他输房号才能进；你点「准备」交底注开始'):('✅ 开桌成功！房号 #'+m.handId+' —— 把这个号发给朋友，他输房号进同一桌；你点「准备」交底注开始')); // 进桌旁观,点准备才交底注
      state={handId:String(m.handId),phase:1,ante:toBase(newAnte).toString(),maxPlayers:newCount,nPlayers:0,nActive:0,pot:'0',curBet:'0',turn:0,turnAddr:ZERO,cmpChallenger:ZERO,cmpOpp:ZERO,players:[],actionDeadline:0};
      enterTable(); try{ render(); }catch(e){} }
    else if(m.t==='joined'){ logAct('你已入座'); }
    else if(m.t==='left'){refreshBalances();toast(A.L('已退座，请到资产与退款查看可领资金','Seat left; check Assets & refunds for withdrawals')); backToLobby(true); }
    else if(m.t==='handState'){ if(String(m.handId)===String(curHand)){ onState(m); rememberHand(m); } }
    else if(m.t==='yourCards'){ if(String(m.handId)===String(curHand)){ myCards=m.cards; render(); } }
    else if(m.t==='result'){ if(String(m.handId)===String(curHand)){ showResult(m); clearActiveHand(m.handId); try{localStorage.removeItem(A.scope('look-'+m.handId,myAddr,CONTRACT));}catch(e){} } }
    else if(m.t==='compareReveal'){ showCompareReveal(m); }
    else if(m.t==='rematched'){ curHand=String(m.handId); myCards=null; myLookedLocal=false; pendingLook=false; state=null; prevPlayers=null; picking=false; closeModal(); wsend({t:'subscribe',handId:curHand}); message('新一局开始'); }
    else if(m.t==='refunded'){ if(String(m.handId)===String(curHand)){refreshBalances();toast(A.L('本局已退款，请核对钱包和可领资金','Refund reported; verify wallet and withdrawable balance'));} }
    else if(m.t==='error'){ pending=false; joining=false;createBusy=false;clearTimeout(createTimer); clearTimeout(window._pt); clearTimeout(window._jt); clearTimeout(window._nickTimer); window._nickTimer=null; clearTimeout(window._avT); window._avT=null; toast('❌ '+m.msg);if(curHand)wsend({t:'subscribe',handId:curHand});if(state)render(); }
  }

  function onState(m){
    pending=false; clearTimeout(window._pt); // 新状态到达,解除"处理中"
    if(joining && m.players.some(p=>isMe(p.addr))){ joining=false; clearTimeout(window._jt); } // 真座位已上链,撤销乐观占位
    // 事件推断(弃牌/看牌),让"牌局动态"真实
    if(prevPlayers){
      m.players.forEach(p=>{
        const old=prevPlayers.find(x=>x.addr.toLowerCase()===p.addr.toLowerCase());
        if(old){ if(!old.folded&&p.folded) logAct((isMe(p.addr)?'你':short(p.addr))+' 弃牌');
                 else if(!old.looked&&p.looked) logAct((isMe(p.addr)?'你':short(p.addr))+' 看牌'); }
      });
    }
    prevPlayers=m.players;
    const newHandBetting = (m.phase===2 && lastDealtHand!==String(m.handId));
    state=m; if(m.pot!=='0')lastPot=m.pot;
    { const _me=m.players.find(p=>isMe(p.addr)); if(_me&&_me.looked){ myLookedLocal=true; pendingLook=false; try{localStorage.setItem(A.scope('look-'+m.handId,myAddr,CONTRACT),'1');}catch(e){} } } // 链上已看牌→UI保持已看牌且不重复计费
    // 首局自动发牌:人齐且仍 OPEN,由首座玩家触发一次(后端去重)
    if(m.phase===1 && m.nPlayers>=2 && !startedHands.has(String(m.handId))){
      const first=m.players[0];
      if(first && isMe(first.addr)){ startedHands.add(String(m.handId)); setTimeout(()=>wsend({t:'startDeal',handId:m.handId}),1500); } // 兜底:后端一般已秒发
    }
    if(newHandBetting){ lastDealtHand=String(m.handId); logAct('第 '+m.handId+' 局开始'); }
    try{ render(); }catch(e){ try{console.error('[render错误]',e);}catch(_){} } // 渲染异常不卡死消息循环,错误打到控制台便于定位
    if(newHandBetting) setTimeout(animateDeal,60);
  }
  const isMe=a=>myAddr&&a&&a.toLowerCase()===myAddr.toLowerCase();
  const meIdx=()=>state?state.players.findIndex(p=>isMe(p.addr)):-1;
  function nameOf(addr){ if(isMe(addr))return myNick||'你'; const p=state&&state.players&&state.players.find(x=>x.addr.toLowerCase()===String(addr).toLowerCase()); return (p&&p.nick)||short(addr); }

  // ---------- 渲染 ----------

  const gtOppSeat={0:[],1:[1],2:[2,3],3:[1,2,3],4:[2,3,4,5],5:[1,2,3,4,5]};
  function render(){
    if(!state)return;
    const phase=state.phase, mi=meIdx(), comparing=nz(state.cmpOpp);
    const ante=e9(state.ante), curBet=e9(state.curBet), pot=e9(state.pot);
    const me=mi>=0?state.players[mi]:null;
    const looked=me&&(me.looked||myLookedLocal);
    const cost=looked?curBet*2:curBet;
    const ended=phase>=3;
    $('jtRoomName').textContent='牌桌 #'+state.handId;
    $('jtRoomSub').textContent=fmt(ante)+' '+SYM+' 底注 · '+state.nPlayers+'/'+state.maxPlayers+' 人';
    const PH={1:'等待入座',2:'对局进行中',3:'摊牌结算',4:'本局结束',5:'已退款'};
    $('jtPill').textContent=PH[phase]||'';
    $('jtPot').textContent=fmt(pot);
    { const u=$('jtPotUnit'); if(u)u.textContent=SYM; const bu=$('jtBalUnit'); if(bu)bu.textContent=SYM; const df=$('jtDockFoot'); if(df)df.textContent=A.L('押真 ','Stake ')+SYM+A.L(' · 结算后核对到账',' · Verify payment after settlement'); }
    $('jtBet').textContent='当前单注 '+fmt(curBet)+' '+SYM;
    $('jtMeName').textContent=(myNick||'我');
    $('jtOwnStack').textContent=fmt(me?e9(me.contributed):0);
    $('jtBal').textContent=myBalStr;
    renderGtSeats(phase,comparing,ended);
    const showFace=(myCards&&me&&(me.looked||myLookedLocal))||(ended&&myCards&&me);
    renderGtHand(me,showFace);
    if(me&&myCards&&showFace){ const rk=rankHand(myCards.map(conv)); $('jtHandStatus').textContent=rk.label+' · '+(ended?'揭晓':'已看牌'); }
    else { $('jtHandStatus').textContent=joining?'入座中…':(me?'未看牌':'观战中'); }
    renderGtActions(phase,mi,me,looked,cost,ended,comparing);
  }
  // 翡翠金牌面(可翻转):card={value,suit} 或 null(未知=显示牌背)
  function jtCard(card,revealed){
    const r=card?(({11:'J',12:'Q',13:'K',14:'A'})[card.value]||card.value):'';
    const red=card&&(card.suit==='♥'||card.suit==='♦');
    const front=card?'<span class="card-front '+(red?'red':'')+'"><span class="rank">'+r+'<small>'+card.suit+'</small></span><span class="center-suit">'+card.suit+'</span><span class="rank bottom">'+r+'<small>'+card.suit+'</small></span></span>':'<span class="card-front"></span>';
    return '<span class="card '+(revealed&&card?'revealed':'')+'" aria-hidden="true"><span class="card-inner"><span class="card-back"><img class="card-logo" src="logo.webp" alt=""><span class="card-label">ANUBIS PLAY</span></span>'+front+'</span></span>';
  }
  let gtSeatEls=[];
  const seatLetter=p=>esc(p.nick?[...p.nick][0]:p.addr.slice(2,3).toUpperCase());
  // 节点复用:座位骨架只建一次,之后只改变化的文字/样式,头像与牌背不重挂→对手动作时不闪
  function renderGtSeats(phase,comparing,ended){
    const cont=$('jtSeats'); if(!cont)return;
    const opps=state.players.filter(p=>!isMe(p.addr)).slice(0,5);
    const slots=gtOppSeat[Math.min(5,opps.length)]||[];
    let winAddr=null; if(ended){ let best=-1; (window._reveal||[]).forEach(r=>{ if(!r.folded){const s=score(r.cards); if(s>best){best=s;winAddr=r.addr;}} }); }
    if(cont._n!==opps.length || cont.children.length!==opps.length){ // 座位数变了(或被清空)才重建骨架
      cont._n=opps.length; cont.innerHTML=''; gtSeatEls=[];
      for(let k=0;k<opps.length;k++){
        const seat=document.createElement('div');
        const ident=document.createElement('div'); ident.className='identity';
        const avEl=document.createElement('div'); avEl.className='avatar';
        const info=document.createElement('div'); info.className='seat-info';
        const nameEl=document.createElement('div'); nameEl.className='seat-name';
        const balEl=document.createElement('div'); balEl.className='seat-balance';
        info.appendChild(nameEl); info.appendChild(balEl);
        ident.appendChild(avEl); ident.appendChild(info);
        const miniBox=document.createElement('div'); miniBox.className='mini-hand';
        const statusEl=document.createElement('span'); statusEl.className='seat-status';
        seat.appendChild(ident); seat.appendChild(miniBox); seat.appendChild(statusEl);
        cont.appendChild(seat);
        gtSeatEls.push({seat,avEl,nameEl,balEl,miniBox,statusEl,_av:null,_mini:null,_cls:null,_nm:null,_bal:null,_st:null});
      }
    }
    opps.forEach((p,k)=>{
      const E=gtSeatEls[k]; if(!E)return;
      const slot=slots[k]||1;
      const isTurn=phase===2&&!comparing&&state.turnAddr&&state.turnAddr.toLowerCase()===p.addr.toLowerCase();
      const inCmp=comparing&&(p.addr.toLowerCase()===state.cmpChallenger.toLowerCase()||p.addr.toLowerCase()===state.cmpOpp.toLowerCase());
      const win=ended&&winAddr&&winAddr.toLowerCase()===p.addr.toLowerCase();
      let st='闷牌'; if(p.folded)st='已弃牌'; else if(inCmp)st='⚔ 比牌'; else if(isTurn)st='行动中'; else if(p.looked)st='已看牌';
      const cls='seat jt-s'+slot+(p.folded?' folded':'')+(isTurn?' playing':'');
      if(E._cls!==cls){ E._cls=cls; E.seat.className=cls; }
      const av=avatarCache[p.addr.toLowerCase()];
      const avKey='l'+seatLetter(p); // 头像已取消,座位统一字母头像
      if(E._av!==avKey){ E._av=avKey; E.avEl.innerHTML=seatLetter(p); }
      const nm=(p.nick||short(p.addr))+(win?' 🏆':'');
      if(E._nm!==nm){ E._nm=nm; E.nameEl.textContent=nm; E.seat.setAttribute('aria-label',nm+'，'+st); }
      const bal='投入 '+fmt(e9(p.contributed));
      if(E._bal!==bal){ E._bal=bal; E.balEl.textContent=bal; }
      if(E._st!==st){ E._st=st; E.statusEl.textContent=st; E.seat.setAttribute('aria-label',nm+'，'+st); }
      let rev=null; if(ended){ const r=(window._reveal||[]).find(x=>x.addr.toLowerCase()===p.addr.toLowerCase()); if(r&&!r.folded)rev=r.cards.map(conv); }
      const foldedBack = !!p.folded && !rev;                                  // 对手弃牌且没亮牌=盖红叉的牌背
      const miniKey=rev?('r'+rev.map(c=>c.value+c.suit).join('')):(foldedBack?'fold':'back');
      if(E._mini!==miniKey){ E._mini=miniKey; E.miniBox.innerHTML=[0,1,2].map(i=>jtCard(rev?rev[i]:null,!!rev)).join(''); }
      E.miniBox.classList.toggle('folded-x', foldedBack);                     // 弃牌:牌背上盖红色叉叉
    });
  }
  function renderGtHand(me,showFace){
    const c=$('jtCards'); if(!c)return;
    const html = !me ? '' : [0,1,2].map(i=>{ const cd=(showFace&&myCards)?conv(myCards[i]):null; return jtCard(cd,!!cd); }).join('');
    if(c._html===html)return; c._html=html; c.innerHTML=html; // 内容没变不重画,避免牌反复闪
  }
  function gtTick(){ const t=$('jtTimer'); if(!t||!state)return; if(state.phase===2 && !nz(state.cmpOpp) && state.actionDeadline){ const s=Math.max(0,state.actionDeadline-Math.floor(Date.now()/1000)); t.textContent=s+'s'; } else t.textContent='–'; } // 下注阶段一律显示当前该行动方(你或对手)的倒计时,干等也有数
  function renderGtActions(phase,mi,me,looked,cost,ended,comparing){
    const ready=$('jtReadyRow'), acts=$('jtActions'), endBox=$('jtEndBox');
    const anteV=fmt(e9(state.ante));
    if(endBox && phase<3) endBox.hidden=true;
    if(phase===1){
      acts.hidden=true; ready.hidden=false; $('jtTimer').textContent='–';
      if(joining){ $('jtReadyBtn').textContent='准备中…'; $('jtReadyBtn').disabled=true; $('jtTurnMain').textContent='准备中…'; $('jtTurnHint').textContent='正在上链交底注'; }
      else if(mi<0){ $('jtReadyBtn').textContent='准备（交底注 '+anteV+'）'; $('jtReadyBtn').disabled=!authed||!ws||ws.readyState!==1; $('jtTurnMain').textContent='进桌成功'; $('jtTurnHint').textContent='点准备交底注入座，人齐自动开局'; }
      else { const w=state.nPlayers<2; $('jtReadyBtn').textContent='✓ 已准备'; $('jtReadyBtn').disabled=true; $('jtTurnMain').textContent=w?'已准备':'人齐，马上开始'; $('jtTurnHint').textContent=w?'等其他玩家准备':'正在发牌…'; }
      return;
    }
    ready.hidden=true;
    if(ended){ acts.hidden=true; $('jtTurnMain').textContent=A.L('本局结果已生成','Result reported'); $('jtTurnHint').textContent='第 '+state.handId+' 局'; $('jtTimer').textContent='–'; return; }
    if(endBox)endBox.hidden=true;
    acts.hidden=false;
    $('jtCallAmt').textContent=fmt(cost)+' '+SYM;
    const myTurn=!comparing&&mi>=0&&state.turnAddr&&isMe(state.turnAddr)&&me&&!me.folded;
    gtTick();
    if(pending||!authed||!ws||ws.readyState!==1){ ['jtFold','jtPeek','jtRaise','jtCompare','jtCall','jtAllIn'].forEach(id=>{const b=$(id);if(b)b.disabled=true;}); $('jtTurnMain').textContent='处理中…'; return; }
    if(comparing){ $('jtTurnMain').textContent='比牌裁决中'; $('jtTurnHint').textContent='马上出结果'; }
    else if(myTurn){ $('jtTurnMain').textContent='轮到你行动'; $('jtTurnHint').textContent=(looked?'明牌':'暗牌')+'跟注 '+fmt(cost)+' '+SYM; }
    else if(mi<0){ $('jtTurnMain').textContent='观战中'; $('jtTurnHint').textContent='本局结束后点「继续下一局」即可加入'; }
    else if(me&&me.folded){ $('jtTurnMain').textContent='已弃牌'; $('jtTurnHint').textContent='等待本局结束'; }
    else { $('jtTurnMain').textContent='其他玩家行动中'; $('jtTurnHint').textContent='轮到 '+nameOf(state.turnAddr); }
    const dis=!myTurn||!balFetched;
    if(myTurn){ const now=Date.now(); if(now-_balT>1500){ _balT=now; refreshBalances().then(()=>{ if(state&&state.phase===2&&!pending)render(); }); } } // 轮到我:刷新余额判断够不够跟
    const poor = myTurn && balFetched && myBalNum < cost; // 筹码不够跟注
    const headsup = state.nActive===2;                    // 单挑(剩两人)
    const canAllIn = poor && headsup && myTurn;            // 单挑且付不起→可全下比牌
    $('jtFold').disabled=dis; $('jtPeek').disabled=dis||looked; $('jtPeekSmall').textContent=looked?'已看牌':'看牌';
    $('jtRaise').disabled=dis||poor; $('jtCompare').disabled=dis||state.nActive<2||poor; $('jtCall').disabled=dis||poor;
    { const ai=$('jtAllIn'); if(ai){ ai.hidden=!canAllIn; ai.disabled=!canAllIn; } } // 全下按钮:仅单挑付不起时亮
    if(poor){ $('jtTurnMain').textContent='筹码不足';
      $('jtTurnHint').textContent = headsup ? '付不起跟注——可「全下比牌」押上剩余跟对手比，谁大谁赢；或弃牌'
                                            : '余额 '+fmt(myBalNum)+' < 需跟 '+fmt(cost)+' '+SYM+'，扫码充值到账后继续，或弃牌'; }
    else if(picking&&myTurn){ $('jtTurnHint').textContent='点一个对手比牌，或再次点比牌取消'; }
    // 筹码不足且非单挑(无全下选项):弹收款码让玩家转入;单挑则显示全下按钮、不弹窗挡住按钮
    if(poor && !headsup){ if(!_topupSeen){ _topupSeen=true; showTopup(cost); } const tb=$('tuBal'); if(tb)tb.textContent=fmt(myBalNum); }
    else { if(_topupSeen && _topupOpen){ closeModal(); toast('✅ 余额已到账，继续出牌'); } _topupSeen=false; }
  }
  function animateDeal(){ playSound('card'); const c=$('jtCards'); if(c){ c.classList.remove('deal'); void c.offsetWidth; c.classList.add('deal'); } }

  function showResult(m){
    window._reveal=m.reveal||[];
    let best=-1,winAddr=null;
    (m.reveal||[]).forEach(r=>{ if(!r.folded){const sc=score(r.cards); if(sc>best){best=sc;winAddr=r.addr;}} });
    const pot=e9(lastPot), payout=pot*0.97; // 仅用于规则估算，不能代表已到账
    const iWon=winAddr&&isMe(winAddr);
    const meRev=(m.reveal||[]).find(r=>isMe(r.addr)); if(meRev)myCards=meRev.cards; // 没看牌也在摊牌亮出我的牌
    state=Object.assign({},state,{phase:4});
    render();
    var anteV=state?fmt(e9(state.ante)):'';
    const box=$('jtEndBox');
    if(box){ box.hidden=false; $('jtEndTitle').textContent=iWon?'✦ 你赢了':(winAddr?nameOf(winAddr)+' 获胜':'本局结束'); $('jtEndText').textContent=(winAddr?'底池 '+fmt(pot)+' '+SYM+'，赢家拿 '+fmt(payout):'本局结束')+A.L(' · 预计金额，到账以链上结算为准',' · Estimate; verify on-chain settlement')+(anteV?'｜继续需再交底注 '+anteV+' '+SYM:''); }
    if(iWon)playSound('win');
    message(iWon?'好牌！你赢得了本局':'本局已结束');
    // 记录(本地,真实观测):详细版
    const me=(m.reveal||[]).find(r=>isMe(r.addr));
    const myP=state.players&&state.players.find(p=>isMe(p.addr));
    const myContrib=myP?e9(myP.contributed):0;
    const net=iWon?(payout-myContrib):-myContrib;              // 这局净输赢(正=赢,负=输)
    const winRev=winAddr?(m.reveal||[]).find(r=>r.addr&&r.addr.toLowerCase()===winAddr.toLowerCase()):null;
    const cardStrs=cs=>(cs&&cs.length)?cs.map(c=>{const d=conv(c);const rk=({11:'J',12:'Q',13:'K',14:'A'})[d.value]||d.value;return rk+d.suit;}):[];
    const foes=(m.reveal||[]).filter(r=>!isMe(r.addr)).map(r=>({
      name:(nameOf(r.addr)||short(r.addr)), cards:cardStrs(r.cards),
      label:r.folded?'弃牌':((r.cards&&r.cards.length)?rankHand(r.cards.map(conv)).label:'-'),
      folded:!!r.folded, win:(winAddr&&r.addr.toLowerCase()===winAddr.toLowerCase())
    }));
    results.unshift({
      sym:SYM,contract:CONTRACT.toLowerCase(),address:myAddr.toLowerCase(),chainId:ANUBIS.id,estimated:true,status:'result-reported',
      hand:state.handId, time:new Date().toLocaleString('zh-CN'),
      ante:fmt(e9(state.ante)), players:((m.reveal||[]).length||state.nPlayers||0),
      win:iWon, net:net, cost:myContrib,
      myCards:me?cardStrs(me.cards):[], label:me?rankHand(me.cards.map(conv)).label:'-',
      foes:foes,
      winner:iWon?'你':(winAddr?(nameOf(winAddr)||short(winAddr)):'-'),
      winnerLabel:(winRev&&!winRev.folded)?rankHand(winRev.cards.map(conv)).label:'-',
      pot:fmt(pot)
    });
    results=results.slice(0,50); saveResults();
    logAct((iWon?'你赢得':short(winAddr)+' 赢得')+'底池 '+fmt(pot)+' '+SYM);
    refreshBalances();
  }

  // ---------- 大厅 ----------
  function renderRooms(tables){
    window._rooms=tables||window._rooms||[];
    if(view!=='lobby')return;
    const list=(window._rooms||[]).filter(r=>filter==='all'||String(e9(r.ante))===String(filter));
    renderMRooms(list); // 手机端大厅房间
    const grid=$('roomGrid');
    if(!authed||!roomsLoaded){const text=!myAddr?A.L('连接钱包后查询牌桌','Connect your wallet to query tables'):!authed?A.L('请连接对战服务后查询牌桌','Connect to the game service to query tables'):A.L('正在读取牌桌…','Loading tables…');grid.innerHTML='<div class="room-empty">'+text+'</div>';if($('mRooms'))$('mRooms').innerHTML='<div class="m-empty">'+text+'</div>';return;}
    if(!list.length){ grid.innerHTML='<div class="room-empty" style="opacity:.7;padding:24px;text-align:center">暂无牌桌，点「创建我的牌桌」开一桌，或等别人开。</div>'; return; }
    grid.innerHTML=list.map(r=>{
      const ante=fmt(e9(r.ante)), n=r.nPlayers||0, full=n>=r.maxPlayers;
      const name=tierName(e9(r.ante))+'场 · '+String(r.handId).padStart(2,'0');
      return `<article class="room-card"><div class="room-card-head"><span>${esc(name)}</span><span class="room-pill ${full?'busy':''}">${full?'已满':'等待加入'}</span></div><div class="room-ante"><strong>${ante}</strong><span>${SYM}</span></div><div class="room-caption">底注 / 每人每局</div><div class="room-divider"></div><div class="room-bottom"><div class="room-players">${icon('users')}${n} / ${r.maxPlayers} 已入座</div><button class="join-button" data-join="${r.handId}" ${full?'disabled':''}>${full?'本桌已满':'加入牌桌'}</button></div><div class="room-sub">真人对战 · ${r.maxPlayers} 人桌 · 押真 ${SYM}</div></article>`;
    }).join('');
  }
  function mFaces(n,mx){ const suits=['♠','♦','♣','♥']; let s=''; const show=Math.min(mx,4); for(let i=0;i<show;i++){ s+= i<n? '<i>'+suits[i]+'</i>' : '<i class="empty">+</i>'; } return s; }
  function renderMRooms(list){
    const box=$('mRooms'); if(!box)return;
    if(!list.length){ box.innerHTML='<div class="m-empty">暂无同档位牌桌。点上面「创建我的牌桌」开一桌，或等别人开。</div>'; return; }
    box.innerHTML=list.map((r,i)=>{
      const ante=fmt(e9(r.ante)), n=r.nPlayers||0, mx=r.maxPlayers, full=n>=mx, av=e9(r.ante), id=r.handId;
      const name=tierName(av)+'场';
      if(i===0 && filter==='all'){
        return '<div class="m-featured"><div class="m-rowflex"><span class="m-fav">✦ 人气推荐</span><span style="font-size:10px;color:#a6c8a8">● '+(full?'已满':'等待加入')+'</span></div><div class="m-rowflex" style="margin-top:1px"><div><h4>'+esc(name)+' <span style="color:#92aa95;font-size:12px;font-weight:400">#'+esc(String(id))+'</span></h4><p class="fp">'+mx+' 人桌 · 押真 '+SYM+'</p></div><div class="m-fprice"><strong>'+ante+'</strong><small>'+SYM+'</small></div></div><div class="m-featbottom"><div class="m-bubble"><div class="m-faces">'+mFaces(n,mx)+'</div><span>'+n+'/'+mx+' 已入座</span></div><button class="m-joinbtn" data-join="'+id+'" '+(full?'disabled':'')+'>'+(full?'已满':'加入牌桌 →')+'</button></div></div>';
      }
      const mark=tierMark(av), mcls=tierCls(av);
      const dots=Array.from({length:mx},(_,j)=>'<b class="'+(j<n?'on':'')+'"></b>').join('');
      return '<article class="m-room"><div class="m-rmark '+mcls+'">'+mark+'</div><div><h4>'+esc(name)+' <span style="font-size:12px;color:#637e69">#'+esc(String(id))+'</span>'+(!full?'<i>● 有空位</i>':'')+'</h4><p>'+mx+' 人桌 · '+(full?'已满':'等待入座')+'</p><div class="m-miniseats"><span class="m-dots">'+dots+'</span>'+n+' / '+mx+' 人</div></div><div class="m-side"><strong>'+ante+'</strong><small>'+SYM+' 底注</small><button data-join="'+id+'" '+(full?'disabled':'')+'>'+(full?'已满':'加入 →')+'</button></div></article>';
    }).join('');
  }
  function syncFilters(){
    document.querySelectorAll('[data-filter]').forEach(el=>{const s=el.dataset.filter===filter;el.classList.toggle('selected',s);el.setAttribute('aria-pressed',String(s));});
    document.querySelectorAll('[data-mfilter]').forEach(el=>el.classList.toggle('active',el.dataset.mfilter===filter));
  }
  function enterTable(){ setView('table'); }
  function backToLobby(skipLeave){
    if(curHand && !skipLeave){
      if(state&&state.phase===1&&meIdx()>=0){ wsend({t:'leaveTable',handId:curHand}); clearActiveHand(curHand); } // 开局前退座退款(已退座无需回到对局)
      wsend({t:'unsubscribe',handId:curHand});
    }
    curHand=null; state=null; myCards=null; myLookedLocal=false; pendingLook=false; prevPlayers=null; picking=false; joining=false; clearTimeout(window._jt);
    setView('lobby'); if(authed)wsend({t:'listTables'}); refreshBalances();
  }
  async function joinRoom(id){
    if(!authed){if(!await connect())return;}
    curHand=String(id); myCards=null; try{myLookedLocal=localStorage.getItem(A.scope('look-'+id,myAddr,CONTRACT))==='1';}catch(e){myLookedLocal=false;} pendingLook=myLookedLocal; prevPlayers=null; joining=false; // 恢复"已看牌"状态(onState据链上looked再校正pendingLook)
    pending=false; picking=false; _topupSeen=false; clearTimeout(window._pt); clearTimeout(window._jt); try{closeModal();}catch(e){} // 重进对局清残留"处理中"/选牌/弹窗,防看着像卡死
    wsend({t:'subscribe',handId:id}); // 先进桌旁观,点「准备」才交底注入座
    const room=(window._rooms||[]).find(r=>String(r.handId)===String(id));
    state={handId:String(id),phase:1,ante:room?room.ante:'0',maxPlayers:room?Number(room.maxPlayers):6,nPlayers:room?Number(room.nPlayers):0,nActive:0,pot:'0',curBet:'0',turn:0,turnAddr:ZERO,cmpChallenger:ZERO,cmpOpp:ZERO,players:[],actionDeadline:0};
    enterTable(); try{ render(); }catch(e){}
  }
  async function doReady(){ // 准备=交底注入座
    if(!curHand)return;
    if(!authed){if(!await connect())return;}
    await A.requireReferral(myAddr);await checkAuth();
    if(!authorized){await doAuthorize();return;} // 首次自动授权一次
    if(joining)return;joining=true;
    if(!wsend({t:'joinTable',handId:curHand})){joining=false;throw new Error(A.L('连接已断开，请重试','Disconnected; retry'));} toast('准备中，交底注入座…');
    try{ render(); }catch(e){}
    clearTimeout(window._jt); window._jt=setTimeout(()=>{if(joining){toast(A.L('入座确认较慢，正在重新查询，请勿重复准备','Seat confirmation is slow; resynchronizing. Do not prepare again.'));wsend({t:'subscribe',handId:curHand});}},12000);
  }
  async function doCreate(){
    if(createBusy){toast(A.L('开桌待确认，请先刷新查询','Table creation pending; refresh the list first'));return;}createBusy=true;let submitted=false;const op=curToken,anteValue=newAnte,count=newCount,isPrivate=newPrivate;
    try{
    if(!authed){if(!await connect())return;}
    await A.requireReferral(myAddr);await checkAuth();
    if(!authorized){ closeModal(); await doAuthorize(); if(!authorized)return; }
    if(op!==curToken)throw new Error(A.L('币种池已改变，请重新确认','Pool changed; confirm again'));
    const ante=toBase(anteValue).toString();
    if(!wsend({t:'createTable',ante,maxPlayers:count,private:isPrivate}))throw new Error(A.L('连接已断开，请重试','Disconnected; retry'));submitted=true;closeModal();toast(A.L('开桌中…','Creating table…'));
    createTimer=setTimeout(()=>{if(createBusy){createBusy=false;toast(A.L('开桌结果未确认，请先刷新牌桌列表核对','Table creation unconfirmed; refresh the list to check first'));wsend({t:'listTables'});}},20000);
    }finally{if(!submitted)createBusy=false;}
  }

  // ---------- 行动 ----------
  function act(action,extra){if(!authed||!ws||ws.readyState!==1||pending){toast(A.L('连接未就绪或上一操作待确认，请重试','Connection not ready or an action is pending'));return false;}return wsend(Object.assign({t:'act',handId:curHand,action},extra||{}));}
  function setPending(txt){ pending=true; cdActive=false; ['jtFold','jtPeek','jtRaise','jtCompare','jtCall','jtAllIn'].forEach(id=>{const b=$(id);if(b)b.disabled=true;}); const h=$('jtTurnMain'); if(h)h.textContent=txt||'⏳ 处理中…'; clearTimeout(window._pt); window._pt=setTimeout(()=>{ if(pending){toast(A.L('确认较慢，正在重新查询对局','Confirmation is slow; resynchronizing'));if(curHand)wsend({t:'subscribe',handId:curHand});render();} },7000); }
  // 行动先等待服务确认，不在本地提前增加底池或扣筹码。
  function doFold(){ const wl=pendingLook; if(!act('fold',{withLook:wl}))return; logAct(A.L('已请求弃牌','Fold requested')); setPending(A.L('弃牌待确认','Fold pending')); render(); }
  function doPeek(){ // 看牌=纯本地翻牌(牌已在本地),不单独上链;看完按钮仍可点,look与下一步动作打包上链
    if(myLookedLocal)return;
    if(!myCards){ if(!act('look'))return;setPending('看牌中…'); return; } // 兜底:牌还没到,走独立look
    myLookedLocal=true; pendingLook=true; try{localStorage.setItem(A.scope('look-'+curHand,myAddr,CONTRACT),'1');}catch(e){} playSound('card'); render(); // 记住"已看牌",返回再进不丢
  }
  function doCall(){ const wl=pendingLook; if(!act('call',{withLook:wl}))return; playSound(); logAct(A.L('已请求跟注','Call requested')); setPending(A.L('跟注待确认','Call pending')); render(); }
  function doRaise(){ const wl=pendingLook; if(!act('raise',{withLook:wl}))return; playSound(); logAct(A.L('已请求加注','Raise requested')); setPending(A.L('加注待确认','Raise pending')); render(); }
  function startCompare(){ if(!state||state.nActive<2){toast('暂无可比牌的对手');return;} picking=!picking; if(picking){openCompare();} render(); }
  function doAllIn(){ if(!state||state.nActive!==2){toast('只有单挑(剩两人)才能全下比牌');return;} const wl=pendingLook; picking=false; if(!act('allin',{withLook:wl}))return; playSound(); logAct('你 全下比牌'); setPending('全下比牌中…'); render(); }
  function doCompare(addr){ const wl=pendingLook; picking=false; if(!act('compare',{target:addr,withLook:wl}))return;setPending('比牌中…'); logAct('你 比牌'); closeModal(); }
  async function doClaim(){if(!myAddr||claimBusy)return;claimBusy=true;try{await refreshBalances();if(!myClaimPos)throw new Error(A.L('暂无已确认的可领资金','No confirmed withdrawable balance'));toast(A.L('请确认领取交易','Confirm withdrawal'));await sendTx(SEL.withdraw);toast(A.L('领取交易已确认','Withdrawal confirmed'));await refreshBalances();showWallet();}catch(e){toast(e.message);}finally{claimBusy=false;if($('mwClaimBtn'))$('mwClaimBtn').disabled=!myClaimPos;}}
  // 头像:选图→画布裁成方形小图(100px/JPEG)压到30KB内→上链前发后端存,同桌可见
  function handleAvatarFile(file){
    if(!file)return;
    if(!/^image\//.test(file.type)){ toast('请选择图片文件'); return; }
    if(!authed){ toast('未连接对战服务，稍候重试'); return; }
    const rd=new FileReader();
    rd.onload=()=>{ const img=new Image(); img.onerror=()=>toast('图片读取失败，换一张试试'); img.onload=()=>{
      try{
        const S=100, c=document.createElement('canvas'); c.width=S; c.height=S; const ctx=c.getContext('2d');
        const side=Math.min(img.width,img.height), sx=(img.width-side)/2, sy=(img.height-side)/2;
        ctx.drawImage(img,sx,sy,side,side,0,0,S,S);
        let q=0.75, data=c.toDataURL('image/jpeg',q);
        while(data.length>30000 && q>0.3){ q-=0.12; data=c.toDataURL('image/jpeg',q); }
        if(data.length>30000){ toast('图片太大，请换一张更简单的图'); return; }
        pendingAvatar=data; // 选好即自动上传保存(无需点保存)
        if($('modal').open)showWallet();
        toast('头像上传中…'); wsend({t:'setAvatar',avatar:data}); clearTimeout(window._avT); window._avT=setTimeout(()=>{window._avT=null;toast('⚠ 上传超时，请检查网络后重试');},8000);
      }catch(e){ toast('处理图片出错，换一张试试'); }
    }; img.src=rd.result; };
    rd.onerror=()=>toast('读取文件失败');
    rd.readAsDataURL(file);
  }

  // ---------- 弹窗 ----------
  function openModal(title,html,eyebrow='ANUBIS PLAY'){ if(!$('modal').open)modalFocus=document.activeElement; $('modalTitle').textContent=title; $('modalEyebrow').textContent=eyebrow; $('modalBody').innerHTML=html; if(!$('modal').open)$('modal').showModal(); }
  function closeModal(){ if($('modal').open)$('modal').close(); }
  // 读指定代币余额(按其小数位),给「我的」里同时显示 LGNS + DAI
  async function fetchTokenBal(tokenAddr,dec){ try{ const b=await rcall(tokenAddr,SEL.bal+encA(myAddr)); return fmt(Number(BigInt('0x'+(b||'0')))/Math.pow(10,dec)); }catch(e){ return '—'; } }
  async function refreshWalletBalances(){ // 一次刷新全部币余额
    if(!myAddr)return;
    await Promise.all(Object.values(TOKENS).map(async t=>{
      const s=await fetchTokenBal(t.token,t.dec); walletBals[t.key]=s;
      const el=$('mw_bal_'+t.key); if(el)el.innerHTML=s+' <small>'+t.sym+'</small>';
    }));
  }
  // 画收款二维码(我的钱包地址);库没加载成功就退化成显示地址文字
  function renderQRInto(boxId){ try{ const box=$(boxId); if(!box||!myAddr)return; box.innerHTML=''; if(window.QRCode){ new window.QRCode(box,{text:myAddr,width:160,height:160,colorDark:'#0b0f0d',colorLight:'#ffffff',correctLevel:window.QRCode.CorrectLevel.M}); } else { box.innerHTML='<div style="color:#111;font-size:11px;word-break:break-all;padding:6px">'+esc(myAddr)+'</div>'; } }catch(e){} }
  function renderWalletQR(){ renderQRInto('mw_qr'); }
  // 对局中筹码不足:弹收款码,从别的钱包转入,到账(余额自动刷新)后自动继续
  function showTopup(cost){
    openModal('余额不足 · 扫码充值',
      `<div class="form-note" style="text-align:center;margin-bottom:10px">本局需 <b style="color:#e8c783">${fmt(cost)} ${SYM}</b>，你当前余额 <b id="tuBal">${fmt(myBalNum)}</b> ${SYM} 不够。<br>用<b>别的钱包</b>扫下面的码、或复制地址，把 ${SYM} 转进来，<b>到账后自动可继续出牌</b>。</div>
       <div class="wallet-row" style="flex-direction:column;align-items:center;gap:10px">
         <div id="tu_qr" style="width:180px;height:180px;background:#fff;border-radius:12px;padding:10px;box-sizing:border-box;display:flex;align-items:center;justify-content:center"></div>
         <div style="font-size:12px;color:#9fb3a6;word-break:break-all;text-align:center">${esc(myAddr)}</div>
         <button class="small-button" data-action="copy-addr">复制地址</button>
       </div>
       <div class="form-note" style="text-align:center;margin-top:8px;color:#e8c783">⏱ 请在本局倒计时内到账，超时会自动弃牌</div>
       <div style="display:flex;gap:8px;margin-top:12px">
         <button class="gold-button" style="flex:1" data-action="refresh-bal">↻ 刷新余额</button>
         <button class="small-button" data-action="fold-close">先弃牌</button>
       </div>`,'TOP UP');
    _topupOpen=true; renderQRInto('tu_qr');
  }
  function showWallet(){
    const connected=!!myAddr;
    const avatarSet=''; // 头像功能已取消,改回默认字母头像
    const nickSet=connected?`<label class="form-label">游戏昵称（最多 3 个字）</label>
       <div class="wallet-row"><input id="nickInput" type="text" maxlength="3" value="${esc(myNick)}" placeholder="未设置昵称" style="flex:1;min-width:0;background:#0f1519;border:1px solid var(--line,#ffffff22);border-radius:8px;padding:9px 11px;color:#eaf3ee;font-size:14px;margin-right:8px"><button class="small-button" data-action="save-nick">保存</button></div>
       <div class="form-note" style="margin-top:6px">本月还可改 ${myNickRem} 次（每月最多 3 次），昵称会显示给同桌玩家。</div>`:'';
    const soundSet=`<label class="form-label">声音设置</label>
       <div class="wallet-row"><span>背景音乐</span><button class="small-button" data-action="toggle-bgm">${bgmOn?'🔊 开':'🔇 关'}</button></div>
       <div class="wallet-row"><span>游戏音效</span><button class="small-button" data-action="toggle-sfx">${sound?'🔊 开':'🔇 关'}</button></div>`;
    const layoutSet=`<label class="form-label">牌桌布局</label>
       <div class="tier-options" role="group" aria-label="牌桌布局">${Object.keys(LAYOUTS).map(k=>`<button class="tier-button ${tableLayout===k?'selected':''}" data-tlayout="${k}" aria-pressed="${tableLayout===k}"><strong>${LAYOUTS[k].slice(0,2)}</strong><span>${LAYOUTS[k].slice(3)}</span></button>`).join('')}</div>`;
    openModal('我的', avatarSet + (connected?
      `<div class="wallet-info"><span>钱包地址</span><strong style="font-size:14px">${short(myAddr)}</strong></div>
       <button class="small-button" data-action="toggle-qr" style="width:100%;margin-top:6px;text-align:left">${qrOpen?'▾':'▸'} 收款码</button>
       <div id="mw_qrwrap" style="flex-direction:column;align-items:center;gap:10px;margin-top:8px;display:${qrOpen?'flex':'none'}">
         <div id="mw_qr" style="width:180px;height:180px;background:#fff;border-radius:12px;padding:10px;box-sizing:border-box;display:flex;align-items:center;justify-content:center"></div>
         <div id="mw_addr_full" style="font-size:12px;color:#9fb3a6;word-break:break-all;text-align:center">${esc(myAddr)}</div>
         <button class="small-button" data-action="copy-addr">复制地址</button>
         <div class="form-note" style="text-align:center">用别的钱包扫这个码（或复制地址），把 LGNS / DAI 转进来充值。地址在 Anubis 链两种币通用。</div>
       </div>
       <div class="ap-block"><div class="ap-row"><span>${A.L('本池合约可领资金','Withdrawable from this pool')}</span><strong id="mwClaim">${esc(myClaimStr)}</strong></div><button id="mwClaimBtn" class="gold-button" data-action="claim" ${!myClaimPos?'disabled':''}>${A.L('领取到钱包','Withdraw to wallet')}</button></div>
       ${!authed?'<button class="gold-button" data-action="connect">'+A.L('连接对战服务','Connect to game service')+'</button>':''}
       <a class="ap-button secondary" href="../account/">${A.L('全部资产、退款和记录','All assets, refunds & history')}</a><button class="small-button" data-action="revoke-allowance">${A.L('撤销本池代币额度','Revoke token allowance for this pool')}</button>
       <label class="form-label" style="display:flex;justify-content:space-between;align-items:center">我的余额<button class="small-button" data-action="refresh-bal" aria-label="刷新全部余额">↻ 刷新</button></label>
       ${Object.values(TOKENS).map(t=>`<div class="wallet-row"><span>${t.label}</span><strong id="mw_bal_${t.key}">${walletBals[t.key]||'—'} <small>${t.sym}</small></strong></div>`).join('')}`
      :`<div class="notice">连接 Anubis 链钱包后即可开桌、入座、押真 ${SYM} 对战。</div><button class="gold-button" data-action="connect">${icon('wallet')}连接钱包</button>`)
      + nickSet
      + layoutSet
      + soundSet,
      'MY ACCOUNT');
    if(connected){if(qrOpen)renderWalletQR();refreshWalletBalances();refreshBalances();}
  }
  function openCreate(){
    newAnte=TIERS[0];newCount=6;newPrivate=false;
    openModal('创建你的牌桌',
      `<label class="form-label">选择底注（${SYM} 池）</label><div class="tier-options" role="group" aria-label="选择底注">${TIERS.map(n=>`<button class="tier-button ${newAnte===n?'selected':''}" data-ante="${n}" aria-pressed="${newAnte===n}"><strong>${n}</strong><span>${SYM}</span></button>`).join('')}</div>
       <label class="form-label">牌桌人数（最多 6 人/局）</label><div class="tier-options" role="group" aria-label="牌桌人数">${[2,3,4,5,6].map(n=>`<button type="button" class="tier-button ${newCount===n?'selected':''}" data-seats="${n}" aria-pressed="${newCount===n}"><strong>${n}</strong><span>人</span></button>`).join('')}</div>
       <label class="form-label">牌桌类型</label><div class="tier-options" role="group" aria-label="牌桌类型">
         <button type="button" class="tier-button ${!newPrivate?'selected':''}" data-priv="0" aria-pressed="${!newPrivate}"><strong>公开</strong><span>大厅可见</span></button>
         <button type="button" class="tier-button ${newPrivate?'selected':''}" data-priv="1" aria-pressed="${newPrivate}"><strong>私密</strong><span>仅凭房号进</span></button>
       </div>
       <div class="form-note" id="privNote">${newPrivate?'私密牌桌不显示在大厅，只有拿到房号的人才能进。开桌后把房号发给朋友即可。':'开桌后各玩家先交一份底注入座，凑够 2 人自动发牌。押真 '+SYM+'。'}</div>
       <button class="gold-button" data-action="create-confirm">${icon('plus')}创建并进入牌桌</button>`,'CREATE A TABLE');
  }
  function openCompare(){
    if(!state)return;
    const opps=state.players.filter(p=>!isMe(p.addr)&&!p.folded);
    if(!opps.length){toast('暂无可比牌的对手');picking=false;return;}
    openModal('选择比牌对手',
      `<p>比牌支付你当前跟注额（看牌为 2 倍）。输的一方出局；牌力相同则发起方出局。</p>
       <div class="opponent-list">${opps.map(p=>`<button class="opponent-choice" data-compare="${p.addr}"><div class="avatar" aria-hidden="true">${esc(p.addr.slice(2,3).toUpperCase())}</div><span><strong>${short(p.addr)}</strong><small>${p.looked?'已看牌':'暗牌中'}</small></span></button>`).join('')}</div>`,'HEAD TO HEAD');
  }
  function showCompareReveal(m){
    const iAmCh=isMe(m.challenger.addr);
    const mine=iAmCh?m.challenger:m.opponent, theirs=iAmCh?m.opponent:m.challenger;
    const iLost=m.loser&&myAddr&&m.loser.toLowerCase()===myAddr.toLowerCase();
    const mh=rankHand(mine.cards.map(conv)).label, th=rankHand(theirs.cards.map(conv)).label;
    const chips=cards=>cards.map(c=>{const cd=conv(c);const r=({11:'J',12:'Q',13:'K',14:'A'})[cd.value]||cd.value;const red='♥♦'.includes(cd.suit);return '<span style="display:inline-block;width:38px;height:52px;border-radius:6px;background:#fffdf0;color:'+(red?'#b9383c':'#23292a')+';font-weight:800;line-height:52px;text-align:center;margin:0 3px;font-family:Georgia,serif;font-size:17px;box-shadow:0 3px 7px #0006">'+r+cd.suit+'</span>';}).join('');
    openModal('⚔ 比牌结果',
      '<div style="text-align:center">'+
      '<div style="font-size:12px;color:#9dac98">你 · '+esc(mh)+'</div><div style="margin:7px 0 2px">'+chips(mine.cards)+'</div>'+
      '<div style="font-size:19px;color:#e8c783;margin:12px 0;letter-spacing:3px">VS</div>'+
      '<div style="font-size:12px;color:#9dac98">'+esc(nameOf(theirs.addr))+' · '+esc(th)+'</div><div style="margin:7px 0 2px">'+chips(theirs.cards)+'</div>'+
      '<div style="font-size:18px;font-weight:800;margin-top:15px;color:'+(iLost?'#dd888a':'#65c59d')+'">'+(iLost?'你输了，本局出局':'你赢了！对手出局')+'</div></div>'+
      '<button class="gold-button" data-action="close" style="width:100%;margin-top:14px">知道了</button>','HEAD TO HEAD');
    clearTimeout(window._crt); window._crt=setTimeout(()=>{ if($('modal').open)closeModal(); },6000);
  }
  function showRules(){
    openModal('三张牌，一场对决。',
      `<p>每位玩家 3 张牌，可暗牌或看牌后行动。牌型从大到小：</p>
       <table class="rules-table"><thead><tr><th>牌型 · 从大到小</th><th>示例</th></tr></thead><tbody>
       <tr><td>01　豹子</td><td>A♠ A♥ A♣</td></tr><tr><td>02　同花顺</td><td>J♠ Q♠ K♠</td></tr><tr><td>03　同花</td><td>2♥ 7♥ K♥</td></tr><tr><td>04　顺子</td><td>7♠ 8♥ 9♣</td></tr><tr><td>05　对子</td><td>Q♠ Q♥ 8♣</td></tr><tr><td>06　单张</td><td>A♠ J♥ 8♣</td></tr></tbody></table>
       <ol class="rules-copy"><li>各交一份底注入座。暗牌按当前本注跟注，看牌后按 2 倍跟注。</li>
       <li>加注把本注往上提一档；按钮显示本次实际支付。</li>
       <li>轮到你可比牌：挑一个对手单挑，输的出局；牌力相同发起方出局。</li>
       <li>打到只剩 1 人或摊牌结算，赢家拿底池（扣 3% 手续费）。本局结束后可选择继续下一局。</li>
       <li>A23 为最小顺子；花色不分大小。</li></ol>
       <div class="rules-foot">牌序由合约种子 + 区块哈希决定，后端按权威结果发牌，每局种子上链公开可事后核验。押真 ${SYM}，理性参与。</div>`,'HOW TO PLAY');
  }
  function showRecords(){
    const cardChips=arr=>(arr&&arr.length)?arr.map(cs=>{const red=cs.includes('♥')||cs.includes('♦');return '<span style="display:inline-block;min-width:26px;text-align:center;background:#fffdf0;color:'+(red?'#b9383c':'#23292a')+';border-radius:4px;padding:2px 5px;margin-right:4px;font-family:Georgia,serif;font-weight:700;font-size:13px">'+esc(cs)+'</span>';}).join(''):'<span style="color:#8b9b8e">未亮牌</span>';
    const GC='grid-template-columns:2.6em minmax(0,1fr) auto auto;gap:10px';
    const netCell=r=>{ if(r.net===undefined||r.net===null) return '<span style="color:'+(r.win?'#65c59d':'#dd888a')+'">'+(r.win?'🏆赢':'输')+'</span>'; const n=Number(r.net); return '<span style="color:'+(r.win?'#65c59d':'#dd888a')+'">'+(r.win?'🏆':'')+(n>=0?'+':'')+(r.estimated?'≈ ':'')+fmt(n)+' '+esc(r.sym||'')+'</span>'; };
    const row=(r,i)=>`<button class="rec-row" data-action="rec-toggle" data-idx="${i}" style="display:grid;${GC};width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--line,#ffffff10);padding:10px 4px;align-items:center;font-size:12.5px;color:#dbe0cf;cursor:pointer">
         <span style="color:#e8c783;font-weight:700">${esc(String(r.hand))}</span>
         <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(String(r.label||'-'))}</span>
         <span style="font-weight:700;text-align:right;font-variant-numeric:tabular-nums">${netCell(r)}</span>
         <span style="text-align:right;color:#9db09f;font-variant-numeric:tabular-nums">${esc(String(r.pot||'-'))}</span>
       </button>
       <div id="recd-${i}" hidden style="padding:8px 10px 12px;background:#0d1a14;border-bottom:1px solid var(--line,#ffffff10);font-size:11px;color:#9db09f;line-height:1.7">
         <div>时间 ${esc(r.time||'-')} · 底注 ${esc(String(r.ante||'-'))} · ${esc(String(r.players||'-'))} 人</div>
         <div style="margin-top:7px;display:flex;align-items:center;flex-wrap:wrap;gap:4px"><b style="color:#e8c783;min-width:64px">我的牌</b> ${cardChips(r.myCards)} ${r.label&&r.label!=='-'?'<span>（'+esc(r.label)+'）</span>':''}</div>
         ${(r.foes&&r.foes.length)?r.foes.map(f=>`<div style="margin-top:6px;display:flex;align-items:center;flex-wrap:wrap;gap:4px${f.folded?';opacity:.55':''}"><b style="min-width:64px;color:#c9d4c0">${esc(f.name)}${f.win?' 🏆':''}</b> ${f.folded?'<span style="color:#8b9b8e">已弃牌</span> ':''}${cardChips(f.cards)} <span>（${esc(f.label||'-')}）</span></div>`).join(''):'<div style="margin-top:6px;color:#8b9b8e">无对手牌面记录</div>'}
       </div>`;
    openModal('我的牌局记录',
      `<div class="stats-grid" style="grid-template-columns:1fr"><div><strong>${results.length}</strong><span>${A.L('本机记录数','Records on this device')}</span></div></div>
       <div style="display:grid;${GC};padding:0 4px 7px;font-size:10px;letter-spacing:1px;color:#7e9583;border-bottom:1px solid var(--line,#ffffff14)"><span>局号</span><span>牌型</span><span style="text-align:right">${A.L('输赢估算','Estimated net')}</span><span style="text-align:right">底池</span></div>
       ${results.length?results.slice(0,40).map(row).join(''):'<div style="padding:16px 4px;color:#8b9b8e;font-size:12px">暂无记录，玩一局就有了。</div>'}
       <div class="form-note" style="margin-top:12px">点某一行展开看你的三张牌。${A.L('记录按钱包与币种隔离，仅作本机缓存。输赢是规则估算，实际结算以链上为准。','Records are scoped to this wallet and token and cached on this device. Net amounts are estimates; verify on-chain settlement.')}</div>`,'SESSION RECORDS');
  }

  // ---------- 视图 ----------
  function setView(next){
    view=next==='lobby'?'lobby':'table';
    $('tableView').hidden=view!=='table'; $('lobbyView').hidden=view!=='lobby';
    document.querySelectorAll('.primary-nav [data-view]').forEach(b=>{const s=b.dataset.view===view;b.classList.toggle('active',s);s?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current');});
    const mApp=$('mApp'); if(mApp) mApp.hidden=(view!=='lobby'); // 手机:大厅显示App壳,进桌隐藏(露出绿呢牌桌)
    document.querySelectorAll('#mNav button').forEach(b=>b.classList.toggle('active', b.dataset.mtab==='lobby' && view==='lobby'));
    if(view==='lobby'){ if(authed)wsend({t:'listTables'}); renderRooms(); checkResume(); }
    else { applyLayout(); resizeSoon(); }
    if(location.hash!=='#'+view)history.replaceState(null,'','#'+view);
  }

  // ---------- 音效/全屏 ----------
  function playSound(type='click'){ if(!sound)return; try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.type='triangle';o.frequency.value=type==='win'?680:type==='card'?440:300;const t=audioCtx.currentTime;const peak=type==='win'?1.0:.9;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+.012);g.gain.exponentialRampToValueAtTime(.0008,t+(type==='win'?.3:.2));o.start(t);o.stop(t+(type==='win'?.32:.22));}catch(e){sound=false;updateSound();} }
  function updateSound(){const s=$('jtSoundStrike');if(s)s.style.display=sound?'none':'';const b=$('jtSoundBtn');if(b)b.title=sound?'关闭音效':'开启音效';}
  // 背景音乐:循环播放一段埃及氛围乐(CC0, Polygondan - Desert Mystic),音量轻,可开关
  function startBGM(){
    if(!bgmOn)return;
    try{
      if(!bgmNodes){ bgmNodes=new Audio('bgm.mp3?v=1018a'); bgmNodes.loop=true; bgmNodes.volume=0.35; bgmNodes.preload='auto'; }
      const p=bgmNodes.play(); if(p&&p.catch)p.catch(()=>{});
    }catch(e){}
  }
  function stopBGM(){ if(!bgmNodes)return; try{ bgmNodes.pause(); bgmNodes.currentTime=0; }catch(e){} }
  async function toggleFullscreen(){
    if(fsBusy)return; fsBusy=true; const el=document.documentElement;
    try{
      if(document.fullscreenElement||document.webkitFullscreenElement){ try{screen.orientation?.unlock?.();}catch(e){} if(document.exitFullscreen)await document.exitFullscreen();else if(document.webkitExitFullscreen)document.webkitExitFullscreen(); return; }
      const req=el.requestFullscreen||el.webkitRequestFullscreen;
      if(!req){toast('请把手机横过来；若没旋转，关掉系统竖屏锁定。');return;}
      await req.call(el);
      if(matchMedia('(pointer: coarse)').matches&&screen.orientation?.lock){ try{await screen.orientation.lock('landscape');toast('已进入横屏全屏');}catch(e){toast('已进入全屏，请把设备横过来');} }
      else toast(matchMedia('(orientation: portrait)').matches?'已进入全屏，请把设备横过来':'已进入全屏');
    }catch(e){toast('此浏览器未允许全屏。横过设备也能用横屏牌桌。');}
    finally{fsBusy=false;}
  }
  function updateFullscreen(){const b=$('fullscreenButton');if(b){const on=!!(document.fullscreenElement||document.webkitFullscreenElement);b.title=on?'退出全屏':'全屏与横屏';}}
  const isLandscapeReal=()=>matchMedia('(orientation:landscape)').matches;
  async function toggleLandscape(){
    if(document.body.classList.contains('force-landscape')){ document.body.classList.remove('force-landscape'); try{if(document.fullscreenElement)await document.exitFullscreen();}catch(e){} toast('已退出横屏'); return; }
    const coarse=matchMedia('(pointer:coarse)').matches;
    if(!coarse||isLandscapeReal()){ await toggleFullscreen(); return; } // 桌面或已横屏:走原生全屏
    document.body.classList.add('force-landscape'); // 手机竖屏:CSS旋转强制横屏,不靠系统旋转
    try{const el=document.documentElement,req=el.requestFullscreen||el.webkitRequestFullscreen; if(req)await req.call(el);}catch(e){}
    {const pt=$('portraitTip');if(pt)pt.hidden=true;} toast('已切换横屏,再点一次退出');
  }

  // ---------- 事件 ----------
  document.addEventListener('fullscreenchange',updateFullscreen);
  document.addEventListener('webkitfullscreenchange',updateFullscreen);
  $('modal').addEventListener('close',()=>{_topupOpen=false;const t=modalFocus;modalFocus=null;if(t&&t.isConnected&&!t.disabled&&t.getClientRects().length)t.focus();});
  $('modal').addEventListener('click',e=>{if(e.target!==$('modal'))return;const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();});
  document.addEventListener('click',async e=>{
    const b=e.target.closest('button,a[data-view]'); if(!b||b.disabled)return;
    try{
      if(b.dataset.view){ if(b.classList.contains('back-button')){backToLobby();}else setView(b.dataset.view); return; }
      if(b.dataset.pool){ setPool(b.dataset.pool); return; }
      if(b.dataset.filter){ filter=b.dataset.filter; syncFilters(); renderRooms(); return; }
      if(b.dataset.mfilter){ filter=b.dataset.mfilter; syncFilters(); renderRooms(); return; }
      if(b.dataset.mtab){ const t=b.dataset.mtab; if(t==='lobby')setView('lobby'); else if(t==='mytable'){ if(curHand)setView('table'); else resumeActiveHand(); } else if(t==='records')showRecords(); else if(t==='account')showWallet(); return; }
      if(b.dataset.ante){ newAnte=Number(b.dataset.ante); document.querySelectorAll('[data-ante]').forEach(el=>{const s=Number(el.dataset.ante)===newAnte;el.classList.toggle('selected',s);el.setAttribute('aria-pressed',String(s));}); return; }
      if(b.dataset.seats){ newCount=Number(b.dataset.seats); document.querySelectorAll('[data-seats]').forEach(el=>{const s=Number(el.dataset.seats)===newCount;el.classList.toggle('selected',s);el.setAttribute('aria-pressed',String(s));}); return; }
      if(b.dataset.priv!==undefined){ newPrivate=b.dataset.priv==='1'; document.querySelectorAll('[data-priv]').forEach(el=>{const s=(el.dataset.priv==='1')===newPrivate;el.classList.toggle('selected',s);el.setAttribute('aria-pressed',String(s));}); const n=$('privNote'); if(n)n.textContent=newPrivate?'私密牌桌不显示在大厅，只有拿到房号的人才能进。开桌后把房号发给朋友即可。':'开桌后各玩家先交一份底注入座，凑够 2 人自动发牌。押真 '+SYM+'。'; return; }
      if(b.dataset.tlayout){ setTableLayout(b.dataset.tlayout); return; }
      if(b.dataset.join){await joinRoom(b.dataset.join);return;}
      if(b.dataset.compare){ doCompare(b.dataset.compare); return; }
      const a=b.dataset.action;
      switch(a){
        case 'close':closeModal();break;
        case 'wallet':showWallet();break;
        case 'connect':await connect();closeModal();showWallet();break;
        case 'rules':showRules();break;
        case 'records':showRecords();break;
        case 'join-code':{ const box=b.closest('.m-joinbox,.join-box'); const inp=box&&box.querySelector('input'); const id=inp?String(inp.value).replace(/[^0-9]/g,''):''; if(!id){toast('请输入房号');break;} toast('查询房间 #'+id+'…'); const ph=await roomPhase(id); if(ph===0){toast('房间 #'+id+' 不存在，请让朋友重新建桌');break;} if(ph>=4){toast('房间 #'+id+' 本局已结束，请换一个房号或新建牌桌');break;} if(inp)inp.value='';await joinRoom(id);break; }
        case 'create':openCreate();break;
        case 'create-confirm':await doCreate();break;
        case 'refresh-bal':{ if(!myAddr){toast('请先连接钱包');break;} toast('刷新中…'); await Promise.all([refreshBalances(), refreshWalletBalances()]); toast(A.L('余额查询已完成，请核对各项状态','Balance queries finished; check each status')); break; }
        case 'copy-addr':{ if(!myAddr)break; try{ await navigator.clipboard.writeText(myAddr); toast('✅ 地址已复制'); }catch(e){ toast('复制失败，请长按上面的地址手动复制'); } break; }
        case 'fold-close':{ closeModal(); doFold(); break; }
        case 'toggle-qr':{ qrOpen=!qrOpen; const w=$('mw_qrwrap'); if(w)w.style.display=qrOpen?'flex':'none'; if(b)b.textContent=(qrOpen?'▾':'▸')+' 收款码'; if(qrOpen)renderWalletQR(); break; }
        case 'rec-toggle':{ const d=$('recd-'+b.dataset.idx); if(d)d.hidden=!d.hidden; break; }
        case 'pick-avatar':{ const f=$('avatarFile'); if(f)f.click(); break; }
        case 'save-avatar':{ if(!pendingAvatar){toast('请先点头像选择图片');break;} if(!authed){toast('未连接对战服务，稍候重试');break;} toast('保存中…'); wsend({t:'setAvatar',avatar:pendingAvatar}); clearTimeout(window._avT); window._avT=setTimeout(()=>{window._avT=null;toast('⚠ 上传超时，请检查网络后重试');},8000); break; }
        case 'clear-avatar':{ if(!authed){toast('未连接对战服务，稍候重试');break;} pendingAvatar=null; wsend({t:'setAvatar',avatar:''}); if(myAddr)delete avatarCache[myAddr.toLowerCase()]; if($('modal').open)showWallet(); if(state&&view==='table')render(); toast('已恢复默认头像'); break; }
        case 'claim':await doClaim();break;
        case 'authorize-confirm':await confirmAuthorize(b);break;
        case 'revoke-allowance':await revokeAllowance();break;
        case 'fold':doFold();break;
        case 'peek':doPeek();break;
        case 'call':doCall();break;
        case 'raise':doRaise();break;
        case 'compare':startCompare();break;
        case 'allin':doAllIn();break;
        case 'next':{if(pending){toast(A.L('上一操作待确认','An action is awaiting confirmation'));break;}if(!curHand)break;if(!authed){toast(A.L('请重新连接对战服务','Reconnect to the game service'));break;}await A.requireReferral(myAddr);await checkAuth();if(!authorized){await doAuthorize();break;} if(!wsend({t:'rematch',handId:curHand}))throw new Error(A.L('连接已断开，请重试','Disconnected; retry'));setPending(A.L('正在创建下一局…','Starting the next hand…'));toast('继续下一局…'); break; }
        case 'ready':await doReady();break;
        case 'leave':backToLobby();break;
        case 'fullscreen':await toggleLandscape();break;
        case 'sound':sound=!sound;try{localStorage.setItem('ap_sfx',sound?'1':'0');}catch(e){}updateSound();playSound();toast(sound?'音效已开':'音效已关');break;
        case 'save-nick':{ const inp=$('nickInput'); const nm=inp?inp.value.trim():''; if(!nm){toast('请输入昵称');break;} if([...nm].length>3){toast('昵称最多3个字');break;} if(myNickRem<=0){toast('本月改名次数已用完');break;} if(!authed){toast('未连接对战服务，请稍候重试');break;} toast('保存中…'); wsend({t:'setNickname',name:nm}); clearTimeout(window._nickTimer); window._nickTimer=setTimeout(()=>{ window._nickTimer=null; toast('⚠ 保存超时，请检查网络后重试'); },6000); break; }
        case 'toggle-bgm':{bgmOn=!bgmOn;try{localStorage.setItem('ap_bgm',bgmOn?'1':'0');}catch(e){}if(bgmOn)startBGM();else stopBGM();showWallet();toast(bgmOn?'背景音乐已开':'背景音乐已关');break;}
        case 'toggle-sfx':{sound=!sound;try{localStorage.setItem('ap_sfx',sound?'1':'0');}catch(e){}updateSound();if(sound)playSound();showWallet();toast(sound?'音效已开':'音效已关');break;}
        case 'dismiss-tip':{const pt=$('portraitTip');if(pt)pt.hidden=true;break;}
        case 'refresh':{if(!authed||!wsend({t:'listTables'})){toast(A.L('请先连接对战服务','Connect to game service first'));break;}roomsLoaded=false;renderRooms();toast(A.L('正在查询牌桌…','Querying tables…'));break;}
      }
    }catch(err){toast((err&&err.message)||'操作失败，请重试');}
  });
  document.addEventListener('change',e=>{ if(e.target&&e.target.id==='avatarFile'){ const f=e.target.files&&e.target.files[0]; handleAvatarFile(f); e.target.value=''; } }); // 上传头像选图
  window.addEventListener('hashchange',()=>setView(location.hash==='#lobby'?'lobby':'table'));
  try{ matchMedia('(orientation:landscape)').addEventListener('change',e=>{ if(e.matches)document.body.classList.remove('force-landscape'); }); }catch(e){} // 真横屏时关掉CSS旋转防重复

  // 倒计时:只更新一个文字,不整屏重绘(手机流畅关键)
  setInterval(()=>{ if(state&&state.phase===2&&view==='table'&&!$('tableView').hidden) gtTick(); },1000);
  setInterval(()=>{ if(authed&&ws&&ws.readyState===1&&!curHand&&view==='lobby')wsend({t:'listTables'}); },5000);

  // 启动
  try{ sound=localStorage.getItem('ap_sfx')!=='0'; bgmOn=localStorage.getItem('ap_bgm')==='1'; }catch(e){} // 默认音效开、背景乐关
  try{ const L=localStorage.getItem('ap_layout'); if(L&&LAYOUTS[L])tableLayout=L; }catch(e){} // 牌桌布局,默认02对席分区(旧存classic已失效→回默认)
  applyLayout();
  window.addEventListener('resize',resizeGame);
  window.addEventListener('orientationchange',resizeSoon);
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden)resizeSoon(); });
  if(window.visualViewport)window.visualViewport.addEventListener('resize',resizeGame);
  try{ if(typeof ResizeObserver!=='undefined'){ const tv=$('tableView'); if(tv)new ResizeObserver(resizeGame).observe(tv); } }catch(e){}
  resizeSoon();
  updateSound();
  if(bgmOn){ const once=()=>{ startBGM(); document.removeEventListener('pointerdown',once); }; document.addEventListener('pointerdown',once,{once:true}); } // 首次点击后启动背景乐
  renderLobbyBars(); // 生成币种池切换(LGNS/DAI)+当前池档位筛选条
  setView('lobby'); // 通过链接进入一律默认到大厅,让用户挑桌/开桌
  renderRooms();
  setNet(false);A.account().then(a=>{if(a){myAddr=a;results=loadResults();$('walletLabel').textContent=short(a);refreshBalances();renderRooms();}}).catch(()=>{});
  window.addEventListener('ap:wallet-change',()=>location.reload());
  window.addEventListener('ap:bound',()=>{toast(A.L('邀请关系已确认，请连接对战服务','Invitation confirmed; connect to the game service'));});
  { const a=$('jtTurnMain'),b=$('jtTurnHint'); if(a)a.textContent='连接钱包开始'; if(b)b.textContent='点右上角「连接钱包」'; }
})();
