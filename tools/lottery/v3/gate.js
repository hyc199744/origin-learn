/* 邀请准入只信权威绑定查询；个人中心/领取/帮助始终可进入。 */
(function(){
  'use strict';
  var A=window.APPlatform;if(!A)return;
  var el=null,busy=false,current=null,seq=0,legacy=[],background=[],previousFocus=null;
  var base=new URL('.',document.currentScript.src),path=location.pathname;
  var protectedPage=!/(?:\/account\/|\/invite\/|\/help\/|\/news\/)/.test(path);
  function url(p){return new URL(p,base).href;}
  function setStatus(s,error){var e=el&&el.querySelector('[role=status]');if(e){e.textContent=s;e.classList.toggle('ap-error',!!error);}}
  function close(){if(el){el.remove();el=null;}background.forEach(function(item){item.node.inert=item.inert;});background=[];document.documentElement.style.overflow='';if(previousFocus&&previousFocus.isConnected)previousFocus.focus();previousFocus=null;}
  function render(){
    document.querySelectorAll('dialog[open]').forEach(function(d){d.close();});
    ['langMenu','langBackdrop'].forEach(function(id){var menu=document.getElementById(id);if(menu)menu.hidden=true;});
    if(!el){previousFocus=document.activeElement;background=Array.from(document.body.children).map(function(node){var item={node:node,inert:node.inert};node.inert=true;return item;});el=document.createElement('div');el.className='ap-gate';el.id='apGate';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','apGateTitle');document.body.appendChild(el);document.documentElement.style.overflow='hidden';}
    var c=A.getCandidate();
    el.innerHTML='<div class="ap-gate-card"><div class="ap-muted">ANUBIS PLAY</div><h2 id="apGateTitle">'+A.L('确认邀请，进入平台','Confirm your invitation')+'</h2>'
      +'<p class="ap-muted">'+A.L('连接钱包后确认你的邀请人。只有绑定成功才可参与游戏；查看资产、退款和帮助始终开放。','Connect and confirm your inviter before playing. Assets, refunds and help remain accessible.')+'</p>'
      +(current?'<div class="ap-muted">'+A.L('当前钱包','Wallet')+' '+A.esc(A.short(current))+'</div>':'<button class="ap-button" id="apGateConnect">'+A.L('连接钱包','Connect wallet')+'</button>')
      +(c?'<div class="ap-block"><span class="ap-muted">'+A.L('待确认邀请人','Inviter to confirm')+'</span><div class="ap-code">'+A.esc(c.code||A.short(c.address))+'</div><div class="ap-muted">'+A.esc(c.address)+'</div><p class="ap-muted">'+A.L('绑定后不可更改。邀请人从平台手续费中获得返佣，不额外增加你的费用。','Binding is permanent. Your inviter earns from platform fees at no extra cost to you.')+'</p><button class="ap-button" id="apGateBind" '+(!current?'disabled':'')+'>'+A.L('确认此邀请人并签名绑定','Confirm this inviter & sign')+'</button></div>':'')
      +'<label class="ap-muted" for="apGateCode">'+A.L('输入或更换 6 位推荐码','Enter or change a 6-character code')+'</label><input class="ap-input" id="apGateCode" maxlength="6" autocomplete="off" autocapitalize="characters" placeholder="ABC123"><button class="ap-button secondary" id="apGateResolve">'+A.L('查询推荐码','Check code')+'</button>'
      +(legacy.length?'<div class="ap-block"><p class="ap-muted">'+A.L('检测到旧彩票邀请关系：','Existing V3 lottery inviter: ')+legacy.map(function(r){return A.esc(r.sym+' '+A.short(r.referrer));}).join(' · ')+'</p><button class="ap-button secondary" id="apGateLegacy">'+A.L('核对并沿用旧邀请人','Review & use existing inviter')+'</button></div>':'')
      +'<button class="ap-button secondary" id="apGateOfficial">'+A.L('没有推荐码：查看官方邀请','No code: view official invitation')+'</button><button class="ap-button secondary" id="apGateRefresh">'+A.L('重新查询绑定状态','Refresh invitation status')+'</button><button class="ap-button secondary" id="apGateLanguage">English / 中文</button><div role="status" aria-live="polite"></div>'
      +'<div class="ap-links"><a href="'+url('account/')+'">'+A.L('资产与退款','Assets & refunds')+'</a><a href="'+url('invite/')+'">'+A.L('邀请中心','Invitations')+'</a><a href="'+url('help/')+'">'+A.L('帮助','Help')+'</a></div><p class="ap-muted">'+A.L('参与可能损失本金，请理性参与，未成年人勿入。','You may lose your stake. Play responsibly. Adults only.')+'</p></div>';
    function task(fn){return async function(){if(busy)return;busy=true;el.querySelectorAll('button').forEach(function(b){b.disabled=true;});setStatus(A.L('处理中…','Working…'));try{await fn();}catch(e){setStatus(e.message,true);}finally{busy=false;if(el)el.querySelectorAll('button').forEach(function(b){b.disabled=b.id==='apGateBind'&&!current;});}};}
    var b=el.querySelector('#apGateConnect');if(b)b.onclick=task(async function(){current=await A.connect();var p=await A.profile(current,true);if(p.referrer){A.emit('bound',{address:current,profile:p});close();}else{legacy=(await A.legacyReferrers(current)).filter(function(r){return r.referrer;});render();}});
    el.querySelector('#apGateResolve').onclick=task(async function(){await A.resolve(el.querySelector('#apGateCode').value);render();setStatus(A.L('请核对邀请人后确认绑定','Check the inviter before confirming'));});
    el.querySelector('#apGateOfficial').onclick=task(async function(){var h=await A.json(A.API+'/health');if(!h.ok||!h.defaultRef)throw A.fail('官方邀请暂不可用，请重试','Official invite unavailable; retry');A.setCandidate(h.defaultRef);render();});
    b=el.querySelector('#apGateBind');if(b)b.onclick=task(async function(){await A.bind(current);close();});
    el.querySelector('#apGateRefresh').onclick=task(check);
    el.querySelector('#apGateLanguage').onclick=function(){var lang=A.L('en','zh');if(window.setLang)window.setLang(lang);else{try{localStorage.setItem('aplang',lang);}catch(_){}A.emit('language',{language:lang});}render();};
    b=el.querySelector('#apGateLegacy');if(b)b.onclick=task(async function(){var refs=Array.from(new Set(legacy.map(function(r){return r.referrer;})));if(refs.length!==1)throw A.fail('各旧奖池邀请人不同，请先处理迁移；资产领取不受影响','V3 pools have different inviters; resolve migration first. Withdrawals remain available.');A.setCandidate(refs[0]);render();});
    var focus=el.querySelector('button:not(:disabled),input,a');if(focus)focus.focus({preventScroll:true});
  }
  async function check(){
    var id=++seq;try{current=await A.account();legacy=[];if(id!==seq)return;if(current){var p=await A.profile(current,true);if(id!==seq)return;if(p.referrer){close();A.emit('gate-ready',{address:current});return;}legacy=(await A.legacyReferrers(current)).filter(function(r){return r.referrer;});if(id!==seq)return;}if(protectedPage)render();}
    catch(e){if(protectedPage){render();setStatus(e.message,true);}}
  }
  async function boot(){
    try{var q=new URLSearchParams(location.search);if(q.get('ref'))A.setCandidate(q.get('ref'));else if(q.get('code'))await A.resolve(q.get('code'));}catch(e){if(protectedPage){render();setStatus(e.message,true);}}
    await check();
  }
  window.APInviteGate={show:render,check:check};
  window.addEventListener('ap:binding-required',function(){render();setStatus(A.L('请完成邀请绑定后继续','Complete your invitation to continue'),true);});
  window.addEventListener('ap:bound',close);
  window.addEventListener('ap:wallet-change',check);
  window.addEventListener('ap:language',function(){if(el)render();});
  document.addEventListener('keydown',function(e){if(!el||e.key!=='Tab')return;var items=Array.from(el.querySelectorAll('button:not(:disabled),input,a')),first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
