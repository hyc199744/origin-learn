const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseHTML } = require('linkedom');

const html = fs.readFileSync(path.join(__dirname, '../news/index.html'), 'utf8');
const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('var API='));
const now = Date.parse('2026-11-16T01:00:00Z');
const oldFeed = () => ({
  ok: true, updatedAt: now, syncedBy: 'vps',
  items: [{ id: 10, title: '旧公告', createtime: Date.parse('2026-09-20T06:00:00Z') / 1000, paras: ['公告正文'] }],
  tweets: [{ id: '20', handle: 'AWAKEHELIX', text: '旧推文', created_at: '2026-11-08T09:34:11Z' }],
});
const flush = async () => { for (let i = 0; i < 8; i++) await new Promise(setImmediate); };

function setup() {
  const { document } = parseHTML(html);
  const state = { data: oldFeed(), http: 200, error: false, hang: false, calls: [] };
  const timers = new Map(), storage = new Map();
  let serial = 0;
  class Clock extends Date { static now() { return now; } }
  const globals = {
    document, Date: Clock, Promise, AbortController, console,
    localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, String(v)) },
    requestAnimationFrame: fn => fn(),
    setTimeout(fn, ms) { const id = ++serial; timers.set(id, { fn, ms }); return id; },
    clearTimeout: id => timers.delete(id), setInterval: () => ++serial, clearInterval() {},
    async fetch(url, options) {
      state.calls.push({ url, options });
      if (state.hang) return new Promise(resolve => { state.resolve = resolve; });
      if (state.error) throw new Error('network unavailable');
      return { ok: state.http === 200, status: state.http, json: async () => structuredClone(state.data) };
    },
  };
  globals.window = {};
  const context = vm.createContext(globals);
  return { document, state, context, timers, storage, run: () => vm.runInContext(script, context), status: () => document.getElementById('srcState').textContent };
}

test('recent package timestamp cannot disguise old publications or trigger a new-announcement toast', async () => {
  const h = setup(); h.run(); await flush();
  assert.match(h.status(), /公告最新：2026-09-20.*近期未收录新内容/);
  assert.equal(h.document.getElementById('dot').className, 'dot warn');
  assert.equal(h.document.getElementById('newsToast'), null);
  assert.equal(h.storage.has('w3o_news_notified'), false);
  h.context.switchTab('tw');
  assert.match(h.status(), /推文最新：2026-11-08.*近期未收录新内容/);
  assert.doesNotMatch(h.status(), /数据源正常|2026-11-16/);
  assert(h.state.calls.every(c => c.options.cache === 'no-store'));
});

test('HTTP failure is rejected and the existing refresh can recover', async () => {
  const h = setup(); h.state.http = 502; h.run(); await flush();
  assert.match(h.status(), /刷新失败/);
  assert.equal(h.document.querySelectorAll('.tw').length, 0);
  assert.match(h.document.getElementById('xfeed').textContent, /暂时无法加载/);
  h.state.http = 200;
  await h.context.loadFeed(1);
  assert.equal(h.document.querySelectorAll('.tw').length, 1);
  assert.match(h.status(), /2026-09-20/);
});

test('network and malformed refresh responses retain already loaded articles and tweets', async () => {
  const h = setup(); h.run(); await flush();
  const articles = h.document.getElementById('anns').innerHTML;
  const tweets = h.document.getElementById('xfeed').innerHTML;
  const badResponses = [null, { ok: true, items: [], tweets: {} }, { ok: false, items: [], tweets: [] }, { ok: true, items: [null], tweets: [] }];
  for (const response of badResponses) {
    h.state.data = response; await h.context.loadFeed();
    assert.equal(h.document.getElementById('anns').innerHTML, articles);
    assert.equal(h.document.getElementById('xfeed').innerHTML, tweets);
    assert.match(h.status(), /刷新失败.*保留已加载内容/);
  }
  h.state.error = true; await h.context.loadFeed();
  assert.equal(h.document.getElementById('anns').innerHTML, articles);
  assert.equal(h.document.getElementById('xfeed').innerHTML, tweets);
});

test('timeout releases refresh, prevents duplicate fetches, and ignores a late old response', async () => {
  const h = setup(); h.state.hang = true; h.run(); await flush();
  const pending = h.context.loadFeed(1);
  await flush(); assert.equal(h.state.calls.length, 1);
  const resolveOld = h.state.resolve;
  [...h.timers.values()].find(t => t.ms === 12000).fn(); await pending;
  assert.match(h.status(), /刷新超时/);
  assert.equal(h.state.calls[0].options.signal.aborted, true);
  h.state.hang = false;
  await h.context.loadFeed(1);
  assert.equal(h.state.calls.length, 2);
  const current = h.document.getElementById('anns').innerHTML;
  resolveOld({ ok: true, json: async () => ({ ok: true, items: [], tweets: [] }) });
  await flush();
  assert.equal(h.document.getElementById('anns').innerHTML, current);
});

test('invalid dates and optional fields do not stop other records or the article reader', async () => {
  const h = setup();
  h.state.data.items[0].paras = null;
  h.state.data.tweets.push({ id: '21', handle: 'example', text: '日期异常的推文', text_zh: 123, media: {}, created_at: 'invalid' });
  h.run(); await flush();
  assert.equal(h.document.querySelectorAll('.tw').length, 2);
  assert.match(h.document.getElementById('xfeed').textContent, /时间未知/);
  assert.doesNotMatch(h.status(), /刷新失败/);
  h.context.openReader(0);
  assert.match(h.document.getElementById('reader').textContent, /正文暂未收录/);
  assert.equal(h.document.getElementById('mask').classList.contains('on'), true);
});

test('publications sort newest first and new announcements notify once using Beijing dates', async () => {
  const h = setup();
  h.state.data.items.push({ id: 11, title: '新公告', createtime: Date.parse('2026-11-15T17:00:00Z') / 1000, paras: ['新正文'] });
  h.state.data.tweets.push({ id: '21', handle: 'example', text: '新推文', created_at: '2026-11-15T17:01:00Z' });
  h.run(); await flush();
  assert.equal(h.document.querySelector('.ann h3').textContent, '新公告');
  assert.equal(h.document.querySelector('.tw .tx').textContent, '新推文');
  assert.match(h.status(), /公告最新：2026-11-16$/);
  assert.equal(h.document.getElementById('dot').className, 'dot');
  const toast = h.document.getElementById('newsToast');
  assert.match(toast.textContent, /新公告/);
  await h.context.loadFeed();
  assert.equal(h.document.getElementById('newsToast'), toast);
  h.context.switchTab('tw'); assert.match(h.status(), /推文最新：2026-11-16$/);
});

test('unknown or future publication times cannot claim fresh content', async () => {
  const h = setup();
  h.state.data.items[0].createtime = 'not a date';
  h.state.data.tweets[0].created_at = '2099-01-01T00:00:00Z';
  h.run(); await flush();
  assert.match(h.status(), /发布时间待核验/);
  h.context.switchTab('tw'); assert.match(h.status(), /发布时间待核验/);
  assert.equal(h.document.getElementById('dot').className, 'dot warn');
  assert.equal(h.document.getElementById('newsToast'), null);
});

test('valid empty feeds render without an error or promise that collection succeeded', async () => {
  const h = setup(); h.state.data = { ok: true, items: [], tweets: [] }; h.run(); await flush();
  assert.match(h.status(), /暂无公告/);
  h.context.switchTab('tw'); assert.match(h.status(), /暂无推文/);
  assert.match(h.document.getElementById('xfeed').textContent, /暂未收录推文/);
  assert.doesNotMatch(h.status(), /正常|失败/);
});
