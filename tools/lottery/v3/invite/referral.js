/* 邀请页「全平台游戏返佣」区(后端账本:炸金花等所有游戏) — 汇总/我的战绩/收益排行榜/一键领取。中英双语。
   独立于现有彩票链上返佣区,只在邀请页用。 */
(function(){
  'use strict';
  var API='https://zjgame.web3origin.com/ref';
  function EN(){ try{var s=localStorage.getItem('aplang'); if(s==='en')return true; if(s==='zh')return false;}catch(e){} return (navigator.language||'').toLowerCase().indexOf('zh')!==0; }
  function L(zh,en){ return EN()?en:zh; }
  var short=a=>a?a.slice(0,6)+'…'+a.slice(-4):'';
  function fmt(s,dec){ try{ var v=BigInt(s||'0'),neg=v<0n; if(neg)v=-v; var str=v.toString().padStart(dec+1,'0'); var i=str.slice(0,str.length-dec),f=str.slice(str.length-dec).slice(0,3).replace(/0+$/,''); i=i.replace(/\B(?=(\d{3})+(?!\d))/g,','); return (neg?'-':'')+(f?i+'.'+f:i);}catch(e){return '0';} }
  var myAddr=null, data=null, lb=null, busy=false, myCode=null;
  var SITE='https://anubislottery.com/';

  async function connected(){ var eth=window.ethereum; if(!eth)return null; var a=eth.selectedAddress; if(a)return a.toLowerCase(); try{var r=await eth.request({method:'eth_accounts'});return (r&&r[0])?r[0].toLowerCase():null;}catch(e){return null;} }
  function meta(addr){ return (data&&data.tokens&&data.tokens[addr])||{sym:short(addr),dec:18}; }
  function amtLine(map){ var out=[]; for(var tk in (map||{})){ var m=meta(tk),v=BigInt(map[tk]||'0'); if(v>0n) out.push(fmt(map[tk],m.dec)+' '+m.sym); } return out.length?out.join(' · '):'0'; }

  async function load(){
    myAddr=await connected();
    try{ lb=(await fetch(API+'/leaderboard?limit=20',{cache:'no-store'}).then(r=>r.json())).list||[]; }catch(e){ lb=[]; }
    if(myAddr){ try{ data=await fetch(API+'/me?addr='+myAddr,{cache:'no-store'}).then(r=>r.json()); }catch(e){ data=null; }
      try{ myCode=(await fetch(API+'/code?addr='+myAddr,{cache:'no-store'}).then(r=>r.json())).code; }catch(e){ myCode=null; }
    } else { data=null; myCode=null; }
    render();
  }

  function card(){ var w=document.querySelector('.wrap'); if(!w)return null; var c=document.getElementById('apGameRef'); if(!c){ c=document.createElement('section'); c.className='card'; c.id='apGameRef'; var lead=w.querySelector('.lead'); if(lead&&lead.parentNode===w){ w.insertBefore(c, lead.nextSibling); } else { w.insertBefore(c, w.firstChild); } } return c; }

  function render(){
    var c=card(); if(!c) return;
    var claimableRows='', claimTotal=false;
    if(data&&data.claimable){ for(var tk in data.claimable){ var m=meta(tk),v=BigInt(data.claimable[tk]||'0'); if(v>0n){ claimTotal=true; claimableRows+='<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px dashed var(--line,#ffffff14);font-size:13px"><span>'+m.sym+'</span><span style="font-weight:700;color:#c8f665">'+fmt(data.claimable[tk],m.dec)+' '+m.sym+'</span></div>'; } } }
    var invRows='';
    if(data&&data.invitees&&data.invitees.length){ invRows=data.invitees.slice(0,30).map(function(iv){ return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px dashed var(--line,#ffffff10);font-size:12.5px"><span style="color:#9fb3a6">'+short(iv.addr)+'</span><span style="color:#c8f665;font-weight:700">+'+amtLine(iv.earnedFromThem)+'</span></div>'; }).join(''); }
    var lbRows='';
    if(lb&&lb.length){ lbRows=lb.map(function(r){ var mine=myAddr&&r.addr.toLowerCase()===myAddr; return '<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px dashed var(--line,#ffffff10);font-size:12.5px'+(mine?';background:#c8f6650d;border-radius:8px;padding-left:6px':'')+'"><span style="width:26px;color:'+(r.rank<=3?'#e0bd68':'#7e9583')+';font-weight:800">'+(r.rank<=3?['🥇','🥈','🥉'][r.rank-1]:'#'+r.rank)+'</span><span style="flex:1;color:#cdd9cf">'+short(r.addr)+(mine?' <b style="color:#c8f665">('+L('你','you')+')</b>':'')+'</span><span style="color:#9fb3a6">'+L('直推 ','dir ')+r.directCount+'</span><span style="color:#c8f665;font-weight:700;min-width:70px;text-align:right">'+amtLine(r.earned)+'</span></div>'; }).join(''); }

    c.innerHTML=''
      +'<div class="eyebrow">'+L('全平台游戏返佣','All-games referral')+'</div>'
      +'<h2 style="margin:4px 0 6px">'+L('炸金花 等所有游戏','Golden Flower & all games')+'</h2>'
      +'<p class="note" style="margin-bottom:12px">'+L('被你邀请的人玩任何游戏,你按手续费 直推30%/间推10% 拿返佣——从平台费出,不影响玩家。','When your invitees play any game, you earn 30% (direct) / 10% (indirect) of the platform fee — from the fee, players unaffected.')+'</p>'
      +(myAddr?('<div style="background:#0d1310;border:1px solid #ffffff14;border-radius:14px;padding:14px;margin-bottom:14px">'
        +'<div style="font-size:12px;color:#7e9583;margin-bottom:6px">'+L('我的推荐码','My referral code')+'</div>'
        +'<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px"><div style="flex:1;font-size:26px;font-weight:800;letter-spacing:5px;color:#c8f665">'+(myCode||'…')+'</div><button id="apRefCopyCode" style="background:#17200b;color:#c8f665;border:1px solid #c8f66555;font-weight:700;font-size:12px;padding:8px 13px;border-radius:9px;cursor:pointer;flex:none">'+L('复制','Copy')+'</button></div>'
        +'<div style="font-size:12px;color:#7e9583;margin-bottom:6px">'+L('我的邀请链接','My invite link')+'</div>'
        +'<div style="display:flex;gap:8px;align-items:center"><div style="flex:1;font-size:12px;color:#9fb3a6;word-break:break-all">'+(myCode?SITE+'?code='+myCode:'…')+'</div><button id="apRefCopyLink" style="background:#17200b;color:#c8f665;border:1px solid #c8f66555;font-weight:700;font-size:12px;padding:8px 13px;border-radius:9px;cursor:pointer;flex:none">'+L('复制','Copy')+'</button></div>'
        +'<div style="font-size:11px;color:#5f7268;margin-top:9px;line-height:1.6">'+L('把链接或推荐码发给好友,他们用它进入并玩游戏,你就能拿返佣。','Share the link or code; friends must enter with it to join — then you earn on their play.')+'</div>'
        +'</div>'):'')
      +'<div class="rstat" style="display:flex;gap:10px;margin-bottom:12px"><div class="rs" style="flex:1;text-align:center"><div class="n" style="font-size:20px;font-weight:800;color:#c8f665">'+(data?data.directCount:'—')+'</div><div class="l" style="font-size:11px;color:#7e9583">'+L('直推','Direct')+'</div></div><div class="rs" style="flex:1;text-align:center"><div class="n" style="font-size:20px;font-weight:800;color:#c8f665">'+(data?data.indirectCount:'—')+'</div><div class="l" style="font-size:11px;color:#7e9583">'+L('间推','Indirect')+'</div></div><div class="rs" style="flex:2;text-align:center"><div class="n" style="font-size:14px;font-weight:800;color:#e0bd68">'+(data?amtLine(data.earned):'—')+'</div><div class="l" style="font-size:11px;color:#7e9583">'+L('累计返佣','Total earned')+'</div></div></div>'
      +'<div style="font-size:13px;font-weight:700;margin:4px 0 2px">'+L('可领取','Claimable')+'</div>'
      +(claimTotal?claimableRows:'<div class="note">'+(myAddr?L('暂无可领返佣','Nothing to claim yet'):L('连接钱包查看','Connect wallet to view'))+'</div>')
      +(claimTotal?'<button id="apRefClaim" style="width:100%;margin-top:12px;background:linear-gradient(180deg,#d4f06a,#b6e24a);color:#17200b;font-weight:800;font-size:15px;padding:13px;border-radius:12px;border:0;cursor:pointer">'+L('一键领取','Claim all')+'</button>':'')
      +(invRows?'<div style="font-size:13px;font-weight:700;margin:16px 0 2px">'+L('我的战绩 · 直推明细','My record · direct invitees')+'</div>'+invRows:'')
      +(lbRows?'<div style="font-size:13px;font-weight:700;margin:16px 0 2px">'+L('收益排行榜','Earnings leaderboard')+'</div>'+lbRows:'');

    var btn=document.getElementById('apRefClaim'); if(btn) btn.onclick=claim;
    var cc=document.getElementById('apRefCopyCode'); if(cc) cc.onclick=function(){ cp(myCode, cc); };
    var cl=document.getElementById('apRefCopyLink'); if(cl) cl.onclick=function(){ cp(SITE+'?code='+myCode, cl); };
  }
  function cp(text,btn){ if(!text)return; try{ (navigator.clipboard?navigator.clipboard.writeText(text):Promise.reject()).then(function(){ var o=btn.textContent; btn.textContent=L('已复制','Copied'); setTimeout(function(){btn.textContent=o;},1500); },function(){ try{var ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();var o=btn.textContent;btn.textContent=L('已复制','Copied');setTimeout(function(){btn.textContent=o;},1500);}catch(e){} }); }catch(e){} }

  async function claim(){
    if(busy||!myAddr) return; busy=true;
    var btn=document.getElementById('apRefClaim'); if(btn){ btn.disabled=true; btn.textContent=L('领取中…','Claiming…'); }
    try{
      var sig=await window.ethereum.request({method:'personal_sign',params:['ANUBIS PLAY claim rewards: '+myAddr, myAddr]});
      var r=await fetch(API+'/claim',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({addr:myAddr,sig:sig})}).then(x=>x.json());
      if(r&&r.ok){ toast(L('领取成功，已打到你钱包','Claimed to your wallet')); }
      else { var e=(r&&r.errors&&r.errors[0]&&r.errors[0].error)||''; toast(L('领取失败：','Claim failed: ')+(e||L('稍后重试','try again'))); }
    }catch(e){ }
    finally{ busy=false; load(); }
  }
  function toast(m){ try{ var t=document.getElementById('apRefToast2'); if(!t){t=document.createElement('div');t.id='apRefToast2';t.style.cssText='position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:99991;background:#1a2a21;border:1px solid #ffffff22;color:#eaf3ee;padding:11px 18px;border-radius:12px;font-size:13px;opacity:0;transition:.3s;max-width:88%;text-align:center';document.body.appendChild(t);} t.textContent=m;t.style.opacity='1';clearTimeout(window._rt2);window._rt2=setTimeout(function(){t.style.opacity='0';},3800); }catch(e){} }

  function start(){
    load();
    var eth=window.ethereum; if(eth&&eth.on){ eth.on('accountsChanged',function(){ load(); }); }
    setInterval(load, 30000); // 30s 刷新
  }
  if(document.readyState!=='loading') start(); else document.addEventListener('DOMContentLoaded', start);
})();
