/* ANUBIS PLAY 平台秒切:站内链接 hover/touch 预取 + 点击即时过渡遮罩,消除整页跳转白屏感;不改任何页面逻辑,纯增强 */
(function(){
  if(window.__spa)return; window.__spa=1;
  var done={};
  function internal(a){
    if(!a||!a.href)return false;
    if(a.target&&a.target!=='_self')return false;
    if(a.hasAttribute('data-no-spa'))return false;
    if(a.origin!==location.origin)return false;
    var h=a.getAttribute('href')||'';
    if(h.charAt(0)==='#')return false;                       // 纯锚点不拦
    if(a.pathname===location.pathname&&(a.hash||h===location.pathname))return false; // 同页/hash不拦
    if(/\.(png|jpe?g|webp|gif|svg|mp3|mp4|zip|pdf|txt|json)$/i.test(a.pathname))return false;
    return true;
  }
  function prefetch(url){
    if(done[url])return; done[url]=1;
    try{var l=document.createElement('link');l.rel='prefetch';l.href=url;l.as='document';document.head.appendChild(l);}catch(e){}
  }
  function near(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(internal(a))prefetch(a.href);}
  document.addEventListener('mouseover',near,{passive:true});
  document.addEventListener('touchstart',near,{passive:true});
  var pb,tmr;
  function bar(){
    if(pb)return pb;
    var s=document.createElement('style');
    s.textContent='#__spapb{position:fixed;top:0;left:0;height:3px;width:0;z-index:2147483647;background:linear-gradient(90deg,#9fe04a,#c8f665);box-shadow:0 0 10px #c8f665cc;opacity:0;border-radius:0 3px 3px 0;pointer-events:none}';
    document.head.appendChild(s);
    pb=document.createElement('div');pb.id='__spapb';document.body.appendChild(pb);
    return pb;
  }
  function go(){ var b=bar(); b.style.transition='none'; b.style.width='0'; b.style.opacity='1'; requestAnimationFrame(function(){ b.style.transition='width .4s cubic-bezier(.2,.8,.2,1),opacity .25s'; b.style.width='80%'; }); } // 点了立刻走到80%,等页面加载;真跳走后进度条随旧页消失
  function stop(){ if(!pb)return; pb.style.transition='width .2s,opacity .3s'; pb.style.width='100%'; setTimeout(function(){ if(pb)pb.style.opacity='0'; },160); }
  document.addEventListener('click',function(e){
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    var a=e.target&&e.target.closest&&e.target.closest('a[href]');
    if(!internal(a))return;
    prefetch(a.href);
    go();
    clearTimeout(tmr);tmr=setTimeout(stop,2500); // 保险:没真跳走就收尾
  },true);
  window.addEventListener('pageshow',function(){stop();}); // bfcache返回时收尾进度条
  window.addEventListener('pagehide',function(){clearTimeout(tmr);});
})();
