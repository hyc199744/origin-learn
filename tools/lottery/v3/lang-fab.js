/* 全站浮动语言切换按钮:哪个页面没有可见的语言入口,就在右上角浮一个(大厅本就有则自动不加)。
   用 window.setLang(i18n.js) 就地切换;炸金花等无 setLang 的页面,存 aplang+cookie 再 reload(由各页 i18n 按语言自动翻译)。 */
(function(){
  'use strict';
  function cur(){ try{ var s=localStorage.getItem('aplang'); if(!s){ var m=document.cookie.match('(?:^|; )aplang=([^;]*)'); if(m)s=m[1]; } if(s) return s==='zh'?'zh':'en'; }catch(e){} return (navigator.language||'').toLowerCase().indexOf('zh')===0?'zh':'en'; }
  function go(){
    if(document.getElementById('langFab')) return;
    var lb=document.getElementById('langBtn'); if(lb && lb.getClientRects && lb.getClientRects().length) return; // 页面已有可见语言按钮(大厅),不重复
    var L=cur();
    var w=document.createElement('div'); w.id='langFab';
    w.style.cssText='position:fixed;top:calc(env(safe-area-inset-top,0px) + 8px);right:10px;z-index:150;font-family:inherit';
    w.innerHTML='<button id="langFabBtn" aria-label="Language" style="display:inline-flex;align-items:center;gap:5px;background:#131a1e;color:#c8f665;border:1px solid #ffffff24;border-radius:9px;padding:8px 11px;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px #0007"><svg viewBox="0 0 24 24" style="width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg><span id="langFabTxt">'+(L==='zh'?'中':'EN')+'</span></button>'
      +'<div id="langFabMenu" hidden style="position:absolute;top:calc(100% + 6px);right:0;background:#20292e;border:1px solid #ffffff1f;border-radius:10px;padding:5px;min-width:122px;box-shadow:0 12px 30px #0009;display:flex;flex-direction:column;gap:2px">'
      +'<a data-l="zh" style="padding:9px 12px;border-radius:7px;font-size:13px;color:#eff6f3;cursor:pointer">中文</a>'
      +'<a data-l="en" style="padding:9px 12px;border-radius:7px;font-size:13px;color:#eff6f3;cursor:pointer">English</a></div>';
    document.body.appendChild(w);
    var btn=document.getElementById('langFabBtn'), menu=document.getElementById('langFabMenu');
    function mark(){ try{ menu.querySelectorAll('a[data-l]').forEach(function(a){ a.style.color=(a.getAttribute('data-l')===cur())?'#c8f665':'#eff6f3'; }); }catch(e){} }
    btn.onclick=function(e){ e.stopPropagation(); menu.hidden=!menu.hidden; if(!menu.hidden)mark(); };
    document.addEventListener('click',function(){ if(menu)menu.hidden=true; });
    menu.querySelectorAll('a[data-l]').forEach(function(a){ a.onclick=function(e){ e.stopPropagation(); var l=a.getAttribute('data-l'); menu.hidden=true;
      var t=document.getElementById('langFabTxt'); if(t)t.textContent=(l==='zh'?'中':'EN');
      try{ document.cookie='aplang='+l+';path=/;max-age=31536000;samesite=lax'; }catch(e2){}
      try{ localStorage.setItem('aplang',l); }catch(e2){}
      if(typeof window.setLang==='function'){ try{ window.setLang(l); }catch(e2){} }   // 大厅系 i18n:就地切换,不刷新
      else { try{ location.reload(); }catch(e2){} }                                     // 炸金花等:reload,靠本页i18n按aplang自动翻译(cookie已存,reload后仍在)
    }; });
  }
  if(document.readyState!=='loading') go(); else document.addEventListener('DOMContentLoaded', go);
})();
