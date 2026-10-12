/* ANUBIS PLAY v3 shared */
(function(){
'use strict';

/* ---------- i18n ---------- */
window.I18n = {
  lang: 'zh',
  dict: {},
  set: function(d){ this.dict = d; },
  t: function(k, vars){
    var lang = this.lang;
    var pack = this.dict[lang] || {};
    var s = pack[k] !== undefined ? pack[k] : k;
    if(vars) for(var key in vars) s = String(s).split('{'+key+'}').join(vars[key]);
    return s;
  },
  apply: function(){
    var lang = this.lang;
    document.documentElement.lang = lang==='zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      el.textContent = I18n.t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function(el){
      el.innerHTML = I18n.t(el.getAttribute('data-i18n-html'));
    });
  },
  toggle: function(){
    this.lang = this.lang==='zh' ? 'en' : 'zh';
    try{ localStorage.setItem('ap_lang', this.lang); }catch(e){}
    this.apply();
    document.querySelectorAll('.lang-btn').forEach(function(b){ b.textContent = I18n.lang==='zh' ? 'EN' : '中文'; });
    if(window.onLangChange) window.onLangChange();
  }
};
try{ var _l = localStorage.getItem('ap_lang'); if(_l==='en'||_l==='zh') I18n.lang=_l; }catch(e){}
function t(k, vars){ return I18n.t(k, vars); }
window.t = t;

/* ---------- chain config ---------- */
window.AP_CHAIN = {
  chainId: 6714, chainHex: '0x1A3A',
  chainName: 'Anubis',
  rpcUrl: 'https://rpc.anubispace.org',
  explorer: 'https://browser.anubispace.org',
  nativeSymbol: 'DAI', nativeDecimals: 18
};

/* ---------- lottery pools ---------- */
window.LOTTERY_POOLS = [
  { sym:'LGNS', contract:'0xb8A20cEFDDAE4b298A4086f3376F01Bdb2d300C7', dec:9,  deploy:16182340, badge:'L' },
  { sym:'USDT', contract:'0x88f94a52BA5B24Be6BC894f16d4657B12BAb2859', dec:6,  deploy:16196737, badge:'₮' },
  { sym:'DAI',  contract:'0x7EC71344CE6fffd602d4911caB54A15f53Cc01A0', dec:18, deploy:16200709, badge:'D' },
  { sym:'A',    contract:'0x6100cA0904E8b9c521129dEC05AfD4F5BBB9D6fb', dec:18, deploy:16202660, badge:'A' },
  { sym:'RM',   contract:'0x5beAdBd9E7C87ACcac218d25aA83Bb707A7E96A3', dec:9,  deploy:16204394, badge:'R' }
];
window.LOTTERY_SEL = { ticketPrice:'1209b1f6', currentRound:'8a19c8bc', rounds:'8c65c81f' };
window.EV_WINNERS = '0xab9af1684355064aa9258894f5c85b041fd7a83e4fe0eb02e607c13d8cb627b4';
window.EV_TICKETS = '0xc8c5c2b0e44fb6312c0098ec42642058527713d0a1d29a5c6ccbfe34d714d41e';

/* ---------- games registry ---------- */
window.GAMES = [
  { id:'lottery', status:'live', path:'games/lottery/', cover:'lottery',
    name:{ zh:'安努比斯彩票', en:'ANUBIS LOTTERY' },
    desc:{ zh:'五大奖池每小时开奖，邀请返佣，资金全程链上可查', en:'5 pools drawn hourly, referral rewards, fully verifiable' } },
  { id:'dragon-tiger', status:'dev', path:'games/dragon-tiger/', cover:'cover-dragon-tiger',
    name:{ zh:'龙虎斗', en:'DRAGON & TIGER' },
    desc:{ zh:'经典龙虎对决，合约开发中', en:'Classic Dragon-Tiger showdown. In development.' } },
  { id:'wheel', status:'dev', path:'games/wheel/', cover:'cover-wheel',
    name:{ zh:'幸运转盘', en:'FORTUNE WHEEL' },
    desc:{ zh:'链上转盘，合约开发中', en:'On-chain wheel. In development.' } },
  { id:'arena', status:'dev', path:'games/arena/', cover:'cover-arena',
    name:{ zh:'竞技场', en:'THE ARENA' },
    desc:{ zh:'玩家对战竞技场，开发中', en:'Player-vs-player arena. In development.' } }
];

