/* ANUBIS PLAY 全平台邀请绑定 — 捕获 ?ref,连钱包后提示"接受邀请"并签名绑定(永久,全游戏通用)
   绑定后该玩家玩任何游戏产生的手续费,邀请人按直推30%/间推10%拿返佣(从手续费出,不影响玩家)。中英双语。 */
(function(){
  'use strict';
  var API='https://zjgame.web3origin.com/ref';
  var ADDR=/^0x[0-9a-fA-F]{40}$/;
  function EN(){ try{var s=localStorage.getItem('aplang'); if(s==='en')return true; if(s==='zh')return false;}catch(e){} return (navigator.language||'').toLowerCase().indexOf('zh')!==0; }
  function L(zh,en){ return EN()?en:zh; }
  var short=a=>a?a.slice(0,6)+'…'+a.slice(-4):'';

  // 1) 捕获 ?ref(首次,存本地,永久到绑定成功)
  try{ var r=new URLSearchParams(location.search).get('ref'); if(r&&ADDR.test(r)){ if(!localStorage.getItem('ap_ref')) localStorage.setItem('ap_ref', r.toLowerCase()); } }catch(e){}

  var tried=false, banner=null;
  function getRef(){ try{return localStorage.getItem('ap_ref');}catch(e){return null;} }
  function clearRef(){ try{localStorage.removeItem('ap_ref');}catch(e){} }

  async function tryBind(){
    var ref=getRef(); if(!ref||tried) return;
    var eth=window.ethereum; if(!eth) return;
    var addr=eth.selectedAddress;
    if(!addr){ try{ var a=await eth.request({method:'eth_accounts'}); addr=a&&a[0]; }catch(e){} }
    if(!addr) return;
    addr=addr.toLowerCase();
    if(addr===ref){ clearRef(); return; }              // 自己不能绑自己
    tried=true;
    try{ var me=await fetch(API+'/me?addr='+addr,{cache:'no-store'}).then(x=>x.json()); if(me&&me.referrer){ clearRef(); return; } }  // 已绑过
    catch(e){ tried=false; return; }
    showAccept(addr, ref);
  }

  function showAccept(addr, ref){
    if(document.getElementById('apRefBanner')) return;
    var b=document.createElement('div'); b.id='apRefBanner'; banner=b;
    b.style.cssText='position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:99990;width:calc(100% - 32px);max-width:420px;background:linear-gradient(180deg,#171f1a,#0f1713);border:1px solid #c8f66555;border-radius:16px;padding:14px 16px;box-shadow:0 18px 44px #000a;color:#eaf3ee;font-family:Inter,system-ui,-apple-system,"PingFang SC",sans-serif';
    b.innerHTML='<div style="font-weight:800;color:#c8f665;font-size:14px;margin-bottom:4px">'+L('你被邀请加入 ANUBIS PLAY','You were invited to ANUBIS PLAY')+'</div>'
      +'<div style="font-size:12px;color:#9fb3a6;line-height:1.6;margin-bottom:12px">'+L('邀请人 ','Inviter ')+'<b style="color:#e0bd68">'+short(ref)+'</b>'+L('。接受后,你玩游戏产生的手续费,TA 会拿到一部分返佣——不影响你的奖池和输赢,也不会多花你的钱。','. Accept and the inviter earns a share of the platform fee from your play — it never touches your pool, winnings, or costs you extra.')+'</div>'
      +'<div style="display:flex;gap:8px"><button id="apRefYes" style="flex:1;background:linear-gradient(180deg,#d4f06a,#b6e24a);color:#17200b;font-weight:800;font-size:14px;padding:11px;border-radius:11px;border:0;cursor:pointer">'+L('接受邀请','Accept')+'</button>'
      +'<button id="apRefNo" style="background:#0f1519;color:#8ba398;border:1px solid #ffffff1a;font-weight:700;font-size:13px;padding:11px 14px;border-radius:11px;cursor:pointer">'+L('忽略','Ignore')+'</button></div>';
    document.body.appendChild(b);
    document.getElementById('apRefYes').onclick=function(){ doBind(addr, ref); };
    document.getElementById('apRefNo').onclick=function(){ clearRef(); b.remove(); };
  }

  async function doBind(addr, ref){
    var yes=document.getElementById('apRefYes'); if(yes){ yes.disabled=true; yes.textContent=L('签名中…','Signing…'); }
    try{
      var msg='ANUBIS PLAY invite: bind '+addr+' -> '+ref;
      var sig=await window.ethereum.request({method:'personal_sign',params:[msg,addr]});
      var res=await fetch(API+'/bind',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invitee:addr,inviter:ref,sig:sig})}).then(x=>x.json());
      if(res&&(res.ok||res.already)){ clearRef(); if(banner)banner.remove(); toast(L('已接受邀请，永久绑定成功','Invite accepted — bound permanently')); }
      else { if(yes){yes.disabled=false;yes.textContent=L('接受邀请','Accept');} toast(L('绑定失败，稍后重试','Binding failed, try again')); }
    }catch(e){ if(yes){yes.disabled=false;yes.textContent=L('接受邀请','Accept');} }
  }

  function toast(m){ try{ var t=document.getElementById('apRefToast'); if(!t){t=document.createElement('div');t.id='apRefToast';t.style.cssText='position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:99991;background:#1a2a21;border:1px solid #ffffff22;color:#eaf3ee;padding:11px 18px;border-radius:12px;font-size:13px;opacity:0;transition:.3s;font-family:Inter,system-ui,sans-serif';document.body.appendChild(t);} t.textContent=m;t.style.opacity='1';clearTimeout(window._apRefTt);window._apRefTt=setTimeout(function(){t.style.opacity='0';},3600); }catch(e){} }

  function hook(){
    tryBind();
    var eth=window.ethereum;
    if(eth&&eth.on){ eth.on('accountsChanged',function(){ tried=false; tryBind(); }); }
    setTimeout(tryBind,1500); setTimeout(tryBind,4000);
  }
  if(document.readyState!=='loading') hook(); else document.addEventListener('DOMContentLoaded',hook);
})();
