/* ANUBIS PLAY 黑金皇家 · 链上引擎（真钱 LGNS / Anubis）
   与原 game-engine.js 同接口、同 state 结构，但由真实合约驱动：
   - 相位来自链上轮次(betEnd/closeBlock/revealBlock/resolved)+当前区块
   - 下注=真实 approve + placeBet(roundId,area,amount)
   - 开局/封盘/结算由后端 keeper 跑，前端不发 crank 交易
   余额单位沿用原 UI 的"分"(×100)：1 app 单位 = 0.01 LGNS；raw(9位) = appUnit × 1e7 */
(function(root){
  'use strict';
  const SIDES=['dragon','tie','tiger'];
  const AREA={dragon:0,tiger:1,tie:2};
  const AREA_NAME={0:'dragon',1:'tiger',2:'tie'};
  // 真实赔率(净)：龙/虎 1:1(2x)，和 15:1(16x)；和局时龙/虎注退一半
  const DEFAULT_RULES={dragon:1,tiger:1,tie:15,tiePolicy:'half',chips:[10,50,100,500,1000]};
  const DURATIONS={WAITING:3000,BETTING:15000,LOCKED:4000,DEALING:6000,REVEALING:4000,SETTLEMENT:5500};
  const empty=()=>({dragon:0,tie:0,tiger:0});
  const sum=b=>SIDES.reduce((s,k)=>s+(b[k]||0),0);

  const CFG={proxy:'0x4d127c5b2eFc63B6A7670cdddD853CA22573a8b9',
    lgns:'0x4d1d808a081fdac440703b3765fc61f8028c06b8',
    chainId:6714, chainHex:'0x1a3a', rpc:'https://rpc.anubispace.org'};
  const SEL={roundCount:'0x127f0b3f',getRound:'0x8f1327c0',betCount:'0x65381a37',getBet:'0x2301b83d',
    placeBet:'0xda866c48',balanceOf:'0x70a08231',allowance:'0xdd62ed3e',approve:'0x095ea7b3',
    minBet:'0x9619367d',paused:'0x5c975abb',freeBankroll:'0xfc958429'};
  const ONE_APP=10000000n;              // 1 app单位 = 1e7 raw = 0.01 LGNS
  const APPROVE_RAW=(2n**256n-1n);      // 一次性无限授权：首次授权后一直玩，无需重复授权
  const BLOCK_MS=1000;                  // Anubis ≈1s/块（仅用于倒计时估算）
  const POLL_MS=1500;

  const RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const SUIT_L=['S','H','D','C'];
  function cardFromId(id){ // 与已部署合约一致的牌面编码
    id=Number(id); if(!(id>=0&&id<52))return null;
    const val=(Math.floor(id/4)+1)%13;   // 0..12
    return {rank:val+1, suit:SUIT_L[id%4], id:SUIT_L[id%4]+(val+1)};
  }
  const u256=n=>BigInt(n).toString(16).padStart(64,'0');
  const addr32=a=>a.toLowerCase().replace(/^0x/,'').padStart(64,'0');
  const rawToApp=raw=>Number(BigInt(raw)/ONE_APP);
  const appToRaw=app=>BigInt(Math.round(app))*ONE_APP;

  async function rpcRead(method,params){
    const r=await fetch(CFG.rpc,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
    const j=await r.json(); if(j.error)throw new Error(j.error.message||'rpc'); return j.result;
  }
  const callRead=(to,data)=>rpcRead('eth_call',[{to,data},'latest']);
  const callProxy=sel=>callRead(CFG.proxy,sel);
  function decRound(hex){
    const h=(hex||'').replace(/^0x/,''); const w=i=>h.slice(i*64,(i+1)*64);
    const num=i=>Number(BigInt('0x'+(w(i)||'0'))); const big=i=>BigInt('0x'+(w(i)||'0'));
    return {betEnd:num(0),closeBlock:num(1),revealBlock:num(2),dCard:num(3),tCard:num(4),
      result:num(5),resolved:big(6)!==0n,bets:num(11)};
  }
  function decBet(hex){
    const h=(hex||'').replace(/^0x/,'');
    return {player:'0x'+h.slice(24,64),amount:BigInt('0x'+(h.slice(64,128)||'0')),area:Number(BigInt('0x'+(h.slice(128,192)||'0')))};
  }
  // 我本局各区下注(app单位)
  function myReturnApp(bets,result){
    const d=bets.dragon||0,t=bets.tiger||0,ti=bets.tie||0;
    if(result==='dragon')return d*2;
    if(result==='tiger')return t*2;
    if(result==='tie')return ti*16+Math.floor(d/2)+Math.floor(t/2);
    return 0;
  }
  function breakdownOf(bets,result){
    const d=bets.dragon||0,t=bets.tiger||0,ti=bets.tie||0,stake=d+t+ti;
    let principal=0,profit=0;
    if(result==='dragon'){principal=d;profit=d;}
    else if(result==='tiger'){principal=t;profit=t;}
    else if(result==='tie'){principal=ti+Math.floor(d/2)+Math.floor(t/2);profit=ti*15;}
    const payout=principal+profit;
    return {stake,principal,profit,payout,net:payout-stake};
  }

  class GameEngine{
    constructor(opts={}){
      this.now=opts.now||(()=>Date.now());
      this.wallet=opts.wallet||null;       // DTWallet.Wallet 实例（写交易/地址来源）
      this.toast=opts.toast||(()=>{});
      this.durations={...DURATIONS};
      this.listeners=new Set();
      this.allowanceRaw=0n; this.minBetRaw=0n; this.balRaw=0n;
      this._lastPoll=0; this._polling=false; this._roundPhaseKey=''; this._scannedRound=0;
      this.state={version:1,phase:'WAITING',round:0,deadline:this.now()+DURATIONS.WAITING,phaseStarted:this.now(),
        balance:0,pending:empty(),confirmed:empty(),undo:[],cards:null,result:null,settled:false,
        history:[],counts:{dragon:0,tiger:0,tie:0,total:0},lastBets:empty(),autoRemaining:0,
        rules:JSON.parse(JSON.stringify(DEFAULT_RULES)),roundRules:JSON.parse(JSON.stringify(DEFAULT_RULES)),
        nextRules:null,lastSettlement:null,notice:'连接钱包开始真钱对局',revision:0};
    }
    /* ---- 订阅/状态 ---- */
    subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
    emit(){this.state.revision++;for(const f of this.listeners)f(this.state);}
    export(){return null;} // 真钱模式不本地存档
    available(){return Math.max(0,this.state.balance-sum(this.state.pending));}
    seconds(){return Math.max(0,Math.ceil((this.state.deadline-this.now())/1000));}
    get addr(){return this.wallet&&this.wallet.connected?this.wallet.address:null;}

    /* ---- 下注篮子（本地暂存，确认才上链）---- */
    assertBetting(){if(this.state.phase!=='BETTING'||this.now()>=this.state.deadline)throw Error('本轮已封盘，请等待下一轮');}
    add(side,amount){
      this.assertBetting();
      if(!this.addr)throw Error('请先连接钱包');
      if(!SIDES.includes(side)||!Number.isSafeInteger(amount)||amount<=0)throw Error('请选择有效筹码');
      if(amount>this.available())throw Error('LGNS 余额不足');
      this.state.pending[side]+=amount;this.state.undo.push({side,amount});this.emit();
    }
    undo(){this.assertBetting();const it=this.state.undo.pop();if(it){this.state.pending[it.side]-=it.amount;this.emit();}}
    clear(){this.assertBetting();this.state.pending=empty();this.state.undo=[];this.emit();}
    repeat(){this.assertBetting();const c=sum(this.state.lastBets);if(!c)throw Error('还没有可重复的上一轮下注');
      if(c>this.available())throw Error('LGNS 余额不足，无法重复上轮');
      for(const s of SIDES){const a=this.state.lastBets[s];if(a){this.state.pending[s]+=a;this.state.undo.push({side:s,amount:a});}}this.emit();}
    setAuto(){this.state.notice='真钱模式不支持自动连投';this.emit();}      // 真钱禁用
    setTiePolicy(){this.state.notice='和局规则由合约固定（退一半）';this.emit();} // 合约固定
    refill(){this.toast('正在刷新链上余额…');this._refreshWallet().then(()=>this.emit());}

    /* ---- 确认下注：approve + 逐区 placeBet ---- */
    async confirm(){
      try{
        this.assertBetting();
      }catch(e){this.toast(e.message);return false;}
      if(!this.addr){this.toast('请先连接钱包');return false;}
      if(this.wallet&&!this.wallet.correctChain()){this.toast('请切换到 Anubis 链(6714)');return false;}
      const pend={...this.state.pending}; const total=sum(pend);
      if(total<=0){this.toast('请先选择筹码点龙/和/虎');return false;}
      if(total>this.state.balance){this.toast('LGNS 余额不足');return false;}
      const minApp=rawToApp(this.minBetRaw);
      for(const s of SIDES)if(pend[s]>0&&minApp>0&&pend[s]<minApp){this.toast('单区最低 '+(minApp/100).toFixed(2)+' LGNS');return false;}
      const rid=this.state.round;
      const prov=this.wallet&&this.wallet.provider; if(!prov){this.toast('钱包不可用');return false;}
      const send=(to,data)=>prov.request({method:'eth_sendTransaction',params:[{from:this.addr,to,data}]});
      try{
        this.state.notice='等待钱包确认…';this.emit();
        const totalRaw=appToRaw(total);
        if(this.allowanceRaw<totalRaw){
          this.toast('请在钱包确认授权');
          const h=await send(CFG.lgns,SEL.approve+addr32(CFG.proxy)+u256(APPROVE_RAW));
          await this._waitTx(h); this.allowanceRaw=APPROVE_RAW; this.toast('授权成功');
        }
        for(const s of SIDES){
          const amt=pend[s]; if(amt<=0)continue;
          this.toast('请在钱包确认下注：'+({dragon:'龙',tiger:'虎',tie:'和'}[s]));
          const data=SEL.placeBet+u256(rid)+u256(AREA[s])+u256(appToRaw(amt));
          const h=await send(CFG.proxy,data); await this._waitTx(h);
        }
        this.state.pending=empty();this.state.undo=[];this.state.notice='下注成功，等待自动开奖…';
        this.toast('下注成功');
        await this._refreshWallet(); await this._scanMyBets(rid,true); this.emit();
        return true;
      }catch(e){
        this.state.notice='下注未完成';this.emit();
        this.toast(this._explain(e)); return false;
      }
    }
    async _waitTx(hash,timeout=90000){
      const start=Date.now();
      while(Date.now()-start<timeout){
        try{const r=await rpcRead('eth_getTransactionReceipt',[hash]);if(r&&r.blockNumber){if(r.status&&BigInt(r.status)===0n)throw Error('交易失败');return r;}}catch(e){if(/交易失败/.test(e.message))throw e;}
        await new Promise(r=>setTimeout(r,1500));
      }
      throw Error('交易确认超时');
    }
    _explain(e){
      const m=((e&&(e.message||''))+'').toLowerCase();
      if(m.includes('user rejected')||m.includes('denied')||(e&&e.code===4001))return '已取消';
      if(m.includes('pool_low'))return '奖池不足，无法接受该注';
      if(m.includes('min_bet'))return '低于单注下限';
      if(m.includes('not_betting')||m.includes('closed'))return '本轮已封盘';
      if(m.includes('paused'))return '游戏已暂停';
      if(m.includes('insufficient'))return 'gas(DAI)或余额不足';
      return (e&&e.message)?e.message.slice(0,80):'操作未完成';
    }

    /* ---- 钱包余额/授权/最低注 ---- */
    async _refreshWallet(){
      if(!this.addr)return;
      try{
        const [bal,alw,mb]=await Promise.all([
          callRead(CFG.lgns,SEL.balanceOf+addr32(this.addr)),
          callRead(CFG.lgns,SEL.allowance+addr32(this.addr)+addr32(CFG.proxy)),
          callProxy(SEL.minBet).catch(()=>'0x0')
        ]);
        this.balRaw=BigInt(bal);this.allowanceRaw=BigInt(alw);this.minBetRaw=BigInt(mb);
        this.state.balance=rawToApp(this.balRaw);
      }catch(e){}
    }
    async _scanMyBets(rid,force){
      if(!this.addr||!rid){this.state.confirmed=empty();return;}
      if(!force&&this._scannedRound===rid&&this.state.phase!=='BETTING')return;
      try{
        const cHex=await callProxy(SEL.betCount+u256(rid)); const n=Number(BigInt(cHex));
        const mine=empty();
        for(let i=0;i<n&&i<200;i++){
          const b=decBet(await callProxy(SEL.getBet+u256(rid)+u256(i)));
          if(b.player.toLowerCase()!==this.addr.toLowerCase())continue;
          const side=AREA_NAME[b.area]; if(side)mine[side]+=rawToApp(b.amount);
        }
        this.state.confirmed=mine; this._scannedRound=rid;
      }catch(e){}
    }

    /* ---- 轮询：100ms 被 tick 调用，内部节流到 POLL_MS ---- */
    tick(){const t=this.now();if(t-this._lastPoll>=POLL_MS)this._poll();}
    async _poll(){
      if(this._polling)return;this._polling=true;this._lastPoll=this.now();
      try{
        const [blkHex,rcHex]=await Promise.all([rpcRead('eth_blockNumber',[]),callProxy(SEL.roundCount)]);
        const block=Number(BigInt(blkHex)); const roundCount=Number(BigInt(rcHex));
        if(this.addr&&(this.now()%6000<POLL_MS))this._refreshWallet();
        if(roundCount===0){this._setPhase('WAITING',0,block,null);this._polling=false;return;}
        let rid=roundCount, rd=decRound(await callProxy(SEL.getRound+u256(rid)));
        if(rd.betEnd===0&&rid>0){const alt=decRound(await callProxy(SEL.getRound+u256(rid-1)));if(alt.betEnd>0){rid=rid-1;rd=alt;}}
        // 新一局：清桌、扫我的注
        if(rid!==this.state.round){this.state.cards=null;this.state.result=null;this.state.settled=false;this.state.confirmed=empty();this._scannedRound=0;await this._scanMyBets(rid,true);await this._refreshWallet();this._backfill(rid);}
        else if(!rd.resolved&&rd.closeBlock===0){await this._scanMyBets(rid);}

        let phase;
        if(rd.resolved){phase='SETTLEMENT';}
        else if(rd.closeBlock===0&&block<=rd.betEnd){phase='BETTING';}
        else if(rd.closeBlock===0&&block>rd.betEnd){phase='LOCKED';}
        else if(rd.closeBlock>0&&block<=rd.revealBlock){phase='DEALING';}
        else {phase='REVEALING';}
        this._setPhase(phase,rid,block,rd);
      }catch(e){/* 静默，下一拍重试 */}
      this._polling=false;
    }
    _setPhase(phase,rid,block,rd){
      const s=this.state; const changedRound=(rid!==s.round); const key=phase+':'+rid;
      s.round=rid;
      // 牌面与结果
      if(rd&&rd.resolved){
        if(!s.cards){s.cards=[cardFromId(rd.dCard),cardFromId(rd.tCard)];}
        s.result=AREA_NAME[rd.result]||'tie';s.settled=true;
        // 结算记录（本局我的）仅生成一次
        if(this._roundPhaseKey!==key){
          const myb={...s.confirmed}; const bd=breakdownOf(myb,s.result);
          s.lastSettlement={round:rid,time:this.now(),cards:s.cards.slice(),result:s.result,bets:{...myb},
            stake:bd.stake,principal:bd.principal,profit:bd.profit,payout:bd.payout,net:bd.net,
            balance:s.balance,tiePolicy:'half'};
          this._pushHistory({round:rid,time:this.now(),result:s.result,cards:s.cards.slice(),
            bets:{...myb},...bd,balance:s.balance,tiePolicy:'half'});
          if(bd.stake>0)s.lastBets={...myb};
          this._refreshWallet();
        }
      }else{ s.cards=null; s.result=null; s.settled=false; if(phase==='BETTING')s.lastSettlement=s.lastSettlement; }
      // 相位计时（倒计时/进度）
      if(this._roundPhaseKey!==key){
        s.phaseStarted=this.now();
        if(phase==='BETTING'&&rd){const left=Math.max(0,(rd.betEnd-block))*BLOCK_MS;s.deadline=this.now()+Math.max(left,800);this.durations.BETTING=Math.max(s.deadline-s.phaseStarted,1000);}
        else{s.deadline=this.now()+(this.durations[phase]||3000);}
        s.notice=({WAITING:'等待开局…',BETTING:'请选择筹码，点击龙 / 和 / 虎下注',LOCKED:'停止下注，准备发牌',DEALING:'发牌中…',REVEALING:'开牌结算中…',SETTLEMENT:'本轮已结算'})[phase]||'';
        this._roundPhaseKey=key; this.emit();
      }else if(phase==='BETTING'&&rd){
        const left=Math.max(0,(rd.betEnd-block))*BLOCK_MS;s.deadline=this.now()+Math.max(left,0);
      }
      s.phase=phase;
    }
    async _backfill(latest){
      try{
        const have=new Set(this.state.history.map(h=>h.round));
        const out=[];
        for(let id=latest;id>=Math.max(1,latest-23);id--){
          if(have.has(id))continue;
          const rd=decRound(await callProxy(SEL.getRound+u256(id)));
          if(rd.resolved)out.push({round:id,time:this.now(),result:AREA_NAME[rd.result]||'tie',
            cards:[cardFromId(rd.dCard),cardFromId(rd.tCard)],bets:empty(),stake:0,principal:0,profit:0,payout:0,net:0,balance:this.state.balance,tiePolicy:'half'});
        }
        for(const r of out)this._pushHistory(r,true);
        this._recount(); this.emit();
      }catch(e){}
    }
    _pushHistory(rec,silent){
      if(this.state.history.some(h=>h.round===rec.round))return;
      this.state.history.push(rec);
      this.state.history.sort((a,b)=>a.round-b.round);
      if(this.state.history.length>300)this.state.history.shift();
      if(!silent)this._recount();
    }
    _recount(){
      const c={dragon:0,tiger:0,tie:0,total:0};
      for(const h of this.state.history){if(c[h.result]!==undefined){c[h.result]++;c.total++;}}
      this.state.counts=c;
    }
  }

  root.DT={SIDES,DURATIONS,DEFAULT_RULES,GameEngine,sum,empty,cardFromId,CFG};
})(typeof globalThis!=='undefined'?globalThis:this);
