/* ANUBIS PLAY 进场门禁 — 必须有推荐人才能进:带推荐链接(?ref=0x..)或短码(?code=ABC123)直接进;
   否则弹门禁:输短码 或 由官方默认推荐人带你进。进过一次本机不再弹。真正签名绑定仍在连钱包时由 ref.js 完成。中英双语。 */
(function(){
  'use strict';
  var API='https://zjgame.web3origin.com/ref';
  var ADDR=/^0x[0-9a-fA-F]{40}$/;
  var DEFAULT_REF='0xffc31b596754137718f22d7708e1acd7a5c4dbe6'; // 官方默认推荐人兜底,启动后用 /health 校正
  function EN(){ try{var s=localStorage.getItem('aplang'); if(s==='en')return true; if(s==='zh')return false;}catch(e){} return (navigator.language||'').toLowerCase().indexOf('zh')!==0; }
  function L(zh,en){ return EN()?en:zh; }
  function g(k){ try{return localStorage.getItem(k);}catch(e){return null;} }
  function s(k,v){ try{localStorage.setItem(k,v);}catch(e){} }

  function passed(){ return g('ap_gate_ok')==='1'; }
  function pass(ref){ if(ref&&ADDR.test(ref)){ if(!g('ap_ref')) s('ap_ref', ref.toLowerCase()); } s('ap_gate_ok','1'); removeGate(); }

  var gateEl=null, bodyOv='';
  function removeGate(){ if(gateEl){ gateEl.remove(); gateEl=null; } try{ document.documentElement.style.overflow=bodyOv; document.body.style.overflow=''; }catch(e){} }

  function showGate(errMsg){
    if(passed()) return;
    if(gateEl) { if(errMsg) setErr(errMsg); return; }
    try{ bodyOv=document.documentElement.style.overflow; document.documentElement.style.overflow='hidden'; }catch(e){}
    var b=document.createElement('div'); b.id='apGate'; gateEl=b;
    b.style.cssText='position:fixed;inset:0;z-index:2147483600;background:radial-gradient(120% 90% at 50% 0%,#132019 0%,#0a0f0c 60%,#070a08 100%);display:flex;align-items:center;justify-content:center;padding:22px;font-family:Inter,system-ui,-apple-system,"PingFang SC",sans-serif;overflow:auto';
    b.innerHTML=
      '<div style="width:100%;max-width:400px;background:linear-gradient(180deg,#141d18,#0e1511);border:1px solid #c8f66540;border-radius:20px;padding:26px 22px;box-shadow:0 30px 80px #000b;text-align:center">'
      +'<div style="font-size:12px;letter-spacing:2px;color:#7e9583;margin-bottom:6px">ANUBIS PLAY</div>'
      +'<div style="font-size:21px;font-weight:800;color:#eaf3ee;margin-bottom:8px">'+L('受邀加入','Invite only')+'</div>'
      +'<div style="font-size:13px;color:#9fb3a6;line-height:1.7;margin-bottom:18px">'+L('本平台仅限受邀进入。用邀请人的链接打开，或输入推荐码进入。','This platform is invite-only. Open an inviter’s link, or enter a referral code to continue.')+'</div>'
      +'<input id="apGateCode" type="text" autocapitalize="characters" autocomplete="off" maxlength="6" placeholder="'+L('输入推荐码（6位）','Enter code (6 chars)')+'" style="width:100%;box-sizing:border-box;text-align:center;letter-spacing:4px;text-transform:uppercase;font-size:18px;font-weight:700;padding:13px;border-radius:12px;border:1px solid #ffffff22;background:#0b100d;color:#eaf3ee;outline:none">'
      +'<div id="apGateErr" style="min-height:16px;font-size:12px;color:#ff8a8a;margin:8px 0 2px"></div>'
      +'<button id="apGateGo" style="width:100%;background:linear-gradient(180deg,#d4f06a,#b6e24a);color:#17200b;font-weight:800;font-size:16px;padding:14px;border-radius:13px;border:0;cursor:pointer;margin-top:4px">'+L('进入','Enter')+'</button>'
      +'<div style="margin:16px 0 4px;height:1px;background:#ffffff14"></div>'
      +'<button id="apGateOfficial" style="width:100%;background:transparent;color:#9fb3a6;border:1px solid #ffffff1f;font-weight:600;font-size:13px;padding:12px;border-radius:13px;cursor:pointer">'+L('没有推荐码？由官方带我进入','No code? Enter via the official invite')+'</button>'
      +'<div style="font-size:11px;color:#5f7268;margin-top:14px;line-height:1.6">'+L('进入即接受：参与链上游戏有风险，请理性对待，未成年人勿入。','By entering you accept: on-chain gaming carries risk, play responsibly, not for minors.')+'</div>'
      +'</div>';
    (document.body||document.documentElement).appendChild(b);
    var inp=b.querySelector('#apGateCode');
    b.querySelector('#apGateGo').onclick=function(){ submitCode(inp.value); };
    inp.addEventListener('keydown',function(e){ if(e.key==='Enter') submitCode(inp.value); });
    b.querySelector('#apGateOfficial').onclick=function(){ pass(DEFAULT_REF); toast(L('已由官方带你进入','Entered via official invite')); };
    if(errMsg) setErr(errMsg);
    setTimeout(function(){ try{inp.focus();}catch(e){} },100);
  }
  function setErr(m){ var e=gateEl&&gateEl.querySelector('#apGateErr'); if(e)e.textContent=m||''; }

  function submitCode(v){
    var code=String(v||'').toUpperCase().replace(/[^0-9A-Z]/g,'');
    if(code.length<4){ setErr(L('请输入正确的推荐码','Enter a valid code')); return; }
    var go=gateEl&&gateEl.querySelector('#apGateGo'); if(go){ go.disabled=true; go.textContent=L('验证中…','Checking…'); }
    fetch(API+'/resolve?code='+encodeURIComponent(code),{cache:'no-store'}).then(function(r){return r.json();}).then(function(j){
      if(j&&j.addr){ pass(j.addr); toast(L('邀请码有效，已进入','Code accepted')); }
      else { if(go){go.disabled=false;go.textContent=L('进入','Enter');} setErr(L('推荐码不存在','Code not found')); }
    }).catch(function(){ if(go){go.disabled=false;go.textContent=L('进入','Enter');} setErr(L('网络错误，稍后重试','Network error, try again')); });
  }

  function toast(m){ try{ var t=document.getElementById('apGateToast'); if(!t){t=document.createElement('div');t.id='apGateToast';t.style.cssText='position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:2147483646;background:#1a2a21;border:1px solid #ffffff22;color:#eaf3ee;padding:11px 18px;border-radius:12px;font-size:13px;opacity:0;transition:.3s;font-family:Inter,system-ui,sans-serif;max-width:88%;text-align:center';document.body.appendChild(t);} t.textContent=m;t.style.opacity='1';clearTimeout(window._agt);window._agt=setTimeout(function(){t.style.opacity='0';},3200); }catch(e){} }

  // 启动:带链接/短码直接放行;否则弹门禁
  var shortA=function(a){ return a?a.slice(0,6)+'…'+a.slice(-4):''; };
  function showConfirm(inviter, code){
    if(passed()&&gateEl) return;
    if(gateEl) return;
    try{ bodyOv=document.documentElement.style.overflow; document.documentElement.style.overflow='hidden'; }catch(e){}
    var who = code ? code : shortA(inviter);
    var b=document.createElement('div'); b.id='apGate'; gateEl=b;
    b.style.cssText='position:fixed;inset:0;z-index:2147483600;background:radial-gradient(120% 90% at 50% 0%,#132019 0%,#0a0f0c 60%,#070a08 100%);display:flex;align-items:center;justify-content:center;padding:22px;font-family:Inter,system-ui,-apple-system,"PingFang SC",sans-serif;overflow:auto';
    b.innerHTML=
      '<div style="width:100%;max-width:400px;background:linear-gradient(180deg,#141d18,#0e1511);border:1px solid #c8f66540;border-radius:20px;padding:26px 22px;box-shadow:0 30px 80px #000b;text-align:center">'
      +'<div style="font-size:12px;letter-spacing:2px;color:#7e9583;margin-bottom:6px">ANUBIS PLAY</div>'
      +'<div style="font-size:21px;font-weight:800;color:#eaf3ee;margin-bottom:10px">'+L('你被邀请加入','You’re invited')+'</div>'
      +'<div style="font-size:13px;color:#9fb3a6;margin-bottom:4px">'+L('邀请人 / 推荐码','Inviter / code')+'</div>'
      +'<div style="font-size:22px;font-weight:800;letter-spacing:3px;color:#e0bd68;margin-bottom:16px">'+who+'</div>'
      +'<div style="font-size:12.5px;color:#9fb3a6;line-height:1.7;margin-bottom:18px">'+L('接受后,你玩任何游戏产生的手续费,TA 会拿到一部分返佣——不影响你的奖池、输赢,也不会多花你的钱。绑定一次永久,不可更改。','Accept and the inviter earns a share of the platform fee from your play — it never touches your pool, winnings, or costs you extra. Binding is permanent.')+'</div>'
      +'<button id="apGateAccept" style="width:100%;background:linear-gradient(180deg,#d4f06a,#b6e24a);color:#17200b;font-weight:800;font-size:16px;padding:14px;border-radius:13px;border:0;cursor:pointer">'+L('接受邀请并进入','Accept & enter')+'</button>'
      +'<button id="apGateOther" style="width:100%;background:transparent;color:#7e9583;border:0;font-size:12px;padding:12px 0 0;cursor:pointer">'+L('换一个推荐码','Use a different code')+'</button>'
      +'<div style="font-size:11px;color:#5f7268;margin-top:10px;line-height:1.6">'+L('进入即接受：参与链上游戏有风险,请理性对待,未成年人勿入。','By entering you accept: on-chain gaming carries risk, play responsibly, not for minors.')+'</div>'
      +'</div>';
    (document.body||document.documentElement).appendChild(b);
    b.querySelector('#apGateAccept').onclick=function(){ pass(inviter); toast(L('已接受邀请，进入成功','Invite accepted — welcome')); };
    b.querySelector('#apGateOther').onclick=function(){ removeGate(); showGate(); };
  }
  function boot(){
    var sp; try{ sp=new URLSearchParams(location.search); }catch(e){ sp=null; }
    var ref=sp&&sp.get('ref'), code=sp&&sp.get('code');
    // 通过邀请链接/短码进来:弹确认框显示邀请人,点「接受」才绑定(让用户看到绑定,不再静默)
    if(ref&&ADDR.test(ref)){ showConfirm(ref.toLowerCase(), null); return; }
    if(code){ // 短码:后端解析→显示确认
      fetch(API+'/resolve?code='+encodeURIComponent(code),{cache:'no-store'}).then(function(r){return r.json();}).then(function(j){
        if(j&&j.addr){ showConfirm(j.addr, (j.code||String(code).toUpperCase())); }
        else if(!passed()){ showGate(L('链接里的推荐码无效，请手动输入','The code in the link is invalid, enter one manually')); }
      }).catch(function(){ if(!passed()) showGate(); });
      return;
    }
    if(passed()) return;
    // 已连钱包=已经在用的老用户,直接放行(不被新上的门禁挡住);无 ref/code 时不强绑上级
    try{ var eth=window.ethereum; if(eth){ if(eth.selectedAddress){ pass(); return; } if(eth.request){ eth.request({method:'eth_accounts'}).then(function(a){ if(a&&a[0]&&!passed()) pass(); else if(!passed()) showGate(); }).catch(function(){ if(!passed()) showGate(); }); return; } } }catch(e){}
    showGate();
  }
  // 校正默认推荐人(不阻塞门禁显示)
  try{ fetch(API+'/health',{cache:'no-store'}).then(function(r){return r.json();}).then(function(j){ if(j&&j.defaultRef&&ADDR.test(j.defaultRef)) DEFAULT_REF=j.defaultRef.toLowerCase(); }).catch(function(){}); }catch(e){}
  if(document.readyState!=='loading') boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
