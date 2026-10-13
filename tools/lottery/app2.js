
async function renderMyStats(){
  const box = $('myStats'); if(!box) return;
  const pl = $('myStatsPool'); if(pl) pl.textContent = myAddr ? t('msPool') : '';
  if(!myAddr){ box.innerHTML = '<div class="note">'+t('myStatsConnect')+'</div>'; return; }
  const me = myAddr.toLowerCase();
  try{
    const [tLogs, wLogs, rLogs] = await Promise.all([
      scanLogs([EV_TICKETS]), scanLogs([EV_WIN]), scanLogs([EV_REFREWARD])
    ]);
    let tickets = 0n;
    for(const l of tLogs){
      if(('0x'+l.topics[2].slice(-40)).toLowerCase()!==me) continue;
      tickets += BigInt('0x'+(l.data||'0x').replace(/^0x/,'').slice(0,64));
    }
    let winCnt=0, winAmt=0n;
    for(const l of wLogs){
      const d=(l.data||'0x').replace(/^0x/,'');
      const offW=Number(BigInt('0x'+d.slice(0,64)))*2, offA=Number(BigInt('0x'+d.slice(64,128)))*2;
      const ws=decAddrArray(d,offW), as=decUintArray(d,offA);
      for(let i=0;i<ws.length;i++){ if(ws[i].toLowerCase()===me){ winCnt++; winAmt+=as[i]; } }
    }
    let ref=0n;
    for(const l of rLogs){
      const d=(l.data||'0x').replace(/^0x/,'');
      const l1=('0x'+d.slice(0,64).slice(-40)).toLowerCase(), dd1=BigInt('0x'+(d.slice(64,128)||'0'));
      const l2=('0x'+d.slice(128,192).slice(-40)).toLowerCase(), dd2=BigInt('0x'+(d.slice(192,256)||'0'));
      if(l1===me) ref+=dd1;
      if(l2===me) ref+=dd2;
    }
    const spent = tickets * TICKET; // 按当前票价估算（事件里没记每次成交价）
    const net = winAmt + ref - spent;
    const neg = net<0n, netAbs = neg ? -net : net;
    const sym = TSYM();
    box.innerHTML = '<div class="mystats">'
      +'<div class="ms"><div class="k">'+t('msTicketsBought')+'</div><div class="v">'+tickets.toString()+t('ticketsUnit')+'</div></div>'
      +'<div class="ms"><div class="k">'+t('msSpent')+'</div><div class="v">≈ '+fmt(spent)+' '+sym+'</div></div>'
      +'<div class="ms"><div class="k">'+t('msWon')+'</div><div class="v">'+t('msWonTimes',{n:winCnt})+' · '+fmt(winAmt)+' '+sym+'</div></div>'
      +'<div class="ms"><div class="k">'+t('msRefEarned')+'</div><div class="v">'+fmt(ref)+' '+sym+'</div></div>'
      +'<div class="ms" style="grid-column:1/-1"><div class="k">'+t('msNet')+' '+t('msSpentNote')+'</div><div class="v" style="color:'+(neg?'var(--wine)':'#3E6B4F')+'">'+(neg?'-':'+')+fmt(netAbs)+' '+sym+'</div></div>'
      +'</div>';
  }catch(e){ console.error('myStats',e); box.innerHTML='<div class="note">'+t('loadFail')+'</div>'; }
}
// 历史开奖 + 累计榜：从 WinnersDrawn 事件读
const EV_WIN = '0xab9af1684355064aa9258894f5c85b041fd7a83e4fe0eb02e607c13d8cb627b4';
// 邀请数据：ReferralBound(buyer,ref) / TicketsBought(roundId,buyer,count,firstTicket) / ReferralRewarded(roundId,buyer,l1,d1,l2,d2)
const EV_REFBOUND = '0x8ceb585bfbbc2a8c702024b1d2f212e7ba1caff58b232f071b023d184997b111';
const EV_TICKETS = '0xc8c5c2b0e44fb6312c0098ec42642058527713d0a1d29a5c6ccbfe34d714d41e';
const EV_REFREWARD = '0xbfcb51139629056da37f44a10daa7f67e6ce0b9083e03a7408b3ad1a456ce097';
const PADADDR = a => '0x' + '0'.repeat(24) + a.toLowerCase().replace(/^0x/,'');
// 事件日志缓存：按合约+topic 分桶，只增量扫新块，避免每次刷新全链重扫
const _logCache = {};
function resetLogCache(){ for(const k in _logCache) delete _logCache[k]; }
async function scanLogs(topics, contract, deployFrom){
  contract = contract || CFG.CONTRACT;
  const dep = (deployFrom!=null) ? deployFrom : (CFG.deployBlock || 0);
  const key = contract + '|' + JSON.stringify(topics);
  let c = _logCache[key];
  if(!c){ c = { next: dep, logs: [] }; _logCache[key] = c; }
  const latest = Number(BigInt(await req('eth_blockNumber',[])));
  const CHUNK = 4000;
  let from = c.next;
  while(from <= latest){
    const to = Math.min(from + CHUNK - 1, latest);
    const part = await req('eth_getLogs',[{address:contract, topics,
      fromBlock:'0x'+from.toString(16), toBlock:'0x'+to.toString(16)}]);
    if(part && part.length) for(const l of part) c.logs.push(l);
    from = to + 1;
  }
  if(latest + 1 > c.next) c.next = latest + 1;
  return c.logs;
}
// 我的邀请数据：直推/间推人数、他们买了多少票、每人为我赚了多少返佣
async function refreshRefStats(){
  const box = $('refStats');
  if(!box) return;
  if(!myAddr){ box.style.display='none'; return; }
  const me = myAddr.toLowerCase();
  try{
    const [bLogs, tLogs, rLogs] = await Promise.all([
      scanLogs([EV_REFBOUND]), scanLogs([EV_TICKETS]), scanLogs([EV_REFREWARD])
    ]);
    const boundRef = {}; // buyer => ref
    for(const l of bLogs){
      const buyer = ('0x'+l.topics[1].slice(-40)).toLowerCase();
      const ref = ('0x'+l.topics[2].slice(-40)).toLowerCase();
      boundRef[buyer] = ref;
    }
    const direct = Object.keys(boundRef).filter(b => boundRef[b]===me);
    const dset = new Set(direct);
    const indirect = Object.keys(boundRef).filter(b => !dset.has(b) && b!==me && dset.has(boundRef[b]));
    const ticketsBy = {};
    for(const l of tLogs){
      const buyer = ('0x'+l.topics[2].slice(-40)).toLowerCase();
      const n = BigInt('0x'+(l.data||'0x').replace(/^0x/,'').slice(0,64));
      ticketsBy[buyer] = (ticketsBy[buyer]||0n) + n;
    }
    const earnBy = {}; // buyer => {e1: 我做直推拿的, e2: 我做间推拿的}
    for(const l of rLogs){
      const d = (l.data||'0x').replace(/^0x/,'');
      const buyer = ('0x'+l.topics[2].slice(-40)).toLowerCase();
      const l1 = ('0x'+d.slice(0,64).slice(-40)).toLowerCase();
      const dd1 = BigInt('0x'+(d.slice(64,128)||'0'));
      const l2 = ('0x'+d.slice(128,192).slice(-40)).toLowerCase();
      const dd2 = BigInt('0x'+(d.slice(192,256)||'0'));
      if(!earnBy[buyer]) earnBy[buyer] = {e1:0n, e2:0n};
      if(l1===me) earnBy[buyer].e1 += dd1;
      if(l2===me) earnBy[buyer].e2 += dd2;
    }
    const sum = (arr, f) => arr.reduce((a,b)=>a+f(b), 0n);
    const dTk = sum(direct, b => ticketsBy[b]||0n);
    const iTk = sum(indirect, b => ticketsBy[b]||0n);
    const dEarn = sum(direct, b => (earnBy[b]||{e1:0n}).e1);
    const iEarn = sum(indirect, b => (earnBy[b]||{e2:0n}).e2);
    $('refDirectStat').textContent = t('refStatLine', {n: direct.length, tk: dTk.toString(), amt: fmt(dEarn)});
    $('refIndirectStat').textContent = t('refStatLine', {n: indirect.length, tk: iTk.toString(), amt: fmt(iEarn)});
    let html = '';
    const row = (b, tag) => {
      const e = earnBy[b]||{e1:0n,e2:0n};
      const amt = tag==='d' ? e.e1 : e.e2;
      html += '<div class="winner"><span><span class="tag">'+t(tag==='d'?'refTagD':'refTagI')+'</span>'+short(b)+'</span><span>'+t('refRowStat',{tk:(ticketsBy[b]||0n).toString(), amt:fmt(amt)})+'</span></div>';
    };
    direct.forEach(b => row(b,'d'));
    indirect.forEach(b => row(b,'i'));
    $('refDetailList').innerHTML = html || '<div class="note">'+t('refNoInvite')+'</div>';
    box.style.display='';
  }catch(e){ console.error('refStats', e); box.style.display='none'; }
}
async function loadHistory(){
  try{
    const logs = (await scanLogs([EV_WIN])).slice();
    if(!logs.length){
      $('historyList').innerHTML = '<div class="note">'+t('noHistory')+'</div>';
      $('leaderboard').innerHTML = '<div class="note">'+t('noData')+'</div>';
      return;
    }
    const total = {}; // addr -> {count, amount}
    let hhtml = '';
    // 按 roundId 排序（从 topic1 取）
    logs.sort((a,b)=> Number(BigInt(a.topics[1])) - Number(BigInt(b.topics[1])));
    for(const lg of logs){
      const rid = Number(BigInt(lg.topics[1]));
      const d = (lg.data||'0x').replace(/^0x/,'');
      const offW = Number(BigInt('0x'+d.slice(0,64)))*2;
      const offA = Number(BigInt('0x'+d.slice(64,128)))*2;
      const winners = decAddrArray(d, offW), amounts = decUintArray(d, offA);
      let sum = 0n;
      let wh = '';
      for(let i=0;i<winners.length;i++){
        sum += amounts[i];
        const k = winners[i].toLowerCase();
        if(!total[k]) total[k] = {n:0, amt:0n};
        total[k].n++; total[k].amt += amounts[i];
        const pz = i===0?t('prize1'):(i<4?t('prize2'):t('prize3'));
        wh += '<div class="winner"><span><span class="tag">'+pz+'</span>'+short(winners[i])+'</span><span><b>'+fmt(amounts[i])+'</b></span></div>';
      }
      hhtml = '<div style="margin-bottom:10px"><div class="row"><span class="k"><b>'+t('roundN',{n:rid})+'</b></span><span class="v">'+t('totalPaid',{amt:fmt(sum)})+'</span></div>'+wh
        + '<div style="margin-top:4px"><button class="btn-verify" onclick="verifyRound('+rid+',\'hv'+rid+'\')">'+t('verifyBtn')+'</button><div id="hv'+rid+'"></div></div>'
        + '</div>' + hhtml;
    }
    $('historyList').innerHTML = hhtml || '<div class="note">'+t('noHistory')+'</div>';
    // 累计榜
    const arr = Object.entries(total).sort((a,b)=> Number(b[1].amt - a[1].amt)).slice(0,10);
    const medal = ['🥇','🥈','🥉'];
    let lh = '';
    arr.forEach(([addr, st], i)=>{
      lh += '<div class="winner"><span>'+(medal[i]||(i+1)+'.')+' '+short(addr)+'</span><span>'+t('wonTimes',{n:st.n, amt:fmt(st.amt)})+'</span></div>';
    });
    $('leaderboard').innerHTML = lh || '<div class="note">'+t('noData')+'</div>';
  }catch(e){
    console.error('history', e);
    $('historyList').innerHTML = '<div class="note">'+t('loadFail')+'</div>';
    $('leaderboard').innerHTML = '<div class="note">'+t('loadFail')+'</div>';
  }
}
async function approve(){
  // 一次授权覆盖最多 200 张票（当前票价），之后复购免再授权；额度有限，比无限授权更稳妥
  await sendTx(CFG.token, '0x'+SEL.approve+encAddr(CFG.CONTRACT)+encUint(TICKET*200n));
  toast(t('approveOk'));
}
async function buy(){
  const ref = getRef();
  if(ref) await sendTx(CFG.CONTRACT, '0x'+SEL.buyTicketsWithRef+encUint(buyN)+encAddr(ref));
  else await sendTx(CFG.CONTRACT, '0x'+SEL.buyTickets+encUint(buyN));
  toast(t('buyOk')); sfx('success');
}
// 邀请人：从 URL ?ref=0x... 读取；自己邀请自己无效（合约层也会拒绝）
function getRef(){
  try{
    const saved = localStorage.getItem('anubis_joined_ref');
    if(saved && /^0x[0-9a-fA-F]{40}$/.test(saved)){
      if(myAddr && saved.toLowerCase()===myAddr.toLowerCase()) return null;
      return saved;
    }
  }catch(e){}
  try{
    const r = new URLSearchParams(location.search).get('ref');
    if(r && /^0x[0-9a-fA-F]{40}$/.test(r)){
      if(myAddr && r.toLowerCase()===myAddr.toLowerCase()) return null;
      return r;
    }
  }catch(e){}
  return null;
}
function pendingRef(){
  try{
    var saved=localStorage.getItem('anubis_joined_ref');
    if(saved && /^0x[0-9a-fA-F]{40}$/.test(saved)) return null;
    var r=new URLSearchParams(location.search).get('ref');
    if(r && /^0x[0-9a-fA-F]{40}$/.test(r)){
      if(myAddr && r.toLowerCase()===myAddr.toLowerCase()) return null;
      return r;
    }
  }catch(e){}
  return null;
}
function joinRef(){
  const r = new URLSearchParams(location.search).get('ref');
  if(r && /^0x[0-9a-fA-F]{40}$/.test(r)){
    try{ localStorage.setItem('anubis_joined_ref', r); }catch(e){}
    toast(t('joinOk'));
  }
}
function renderJoinView(){
  var r=pendingRef();
  var e=$('joinAddr'); if(e) e.textContent=r?short(r):'-';
}
async function joinAndEnter(){
  joinRef();
  if(!myAddr){ try{ await connect(); }catch(e){} }
  showView('home');
}
function copyRefLink(){
  const el = $('refLink');
  if(!el || !el.value) return;
  el.select();
  try{ document.execCommand('copy'); }catch(e){}
  if(navigator.clipboard) navigator.clipboard.writeText(el.value).catch(()=>{});
  toast(t('copyOk'));
}
async function claimReferral(){
  await sendTx(CFG.CONTRACT, '0x'+SEL.claimReferral);
  toast(t('claimOk'));
}
async function refreshReferral(){
  const link = $('refLink');
  if(link) link.value = myAddr ? (location.origin + location.pathname + '?ref=' + myAddr) : '';
  if(link) link.placeholder = myAddr ? '' : t('notConnected');
  const banner = $('refViaBanner');
  if(banner) banner.style.display = getRef() ? '' : 'none';
  if(!myAddr){
    if($('myReferrer')) $('myReferrer').textContent='-';
    if($('myRefRewards')) $('myRefRewards').textContent='-';
    if($('claimRefBtn')) $('claimRefBtn').style.display='none';
    return;
  }
  try{
    const r = decAddr(await ethCall(CFG.CONTRACT,'0x'+SEL.referrer+encAddr(myAddr)));
    $('myReferrer').textContent =
      (r==='0x0000000000000000000000000000000000000000') ? t('noReferrer') : short(r);
  }catch(e){ $('myReferrer').textContent='-'; }
  try{
    const rw = decUint(await ethCall(CFG.CONTRACT,'0x'+SEL.referralRewards+encAddr(myAddr)));
    $('myRefRewards').textContent = fmt(rw)+' '+TSYM();
    $('claimRefBtn').style.display = rw>0n ? '' : 'none';
  }catch(e){ $('myRefRewards').textContent='-'; }
}
async function closeRound(){ await sendTx(CFG.CONTRACT,'0x'+SEL.closeRound); toast(t('closedOk')); }
async function sendTxQuiet(to,d){
  const tx = {from:myAddr,to,data:d};
  if (chainKey === 'anubis'){
    tx.type = '0x0';
    tx.gasPrice = await req('eth_gasPrice',[]);
  }
  const hash = await req('eth_sendTransaction',[tx]);
  for (let i=0;i<150;i++){
    await new Promise(r=>setTimeout(r,2000));
    const rc = await req('eth_getTransactionReceipt',[hash]);
    if (rc && rc.blockNumber && rc.blockNumber!=='0x0'){
      if (rc.status==='0x1'){ await refresh(true); return rc; }
      throw new Error(t('txReverted'));
    }
  }
  throw new Error(t('txTimeout', {h: hash}));
}
async function drawVisual(){
  const ov=$('drawOverlay'), stage=$('ballStage'), res=$('drawResults'), st=$('drawStatus');
  ov.classList.add('show'); res.innerHTML=''; $('drawClose').style.display='none';
  stage.innerHTML='';
  const balls=[];
  for(let i=0;i<14;i++){
    const b=document.createElement('div'); b.className='ball'; b.textContent='?';
    b.style.animationDuration=(0.7+Math.random()*0.9).toFixed(2)+'s';
    b.style.animationDelay=(Math.random()*0.6).toFixed(2)+'s';
    stage.appendChild(b); balls.push(b);
  }
  const rnd=setInterval(()=>{ balls.forEach(b=>{ if(!b.dataset.done) b.textContent=Math.floor(Math.random()*99)+1; }); },120);
  const stop=()=>clearInterval(rnd);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  try{
    if(!myAddr) throw new Error(t('needWallet'));
    const ridBefore=Number(decUint(await ethCall(CFG.CONTRACT,'0x'+SEL.currentRound)));
    st.textContent=t('waitingConfirm');
    await sendTxQuiet(CFG.CONTRACT,'0x'+SEL.draw);
    const ridAfter=Number(decUint(await ethCall(CFG.CONTRACT,'0x'+SEL.currentRound)));
    if(ridAfter<=ridBefore){
      stop();
      st.textContent=t('hashExpired');
      $('drawClose').style.display='block';
      return;
    }
    st.textContent=t('drawSuccess');
    const wh=await ethCall(CFG.CONTRACT,'0x'+SEL.getLastWinners);
    const offW=Number(decUint(wh.slice(0,64)))*2, offA=Number(decUint(wh.slice(64,128)))*2;
    const winners=decAddrArray(wh,offW), amounts=decUintArray(wh,offA);
    stop();
    if(!winners.length){
      balls.forEach(b=>{ b.classList.add('out'); b.textContent='-'; });
      st.textContent=t('noBuyers');
      $('drawClose').style.display='block';
      return;
    }
    // 名次:[0]=一等奖,[1..3]=二等奖,[4..13]=三等奖;先揭三等奖,最后揭一等奖
    const order=[];
    for(let i=4;i<winners.length;i++) order.push({i,t:'t3',label:t('prize3')});
    for(let i=1;i<Math.min(4,winners.length);i++) order.push({i,t:'t2',label:t('prize2')});
    order.push({i:0,t:'t1',label:t('prize1')});
    let bi=0;
    for(const o of order){
      const b=balls[bi++]; b.dataset.done='1';
      b.className='ball '+o.t; b.textContent=o.label[0];
      const row=document.createElement('div'); row.className='wrow';
      row.innerHTML='<span><span class="tag">'+o.label+'</span><span class="wa">'+short(winners[o.i])+'</span></span><span class="wamt">'+fmt(amounts[o.i])+' '+TSYM()+'</span>';
      res.appendChild(row);
      if(o.t==='t1'){ st.textContent=t('firstBorn'); sfx('win'); }
      await sleep(o.t==='t1'?1200:650);
    }
    balls.slice(bi).forEach(b=>{ b.classList.add('out'); b.textContent='-'; });
    st.textContent=t('drawDone');
    $('drawClose').style.display='block';
  }catch(e){
    stop();
    st.textContent=t('drawFail', {m: e.message||e});
    $('drawClose').style.display='block';
  }
}
function closeDraw(){ $('drawOverlay').classList.remove('show'); refresh(true); }
async function approveSeed(){
  const amt = parseUnits($('seedAmt').value||'0');
  if (amt<=0n) return toast(t('enterAmt'));
  await sendTx(CFG.token,'0x'+SEL.approve+encAddr(CFG.CONTRACT)+encUint(amt));
  toast(t('seedApproveOk'));
}
async function seed(){
  const amt = parseUnits($('seedAmt').value||'0');
  if (amt<=0n) return toast(t('enterAmt'));
  if(!confirm(t('seedConfirm', {amt: $('seedAmt').value}))) return;
  await sendTx(CFG.CONTRACT,'0x'+SEL.seedJackpot+encUint(amt));
  toast(t('seedDone'));
}
function setPriceQuick(v){
  $('priceAmt').value = v;
  updatePriceEcho();
}
function updatePriceEcho(){
  const v = ($('priceAmt').value || '').trim();
  const el = $('priceEcho');
  if(!el) return;
  if(v) el.textContent = '👉 ' + t('priceEcho', {p: v});
  else el.textContent = TICKET > 0n ? t('priceCur', {p: fmt(TICKET)}) : '';
}
async function doSetTicketPrice(){
  const v = ($('priceAmt').value || '0').trim();
  let amt = 0n;
  try{ amt = parseUnits(v); }catch(e){ return toast(t('amtBad')); }
  if(amt <= 0n) return toast(t('enterAmt'));
  if(!confirm(t('priceConfirm', {p: v}))) return;
  await sendTx(CFG.CONTRACT,'0x'+SEL.setTicketPrice+encUint(amt));
  $('priceAmt').value=''; updatePriceEcho();
  toast(t('priceDone', {p: v}));
  await refresh();
}
async function doSetRoundDuration(){
  if(!confirm(t('durationConfirm'))) return;
  await sendTx(CFG.CONTRACT,'0x'+SEL.setRoundDuration+encUint(3600n));
  toast(t('durationDone'));
  await refresh();
}
setInterval(()=>refresh(), 15000);
setInterval(tickCountdown, 1000);
/* ===== 首页视图逻辑（复用彩票的 POOLS/ethCall/t/formatUnits 等） ===== */
var HG=['img/hg1.jpg.b64','img/hg2.jpg.b64','img/hg3.jpg.b64'];
var POOLMETA=[{c:'#1E5541'},{c:'#2E7D6A'},{c:'#9A834F'},{c:'#4A6B8A'},{c:'#8A5A3C'}];
var HGAMES=[
  {zh:['龙虎斗','经典对押玩法，押中赢取奖池，链上实时结算、公平可查。'],en:['Dragon vs Tiger','Classic head-to-head betting, settled on-chain and verifiable.']},
  {zh:['幸运转盘','转动命运之轮，赢取随机大奖。'],en:['Lucky Wheel','Spin the wheel of fate for random rewards.']},
  {zh:['竞技场','多人同场竞技，胜者瓜分奖池。'],en:['Arena','Multiplayer showdown, winners split the pool.']}
];
var HHELP=[
  {zh:['准备钱包','安装并打开支持 Anubis 链的钱包（如 OKX Wallet），用钱包自带浏览器访问本站。'],en:['Get a wallet','Install a wallet that supports Anubis (e.g. OKX), open this site in its in-app browser.']},
  {zh:['切换网络','连接后按提示切换到 Anubis 链；网络不对时页面会提醒。'],en:['Switch network','After connecting, switch to Anubis when prompted.']},
  {zh:['准备代币与 Gas','准备对应奖池的代币（LGNS / USDT / DAI / A / RM）以及少量 Gas。'],en:['Tokens & gas','Hold the pool token (LGNS/USDT/DAI/A/RM) and a little gas.']},
  {zh:['了解规则','看懂票价、奖项、开奖与返佣规则，再参与。'],en:['Read the rules','Understand price, prizes, draw and referral before playing.']}
];
var HNOTE={zh:'<b>费用</b>：开奖按比例扣平台费，其余按奖项派给中奖者。<br><b>授权</b>：首次用某代币买票需先授权一次，之后直接购票。<br><b>开奖</b>：每期截止后锁定开奖区块，用之后的区块哈希做随机源，任何人可触发开奖。<br><b>记录</b>：历史开奖、我的票据、邀请返佣都在彩票页，全部链上可查。',en:'<b>Fees</b>: a platform fee is deducted at draw; the rest goes to winners by tier.<br><b>Approval</b>: first purchase with a token needs one approval.<br><b>Draw</b>: a future block hash after cutoff is the random source; anyone can trigger it.<br><b>Records</b>: history, your tickets and referrals live on the lottery page, all on-chain.'};
var hpool={};
function hcd(tt){var s=tt-Math.floor(Date.now()/1000);if(s<0)s=0;var h=String(Math.floor(s/3600)).padStart(2,'0'),m=String(Math.floor(s%3600/60)).padStart(2,'0'),x=String(s%60).padStart(2,'0');return h+':'+m+':'+x;}
function fmtD(v,dec){return Number(formatUnits(v,dec)).toLocaleString('en-US',{maximumFractionDigits:2});}
function fmtPr(v,dec){var s=BigInt(v).toString().padStart(dec+1,'0');var i=s.slice(0,-dec),f=s.slice(-dec).replace(/0+$/,'');return i+(f?'.'+f:'');}
function loadHPool(i){
  var P=POOLS[i], st=hpool[i]||(hpool[i]={});
  return ethCall(P.CONTRACT,'0x'+SEL.ticketPrice).then(function(h){st.price=decUint(h);return ethCall(P.CONTRACT,'0x'+SEL.currentRound);})
    .then(function(h){st.round=Number(decUint(h));return ethCall(P.CONTRACT,'0x'+SEL.rounds+encUint(st.round));})
    .then(function(h){var w=function(k){return h.slice(k*64,(k+1)*64);};st.endTime=Number(decUint(w(0)));var db=Number(decUint(w(1)));st.pool=decUint(w(3))+decUint(w(4));var now=Math.floor(Date.now()/1000);st.phase=now<=st.endTime?'live':(db===0?'closed':'draw');st.ok=true;return st;})
    .catch(function(){st.ok=false;return st;});
}
function renderHPools(){
  var box=$('hPools'); if(!box)return; var html='';
  POOLS.forEach(function(P,i){var st=hpool[i]||{};var price=st.ok?fmtPr(st.price,P.decimals)+' '+P.sym+(LANG==='zh'?'/张':'/tk'):(st.ok===false?t('hFail'):t('hLoading'));
    html+='<div class="h-pcard'+(i===poolIdx?' on':'')+'" onclick="homePickPool('+i+')"><div class="h-pbadge" style="background:'+POOLMETA[i].c+'">'+P.sym.charAt(0)+'</div><div class="h-psym">'+P.sym+(LANG==='zh'?' 池':'')+'</div><div class="h-pprice">'+price+'</div></div>';});
  box.innerHTML=html;
}
function renderHFeature(){
  var P=POOLS[poolIdx], st=hpool[poolIdx]||{}, e;
  if(e=$('hSym'))e.textContent=P.sym;
  var hp=$('hPool');
  if(st.ok){
    if(hp){hp.classList.remove('skel');hp.innerHTML=fmtD(st.pool,P.decimals)+'<span class="u" id="hUnit">'+P.sym+'</span>';}
    if(e=$('hPrice'))e.textContent=fmtPr(st.price,P.decimals)+' '+P.sym;
    if(e=$('hRound'))e.textContent=(LANG==='zh'?'第 '+st.round+' 期 · ':'Round '+st.round+' · ')+(st.phase==='live'?t('hSelling'):st.phase==='closed'?t('hClosed'):t('hDraw'));
    if(e=$('hEnd'))e.textContent=st.phase==='live'?hcd(st.endTime):t('hClosed');
  }else{
    if(hp){hp.classList.add('skel');hp.innerHTML='—<span class="u" id="hUnit">'+P.sym+'</span>';}
    var u=$('hUnit'); if(u)u.textContent=P.sym;
  }
}
function homePickPool(i){ sfx('switch'); setPool(i); renderHPools(); renderHFeature(); }
function renderHGames(){var box=$('hGames');if(!box)return;var html='';HGAMES.forEach(function(g,i){var d=g[LANG]||g.zh;html+='<div class="h-game" role="button" tabindex="0" onclick="gameIntro('+i+')"><img data-b64src="'+HG[i]+'" src="" alt="'+d[0]+'" loading="lazy"></div>';});box.innerHTML=html; loadB64Imgs();}
function renderHHelp(){var box=$('hHelp');if(!box)return;var html='';HHELP.forEach(function(s,i){var d=s[LANG]||s.zh;html+='<div class="h-step"><div class="n">'+(i+1)+'</div><h3>'+d[0]+'</h3><p>'+d[1]+'</p></div>';});box.innerHTML=html;var n=$('hNote');if(n)n.innerHTML=HNOTE[LANG]||HNOTE.zh;}
function openHModal(o){var m=$('hmodal');if(!m)return;$('hmTitle').textContent=o.t;$('hmBody').innerHTML=o.b;m.classList.add('open');}
function closeHModal(){var m=$('hmodal');if(m)m.classList.remove('open');}
function gameIntro(i){var d=HGAMES[i][LANG]||HGAMES[i].zh;openHModal({t:d[0],b:d[1]+(LANG==='zh'?'<br><br>该游戏正在开发中，敬请期待。':'<br><br>In development. Stay tuned.')});}
function RULES_T(){return {t:t('hRules'),b:t('hRulesBody')};}
function NOTICE_T(){return {t:t('noticeT'),b:t('noticeB')};}
// 平台级邀请奖励：覆盖全部奖池，逐池按各自币种结算与提取
var invClaim={};
async function loadInvite(){
  var ZERO='0x0000000000000000000000000000000000000000';
  var link=$('refLink'); if(link){ link.value=myAddr?(location.origin+location.pathname+'?ref='+myAddr):''; link.placeholder=myAddr?'':t('notConnected'); }
  var ie=$('invEmpty'), mr=$('myReferrer'), pl=$('invPoolList'), d=$('refDirectStat'), g=$('refIndirectStat');
  if(!myAddr){ if(ie)ie.hidden=false; if(mr)mr.textContent='-'; if(pl)pl.innerHTML=''; if(d)d.textContent='-'; if(g)g.textContent='-'; return; }
  if(ie)ie.hidden=true;
  invClaim={}; var rows='', ref=ZERO;
  for(var i=0;i<POOLS.length;i++){
    var P=POOLS[i], rw=0n;
    try{ rw=decUint(await ethCall(P.CONTRACT,'0x'+SEL.referralRewards+encAddr(myAddr))); }catch(e){}
    if(ref===ZERO){ try{ var rr=decAddr(await ethCall(P.CONTRACT,'0x'+SEL.referrer+encAddr(myAddr))); if(rr!==ZERO)ref=rr; }catch(e){} }
    invClaim[i]=rw; var has=rw>0n;
    rows+='<div class="inv-row"><span class="inv-rn"><span class="inv-dot" style="background:'+POOLMETA[i].c+'"></span>'+P.sym+(LANG==='zh'?' 池':'')+'</span>'
      +'<span class="inv-ra">'+fmtD(rw,P.decimals)+' '+P.sym+'</span>'
      +(has?'<button class="inv-claim" onclick="claimPool('+i+')">'+t('claimRefBtn')+'</button>':'<span class="inv-ra0">'+t('invNone')+'</span>')+'</div>';
  }
  if(mr)mr.textContent = ref===ZERO ? t('noReferrer') : short(ref);
  if(pl)pl.innerHTML=rows;
  loadInviteStats(myAddr.toLowerCase());

  try{ loadCommissionLedger(); }catch(e){}
}
async function loadInviteStats(me){
  var bound={};
  for(var i=0;i<POOLS.length;i++){
    var P=POOLS[i];
    try{ var bl=await scanLogs([EV_REFBOUND],P.CONTRACT,P.deployBlock);
      for(var j=0;j<bl.length;j++){ var l=bl[j]; var buyer=('0x'+l.topics[1].slice(-40)).toLowerCase(); var rf=('0x'+l.topics[2].slice(-40)).toLowerCase(); bound[buyer]=rf; }
    }catch(e){}
  }
  var dset={}, dc=0;
  for(var b in bound){ if(bound[b]===me){ dset[b]=1; dc++; } }
  var ic=0;
  for(var b in bound){ if(!dset[b] && b!==me && dset[bound[b]]) ic++; }
  var d=$('refDirectStat'), g=$('refIndirectStat');
  if(d)d.textContent=dc+(LANG==='zh'?' 人':'');
  if(g)g.textContent=ic+(LANG==='zh'?' 人':'');
}
function claimPool(i){ sendTx(POOLS[i].CONTRACT,'0x'+SEL.claimReferral).then(function(){ toast(t('claimOk')); loadInvite(); }).catch(function(e){ toast(e.message||e); }); }
// 我的记录：汇总各奖池的买票/花费/中奖/净盈亏（按各自币种）
async function loadRecords(){
  var ie=$('recEmpty'), box=$('recList');
  if(!myAddr){ if(ie)ie.hidden=false; if(box)box.innerHTML=''; return; }
  if(ie)ie.hidden=true;
  var me=myAddr.toLowerCase(), rows='';
  for(var i=0;i<POOLS.length;i++){
    var P=POOLS[i], tickets=0n, winCnt=0, winAmt=0n, price=0n;
    try{ price=decUint(await ethCall(P.CONTRACT,'0x'+SEL.ticketPrice)); }catch(e){}
    try{ var tl=await scanLogs([EV_TICKETS],P.CONTRACT,P.deployBlock);
      for(var j=0;j<tl.length;j++){ var l=tl[j]; if(('0x'+l.topics[2].slice(-40)).toLowerCase()!==me)continue; tickets+=BigInt('0x'+((l.data||'0x').replace(/^0x/,'')).slice(0,64)||'0'); }
    }catch(e){}
    try{ var wl=await scanLogs([EV_WIN],P.CONTRACT,P.deployBlock);
      for(var j=0;j<wl.length;j++){ var l=wl[j]; var d=(l.data||'0x').replace(/^0x/,''); var offW=Number(BigInt('0x'+d.slice(0,64)))*2, offA=Number(BigInt('0x'+d.slice(64,128)))*2; var ws=decAddrArray(d,offW), as=decUintArray(d,offA); for(var k=0;k<ws.length;k++){ if(ws[k].toLowerCase()===me){ winCnt++; winAmt+=as[k]; } } }
    }catch(e){}
    var spent=tickets*price, net=winAmt-spent, neg=net<0n, na=neg?-net:net;
    rows+='<div class="rec-row"><span class="rec-p"><span class="inv-dot" style="background:'+POOLMETA[i].c+'"></span>'+P.sym+(LANG==='zh'?' 池':'')+'</span>'
      +'<span class="rec-c">'+tickets.toString()+(LANG==='zh'?' 张':'')+'</span>'
      +'<span class="rec-c">≈ '+fmtD(spent,P.decimals)+' '+P.sym+'</span>'
      +'<span class="rec-c">'+winCnt+(LANG==='zh'?' 次 / ':'× / ')+fmtD(winAmt,P.decimals)+'</span>'
      +'<span class="rec-c" style="color:'+(neg?'#B23B3B':'#3E6B4F')+';font-weight:700">'+(neg?'-':'+')+fmtD(na,P.decimals)+' '+P.sym+'</span></div>';
  }
  if(box)box.innerHTML=rows;
}
function goRecords(){ showView('play'); setTimeout(function(){ var e=$('sec-my'); if(e)e.scrollIntoView({behavior:'smooth',block:'start'}); },120); }
// 游戏音效：Web Audio 合成，无需音频文件；默认关，用户点喇叭开启
var AC=null, sndOn=false; try{ sndOn=localStorage.getItem('ap_snd')==='1'; }catch(e){}
var SND_ON='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a3 3 0 010 6M18.5 7a6 6 0 010 10"/></svg>';
var SND_OFF='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/></svg>';
function sndInit(){ try{ if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)(); if(AC&&AC.state==='suspended')AC.resume(); }catch(e){} }
function beep(freq,dur,type,vol,delay){ if(!AC)return; var t=AC.currentTime+(delay||0),o=AC.createOscillator(),g=AC.createGain(); o.type=type||'sine'; o.frequency.value=freq; o.connect(g); g.connect(AC.destination); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol||0.06,t+0.012); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.start(t); o.stop(t+dur+0.03); }
function sfx(kind){ if(!sndOn)return; sndInit(); if(!AC)return;
  if(kind==='click'){ beep(520,0.07,'triangle',0.04); }
  else if(kind==='switch'){ beep(440,0.06,'sine',0.045); beep(660,0.08,'sine',0.04,0.04); }
  else if(kind==='win'){ [523,659,784,1047].forEach(function(f,i){ beep(f,0.2,'triangle',0.07,i*0.1); }); }
  else if(kind==='success'){ beep(587,0.12,'sine',0.06); beep(880,0.16,'sine',0.055,0.1); }
}
function updateSndBtn(){ var b=$('sndBtn'); if(b)b.innerHTML=sndOn?SND_ON:SND_OFF; }
function toggleSnd(){ sndOn=!sndOn; try{localStorage.setItem('ap_snd',sndOn?'1':'0');}catch(e){} if(sndOn){ sndInit(); sfx('click'); } updateSndBtn(); }
document.addEventListener('click',function(e){ if(!sndOn)return; var t=e.target.closest('button,a.h-btn,.hpc,.qbtn,.h-gold,.hbar-btn,.inv-claim,.pback,.pnav-links a,.game'); if(t&&t.id!=='sndBtn') sfx('click'); },true);
// 中奖播报：从链上开奖事件取真实中奖者，左下角滚动通知（无真实数据则不弹）
var WINLIST=[], winIdx=0, winTimer=null, winOff=false;
async function loadWinners(){
  var list=[];
  for(var i=0;i<POOLS.length;i++){
    var P=POOLS[i];
    try{ var wl=await scanLogs([EV_WIN],P.CONTRACT,P.deployBlock); wl=wl.slice(-2);
      for(var j=0;j<wl.length;j++){ var l=wl[j]; var rid=Number(BigInt(l.topics[1])); var d=(l.data||'0x').replace(/^0x/,''); var offW=Number(BigInt('0x'+d.slice(0,64)))*2, offA=Number(BigInt('0x'+d.slice(64,128)))*2; var ws=decAddrArray(d,offW), as=decUintArray(d,offA);
        for(var k=0;k<ws.length;k++){ list.push({a:ws[k],amt:as[k],dec:P.decimals,sym:P.sym,tier:(k===0?1:(k<4?2:3)),rid:rid}); }
      }
    }catch(e){}
  }
  WINLIST=list;
}
function winShowNext(){
  var el=$('winToast'); if(!el)return;
  var home=$('view-home');
  if(winOff || !WINLIST.length || (home&&home.hidden)){ el.classList.remove('show'); return; }
  var w=WINLIST[winIdx%WINLIST.length]; winIdx++;
  var tier=w.tier===1?t('prize1'):(w.tier===2?t('prize2'):t('prize3'));
  var tx=$('winTxt'); if(tx) tx.innerHTML=short(w.a)+' · '+w.sym+(LANG==='zh'?' 池 ':' ')+tier+' <b>'+fmtD(w.amt,w.dec)+' '+w.sym+'</b>';
  el.classList.add('show');
  setTimeout(function(){ el.classList.remove('show'); },5200);
}
function winClose(){ var el=$('winToast'); if(el)el.classList.remove('show'); winOff=true; }
function winStart(){ if(winTimer)clearInterval(winTimer); setTimeout(winShowNext,1500); winTimer=setInterval(winShowNext,9000); }
// 首屏广告轮播
var apSlide=0, apTimer=null;
function apShow(n){ var s=document.querySelectorAll('#view-home .hslide'); if(!s.length)return; apSlide=(n+s.length)%s.length; for(var i=0;i<s.length;i++)s[i].classList.toggle('on',i===apSlide); var d=document.querySelectorAll('#view-home .hero-dots span'); for(var i=0;i<d.length;i++)d[i].classList.toggle('on',i===apSlide); }
function apPause(){ if(apTimer){clearInterval(apTimer);apTimer=null;} }
function apStart(){ apPause(); try{ if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return; }catch(e){} apTimer=setInterval(function(){apShow(apSlide+1);},5000); }
function renderHome(){renderHPools();renderHFeature();renderHGames();renderHHelp();}
function loadHome(){POOLS.forEach(function(P,i){loadHPool(i).then(function(){renderHPools();if(i===poolIdx)renderHFeature();});});}
function showView(v){
  var home=$('view-home'),play=$('view-play'),inv=$('view-invite'),rec=$('view-records'),acc=$('view-account'),jn=$('view-join'),pb=$('pback');
  if(home)home.hidden=(v!=='home');
  if(play)play.hidden=(v!=='play');
  if(inv)inv.hidden=(v!=='invite');
  if(rec)rec.hidden=(v!=='records');
  if(acc)acc.hidden=(v!=='account');
  if(jn)jn.hidden=(v!=='join');
  if(pb)pb.hidden=(v==='home'||v==='join');
  try{location.hash=v;}catch(e){}
  if(v==='play'){ refresh(true); }
  else if(v==='invite'){ loadInvite(); }
  else if(v==='records'){ loadRecords(); }
  else if(v==='account'){ loadAccount(); }
  else if(v==='join'){ renderJoinView(); }
  else{ renderHome(); loadHome(); }
  try{window.scrollTo(0,0);}catch(e){}
}
document.addEventListener('keydown',function(e){ if(e.key==='Escape')closeHModal(); });
setInterval(function(){var hm=$('view-home');if(hm&&!hm.hidden){var st=hpool[poolIdx];if(st&&st.ok&&st.phase==='live'){var e=$('hEnd');if(e)e.textContent=hcd(st.endTime);}}},1000);

