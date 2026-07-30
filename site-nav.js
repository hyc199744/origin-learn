/* Web3Origin 统一桌面导航 —— 注入与交互
 * 读取 navigation.config.js 构建桌面导航,注入到 <body> 顶部并隐藏旧桌面导航(不删除,移动端保留)。
 * 复用现有 i18n(#langBtn)与工具函数(openX);语言切换时自动按 <html lang> 重建文案。
 * 不采集任何用户输入,不用 innerHTML 插入用户数据,外链带 rel=noopener。
 */
(function () {
  "use strict";
  if (!window.W3O_NAV) return;
  var CFG = window.W3O_NAV;

  function lang() { return (window.SITE_LANG && window.SITE_LANG !== "zh") ? "en" : "zh"; }
  function L(o) { if (o == null) return ""; if (typeof o === "string") return o; return o[lang()] || o.zh || o.en || ""; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  var IS_HOME = location.pathname === "/" || /\/index\.html$/.test(location.pathname) || location.pathname === "";
  var CURPATH = (location.pathname.replace(/index\.html$/, "")) || "/";

  function isCurrent(it) {
    var h = it.href || "";
    if (!h || h.charAt(0) === "#" || h.indexOf("/#") === 0) return false;
    var p = h.split("#")[0].split("?")[0].replace(/index\.html$/, "");
    if (!p) return false;
    if (p === "/") return CURPATH === "/";
    return CURPATH.indexOf(p) === 0;
  }
  function anyChildCurrent(it) {
    var kids = (it.children || []).slice();
    if (it.groups) it.groups.forEach(function (g) { kids = kids.concat(g.items || []); });
    return kids.some(isCurrent);
  }

  function itemLink(it) {
    var badge = it.badge ? ' <span class="unav-badge">' + esc(L(it.badge)) + '</span>' : "";
    if (it.soon) return '<a class="disabled" aria-disabled="true" tabindex="-1">' + esc(L(it.label)) + ' <span class="unav-badge soon">' + (lang() === "zh" ? "即将上线" : "Soon") + '</span></a>';
    if (it.tool) return '<button type="button" class="unav-tool" data-tool="' + esc(it.tool) + '" role="menuitem">' + esc(L(it.label)) + badge + '</button>';
    var cur = isCurrent(it) ? " current" : "";
    var ext = /^https?:/i.test(it.href || "") ? ' target="_blank" rel="noopener noreferrer"' : "";
    return '<a class="' + cur.trim() + '" role="menuitem" href="' + esc(it.href || "#") + '"' + ext + '>' + esc(L(it.label)) + badge + '</a>';
  }

  function buildPanel(it) {
    var cls = "unav-panel", inner = "";
    if (it.groups) {
      cls += " wide";
      inner = it.groups.map(function (g) {
        return '<div class="unav-col"><div class="unav-group-title">' + esc(L(g.title)) + '</div>' + (g.items || []).map(itemLink).join("") + '</div>';
      }).join("");
    } else if (it.children) {
      inner = it.children.map(itemLink).join("");
    }
    return '<div class="' + cls + '" role="menu">' + inner + '</div>';
  }

  function buildTop(it, idx, total) {
    var hasChild = !!(it.children || it.groups);
    if (!hasChild) {
      var cur = isCurrent(it) ? " current" : "";
      var ext = /^https?:/i.test(it.href || "") ? ' target="_blank" rel="noopener noreferrer"' : "";
      return '<div class="unav-item"><a class="unav-link' + cur + '" href="' + esc(it.href || "#") + '"' + ext + '>' + esc(L(it.label)) + '</a></div>';
    }
    var alignRight = idx >= total - 2 ? " align-right" : "";
    var topCur = anyChildCurrent(it) ? " current" : "";
    return '<div class="unav-item' + alignRight + '" data-menu="' + esc(it.id) + '">'
      + '<button type="button" class="unav-link' + topCur + '" aria-haspopup="true" aria-expanded="false">' + esc(L(it.label)) + ' <span class="caret" aria-hidden="true">▾</span></button>'
      + buildPanel(it) + '</div>';
  }

  function render() {
    var items = CFG.items || [];
    var html = '<a class="unav-brand" href="' + esc(CFG.brand.href || "/") + '" aria-label="Web3Origin"><img src="' + esc(CFG.brand.logo || "") + '" alt="Web3Origin"><b>' + esc(L(CFG.brand.label) || "Web3Origin") + '</b></a>'
      + '<div class="unav-menu">' + items.map(function (it, i) { return buildTop(it, i, items.length); }).join("") + '</div>'
      + '<div class="unav-right">'
      + '<button type="button" class="unav-btn unav-search-btn" id="unavSearch" aria-label="' + (lang() === "zh" ? "搜索" : "Search") + '">🔍</button>'
      + '<button type="button" class="unav-btn" id="unavLang" aria-label="' + (lang() === "zh" ? "切换语言" : "Language") + '">🌐 <span id="unavLangTxt"></span></button>'
      + '</div>'
      + '<button type="button" class="unav-burger" id="unavBurger" aria-label="' + (lang() === "zh" ? "打开菜单" : "Menu") + '" aria-expanded="false" aria-controls="unavDrawer"><span class="bar"></span><span class="bar"></span><span class="bar"></span></button>';
    var nav = document.querySelector(".w3onav");
    if (!nav) { nav = document.createElement("nav"); nav.className = "w3onav"; nav.setAttribute("aria-label", "主导航"); document.body.insertBefore(nav, document.body.firstChild); }
    nav.innerHTML = html;
    document.documentElement.classList.add("unav-on");
    // 手机抽屉:先移除旧的(重建时),再注入
    var oldD = document.querySelector(".unav-drawer"), oldM = document.querySelector(".unav-drawer-mask");
    if (oldD) oldD.remove(); if (oldM) oldM.remove();
    var wrap = document.createElement("div");
    wrap.innerHTML = buildDrawer();
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
    updateLangLabel();
    wire(nav);
    wireMobile();
  }

  function drawerItemLink(it) {
    var badge = it.badge ? ' <span class="unav-badge">' + esc(L(it.badge)) + '</span>' : "";
    if (it.soon) return '<a class="disabled" aria-disabled="true">' + esc(L(it.label)) + ' <span class="unav-badge soon">' + (lang() === "zh" ? "即将上线" : "Soon") + '</span></a>';
    if (it.tool) return '<button type="button" class="unav-tool" data-tool="' + esc(it.tool) + '">' + esc(L(it.label)) + badge + '</button>';
    var cur = isCurrent(it) ? " current" : "";
    var ext = /^https?:/i.test(it.href || "") ? ' target="_blank" rel="noopener noreferrer"' : "";
    return '<a class="' + cur.trim() + '" href="' + esc(it.href || "#") + '"' + ext + '>' + esc(L(it.label)) + badge + '</a>';
  }
  function buildDrawer() {
    var items = CFG.items || [];
    var body = items.map(function (it) {
      var hasChild = !!(it.children || it.groups);
      if (!hasChild) {
        var cur = isCurrent(it) ? " current" : "";
        var ext = /^https?:/i.test(it.href || "") ? ' target="_blank" rel="noopener noreferrer"' : "";
        return '<div class="unav-acc"><a class="unav-acc-h' + cur + '" href="' + esc(it.href || "#") + '"' + ext + '>' + esc(L(it.label)) + '</a></div>';
      }
      var sub = it.groups
        ? it.groups.map(function (g) { return '<div class="unav-gt">' + esc(L(g.title)) + '</div>' + (g.items || []).map(drawerItemLink).join(""); }).join("")
        : (it.children || []).map(drawerItemLink).join("");
      var topCur = anyChildCurrent(it) ? " current" : "";
      return '<div class="unav-acc"><button type="button" class="unav-acc-h' + topCur + '">' + esc(L(it.label)) + '<span class="arw" aria-hidden="true">▸</span></button><div class="unav-acc-sub">' + sub + '</div></div>';
    }).join("");
    return '<div class="unav-drawer-mask"></div>'
      + '<aside class="unav-drawer" id="unavDrawer" role="dialog" aria-modal="true" aria-label="导航菜单">'
      + '<div class="unav-drawer-head"><a class="unav-brand" href="' + esc(CFG.brand.href || "/") + '"><img src="' + esc(CFG.brand.logo || "") + '" alt=""><b>' + esc(L(CFG.brand.label) || "Web3Origin") + '</b></a><button type="button" class="unav-drawer-close" aria-label="关闭">✕</button></div>'
      + '<div class="unav-drawer-body">'
      + '<input type="text" class="unav-msearch" id="unavMSearch" placeholder="' + esc(L(CFG.searchPlaceholder)) + '" autocomplete="off">'
      + body
      + '<div class="unav-drawer-foot"><button type="button" class="unav-btn" id="unavMLang">🌐 <span id="unavMLangTxt"></span></button></div>'
      + '</div></aside>';
  }
  function wireMobile() {
    var burger = document.getElementById("unavBurger");
    var mask = document.querySelector(".unav-drawer-mask");
    var drawer = document.querySelector(".unav-drawer");
    if (!burger || !drawer || !mask) return;
    function openD() { drawer.classList.add("open"); mask.classList.add("open"); burger.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; }
    function closeD() { drawer.classList.remove("open"); mask.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; }
    window.__unavCloseDrawer = closeD;
    burger.addEventListener("click", function () { drawer.classList.contains("open") ? closeD() : openD(); });
    mask.addEventListener("click", closeD);
    var cl = drawer.querySelector(".unav-drawer-close"); if (cl) cl.addEventListener("click", closeD);
    drawer.querySelectorAll(".unav-acc > button.unav-acc-h").forEach(function (h) { h.addEventListener("click", function () { h.parentNode.classList.toggle("open"); }); });
    drawer.querySelectorAll(".unav-acc a").forEach(function (a) { a.addEventListener("click", function () { if (!a.classList.contains("disabled")) closeD(); }); });
    drawer.querySelectorAll("button.unav-tool[data-tool]").forEach(function (b) {
      b.addEventListener("click", function () { var fn = b.getAttribute("data-tool"); closeD(); if (IS_HOME && typeof window[fn] === "function") { try { window[fn](); } catch (e) {} } else location.href = "/?tool=" + encodeURIComponent(fn); });
    });
    var ms = document.getElementById("unavMSearch"); if (ms) ms.addEventListener("focus", function () { closeD(); openSearch(); });
    var ml = document.getElementById("unavMLang"); if (ml) ml.addEventListener("click", function () { var ex = document.getElementById("langBtn"); if (ex) ex.click(); else { var mx = document.getElementById("mLang"); if (mx) mx.click(); } });
    var mlt = document.getElementById("unavMLangTxt"); if (mlt) { var code = window.SITE_LANG || "zh"; mlt.textContent = code === "zh" ? "中文" : (code === "en" ? "EN" : String(code).toUpperCase()); }
  }

  function updateLangLabel() {
    var t = document.getElementById("unavLangTxt"); if (!t) return;
    var code = window.SITE_LANG || "zh";
    t.textContent = code === "zh" ? "中文" : (code === "en" ? "EN" : String(code).toUpperCase());
  }

  var closeTimer = null;
  function closeAll(except) {
    document.querySelectorAll(".w3onav .unav-item.open").forEach(function (el) {
      if (el !== except) { el.classList.remove("open"); var b = el.querySelector(".unav-link[aria-haspopup]"); if (b) b.setAttribute("aria-expanded", "false"); }
    });
  }
  function wire(nav) {
    nav.querySelectorAll(".unav-item[data-menu]").forEach(function (item) {
      var btn = item.querySelector(".unav-link[aria-haspopup]");
      function open() { clearTimeout(closeTimer); closeAll(item); item.classList.add("open"); btn.setAttribute("aria-expanded", "true"); }
      function close() { item.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
      item.addEventListener("mouseenter", open);
      item.addEventListener("mouseleave", function () { clearTimeout(closeTimer); closeTimer = setTimeout(close, 180); });
      btn.addEventListener("click", function (e) { e.preventDefault(); item.classList.contains("open") ? close() : open(); });
      btn.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (item.classList.contains("open")) { close(); } else { open(); var f = item.querySelector(".unav-panel a:not(.disabled),.unav-panel button"); if (f) f.focus(); } }
        else if (e.key === "Escape") { close(); btn.focus(); }
        else if (e.key === "ArrowDown") { e.preventDefault(); open(); var f2 = item.querySelector(".unav-panel a:not(.disabled),.unav-panel button"); if (f2) f2.focus(); }
      });
      item.querySelectorAll(".unav-panel a,.unav-panel button").forEach(function (link) {
        link.addEventListener("keydown", function (e) { if (e.key === "Escape") { close(); btn.focus(); } });
      });
    });
    nav.querySelectorAll("button.unav-tool[data-tool]").forEach(function (b) {
      b.addEventListener("click", function () {
        var fn = b.getAttribute("data-tool");
        if (IS_HOME && typeof window[fn] === "function") { try { window[fn](); } catch (e) {} }
        else { location.href = "/?tool=" + encodeURIComponent(fn); }
        closeAll();
      });
    });
    var lb = document.getElementById("unavLang");
    if (lb) lb.addEventListener("click", function () { var ex = document.getElementById("langBtn"); if (ex) { ex.click(); } else { var mx = document.getElementById("mLang"); if (mx) mx.click(); } });
    var sb = document.getElementById("unavSearch"); if (sb) sb.addEventListener("click", openSearch);
  }

  document.addEventListener("click", function (e) { if (!e.target.closest || !e.target.closest(".w3onav .unav-item")) closeAll(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeAll(); closeSearch(); if (window.__unavCloseDrawer) window.__unavCloseDrawer(); } });

  function ensureSearchDom() {
    var m = document.querySelector(".unav-search-mask"); if (m) return m;
    m = document.createElement("div"); m.className = "unav-search-mask";
    m.innerHTML = '<div class="unav-search-box" role="dialog" aria-modal="true"><input type="text" id="unavSearchInput" autocomplete="off"><div class="unav-search-res" id="unavSearchRes"></div></div>';
    document.body.appendChild(m);
    m.addEventListener("click", function (e) { if (e.target === m) closeSearch(); });
    m.querySelector("#unavSearchInput").addEventListener("input", doSearch);
    return m;
  }
  function openSearch() { var m = ensureSearchDom(); var inp = m.querySelector("#unavSearchInput"); inp.placeholder = L(CFG.searchPlaceholder); inp.value = ""; doSearch(); m.classList.add("open"); setTimeout(function () { inp.focus(); }, 30); closeAll(); }
  function closeSearch() { var m = document.querySelector(".unav-search-mask"); if (m) m.classList.remove("open"); }
  function doSearch() {
    var m = document.querySelector(".unav-search-mask"); if (!m) return;
    var q = (m.querySelector("#unavSearchInput").value || "").trim().toLowerCase();
    var res = m.querySelector("#unavSearchRes");
    var idx = CFG.searchIndex || [];
    var list = q ? idx.filter(function (x) { return (L(x.t) + " " + x.u).toLowerCase().indexOf(q) >= 0; }) : idx;
    if (!list.length) { res.innerHTML = '<div class="unav-search-empty">' + (lang() === "zh" ? "没有匹配的页面" : "No matching pages") + '</div>'; return; }
    res.innerHTML = list.map(function (x) { return '<a href="' + esc(x.u) + '">' + esc(L(x.t)) + '<span class="u">' + esc(x.u) + '</span></a>'; }).join("");
  }

  // 语言切换时重建导航文案(观察 <html lang> 变化;render 不改 lang,无循环)
  var mo = null;
  function boot() {
    try { render(); } catch (e) { /* 导航失败也绝不影响页面 */ }
    try { mo = new MutationObserver(function () { try { render(); } catch (e) {} }); mo.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] }); } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
