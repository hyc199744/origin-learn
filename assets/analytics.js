/* Web3Origin Analytics —— 匿名网站分析埋点
 * 原则:不收集钱包/姓名/电话/邮箱/助记词/私钥;不用浏览器指纹;不存完整IP(国家由Worker的cf.country判定)。
 * 上报到 count.web3origin.com/api/collect。任何失败都静默,绝不阻塞或报错影响页面。
 * 设备/浏览器/系统由服务端从 User-Agent 解析(前端不传UA明文)。
 */
(function () {
  "use strict";
  try {
    var HOST = location.hostname;
    // 统计域名本身 / 后台页面不计入
    if (HOST === "count.web3origin.com") return;
    if (location.pathname.indexOf("/adm") === 0) return;

    var ENDPOINT = "https://count.web3origin.com/api/collect";
    var HB_MS = 30000;              // 心跳间隔 30s
    var SESS_GAP = 30 * 60 * 1000;  // 30分钟无活动 = 新会话
    var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

    function uuid() {
      try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8; return v.toString(16);
      });
    }
    function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
    function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

    // 匿名访客ID(长期)
    var vid = lsGet("w3o_vid"); if (!vid) { vid = uuid(); lsSet("w3o_vid", vid); }

    // 会话ID(sessionStorage,新标签页=新会话;30分钟无活动也轮换)
    var now = Date.now();
    var sid = ssGet("w3o_sid"), sTs = Number(ssGet("w3o_sid_ts") || 0), sStart = Number(ssGet("w3o_sid_start") || 0);
    if (!sid || !sTs || (now - sTs) > SESS_GAP) {
      sid = uuid(); sStart = now;
      ssSet("w3o_sid", sid); ssSet("w3o_sid_start", String(sStart)); ssSet("w3o_sid_pv", "0");
    }
    ssSet("w3o_sid_ts", String(now));

    // 落地页(本会话第一个路径)
    var landing = ssGet("w3o_landing"); if (!landing) { landing = location.pathname; ssSet("w3o_landing", landing); }

    // UTM(白名单,首次触点持久化到本会话)
    function getUtm() {
      var out = {}, q; try { q = new URLSearchParams(location.search); } catch (e) { return out; }
      for (var i = 0; i < UTM_KEYS.length; i++) { var v = q.get(UTM_KEYS[i]); if (v) out[UTM_KEYS[i]] = String(v).slice(0, 120); }
      return out;
    }
    var utm = getUtm(), utmStored = ssGet("w3o_utm");
    if (!utmStored && Object.keys(utm).length) ssSet("w3o_utm", JSON.stringify(utm));
    else if (utmStored && !Object.keys(utm).length) { try { utm = JSON.parse(utmStored); } catch (e) {} }

    function refDomain(r) { try { return r ? new URL(r).hostname : ""; } catch (e) { return ""; } }
    var pv = Number(ssGet("w3o_sid_pv") || 0);

    function base(ev) {
      return {
        event: ev, visitorId: vid, sessionId: sid,
        pathname: location.pathname.slice(0, 300),
        pageTitle: (document.title || "").slice(0, 200),
        referrer: (document.referrer || "").slice(0, 300),
        referrerDomain: refDomain(document.referrer).slice(0, 120),
        landingPage: landing.slice(0, 300),
        utm: utm,
        screenWidth: (window.screen && screen.width) || 0,
        screenHeight: (window.screen && screen.height) || 0,
        language: (navigator.language || "").slice(0, 20),
        ts: Date.now(),
        duration: Math.max(0, Math.round((Date.now() - sStart) / 1000)),
        pageViewCount: pv
      };
    }
    function send(payload, beacon) {
      try {
        var body = JSON.stringify(payload);
        if (beacon && navigator.sendBeacon) {
          navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" })); return;
        }
        fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true, credentials: "omit" }).catch(function () {});
      } catch (e) {}
    }

    // pageview
    pv = pv + 1; ssSet("w3o_sid_pv", String(pv));
    send(base("pageview"), false);

    // 互动=非跳出(首次有效交互上报一次)
    var engaged = false;
    var engEvents = ["click", "keydown", "scroll", "touchstart"];
    function touch() { sTs = Date.now(); ssSet("w3o_sid_ts", String(sTs)); }
    function markEngaged() { if (engaged) return; engaged = true; touch(); send(base("engagement"), false); detachEng(); }
    function detachEng() { engEvents.forEach(function (e) { try { window.removeEventListener(e, markEngaged, true); } catch (_) {} }); }
    engEvents.forEach(function (e) { try { window.addEventListener(e, markEngaged, { capture: true, passive: true }); } catch (_) { try { window.addEventListener(e, markEngaged, true); } catch (__) {} } });
    ["mousemove", "scroll", "keydown", "click", "touchstart"].forEach(function (e) { try { window.addEventListener(e, touch, { capture: true, passive: true }); } catch (_) {} });

    // 心跳(仅在可见且自上次心跳后有活动时上报,降低写入)
    var lastBeat = Date.now();
    var hb = setInterval(function () {
      if (document.visibilityState !== "visible") return;
      if (sTs <= lastBeat) return;
      lastBeat = Date.now();
      send(base("heartbeat"), true);
    }, HB_MS);

    // 离开(pagehide/隐藏/卸载多路兜底,手机可靠)
    var left = false;
    function leave() { if (left) return; left = true; try { clearInterval(hb); } catch (e) {} send(base("page_leave"), true); }
    window.addEventListener("pagehide", leave, { capture: true });
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") send(base("heartbeat"), true); });
    window.addEventListener("beforeunload", leave, { capture: true });
  } catch (e) { /* 永不影响页面 */ }
})();
