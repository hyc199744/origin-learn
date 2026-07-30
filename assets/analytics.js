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

    /* ===================== 事件统计 W3OAnalytics ===================== */
    var EVENT_ENDPOINT = "https://count.web3origin.com/api/collect/event";
    var EV_LIST = ("tool_open tool_start tool_success tool_error tool_result_view tool_retry "
      + "article_open article_read_30s article_read_60s article_scroll_25 article_scroll_50 article_scroll_75 article_complete related_article_click article_share_click "
      + "video_play video_pause video_progress_25 video_progress_50 video_progress_75 video_complete video_error "
      + "contact_open wechat_click qq_click telegram_click x_click youtube_click register_start register_success login_success payment_start payment_success payment_failed "
      + "copy_contract open_block_explorer copy_wallet_address open_transaction network_switch "
      + "search search_no_result language_switch navigation_click outbound_click download form_start form_submit form_success form_error").split(" ");
    var EV_WHITELIST = {}; EV_LIST.forEach(function (n) { EV_WHITELIST[n] = 1; });
    var PROP_KEYS = ("tool_name tool_category network success error_code duration_ms "
      + "article_id article_title article_category article_language scroll_depth reading_seconds "
      + "video_id video_title video_duration current_time progress asset_name explorer_name target_type "
      + "search_keyword from_language to_language navigation_name outbound_domain file_name form_name run_id order_id amount_range product_type payment_network").split(" ");
    var MAX_PROPS = 25;
    var sentDedup = {};
    function evSensitiveClient(s) { s = String(s || ""); return /0x[0-9a-fA-F]{40}/.test(s) || /(私钥|助记词|mnemonic|private\s*key|seed\s*phrase)/i.test(s); }
    function evClean(props) {
      var out = {}, n = 0;
      if (props && typeof props === "object") {
        for (var k in props) {
          if (!Object.prototype.hasOwnProperty.call(props, k)) continue;
          if (PROP_KEYS.indexOf(k) < 0) continue;
          var v = props[k];
          if (v === undefined || v === null) continue;
          if (typeof v === "function" || (typeof v === "object")) continue;
          if (typeof v === "number") { if (isFinite(v)) out[k] = v; }
          else if (typeof v === "boolean") { out[k] = v; }
          else { out[k] = String(v).slice(0, 200); }
          if (++n >= MAX_PROPS) break;
        }
      }
      if (out.search_keyword && evSensitiveClient(out.search_keyword)) out.search_keyword = "[filtered]";
      return out;
    }
    function evSend(payload, beacon) {
      try {
        var body = JSON.stringify(payload);
        if (beacon && navigator.sendBeacon) { navigator.sendBeacon(EVENT_ENDPOINT, new Blob([body], { type: "application/json" })); return; }
        fetch(EVENT_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true, credentials: "omit" }).catch(function () {});
      } catch (e) {}
    }
    function track(eventName, properties, opts) {
      try {
        if (typeof eventName !== "string" || !EV_WHITELIST[eventName]) return;
        opts = opts || {};
        if (opts.dedupKey) { var dk = "w3o_ev_" + opts.dedupKey; if (sentDedup[dk] || ssGet(dk)) return; sentDedup[dk] = 1; ssSet(dk, "1"); }
        var props = evClean(properties);
        var payload = {
          event_id: uuid(), event_name: eventName, visitorId: vid, sessionId: sid,
          pathname: location.pathname.slice(0, 300), pageTitle: (document.title || "").slice(0, 200),
          referrerDomain: refDomain(document.referrer).slice(0, 120), utm: utm,
          language: (navigator.language || "").slice(0, 20), ts: Date.now(),
          run_id: opts.runId || props.run_id || undefined, properties: props
        };
        evSend(payload, !!opts.beacon);
      } catch (e) {}
    }
    var lastTrack = {};
    function trackThrottled(name, props, opts) {
      var key = name + "|" + ((props && (props.tool_name || props.navigation_name || props.outbound_domain || props.file_name)) || "");
      var now = Date.now(); if (lastTrack[key] && now - lastTrack[key] < 800) return; lastTrack[key] = now;
      track(name, props, opts);
    }
    window.W3OAnalytics = {
      track: track,
      trackOnce: function (name, props, dedupKey) { track(name, props, { dedupKey: dedupKey || (name + ":" + (props && (props.article_id || props.video_id || props.tool_name) || "")) }); },
      newRunId: function () { return uuid(); }
    };
    // 自动埋点1: data-analytics-event
    document.addEventListener("click", function (e) {
      try {
        var el = e.target.closest && e.target.closest("[data-analytics-event]"); if (!el) return;
        var name = el.getAttribute("data-analytics-event"); var props = {};
        for (var i = 0; i < el.attributes.length; i++) { var at = el.attributes[i]; if (at.name.indexOf("data-") === 0 && at.name !== "data-analytics-event") { var key = at.name.slice(5).replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); if (PROP_KEYS.indexOf(key) >= 0) props[key] = at.value; } }
        trackThrottled(name, props);
      } catch (_) {}
    }, true);
    // 自动埋点2: 外链/下载/社交(未手动标注的a标签)
    document.addEventListener("click", function (e) {
      try {
        var a = e.target.closest && e.target.closest("a[href]"); if (!a || a.hasAttribute("data-analytics-event")) return;
        var href = a.getAttribute("href") || ""; if (href.indexOf("#") === 0 || href.indexOf("javascript:") === 0) return;
        var host = ""; try { host = new URL(href, location.href).hostname; } catch (_) {}
        if (/\.(pdf|zip|apk|mp4|dmg|exe|xlsx?|docx?|pptx?)($|\?)/i.test(href) || a.hasAttribute("download")) {
          trackThrottled("download", { file_name: (href.split("/").pop() || "").slice(0, 120) });
        } else if (host && host !== location.hostname) {
          var soc = { "t.me": "telegram_click", "x.com": "x_click", "twitter.com": "x_click", "youtube.com": "youtube_click", "youtu.be": "youtube_click" };
          var ev = null; for (var d in soc) { if (host === d || host.slice(-(d.length + 1)) === "." + d) { ev = soc[d]; break; } }
          if (ev) trackThrottled(ev, { outbound_domain: host }); else trackThrottled("outbound_click", { outbound_domain: host.slice(0, 120) });
        }
      } catch (_) {}
    }, true);
  } catch (e) { /* 永不影响页面 */ }
})();