/* ===== V1.0：用户中心 / 二维码 / 佣金明细 / 公告 ===== */
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
const EV_REFCLAIMED = '0x6cd4d40588b17656762e007b5b0c873a86cc13d23123cd1c44b4389b8aafa105';
var _blkTimeCache = {};
var _qrLoaded = false, _qrLoading = null;
function pdec(i){ return (POOLS[i].payTokens && POOLS[i].payTokens[0] && POOLS[i].payTokens[0].dec) || 18; }
function accCopy(id){
  var e=$(id); if(!e||!e.value) return;
  try{ if(navigator.clipboard) navigator.clipboard.writeText(e.value); else { e.select(); document.execCommand('copy'); } toast(t('copyOk')); }catch(err){}
}
function loadQrLib(){
  if(typeof qrcode !== 'undefined'){ _qrLoaded=true; return Promise.resolve(); }
  if(_qrLoaded) return Promise.resolve();
  if(_qrLoading) return _qrLoading;
  _qrLoading = new Promise(function(res, rej){
    var s=document.createElement('script'); s.src='qrcode.min.js?v=1';
    s.onload=function(){ _qrLoaded=true; res(); }; s.onerror=rej;
    document.head.appendChild(s);
  });
  return _qrLoading;
}
function openQrModal(){
  var link=$('accLink')&&$('accLink').value;
  if(!link){ var rl=$('refLink'); link=rl&&rl.value; }
  if(!link){ toast(t('needWallet')); return; }
  openHModal({t:t('qrTitle'), b:'<div class="qrbox"><div class="note">'+t('loading')+'</div></div>'});
  loadQrLib().then(function(){
    try{
      var qr=qrcode(0,'M'); qr.addData(link); qr.make();
      var box=document.querySelector('#hmodal .qrbox');
      if(box) box.innerHTML=qr.createImgTag(6,8);
    }catch(e){ var b2=document.querySelector('#hmodal .qrbox'); if(b2) b2.innerHTML='<div class="note">'+t('loadFail')+'</div>'; }
  }).catch(function(){ var b3=document.querySelector('#hmodal .qrbox'); if(b3) b3.innerHTML='<div class="note">'+t('loadFail')+'</div>'; });
}
function shareRef(){
  var link=$('accLink')&&$('accLink').value;
  if(!link){ var rl=$('refLink'); link=rl&&rl.value; }
  if(!link){ toast(t('needWallet')); return; }
  var data={title:document.title, text:t('invSub'), url:link};
  if(navigator.share){ navigator.share(data).catch(function(){}); }
  else{ try{ if(navigator.clipboard) navigator.clipboard.writeText(link); toast(t('copyOk')); }catch(e){} }
}
async function blkTime(bn){
  var k=String(bn); if(_blkTimeCache[k]) return _blkTimeCache[k];
  try{
    var b=await req('eth_getBlockByNumber',['0x'+BigInt(bn).toString(16),false]);
    var ts=b&&b.timestamp?Number(BigInt(b.timestamp))*1000:0;
    _blkTimeCache[k]=ts; return ts;
  }catch(e){ return 0; }
}
function fmtTime(ts){
  if(!ts) return '-';
  var d=new Date(ts), p=function(n){return String(n).padStart(2,'0');};
  return (d.getMonth()+1)+'-'+d.getDate()+' '+p(d.getHours())+':'+p(d.getMinutes());
}
async function loadAccount(){
  var empty=$('accEmpty'), body=$('accBody');
  if(!myAddr){ if(empty)empty.hidden=false; if(body)body.hidden=true; return; }
  if(empty)empty.hidden=true; if(body)body.hidden=false;
  var me=myAddr.toLowerCase(), ZERO='0x0000000000000000000000000000000000000000';
  if($('accAddr')) $('accAddr').value=myAddr;
  var link=location.origin+location.pathname+'?ref='+myAddr;
  if($('accLink')) $('accLink').value=link;
  var refs=[];
  for(var i=0;i<POOLS.length;i++){ try{ var r=decAddr(await ethCall(POOLS[i].CONTRACT,'0x'+SEL.referrer+encAddr(myAddr))); if(r!==ZERO) refs.push(POOLS[i].sym+': '+short(r)); }catch(e){} }
  if($('accReferrer')) $('accReferrer').textContent=refs.length?refs.join(' · '):t('noReferrer');
  var dCount=0, iCount=0, dTxt=[], iTxt=[], claimTxt=[];
  try{
    var bLogs=await scanLogs([EV_REFBOUND],POOLS[0].CONTRACT,POOLS[0].deployBlock);
    for(var pi=1;pi<POOLS.length;pi++){ var bl=await scanLogs([EV_REFBOUND],POOLS[pi].CONTRACT,POOLS[pi].deployBlock); bLogs=bLogs.concat(bl); }
    var bound={};
    bLogs.forEach(function(l){ bound[('0x'+l.topics[1].slice(-40)).toLowerCase()]=('0x'+l.topics[2].slice(-40)).toLowerCase(); });
    var direct=Object.keys(bound).filter(function(b){return bound[b]===me;});
    var dset={}; direct.forEach(function(b){dset[b]=1;});
    var indirect=Object.keys(bound).filter(function(b){return b!==me && !dset[b] && dset[bound[b]];});
    dCount=direct.length; iCount=indirect.length;
    for(var qi=0;qi<POOLS.length;qi++){
      var rl=await scanLogs([EV_REFREWARD],POOLS[qi].CONTRACT,POOLS[qi].deployBlock);
      rl.forEach(function(l){
        var d=(l.data||'0x').replace(/^0x/,''), buyer=('0x'+l.topics[2].slice(-40)).toLowerCase();
        var l1=('0x'+d.slice(0,64).slice(-40)).toLowerCase(), dd1=BigInt('0x'+(d.slice(64,128)||'0'));
        var l2=('0x'+d.slice(128,192).slice(-40)).toLowerCase(), dd2=BigInt('0x'+(d.slice(192,256)||'0'));
        if(dset[buyer]&&l1===me&&dd1>0n) dTxt.push({sym:POOLS[qi].sym,dec:pdec(qi),amt:dd1});
        if(!dset[buyer]&&buyer!==me&&l2===me&&dd2>0n) iTxt.push({sym:POOLS[qi].sym,dec:pdec(qi),amt:dd2});
      });
    }
  }catch(e){ console.error('accRef', e); }
  if($('accL1')) $('accL1').textContent=dCount;
  if($('accL2')) $('accL2').textContent=iCount;
  var earnBySym={};
  dTxt.concat(iTxt).forEach(function(x){ if(!earnBySym[x.sym]) earnBySym[x.sym]={dec:x.dec,amt:0n}; earnBySym[x.sym].amt+=x.amt; });
  var earnStr=Object.keys(earnBySym).map(function(s){ return fmtD(earnBySym[s].amt,earnBySym[s].dec)+' '+s; }).join(' · ');
  if($('accEarn')) $('accEarn').textContent=earnStr||'0';
  var claimedBySym={};
  for(var ci=0;ci<POOLS.length;ci++){
    try{ var rw=decUint(await ethCall(POOLS[ci].CONTRACT,'0x'+SEL.referralRewards+encAddr(myAddr))); if(rw>0n) claimTxt.push(fmtD(rw,pdec(ci))+' '+POOLS[ci].sym); }catch(e){}
    try{ var cl=await scanLogs([EV_REFCLAIMED],POOLS[ci].CONTRACT,POOLS[ci].deployBlock);
      cl.forEach(function(l){ if(('0x'+l.topics[1].slice(-40)).toLowerCase()===me){ var a=BigInt('0x'+((l.data||'0x').replace(/^0x/,''))||'0'); if(!claimedBySym[POOLS[ci].sym]) claimedBySym[POOLS[ci].sym]={dec:pdec(ci),amt:0n}; claimedBySym[POOLS[ci].sym].amt+=a; } });
    }catch(e){}
  }
  if($('accClaimable')) $('accClaimable').textContent=claimTxt.length?claimTxt.join(' · '):'0';
  var claimedStr=Object.keys(claimedBySym).map(function(s){ return fmtD(claimedBySym[s].amt,claimedBySym[s].dec)+' '+s; }).join(' · ');
  if($('accClaimed')) $('accClaimed').textContent=claimedStr||'0';
  var games=[];
  for(var gi=0;gi<POOLS.length;gi++){
    try{ var tl=await scanLogs([EV_TICKETS],POOLS[gi].CONTRACT,POOLS[gi].deployBlock); var n=0n;
      tl.forEach(function(l){ if(('0x'+l.topics[2].slice(-40)).toLowerCase()===me) n+=BigInt('0x'+((l.data||'0x').replace(/^0x/,'')).slice(0,64)||'0'); });
      if(n>0n) games.push(POOLS[gi].sym+' × '+n.toString());
    }catch(e){}
  }
  if($('accGames')) $('accGames').innerHTML=games.length?games.map(function(g){return '<span class="acc-tag">'+esc(g)+'</span>';}).join(''):'<span class="note">'+t('noData')+'</span>';
  var txs=[];
  for(var hi=0;hi<POOLS.length;hi++){
    try{ var ll=await scanLogs([EV_TICKETS],POOLS[hi].CONTRACT,POOLS[hi].deployBlock);
      ll.forEach(function(l){ if(('0x'+l.topics[2].slice(-40)).toLowerCase()===me) txs.push({h:l.transactionHash,b:l.blockNumber,sym:POOLS[hi].sym,kind:'buy'}); });
    }catch(e){}
  }
  txs.sort(function(a,b){ return Number(BigInt(b.b)-BigInt(a.b)); });
  var showTx=txs.slice(0,10);
  for(var ti=0;ti<showTx.length;ti++){ showTx[ti].ts=await blkTime(showTx[ti].b); }
  if($('accTxList')) $('accTxList').innerHTML=showTx.length?showTx.map(function(x){
    return '<div class="kv"><span class="k">'+t('txBuy')+' · '+x.sym+' · '+fmtTime(x.ts)+'</span><span class="v"><a href="'+CFG.explorer+'/tx/'+x.h+'" target="_blank" rel="noopener">'+short(x.h)+'</a></span></div>';
  }).join(''):'<div class="note">'+t('noData')+'</div>';
}
async function loadCommissionLedger(){
  var box=$('commLedger'); if(!box) return;
  var me=myAddr?myAddr.toLowerCase():null;
  if(!me){ box.innerHTML='<div class="note">'+t('invConnect')+'</div>'; return; }
  box.innerHTML='<div class="note">'+t('loading')+'</div>';
  var rows=[];
  try{
    for(var i=0;i<POOLS.length;i++){
      var P=POOLS[i];
      var logs=await scanLogs([EV_REFREWARD],P.CONTRACT,P.deployBlock);
      for(var j=0;j<logs.length;j++){
        var l=logs[j], d=(l.data||'0x').replace(/^0x/,'');
        var buyer=('0x'+l.topics[2].slice(-40)).toLowerCase();
        var l1=('0x'+d.slice(0,64).slice(-40)).toLowerCase(), dd1=BigInt('0x'+(d.slice(64,128)||'0'));
        var l2=('0x'+d.slice(128,192).slice(-40)).toLowerCase(), dd2=BigInt('0x'+(d.slice(192,256)||'0'));
        var rid=Number(BigInt(l.topics[1]));
        if(l1===me&&dd1>0n) rows.push({bn:l.blockNumber,h:l.transactionHash,sym:P.sym,dec:pdec(i),tier:'d',buyer:buyer,rid:rid,amt:dd1});
        else if(l2===me&&dd2>0n) rows.push({bn:l.blockNumber,h:l.transactionHash,sym:P.sym,dec:pdec(i),tier:'i',buyer:buyer,rid:rid,amt:dd2});
      }
    }
  }catch(e){ console.error('commLedger',e); }
  rows.sort(function(a,b){ return Number(BigInt(b.bn)-BigInt(a.bn)); });
  var show=rows.slice(0,30);
  for(var k=0;k<show.length;k++){ show[k].ts=await blkTime(show[k].bn); }
  var html=show.map(function(r){
    return '<div class="winner"><span><span class="tag">'+t(r.tier==='d'?'refTagD':'refTagI')+'</span>'
      +r.sym+' · '+(LANG==='zh'?'第':'R')+r.rid+(LANG==='zh'?'期':'')+' · '+short(r.buyer)+'</span>'
      +'<span>+'+fmtD(r.amt,r.dec)+' '+r.sym+' <a href="'+CFG.explorer+'/tx/'+r.h+'" target="_blank" rel="noopener">'+short(r.h)+'</a><br><small style="color:var(--muted)">'+fmtTime(r.ts)+'</small></span></div>';
  }).join('');
  box.innerHTML=html||'<div class="note">'+t('noInviteYet')+'</div>';
}
async function loadAnnounce(){
  var bar=$('announceBar'); if(!bar) return;
  try{
    var r=await fetch('announce.json',{cache:'no-store'});
    if(!r.ok) return;
    var j=await r.json();
    var item=(j&&j.items||[]).filter(function(x){return x.on;})[0];
    if(!item) return;
    $('announceTxt').textContent=item[LANG==='zh'?'zh':'en'];
    bar.hidden=false;
  }catch(e){}
}
function hideAnnounce(){ var bar=$('announceBar'); if(bar) bar.hidden=true; }

window.addEventListener('load', ()=>{
  try{ var _ol=document.querySelector('.brand-logo'); if(_ol&&$('navLogo')) $('navLogo').src=_ol.src; }catch(e){}
  applyLang(); loadB64Imgs(); renderPoolTabs(); updateChainBtn(); updateWalletBtn(); setBuyN(1);
  loadAnnounce();
  var jr=pendingRef();
  if(jr){ renderJoinView(); showView('join'); }
  else{
    var sp=false; try{ sp=(location.hash==='#play')||(new URLSearchParams(location.search).get('pool')!==null); }catch(e){}
    showView(sp?'play':'home');
  }
  apShow(0); apStart(); updateSndBtn();
  loadWinners().then(winStart).catch(function(){});
});
