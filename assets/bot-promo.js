/* 首页通知弹窗:起源抢币机器人(2026-11-03)
   每次打开首页弹一次(同一会话只弹一次);点「不再提示」后永久不弹。
   2026-11-06 加涨价倒计时:涨价前显示「现在 50 U · X 月 X 日 20:00 起 100 U」+ 倒计时;
   点过「不再提示」的人,涨价通知再弹一次(只一次);到点后自动变回普通弹窗(价格 100)。
   价格/涨价时刻/开通人数从服务器读,和付费页一致;读不到用下面写死的值。 */
(function(){
  "use strict";
  var OFF="w3o_bot_promo_off", SES="w3o_bot_promo_seen", RSEEN="w3o_bot_promo_raise_seen", URL="/tools/bot-vip/";
  var API="https://zjgame.web3origin.com/bondrpc/vip";
  var RZ={old:50,nw:100,at:Date.UTC(2026,10,8,12,0,0)/1000,skew:0,opened:0};
  function g(s,k){try{return s.getItem(k);}catch(e){return null;}}
  function p(s,k,v){try{s.setItem(k,v);}catch(e){}}
  function nowS(){ return Date.now()/1000+RZ.skew; }
  function raising(){ return RZ.at-nowS()>0; }
  if(g(sessionStorage,SES)==="1")return;
  var en=location.pathname.indexOf("/en")===0||/^en/i.test(g(localStorage,"web3origin_locale")||"");
  function p2(n){ return (n<10?"0":"")+n; }
  function left(){ var s=Math.max(0,Math.floor(RZ.at-nowS())), d=Math.floor(s/86400); return (d>0?d+(en?"d ":" 天 "):"")+p2(Math.floor(s%86400/3600))+":"+p2(Math.floor(s%3600/60))+":"+p2(s%60); }
  function whenTx(){ var w=new Date((RZ.at+28800)*1000), hh=p2(w.getUTCHours())+":"+p2(w.getUTCMinutes()); return en?("Nov "+w.getUTCDate()+", "+hh+" (UTC+8)"):((w.getUTCMonth()+1)+" 月 "+w.getUTCDate()+" 日 "+hh); }
  function texts(){
    var r=raising();
    return en?{
      t:r?"🤖 Origin Claim Bot":"🤖 Origin Claim Bot is live",
      b:"LGNS burn bonds, fixed-price bonds and Helix AI burns sell out within 1–3 seconds of opening. The bot sends your signed claim at the exact opening moment so it lands in the first block.",
      l:["No private key or seed phrase — your assets never leave your wallet","Covers: LGNS burn bond · fixed-price burn bond · Helix AI burn"].concat(r?[]:[RZ.nw+" USDT or DAI, one-time payment"]),
      go:r?("Get it at "+RZ.old+" U"):"Take a look", no:"Don't show again"
    }:{
      t:r?"🤖 起源抢币机器人":"🤖 起源抢币机器人上线了",
      b:"LGNS 销毁债券、固定价债券、Helix AI 销毁，开放后 1~3 秒就被抢光。机器人在开放那一刻替你准时发出，抢进第 1 个区块。",
      l:["不要私钥、不要助记词，资产始终在你自己钱包里","可抢：LGNS 销毁债券 · 固定价销毁债券 · Helix AI 销毁"].concat(r?[]:[RZ.nw+" USDT 或 DAI，一次性买断"]),
      go:r?("趁 "+RZ.old+" U 开通"):"去看看", no:"不再提示"
    };
  }
  function priceBox(){
    if(!raising()) return "";
    return '<div class="pz"><div class="pr">'+(en?("Now <b>"+RZ.old+" U</b> · from "+whenTx()+": <b class='up' style='white-space:nowrap'>"+RZ.nw+" U</b>"):("现在 <b>"+RZ.old+" U</b>，<span style='white-space:nowrap'>"+whenTx()+" 起涨到 <b class='up'>"+RZ.nw+" U</b></span>"))+'</div>'+
      '<div class="cd">'+(en?"Time left ":"还剩 ")+'<span id="w3oCd">'+left()+'</span></div>'+
      '<div class="op" id="w3oOp"></div></div>';
  }
  function fillOp(){ var e=document.getElementById("w3oOp"); if(!e) return; e.style.display=RZ.opened>0?"":"none"; if(RZ.opened>0) e.innerHTML="🔥 "+(en?(RZ.opened+" users joined"):("已有 <b>"+RZ.opened+"</b> 人开通")); }
  function w3oHit(e){ try{ var v=localStorage.getItem('w3o_vid'); if(!v){ v=Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('w3o_vid',v); } fetch('https://zjgame.web3origin.com/bondrpc/vip/hit',{method:'POST',headers:{'content-type':'text/plain'},body:JSON.stringify({e:e,v:v}),keepalive:true}).catch(function(){}); }catch(err){} }
  function show(){
    // 永久关掉的人:涨价前的涨价通知再弹一次;其它情况不弹
    var raiseOnce=raising()&&g(localStorage,RSEEN)!=="1";
    if(g(localStorage,OFF)==="1"&&!raiseOnce) return;
    p(sessionStorage,SES,"1"); if(raising()) p(localStorage,RSEEN,"1"); w3oHit("popup");
    var T=texts();
    var css=document.createElement("style");
    css.textContent="#w3oBot{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:rgba(5,3,3,.78);backdrop-filter:blur(4px);padding:16px;font-family:'Microsoft YaHei','PingFang SC',system-ui,sans-serif;animation:w3oBf .25s ease}"+
      "@keyframes w3oBf{from{opacity:0}to{opacity:1}}"+
      "#w3oBot .bx{width:min(420px,100%);background:linear-gradient(180deg,#1a0f08,#0d0805);border:1px solid #D6A84B;border-radius:16px;padding:22px 20px 18px;color:#F1DFC0;box-shadow:0 20px 60px rgba(0,0,0,.6);position:relative}"+
      "#w3oBot h3{margin:0 26px 10px 0;font-size:19px;line-height:1.4;color:#F1DFC0}"+
      "#w3oBot p{margin:0 0 10px;font-size:14px;line-height:1.75;color:#d9c6a6}"+
      "#w3oBot ul{margin:0 0 14px;padding-left:18px;font-size:13.5px;line-height:1.8;color:#e9d7b6}"+
      "#w3oBot .pz{margin:0 0 16px;padding:12px 14px;border:1px solid #D6A84B;border-radius:12px;background:linear-gradient(90deg,#3a0a0e,#5a0c12 50%,#3a0a0e);text-align:center}"+
      "#w3oBot .pr{font-size:14.5px;line-height:1.6;color:#F1DFC0}#w3oBot .pr b{color:#D6A84B;font-size:17px}#w3oBot .pr b.up{color:#F1DFC0}"+
      "#w3oBot .cd{margin-top:4px;font-size:13.5px;color:#e8a54a}#w3oBot .cd span{font-weight:800;color:#fff;font-size:17px;font-variant-numeric:tabular-nums;letter-spacing:.5px}"+
      "#w3oBot .op{margin-top:6px;font-size:13px;color:#cdb48c}#w3oBot .op b{color:#D6A84B}"+
      "#w3oBot .x{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:8px;border:1px solid #3a2313;background:none;color:#bfa985;font-size:14px;cursor:pointer}"+
      "#w3oBot .row{display:flex;gap:10px}#w3oBot a,#w3oBot .no{flex:1;text-align:center;border-radius:10px;padding:11px 10px;font-size:15px;font-weight:700;cursor:pointer;text-decoration:none}"+
      "#w3oBot a{background:#7A0B12;color:#F1DFC0;border:1px solid #D6A84B}#w3oBot .no{background:none;border:1px solid #3a2313;color:#bfa985}";
    document.head.appendChild(css);
    var d=document.createElement("div"); d.id="w3oBot"; d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true");
    d.innerHTML='<div class="bx"><button class="x" aria-label="close">✕</button><h3>'+T.t+'</h3><p>'+T.b+'</p><ul>'+T.l.map(function(x){return "<li>"+x+"</li>";}).join("")+'</ul>'+priceBox()+'<div class="row"><a href="'+URL+'">'+T.go+'</a><button class="no">'+T.no+'</button></div></div>';
    document.body.appendChild(d); fillOp();
    var tm=raising()?setInterval(function(){ var e=document.getElementById("w3oCd"); if(!e||!raising()){ clearInterval(tm); return; } e.textContent=left(); },1000):null;
    function close(){ if(tm) clearInterval(tm); d.remove(); }
    d.querySelector(".x").onclick=close;
    d.querySelector("a").onclick=function(){ w3oHit("popclick"); };
    d.querySelector(".no").onclick=function(){ p(localStorage,OFF,"1"); close(); };
    d.onclick=function(e){ if(e.target===d) close(); };
    document.addEventListener("keydown",function k(e){ if(e.key==="Escape"){ close(); document.removeEventListener("keydown",k);} });
  }
  // 先问服务器拿价格/涨价时刻/开通人数(最多等 2.5 秒),拿不到就用写死的值
  var done=false;
  function go(){ if(done) return; done=true; show(); }
  function start(){
    setTimeout(go,2500);
    try{ fetch(API,{cache:"no-store"}).then(function(r){return r.json();}).then(function(j){
      if(j&&j.raiseAt){ RZ.at=j.raiseAt; RZ.old=j.priceOld||RZ.old; RZ.nw=j.priceNew||RZ.nw; if(j.now) RZ.skew=j.now-Date.now()/1000; }
      if(j&&j.opened>0){ RZ.opened=j.opened; fillOp(); }
      setTimeout(go,1200);
    }).catch(function(){ setTimeout(go,1200); }); }catch(e){ setTimeout(go,1200); }
  }
  if(document.readyState==="complete") start(); else window.addEventListener("load",start);
})();
