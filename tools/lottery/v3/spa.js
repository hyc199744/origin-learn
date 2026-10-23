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
  var ov,tmr;
  function overlay(){
    if(ov)return ov;
    var s=document.createElement('style');
    s.textContent='#__spaov{position:fixed;inset:0;z-index:2147483646;background:#0d1114;opacity:0;transition:opacity .16s ease;pointer-events:none;display:flex;align-items:center;justify-content:center}#__spaov.on{opacity:1;pointer-events:auto}#__spaov i{width:30px;height:30px;border:3px solid #c8f66540;border-top-color:#c8f665;border-radius:50%;animation:__spaspin .7s linear infinite;display:block}@keyframes __spaspin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
    ov=document.createElement('div');ov.id='__spaov';ov.innerHTML='<i></i>';document.body.appendChild(ov);
    return ov;
  }
  document.addEventListener('click',function(e){
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    var a=e.target&&e.target.closest&&e.target.closest('a[href]');
    if(!internal(a))return;
    prefetch(a.href);
    var o=overlay();requestAnimationFrame(function(){o.classList.add('on');});
    clearTimeout(tmr);tmr=setTimeout(function(){if(o)o.classList.remove('on');},3000); // 保险:没真跳走就撤遮罩
  },true);
  window.addEventListener('pageshow',function(){if(ov)ov.classList.remove('on');}); // bfcache返回时清遮罩
  window.addEventListener('pagehide',function(){clearTimeout(tmr);});
})();
