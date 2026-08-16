/* 全站「下载App」入口:导航栏链接 + 安卓访客可关闭提示(iOS不弹,装不了apk) */
(function () {
  "use strict";
  var DL = "/app/origin-download.html";
  var ZH = document.documentElement.lang !== "en" && !/^en/i.test(document.documentElement.lang || "");
  // 下载页本身不显示
  if (location.pathname.indexOf("/app/") === 0) return;

  function addNavLink() {
    var nav = document.querySelector("nav.nav") || document.querySelector("nav");
    if (!nav || document.getElementById("op-app-navlink")) return;
    var a = document.createElement("a");
    a.id = "op-app-navlink";
    a.href = DL;
    a.textContent = "📱 " + (ZH ? "下载App" : "Get App");
    a.style.cssText = "color:var(--gold-lt,#f0d48a);font-weight:700;text-decoration:none";
    nav.appendChild(a);
  }

  function isAndroid() { return /android/i.test(navigator.userAgent || ""); }
  function dismissed() { try { return localStorage.getItem("op_appbar_x") === "1"; } catch (e) { return false; } }

  function showPill() {
    if (!isAndroid() || dismissed() || document.getElementById("op-appbar")) return;
    var css = "#op-appbar{position:fixed;left:14px;bottom:16px;z-index:2147482000;display:flex;align-items:center;gap:8px;"
      + "max-width:min(320px,90vw);padding:9px 10px 9px 12px;background:linear-gradient(135deg,#D6A84B,#b8842f);"
      + "color:#1a1206;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.45);font-family:system-ui,-apple-system,'Microsoft YaHei',sans-serif;"
      + "font-size:13px;line-height:1.35;animation:opabin .4s ease}"
      + "@keyframes opabin{from{transform:translateY(140%);opacity:0}to{transform:none;opacity:1}}"
      + "#op-appbar a.dl{flex:0 0 auto;background:#1a1206;color:#f0d48a;text-decoration:none;font-weight:700;padding:7px 12px;border-radius:9px;font-size:13px}"
      + "#op-appbar .tx{flex:1;min-width:0}#op-appbar .tx b{display:block;font-weight:800}"
      + "#op-appbar .x{flex:0 0 auto;width:22px;height:22px;line-height:22px;text-align:center;cursor:pointer;color:#3a2a10;font-weight:700;opacity:.7}"
      + "@media(max-width:600px){#op-appbar{bottom:80px}}";
    var s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
    var box = document.createElement("div"); box.id = "op-appbar";
    box.innerHTML = '<div class="tx"><b>' + (ZH ? "装「起源」App" : "Get Origin App")
      + '</b>' + (ZH ? "看直播·听回放,切出去也不断" : "Background audio for live & replays") + '</div>'
      + '<a class="dl" href="' + DL + '">' + (ZH ? "下载" : "Get") + '</a>'
      + '<span class="x" aria-label="close">✕</span>';
    (document.body || document.documentElement).appendChild(box);
    box.querySelector(".x").onclick = function () { box.remove(); try { localStorage.setItem("op_appbar_x", "1"); } catch (e) {} };
  }

  function run() { try { addNavLink(); } catch (e) {} try { showPill(); } catch (e) {} }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
