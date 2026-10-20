/* ANUBIS PLAY：共用网络、邀请、交易状态与账户隔离。无自动签名/授权/交易。 */
(function (root) {
  'use strict';
  var ZERO = '0x0000000000000000000000000000000000000000';
  var CHAIN = { id: 6714, hex: '0x1a3a', name: 'Anubis', rpc: 'https://rpc.anubispace.org', explorer: 'https://browser.anubispace.org' };
  var API = 'https://zjgame.web3origin.com/ref';
  var TOKENS = [
    {key:'lgns',sym:'LGNS',dec:9,token:'0x4d1d808a081fdac440703b3765fc61f8028c06b8',lottery:'0xb8a20cefddae4b298a4086f3376f01bdb2d300c7',game:'0x628e54169677551b1c6cf77a3d68c04bd76789e1'},
    {key:'usdt',sym:'USDT',dec:6,token:'0xdfb6a28bc6dc51fed17c27c880f2c66cdd040a3e',lottery:'0x88f94a52ba5b24be6bc894f16d4657b12bab2859',game:'0xb8d3ca7a5ae0fb079a4d0b2bffd2c2244455b7f4'},
    {key:'dai',sym:'DAI',dec:18,token:'0x83fd06f0846d9d90b3016bf670efe2e0b11cde14',lottery:'0x7ec71344ce6fffd602d4911cab54a15f53cc01a0',game:'0x01ece8971b658483cb0dc33f071d1eceffa07a6d'},
    {key:'a',sym:'A',dec:18,token:'0xa921267c56b3a57696d6fd7949c9fad0a8e0c177',lottery:'0x6100ca0904e8b9c521129dec05afd4f5bbb9d6fb'},
    {key:'rm',sym:'RM',dec:9,token:'0x2e045e1380f5f5b6e7550328910a7377c9fce59d',lottery:'0x5beadbd9e7c87accac218d25aa83bb707a7e96a3',game:'0x143905b577a13aec122c37eb6e88636af3e1b470'}
  ];
  var candidate = null, profileCache = {}, walletEpoch = 0, sendLocks = new Set();
  function L(zh,en) { try { return (root.localStorage.getItem('aplang') || (root.navigator.language || 'zh').slice(0,2)) === 'zh' ? zh : en; } catch (_) { return zh; } }
  function fail(zh,en,code) { var e = new Error(L(zh,en)); e.code=code || 'AP_ERROR'; return e; }
  function addr(a) { if(typeof a!=='string'||!/^0x[0-9a-fA-F]{40}$/.test(a)||a.toLowerCase()===ZERO) throw fail('地址无效','Invalid address','BAD_ADDRESS'); return a.toLowerCase(); }
  function encA(a) { return addr(a).slice(2).padStart(64,'0'); }
  function enc(n) { var v=BigInt(n); if(v<0n||v>=2n**256n) throw fail('金额超出范围','Amount out of range'); return v.toString(16).padStart(64,'0'); }
  function format(value,dec,places) {
    var n=BigInt(value),neg=n<0n; if(neg)n=-n;
    var s=n.toString().padStart(dec+1,'0'),i=s.slice(0,s.length-dec)||'0';
    var f=dec?s.slice(-dec).slice(0,places==null?4:places).replace(/0+$/,''):'';
    if(!f&&n>0n&&i==='0')return (neg?'-':'')+'<0.'+'0'.repeat(Math.max(0,(places==null?4:places)-1))+'1';
    return (neg?'-':'')+i.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(f?'.'+f:'');
  }
  function parseAmount(s,dec) { s=String(s).trim(); if(!/^\d+(\.\d+)?$/.test(s))throw fail('请输入有效金额','Enter a valid amount'); var p=s.split('.'); if((p[1]||'').length>dec)throw fail('小数位过多','Too many decimal places'); var n=BigInt(p[0]+((p[1]||'')+'0'.repeat(dec)).slice(0,dec)); if(n<=0n)throw fail('金额必须大于零','Amount must be positive'); return n; }
  function esc(s) { return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function short(a) { return a?a.slice(0,6)+'…'+a.slice(-4):'—'; }
  function emit(name,detail) { if(root.dispatchEvent&&root.CustomEvent)root.dispatchEvent(new root.CustomEvent('ap:'+name,{detail:detail})); }
  function read(k,fallback) { try { var s=root.localStorage.getItem(k); return s?JSON.parse(s):fallback; } catch (_) { return fallback; } }
  function write(k,v) { try { root.localStorage.setItem(k,JSON.stringify(v)); } catch (_) {} }
  function scope(kind,a,contract) { return ['ap_v2',CHAIN.id,addr(a),kind,contract?addr(contract):'all'].join(':'); }
  async function json(url,options) {
    var controller=typeof root.AbortController==='function'?new root.AbortController():null;
    var timer=controller?root.setTimeout(function(){controller.abort();},15000):null;
    try { var r=await root.fetch(url,Object.assign({cache:'no-store'},options||{},controller?{signal:controller.signal}:{})); if(!r.ok)throw fail('服务暂不可用，请重试','Service unavailable, retry','HTTP_ERROR'); var j=await r.json(); if(!j||typeof j!=='object')throw fail('服务返回数据无效','Invalid service response'); return j; }
    catch(e){ if(e.name==='AbortError')throw fail('请求超时，请重试','Request timed out, retry','TIMEOUT'); throw e; }
    finally { if(timer)root.clearTimeout(timer); }
  }
  async function rpc(method,params) {
    var j=await json(CHAIN.rpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:method,params:params})});
    if(j.error||!Object.prototype.hasOwnProperty.call(j,'result'))throw fail('链上查询失败，请重试','Chain query failed, retry','RPC_ERROR');
    return j.result;
  }
  async function call(to,data) { var r=await rpc('eth_call',[{to:addr(to),data:'0x'+data.replace(/^0x/,'')},'latest']); if(typeof r!=='string'||!/^0x(?:[0-9a-fA-F]{64})+$/.test(r))throw fail('链上数据不完整','Incomplete chain response','RPC_DATA'); return r.slice(2); }
  async function uintCall(to,data) { return BigInt('0x'+(await call(to,data)).slice(0,64)); }
  async function account() { var eth=root.ethereum; if(!eth||!eth.request)return null; var a=await eth.request({method:'eth_accounts'}); return a&&a[0]?addr(a[0]):null; }
  async function ensureChain() {
    var eth=root.ethereum; if(!eth||!eth.request)throw fail('请在 OKX / TP 等钱包浏览器打开','Open in an OKX / TP wallet browser','NO_WALLET');
    var cid=await eth.request({method:'eth_chainId'});
    if(Number(cid)!==CHAIN.id){
      try { await eth.request({method:'wallet_switchEthereumChain',params:[{chainId:CHAIN.hex}]}); }
      catch(e){ if(e.code!==4902)throw e; await eth.request({method:'wallet_addEthereumChain',params:[{chainId:CHAIN.hex,chainName:CHAIN.name,rpcUrls:[CHAIN.rpc],nativeCurrency:{name:'DAI',symbol:'DAI',decimals:18},blockExplorerUrls:[CHAIN.explorer]}]}); }
      cid=await eth.request({method:'eth_chainId'});
    }
    if(Number(cid)!==CHAIN.id)throw fail('请切换到 Anubis 网络后重试','Switch to Anubis and retry','WRONG_CHAIN');
  }
  async function connect() {
    if(!root.ethereum)throw fail('请在 OKX / TP 等钱包浏览器打开','Open in an OKX / TP wallet browser','NO_WALLET');
    await root.ethereum.request({method:'eth_requestAccounts'}); await ensureChain();
    var a=await account(); if(!a)throw fail('钱包未连接','Wallet not connected'); emit('wallet',{address:a}); return a;
  }
  async function profile(a,force) {
    a=addr(a); var cached=profileCache[a]; if(!force&&cached&&Date.now()-cached.at<10000)return cached.value;
    var j=await json(API+'/me?addr='+encodeURIComponent(a));
    if(!j.addr||addr(j.addr)!==a||!Object.prototype.hasOwnProperty.call(j,'referrer'))throw fail('邀请关系查询失败','Referral lookup failed','PROFILE_DATA');
    if(j.referrer)j.referrer=addr(j.referrer);
    ['directCount','indirectCount'].forEach(function(k){if(!Number.isSafeInteger(j[k])||j[k]<0)throw fail('邀请统计返回无效','Invalid referral statistics','PROFILE_DATA');});
    ['earned','claimed','claimable','tokens'].forEach(function(k){if(!j[k]||typeof j[k]!=='object'||Array.isArray(j[k]))throw fail('返佣数据不完整','Incomplete reward data','PROFILE_DATA');});
    ['earned','claimed','claimable'].forEach(function(k){Object.keys(j[k]).forEach(function(t){addr(t);if(!/^\d+$/.test(String(j[k][t])))throw fail('返佣金额无效','Invalid reward amount','PROFILE_DATA');});});
    Object.keys(j.tokens).forEach(function(k){addr(k);var m=j.tokens[k];if(!m||typeof m.sym!=='string'||m.sym.length>24||!Number.isInteger(m.dec)||m.dec<0||m.dec>36)throw fail('币种数据无效','Invalid token metadata','PROFILE_DATA');});
    ['earned','claimed','claimable'].forEach(function(k){Object.keys(j[k]).forEach(function(t){if(!j.tokens[t])throw fail('返佣币种资料缺失','Missing reward token metadata','PROFILE_DATA');});});
    if(j.invitees!=null&&(!Array.isArray(j.invitees)||j.invitees.some(function(v){return !v||typeof v.addr!=='string'||!/^0x[0-9a-fA-F]{40}$/.test(v.addr)||!v.earnedFromThem||typeof v.earnedFromThem!=='object'||Object.keys(v.earnedFromThem).some(function(t){return !j.tokens[t]||!/^\d+$/.test(String(v.earnedFromThem[t]));});})))throw fail('邀请明细数据无效','Invalid invitee details','PROFILE_DATA');
    profileCache[a]={at:Date.now(),value:j}; return j;
  }
  async function requireReferral(a) { var p=await profile(a,true); if(!p.referrer||p.referrer===addr(a)){emit('binding-required',{address:addr(a)});throw fail('请先确认邀请关系，再参与游戏','Complete your invitation before playing','BIND_REQUIRED');}return p.referrer; }
  function setCandidate(a,code) { candidate={address:addr(a),code:code||null}; emit('candidate',candidate); return candidate; }
  function getCandidate() { return candidate; }
  async function resolve(code) { code=String(code||'').trim().toUpperCase(); if(!/^[A-Z0-9]{6}$/.test(code))throw fail('请输入 6 位推荐码','Enter a 6-character code','BAD_CODE'); var j=await json(API+'/resolve?code='+encodeURIComponent(code)); if(!j.addr)throw fail('推荐码不存在','Code not found','BAD_CODE'); return setCandidate(j.addr,code); }
  async function bind(a) {
    a=addr(a); var chosen=candidate&&candidate.address; if(!chosen)throw fail('请先选择邀请人','Choose an inviter first');
    if(chosen===a)throw fail('不能绑定自己','You cannot invite yourself');
    var existing=await profile(a,true); if(existing.referrer)return existing;
    var old=await legacyReferrers(a);if(old.some(function(r){return r.referrer&&r.referrer!==chosen;}))throw fail('旧彩票邀请关系与所选邀请人冲突，请先处理迁移','Your V3 inviter conflicts with this choice; resolve migration first','LEGACY_CONFLICT');
    await ensureChain(); if(await account()!==a)throw fail('钱包已切换，请重新确认','Wallet changed; confirm again','ACCOUNT_CHANGED');
    // 保持现有服务的签名协议；服务端 nonce/时效升级见 docs/backend-integration.md。
    var message='ANUBIS PLAY invite: bind '+a+' -> '+chosen;
    var sig=await root.ethereum.request({method:'personal_sign',params:[message,a]});
    if(await account()!==a)throw fail('钱包已切换，请重新确认','Wallet changed; confirm again','ACCOUNT_CHANGED');
    if(!candidate||candidate.address!==chosen)throw fail('邀请人已改变，请重新确认','Inviter changed; confirm again','CANDIDATE_CHANGED');
    var result=await json(API+'/bind',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invitee:a,inviter:chosen,sig:sig})});
    if(!result.ok&&!result.already)throw fail('绑定失败，请重试','Binding failed, retry','BIND_FAILED');
    var verified=await profile(a,true); if(verified.referrer!==chosen)throw fail('邀请关系未确认，请重新查询','Invitation not confirmed; refresh','BIND_CONFLICT');
    candidate=null; emit('bound',{address:a,profile:verified}); return verified;
  }
  async function lotteryReferrer(pool,a) { var r=await call(pool,'2cf003c2'+encA(a));var v='0x'+r.slice(-40);return v===ZERO?null:addr(v); }
  async function legacyReferrers(a){return Promise.all(TOKENS.map(async function(t){return {sym:t.sym,referrer:await lotteryReferrer(t.lottery,a)};}));}
  async function purchaseReferrer(pool,a) { var canonical=await requireReferral(a),legacy=await lotteryReferrer(pool,a);if(legacy&&legacy!==canonical)throw fail('该奖池已有不同邀请关系，请先处理关系冲突','This pool has a different inviter; resolve it before buying','REFERRAL_CONFLICT');return canonical; }
  async function logs(contract,topic,from,filters) {
    contract=addr(contract);var latest=Number(BigInt(await rpc('eth_blockNumber',[])));
    async function range(lo,hi,depth){
      var q=new URLSearchParams({module:'logs',action:'getLogs',fromBlock:String(lo),toBlock:String(hi),address:contract,topic0:topic});
      Object.keys(filters||{}).forEach(function(k){q.set(k,filters[k]);});
      var j=await json(CHAIN.explorer+'/api?'+q.toString());
      if(!Array.isArray(j.result)||j.status!=='1'&&!(j.status==='0'&&j.result.length===0&&/no (?:logs|records)/i.test(j.message||'')))throw fail('历史记录暂不可用，请重试','History unavailable, retry','INDEXER_ERROR');
      if(j.result.length>=1000){if(depth>24||lo>=hi)throw fail('历史数据过多，请分段查询','Too much history; narrow the range');var mid=Math.floor((lo+hi)/2);var parts=await Promise.all([range(lo,mid,depth+1),range(mid+1,hi,depth+1)]);return parts[0].concat(parts[1]);}
      return j.result;
    }
    var all=await range(Number(from),latest,0),seen=new Set();
    return all.filter(function(l){if(!l.address||l.address.toLowerCase()!==contract||!Array.isArray(l.topics)||!l.topics.length||l.topics[0].toLowerCase()!==topic.toLowerCase()||!l.topics.every(function(t){return /^0x[0-9a-fA-F]{64}$/.test(t);})||!/^0x[0-9a-fA-F]{64}$/.test(l.transactionHash)||!/^0x[0-9a-fA-F]+$/.test(l.blockNumber)||!/^0x[0-9a-fA-F]+$/.test(l.logIndex)||!/^0x[0-9a-fA-F]*$/.test(l.data))throw fail('历史记录校验失败','History validation failed');var k=l.transactionHash+':'+l.logIndex;if(seen.has(k))return false;seen.add(k);return true;});
  }
  function winners(data){
    var d=String(data).replace(/^0x/,'');if(!/^[0-9a-fA-F]+$/.test(d)||d.length<128)throw fail('开奖记录不完整','Incomplete draw record');
    function list(word,address){var off=Number(BigInt('0x'+d.slice(word*64,(word+1)*64)))*2;if(off%64||off+64>d.length)throw fail('开奖记录偏移无效','Invalid draw record');var len=Number(BigInt('0x'+d.slice(off,off+64)));if(len>10000||off+64+len*64>d.length)throw fail('开奖记录长度无效','Invalid draw record');return Array.from({length:len},function(_,i){var w=d.slice(off+64*(i+1),off+64*(i+2));return address?'0x'+w.slice(-40).toLowerCase():BigInt('0x'+w);});}
    var ws=list(0,true),amts=list(1,false);if(ws.length!==amts.length)throw fail('开奖金额数量不符','Draw amount count mismatch');return ws.map(function(a,i){return {address:a,amount:amts[i]};});
  }
  async function lotteryLedger(t,a,from){
    a=addr(a);var ticketTopic='0xc8c5c2b0e44fb6312c0098ec42642058527713d0a1d29a5c6ccbfe34d714d41e',winTopic='0xab9af1684355064aa9258894f5c85b041fd7a83e4fe0eb02e607c13d8cb627b4';
    var transferTopic='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    var rows=await Promise.all([logs(t.lottery,ticketTopic,from,{topic2:'0x'+encA(a),topic0_2_opr:'and'}),logs(t.lottery,winTopic,from),logs(t.token,transferTopic,from,{topic1:'0x'+encA(a),topic2:'0x'+encA(t.lottery),topic0_1_opr:'and',topic1_2_opr:'and',topic0_2_opr:'and'})]);
    var buys=rows[0].filter(function(l){return l.topics[2]&&('0x'+l.topics[2].slice(-40)).toLowerCase()===a;}),paid={},won=0n,wins=0,tickets=0n;
    rows[2].forEach(function(l){if(('0x'+l.topics[1].slice(-40)).toLowerCase()===a&&('0x'+l.topics[2].slice(-40)).toLowerCase()===t.lottery.toLowerCase())paid[l.transactionHash]=(paid[l.transactionHash]||0n)+BigInt(l.data);});
    rows[1].forEach(function(l){winners(l.data).forEach(function(w){if(w.address===a){won+=w.amount;if(w.amount>0n)wins++;}});});
    var hashes=new Set();buys.forEach(function(l){tickets+=BigInt('0x'+l.data.replace(/^0x/,'').slice(0,64));hashes.add(l.transactionHash);});
    var complete=Array.from(hashes).every(function(h){return Object.prototype.hasOwnProperty.call(paid,h);});
    var spent=complete?Array.from(hashes).reduce(function(s,h){return s+paid[h];},0n):null;
    return {tickets:tickets,spent:spent,won:won,wins:wins,purchases:buys.map(function(l){return {hash:l.transactionHash,count:BigInt('0x'+l.data.replace(/^0x/,'').slice(0,64)).toString(),paid:paid[l.transactionHash]==null?null:paid[l.transactionHash].toString(),block:Number(BigInt(l.blockNumber))};})};
  }
  function transactions(a) { var rows=read(scope('transactions',a),[]);return Array.isArray(rows)?rows.filter(function(t){return t&&/^0x[0-9a-fA-F]{64}$/.test(t.hash)&&typeof t.to==='string'&&/^0x[0-9a-fA-F]{40}$/.test(t.to);}):[]; }
  function recordTx(a,tx) { var list=transactions(a).filter(function(t){return t.hash!==tx.hash;});list.unshift(Object.assign({at:Date.now()},tx));write(scope('transactions',a),list.slice(0,100));emit('transaction',tx); }
  async function refreshTransaction(a,entry) {
    // 固定查询 Anubis RPC；钱包切到其他网络也不会把另一条链的回执当作到账。
    var rc=await rpc('eth_getTransactionReceipt',[entry.hash]);
    if(!rc||!rc.blockNumber||!['0x0','0x1'].includes(rc.status))return null;
    if(rc.transactionHash&&rc.transactionHash.toLowerCase()!==entry.hash.toLowerCase())throw fail('交易回执不匹配','Transaction receipt mismatch');
    entry.status=rc.status==='0x1'?'confirmed':'failed';recordTx(a,entry);emit('refresh',{address:addr(a)});return rc;
  }
  async function refreshTransactions(a) {
    var rows=transactions(a).filter(function(t){return t.status==='pending';}).slice(0,20);
    await Promise.all(rows.map(function(t){return refreshTransaction(a,t);}));return transactions(a);
  }
  async function send(a,to,data,label) {
    a=addr(a);to=addr(to);if(!/^0x[0-9a-fA-F]*$/.test(data))throw fail('交易数据无效','Invalid transaction data');
    var key=a+':'+to+':'+data.toLowerCase();
    if(sendLocks.has(key))throw fail('此操作正在等待确认，请勿重复提交','This action is awaiting confirmation; do not resubmit','TX_PENDING');
    sendLocks.add(key);
    try {
    var prior=transactions(a).find(function(t){return t.status==='pending'&&t.to.toLowerCase()===to&&t.data===data.toLowerCase();});
    if(prior){var priorReceipt;try{priorReceipt=await refreshTransaction(a,prior);}catch(_){}if(prior.status==='pending'){var pendingError=fail('已有同一操作待确认，请到个人中心核对','The same action is pending; check your account','TX_PENDING');pendingError.hash=prior.hash;throw pendingError;}if(prior.status==='failed')throw fail('上次交易已回退，请核对详情后再次操作','The previous transaction reverted; review it before retrying','TX_REVERTED');return priorReceipt;}
    await ensureChain();if(await account()!==a)throw fail('钱包已切换，请重新操作','Wallet changed; try again','ACCOUNT_CHANGED');
    var eth=root.ethereum,tx={from:a,to:to,data:data,type:'0x0'};tx.gasPrice=await eth.request({method:'eth_gasPrice',params:[]});
    if(Number(await eth.request({method:'eth_chainId'}))!==CHAIN.id||await account()!==a)throw fail('网络或钱包已切换，请重新确认','Network or wallet changed; confirm again','ACCOUNT_CHANGED');
    var hash=await eth.request({method:'eth_sendTransaction',params:[tx]});
    if(!/^0x[0-9a-fA-F]{64}$/.test(hash))throw fail('交易哈希无效','Invalid transaction hash');
    var entry={hash:hash,to:to,data:data.toLowerCase(),label:label||L('交易','Transaction'),status:'pending'};recordTx(a,entry);
    for(var i=0;i<120;i++){
      await new Promise(function(resolve){root.setTimeout(resolve,2000);});
      var rc;try{rc=await refreshTransaction(a,entry);}catch(_){continue;}
      if(rc){if(entry.status==='failed')throw fail('交易已回退，请查看交易详情','Transaction reverted; view details','TX_REVERTED');return rc;}
    }
    var e=fail('交易仍待确认，请在个人中心查看，不要重复提交','Transaction pending; check your account before retrying','TX_PENDING');e.hash=hash;throw e;
    } finally { sendLocks.delete(key); }
  }
  async function authorize(t,a,amount) {
    amount=BigInt(amount);if(amount<=0n||amount>=2n**255n)throw fail('请设置有限的代币额度','Choose a finite token allowance');
    await ensureChain();
    var al=await uintCall(t.token,'dd62ed3e'+encA(a)+encA(t.contract));
    if(al<amount)await send(a,t.token,'0x095ea7b3'+encA(t.contract)+enc(amount),L('代币授权','Token allowance'));
    var d=await call(t.contract,'8d22ea2a'+encA(a));
    if(('0x'+d.slice(-40)).toLowerCase()!==addr(t.delegate))await send(a,t.contract,'0xb6a5d7de'+encA(t.delegate),L('代发授权','Delegate authorization'));
    var check=await Promise.all([uintCall(t.token,'dd62ed3e'+encA(a)+encA(t.contract)),call(t.contract,'8d22ea2a'+encA(a))]);
    if(check[0]<amount||('0x'+check[1].slice(-40)).toLowerCase()!==addr(t.delegate))throw fail('授权尚未完成，请重试','Authorization incomplete; retry');return true;
  }
  function results(a) { var rows=read(scope('results',a),[]);return Array.isArray(rows)?rows.filter(function(r){return r&&r.address===addr(a)&&r.chainId===CHAIN.id&&TOKENS.some(function(t){return t.game===r.contract&&t.sym===r.sym;});}):[]; }
  function saveResult(a,row) { a=addr(a);var item=Object.assign({},row,{address:a,chainId:CHAIN.id});item.contract=addr(item.contract);var rows=results(a).filter(function(r){return !(r.contract===item.contract&&String(r.hand)===String(item.hand));});rows.unshift(item);write(scope('results',a),rows.slice(0,200));return rows; }
  function activeKey(a) { return scope('activeHand',a); }
  var AP={ZERO:ZERO,CHAIN:CHAIN,API:API,TOKENS:TOKENS,L:L,fail:fail,addr:addr,enc:enc,encA:encA,esc:esc,short:short,format:format,parseAmount:parseAmount,json:json,rpc:rpc,call:call,uintCall:uintCall,account:account,ensureChain:ensureChain,connect:connect,profile:profile,requireReferral:requireReferral,setCandidate:setCandidate,getCandidate:getCandidate,resolve:resolve,bind:bind,lotteryReferrer:lotteryReferrer,legacyReferrers:legacyReferrers,purchaseReferrer:purchaseReferrer,logs:logs,winners:winners,lotteryLedger:lotteryLedger,send:send,authorize:authorize,scope:scope,read:read,write:write,results:results,saveResult:saveResult,transactions:transactions,recordTx:recordTx,refreshTransactions:refreshTransactions,activeKey:activeKey,emit:emit,epoch:function(){return walletEpoch;}};
  if(root.ethereum&&root.ethereum.on){root.ethereum.on('accountsChanged',function(){walletEpoch++;profileCache={};emit('wallet-change',{});});root.ethereum.on('chainChanged',function(){walletEpoch++;profileCache={};emit('wallet-change',{});});}
  root.APPlatform=AP;if(typeof module==='object'&&module.exports)module.exports=AP;
})(typeof window!=='undefined'?window:globalThis);
