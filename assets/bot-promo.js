/* 首页通知弹窗:起源抢币机器人(2026-11-03)
   每次打开首页弹一次(同一会话只弹一次);点「不再提示」后永久不弹。 */
(function(){
  "use strict";
  var OFF="w3o_bot_promo_off", SES="w3o_bot_promo_seen", URL="/tools/bot-vip/";
  function g(s,k){try{return s.getItem(k);}catch(e){return null;}}
  function p(s,k,v){try{s.setItem(k,v);}catch(e){}}
  if(g(localStorage,OFF)==="1"||g(sessionStorage,SES)==="1")return;
  var en=location.pathname.indexOf("/en")===0||/^en/i.test(g(localStorage,"web3origin_locale")||"");
  var T=en?{
    t:"🤖 Origin Claim Bot is live",
    b:"LGNS burn bonds, fixed-price bonds and Helix AI burns sell out within 1–3 seconds of opening. The bot sends your signed claim at the exact opening moment so it lands in the first block.",
    l:["No private key or seed phrase — your assets never leave your wallet","Covers: LGNS burn bond · fixed-price burn bond · Helix AI burn","100 DAI or USDT, one-time payment"],
    go:"Take a look",no:"Don't show again"
  }:{
    t:"🤖 起源抢币机器人上线了",
    b:"LGNS 销毁债券、固定价债券、Helix AI 销毁，开放后 1~3 秒就被抢光。机器人在开放那一刻替你准时发出，抢进第 1 个区块。",
    l:["不要私钥、不要助记词，资产始终在你自己钱包里","可抢：LGNS 销毁债券 · 固定价销毁债券 · Helix AI 销毁","100 DAI 或 USDT，一次性买断"],
    go:"去看看",no:"不再提示"
  };
  function show(){
    p(sessionStorage,SES,"1");
    var css=document.createElement("style");
    css.textContent="#w3oBot{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:rgba(5,3,3,.78);backdrop-filter:blur(4px);padding:16px;font-family:'Microsoft YaHei','PingFang SC',system-ui,sans-serif;animation:w3oBf .25s ease}"+
      "@keyframes w3oBf{from{opacity:0}to{opacity:1}}"+
      "#w3oBot .bx{width:min(420px,100%);background:linear-gradient(180deg,#1a0f08,#0d0805);border:1px solid #D6A84B;border-radius:16px;padding:22px 20px 18px;color:#F1DFC0;box-shadow:0 20px 60px rgba(0,0,0,.6);position:relative}"+
      "#w3oBot h3{margin:0 26px 10px 0;font-size:19px;line-height:1.4;color:#F1DFC0}"+
      "#w3oBot p{margin:0 0 10px;font-size:14px;line-height:1.75;color:#d9c6a6}"+
      "#w3oBot ul{margin:0 0 16px;padding-left:18px;font-size:13.5px;line-height:1.8;color:#e9d7b6}"+
      "#w3oBot .x{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:8px;border:1px solid #3a2313;background:none;color:#bfa985;font-size:14px;cursor:pointer}"+
      "#w3oBot .row{display:flex;gap:10px}#w3oBot a,#w3oBot .no{flex:1;text-align:center;border-radius:10px;padding:11px 10px;font-size:15px;font-weight:700;cursor:pointer;text-decoration:none}"+
      "#w3oBot a{background:#7A0B12;color:#F1DFC0;border:1px solid #D6A84B}#w3oBot .no{background:none;border:1px solid #3a2313;color:#bfa985}";
    document.head.appendChild(css);
    var d=document.createElement("div"); d.id="w3oBot"; d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true");
    d.innerHTML='<div class="bx"><button class="x" aria-label="close">✕</button><h3>'+T.t+'</h3><p>'+T.b+'</p><ul>'+T.l.map(function(x){return "<li>"+x+"</li>";}).join("")+'</ul><div class="row"><a href="'+URL+'">'+T.go+'</a><button class="no">'+T.no+'</button></div></div>';
    document.body.appendChild(d);
    function close(){ d.remove(); }
    d.querySelector(".x").onclick=close;
    d.querySelector(".no").onclick=function(){ p(localStorage,OFF,"1"); close(); };
    d.onclick=function(e){ if(e.target===d) close(); };
    document.addEventListener("keydown",function k(e){ if(e.key==="Escape"){ close(); document.removeEventListener("keydown",k);} });
  }
  if(document.readyState==="complete") setTimeout(show,1200); else window.addEventListener("load",function(){ setTimeout(show,1200); });
})();
