const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {parseHTML} = require('linkedom');
const source = fs.readFileSync(path.join(__dirname,'../assets/player.js'),'utf8');
const fallback = 'https://web3origin.com/assets/live-audio-cover.jpg';

function setup(saved) {
  const {window} = parseHTML('<!doctype html><html lang="zh-CN"><head></head><body></body></html>');
  const document = window.document;
  const create = document.createElement.bind(document);
  document.createElement = name => {
    const el = create(name);
    if(name==='audio')Object.assign(el,{paused:true,currentTime:0,duration:240,playbackRate:1,play(){this.paused=false;return Promise.resolve();},pause(){this.paused=true;},load(){}});
    return el;
  };
  const storage = new Map(saved ? [['origin_player_v1',JSON.stringify(saved)]] : []);
  const mediaSession = {setActionHandler(){}};
  const globals = {document,navigator:{mediaSession,userAgent:'Test'},URL,console,innerWidth:1200,innerHeight:800,
    MediaMetadata:class {constructor(data){Object.assign(this,data);}},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){}};
  globals.window = {...globals,addEventListener(){}};
  vm.runInNewContext(source,globals);
  return {OP:globals.window.OriginPlayer,document,mediaSession,storage};
}

test('missing covers reach the floating player and lock-screen metadata without changing audio URLs',()=>{
  const h=setup();const url='https://media.web3origin.com/replays/test.mp3';
  h.OP.playList([{url,title:'课堂录音',cover:''}],0);
  assert.equal(h.OP.current().url,url);
  assert.equal(h.OP.current().cover,fallback);
  assert.equal(h.document.querySelector('#op-cover img').src,fallback);
  assert.equal(h.mediaSession.metadata.artwork[0].src,fallback);
});

test('failed custom artwork uses the backup for both display and subsequent page restoration',()=>{
  const h=setup();
  h.OP.playList([{url:'https://media.web3origin.com/replays/test.mp3',title:'课堂录音',cover:'https://example.org/missing.jpg'}],0);
  const img=h.document.querySelector('#op-cover img');img.onerror.call(img);
  assert.equal(img.src,fallback);
  assert.equal(h.mediaSession.metadata.artwork[0].src,fallback);
  const saved=JSON.parse(h.storage.get('origin_player_v1'));
  assert.equal(saved.items[0].cover,fallback);
  const restored=setup(saved);
  assert.equal(restored.OP.current().cover,fallback);
  assert.equal(restored.document.querySelector('#op-cover img').src,fallback);
  img.onerror.call(img);
  assert.equal(h.document.querySelector('#op-cover img'),null,'failed fallback cannot loop');
});

test('older saved playlists with no artwork pick up the default automatically',()=>{
  const h=setup({items:[{url:'https://media.web3origin.com/replays/old.mp3',title:'旧录音'}],idx:0,time:30,playing:false});
  assert.equal(h.OP.current().cover,fallback);
  assert.equal(h.mediaSession.metadata.artwork[0].src,fallback);
});
