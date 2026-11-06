/* 抢币机器人开通检查(2026-11-03):用在 tools/bond-claim 与 tools/helix-burn
   只在后台「白名单开关」打开时起作用:当前连接的钱包没开通 → 顶部提示去开通,并禁用「开启」按钮。
   开关关闭、钱包已开通、接口异常时什么都不做。 */
(function(){
  "use strict";
  var API="https://zjgame.web3origin.com/bondrpc/vip", last="", state=null, bar=null;
  var VIP_LINK=false; // 11-06 老板:涨价前不放「去开通」跳转,只提示联系管理员;涨价后自动放链接(看服务器 raiseAt,不用再手改)
  var RAISE_AT=Date.UTC(2026,10,8,12,0,0)/1000; // 11-08 20:00 北京;服务器返回 raiseAt 时以服务器为准
  function linkOn(){ var at=(state&&state.raiseAt)||RAISE_AT, now=(state&&state.now)?state.now:Date.now()/1000; return VIP_LINK||now>=at; }
  function prov(){ var w=window; if(w.okxwallet&&w.okxwallet.request) return w.okxwallet; if(w.ethereum&&w.ethereum.request) return w.ethereum; if(w.bitkeep&&w.bitkeep.ethereum) return w.bitkeep.ethereum; return null; }
  function show(on){
    if(on&&!bar){
      bar=document.createElement("div");
      bar.style.cssText="position:sticky;top:0;z-index:999;margin:-4px 0 12px;background:#2b2418;border:1px solid #d9b25f;color:#f1dfc0;border-radius:14px;padding:12px 14px;font:14px/1.6 -apple-system,'PingFang SC','Microsoft YaHei',sans-serif";
      document.body.insertBefore(bar,document.body.firstChild);
    }
    if(on&&bar) bar.innerHTML='🔒 <b>这个钱包还没开通抢币机器人</b>，整点准时发送用不了。'+(linkOn()?'<a href="/tools/bot-vip/" style="color:#7fd3a6;font-weight:700;margin-left:4px">去开通 →</a>':'如需开通请联系管理员。');
    if(bar) bar.style.display=on?"":"none";
    var b=document.getElementById("btnArm"); if(b){ if(on){ b.disabled=true; b.dataset.gate="1"; } else if(b.dataset.gate){ b.disabled=false; delete b.dataset.gate; } }
  }
  async function check(){
    try{
      var p=prov(); if(!p) return;
      var a=await p.request({method:"eth_accounts"}); a=String((a&&a[0])||"").toLowerCase(); if(!a){ show(false); return; }
      if(a!==last||!state){ last=a; var r=await fetch(API+"?a="+a,{cache:"no-store"}); state=await r.json(); }
      show(!!(state&&state.enforce&&state.member===false));
    }catch(e){}
  }
  setInterval(check,4000); setTimeout(check,1500);
  setInterval(function(){ state=null; },60000); // 每分钟重新问一次(刚付完费能及时解锁)
})();
