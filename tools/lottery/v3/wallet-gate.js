/* ANUBIS PLAY 平台通用「钱包引导」—— 普通浏览器(无Web3钱包)打开时,引导去钱包App的内置浏览器
   自带中英双语(按 localStorage ap_lang 或浏览器语言),不依赖各页自己的 i18n。深链用当前页URL,拉起后回到同一页。 */
(function(){
  'use strict';
  try{ if(sessionStorage.getItem('ap_wg_skip')==='1') return; }catch(e){}
  function pickEN(){ try{ var s=localStorage.getItem('ap_lang'); if(s==='en')return true; if(s==='zh')return false; }catch(e){} return (navigator.language||navigator.userLanguage||'').toLowerCase().indexOf('zh')!==0; }
  var EN=pickEN();
  var T = EN ? {
    title:'Web3 wallet required',
    desc:'Open this site in a Web3 wallet to connect. Use a wallet below, or visit it inside your wallet app’s browser.',
    okx:'Open in OKX Wallet', mm:'Open in MetaMask', tp:'Open in TokenPocket', copy:'Copy link',
    copied:'Copied — paste it in your wallet app’s browser', skip:'Keep browsing (connect later)'
  } : {
    title:'需要 Web3 钱包',
    desc:'请在 Web3 钱包里打开本站。用下方钱包打开，或在钱包 App 的浏览器里访问本站。',
    okx:'在 OKX 钱包打开', mm:'在 MetaMask 打开', tp:'在 TP 钱包打开', copy:'复制网址',
    copied:'已复制，去钱包App浏览器粘贴打开', skip:'继续浏览（稍后连接）'
  };
  var URL=location.href;
  function hasWallet(){ return !!(window.ethereum||window.okxwallet||window.web3); }
  function rm(){ var g=document.getElementById('apWalletGate'); if(g)g.remove(); }
  function btn(href,txt,primary){
    return '<a href="'+href+'" style="display:block;'+(primary
      ?'background:linear-gradient(180deg,#d4f06a,#b6e24a);color:#17200b'
      :'background:#17231b;color:#c8f665;border:1px solid #c8f66555')
      +';font-weight:800;font-size:15px;padding:13px;border-radius:12px;text-decoration:none;margin-bottom:10px">'+txt+'</a>';
  }
  function show(){
    if(hasWallet()){ rm(); return; }
    if(document.getElementById('apWalletGate')) return;
    var mm='https://metamask.app.link/dapp/'+location.host+location.pathname+location.search;
    var okx='okx://wallet/dapp/url?dappUrl='+encodeURIComponent(URL);
    var tp='tpdapp://open?params='+encodeURIComponent(JSON.stringify({url:URL,chain:'ETH',source:'ANUBIS PLAY'}));
    var w=document.createElement('div'); w.id='apWalletGate';
    w.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(6,16,11,.93);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px';
    w.innerHTML='<div style="width:100%;max-width:380px;background:linear-gradient(180deg,#141c18,#0f1713);border:1px solid #c8f66540;border-radius:18px;padding:22px;box-shadow:0 24px 60px #000a;text-align:center;color:#eaf3ee;font-family:Inter,system-ui,-apple-system,\'PingFang SC\',sans-serif">'
      +'<div style="font-size:34px;margin-bottom:4px">🔐</div>'
      +'<h2 style="margin:0 0 6px;font-size:19px;color:#c8f665">'+T.title+'</h2>'
      +'<p style="margin:0 0 16px;font-size:13px;color:#9fb3a6;line-height:1.7">'+T.desc+'</p>'
      +btn(okx,T.okx,true)+btn(mm,T.mm,false)+btn(tp,T.tp,false)
      +'<button id="apWgCopy" type="button" style="display:block;width:100%;background:#0f1519;color:#9fb3a6;border:1px solid #ffffff1a;font-weight:700;font-size:13px;padding:11px;border-radius:12px;cursor:pointer;margin-bottom:10px">'+T.copy+'</button>'
      +'<button id="apWgSkip" type="button" style="background:none;border:0;color:#7e9583;font-size:12px;cursor:pointer;padding:6px">'+T.skip+'</button>'
      +'</div>';
    document.body.appendChild(w);
    document.getElementById('apWgCopy').onclick=function(){ var b=this; try{ navigator.clipboard.writeText(URL); b.textContent=T.copied; }catch(e){ b.textContent=URL; } };
    document.getElementById('apWgSkip').onclick=function(){ try{sessionStorage.setItem('ap_wg_skip','1');}catch(e){} rm(); };
  }
  function check(){ if(hasWallet()){ rm(); } else { show(); } }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){ setTimeout(check,700); });
  else setTimeout(check,700);
  setTimeout(check,1800);
  window.addEventListener('ethereum#initialized',function(){ if(hasWallet())rm(); },{once:true});
})();
