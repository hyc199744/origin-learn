/* ANUBIS PLAY 金花牌局 — 真人实时对战前端(黑金皮肤 + 真实链上逻辑)
   视觉皮套复用 styles.css;逻辑连 Anubis 链 + 发牌后端(wss),押真 LGNS,授权一次免签玩牌。
   不在前端产生随机结果:牌序由合约种子+blockhash决定,后端按权威结果发牌,可事后核验。 */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const icon=name=>`<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // ---- 配置(与 zhajinhua-live 一致的真实环境) ----
  const WSS="wss://zjgame.web3origin.com";
  const CONTRACT="0x76C17ECb3ff0a5E9c6eC99D98Fa7EB55a31Cd7A2"; // 当前为测试合约,正式上线会替换
  const LGNS="0x4D1D808a081FdAc440703b3765FC61f8028C06B8";
  const APPROVE_AMT=(1000n*1000000000n);
  const ZERO='0x0000000000000000000000000000000000000000';
  const ANUBIS={id:6714,hex:'0x1A3A',name:'Anubis',rpc:'https://rpc.anubispace.org',exp:'https://browser.anubispace.org',native:{name:'DAI',symbol:'DAI',decimals:18}};
  const SEL={withdraw:'3ccfd60b',approve:'095ea7b3',allowance:'dd62ed3e',bal:'70a08231',authorize:'b6a5d7de',deleg:'8d22ea2a',wd:'ce513b6f'};
  const SUITS=['♠','♥','♣','♦'];               // 后端 s:0-3
  const LABELS=['单张','对子','顺子','同花','同花顺','豹子'];

  // ---- 状态 ----
  let myAddr=null, ws=null, authed=false, delegate=null, authorized=false;
  let curHand=null, myCards=null, state=null, picking=false, lastPot='0';
  let view='table', filter='all', newAnte=10, newCount=6;
  let sound=false, bgmOn=false, bgmNodes=null, audioCtx=null, modalFocus=null, toastTimer, msgTimer, fsBusy=false;
  let lastDealtHand=null, startedHands=new Set(), activity=[], results=loadResults();
  let prevPlayers=null, cdActive=false, cdBase='', pending=false, joining=false, myLookedLocal=false, pendingLook=false;

  const slotMap={2:[0,3],3:[0,2,4],4:[0,2,3,4],5:[0,1,2,4,5],6:[0,1,2,3,4,5]};

  // ---- 工具 ----
  const short=a=>a?a.slice(0,6)+'…'+a.slice(-4):'';
  const e9=v=>Number(BigInt(v))/1e9;
  const fmt=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:3});
  const nz=a=>a&&a.toLowerCase()!==ZERO;
  function toast(t){clearTimeout(toastTimer);const el=$('toast');el.textContent=t;el.classList.add('show');toastTimer=setTimeout(()=>el.classList.remove('show'),3600);}
  function message(t){clearTimeout(msgTimer);const el=$('tableMessage');el.textContent=t;el.classList.add('visible');msgTimer=setTimeout(()=>el.classList.remove('visible'),1600);}
  function enc(v){return BigInt(v).toString(16).padStart(64,'0');}
  function encA(a){return '0'.repeat(24)+a.toLowerCase().replace(/^0x/,'');}
  function rcall(to,d){return fetch(ANUBIS.rpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_call',params:[{to,data:'0x'+d},'latest']})}).then(r=>r.json()).then(j=>(j.result||'0x').replace(/^0x/,''));}
  async function roomPhase(id){ // 查房间当前阶段:0不存在/1等待/2下注/3摊牌/4结束/5退款, -1出错
    try{ const r=await rcall(CONTRACT,'d47f269e'+enc(id)); if(!r||r.length<64)return 0; return parseInt(r.slice(62,64),16)||0; }catch(e){ return -1; }
  }
  function loadResults(){try{return JSON.parse(localStorage.getItem('anubisplay_results')||'[]');}catch(e){return [];}}
  function saveResults(){try{localStorage.setItem('anubisplay_results',JSON.stringify(results.slice(0,50)));}catch(e){}}
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
    const eth=window.ethereum; if(!eth){toast('请在 OKX / MetaMask 钱包内置浏览器打开');return;}
    try{
      const accs=await eth.request({method:'eth_requestAccounts'}); if(!accs.length)return; myAddr=accs[0];
      const cid=await eth.request({method:'eth_chainId'});
      if(parseInt(cid,16)!==ANUBIS.id){try{await eth.request({method:'wallet_switchEthereumChain',params:[{chainId:ANUBIS.hex}]});}catch(e){if(e&&e.code===4902){await eth.request({method:'wallet_addEthereumChain',params:[{chainId:ANUBIS.hex,chainName:ANUBIS.name,rpcUrls:[ANUBIS.rpc],nativeCurrency:ANUBIS.native,blockExplorerUrls:[ANUBIS.exp]}]});}else throw e;}}
      $('walletLabel').textContent=short(myAddr);
      const wp=$('mWalletPill'); if(wp)wp.textContent=short(myAddr);
      const cb=$('mConnectBtn'); if(cb){const sp=cb.querySelector('span'); if(sp)sp.textContent=short(myAddr);}
      refreshBalances(); connectWS();
      if(!window._wl){window._wl=1;eth.on&&eth.on('accountsChanged',()=>location.reload());eth.on&&eth.on('chainChanged',()=>location.reload());}
    }catch(e){toast((e&&e.message)||'连接失败');}
  }
  async function sendTxTo(to,data){
    const eth=window.ethereum, gp=await eth.request({method:'eth_gasPrice',params:[]});
    const hash=await eth.request({method:'eth_sendTransaction',params:[{from:myAddr,to,data:'0x'+data,type:'0x0',gasPrice:gp}]});
    for(let i=0;i<120;i++){await new Promise(r=>setTimeout(r,2000));const rc=await eth.request({method:'eth_getTransactionReceipt',params:[hash]});if(rc&&rc.blockNumber){if(rc.status==='0x1')return rc;throw new Error('交易失败');}}
    throw new Error('确认超时');
  }
  const sendTx=data=>sendTxTo(CONTRACT,data);
  async function refreshBalances(){
    if(!myAddr)return;
    try{const b=await rcall(LGNS,SEL.bal+encA(myAddr)); const v=e9(BigInt('0x'+(b||'0'))); $('balanceAmount').textContent=fmt(v);}catch(e){}
    try{const wd=await rcall(CONTRACT,SEL.wd+encA(myAddr)); const v=e9(BigInt('0x'+(wd||'0'))); $('claimableAmount').textContent=fmt(v)+' LGNS'; $('claimButton').disabled=!(v>0);}catch(e){}
  }
  async function checkAuth(){
    if(!myAddr||!delegate){authorized=false;return;}
    try{
      const d=await rcall(CONTRACT,SEL.deleg+encA(myAddr));
      const al=BigInt('0x'+((await rcall(LGNS,SEL.allowance+encA(myAddr)+encA(CONTRACT)))||'0'));
      authorized=(('0x'+d.slice(24)).toLowerCase()===delegate.toLowerCase())&&al>0n;
    }catch(e){authorized=false;}
  }
  async function doAuthorize(){
    if(!myAddr){toast('请先连接钱包');return;}
    if(!delegate){toast('正在登录对战服务…');return;}
    try{
      toast('第1步：授权代币额度（上限 1000 LGNS）…'); await sendTxTo(LGNS,SEL.approve+encA(CONTRACT)+enc(APPROVE_AMT));
      toast('第2步：授权免签代发…'); await sendTx(SEL.authorize+encA(delegate));
      authorized=true; toast('✅ 授权完成，之后玩牌不再弹签名'); refreshBalances();
    }catch(e){toast(e.message||'授权失败');}
  }

  // ---------- WSS ----------
  function connectWS(){
    ws=new WebSocket(WSS);
    ws.onopen=()=>{ setNet(true); };
    ws.onclose=()=>{ setNet(false); setTimeout(connectWS,3000); };
    ws.onerror=()=>{};
    ws.onmessage=async ev=>{ let m; try{m=JSON.parse(ev.data);}catch(e){return;} await onMsg(m); };
  }
  function setNet(ok){ const el=document.querySelector('.network'); if(el)el.classList.toggle('offline',!ok); }
  function wsend(o){try{ws.send(JSON.stringify(o));}catch(e){}}
  async function onMsg(m){
    if(m.t==='challenge'){ const sig=await window.ethereum.request({method:'personal_sign',params:[m.nonce,myAddr]}); wsend({t:'auth',addr:myAddr,sig}); }
    else if(m.t==='authed'){ authed=true; delegate=m.delegate; wsend({t:'listTables'}); checkAuth(); if(curHand)wsend({t:'subscribe',handId:curHand}); }
    else if(m.t==='tables'){ renderRooms(m.tables); }
    else if(m.t==='tableCreated'){ curHand=String(m.handId); myCards=null; myLookedLocal=false; pendingLook=false; prevPlayers=null; joining=false;
      wsend({t:'subscribe',handId:curHand}); toast('✅ 开桌成功！房号 #'+m.handId+' —— 把这个号发给朋友，他输房号进同一桌；你点「准备」交底注开始'); // 进桌旁观,点准备才交底注
      state={handId:String(m.handId),phase:1,ante:(BigInt(newAnte)*1000000000n).toString(),maxPlayers:newCount,nPlayers:0,nActive:0,pot:'0',curBet:'0',turn:0,turnAddr:ZERO,cmpChallenger:ZERO,cmpOpp:ZERO,players:[],actionDeadline:0};
      enterTable(); try{ render(); }catch(e){} }
    else if(m.t==='joined'){ logAct('你已入座'); }
    else if(m.t==='left'){ toast('已退座，底注退回可领取'); backToLobby(true); }
    else if(m.t==='handState'){ if(String(m.handId)===String(curHand)){ onState(m); } }
    else if(m.t==='yourCards'){ if(String(m.handId)===String(curHand)){ myCards=m.cards; render(); } }
    else if(m.t==='result'){ if(String(m.handId)===String(curHand)){ showResult(m); } }
    else if(m.t==='rematched'){ curHand=String(m.handId); myCards=null; myLookedLocal=false; pendingLook=false; state=null; prevPlayers=null; picking=false; closeModal(); wsend({t:'subscribe',handId:curHand}); message('新一局开始'); }
    else if(m.t==='refunded'){ if(String(m.handId)===String(curHand)) toast('本局已退款'); }
    else if(m.t==='error'){ pending=false; joining=false; clearTimeout(window._pt); clearTimeout(window._jt); toast(m.msg); if(state)render(); }
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
    // 首局自动发牌:人齐且仍 OPEN,由首座玩家触发一次(后端去重)
    if(m.phase===1 && m.nPlayers>=2 && !startedHands.has(String(m.handId))){
      const first=m.players[0];
      if(first && isMe(first.addr)){ startedHands.add(String(m.handId)); setTimeout(()=>wsend({t:'startDeal',handId:m.handId}),1500); }
    }
    if(newHandBetting){ lastDealtHand=String(m.handId); logAct('第 '+m.handId+' 局开始'); }
    render();
    if(newHandBetting) setTimeout(animateDeal,60);
  }
  const isMe=a=>myAddr&&a&&a.toLowerCase()===myAddr.toLowerCase();
  const meIdx=()=>state?state.players.findIndex(p=>isMe(p.addr)):-1;

  // ---------- 渲染 ----------
  function cardHTML(card,revealed){
    if(!revealed)return '<div class="playing-card card-back" role="img" aria-label="未翻开的手牌"><svg aria-hidden="true"><use href="#i-anubis"/></svg></div>';
    const rank=({11:'J',12:'Q',13:'K',14:'A'})[card.value]||card.value;
    const red=['♥','♦'].includes(card.suit);
    return `<div class="playing-card${red?' red':''}" role="img" aria-label="${esc(card.suit)} ${rank}"><span class="rank">${rank}<span>${card.suit}</span></span><span class="card-suit">${card.suit}</span><span class="rank-bottom">${rank}</span></div>`;
  }
  function avatarHTML(p){ return `<div class="avatar avi-${p.isMe?0:(1+(p.seatIndex%5))}" aria-hidden="true">${p.isMe?'<svg><use href="#i-anubis"/></svg>':(p.sign||'👤')}</div>`; }
  function seatHTML(p,slot){
    if(p.placeholder) return `<div class="player-seat seat-${slot} folded" aria-label="空位"><div class="avatar-wrap"><div class="avatar" aria-hidden="true">+</div></div><div class="player-info"><span class="player-name">空位</span><span class="player-balance">等待加入</span></div><span class="seat-status">等待加入</span></div>`;
    const cls=`player-seat seat-${slot}${p.folded?' folded':''}${p.isTurn?' current':''}${p.winner?' winner':''}`;
    const mini=p.isMe?'':`<div class="seat-cards" aria-hidden="true"><i class="mini-card"></i><i class="mini-card"></i><i class="mini-card"></i></div>`;
    return `<div class="${cls}" aria-label="${p.isMe?'你':esc(p.name)}，${esc(p.status)}"><div class="avatar-wrap">${avatarHTML(p)}</div><div class="player-info"><span class="player-name">${p.isMe?'我':esc(p.name)}${p.isMe?'<small class="you-badge">YOU</small>':''}</span><span class="player-balance">投入 ${fmt(e9(p.contributed))} <small>LGNS</small></span></div>${mini}<span class="seat-status">${esc(p.status)}</span></div>`;
  }
  function buildPlayers(){
    // 把"我"排到首位(座位0=底部),其余按链上顺序
    const ps=state.players.map((p,i)=>({addr:p.addr,contributed:p.contributed,looked:p.looked,folded:p.folded,seatIndex:i,isMe:isMe(p.addr)}));
    if(joining && myAddr && !ps.some(p=>p.isMe)){ ps.push({addr:myAddr,contributed:'0',looked:false,folded:false,seatIndex:999,isMe:true,_joining:true}); } // 乐观占位:我的座位先显示"入座中"
    ps.sort((a,b)=> (a.isMe?-1:0)-(b.isMe?-1:0) || a.seatIndex-b.seatIndex);
    const comparing=nz(state.cmpOpp);
    ps.forEach(p=>{
      p.name=p.isMe?'我':short(p.addr);
      p.sign=p.isMe?'':p.addr.slice(2,3).toUpperCase();
      p.isTurn=state.phase===2&&!comparing&&state.turnAddr&&state.turnAddr.toLowerCase()===p.addr.toLowerCase();
      const inCmp=comparing&&(p.addr.toLowerCase()===state.cmpChallenger.toLowerCase()||p.addr.toLowerCase()===state.cmpOpp.toLowerCase());
      p.status=p._joining?'入座中…':(p.folded?'弃牌':(inCmp?'⚔ 比牌中':(p.isTurn?'行动中':(p.looked?'已看牌':'暗牌中'))));
    });
    return ps;
  }
  // ===== 节点复用:座位/手牌/动态只建一次,之后只改文字与class,不再整块重建(手机流畅关键) =====
  const SVGNS='http://www.w3.org/2000/svg';
  let _domBuilt=false, seatEls=[], cardEls=[], actEls=[];
  function mkSvgUse(href){ const svg=document.createElementNS(SVGNS,'svg'); svg.setAttribute('aria-hidden','true'); const u=document.createElementNS(SVGNS,'use'); u.setAttribute('href',href); svg.appendChild(u); return svg; }
  function buildDom(){
    if(_domBuilt) return; const seatsC=$('seats'), handC=$('myHand'), actC=$('activityList'); if(!seatsC||!handC||!actC) return; _domBuilt=true;
    seatsC.textContent='';
    for(let i=0;i<6;i++){
      const d=document.createElement('div'); d.className='player-seat';
      const aw=document.createElement('div'); aw.className='avatar-wrap';
      const av=document.createElement('div'); av.className='avatar'; av.setAttribute('aria-hidden','true');
      const avSvg=mkSvgUse('#i-anubis'); avSvg.style.display='none';
      const avTxt=document.createElement('span');
      av.appendChild(avSvg); av.appendChild(avTxt); aw.appendChild(av);
      const info=document.createElement('div'); info.className='player-info';
      const nm=document.createElement('span'); nm.className='player-name'; const nmText=document.createTextNode(''); const badge=document.createElement('small'); badge.className='you-badge'; badge.textContent='YOU'; badge.style.display='none'; nm.appendChild(nmText); nm.appendChild(badge);
      const bal=document.createElement('span'); bal.className='player-balance'; const balText=document.createTextNode(''); const balSmall=document.createElement('small'); balSmall.textContent='LGNS'; bal.appendChild(balText); bal.appendChild(balSmall);
      info.appendChild(nm); info.appendChild(bal);
      const sc=document.createElement('div'); sc.className='seat-cards'; sc.setAttribute('aria-hidden','true'); for(let k=0;k<3;k++){const mc=document.createElement('i');mc.className='mini-card';sc.appendChild(mc);}
      const st=document.createElement('span'); st.className='seat-status';
      d.appendChild(aw); d.appendChild(info); d.appendChild(sc); d.appendChild(st); seatsC.appendChild(d);
      seatEls.push({d,av,avSvg,avTxt,nmText,badge,balText,balSmall,sc,st});
    }
    handC.textContent='';
    for(let i=0;i<3;i++){
      const c=document.createElement('div'); c.className='playing-card';
      const svg=mkSvgUse('#i-anubis');
      const rank=document.createElement('span'); rank.className='rank'; const rText=document.createTextNode(''); const rSuit=document.createElement('span'); rank.appendChild(rText); rank.appendChild(rSuit);
      const main=document.createElement('span'); main.className='card-suit';
      const rb=document.createElement('span'); rb.className='rank-bottom';
      c.appendChild(svg); c.appendChild(rank); c.appendChild(main); c.appendChild(rb); handC.appendChild(c);
      cardEls.push({c,rText,rSuit,main,rb});
    }
    actC.textContent='';
    for(let i=0;i<6;i++){ const li=document.createElement('li'); const sp=document.createElement('span'); const tm=document.createElement('small'); li.appendChild(sp); li.appendChild(tm); li.style.display='none'; actC.appendChild(li); actEls.push({li,sp,tm}); }
  }
  function paintSeats(disp,slots){
    for(let i=0;i<6;i++){
      const el=seatEls[i], p=disp[i], slot=(slots[i]!==undefined?slots[i]:i);
      if(!p){ el.d.style.display='none'; continue; }
      el.d.style.display='';
      if(p.placeholder){
        el.d.className='player-seat seat-'+slot+' folded';
        el.avSvg.style.display='none'; el.avTxt.style.display=''; el.avTxt.textContent='+';
        el.nmText.nodeValue='空位'; el.badge.style.display='none'; el.balText.nodeValue='等待加入'; el.balSmall.style.display='none';
        el.sc.style.display='none'; el.st.textContent='等待加入'; el.d.setAttribute('aria-label','空位'); continue;
      }
      el.d.className='player-seat seat-'+slot+(p.folded?' folded':'')+(p.isTurn?' current':'')+(p.winner?' winner':'');
      el.av.className='avatar avi-'+(p.isMe?0:(1+(p.seatIndex%5)));
      if(p.isMe){ el.avSvg.style.display=''; el.avTxt.style.display='none'; } else { el.avSvg.style.display='none'; el.avTxt.style.display=''; el.avTxt.textContent=(p.sign||'👤'); }
      el.nmText.nodeValue=p.isMe?'我':p.name; el.badge.style.display=p.isMe?'':'none';
      el.balText.nodeValue='投入 '+fmt(e9(p.contributed))+' '; el.balSmall.style.display='';
      el.sc.style.display=p.isMe?'none':''; el.st.textContent=p.status;
      el.d.setAttribute('aria-label',(p.isMe?'你':p.name)+'，'+p.status);
    }
  }
  function paintHand(me,showFace){
    for(let i=0;i<3;i++){
      const el=cardEls[i];
      if(!me){ el.c.style.display='none'; continue; }
      el.c.style.display='';
      if(myCards&&showFace){ const card=conv(myCards[i]); const rank=({11:'J',12:'Q',13:'K',14:'A'})[card.value]||card.value; const red=card.suit==='♥'||card.suit==='♦';
        el.c.className='playing-card'+(red?' red':''); el.rText.nodeValue=rank; el.rSuit.textContent=card.suit; el.main.textContent=card.suit; el.rb.textContent=rank; el.c.setAttribute('aria-label',card.suit+' '+rank);
      } else { el.c.className='playing-card card-back'; el.c.setAttribute('aria-label','未翻开的手牌'); }
    }
  }
  function paintActivity(){
    for(let i=0;i<6;i++){ const el=actEls[i], a=activity[i]; if(!a){ el.li.style.display='none'; continue; } el.li.style.display=''; el.sp.textContent=a.text; el.tm.textContent=a.time; }
  }

  function render(){
    if(!state){ return; }
    buildDom();
    const phase=state.phase, mi=meIdx(), comparing=nz(state.cmpOpp);
    const ante=e9(state.ante), curBet=e9(state.curBet), pot=e9(state.pot);
    const me=mi>=0?state.players[mi]:null;
    const looked=me&&(me.looked||myLookedLocal);
    const cost=looked?curBet*2:curBet;
    const ended=phase>=3;

    // 顶部桌面信息
    $('roomTitle').textContent='牌桌 #'+state.handId;
    $('roomSubtitle').innerHTML=`底注 ${fmt(ante)} LGNS <i>·</i> ${state.nPlayers}/${state.maxPlayers} 人`;
    const PH={1:'等待入座',2:'对局中',3:'结算中',4:'已结束',5:'已退款'};
    $('tableStatus').innerHTML='<i></i> '+(PH[phase]||'');
    $('potAmount').textContent=fmt(pot);
    $('roundBadge').textContent='本注 '+fmt(curBet);
    $('handNumber').textContent='NO. '+String(state.handId).padStart(4,'0');

    // 座位
    let disp=buildPlayers();
    if(phase===1){ const open=Math.min(state.maxPlayers,6)-disp.length; for(let i=0;i<open;i++)disp.push({placeholder:true}); }
    if(ended){ // 标记赢家(未弃牌最大)
      let best=-1,win=null; (window._reveal||[]).forEach(r=>{ if(!r.folded){const sc=score(r.cards); if(sc>best){best=sc;win=r.addr;}} });
      disp.forEach(p=>{ if(win&&p.addr&&p.addr.toLowerCase()===win.toLowerCase())p.winner=true; });
    }
    const count=Math.max(2,Math.min(6,disp.length));
    const slots=slotMap[count]||slotMap[6];
    paintSeats(disp.slice(0,6),slots);

    // 我的手牌(me.looked=链上已确认看牌;myLookedLocal=本地已点看牌,秒翻不等上链)
    const showFace=(myCards&&me&&(me.looked||myLookedLocal))|| (ended&&myCards&&me);
    paintHand(me,showFace);
    if(me&&myCards&&showFace){ const rk=rankHand(myCards.map(conv)); $('handLabel').textContent=rk.label+' · '+(ended?'本局揭晓':'已看牌'); }
    else { $('handLabel').textContent=joining?'入座中…':(me?'未看牌 · 保持神秘':'你在观战'); }

    // 侧栏
    $('investedAmount').textContent=(me?fmt(e9(me.contributed)):'0')+' LGNS';
    paintActivity();

    // 行动区
    renderActions(phase,mi,me,looked,cost,ended,comparing);
  }
  function renderActions(phase,mi,me,looked,cost,ended,comparing){
    const ctrl=$('actionControls'), rr=$('roundResult');
    if(pending && phase===2 && !ended){ ctrl.hidden=false; rr.hidden=true; const _r=$('readyRow'); if(_r)_r.hidden=true; ['foldButton','peekButton','raiseButton','compareButton','callButton'].forEach(id=>{const b=$(id);if(b)b.disabled=true;}); return; } // 处理中:保持禁用,但上面已把牌渲染出来
    const myTurn=phase===2&&!comparing&&mi>=0&&state.turnAddr&&isMe(state.turnAddr)&&me&&!me.folded;

    const ready=$('readyRow');
    if(phase===1){
      ctrl.hidden=true; rr.hidden=true;
      const anteV=fmt(e9(state.ante));
      if(joining){ if(ready)ready.hidden=true; $('turnTitle').textContent='准备中…'; $('turnHint').textContent='正在上链交底注，稍候…'; return; }
      if(ready)ready.hidden=false;
      if(mi<0){ // 旁观,未准备
        $('turnTitle').textContent='进桌成功'; $('turnHint').textContent='点「准备」交底注入座';
        $('readyTitle').textContent='准备开始'; $('readyDesc').textContent='交底注 '+anteV+' LGNS 入座，人齐自动开局';
        const rb=$('readyBtn'); rb.textContent='准备（交底注 '+anteV+'）'; rb.disabled=false;
      } else { // 已准备(已交底注)
        const waiting=state.nPlayers<2;
        $('turnTitle').textContent=waiting?'已准备':'人齐，马上开始';
        $('turnHint').textContent=waiting?'等其他玩家准备':'正在发牌…';
        $('readyTitle').textContent=waiting?'✓ 已准备 · 等其他玩家':'✓ 人齐，马上开始';
        $('readyDesc').textContent=waiting?'已交底注 '+anteV+' LGNS，等另一位玩家准备':'';
        const rb=$('readyBtn'); rb.textContent='✓ 已准备'; rb.disabled=true;
      }
      return;
    }
    if(ready)ready.hidden=true;
    if(ended){
      ctrl.hidden=true; rr.hidden=false;
      $('turnTitle').textContent='本局已结算';
      $('turnHint').textContent='第 '+state.handId+' 局';
      return;
    }
    // phase 2 betting
    ctrl.hidden=false; rr.hidden=true; cdActive=false;
    $('callAmount').innerHTML=fmt(cost)+' <small>LGNS</small>';
    if(comparing){ $('turnTitle').textContent='比牌裁决中'; $('turnHint').textContent='马上出结果…'; }
    else if(myTurn){ $('turnTitle').textContent='轮到你行动'; cdBase=(looked?'明牌':'暗牌')+'跟注 '+fmt(cost)+' LGNS'; cdActive=true; $('turnHint').textContent=cdBase+timeLeftStr(); }
    else if(mi<0||(me&&me.folded)){ $('turnTitle').textContent='观战中'; $('turnHint').textContent='等待本局结束'; }
    else { $('turnTitle').textContent='其他玩家行动中'; $('turnHint').textContent='轮到 '+short(state.turnAddr); }

    const dis=!myTurn;
    $('foldButton').disabled=dis;
    $('peekButton').disabled=dis||looked;
    $('peekButton').querySelector('span').textContent=looked?'已看牌':'看牌';
    $('raiseButton').disabled=dis;
    $('compareButton').disabled=dis||state.nActive<2;
    $('callButton').disabled=dis;
    // 若在选比牌对手,提示
    if(picking&&myTurn){ cdActive=false; $('turnHint').textContent='点一个对手比牌(下方座位),或再次点比牌取消'; }
  }
  function timeLeftStr(){ if(!state||!state.actionDeadline)return ''; const l=state.actionDeadline-Math.floor(Date.now()/1000); return l>0?' · 剩 '+l+'s':''; }

  function animateDeal(){ const hand=$('myHand'); if(!hand)return; hand.classList.add('dealing'); hand.querySelectorAll('.playing-card').forEach(c=>c.classList.add('deal-in')); setTimeout(()=>hand.classList.remove('dealing'),700); playSound('card'); }

  function showResult(m){
    window._reveal=m.reveal||[];
    let best=-1,winAddr=null;
    (m.reveal||[]).forEach(r=>{ if(!r.folded){const sc=score(r.cards); if(sc>best){best=sc;winAddr=r.addr;}} });
    const pot=e9(lastPot), payout=pot*0.97;
    const iWon=winAddr&&isMe(winAddr);
    const meRev=(m.reveal||[]).find(r=>isMe(r.addr)); if(meRev)myCards=meRev.cards; // 没看牌也在摊牌亮出我的牌
    state=Object.assign({},state,{phase:4});
    render();
    $('resultTitle').textContent=iWon?'🎉 你赢了':(winAddr?short(winAddr)+' 获胜':'本局结束');
    var anteV=state?fmt(e9(state.ante)):'';
    $('resultDescription').textContent=(winAddr?'底池 '+fmt(pot)+' LGNS，赢家拿 '+fmt(payout)+'（扣 3%）':'本局结束')+' · 奖金自动到账'+(anteV?'｜继续下一局需再交底注 '+anteV+' LGNS':'');
    // 翻牌动画
    setTimeout(()=>{ const hand=$('myHand'); if(hand){hand.querySelectorAll('.playing-card').forEach(c=>c.classList.add('deal-in'));} },40);
    if(iWon)playSound('win');
    message(iWon?'好牌！你赢得了本局':'本局已结束');
    // 记录(本地,真实观测)
    const me=(m.reveal||[]).find(r=>isMe(r.addr));
    results.unshift({hand:state.handId,win:iWon,winner:winAddr?short(winAddr):'-',pot:fmt(pot),time:new Date().toLocaleString('zh-CN'),label:me?rankHand(me.cards.map(conv)).label:'-'});
    results=results.slice(0,50); saveResults();
    logAct((iWon?'你赢得':short(winAddr)+' 赢得')+'底池 '+fmt(pot)+' LGNS');
    refreshBalances();
  }

  // ---------- 大厅 ----------
  function renderRooms(tables){
    window._rooms=tables||window._rooms||[];
    if(view!=='lobby')return;
    const list=(window._rooms||[]).filter(r=>filter==='all'||String(e9(r.ante))===String(filter));
    renderMRooms(list); // 手机端大厅房间
    const grid=$('roomGrid');
    if(!list.length){ grid.innerHTML='<div class="room-empty" style="opacity:.7;padding:24px;text-align:center">暂无牌桌，点「创建我的牌桌」开一桌，或等别人开。</div>'; return; }
    grid.innerHTML=list.map(r=>{
      const ante=fmt(e9(r.ante)), n=r.nPlayers||0, full=n>=r.maxPlayers;
      const name=(e9(r.ante)>=100?'大师':e9(r.ante)>=50?'进阶':'经典')+'场 · '+String(r.handId).padStart(2,'0');
      return `<article class="room-card"><div class="room-card-head"><span>${esc(name)}</span><span class="room-pill ${full?'busy':''}">${full?'已满':'等待加入'}</span></div><div class="room-ante"><strong>${ante}</strong><span>LGNS</span></div><div class="room-caption">底注 / 每人每局</div><div class="room-divider"></div><div class="room-bottom"><div class="room-players">${icon('users')}${n} / ${r.maxPlayers} 已入座</div><button class="join-button" data-join="${r.handId}" ${full?'disabled':''}>${full?'本桌已满':'加入牌桌'}</button></div><div class="room-sub">真人对战 · ${r.maxPlayers} 人桌 · 押真 LGNS</div></article>`;
    }).join('');
  }
  function mFaces(n,mx){ const suits=['♠','♦','♣','♥']; let s=''; const show=Math.min(mx,4); for(let i=0;i<show;i++){ s+= i<n? '<i>'+suits[i]+'</i>' : '<i class="empty">+</i>'; } return s; }
  function renderMRooms(list){
    const box=$('mRooms'); if(!box)return;
    if(!list.length){ box.innerHTML='<div class="m-empty">暂无同档位牌桌。点上面「创建我的牌桌」开一桌，或等别人开。</div>'; return; }
    box.innerHTML=list.map((r,i)=>{
      const ante=fmt(e9(r.ante)), n=r.nPlayers||0, mx=r.maxPlayers, full=n>=mx, av=e9(r.ante), id=r.handId;
      const name=(av>=100?'大师':av>=50?'进阶':'经典')+'场';
      if(i===0 && filter==='all'){
        return '<div class="m-featured"><div class="m-rowflex"><span class="m-fav">✦ 人气推荐</span><span style="font-size:10px;color:#a6c8a8">● '+(full?'已满':'等待加入')+'</span></div><div class="m-rowflex" style="margin-top:1px"><div><h4>'+esc(name)+' <span style="color:#92aa95;font-size:12px;font-weight:400">#'+esc(String(id))+'</span></h4><p class="fp">'+mx+' 人桌 · 押真 LGNS</p></div><div class="m-fprice"><strong>'+ante+'</strong><small>LGNS</small></div></div><div class="m-featbottom"><div class="m-bubble"><div class="m-faces">'+mFaces(n,mx)+'</div><span>'+n+'/'+mx+' 已入座</span></div><button class="m-joinbtn" data-join="'+id+'" '+(full?'disabled':'')+'>'+(full?'已满':'加入牌桌 →')+'</button></div></div>';
      }
      const mark=av>=100?'♣':av>=50?'♥':'♠', mcls=av>=100?'blue':av>=50?'red':'';
      const dots=Array.from({length:mx},(_,j)=>'<b class="'+(j<n?'on':'')+'"></b>').join('');
      return '<article class="m-room"><div class="m-rmark '+mcls+'">'+mark+'</div><div><h4>'+esc(name)+' <span style="font-size:12px;color:#637e69">#'+esc(String(id))+'</span>'+(!full?'<i>● 有空位</i>':'')+'</h4><p>'+mx+' 人桌 · '+(full?'已满':'等待入座')+'</p><div class="m-miniseats"><span class="m-dots">'+dots+'</span>'+n+' / '+mx+' 人</div></div><div class="m-side"><strong>'+ante+'</strong><small>LGNS 底注</small><button data-join="'+id+'" '+(full?'disabled':'')+'>'+(full?'已满':'加入 →')+'</button></div></article>';
    }).join('');
  }
  function syncFilters(){
    document.querySelectorAll('[data-filter]').forEach(el=>{const s=el.dataset.filter===filter;el.classList.toggle('selected',s);el.setAttribute('aria-pressed',String(s));});
    document.querySelectorAll('[data-mfilter]').forEach(el=>el.classList.toggle('active',el.dataset.mfilter===filter));
  }
  function enterTable(){ setView('table'); }
  function backToLobby(skipLeave){
    if(curHand && !skipLeave){
      if(state&&state.phase===1&&meIdx()>=0){ wsend({t:'leaveTable',handId:curHand}); } // 开局前退座退款
      wsend({t:'unsubscribe',handId:curHand});
    }
    curHand=null; state=null; myCards=null; myLookedLocal=false; pendingLook=false; prevPlayers=null; picking=false; joining=false; clearTimeout(window._jt);
    setView('lobby'); if(authed)wsend({t:'listTables'}); refreshBalances();
  }
  async function joinRoom(id){
    if(!myAddr){ await connect(); if(!myAddr)return; }
    curHand=String(id); myCards=null; myLookedLocal=false; pendingLook=false; prevPlayers=null; joining=false;
    wsend({t:'subscribe',handId:id}); // 先进桌旁观,点「准备」才交底注入座
    const room=(window._rooms||[]).find(r=>String(r.handId)===String(id));
    state={handId:String(id),phase:1,ante:room?room.ante:'0',maxPlayers:room?Number(room.maxPlayers):6,nPlayers:room?Number(room.nPlayers):0,nActive:0,pot:'0',curBet:'0',turn:0,turnAddr:ZERO,cmpChallenger:ZERO,cmpOpp:ZERO,players:[],actionDeadline:0};
    enterTable(); try{ render(); }catch(e){}
  }
  async function doReady(){ // 准备=交底注入座
    if(!curHand)return;
    if(!myAddr){ await connect(); if(!myAddr)return; }
    if(!authorized){ await doAuthorize(); if(!authorized)return; } // 首次自动授权一次
    joining=true;
    wsend({t:'joinTable',handId:curHand}); toast('准备中，交底注入座…');
    try{ render(); }catch(e){}
    clearTimeout(window._jt); window._jt=setTimeout(()=>{ if(joining){joining=false; try{render();}catch(e){}} },12000);
  }
  async function doCreate(){
    if(!myAddr){ await connect(); if(!myAddr)return; }
    if(!authorized){ closeModal(); await doAuthorize(); if(!authorized)return; }
    const ante=(BigInt(newAnte)*1000000000n).toString();
    wsend({t:'createTable',ante,maxPlayers:newCount}); closeModal(); toast('开桌中…');
  }

  // ---------- 行动 ----------
  function act(action,extra){ wsend(Object.assign({t:'act',handId:curHand,action},extra||{})); }
  function setPending(txt){ pending=true; cdActive=false; ['foldButton','peekButton','raiseButton','compareButton','callButton'].forEach(id=>{const b=$(id);if(b)b.disabled=true;}); const h=$('turnHint'); if(h)h.textContent=txt||'⏳ 处理中…'; clearTimeout(window._pt); window._pt=setTimeout(()=>{ if(pending){pending=false; render();} },7000); }
  // 乐观更新:点了立刻在本地改状态(底池/我的投入/先交出回合),链上确认后由真实state对齐
  function optimBet(extra){ const mi=meIdx(); if(mi<0||!state)return; const me=state.players[mi]; const base=BigInt(state.curBet)+(extra||0n); const cost=(me.looked||myLookedLocal)?base*2n:base; const nc=(BigInt(me.contributed)+cost).toString(); state.players=state.players.map((p,i)=>i===mi?Object.assign({},p,{contributed:nc}):p); state.pot=(BigInt(state.pot)+cost).toString(); if(extra)state.curBet=base.toString(); state.turnAddr=ZERO; }
  function optimFold(){ const mi=meIdx(); if(mi<0||!state)return; state.players=state.players.map((p,i)=>i===mi?Object.assign({},p,{folded:true}):p); state.turnAddr=ZERO; }
  function doFold(){ const wl=pendingLook;pendingLook=false; optimFold(); act('fold',{withLook:wl}); logAct('你 弃牌'); setPending('已弃牌'); render(); }
  function doPeek(){ // 看牌=纯本地翻牌(牌已在本地),不单独上链;看完按钮仍可点,look与下一步动作打包上链
    if(myLookedLocal)return;
    if(!myCards){ act('look'); setPending('看牌中…'); return; } // 兜底:牌还没到,走独立look
    myLookedLocal=true; pendingLook=true; playSound('card'); render();
  }
  function doCall(){ const wl=pendingLook;pendingLook=false; optimBet(0n); act('call',{withLook:wl}); playSound(); logAct('你 跟注'); setPending('已跟注，等其他玩家…'); render(); }
  function doRaise(){ const wl=pendingLook;pendingLook=false; try{optimBet(BigInt(state.ante));}catch(e){} act('raise',{withLook:wl}); playSound(); logAct('你 加注'); setPending('已加注，等其他玩家…'); render(); }
  function startCompare(){ if(!state||state.nActive<2){toast('暂无可比牌的对手');return;} picking=!picking; if(picking){openCompare();} render(); }
  function doCompare(addr){ const wl=pendingLook;pendingLook=false; picking=false; setPending('比牌中…'); act('compare',{target:addr,withLook:wl}); logAct('你 比牌'); closeModal(); }
  async function doClaim(){ if(!myAddr)return; try{toast('领取中…');await sendTx(SEL.withdraw);toast('已领取到钱包');refreshBalances();}catch(e){toast(e.message||'暂无可领');} }

  // ---------- 弹窗 ----------
  function openModal(title,html,eyebrow='ANUBIS PLAY'){ if(!$('modal').open)modalFocus=document.activeElement; $('modalTitle').textContent=title; $('modalEyebrow').textContent=eyebrow; $('modalBody').innerHTML=html; if(!$('modal').open)$('modal').showModal(); }
  function closeModal(){ if($('modal').open)$('modal').close(); }
  function showWallet(){
    const connected=!!myAddr;
    const soundSet=`<label class="form-label">声音设置</label>
       <div class="wallet-row"><span>背景音乐</span><button class="small-button" data-action="toggle-bgm">${bgmOn?'🔊 开':'🔇 关'}</button></div>
       <div class="wallet-row"><span>游戏音效</span><button class="small-button" data-action="toggle-sfx">${sound?'🔊 开':'🔇 关'}</button></div>`;
    openModal('我的', (connected?
      `<div class="wallet-info"><span>钱包地址</span><strong style="font-size:14px">${short(myAddr)}</strong></div>
       <div class="wallet-row"><span>LGNS 余额</span><strong id="mw_bal">${$('balanceAmount').textContent} <small>LGNS</small></strong></div>
       <div class="wallet-row"><span>可领取奖金</span><strong>${$('claimableAmount').textContent}</strong><button class="small-button" data-action="claim" ${$('claimButton').disabled?'disabled':''}>领取</button></div>`
      :`<div class="notice">连接 Anubis 链钱包后即可开桌、入座、押真 LGNS 对战。</div><button class="gold-button" data-action="connect">${icon('wallet')}连接钱包</button>`)
      + soundSet
      + `<div class="form-note">押真 LGNS，链上公平结算，奖金自动到账。</div>`,
      'MY ACCOUNT');
  }
  function openCreate(){
    newAnte=10;newCount=6;
    openModal('创建你的牌桌',
      `<label class="form-label">选择底注</label><div class="tier-options" role="group" aria-label="选择底注">${[10,50,100].map(n=>`<button class="tier-button ${newAnte===n?'selected':''}" data-ante="${n}" aria-pressed="${newAnte===n}"><strong>${n}</strong><span>LGNS</span></button>`).join('')}</div>
       <label class="form-label">牌桌人数（最多 6 人/局）</label><div class="tier-options" role="group" aria-label="牌桌人数">${[2,3,4,5,6].map(n=>`<button type="button" class="tier-button ${newCount===n?'selected':''}" data-seats="${n}" aria-pressed="${newCount===n}"><strong>${n}</strong><span>人</span></button>`).join('')}</div>
       <div class="form-note">开桌后各玩家先交一份底注入座，凑够 2 人自动发牌。押真 LGNS。</div>
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
  function showRules(){
    openModal('三张牌，一场对决。',
      `<p>每位玩家 3 张牌，可暗牌或看牌后行动。牌型从大到小：</p>
       <table class="rules-table"><thead><tr><th>牌型 · 从大到小</th><th>示例</th></tr></thead><tbody>
       <tr><td>01　豹子</td><td>A♠ A♥ A♣</td></tr><tr><td>02　同花顺</td><td>J♠ Q♠ K♠</td></tr><tr><td>03　同花</td><td>2♥ 7♥ K♥</td></tr><tr><td>04　顺子</td><td>7♠ 8♥ 9♣</td></tr><tr><td>05　对子</td><td>Q♠ Q♥ 8♣</td></tr><tr><td>06　单张</td><td>A♠ J♥ 8♣</td></tr></tbody></table>
       <ol class="rules-copy"><li>各交一份底注入座。暗牌按当前本注跟注，看牌后按 2 倍跟注。</li>
       <li>加注把本注往上提一档；按钮显示本次实际支付。</li>
       <li>轮到你可比牌：挑一个对手单挑，输的出局；牌力相同发起方出局。</li>
       <li>打到只剩 1 人或摊牌结算，赢家拿底池（扣 3% 手续费）。一局结束自动开下一局。</li>
       <li>A23 为最小顺子；花色不分大小。</li></ol>
       <div class="rules-foot">牌序由合约种子 + 区块哈希决定，后端按权威结果发牌，每局种子上链公开可事后核验。押真 LGNS，理性参与。</div>`,'HOW TO PLAY');
  }
  function showRecords(){
    const wins=results.filter(r=>r.win).length;
    openModal('我的牌局记录',
      `<div class="stats-grid"><div><strong>${results.length}</strong><span>已记录牌局</span></div><div><strong>${wins}</strong><span>获胜</span></div><div><strong>${results.length?Math.round(wins/results.length*100):0}%</strong><span>胜率</span></div></div>
       <label class="form-label">最近记录（本浏览器）</label>
       <ol class="record-list">${results.length?results.slice(0,40).map(r=>`<li><span>#${r.hand} ${r.win?'🏆 你赢':'赢家 '+esc(r.winner)} · ${esc(r.label)} · 底池 ${esc(r.pot)}</span><small>${esc(r.time)}</small></li>`).join(''):'<li><span>暂无记录，玩一局就有了。</span><small></small></li>'}</ol>
       <div class="form-note">记录保存在本浏览器本地，换设备或清缓存会清空；权威结果以链上为准。</div>`,'SESSION RECORDS');
  }

  // ---------- 视图 ----------
  function setView(next){
    view=next==='lobby'?'lobby':'table';
    $('tableView').hidden=view!=='table'; $('lobbyView').hidden=view!=='lobby';
    document.querySelectorAll('.primary-nav [data-view]').forEach(b=>{const s=b.dataset.view===view;b.classList.toggle('active',s);s?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current');});
    const mApp=$('mApp'); if(mApp) mApp.hidden=(view!=='lobby'); // 手机:大厅显示App壳,进桌隐藏(露出绿呢牌桌)
    document.querySelectorAll('#mNav button').forEach(b=>b.classList.toggle('active', b.dataset.mtab==='lobby' && view==='lobby'));
    if(view==='lobby'){ if(authed)wsend({t:'listTables'}); renderRooms(); }
    if(location.hash!=='#'+view)history.replaceState(null,'','#'+view);
  }

  // ---------- 音效/全屏 ----------
  function playSound(type='click'){ if(!sound)return; try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.type='sine';o.frequency.value=type==='win'?660:type==='card'?420:280;g.gain.setValueAtTime(.035,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.13);o.start();o.stop(audioCtx.currentTime+.15);}catch(e){sound=false;updateSound();} }
  function updateSound(){const b=$('soundButton');if(!b)return;b.setAttribute('aria-pressed',String(sound));b.title=sound?'关闭音效':'开启音效';const so=b.querySelector('.sound-off');if(so)so.hidden=sound;}
  // 背景音乐:网页自带音频合成的轻缓氛围循环(无文件,可开关)
  function startBGM(){
    if(bgmNodes||!bgmOn)return;
    try{
      if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();
      if(audioCtx.state==='suspended')audioCtx.resume();
      const ctx=audioCtx, now=ctx.currentTime;
      const master=ctx.createGain(); master.gain.value=0; master.connect(ctx.destination);
      master.gain.linearRampToValueAtTime(0.045, now+3); // 低音量淡入
      const filter=ctx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=850; filter.connect(master);
      const voices=[0,1,2].map(()=>{ const o=ctx.createOscillator(); o.type='sine'; const g=ctx.createGain(); g.gain.value=0.34; o.connect(g); g.connect(filter); o.start(); return o; });
      const prog=[[220,261.63,329.63],[196,246.94,293.66],[174.61,220,261.63],[196,246.94,329.63]]; // 轻缓和弦进行
      let step=0; const tick=()=>{ if(!bgmNodes)return; const ch=prog[step%prog.length]; step++; voices.forEach((o,i)=>o.frequency.setTargetAtTime(ch[i],ctx.currentTime,1.6)); };
      tick(); const iv=setInterval(tick,6000);
      bgmNodes={master,voices,iv};
    }catch(e){ bgmNodes=null; }
  }
  function stopBGM(){ if(!bgmNodes)return; try{ const {master,voices,iv}=bgmNodes; clearInterval(iv); master.gain.linearRampToValueAtTime(0.0001,audioCtx.currentTime+1); setTimeout(()=>{ voices.forEach(o=>{try{o.stop();}catch(e){}}); try{master.disconnect();}catch(e){} },1200); }catch(e){} bgmNodes=null; }
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
  function updateFullscreen(){const on=!!(document.fullscreenElement||document.webkitFullscreenElement);$('fullscreenButton').title=on?'退出全屏':'全屏与横屏';}
  const isLandscapeReal=()=>matchMedia('(orientation:landscape)').matches;
  async function toggleLandscape(){
    if(document.body.classList.contains('force-landscape')){ document.body.classList.remove('force-landscape'); try{if(document.fullscreenElement)await document.exitFullscreen();}catch(e){} toast('已退出横屏'); return; }
    const coarse=matchMedia('(pointer:coarse)').matches;
    if(!coarse||isLandscapeReal()){ await toggleFullscreen(); return; } // 桌面或已横屏:走原生全屏
    document.body.classList.add('force-landscape'); // 手机竖屏:CSS旋转强制横屏,不靠系统旋转
    try{const el=document.documentElement,req=el.requestFullscreen||el.webkitRequestFullscreen; if(req)await req.call(el);}catch(e){}
    $('portraitTip').hidden=true; toast('已切换横屏,再点一次退出');
  }

  // ---------- 事件 ----------
  document.addEventListener('fullscreenchange',updateFullscreen);
  document.addEventListener('webkitfullscreenchange',updateFullscreen);
  $('modal').addEventListener('close',()=>{const t=modalFocus;modalFocus=null;if(t&&t.isConnected&&!t.disabled&&t.getClientRects().length)t.focus();});
  $('modal').addEventListener('click',e=>{if(e.target!==$('modal'))return;const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();});
  document.addEventListener('click',async e=>{
    const b=e.target.closest('button,a[data-view]'); if(!b||b.disabled)return;
    try{
      if(b.dataset.view){ if(b.classList.contains('back-button')){backToLobby();}else setView(b.dataset.view); return; }
      if(b.dataset.filter){ filter=b.dataset.filter; syncFilters(); renderRooms(); return; }
      if(b.dataset.mfilter){ filter=b.dataset.mfilter; syncFilters(); renderRooms(); return; }
      if(b.dataset.mtab){ const t=b.dataset.mtab; if(t==='lobby')setView('lobby'); else if(t==='mytable'){ if(curHand)setView('table'); else toast('你还没入座牌桌，去大厅选一桌'); } else if(t==='records')showRecords(); else if(t==='account')showWallet(); return; }
      if(b.dataset.ante){ newAnte=Number(b.dataset.ante); document.querySelectorAll('[data-ante]').forEach(el=>{const s=Number(el.dataset.ante)===newAnte;el.classList.toggle('selected',s);el.setAttribute('aria-pressed',String(s));}); return; }
      if(b.dataset.seats){ newCount=Number(b.dataset.seats); document.querySelectorAll('[data-seats]').forEach(el=>{const s=Number(el.dataset.seats)===newCount;el.classList.toggle('selected',s);el.setAttribute('aria-pressed',String(s));}); return; }
      if(b.dataset.join){ joinRoom(b.dataset.join); return; }
      if(b.dataset.compare){ doCompare(b.dataset.compare); return; }
      const a=b.dataset.action;
      switch(a){
        case 'close':closeModal();break;
        case 'wallet':showWallet();break;
        case 'connect':await connect();closeModal();showWallet();break;
        case 'rules':showRules();break;
        case 'records':showRecords();break;
        case 'join-code':{ const box=b.closest('.m-joinbox,.join-box'); const inp=box&&box.querySelector('input'); const id=inp?String(inp.value).replace(/[^0-9]/g,''):''; if(!id){toast('请输入房号');break;} toast('查询房间 #'+id+'…'); const ph=await roomPhase(id); if(ph===0){toast('房间 #'+id+' 不存在，请让朋友重新建桌');break;} if(ph>=4){toast('房间 #'+id+' 本局已结束，请换一个房号或新建牌桌');break;} if(inp)inp.value=''; joinRoom(id); break; }
        case 'create':openCreate();break;
        case 'create-confirm':doCreate();break;
        case 'claim':doClaim();break;
        case 'fold':doFold();break;
        case 'peek':doPeek();break;
        case 'call':doCall();break;
        case 'raise':doRaise();break;
        case 'compare':startCompare();break;
        case 'next':if(curHand)wsend({t:'rematch',handId:curHand});toast('继续下一局…');break;
        case 'ready':await doReady();break;
        case 'leave':backToLobby();break;
        case 'fullscreen':await toggleLandscape();break;
        case 'sound':sound=!sound;try{localStorage.setItem('ap_sfx',sound?'1':'0');}catch(e){}updateSound();playSound();toast(sound?'音效已开':'音效已关');break;
        case 'toggle-bgm':{bgmOn=!bgmOn;try{localStorage.setItem('ap_bgm',bgmOn?'1':'0');}catch(e){}if(bgmOn)startBGM();else stopBGM();showWallet();toast(bgmOn?'背景音乐已开':'背景音乐已关');break;}
        case 'toggle-sfx':{sound=!sound;try{localStorage.setItem('ap_sfx',sound?'1':'0');}catch(e){}updateSound();if(sound)playSound();showWallet();toast(sound?'音效已开':'音效已关');break;}
        case 'dismiss-tip':$('portraitTip').hidden=true;break;
        case 'refresh':{if(authed)wsend({t:'listTables'});const l=b.querySelector('span');if(l){l.textContent='刷新中';setTimeout(()=>l.textContent='刷新',500);}toast('已刷新牌桌列表');break;}
      }
    }catch(err){toast((err&&err.message)||'操作失败，请重试');}
  });
  window.addEventListener('hashchange',()=>setView(location.hash==='#lobby'?'lobby':'table'));
  try{ matchMedia('(orientation:landscape)').addEventListener('change',e=>{ if(e.matches)document.body.classList.remove('force-landscape'); }); }catch(e){} // 真横屏时关掉CSS旋转防重复

  // 倒计时:只更新一个文字,不整屏重绘(手机流畅关键)
  setInterval(()=>{ if(cdActive&&state&&state.phase===2&&view==='table'&&!$('tableView').hidden){ const el=$('turnHint'); if(el)el.textContent=cdBase+timeLeftStr(); } },1000);
  setInterval(()=>{ if(authed&&ws&&ws.readyState===1&&!curHand&&view==='lobby')wsend({t:'listTables'}); },5000);

  // 启动
  try{ sound=localStorage.getItem('ap_sfx')!=='0'; bgmOn=localStorage.getItem('ap_bgm')==='1'; }catch(e){} // 默认音效开、背景乐关
  updateSound();
  if(bgmOn){ const once=()=>{ startBGM(); document.removeEventListener('pointerdown',once); }; document.addEventListener('pointerdown',once,{once:true}); } // 首次点击后启动背景乐
  setView('lobby'); // 通过链接进入一律默认到大厅,让用户挑桌/开桌
  renderRooms();
  if(window.ethereum&&window.ethereum.selectedAddress){ connect(); }
  else { $('turnTitle').textContent='连接钱包开始'; $('turnHint').textContent='点右上角「连接钱包」'; }
})();