/* ---------- image loader (base64 parts -> data URL) ---------- */
var IMG_PARTS = { 'hero-anubis':1, 'cover-dragon-tiger':2, 'cover-wheel':3, 'cover-arena':1 };
var imgCache = {};
window.loadImg = async function(name){
  if(imgCache[name]) return imgCache[name];
  var n = IMG_PARTS[name] || 1, b64 = '';
  for(var i=1;i<=n;i++){
    var r = await fetch((window.SITE_ROOT||'')+'img/'+name+'-'+i+'.txt');
    if(!r.ok) throw new Error('img '+name+' part '+i);
    b64 += (await r.text()).trim();
  }
  var url = 'data:image/jpeg;base64,'+b64;
  imgCache[name]=url; return url;
};
window.paintImgs = function(){
  document.querySelectorAll('img[data-img]').forEach(function(el){
    var name = el.getAttribute('data-img');
    if(el.dataset.done) return; el.dataset.done='1';
    loadImg(name).then(function(url){ el.src=url; el.removeAttribute('data-src'); })
      .catch(function(){ el.style.display='none'; });
  });
  document.querySelectorAll('[data-bgimg]').forEach(function(el){
    var name = el.getAttribute('data-bgimg');
    if(el.dataset.done) return; el.dataset.done='1';
    loadImg(name).then(function(url){ el.style.backgroundImage='url('+url+')'; }).catch(function(){});
  });
};

/* ---------- read-only RPC ---------- */
var _rpcSeq = 0;
window.apRpc = function(method, params){
  var body = JSON.stringify({jsonrpc:'2.0', id:++_rpcSeq, method:method, params:params||[]});
  return fetch(AP_CHAIN.rpcUrl, {method:'POST', headers:{'Content-Type':'application/json'}, body:body})
    .then(function(r){ return r.json(); })
    .then(function(j){ if(j.error) throw new Error(j.error.message||'rpc'); return j.result; });
};
window.apFmt = function(bi, dec, dp){
  dp = dp===undefined ? 2 : dp;
  var neg = bi<0n; if(neg) bi=-bi;
  var s = bi.toString().padStart(dec+1,'0');
  var ip = s.slice(0,-dec)||'0', fp = s.slice(-dec);
  var frac = fp.slice(0,dp);
  ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g,',');
  return (neg?'-':'')+ip+(dp>0?'.'+frac:'');
};

/* ---------- wallet ---------- */
window.Wallet = {
  addr: null, chainOk: false,
  short: function(a){ return a ? a.slice(0,6)+'…'+a.slice(-4) : ''; },
  async connect(){
    if(!window.ethereum){ toast(t('no_wallet')); return null; }
    try{
      var accs = await window.ethereum.request({method:'eth_requestAccounts'});
      if(!accs||!accs.length) return null;
      this.addr = accs[0];
      await this.ensureChain();
      this.paint();
      document.dispatchEvent(new CustomEvent('ap-account',{detail:{addr:this.addr}}));
      return this.addr;
    }catch(e){ if(e&&e.code!==4001) toast(t('conn_fail')); return null; }
  },
  async ensureChain(){
    try{
      var cid = await window.ethereum.request({method:'eth_chainId'});
      if(cid===AP_CHAIN.chainHex){ this.chainOk=true; return true; }
      try{
        await window.ethereum.request({method:'wallet_switchEthereumChain', params:[{chainId:AP_CHAIN.chainHex}]});
      }catch(se){
        if(se&&se.code===4902){
          await window.ethereum.request({method:'wallet_addEthereumChain', params:[{
            chainId:AP_CHAIN.chainHex, chainName:AP_CHAIN.chainName,
            rpcUrls:[AP_CHAIN.rpcUrl], blockExplorerUrls:[AP_CHAIN.explorer],
            nativeCurrency:{name:'DAI', symbol:'DAI', decimals:18}
          }]});
        } else throw se;
      }
      this.chainOk=true; return true;
    }catch(e){ this.chainOk=false; return false; }
  },
  paint(){
    document.querySelectorAll('.wallet-btn').forEach(function(b){
      if(Wallet.addr){
        b.innerHTML = '<span class="net-dot"></span>'+Wallet.short(Wallet.addr);
        b.classList.add('connected');
      } else {
        b.innerHTML = t('connect');
        b.classList.remove('connected');
      }
    });
    var nt=document.querySelector('.net-tag');
    if(nt) nt.innerHTML = '<span class="net-dot"></span>ANUBIS CHAIN';
  },
  init(){
    if(window.ethereum){
      window.ethereum.request({method:'eth_accounts'}).then(function(a){
        if(a&&a.length){ Wallet.addr=a[0]; Wallet.ensureChain().then(function(){ Wallet.paint(); }); }
      }).catch(function(){});
      window.ethereum.on('accountsChanged', function(a){
        Wallet.addr = (a&&a.length)?a[0]:null;
        Wallet.paint();
        document.dispatchEvent(new CustomEvent('ap-account',{detail:{addr:Wallet.addr}}));
      });
      window.ethereum.on('chainChanged', function(){ window.location.reload(); });
    }
    document.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('.wallet-btn');
      if(b) Wallet.connect();
    });
  }
};

