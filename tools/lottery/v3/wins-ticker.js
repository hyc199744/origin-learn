/* ANUBIS PLAY 中奖播报飘屏 — 炸金花赢家(后端/wins) + 彩票中奖(链上WinnersDrawn),一条条从屏幕飞过。
   真实数据,无中奖则安静;放首页/彩票/炸金花页全局飘。中英双语,pointer-events:none 不挡点击。 */
(function(){
  'use strict';
  var API='https://zjgame.web3origin.com/ref';
  var EXP='https://browser.anubispace.org';
  var EV_WIN='0xab9af1684355064aa9258894f5c85b041fd7a83e4fe0eb02e607c13d8cb627b4';
  var POOLS=[
    {sym:'LGNS',c:'0xb8A20cEFDDAE4b298A4086f3376F01Bdb2d300C7',d:9,b:16182340},
    {sym:'USDT',c:'0x88f94a52BA5B24Be6BC894f16d4657B12BAb2859',d:6,b:16196737},
    {sym:'DAI', c:'0x7EC71344CE6fffd602d4911caB54A15f53Cc01A0',d:18,b:16200709},
    {sym:'A',   c:'0x6100cA0904E8b9c521129dEC05AfD4F5BBB9D6fb',d:18,b:16202660},
    {sym:'RM',  c:'0x5beAdBd9E7C87ACcac218d25aA83Bb707A7E96A3',d:9,b:16204394}
  ];
  var TOK={ '0x4d1d808a081fdac440703b3765fc61f8028c06b8':{sym:'LGNS',dec:9}, '0x83fd06f0846d9d90b3016bf670efe2e0b11cde14':{sym:'DAI',dec:18}, '0x2e045e1380f5f5b6e7550328910a7377c9fce59d':{sym:'RM',dec:9}, '0xdfb6a28bc6dc51fed17c27c880f2c66cdd040a3e':{sym:'USDT',dec:6} };
  function EN(){ try{var s=localStorage.getItem('aplang'); if(s==='en')return true; if(s==='zh')return false;}catch(e){} return (navigator.language||'').toLowerCase().indexOf('zh')!==0; }
  function L(zh,en){ return EN()?en:zh; }
  function short(a){ return a?a.slice(0,6)+'…'+a.slice(-4):''; }
  function num(h){ return parseInt(h,16)||0; }
  function fmt(v,dec){ try{ v=BigInt(v); var s=v.toString().padStart(dec+1,'0'); var i=s.slice(0,s.length-dec), f=s.slice(s.length-dec).slice(0,2).replace(/0+$/,''); i=i.replace(/\B(?=(\d{3})+(?!\d))/g,','); return f?i+'.'+f:i; }catch(e){ return '0'; } }
  function decArr(d,off,isAddr){ var n=num(d.slice(off,off+64)), a=[]; for(var i=0;i<n;i++){ var w=d.slice(off+64*(i+1),off+64*(i+2)); a.push(isAddr?('0x'+w.slice(-40)):(w||'0')); } return a; }

  var items=[], idx=0, busy=false;
  function ensureStyle(){ if(document.getElementById('winTkStyle'))return; var st=document.createElement('style'); st.id='winTkStyle';
    st.textContent='@keyframes winFly{from{transform:translateX(100vw)}to{transform:translateX(-110%)}}'
      +'#winTk{position:fixed;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 48px);height:30px;z-index:95;pointer-events:none;overflow:hidden}'
      +'#winTk .wi{position:absolute;top:1px;left:0;white-space:nowrap;display:inline-flex;align-items:center;gap:7px;background:rgba(13,19,16,.82);border:1px solid #c8f66555;border-radius:999px;padding:5px 14px;font-size:12.5px;font-weight:600;color:#eaf3ee;box-shadow:0 4px 16px #0007;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);will-change:transform}'
      +'#winTk .wi b{color:#c8f665}#winTk .wi b.zg{color:#e0bd68}';
    document.head.appendChild(st); }
  function bar(){ var b=document.getElementById('winTk'); if(!b){ b=document.createElement('div'); b.id='winTk'; document.body.appendChild(b); } return b; }
  function flyNext(){
    if(!items.length){ setTimeout(flyNext, 8000); return; }
    var it=items[idx%items.length]; idx++;
    var sym, dec; if(it._sym){ sym=it._sym; dec=it._dec; } else { var m=TOK[it.token]||{}; sym=m.sym||''; dec=(m.dec!=null?m.dec:9); }
    var who=short(it.addr), amt=fmt(it.amount,dec);
    var b=bar(), el=document.createElement('div'); el.className='wi';
    el.innerHTML = (it.game==='zhajinhua')
      ? '🎉 <span>'+who+'</span> '+L('炸金花赢了','won at Golden Flower')+' <b>'+amt+' '+sym+'</b>'
      : '🎊 <span>'+who+'</span> '+L('彩票中了','won the lottery')+' <b class="zg">'+amt+' '+sym+'</b>';
    el.style.animation='winFly 8s linear forwards';
    b.appendChild(el);
    el.addEventListener('animationend', function(){ try{el.remove();}catch(e){} });
    setTimeout(flyNext, 3200);
  }
  function loadZjh(){ return fetch(API+'/wins?limit=40',{cache:'no-store'}).then(function(r){return r.json();}).then(function(j){ return (j.list||[]).map(function(w){ return {game:w.game,addr:w.addr,token:w.token,amount:w.amount,ts:w.ts||0}; }); }).catch(function(){ return []; }); }
  function loadLottery(){
    return Promise.all(POOLS.map(function(P){
      var url=EXP+'/api?module=logs&action=getLogs&fromBlock='+P.b+'&toBlock=latest&address='+P.c+'&topic0='+EV_WIN;
      return fetch(url).then(function(r){return r.json();}).then(function(j){
        var logs=(j&&j.result&&j.result.length)?j.result:[]; logs.sort(function(a,b){return num(b.blockNumber)-num(a.blockNumber);});
        var out=[];
        logs.slice(0,3).forEach(function(l){ var d=(l.data||'0x').replace(/^0x/,''); var ow=num(d.slice(0,64))*2, oa=num(d.slice(64,128))*2; var ws=decArr(d,ow,true), as=decArr(d,oa,false); for(var k=0;k<ws.length;k++){ try{ if(BigInt(as[k]||'0')>0n) out.push({game:'lottery',addr:ws[k],amount:as[k],_sym:P.sym,_dec:P.d}); }catch(e){} } });
        return out;
      }).catch(function(){ return []; });
    })).then(function(arrs){ return arrs.reduce(function(a,b){return a.concat(b);},[]); });
  }
  function refresh(){ if(busy)return; busy=true; Promise.all([loadZjh(),loadLottery()]).then(function(r){ var z=r[0]||[], lt=r[1]||[]; var merged=[]; var mx=Math.max(z.length,lt.length); for(var i=0;i<mx;i++){ if(i<z.length)merged.push(z[i]); if(i<lt.length)merged.push(lt[i]); } items=merged; busy=false; }).catch(function(){ busy=false; }); }
  function start(){ ensureStyle(); refresh(); flyNext(); setInterval(refresh, 60000); }
  if(document.readyState!=='loading') start(); else document.addEventListener('DOMContentLoaded', start);
})();
