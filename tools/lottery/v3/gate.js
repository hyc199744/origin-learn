/* ANUBIS PLAY 平台级合规门禁:18+ / 真钱风险 / 地区限制。
   进站一次性弹窗,同意才进;localStorage 记住只弹一次(同源下所有游戏共用)。 */
(function(){
  'use strict';
  var KEY='anb_gate_agreed_v1';
  try{ if(localStorage.getItem(KEY)==='1') return; }catch(e){}

  function build(){
    if(document.getElementById('anbGate')) return;
    var wrap=document.createElement('div');
    wrap.id='anbGate';
    wrap.setAttribute('role','dialog');
    wrap.setAttribute('aria-modal','true');
    wrap.style.cssText='position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(3,6,5,.88);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",system-ui,sans-serif';
    wrap.innerHTML=''
      +'<div style="box-sizing:border-box;max-width:440px;width:100%;max-height:92vh;overflow:auto;background:linear-gradient(160deg,#141a16,#0b100d);border:1px solid #c8f66555;border-radius:18px;padding:24px 22px;box-shadow:0 20px 60px #000b,inset 0 0 0 1px #ffffff0d">'
      +  '<div style="font-size:30px;text-align:center;line-height:1">⚠️</div>'
      +  '<h2 style="margin:8px 0 4px;text-align:center;font-size:19px;color:#e6f4c8;letter-spacing:1px">进入前请确认</h2>'
      +  '<p style="margin:0 0 12px;text-align:center;font-size:12px;color:#8ea893">本平台为链上真钱游戏,使用真实加密资产下注</p>'
      +  '<ul style="margin:0 0 14px;padding-left:18px;font-size:13px;line-height:1.85;color:#c7d4c2">'
      +    '<li>仅限 <b style="color:#e8c783">18 周岁以上</b> 成年人参与</li>'
      +    '<li>请确认链上博彩在你所在国家/地区<b style="color:#e8c783">合法</b>,违法地区请勿使用</li>'
      +    '<li>博彩有风险,<b style="color:#e8c783">可能损失全部本金</b>,请理性参与、量力而行,切勿借贷</li>'
      +    '<li>结果由链上区块哈希决定,公平但<b style="color:#e8c783">不可逆</b>,盈亏自负</li>'
      +    '<li>本平台内容不构成任何投资建议</li>'
      +  '</ul>'
      +  '<p style="margin:0 0 16px;font-size:12px;color:#8ea893;line-height:1.7">点击"同意并进入"即表示:你已年满18周岁、所在地区允许参与、并自愿承担全部风险。</p>'
      +  '<button id="anbGateOk" style="width:100%;min-height:48px;border:0;border-radius:11px;background:linear-gradient(180deg,#c8f665,#9bd23e);color:#13210a;font-weight:800;font-size:15px;cursor:pointer;letter-spacing:1px">我已满18周岁 · 同意并进入</button>'
      +  '<button id="anbGateNo" style="width:100%;min-height:44px;margin-top:9px;border:1px solid #3a4a3f;border-radius:11px;background:transparent;color:#8ea893;font-size:13px;cursor:pointer">未满18岁 / 不同意,离开</button>'
      +'</div>';
    document.body.appendChild(wrap);
    document.documentElement.style.overflow='hidden';

    document.getElementById('anbGateOk').addEventListener('click',function(){
      try{ localStorage.setItem(KEY,'1'); }catch(e){}
      wrap.style.transition='opacity .25s'; wrap.style.opacity='0';
      setTimeout(function(){ if(wrap.parentNode)wrap.parentNode.removeChild(wrap); document.documentElement.style.overflow=''; },260);
    });
    document.getElementById('anbGateNo').addEventListener('click',function(){
      try{ location.href='https://www.google.com'; }catch(e){ location.href='about:blank'; }
    });
  }

  if(document.body) build();
  else document.addEventListener('DOMContentLoaded',build);
})();