/* ---------- toast ---------- */
window.toast = function(msg){
  var el = document.getElementById('toast');
  if(!el){ el=document.createElement('div'); el.id='toast'; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(el._t); el._t=setTimeout(function(){ el.classList.remove('show'); }, 2600);
};

/* ---------- nav ---------- */
var NAV_ITEMS = [
  { k:'nav_games', href:'games/' },
  { k:'nav_records', href:'profile/' },
  { k:'nav_help', href:'help/' },
  { k:'nav_news', href:'news/' }
];
window.SiteNav = {
  render: function(active){
    var R = window.SITE_ROOT || '';
    var old = document.querySelector('.topnav'); if(old) old.remove();
    var links = NAV_ITEMS.map(function(it){
      var cls = active===it.k ? 'on' : '';
      return '<a class="'+cls+'" href="'+R+it.href+'" data-i18n="'+it.k+'">'+t(it.k)+'</a>';
    }).join('');
    var html = '<nav class="topnav"><div class="topnav-in">'
      + '<a class="brand" href="'+R+'">'
      + '<svg width="30" height="30" viewBox="0 0 48 48" fill="none"><path d="M24 3 42 13.5v17L24 45 6 30.5v-17L24 3z" stroke="#1E5541" stroke-width="3"/><path d="M24 12l5 9-5 9-5-9z" fill="#B49A63"/></svg>'
      + '<span>ANUBIS PLAY<span class="sub">ANUBIS CHAIN GAMING</span></span></a>'
      + '<div class="nav-links" id="navLinks">'+links+'</div>'
      + '<div class="nav-right"><span class="net-tag"></span>'
      + '<button class="btn btn-sm btn-ghost lang-btn">'+(I18n.lang==='zh'?'EN':'中文')+'</button>'
      + '<button class="btn btn-sm btn-green wallet-btn">'+t('connect')+'</button>'
      + '<button class="burger" id="burger" aria-label="menu">☰</button>'
      + '</div></div></nav>';
    document.body.insertAdjacentHTML('afterbegin', html);
    document.querySelectorAll('.lang-btn').forEach(function(b){
      b.onclick = function(){ I18n.toggle(); };
    });
    var burger = document.getElementById('burger');
    if(burger) burger.onclick = function(){ document.getElementById('navLinks').classList.toggle('open'); };
    Wallet.paint();
  }
};

/* ---------- footer ---------- */
window.renderFooter = function(){
  var R = window.SITE_ROOT || '';
  var old = document.querySelector('footer'); if(old) old.remove();
  var html = '<footer><div class="wrap"><div class="foot-grid">'
    + '<div><div style="font-weight:800;letter-spacing:.14em;margin-bottom:8px">ANUBIS PLAY</div>'
    + '<div>Anubis Chain (6714) · '+t('foot_data')+'</div>'
    + '<div style="margin-top:10px;max-width:420px">'+t('foot_risk')+'</div></div>'
    + '<div class="foot-links">'
    + '<a href="'+R+'games/">'+t('nav_games')+'</a>'
    + '<a href="'+R+'profile/">'+t('nav_records')+'</a>'
    + '<a href="'+R+'help/">'+t('nav_help')+'</a>'
    + '<a href="'+R+'news/">'+t('nav_news')+'</a>'
    + '</div></div></div></footer>';
  document.body.insertAdjacentHTML('beforeend', html);
};

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded', function(){
  Wallet.init();
  paintImgs();
  document.querySelectorAll('.lang-btn').forEach(function(b){
    b.textContent = I18n.lang==='zh' ? 'EN' : '中文';
  });
});

})();
