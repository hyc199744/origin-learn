/* ANUBIS PLAY shared module: i18n + wallet + nav + games registry + rpc + ui helpers
   Every page sets window.SITE_ROOT ('', '../' or '../../') and window.PAGE_I18N before loading this file. */
(function(){
'use strict';
var R = window.SITE_ROOT || '';
var ANUBIS = {
  chainId: 6714, chainHex: '0x1A3A', chainName: 'Anubis',
  native: { name:'DAI', symbol:'DAI', decimals:18 },
  rpc: 'https://rpc.anubispace.org',
  explorer: 'https://browser.anubispace.org'
};

/* ---------------- toast ---------------- */
window.toast = function(msg){
  var t = document.getElementById('toast');
  if(!t){ t = document.createElement('div'); t.id='toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(function(){ t.classList.remove('show'); }, 2600);
};

/* ---------------- i18n ---------------- */
var I18n = {
  lang: localStorage.getItem('ap-lang') || 'zh',
  dict: window.PAGE_I18N || {zh:{},en:{}},
  t: function(k){ var d=this.dict[this.lang]||{}; return (d[k]!==undefined?d[k]:((this.dict.zh||{})[k]||k)); },
  apply: function(){
    document.documentElement.lang = this.lang==='zh' ? 'zh-CN' : 'en';
    var els = document.querySelectorAll('[data-i18n]');
    for(var i=0;i<els.length;i++){ els[i].textContent = this.t(els[i].getAttribute('data-i18n')); }
    var htmls = document.querySelectorAll('[data-i18n-html]');
    for(var j=0;j<htmls.length;j++){ htmls[j].innerHTML = this.t(htmls[j].getAttribute('data-i18n-html')); }
    var phs = document.querySelectorAll('[data-i18n-ph]');
    for(var k=0;k<phs.length;k++){ phs[k].placeholder = this.t(phs[k].getAttribute('data-i18n-ph')); }
    var lb = document.getElementById('langBtn');
    if(lb) lb.textContent = this.lang==='zh' ? 'EN' : '中文';
    if(window.SiteNav) SiteNav.refreshActive();
  },
  toggle: function(){ this.lang = this.lang==='zh' ? 'en' : 'zh'; localStorage.setItem('ap-lang', this.lang); this.apply(); if(window.onLangChange) window.onLangChange(); }
};
window.I18n = I18n;
window.t = function(k){ return I18n.t(k); };

/* ---------------- rpc helper (read-only, public RPC) ---------------- */
function rpcCall(method, params){
  return fetch(ANUBIS.rpc, { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ jsonrpc:'2.0', id:Date.now(), method:method, params:params||[] })
  }).then(function(r){ return r.json(); }).then(function(j){
    if(j.error) throw new Error(j.error.message||'rpc error');
    return j.result;
  });
}
window.apRpc = rpcCall;
function hexToBig(h){ return BigInt(h); }
function fmtWei(wei, dec){
  dec = dec===undefined?18:dec;
  var neg = wei < 0n; if(neg) wei = -wei;
  var s = wei.toString().padStart(dec+1,'0');
  var ip = s.slice(0, s.length-dec), fp = s.slice(s.length-dec).replace(/0+$/,'');
  return (neg?'-':'') + ip + (fp?'.'+fp:'');
}
window.apFmt = fmtWei;

/* ---------------- wallet ---------------- */
function detectProvider(){
  var w = window;
  if(w.okxwallet && w.okxwallet.ethereum) return { p:w.okxwallet.ethereum, name:'OKX Wallet' };
  if(w.okxwallet) return { p:w.okxwallet, name:'OKX Wallet' };
  if(w.tokenpocket && w.tokenpocket.ethereum) return { p:w.tokenpocket.ethereum, name:'TokenPocket' };
  if(w.ethereum){
    var e = w.ethereum;
    var nm = 'EVM Wallet';
    if(e.isTokenPocket) nm='TokenPocket'; else if(e.isOkxWallet||e.isOKXWallet) nm='OKX Wallet'; else if(e.isMetaMask) nm='MetaMask';
    return { p:e, name:nm };
  }
  return null;
}
var Wallet = {
  address: null, chainId: null, providerName: null, _p: null, _subs: [],
  onChange: function(fn){ this._subs.push(fn); },
  _emit: function(){ for(var i=0;i<this._subs.length;i++){ try{ this._subs[i](); }catch(e){} } },
  short: function(a){ return a ? a.slice(0,6)+'…'+a.slice(-4) : ''; },
  async connect(){
    var d = detectProvider();
    if(!d){ toast(I18n.lang==='zh' ? '未检测到钱包，请在 OKX / TokenPocket / MetaMask 中打开' : 'No wallet detected. Please open in OKX / TokenPocket / MetaMask.'); return false; }
    this._p = d.p; this.providerName = d.name;
    try{
      var accts = await d.p.request({ method:'eth_requestAccounts' });
      if(!accts || !accts.length) return false;
      this.address = accts[0];
      await this.ensureChain();
      var cid = await d.p.request({ method:'eth_chainId' });
      this.chainId = parseInt(cid, 16);
      this._bindEvents();
      this._emit(); return true;
    }catch(e){ toast((I18n.lang==='zh'?'连接失败：':'Connect failed: ')+(e.message||e)); return false; }
  },
  async ensureChain(){
    var p = this._p; if(!p) return;
    try{
      await p.request({ method:'wallet_switchEthereumChain', params:[{ chainId: ANUBIS.chainHex }] });
    }catch(e){
      if(e && e.code===4902){
        await p.request({ method:'wallet_addEthereumChain', params:[{
          chainId: ANUBIS.chainHex, chainName: ANUBIS.chainName,
          nativeCurrency: ANUBIS.native, rpcUrls:[ANUBIS.rpc], blockExplorerUrls:[ANUBIS.explorer]
        }]});
      } else throw e;
    }
  },
  _bindEvents(){
    var self=this, p=this._p; if(!p || !p.on || p._apBound) return; p._apBound=true;
    p.on('accountsChanged', function(a){ self.address = (a&&a[0])||null; self._emit(); });
    p.on('chainChanged', function(c){ self.chainId = parseInt(c,16); self._emit(); });
  },
  get connected(){ return !!this.address; },
  isAnubis: function(){ return this.chainId===ANUBIS.chainId; }
};
window.SiteWallet = Wallet;

/* ---------------- nav ---------------- */
var LOGO_SVG = '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">'
  +'<path d="M24 3 42 13.5v17L24 45 6 30.5v-17L24 3z" stroke="#d4af37" stroke-width="2.5"/>'
  +'<path d="M24 10l5.5 9.5L24 29l-5.5-9.5L24 10z" fill="#d4af37"/>'
  +'<path d="M15 30l4-2 5 4 5-4 4 2-3 6H18l-3-6z" fill="#35e0ff" opacity=".85"/></svg>';
var NAV_ITEMS = [
  { k:'nav_home',   href:'' },
  { k:'nav_games',  href:'games/' },
  { k:'nav_profile',href:'profile/' },
  { k:'nav_help',   href:'#how', help:true },
  { k:'nav_news',   href:'news/' }
];
var SiteNav = {
  render: function(active){
    this._active = active;
    var nav = document.createElement('nav'); nav.className='nav';
    var homeHref = R || './';
    var links = NAV_ITEMS.map(function(it){
      var href = it.help ? (R||'./')+'#how' : R + it.href;
      var cls = (active===it.k) ? 'on' : '';
      return '<a data-nav="'+it.k+'" class="'+cls+'" href="'+href+'" data-i18n="'+it.k+'">'+I18n.t(it.k)+'</a>';
    }).join('');
    nav.innerHTML =
      '<div class="nav-in">'
      +'<a class="brand" href="'+homeHref+'">'+LOGO_SVG+'<span>ANUBIS <span class="gold">PLAY</span></span></a>'
      +'<div class="nav-links" id="navLinks">'+links+'</div>'
      +'<div class="nav-acts">'
      +'<button class="lang-btn" id="langBtn" title="language">EN</button>'
      +'<button class="wbtn" id="wbtn"><span class="dot"></span><span class="wbtn-txt" data-i18n="connect">连接钱包</span></button>'
      +'<button class="burger" id="burger">☰</button>'
      +'</div></div>';
    document.body.insertBefore(nav, document.body.firstChild);
    document.getElementById('langBtn').onclick = function(){ I18n.toggle(); };
    document.getElementById('burger').onclick = function(){ document.getElementById('navLinks').classList.toggle('open'); };
    var ls = document.getElementById('navLinks').querySelectorAll('a');
    for(var i=0;i<ls.length;i++){ ls[i].addEventListener('click', function(){ document.getElementById('navLinks').classList.remove('open'); }); }
    document.getElementById('wbtn').onclick = function(){ Wallet.connect(); };
    Wallet.onChange(function(){ SiteNav.paintWallet(); });
    this.paintWallet();
  },
  refreshActive: function(){
    var ls = document.querySelectorAll('#navLinks a');
    for(var i=0;i<ls.length;i++){
      ls[i].classList.toggle('on', ls[i].getAttribute('data-nav')===this._active);
    }
  },
  paintWallet: function(){
    var b = document.getElementById('wbtn'); if(!b) return;
    var label = b.querySelector('.wbtn-txt');
    if(Wallet.connected){
      b.classList.add('connected');
      var tag = Wallet.isAnubis() ? '' : ' · ⚠️';
      label.textContent = Wallet.short(Wallet.address) + tag;
      b.title = Wallet.address + ' (' + (Wallet.providerName||'') + ')';
    }else{
      b.classList.remove('connected');
      label.textContent = I18n.t('connect');
      b.title = '';
    }
  }
};
window.SiteNav = SiteNav;

/* ---------------- lottery pools (mirror of on-chain V3 pools) ---------------- */
window.LOTTERY_POOLS = [
  { sym:'LGNS', contract:'0xb8A20cEFDDAE4b298A4086f3376F01Bdb2d300C7', dec:9,  deploy:16182340 },
  { sym:'USDT', contract:'0x88f94a52BA5B24Be6BC894f16d4657B12BAb2859', dec:6,  deploy:16196737 },
  { sym:'DAI',  contract:'0x7EC71344CE6fffd602d4911caB54A15f53Cc01A0', dec:18, deploy:16200709 },
  { sym:'A',    contract:'0x6100cA0904E8b9c521129dEC05AfD4F5BBB9D6fb', dec:18, deploy:16202660 },
  { sym:'RM',   contract:'0x5beAdBd9E7C87ACcac218d25aA83Bb707A7E96A3', dec:9,  deploy:16204394 }
];
window.LOTTERY_SEL = { ticketPrice:'1209b1f6', currentRound:'8a19c8bc', rounds:'8c65c81f' };
window.EV_WINNERS = '0xab9af1684355064aa9258894f5c85b041fd7a83e4fe0eb02e607c13d8cb627b4'; // WinnersDrawn
window.EV_TICKETS = '0xc8c5c2b0e44fb6312c0098ec42642058527713d0a1d29a5c6ccbfe34d714d41e'; // TicketsBought

/* unified SVG game covers (same ratio, same light) */
window.gameCover = function(id){
  var gold1='#f5d67b', gold2='#8a6d1f', bg1='#141019', bg2='#0a0a10';
  var inner = '';
  if(id==='lottery') inner = '<rect x="28" y="30" width="104" height="52" rx="8" fill="none" stroke="'+gold1+'" stroke-width="3"/>'
    +'<circle cx="80" cy="56" r="10" fill="none" stroke="'+gold1+'" stroke-width="3"/>'
    +'<path d="M28 42h20M28 70h20M132 42h-20M132 70h-20" stroke="'+gold1+'" stroke-width="3"/>';
  else if(id==='dragon-tiger') inner = '<path d="M80 22 L102 62 L58 62 Z" fill="none" stroke="'+gold1+'" stroke-width="3"/>'
    +'<path d="M80 98 L58 58 L102 58 Z" fill="none" stroke="#35e0ff" stroke-width="3" opacity=".8"/>'
    +'<circle cx="80" cy="60" r="6" fill="'+gold1+'"/>';
  else if(id==='wheel') inner = '<circle cx="80" cy="60" r="34" fill="none" stroke="'+gold1+'" stroke-width="3"/>'
    +'<path d="M80 26v68M46 60h68M56 36l48 48M104 36l-48 48" stroke="'+gold1+'" stroke-width="2" opacity=".7"/>'
    +'<circle cx="80" cy="60" r="6" fill="'+gold1+'"/><path d="M80 60 L80 30" stroke="#35e0ff" stroke-width="4"/>';
  else inner = '<path d="M52 88 L100 40 M108 88 L60 40" stroke="'+gold1+'" stroke-width="5" stroke-linecap="round"/>'
    +'<path d="M52 88l-8 8M108 88l8 8" stroke="'+gold1+'" stroke-width="5" stroke-linecap="round"/>';
  return '<svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block">'
    +'<defs><linearGradient id="g'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+bg1+'"/><stop offset="1" stop-color="'+bg2+'"/></linearGradient></defs>'
    +'<rect width="160" height="120" fill="url(#g'+id+')"/>'
    +'<path d="M0 118h160" stroke="'+gold2+'" stroke-width="1" opacity=".5"/>'
    + inner + '</svg>';
};

/* ---------------- games registry ----------------
   Add a new game: 1) add entry here  2) create directory <path>/index.html. Done. */
window.GAMES = [
  { id:'lottery', status:'live',
    path:'games/lottery/',
    name:{ zh:'安努比斯彩票', en:'ANUBIS LOTTERY' },
    desc:{ zh:'五大奖池每小时开奖，邀请返佣，资金全程链上可查', en:'5 pools drawn hourly, referral rewards, fully verifiable on-chain' } },
  { id:'dragon-tiger', status:'soon',
    path:'games/dragon-tiger/',
    name:{ zh:'龙虎斗', en:'DRAGON TIGER' },
    desc:{ zh:'经典龙虎对决，合约开发中', en:'Classic Dragon-Tiger showdown. Contracts in development.' } },
  { id:'wheel', status:'soon',
    path:'games/wheel/',
    name:{ zh:'幸运转盘', en:'LUCKY WHEEL' },
    desc:{ zh:'链上转盘，合约开发中', en:'On-chain wheel. Contracts in development.' } },
  { id:'arena', status:'soon',
    path:'games/arena/',
    name:{ zh:'竞技场', en:'ARENA BATTLE' },
    desc:{ zh:'玩家对战竞技场，开发中', en:'Player-vs-player arena. In development.' } }
];
window.renderGameCards = function(elId, onlyLive){
  var el = document.getElementById(elId); if(!el) return;
  var lang = I18n.lang;
  el.innerHTML = window.GAMES.filter(function(g){ return !onlyLive || g.status==='live'; }).map(function(g){
    var live = g.status==='live';
    var badge = live
      ? '<span class="badge live">'+(lang==='zh'?'LIVE':'LIVE')+'</span>'
      : '<span class="badge soon">'+(lang==='zh'?'即将上线':'COMING SOON')+'</span>';
    var btn = live
      ? '<span class="go">'+(lang==='zh'?'立即进入 →':'Enter now →')+'</span>'
      : '<span class="go">'+(lang==='zh'?'敬请期待':'Coming soon')+'</span>';
    var inner = '<div class="float-orb"></div>'+badge
      +'<div class="gcover">'+window.gameCover(g.id)+'</div>'
      +'<h3>'+g.name[lang]+'</h3><p>'+g.desc[lang]+'</p>'+btn;
    return live
      ? '<a class="gcard live" href="'+R+g.path+'">'+inner+'</a>'
      : '<div class="gcard soon">'+inner+'</div>';
  }).join('');
};

/* ---------------- footer ---------------- */
window.renderFooter = function(){
  var f = document.createElement('footer');
  var lang = I18n.lang;
  f.innerHTML = '<div class="wrap"><div class="foot-in">'
    +'<a class="brand" href="'+(R||'./')+'">'+LOGO_SVG+'<span style="font-size:13px">ANUBIS <span class="gold">PLAY</span></span></a>'
    +'<div class="foot-links">'
    +'<a href="'+R+'games/">'+t('nav_games')+'</a>'
    +'<a href="'+R+'games/lottery/">'+t('nav_lottery')+'</a>'
    +'<a href="'+R+'assets/">'+t('nav_assets')+'</a>'
    +'<a href="'+R+'news/">'+t('nav_news')+'</a>'
    +'</div></div>'
    +'<div class="risk">'
    +(lang==='zh'
      ? '⚠️ 风险提示：链上游戏存在资金损失风险，请仅使用可承受损失的资金参与，并遵守所在地区法律法规。平台不接触用户私钥、不托管资金，所有交易均由用户钱包签名确认。未满 18 岁请勿参与。'
      : '⚠️ Risk notice: On-chain games involve risk of fund loss. Only play with funds you can afford to lose and comply with your local laws. The platform never touches your private keys or custodies funds; every transaction is signed in your own wallet. No participation under 18.')
    +'<br><span class="small">ANUBIS PLAY · Anubis Chain (6714) · '+t('foot_data')+'</span></div></div>';
  document.body.appendChild(f);
};

/* ---------------- particles ---------------- */
window.initParticles = function(canvasId){
  var cv = document.getElementById(canvasId); if(!cv) return;
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var ctx = cv.getContext('2d'), W, H, ps=[];
  var N = window.innerWidth < 700 ? 22 : 42;
  function size(){
    var w = cv.clientWidth || (cv.parentElement && cv.parentElement.clientWidth) || window.innerWidth;
    var h = cv.clientHeight || (cv.parentElement && cv.parentElement.clientHeight) || 400;
    if(w < 10 || h < 10) return; // 布局未完成时跳过，下次 resize 重试
    W = cv.width = w; H = cv.height = h;
  }
  size(); window.addEventListener('resize', size);
  setTimeout(size, 500); // 字体/布局稳定后再校准一次
  for(var i=0;i<N;i++) ps.push({ x:Math.random(), y:Math.random(), vx:(Math.random()-.5)*.0007, vy:(Math.random()-.5)*.0007,
    r:Math.random()*1.5+.5, c: Math.random()<.25 ? '53,224,255' : '212,175,55' });
  (function tick(){
    if(!W || !H){ requestAnimationFrame(tick); return; }
    ctx.clearRect(0,0,W,H);
    for(var i=0;i<ps.length;i++){ var p=ps[i];
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>1) p.vx*=-1; if(p.y<0||p.y>1) p.vy*=-1;
      var x=p.x*W, y=p.y*H;
      ctx.beginPath(); ctx.arc(x,y,p.r,0,7); ctx.fillStyle='rgba('+p.c+',.45)'; ctx.fill();
      for(var j=i+1;j<ps.length;j++){ var q=ps[j], dx=(p.x-q.x)*W, dy=(p.y-q.y)*H, d=Math.sqrt(dx*dx+dy*dy);
        if(d<110){ ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(q.x*W,q.y*H);
          ctx.strokeStyle='rgba('+p.c+','+(0.08*(1-d/110))+')'; ctx.lineWidth=1; ctx.stroke(); } }
    }
    requestAnimationFrame(tick);
  })();
};

/* address click-to-copy (event delegation) */
document.addEventListener('click', function(e){
  var el = e.target.closest && e.target.closest('[data-copy]');
  if(!el) return;
  var v = el.getAttribute('data-copy');
  function done(){ toast(I18n.lang==='zh' ? '已复制' : 'Copied'); }
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(v).then(done).catch(function(){ fallback(); }); }
  else fallback();
  function fallback(){ var ta=document.createElement('textarea'); ta.value=v; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');done();}catch(err){} document.body.removeChild(ta); }
});
})();
