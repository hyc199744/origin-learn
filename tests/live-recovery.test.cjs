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

function setup(page, search = '', now = Date.parse('2026-11-16T12:30:00Z'), viewport = {}) {
  const { window } = parseHTML(read(page));
  const document = window.document;
  const calls = [], timers = new Map(), intervals = [], windowEvents = {};
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
    document, navigator: { userAgent: viewport.mobile ? 'Mozilla/5.0 (Linux; Android 16) Mobile' : 'Desktop Test', maxTouchPoints: viewport.mobile ? 1 : 0 }, location, localStorage,
    fetch, URL, URLSearchParams, AbortController, Promise, Date: Clock, console,
    setTimeout(fn, ms) { const id = ++serial; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
    setInterval(fn, ms) { intervals.push({ fn, ms }); return intervals.length; }, clearInterval() {},
    MutationObserver: class { observe() {} }, innerWidth: viewport.width || 1365, innerHeight: viewport.height || 900,
    OriginPlayer: OP,
  };
  globals.window = { ...globals, addEventListener(event, fn) { (windowEvents[event] ||= []).push(fn); }, scrollTo() {} };
  const context = vm.createContext(globals);
  function run() {
    const source = page === 'live/index.html' ? read('live.js') : [...read(page).matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('var API='));
    vm.runInContext(source, context, { filename: page });
  }
  return { document, state, calls, timers, intervals, run, OP, advance: ms => { now += ms; }, visible: value => { document.hidden = !value; document.dispatchEvent(new window.Event('visibilitychange')); }, online: () => (windowEvents.online || []).forEach(fn => fn()), resize: () => (windowEvents.resize || []).forEach(fn => fn()) };
}

test('video polling finds new classes without replacing the playing video or reopening a closed share', async () => {
  const h = setup('tools/video-replays/index.html', '?v=' + video.ticket_id); h.run(); await flush();
  const player = h.document.querySelector('#mstage video');
  assert(player);
  const poll = h.intervals.find(t => t.ms === 60000);
  assert(poll);
  const card = h.document.querySelector('#list .card');
  poll.fn(); await flush();
  assert(h.document.querySelector('#list .card') === card, 'unchanged cards remain in place');
  h.state.rows.unshift({ ...video, ticket_id: 'new-video', live_time: video.live_time + 86400 });
  poll.fn(); await flush();
  assert.equal(h.document.querySelectorAll('#list .card').length, 2);
  assert(h.document.querySelector('#mstage video') === player, 'refresh keeps the same player');
  h.document.getElementById('mclose').onclick();
  poll.fn(); await flush();
  assert.equal(h.document.querySelector('#mstage video'), null);
  assert.equal(h.document.getElementById('modal').classList.contains('on'), false);
});

for (const page of ['live/index.html', 'tools/video-replays/index.html']) {
  test(page + ' pauses replay polling in background and refreshes on return or reconnect', async () => {
    const h = setup(page); h.run(); await flush();
    const count = () => h.calls.filter(u => u.includes('/live/replays?')).length;
    const poll = h.intervals.find(t => t.ms === 60000);
    assert(poll);
    h.visible(false); const before = count();
    poll.fn(); h.online(); await flush();
    assert.equal(count(), before);
    h.visible(true); await flush(); assert.equal(count(), before + 1);
    h.online(); await flush(); assert.equal(count(), before + 2);
    h.state.hang = true;
    poll.fn(); poll.fn(); h.online(); await flush();
    assert.equal(count(), before + 3, 'only one pending request');
  });

  test(page + ' reports successful check time separately and keeps it on failure', async () => {
    const h = setup(page); h.run(); await flush();
    const id = page === 'live/index.html' ? 'lv-replay-status' : 'replay-status';
    const note = () => h.document.getElementById(id).textContent;
    if(page === 'live/index.html') assert.equal(note(), '');
    else { assert.match(note(), /最新.*课程/); assert.match(note(), /上次更新：2026-11-16 20:30/); }
    h.advance(60000); h.state.replayError = true;
    h.intervals.find(t => t.ms === 60000).fn(); await flush();
    assert.match(note(), /加载失败/);
    if(page !== 'live/index.html') assert.match(note(), /上次更新：2026-11-16 20:30/);
    h.state.replayError = false;
    h.intervals.find(t => t.ms === 60000).fn(); await flush();
    if(page === 'live/index.html') assert.equal(note(), '');
    else { assert.match(note(), /列表已更新/); assert.match(note(), /上次更新：2026-11-16 20:31/); }
  });
}

test('empty video lists recover after initial failure without confusing errors with no recordings', async () => {
  const h = setup('tools/video-replays/index.html'); h.state.replayError = true;
  h.run(); await flush();
  assert.match(h.document.getElementById('list').textContent, /暂时无法获取列表/);
  h.state.replayError = false; h.state.rows = [];
  const poll = h.intervals.find(t => t.ms === 60000);
  poll.fn(); await flush();
  assert.match(h.document.getElementById('list').textContent, /暂无视频回放/);
  h.state.replayError = true; poll.fn(); await flush();
  h.state.replayError = false; poll.fn(); await flush();
  assert.match(h.document.getElementById('list').textContent, /暂无视频回放/);
  assert.match(h.document.getElementById('replay-status').textContent, /列表已更新/);
});

