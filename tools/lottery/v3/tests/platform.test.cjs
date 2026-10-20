const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../platform.js'),'utf8');
const U='0x'+'1'.repeat(40),R='0x'+'2'.repeat(40),B='0x'+'3'.repeat(40),Z='0x'+'0'.repeat(40);
const hash='0x'+'a'.repeat(64),word=n=>BigInt(n).toString(16).padStart(64,'0'),addressWord=a=>a.slice(2).padStart(64,'0');
function fixture(options={}){
  const storage=new Map(),sent=[],posts=[],calls=[];
  const state={account:U,chain:'0x1a3a',ref:null,legacy:Z,allowance:0n,delegate:Z,...options.state};
  const profile=()=>({addr:U,referrer:state.ref,directCount:0,indirectCount:0,earned:{},claimed:{},claimable:{},invitees:[],tokens:{}});
  const context={module:{exports:{}},URL,URLSearchParams,AbortController,console,navigator:{language:'zh-CN'},setTimeout:(fn,ms)=>setTimeout(fn,ms===2000?0:ms),clearTimeout,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},CustomEvent:class{constructor(type,o){this.type=type;this.detail=o.detail;}},dispatchEvent:()=>{},
    ethereum:{on:()=>{},request:async q=>{calls.push(q);if(options.provider){const r=await options.provider(q,state);if(r!==undefined)return r;}
      if(q.method==='eth_accounts'||q.method==='eth_requestAccounts')return [state.account];
      if(q.method==='eth_chainId')return state.chain;
      if(q.method==='wallet_switchEthereumChain'){state.chain='0x1a3a';return null;}
      if(q.method==='eth_gasPrice')return '0x1';
      if(q.method==='personal_sign')return 'mock-signature';
      if(q.method==='eth_sendTransaction'){sent.push(q.params[0]);const d=q.params[0].data;if(d.startsWith('0x095ea7b3'))state.allowance=BigInt('0x'+d.slice(-64));if(d.startsWith('0xb6a5d7de'))state.delegate='0x'+d.slice(-40);return hash;}
      if(q.method==='eth_getTransactionReceipt')return {status:'0x1',blockNumber:'0x2'};
      throw new Error('Unexpected provider method '+q.method);
    }},
    fetch:async(url,opts={})=>{url=String(url);let body;if(options.fetch)body=await options.fetch(url,opts,state);if(body===undefined){
      if(url.includes('/ref/me?'))body=profile();
      else if(url.endsWith('/ref/bind')){const b=JSON.parse(opts.body);posts.push(b);state.ref=b.inviter;body={ok:true};}
      else if(url.includes('/ref/resolve?'))body={addr:R,code:'ABC123'};
      else if(url.includes('/api?'))body={status:'1',result:[]};
      else {const q=JSON.parse(opts.body||'{}');if(q.method==='eth_blockNumber')body={result:'0x66'};else if(q.method==='eth_getTransactionReceipt'){const custom=options.provider?await options.provider(q,state):undefined;body={result:custom===undefined?{status:'0x1',blockNumber:'0x2',transactionHash:hash}:custom};}else if(q.method==='eth_call'){const d=q.params[0].data;body={result:'0x'+(d.startsWith('0xdd62ed3e')?word(state.allowance):d.startsWith('0x8d22ea2a')?addressWord(state.delegate):d.startsWith('0x2cf003c2')?addressWord(state.legacy):word(0))};}else throw new Error('Unexpected fetch '+url);}
    }return {ok:true,json:async()=>JSON.parse(JSON.stringify(body))};}
  };
  vm.createContext(context);vm.runInContext(code,context);return {A:context.module.exports,state,sent,posts,calls,context,storage};
}
test('configuration contains only valid nonzero addresses and supported token precision',()=>{const {A}=fixture();for(const t of A.TOKENS){for(const k of ['token','lottery','game'])if(t[k])assert.equal(A.addr(t[k]),t[k]);assert.ok(Number.isInteger(t.dec)&&t.dec<=18);}});
test('RPC errors and truncated results are not converted into a zero balance',async()=>{const {A}=fixture({fetch:async()=>({error:{message:'timeout'}})});await assert.rejects(A.uintCall(R,'12345678'),{code:'RPC_ERROR'});const f=fixture({fetch:async()=>({result:'0x'})});await assert.rejects(f.A.uintCall(R,'12345678'),{code:'RPC_DATA'});});
test('network switch refusal prevents transaction submission',async()=>{const {A,sent}=fixture({state:{chain:'0x1'},provider:async q=>{if(q.method==='wallet_switchEthereumChain')throw Object.assign(new Error('Rejected'),{code:4001});}});await assert.rejects(A.send(U,R,'0x1234'),{code:4001});assert.equal(sent.length,0);});
test('wallet changed while preparing a transaction prevents submission',async()=>{const {A,sent}=fixture({provider:async(q,s)=>{if(q.method==='eth_gasPrice'){s.account=B;return '0x1';}}});await assert.rejects(A.send(U,R,'0x1234'),{code:'ACCOUNT_CHANGED'});assert.equal(sent.length,0);});
test('latest explicitly selected inviter is the signed and verified inviter',async()=>{const {A,posts,calls}=fixture();A.setCandidate(R);A.setCandidate(B);const p=await A.bind(U);assert.equal(p.referrer,B);assert.equal(posts.length,1);assert.equal(posts[0].inviter,B);assert.ok(calls.find(c=>c.method==='personal_sign').params[0].endsWith(' -> '+B));});
test('changing inviter during signing discards the stale signature',async()=>{let f;f=fixture({provider:async q=>{if(q.method==='personal_sign'){f.A.setCandidate(B);return 'mock';}}});f.A.setCandidate(R);await assert.rejects(f.A.bind(U),{code:'CANDIDATE_CHANGED'});assert.equal(f.posts.length,0);});
test('existing V3 inviter cannot be silently overwritten by a new platform inviter',async()=>{const f=fixture({state:{legacy:R}});f.A.setCandidate(B);await assert.rejects(f.A.bind(U),{code:'LEGACY_CONFLICT'});assert.equal(f.posts.length,0);assert.equal(f.calls.filter(q=>q.method==='personal_sign').length,0);});
test('already bound platform relation remains authoritative',async()=>{const f=fixture({state:{ref:R}});f.A.setCandidate(B);assert.equal((await f.A.bind(U)).referrer,R);assert.equal(f.posts.length,0);});
test('lottery requires a bound relationship and detects a conflicting pool inviter',async()=>{let f=fixture();await assert.rejects(f.A.purchaseReferrer(R,U),{code:'BIND_REQUIRED'});f=fixture({state:{ref:R,legacy:B}});await assert.rejects(f.A.purchaseReferrer(R,U),{code:'REFERRAL_CONFLICT'});});
test('rejected allowance never continues to delegate authorization',async()=>{const f=fixture({provider:async q=>{if(q.method==='eth_sendTransaction')throw Object.assign(new Error('Rejected'),{code:4001});}});await assert.rejects(f.A.authorize({token:R,contract:B,delegate:U},U,100n),{code:4001});assert.equal(f.calls.filter(q=>q.method==='eth_sendTransaction').length,1);});
test('finite allowance and delegate are independently re-read after confirmation',async()=>{const f=fixture();assert.equal(await f.A.authorize({token:R,contract:B,delegate:R},U,100n),true);assert.equal(f.sent.length,2);assert.equal(f.state.allowance,100n);assert.equal(f.state.delegate,R);await assert.rejects(f.A.authorize({token:R,contract:B,delegate:R},U,2n**256n-1n));});
test('reverted transactions are persisted as failures, never success',async()=>{const f=fixture({provider:async q=>{if(q.method==='eth_getTransactionReceipt')return {status:'0x0',blockNumber:'0x2'};}});await assert.rejects(f.A.send(U,R,'0x1234'),{code:'TX_REVERTED'});assert.equal(f.A.transactions(U)[0].status,'failed');});
test('pending transactions are resumed from Anubis RPC after a page refresh',async()=>{const f=fixture();f.A.recordTx(U,{hash,to:R,data:'0x1234',status:'pending'});await f.A.refreshTransactions(U);assert.equal(f.A.transactions(U)[0].status,'confirmed');assert.equal(f.sent.length,0);});
test('retrying a previously pending action returns its confirmed receipt without a second send',async()=>{const f=fixture();f.A.recordTx(U,{hash,to:R,data:'0x1234',status:'pending'});const rc=await f.A.send(U,R,'0x1234');assert.equal(rc.status,'0x1');assert.equal(f.sent.length,0);});
test('unresolved pending action blocks duplicate submission, including after refresh',async()=>{const f=fixture({provider:async q=>q.method==='eth_getTransactionReceipt'?null:undefined});f.A.recordTx(U,{hash,to:R,data:'0x1234',status:'pending'});await assert.rejects(f.A.send(U,R,'0x1234'),{code:'TX_PENDING'});assert.equal(f.sent.length,0);});
test('simultaneous submissions of the same action prompt the wallet only once',async()=>{const f=fixture();const r=await Promise.allSettled([f.A.send(U,R,'0x1234'),f.A.send(U,R,'0x1234')]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);assert.equal(r.find(x=>x.status==='rejected').reason.code,'TX_PENDING');assert.equal(f.sent.length,1);});
test('malformed cached lists cannot break account rendering',()=>{const f=fixture();f.A.write(f.A.scope('results',U),{});f.A.write(f.A.scope('transactions',U),{});assert.equal(f.A.results(U).length,0);assert.equal(f.A.transactions(U).length,0);});
test('account and token scopes prevent mixed card records, sessions and active hands',()=>{const f=fixture(),t=f.A.TOKENS.find(t=>t.game);f.A.saveResult(U,{contract:t.game,sym:t.sym,hand:'1'});assert.equal(f.A.results(U).length,1);assert.equal(f.A.results(B).length,0);assert.notEqual(f.A.activeKey(U),f.A.activeKey(B));assert.notEqual(f.A.scope('session-lgns',U),f.A.scope('session-dai',U));assert.equal(f.A.read('anubisplay_results',null),null);});
test('same contract and hand result is deduplicated',()=>{const f=fixture(),t=f.A.TOKENS[0];f.A.saveResult(U,{contract:t.game,sym:t.sym,hand:'1'});f.A.saveResult(U,{contract:t.game,sym:t.sym,hand:'1',label:'updated'});assert.equal(f.A.results(U).length,1);assert.equal(f.A.results(U)[0].label,'updated');});
test('small nonzero balances stay distinguishable from zero and inputs stay exact',()=>{const {A}=fixture();assert.equal(A.format(1n,18),'<0.0001');assert.equal(A.format(0n,18),'0');assert.equal(A.parseAmount('9007199254740993.123456789',9),9007199254740993123456789n);assert.throws(()=>A.parseAmount('1.123',2));});
test('invalid API profile cannot inject counts or masquerade as a successful lookup',async()=>{const f=fixture({fetch:async url=>url.includes('/ref/me?')?{addr:U,referrer:null,directCount:'<img>',indirectCount:0}:undefined});await assert.rejects(f.A.profile(U,true),{code:'PROFILE_DATA'});});
test('indexer error is reported instead of empty history',async()=>{const f=fixture({fetch:async url=>url.includes('/api?')?{status:'0',message:'API error',result:[]}:undefined});await assert.rejects(f.A.logs(R,'0x'+'f'.repeat(64),0),{code:'INDEXER_ERROR'});});
test('lottery spend comes from transfers in purchase transactions, not current ticket price',async()=>{
  let t;const ticket='0xc8c5c2b0e44fb6312c0098ec42642058527713d0a1d29a5c6ccbfe34d714d41e',win='0xab9af1684355064aa9258894f5c85b041fd7a83e4fe0eb02e607c13d8cb627b4',transfer='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
  const event=(address,topics,data,index)=>({address,topics,data,transactionHash:hash,logIndex:'0x'+index,blockNumber:'0x65'});
  const f=fixture({fetch:async url=>{if(!url.includes('/api?'))return;const q=new URL(url).searchParams;let rows=[];if(q.get('topic0')===ticket)rows=[event(t.lottery,[ticket,'0x'+word(1),'0x'+addressWord(U)],'0x'+word(2),0)];if(q.get('topic0')===transfer)rows=[event(t.token,[transfer,'0x'+addressWord(U),'0x'+addressWord(t.lottery)],'0x'+word(777),1)];if(q.get('topic0')===win)rows=[event(t.lottery,[win,'0x'+word(1)],'0x'+word(64)+word(128)+word(1)+addressWord(U)+word(1)+word(500),2)];return {status:'1',result:rows};}});t=f.A.TOKENS[0];const r=await f.A.lotteryLedger(t,U,0);assert.equal(r.tickets,2n);assert.equal(r.spent,777n);assert.equal(r.won,500n);
});
test('missing purchase transfer keeps cost unknown rather than repricing history',async()=>{let t;const topic='0xc8c5c2b0e44fb6312c0098ec42642058527713d0a1d29a5c6ccbfe34d714d41e';const f=fixture({fetch:async url=>{if(!url.includes('/api?'))return;const q=new URL(url).searchParams;return {status:'1',result:q.get('topic0')===topic?[{address:t.lottery,topics:[topic,'0x'+word(1),'0x'+addressWord(U)],data:'0x'+word(2),transactionHash:hash,logIndex:'0x0',blockNumber:'0x65'}]:[]};}});t=f.A.TOKENS[0];const r=await f.A.lotteryLedger(t,U,0);assert.equal(r.spent,null);});
