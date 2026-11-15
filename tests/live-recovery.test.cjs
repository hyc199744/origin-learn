const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseHTML } = require('linkedom');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const flush = async () => { for (let i = 0; i < 8; i++) await new Promise(setImmediate); };
const replay = { ticket_id: 'rec_20261112_0857', kind: 'audio', title: '课堂音频', live_time: 1794445036, duration: 4800, play_url: 'https://media.web3origin.com/replays/20261112_0857.mp3' };
const video = { ...replay, ticket_id: 'rec_20261112_1432', kind: 'video', title: '课堂视频', live_time: 1794465169, play_url: 'https://media.web3origin.com/replays/20261112_1432.mp4' };

function setup(page, search = '', now = Date.parse('2026-11-16T12:30:00Z')) {
  const { window } = parseHTML(read(page));
  const document = window.document;
  const calls = [], timers = new Map(), intervals = [];
  const state = { rows: [video, replay], replayError: false, hang: false, live: false, played: [], starts: [], active: false };
  state.course = { id: 1, title: '起源课堂', external_url: 'https://a.toomao.cn/liveroom/4931814', status: 'waiting', source: 'schedule', isLive: false, start: now / 1000 - 600, end: now / 1000 + 3600, embed_mode: 'embed' };
  let serial = 0;
  const location = { search, reload() {}, pathname: '/live/' };
  const storage = new Map();
  const localStorage = { getItem: k => storage.get(k) || null, setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) };
  const OP = {
    startLive(meta) { state.starts.push(meta); state.active = true; },
    isLive: () => state.active,
    stopLive() { state.active = false; const m = state.starts.at(-1); if (m) m.onClose(); },
    hideBar() {}, current: () => null, playList: (...args) => state.played.push(args),
    onUpdate: () => () => {}, getState: () => ({ time: 0, duration: 4800, paused: true }),
  };
  const fetch = async url => {
    calls.push(url);
    let data;
    if (url.includes('/live/replays?')) {
      if (state.hang) return new Promise(() => {});
      if (state.replayError) throw new Error('network unavailable');
      data = { ok: true, replays: state.rows };
    } else if (url.endsWith('/live/today')) data = { ok: true, serverTime: now/1000, course: { ...state.course } };
    else if (url.endsWith('/live/stream')) data = { ok: true, live: state.live, streamUrl: state.live ? 'https://media.web3origin.com/live/test.m3u8' : '' };
    else data = { ok: true, msgs: [], total: 0, online: 0, cum: 0 };
    return { ok: true, status: 200, json: async () => data };
  };
  class Clock extends Date { static now() { return now; } }
  const globals = {
    document, navigator: { userAgent: 'Desktop Test', maxTouchPoints: 0 }, location, localStorage,
    fetch, URL, URLSearchParams, AbortController, Promise, Date: Clock, console,
    setTimeout(fn, ms) { const id = ++serial; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
    setInterval(fn, ms) { intervals.push({ fn, ms }); return intervals.length; }, clearInterval() {},
    MutationObserver: class { observe() {} }, innerWidth: 1365, innerHeight: 900,
    OriginPlayer: OP,
  };
  globals.window = { ...globals, addEventListener() {}, scrollTo() {} };
  const context = vm.createContext(globals);
  function run() {
    const source = page === 'live/index.html' ? read('live.js') : [...read(page).matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('var API='));
    vm.runInContext(source, context, { filename: page });
  }
  return { document, state, calls, timers, intervals, run, OP };
}

test('replay failure keeps both replay entrances visible and offers retry', async () => {
  const h = setup('live/index.html'); h.state.replayError = true; h.run(); await flush();
  assert.notEqual(h.document.getElementById('lv-replays-sec').style.display, 'none');
  assert.equal(h.document.querySelectorAll('.lv-shortcuts a').length, 2);
  assert.match(h.document.getElementById('lv-replay-status').textContent, /加载失败/);
  assert.equal(h.document.getElementById('lv-replay-retry').disabled, false);
  h.state.replayError = false;
  await h.document.getElementById('lv-replay-retry').onclick();
  assert.equal(h.document.querySelectorAll('.lv-rep-item').length, 1);
  assert.match(h.document.getElementById('lv-replay-status').textContent, /2026-11-12 08:57/);
  assert(h.calls.some(u => u.endsWith('/live/replays?limit=200')));
});