test('phone classroom keeps the full video area without reserving a full screen for external chat', async () => {
  const h = setup('live/index.html', '', undefined, { mobile: true, width: 390, height: 844 });
  h.run(); await flush();
  const frame = h.document.getElementById('lv-iframe'), stage = h.document.getElementById('lv-stage');
  Object.defineProperty(stage, 'clientWidth', { value: 350, configurable: true }); h.resize();
  assert.equal(stage.style.height, '197px');
  assert.equal(frame.style.top, '0');
  assert.equal(frame.style.width, '350px');
  assert.equal(frame.style.height, '633px');
  assert.equal(frame.getAttribute('scrolling'), 'no');
  assert.equal(h.document.querySelectorAll('.lv-rep-tabs a').length, 2);
  assert.equal(h.document.querySelector('.lv-rep-tabs a[href]').getAttribute('href'), '/tools/video-replays/');
  assert.equal(h.document.querySelector('.lv-shortcuts'), null);
});

test('phone fullscreen restores the classroom and leaving it restores the compact video area', async () => {
  const h = setup('live/index.html', '', undefined, { mobile: true, width: 390, height: 844 });
  h.run(); await flush();
  const frame = h.document.getElementById('lv-iframe'), stage = h.document.getElementById('lv-stage');
  h.document.fullscreenElement = stage; h.resize();
  assert.equal(stage.style.height, '844px');
  assert.equal(frame.style.height, '844px');
  assert.equal(frame.getAttribute('scrolling'), 'auto');
  h.document.fullscreenElement = null; h.resize();
  assert.equal(stage.style.height, '219px');
  assert.equal(frame.getAttribute('scrolling'), 'no');
});

test('other mobile classroom providers keep their original viewport', async () => {
  const h = setup('live/index.html', '', undefined, { mobile: true, width: 390, height: 844 });
  h.state.course.external_url = 'https://example.org/classroom';
  h.run(); await flush();
  assert.equal(h.document.getElementById('lv-stage').style.height, '633px');
  assert.equal(h.document.getElementById('lv-iframe').getAttribute('scrolling'), 'auto');
});

test('replay failure keeps both replay entrances visible and offers retry', async () => {
  const h = setup('live/index.html'); h.state.replayError = true; h.run(); await flush();
  assert.notEqual(h.document.getElementById('lv-replays-sec').style.display, 'none');
  assert.equal(h.document.querySelectorAll('.lv-rep-tabs a').length, 2);
  assert.match(h.document.getElementById('lv-replay-status').textContent, /加载失败/);
  assert.equal(h.document.getElementById('lv-replay-retry').disabled, false);
  h.state.replayError = false;
  await h.document.getElementById('lv-replay-retry').onclick();
  assert.equal(h.document.querySelectorAll('.lv-rep-item').length, 1);
  assert.equal(h.document.getElementById('lv-replay-status').textContent, '');
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
});

test('a repaired backend channel retains the real ended state', async () => {
  const h = setup('live/index.html');
  h.state.course.external_url = 'https://view.onlu.cn/liveroom/4931814';
  h.state.course.status = 'ended';
  h.state.course.source = 'platform';
  h.run(); await flush();
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

const audioCover = 'https://web3origin.com/assets/live-audio-cover.jpg';
test('audio cards have a local cover when metadata is missing or invalid, and retain specific covers', async () => {
  const h = setup('live/index.html');
  h.state.rows = [
    {...replay, cover:''},
    {...replay, ticket_id:'unsafe-cover', cover:'javascript:alert(1)'},
    {...replay, ticket_id:'custom-cover', cover:'https://example.org/class.jpg'},
  ];
  h.run(); await flush();
  const cards = [...h.document.querySelectorAll('.lv-rep-item')];
  assert.equal(cards[0].querySelector('img').src, audioCover);
  assert.equal(cards[1].querySelector('img').src, audioCover);
  const img = cards[2].querySelector('img');
  assert.equal(img.src, 'https://example.org/class.jpg');
  img.onerror.call(img);
  assert.equal(img.src, audioCover);
  assert.equal(cards[2].getAttribute('data-cover'), audioCover);
  assert.equal(img.onerror, null, 'fallback does not retry a failed image forever');
});

test('shared audio opens with a cover and passes it to the persistent player', async () => {
  const h = setup('live/play/index.html', '?t='+replay.ticket_id);
  h.run(); await flush();
  assert.equal(h.document.getElementById('pp-cover').src, audioCover);
  assert.equal(h.state.played[0][0][0].cover, audioCover);
});

test('playback cover survives an image error and changes when the next track is selected', async () => {
  const h = setup('live/play/index.html', '?t='+replay.ticket_id);
  h.state.rows = [{...replay,cover:'https://example.org/failed.jpg'},{...replay,ticket_id:'next',cover:'https://example.org/next.jpg'}];
  let paint;
  h.OP.onUpdate = cb => {paint=cb;return ()=>{};};
  h.run(); await flush();
  const img = h.document.getElementById('pp-cover');
  assert.equal(img.src, 'https://example.org/failed.jpg');
  img.onerror.call(img);
  assert.equal(img.src, audioCover);
  paint({active:true,idx:0,cover:'https://example.org/failed.jpg',paused:true});
  assert.equal(img.src, audioCover, 'progress updates do not retry the broken image');
  paint({active:true,idx:1,cover:'https://example.org/next.jpg',paused:true});
  assert.equal(img.src, 'https://example.org/next.jpg');
});
