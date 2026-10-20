/* 所有页面均可返回大厅、资产、返佣与帮助。 */
(function(){'use strict';var A=window.APPlatform;if(!A)return;var base=new URL('.',document.currentScript.src);
  function render(){var nav=document.getElementById('apSharedNav');if(!nav){nav=document.createElement('nav');nav.id='apSharedNav';nav.className='ap-links';nav.setAttribute('aria-label',A.L('平台导航','Platform navigation'));document.body.appendChild(nav);}nav.setAttribute('aria-label',A.L('平台导航','Platform navigation'));nav.innerHTML=[['',A.L('游戏大厅','Game lobby')],['account/',A.L('资产与退款','Assets & refunds')],['invite/',A.L('邀请返佣','Referrals')],['help/',A.L('帮助与问题处理','Help & troubleshooting')]].map(function(x){return '<a href="'+new URL(x[0],base).href+'">'+x[1]+'</a>';}).join('');document.querySelectorAll('[data-ap-zh]').forEach(function(e){e.textContent=A.L(e.dataset.apZh,e.dataset.apEn);});}
  window.addEventListener('ap:language',render);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();