test('pending replay request times out and enables retry', async () => {
  const h = setup('live/index.html'); h.state.hang = true; h.run(); await flush();
  for (const t of h.timers.values()) if (t.ms === 10000) t.fn();
  await flush();
  assert.match(h.document.getElementById('lv-replay-status').textContent, /加载失败/);
  assert.equal(h.document.getElementById('lv-replay-retry').disabled, false);
});

test('backup uses the permanent channel without claiming verified live status or cropping', async () => {
  const h = setup('live/index.html'); h.run(); await flush();
  const frame = h.document.getElementById('lv-iframe');
  assert.equal(frame.src, 'https://view.onlu.cn/liveroom/4931814');
  assert.equal(frame.style.top, '0');
  assert.match(h.document.getElementById('lv-badge').textContent, /待确认/);
  assert.equal(h.document.querySelector('.lv-main').classList.contains('lv-embedded'), true);
  assert.match(h.document.getElementById('lv-open-original').getAttribute('href'), /view\.onlu\.cn/);
});

test('a repaired backend channel retains the real ended state', async () => {
  const h = setup('live/index.html');
  h.state.course.external_url = 'https://view.onlu.cn/liveroom/4931814';
  h.state.course.status = 'ended';
  h.state.course.source = 'platform';
  h.run(); await flush();
  assert.equal(h.document.getElementById('lv-open-original').getAttribute('href'), h.state.course.external_url);
  assert.match(h.document.getElementById('lv-badge').textContent, /结束/);
  assert.equal(h.document.getElementById('lv-iframe'), null);
  assert.doesNotMatch(h.document.getElementById('lv-body').textContent, /正在使用备用课堂/);
});

test('failed background audio leaves the working classroom in place', async () => {
  const h = setup('live/index.html'); h.run(); await flush();
  const frame = h.document.getElementById('lv-iframe');
  h.document.getElementById('lv-bg').onclick(); await flush();
  assert.equal(h.document.getElementById('lv-iframe'), frame);
  assert.equal(h.state.starts.length, 0);
  assert.match(h.document.getElementById('lv-playback-note').textContent, /暂未提供后台音频/);
  assert.equal(h.document.getElementById('lv-bg').disabled, false);
});

test('verified audio can start even if the course status lags, and survives that stale status', async () => {
  const h = setup('live/index.html'); h.state.live = true; h.run(); await flush();
  h.document.getElementById('lv-bg').onclick(); await flush();
  assert.equal(h.state.starts.length, 1);
  assert.equal(h.state.starts[0].streamUrl, 'https://media.web3origin.com/live/test.m3u8');
  h.intervals.find(t => t.ms === 30000).fn(); await flush();
  assert.equal(h.state.active, true);
  assert.match(h.document.getElementById('lv-badge').textContent, /正在直播/);
});

test('updated backend classroom replaces the fallback immediately for the same course ID', async () => {
  const h = setup('live/index.html'); h.run(); await flush();
  h.state.course.external_url = 'https://view.onlu.cn/play/new-classroom';
  h.intervals.find(t => t.ms === 30000).fn(); await flush();
  assert.equal(h.document.getElementById('lv-iframe').src, h.state.course.external_url);
  assert.equal(h.document.getElementById('lv-open-original').getAttribute('href'), h.state.course.external_url);
});

test('video replay refresh preserves an already loaded list after network failure', async () => {
  const h = setup('tools/video-replays/index.html'); h.run(); await flush();
  assert.equal(h.document.querySelectorAll('#list .card').length, 1);
  assert.match(h.document.getElementById('replay-status').textContent, /2026-11-12 14:32/);
  h.state.replayError = true;
  await h.document.getElementById('replay-retry').onclick();
  assert.equal(h.document.querySelectorAll('#list .card').length, 1);
  assert.match(h.document.getElementById('replay-status').textContent, /加载失败/);
});

test('an unknown shared audio ID does not silently play a different class', async () => {
  const h = setup('live/play/index.html', '?t=missing'); h.run(); await flush();
  assert.equal(h.state.played.length, 0);
  assert.match(h.document.getElementById('pp-title').textContent, /不在当前回放列表/);
  assert(h.calls.some(u => u.endsWith('/live/replays?limit=200')));
});

test('audio replay fetch failures can be retried in place', async () => {
  const h = setup('live/play/index.html', '?t=missing'); h.state.replayError = true; h.run(); await flush();
  assert(h.document.getElementById('pp-retry'));
  h.state.replayError = false;
  h.document.getElementById('pp-retry').onclick(); await flush();
  assert.match(h.document.getElementById('pp-title').textContent, /不在当前回放列表/);
});
