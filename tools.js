/* ============================================================
   起源学习站 · 链上法器（全部站内完成，不跳转外链）
   依赖：index.html 里的 #modal / #modalBody / #modalTitle 弹窗
   ============================================================ */
(function(){
  const RPCS=["https://1rpc.io/matic","https://polygon-bor-rpc.publicnode.com","https://polygon.drpc.org","https://polygon-rpc.com"];
  const LGNS="0xeB51D9A39AD5EEF215dC0Bf39a8821ff804A0F01";
  const SLGNS="0x99a57E6C8558BC6689f894e068733ADf83C19725";
  const DAI="0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
  const POOL="0x882df4B0fB50a229C3B4124EB18c759911485bFb";
  const SWAP_TOPIC="0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822";

  // —— 基础工具 ——
  async function rpc(method,params){
    for(const url of RPCS){
      try{
        const r=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})});
        const j=await r.json(); if(j&&j.result!==undefined&&j.result!==null) return j.result;
      }catch(e){}
    }
    return null;
  }
  const pad=a=>a.replace(/^0x/,"").toLowerCase().padStart(64,"0");
  async function balanceOf(token,addr){
    const r=await rpc("eth_call",[{to:token,data:"0x70a08231"+pad(addr)},"latest"]); return r?BigInt(r):null;
  }
  const fmt=(x,d=2)=>(isFinite(x)?x:0).toLocaleString("zh-CN",{maximumFractionDigits:d});
  const short=a=>a.slice(0,6)+"…"+a.slice(-4);
  const isAddr=a=>/^0x[0-9a-fA-F]{40}$/.test((a||"").trim());
  // 复制：安全上下文用 clipboard，否则(http/file)用 execCommand 兜底
  function copyText(t){
    // execCommand 在点击手势同步栈内最稳(桌面/手机/http/https/file 都支持),优先用;失败再试 clipboard
    let ok=false;
    try{
      const ta=document.createElement("textarea"); ta.value=t; ta.setAttribute("readonly","");
      ta.style.position="fixed"; ta.style.left="0"; ta.style.top="0"; ta.style.width="1px"; ta.style.height="1px"; ta.style.opacity="0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      try{ta.setSelectionRange(0,t.length);}catch(e){}
      ok=document.execCommand("copy");
      document.body.removeChild(ta);
    }catch(e){ ok=false; }
    if(!ok&&navigator.clipboard){ try{ navigator.clipboard.writeText(t); ok=true; }catch(e){} }
    return ok;
  }

  // 打开弹窗
  function M(title,html){
    const mask=document.getElementById("modal");
    document.getElementById("modalTitle").textContent=title;
    document.getElementById("modalBody").innerHTML=html;
    mask.classList.add("show");
    return document.getElementById("modalBody");
  }

  /* ========== 1) 区块浏览器 · 站内地址查询 ========== */
  window.openBrowser=function(){
    const b=M("链上地址查询",`
      <div class="calc">
        <div class="calc-row" style="grid-template-columns:1fr">
          <label>输入 Polygon 地址（钱包或合约）
            <input id="qAddr" type="text" placeholder="0x… 粘贴一个地址" spellcheck="false"></label>
        </div>
        <button class="claim2" id="qGo">查 询</button>
        <div class="calc-out" id="qOut" style="margin-top:14px;display:none"></div>
        <p class="calc-note">直接读 Polygon 链上数据（公共节点）——原生 POL、LGNS、质押量(sLGNS)、DAI 余额，以及它是不是合约。不跳转、不连钱包。</p>
      </div>`);
    const out=b.querySelector("#qOut");
    async function go(){
      const a=b.querySelector("#qAddr").value.trim();
      if(!isAddr(a)){out.style.display="block";out.innerHTML='<div class="cstat"><span style="color:#e0705f">地址格式不对，应是 0x 开头 42 位</span></div>';return;}
      out.style.display="block";out.innerHTML='<div class="cstat"><span>正在读取链上…</span></div>';
      const [nativeHex,lg,sl,dai,code]=await Promise.all([
        rpc("eth_getBalance",[a,"latest"]), balanceOf(LGNS,a), balanceOf(SLGNS,a), balanceOf(DAI,a),
        rpc("eth_getCode",[a,"latest"])
      ]);
      const pol=nativeHex?Number(BigInt(nativeHex))/1e18:0;
      const isC=code&&code!=="0x"&&code.length>2;
      out.innerHTML=
        `<div class="cstat"><span>类型</span><b>${isC?"合约地址":"普通钱包(EOA)"}</b></div>`+
        `<div class="cstat"><span>原生 POL</span><b>${fmt(pol,4)} <i>POL</i></b></div>`+
        `<div class="cstat"><span>LGNS</span><b>${lg!=null?fmt(Number(lg)/1e9,4):"—"} <i>LGNS</i></b></div>`+
        `<div class="cstat"><span>质押量 sLGNS</span><b class="up">${sl!=null?fmt(Number(sl)/1e9,4):"—"} <i>sLGNS</i></b></div>`+
        `<div class="cstat"><span>DAI</span><b>${dai!=null?fmt(Number(dai)/1e18,2):"—"} <i>DAI</i></b></div>`;
    }
    b.querySelector("#qGo").onclick=go;
    b.querySelector("#qAddr").addEventListener("keydown",e=>{if(e.key==="Enter")go();});
  };

  /* ========== 2) 代币安全自查 · 站内 GoPlus 检测 ========== */
  window.openSecurity=function(){
    const b=M("代币安全自查",`
      <div class="calc">
        <div class="calc-row" style="grid-template-columns:1fr">
          <label>输入代币合约地址（Polygon）
            <input id="sAddr" type="text" value="${LGNS}" spellcheck="false"></label>
        </div>
        <button class="claim2" id="sGo">检 测</button>
        <div class="calc-out" id="sOut" style="margin-top:14px;display:none"></div>
        <p class="calc-note">用 GoPlus 安全接口检测：能不能卖、买卖税、是否貔貅、能否增发、是否可暂停、有无黑名单、是否有 owner。默认填的是 LGNS，可换任意代币。</p>
      </div>`);
    const out=b.querySelector("#sOut");
    const yn=(v,goodIs0=true)=>{const bad=goodIs0?v==="1":v!=="1";return `<b style="color:${bad?'#e0705f':'#8fbf78'}">${v==="1"?"是":"否"}</b>`;};
    async function go(){
      const a=b.querySelector("#sAddr").value.trim();
      if(!isAddr(a)){out.style.display="block";out.innerHTML='<div class="cstat"><span style="color:#e0705f">地址格式不对</span></div>';return;}
      out.style.display="block";out.innerHTML='<div class="cstat"><span>正在检测…</span></div>';
      try{
        const d=await fetch(`https://api.gopluslabs.io/api/v1/token_security/137?contract_addresses=${a}`).then(r=>r.json());
        const r=d.result&&d.result[a.toLowerCase()];
        if(!r){out.innerHTML='<div class="cstat"><span>没查到这个代币的数据（可能不在 Polygon 或未收录）</span></div>';return;}
        out.innerHTML=
          `<div class="cstat"><span>代币</span><b>${r.token_name||"?"} (${r.token_symbol||"?"})</b></div>`+
          `<div class="cstat"><span>是否貔貅(不能卖)</span>${yn(r.is_honeypot)}</div>`+
          `<div class="cstat"><span>买入税 / 卖出税</span><b>${(r.buy_tax*100||0).toFixed(1)}% / ${(r.sell_tax*100||0).toFixed(1)}%</b></div>`+
          `<div class="cstat"><span>可增发</span>${yn(r.is_mintable)}</div>`+
          `<div class="cstat"><span>可暂停转账</span>${yn(r.transfer_pausable)}</div>`+
          `<div class="cstat"><span>有黑名单</span>${yn(r.is_blacklisted)}</div>`+
          `<div class="cstat"><span>源码开源</span><b style="color:${r.is_open_source==='1'?'#8fbf78':'#e0705f'}">${r.is_open_source==='1'?'是':'否'}</b></div>`+
          `<div class="cstat"><span>owner</span><b>${r.owner_address&&r.owner_address!=="0x0000000000000000000000000000000000000000"?short(r.owner_address):"无/已弃权"}</b></div>`+
          `<div class="cstat"><span>持币地址数</span><b>${r.holder_count?fmt(+r.holder_count,0):"—"}</b></div>`;
      }catch(e){out.innerHTML='<div class="cstat"><span style="color:#e0705f">检测失败，稍后再试</span></div>';}
    }
    b.querySelector("#sGo").onclick=go;
    b.querySelector("#sAddr").addEventListener("keydown",e=>{if(e.key==="Enter")go();});
    go();
  };

  /* ========== 3) 链上数据面板 · 官方 ocros 实时指标 ========== */
  window.openDashboard=async function(){
    const b=M("链上数据面板",`<div class="calc"><div class="calc-out" id="dOut"><div class="cstat"><span>正在读取官方链上数据…</span></div></div>
      <p class="calc-note">数据来自起源官方后台 (apiv2.ocros.io)，实时读取，指标含义以官方为准。</p></div>`);
    const out=b.querySelector("#dOut");
    try{
      const [dash,met]=await Promise.all([
        fetch("https://apiv2.ocros.io/api/v1/dashboard").then(r=>r.json()),
        fetch("https://apiv2.ocros.io/api/v1/metricsv2").then(r=>r.json())
      ]);
      const d=Array.isArray(dash)?dash[0]:dash; const m=Array.isArray(met)?met[0]:met;
      const staked=(+d.totalSupply)*(+d.stakeRate)/100;
      const $=(n)=>"$"+fmt(+n,0);
      out.innerHTML=
        `<div class="cstat"><span>LGNS 价格</span><b class="up">${fmt(+d.price,4)} <i>DAI</i></b></div>`+
        `<div class="cstat"><span>总供应量</span><b>${fmt(+d.totalSupply,0)} <i>LGNS</i></b></div>`+
        `<div class="cstat"><span>质押率</span><b>${fmt(+d.stakeRate,2)}% <i>(约 ${fmt(staked,0)} 枚)</i></b></div>`+
        `<div class="cstat"><span>库存市场价值</span><b>${$(d.treasuryMarketValue)}</b></div>`+
        `<div class="cstat"><span>无风险价值</span><b>${$(d.treasuryRiskFreeValue)}</b></div>`+
        `<div class="cstat"><span>LP 池价值</span><b>${$(d.lpValue)}</b></div>`+
        `<div class="cstat"><span>累计销毁</span><b>${fmt(+d.totalBurn,0)} <i>LGNS</i></b></div>`+
        `<div class="cstat"><span>A 稳定币供应</span><b>${fmt(+d.asupply,0)} <i>A</i></b></div>`+
        (m&&m.runwayCurrent?`<div class="cstat"><span>可运行周期(runway)</span><b>${fmt(+m.runwayCurrent,1)} <i>天</i></b></div>`:"");
    }catch(e){out.innerHTML='<div class="cstat"><span style="color:#e0705f">官方接口暂时读不到，稍后再试</span></div>';}
  };

  /* ========== 4) 大额成交监测 · 读主池 Swap 事件 ========== */
  window.openWhale=async function(){
    const b=M("大额成交监测",`<div class="calc">
      <div class="calc-out" id="wOut"><div class="cstat"><span>正在扫描主池最近成交…</span></div></div>
      <p class="calc-note">直接读 LGNS/DAI 主池最近的链上成交，筛出折合 ≥ 1 万 DAI 的大单、最多列 10 条。买=有人拿 DAI 买 LGNS，卖=有人把 LGNS 换回 DAI。钱包=该笔的收币地址，可复制。</p></div>`);
    const out=b.querySelector("#wOut");
    const TH=10000;
    function decode(logs,rows){
      for(const lg of logs){
        const d=lg.data.replace(/^0x/,"");
        const u=i=>BigInt("0x"+d.slice(i*64,i*64+64));
        const a0In=u(0),a1In=u(1),a0Out=u(2),a1Out=u(3);
        let side,dai,lgns;
        if(a0In>0n){side="买入";dai=Number(a0In)/1e18;lgns=Number(a1Out)/1e9;}
        else{side="卖出";dai=Number(a0Out)/1e18;lgns=Number(a1In)/1e9;}
        const to=(lg.topics&&lg.topics[2])?"0x"+lg.topics[2].slice(-40):"";
        if(dai>=TH) rows.push({side,dai,lgns,px:lgns>0?dai/lgns:0,blk:parseInt(lg.blockNumber,16),li:lg.logIndex?parseInt(lg.logIndex,16):0,addr:to});
      }
    }
    async function segLogs(from,to){
      try{
        const r=await fetch("https://polygon.gateway.tenderly.co",{method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify({jsonrpc:"2.0",id:1,method:"eth_getLogs",params:[{address:POOL,topics:[SWAP_TOPIC],fromBlock:from,toBlock:to}]})});
        const j=await r.json(); return Array.isArray(j.result)?j.result:null;
      }catch(e){ return null; }
    }
    try{
      const bnHex=await rpc("eth_blockNumber",[]);
      if(!bnHex){out.innerHTML='<div class="cstat"><span>节点暂时忙，稍后再试</span></div>';return;}
      let hi=parseInt(bnHex,16); const rows=[]; let anyOk=false;
      // 分段(每段2500块,段不重叠)从最新往回累积,直到攒够10条大单或最多扫5段
      for(let seg=0; seg<5 && rows.length<10; seg++){
        const lo=Math.max(0,hi-2500);
        const logs=await segLogs("0x"+lo.toString(16),"0x"+hi.toString(16));
        if(logs){ anyOk=true; decode(logs,rows); }
        hi=lo-1; if(lo===0) break;
      }
      if(!anyOk){out.innerHTML='<div class="cstat"><span>节点暂时忙，稍后再试</span></div>';return;}
      if(!rows.length){out.innerHTML='<div class="cstat"><span>最近这段时间没有 ≥ 1 万 DAI 的大单（行情平淡时大单本就少）</span></div>';return;}
      rows.sort((x,y)=> (y.blk-x.blk) || (y.li-x.li));
      out.innerHTML=rows.slice(0,10).map(r=>
        `<div style="border-bottom:1px solid var(--line);padding-bottom:8px">
          <div class="cstat"><span><b style="color:${r.side==='买入'?'#8fbf78':'#e0705f'}">${r.side}</b> ${fmt(r.lgns,0)} LGNS</span><b>${fmt(r.dai,0)} <i>DAI @ ${fmt(r.px,3)}</i></b></div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:3px;font-size:12px;color:var(--muted)">钱包 <code style="font-family:var(--mono);color:var(--soft)">${r.addr?short(r.addr):'—'}</code>${r.addr?`<button class="wcopy" data-a="${r.addr}" style="font:inherit;font-size:11px;cursor:pointer;background:transparent;border:1px solid var(--line);color:var(--soft);border-radius:5px;padding:2px 8px">复制</button>`:''}</div>
        </div>`
      ).join("");
      out.querySelectorAll(".wcopy").forEach(btn=>btn.onclick=()=>{copyText(btn.dataset.a);btn.textContent="已复制";setTimeout(()=>btn.textContent="复制",1000);});
    }catch(e){out.innerHTML='<div class="cstat"><span style="color:#e0705f">扫描失败，稍后再试</span></div>';}
  };

  /* ========== 5) 交易教程 · 站内图文 ========== */
  window.openTutorial=function(){
    M("交易教程 · 买卖生态代币",`<div class="article-body">
      <p><b>第一次买卖生态代币，跟着这几步走：</b></p>
      <p><b>1. 准备钱包</b>：装一个自托管钱包（如 MetaMask / OKX Wallet），<b>助记词离线抄好、绝不外泄</b>。切到 Polygon 网络。</p>
      <p><b>2. 备好 DAI 和一点 POL</b>：DAI 用来买币，POL 用来付手续费(gas)。</p>
      <p><b>3. 打开交易工具</b>：在 Ave.ai 等去中心化行情/交易工具里搜代币合约地址，<b>务必核对地址无误</b>再操作。</p>
      <p><b>4. 授权 + 兑换</b>：第一次交易要先"授权(approve)"，再"兑换(swap)"。注意滑点设置，小额先试。</p>
      <p><b>5. 卖出</b>：反向操作，把代币换回 DAI。留意<b>卖出税</b>（生态代币卖出通常有 5% 税）。</p>
      <p style="color:#b79c74">⚠️ 安全提醒：只在官方公告给的入口操作；任何人问你要助记词/私钥都是骗子；先小额跑通再加量。安卓和 iOS 操作类似，界面略有不同。</p>
    </div>`);
  };

  /* ========== 6) 官方账号 · 站内展示 ========== */
  window.openOfficial=function(){
    const accs=[
      ["@SaluteOrigin","主官方号 · Origin/Awake/LGNS 正式公告都从这发"],
      ["@ANUBISCHAIN_","Anubis 公链官方 · anubischain.ai"],
      ["@Anubi_sab","Anubi 基金会 · 研究/货币设计口径"],
      ["@Anubis_Labs","Anubis Labs · 生态孵化器"],
    ];
    const b=M("官方账号 · 认准别认假",`<div class="calc">
      <div class="calc-out" style="gap:14px">
        ${accs.map(a=>`<div class="cstat"><span><b style="color:#e9c46a">${a[0]}</b><br><i style="color:#b79c74;font-size:12px">${a[1]}</i></span>
          <button class="copy2" data-h="${a[0]}">复制</button></div>`).join("")}
      </div>
      <p class="calc-note">这 4 个是官方 X 账号（老板核实过）。⚠️ 真官方<b>绝不会私信</b>找你要助记词或让你转币；名字差一两个字母的都是假冒号。复制账号名去 X 上自己搜、认准蓝V。</p>
    </div>`);
    b.querySelectorAll(".copy2").forEach(btn=>btn.onclick=()=>{
      copyText(btn.dataset.h);btn.textContent="已复制";setTimeout(()=>btn.textContent="复制",1200);
    });
  };

  /* ========== 7) 质押助手 · 站内质押数据面板 ========== */
  window.openStaking=async function(){
    const b=M("质押数据面板",`<div class="calc">
      <div class="calc-out" id="stkOut"><div class="cstat"><span>正在读取质押数据…</span></div></div>
      <p class="calc-note">这里实时显示全网质押情况。真正发起质押需要在官方 DApp 里连接钱包完成（本站不代管资产、不连钱包）——先看懂数据，再去官方操作。想估算收益用上面的"收益计算器"。</p></div>`);
    const out=b.querySelector("#stkOut");
    try{
      const dash=await fetch("https://apiv2.ocros.io/api/v1/dashboard").then(r=>r.json());
      const d=Array.isArray(dash)?dash[0]:dash;
      const staked=(+d.totalSupply)*(+d.stakeRate)/100;
      // 用链上 epoch 估算 APY
      const ep=await rpc("eth_call",[{to:"0x1964Ca90474b11FFD08af387b110ba6C96251Bfc",data:"0x900cf0cf"},"latest"]);
      let apy=null;
      if(ep){const dist=Number(BigInt("0x"+ep.replace(/^0x/,"").slice(192,256)))/1e9;
        if(staked>0){const s=dist/staked; apy=(Math.pow(1+s,1461)-1)*100;}}
      out.innerHTML=
        `<div class="cstat"><span>全网质押量</span><b class="up">${fmt(staked,0)} <i>LGNS</i></b></div>`+
        `<div class="cstat"><span>质押率</span><b>${fmt(+d.stakeRate,2)}%</b></div>`+
        (apy?`<div class="cstat"><span>当前年化 APY</span><b>${fmt(apy,0)}% <i>(每6h复利)</i></b></div>`:"")+
        `<div class="cstat"><span>LGNS 现价</span><b>${fmt(+d.price,4)} <i>DAI</i></b></div>`+
        `<div class="cstat"><span>静默期(warmup)</span><b>2 个周期 <i>(约十几小时)</i></b></div>`;
    }catch(e){out.innerHTML='<div class="cstat"><span style="color:#e0705f">数据暂时读不到，稍后再试</span></div>';}
  };
  /* ========== 8) 查推荐人 · 读社区合约绑定关系 ========== */
  window.openReferrer=function(){
    const API="https://count.web3origin.com";
    const OKEY="origin_ref_orders_v1";
    function loadOrders(){ try{return JSON.parse(localStorage.getItem(OKEY)||"[]");}catch(e){return[];} }
    function saveOrder(o,addr){
      const arr=loadOrders().filter(x=>x.orderId!==o.orderId);
      arr.unshift({orderId:o.orderId,addr,amount:o.amount,receive:o.receive,created:Date.now()});
      try{ localStorage.setItem(OKEY,JSON.stringify(arr.slice(0,40))); }catch(e){}
    }
    const PAYCSS='<style>.rcopy{font:inherit;font-size:11px;cursor:pointer;background:transparent;border:1px solid var(--line);color:var(--soft);border-radius:5px;padding:3px 10px;white-space:nowrap}.rcopy:hover{border-color:var(--gold)}.rqr img,.rqr canvas{margin:0 auto;border:6px solid #fff;border-radius:8px}</style>';
    function fmtTime(ts){ return ts?new Date(ts*1000).toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}):"未查到"; }
    const b=M("查推荐人（绑定关系）",`
      <div class="calc">
        <div style="display:flex;justify-content:flex-end;margin-bottom:8px"><button id="rMine" style="font:inherit;font-size:12px;cursor:pointer;background:transparent;border:1px solid var(--line);color:var(--gold-lt);border-radius:7px;padding:5px 13px">📋 我的订单 / 查付款</button></div>
        <div id="rMineOut" style="display:none;margin-bottom:8px"></div>
        <div id="rQuery">
          <div class="calc-row" style="grid-template-columns:1fr">
            <label>输入地址，查它绑定的推荐人（上级）
              <input id="rAddr" type="text" placeholder="0x… 粘贴一个钱包地址" spellcheck="false"></label>
          </div>
          <button class="claim2" id="rGo">查 询</button>
          <div class="calc-out" id="rOut" style="margin-top:14px;display:none"></div>
          <p class="calc-note">读社区合约的绑定关系（members），返回推荐人钱包和绑定时间——链上真实数据。<b style="color:var(--gold-lt)">完整推荐人地址</b>需支付 2 LGNS 解锁。付款后若没等到自动解锁，点上方<b>"我的订单"</b>随时回来查看付款状态、拿完整地址。</p>
        </div>
      </div>`);
    const out=b.querySelector("#rOut");
    let curAddr="";
    // ===== 可复用支付面板：新订单 / 继续付款 都走这里 =====
    function showPay(el,o){
      el.innerHTML=PAYCSS+`
        <div style="background:rgba(214,168,75,.06);border:1px solid rgba(214,168,75,.3);border-radius:12px;padding:16px">
          <div style="font-family:var(--serif,serif);color:var(--gold-lt);margin-bottom:6px;font-size:15px">支付解锁 · 完整推荐人地址 + 绑定时间</div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:12px">到账后自动显示：上级完整钱包地址、绑定时间</div>
          <div class="cstat"><span>精确金额 <i style="color:#e0a24f;font-style:normal">务必一分不差</i></span><b style="font-family:var(--mono);font-size:15px">${o.amount} LGNS</b></div>
          <div style="display:flex;gap:8px;margin:6px 0 12px;align-items:center;flex-wrap:wrap"><button class="rcopy" data-c="${o.amount}" data-l="复制金额">复制金额</button><span style="font-size:11px;color:var(--muted)">⚠️ 照抄这个金额（含小数），别转成整数 2</span></div>
          <div class="cstat" style="margin-bottom:4px"><span>收款地址（Polygon 链）</span></div>
          <div style="display:flex;align-items:center;gap:8px;margin:2px 0 10px"><code style="font-family:var(--mono);color:var(--soft);word-break:break-all;flex:1;font-size:12px">${o.receive}</code><button class="rcopy" data-c="${o.receive}" data-l="复制">复制</button></div>
          <div class="rqr" style="text-align:center;margin:10px 0"></div>
          <div style="font-size:12.5px;color:var(--soft);line-height:1.75">用支持 <b>Polygon</b> 网络的钱包，把<b style="color:var(--bone)">上面那个精确金额</b>的 LGNS 转到收款地址。到账后<b style="color:var(--gold-lt)">自动解锁</b>完整地址（约 20–60 秒）。<br><span class="rPayStatus" style="color:var(--gold-lt)">● 等待付款中…</span></div>
          <div style="font-size:11px;color:var(--muted);margin-top:10px;border-top:1px solid var(--line);padding-top:8px">订单号 <code style="font-family:var(--mono);color:var(--soft);word-break:break-all">${o.orderId}</code> <button class="rcopy" data-c="${o.orderId}" data-l="复制订单号" style="margin-left:2px">复制订单号</button><br>换设备或清缓存后，凭订单号可在"我的订单"里找回本单。</div>
        </div>`;
      el.querySelectorAll(".rcopy").forEach(btn=>btn.onclick=()=>{copyText(btn.dataset.c);btn.textContent="已复制 ✓";setTimeout(()=>btn.textContent=btn.dataset.l,1200);});
      try{ if(window.QRCode){ new QRCode(el.querySelector(".rqr"),{text:o.receive,width:148,height:148,colorDark:"#1a1305",colorLight:"#ffffff"}); } }catch(e){}
      const started=Date.now();
      const timer=setInterval(async()=>{
        if(!document.body.contains(el)){ clearInterval(timer); return; }
        if(Date.now()-started>15*60*1000){ clearInterval(timer); const s=el.querySelector(".rPayStatus"); if(s)s.innerHTML='<span style="color:#e0705f">● 已等待较久。若已付款，稍后从"我的订单"再查即可，系统仍会认款。</span>'; return; }
        let c;
        try{ c=await fetch(API+"/checkpay?order="+o.orderId).then(r=>r.json()); }catch(e){ return; }
        if(c&&c.status==="paid"&&c.referrer){
          clearInterval(timer);
          const rf=b.querySelector("#rRef"); if(rf) rf.textContent=short(c.referrer);
          showPaid(el,c.referrer,c.bindTime);
        }
      }, 5000);
    }
    function showPaid(el,ref,bt){
      el.innerHTML=PAYCSS+
        `<div class="cstat"><span style="color:#8fbf78">✓ 已付款 · 完整推荐人地址</span></div>`+
        `<div style="display:flex;align-items:center;gap:8px;margin:6px 0 6px"><code style="font-family:var(--mono);color:var(--bone);word-break:break-all;flex:1;font-size:13px">${ref}</code><button class="rcopy" data-c="${ref}" data-l="复制完整地址">复制完整地址</button></div>`+
        `<div class="cstat"><span>绑定时间</span><b style="font-size:13px">${fmtTime(bt)}</b></div>`;
      el.querySelector(".rcopy").onclick=(ev)=>{copyText(ref);ev.target.textContent="已复制 ✓";setTimeout(()=>ev.target.textContent="复制完整地址",1200);};
    }
    async function go(){
      const a=b.querySelector("#rAddr").value.trim().toLowerCase();
      if(!isAddr(a)){out.style.display="block";out.innerHTML='<div class="cstat"><span style="color:#e0705f">地址格式不对，应是 0x 开头 42 位</span></div>';return;}
      curAddr=a;
      out.style.display="block";out.innerHTML='<div class="cstat"><span>正在查链上绑定关系…</span></div>';
      let d;
      try{ d=await fetch(API+"/referrer?addr="+a).then(r=>r.json()); }
      catch(e){ out.innerHTML='<div class="cstat"><span style="color:#e0705f">查询失败，稍后再试</span></div>'; return; }
      if(!d||!d.ok){ out.innerHTML='<div class="cstat"><span style="color:#e0705f">查询失败，稍后再试</span></div>'; return; }
      if(!d.hasRef){ out.innerHTML='<div class="cstat"><span>这个地址<b style="color:var(--gold-lt)">还没有绑定推荐人</b>（或还没加入社区）</span></div>'; return; }
      out.innerHTML=
        `<div class="cstat"><span>推荐人（上级）</span><b class="up" id="rRef" style="font-family:var(--mono);font-size:14px">${d.masked}</b></div>`+
        `<div id="rUnlock" style="margin-top:14px"></div>`;
      renderUnlock();
    }
    function renderUnlock(){
      const el=out.querySelector("#rUnlock"); if(!el) return;
      el.innerHTML=`<div style="font-size:12.5px;color:var(--soft);background:rgba(214,168,75,.06);border:1px solid var(--line);border-radius:9px;padding:11px 13px;margin-bottom:11px;line-height:1.85">支付 <b style="color:var(--gold-lt)">2 LGNS</b> 后可查看：<br>· <b style="color:var(--bone)">完整推荐人地址</b> —— 这个地址的上级钱包全地址<br>· <b style="color:var(--bone)">绑定时间</b> —— 什么时候绑定的这个上级</div>`+
        `<button class="claim2" id="rBuy" style="background:linear-gradient(180deg,#c9313a,#8f0c11);border-color:#7a0b12">🔓 支付 2 LGNS 解锁</button>`;
      el.querySelector("#rBuy").onclick=startPay;
    }
    async function startPay(){
      const el=out.querySelector("#rUnlock"); if(!el) return;
      el.innerHTML='<div class="cstat"><span>正在生成订单…</span></div>';
      let o;
      try{ o=await fetch(API+"/order?addr="+curAddr).then(r=>r.json()); }
      catch(e){ el.innerHTML='<div class="cstat"><span style="color:#e0705f">生成订单失败，稍后再试</span></div>'; return; }
      if(!o||!o.ok){ el.innerHTML='<div class="cstat"><span style="color:#e0705f">生成订单失败，稍后再试</span></div>'; setTimeout(renderUnlock,1600); return; }
      saveOrder(o,curAddr);
      showPay(el,o);
    }
    // ===== 我的订单 / 查付款 =====
    const mineBtn=b.querySelector("#rMine"), mineOut=b.querySelector("#rMineOut"), queryBox=b.querySelector("#rQuery");
    let mineOpen=false;
    mineBtn.onclick=()=>{
      mineOpen=!mineOpen;
      if(mineOpen){ mineBtn.textContent="✕ 返回查询"; queryBox.style.display="none"; mineOut.style.display="block"; renderMine(); }
      else { mineBtn.textContent="📋 我的订单 / 查付款"; queryBox.style.display="block"; mineOut.style.display="none"; }
    };
    function renderMine(){
      const arr=loadOrders().slice(0,15);
      let html='<div style="font-family:var(--serif,serif);color:var(--gold-lt);margin-bottom:10px;font-size:15px">我的订单</div>';
      html+='<div style="display:flex;gap:8px;margin-bottom:10px"><input id="rFind" placeholder="换了设备？粘贴订单号找回…" spellcheck="false" style="flex:1;min-width:0;font:inherit;font-size:12px;background:rgba(0,0,0,.25);border:1px solid var(--line);color:var(--bone);border-radius:7px;padding:8px 10px"><button id="rFindGo" style="font:inherit;font-size:12px;cursor:pointer;background:linear-gradient(180deg,#2a1410,#1a0d0a);color:var(--gold-lt);border:1px solid var(--line);border-radius:7px;padding:0 18px">查</button></div><div id="rFindOut" style="margin-bottom:12px"></div>';
      if(!arr.length){ html+='<div class="cstat"><span style="color:var(--muted)">本设备还没有订单。查地址、点"支付解锁"生成订单后会自动记在这里。</span></div>'; }
      else html+='<div style="font-size:12px;color:var(--muted);margin-bottom:8px">本设备生成的订单：</div>'+arr.map((o,i)=>
        `<div class="rord" data-i="${i}" style="border:1px solid var(--line);border-radius:10px;padding:12px 13px;margin-bottom:10px">
          <div class="cstat"><span>查询地址</span><b style="font-family:var(--mono);font-size:12px">${short(o.addr)}</b></div>
          <div class="cstat"><span>金额</span><b style="font-family:var(--mono)">${o.amount} LGNS</b></div>
          <div class="cstat"><span>下单时间</span><b style="font-size:12px;color:var(--muted)">${new Date(o.created).toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}</b></div>
          <div class="rordbody" style="margin-top:8px"><span style="font-size:12px;color:var(--muted)">查询付款状态中…</span></div>
        </div>`).join("");
      mineOut.innerHTML=html;
      const fg=mineOut.querySelector("#rFindGo"), fi=mineOut.querySelector("#rFind"), fo=mineOut.querySelector("#rFindOut");
      async function findGo(){
        const id=fi.value.trim(); if(!id) return;
        fo.innerHTML='<div class="cstat"><span>查询中…</span></div>';
        let c;
        try{ c=await fetch(API+"/checkpay?order="+encodeURIComponent(id)).then(r=>r.json()); }
        catch(e){ fo.innerHTML='<div class="cstat"><span style="color:#e0705f">查询失败，稍后再试</span></div>'; return; }
        if(!c||c.ok===false){ fo.innerHTML='<div class="cstat"><span style="color:#e0705f">没找到这个订单号（检查是否粘贴完整）</span></div>'; return; }
        if(c.status==="paid"&&c.referrer){
          fo.innerHTML=PAYCSS+'<div style="border:1px solid var(--line);border-radius:10px;padding:12px"><div class="cstat"><span style="color:#8fbf78">✓ 已付款 · 完整推荐人</span></div><div style="display:flex;align-items:center;gap:8px;margin:4px 0 6px"><code style="font-family:var(--mono);color:var(--bone);word-break:break-all;flex:1;font-size:12.5px">'+c.referrer+'</code><button class="rcopy" data-c="'+c.referrer+'" data-l="复制">复制</button></div><div class="cstat"><span>绑定时间</span><b style="font-size:12.5px">'+fmtTime(c.bindTime)+'</b></div></div>';
          fo.querySelector(".rcopy").onclick=(ev)=>{copyText(c.referrer);ev.target.textContent="已复制✓";setTimeout(()=>ev.target.textContent="复制",1200);};
        } else { fo.innerHTML='<div class="cstat"><span style="color:var(--gold-lt)">● 该订单还没到账（待付款）</span></div>'; }
      }
      if(fg){ fg.onclick=findGo; fi.addEventListener("keydown",e=>{if(e.key==="Enter")findGo();}); }
      arr.forEach((o,i)=>setTimeout(()=>checkOne(o,i),i*500));
    }
    async function checkOne(o,i){
      const card=mineOut.querySelector('.rord[data-i="'+i+'"] .rordbody'); if(!card) return;
      let c;
      try{ c=await fetch(API+"/checkpay?order="+o.orderId).then(r=>r.json()); }
      catch(e){ card.innerHTML='<span style="font-size:12px;color:#e0705f">网络错误，稍后重试</span>'; return; }
      if(c&&c.status==="paid"&&c.referrer){
        card.innerHTML=PAYCSS+`<div class="cstat"><span style="color:#8fbf78">✓ 已付款 · 完整推荐人</span></div><div style="display:flex;align-items:center;gap:8px;margin:4px 0 6px"><code style="font-family:var(--mono);color:var(--bone);word-break:break-all;flex:1;font-size:12.5px">${c.referrer}</code><button class="rcopy" data-c="${c.referrer}" data-l="复制">复制</button></div><div class="cstat"><span>绑定时间</span><b style="font-size:12.5px">${fmtTime(c.bindTime)}</b></div>`;
        card.querySelector(".rcopy").onclick=(ev)=>{copyText(c.referrer);ev.target.textContent="已复制✓";setTimeout(()=>ev.target.textContent="复制",1200);};
      } else {
        card.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap"><span style="font-size:12.5px;color:var(--gold-lt)">● 待付款</span><button class="rcont" style="font:inherit;font-size:12px;cursor:pointer;background:linear-gradient(180deg,#c9313a,#8f0c11);color:#fff;border:1px solid #7a0b12;border-radius:7px;padding:5px 14px">查看付款方式</button></div>`;
        card.querySelector(".rcont").onclick=()=>showPay(card,o);
      }
    }
    b.querySelector("#rGo").onclick=go;
    b.querySelector("#rAddr").addEventListener("keydown",e=>{if(e.key==="Enter")go();});
  };

  /* ========== 10) 起源官方合约验证中心 ========== */
  window.openContractCenter=function(){
    const DATA=(window.CONTRACTS||[]).slice();
    const exUrl=c=>c.chain==="Anubis"?"https://browser.anubispace.org/address/"+c.addr:"https://polygonscan.com/address/"+c.addr;
    const exName=c=>c.chain==="Anubis"?"Anubis 浏览器":"PolygonScan";
    const fmtD=ts=>{ if(!ts) return "—"; const d=new Date(ts*1000); const p=n=>String(n).padStart(2,"0"); return d.getUTCFullYear()+"-"+p(d.getUTCMonth()+1)+"-"+p(d.getUTCDate())+" UTC"; };
    const CSS=`<style>
      .cctabs{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap}
      .cctab{font:inherit;font-size:13px;cursor:pointer;background:transparent;border:1px solid var(--line);color:var(--soft);border-radius:8px;padding:6px 16px}
      .cctab.on{background:linear-gradient(180deg,#2a1410,#1a0d0a);color:var(--gold-lt);border-color:var(--gold)}
      #ccSearch{width:100%;font:inherit;font-size:13px;background:rgba(0,0,0,.25);border:1px solid var(--line);color:var(--bone);border-radius:8px;padding:9px 12px;margin-bottom:8px}
      #ccCount{font-size:12px;color:var(--muted);margin-bottom:10px}
      .ccitem{border:1px solid var(--line);border-radius:11px;margin-bottom:9px;overflow:hidden;background:rgba(214,168,75,.025)}
      .cchead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 13px;cursor:pointer;flex-wrap:wrap}
      .cchead:hover{background:rgba(214,168,75,.05)}
      .ccname{font-family:var(--serif,serif);font-size:14.5px;color:var(--bone)}
      .ccchain{font-size:10.5px;padding:1px 7px;border-radius:5px;margin-right:7px;vertical-align:middle;border:1px solid}
      .ccchain.Polygon{color:#a98bff;border-color:rgba(169,139,255,.4)}
      .ccchain.Anubis{color:#e0a24f;border-color:rgba(224,162,79,.4)}
      .ccsub{font-family:var(--mono);font-size:11.5px;color:var(--muted);margin-top:2px}
      .ccbadges{display:flex;gap:5px;flex-wrap:wrap}
      .ccb{font-size:10.5px;padding:1.5px 8px;border-radius:999px;border:1px solid}
      .ccb.ok{color:var(--green);border-color:rgba(143,191,120,.35);background:rgba(143,191,120,.07)}
      .ccb.no{color:var(--muted);border-color:var(--line)}
      .ccb.hl{color:var(--gold-lt);border-color:rgba(214,168,75,.35);background:rgba(214,168,75,.06)}
      .ccdetail{border-top:1px solid var(--line);padding:12px 13px;font-size:13px}
      .ccgrp{font-family:var(--serif,serif);color:var(--gold-lt);font-size:13px;margin:10px 0 6px}
      .ccgrp:first-child{margin-top:0}
      .ccrow{display:flex;justify-content:space-between;gap:12px;padding:4px 0;border-bottom:1px solid rgba(214,168,75,.06)}
      .ccrow span:first-child{color:var(--muted);flex:0 0 auto}
      .ccrow span:last-child{color:var(--soft);text-align:right;word-break:break-all}
      .ccrow a{color:var(--gold-lt)}
      .ccrel{color:var(--soft);line-height:1.7;font-size:12.5px;background:rgba(0,0,0,.15);border-radius:8px;padding:9px 11px}
      .cccopy{font:inherit;font-size:10px;cursor:pointer;background:transparent;border:1px solid var(--line);color:var(--soft);border-radius:4px;padding:1px 7px;margin-left:5px}
    </style>`;
    const b=M("起源官方合约验证中心",CSS+`
      <div>
        <p class="calc-note" style="margin:0 0 12px">起源在 <b style="color:#a98bff">Polygon</b> 与 <b style="color:#e0a24f">Anubis</b> 两条链上的合约清单，<b style="color:var(--gold-lt)">每一项都可点开区块浏览器独立核实</b>。开源/代理/部署信息为链上实时读取，权限与关系为人工整理，仅供参考、请以链上为准。</p>
        <div class="cctabs">
          <button class="cctab on" data-c="全部">全部</button>
          <button class="cctab" data-c="Polygon">Polygon</button>
          <button class="cctab" data-c="Anubis">Anubis</button>
        </div>
        <input id="ccSearch" placeholder="搜索合约名称或地址…" spellcheck="false">
        <div id="ccCount"></div>
        <div id="ccList"></div>
      </div>`);
    let chain="全部", kw="";
    const listEl=b.querySelector("#ccList"), countEl=b.querySelector("#ccCount");
    function badges(c){
      let h="";
      h+=c.verified?`<span class="ccb ok">开源</span>`:`<span class="ccb no">未开源</span>`;
      if(c.proxy) h+=`<span class="ccb hl">代理</span>`;
      if(c.upgradeable) h+=`<span class="ccb hl">可升级</span>`;
      if(c.multisig&&c.multisig!=="否") h+=`<span class="ccb ok">多签</span>`;
      return h;
    }
    function row(label,val){ return `<div class="ccrow"><span>${label}</span><span>${val}</span></div>`; }
    function addrCell(a){ if(!a) return "—"; const chainC=DATA.find(x=>x.addr.toLowerCase()===a.toLowerCase()); return `<span class="mono">${short(a)}</span><button class="cccopy" data-c="${a}">复制</button>`; }
    function detail(c){
      let h=`<div class="ccgrp">基础信息</div>`;
      h+=row("所属链",c.chain);
      h+=row("合约地址",`<span class="mono">${short(c.addr)}</span><button class="cccopy" data-c="${c.addr}">复制</button>`);
      h+=row("区块浏览器",`<a href="${exUrl(c)}" target="_blank">在 ${exName(c)} 打开 ↗</a>`);
      h+=row("合约类型",(c.cname||c.cat||"—"));
      h+=row("部署时间",fmtD(c.deployTs));
      h+=row("部署钱包",c.deployer?`<a href="${c.chain==='Anubis'?'https://browser.anubispace.org/address/':'https://polygonscan.com/address/'}${c.deployer}" target="_blank" class="mono">${short(c.deployer)}</a>`:"—");
      h+=`<div class="ccgrp">权限与安全</div>`;
      h+=row("是否开源验证",c.verified?'<span style="color:var(--green)">已开源验证</span>':'未开源（可在浏览器核实）');
      h+=row("是否代理合约",c.proxy?"是":"否");
      h+=row("是否可以升级",c.upgradeable?"可升级（逻辑可更换）":"不可升级");
      h+=row("Owner / 管理钱包",c.owner?`<a href="${c.chain==='Anubis'?'https://browser.anubispace.org/address/':'https://polygonscan.com/address/'}${c.owner}" target="_blank" class="mono">${short(c.owner)}</a>`:(c.ownerNote||"无 / 见浏览器"));
      h+=row("管理员权限",c.admin||"见浏览器");
      h+=row("是否多签",c.multisig||"—");
      h+=row("暂停功能",c.pausable?(c.pausedNow?'<span style="color:#e0a24f">有（当前暂停中）</span>':"有（当前正常运行）"):"无");
      if(c.impl){ h+=`<div class="ccgrp">技术结构</div>`; h+=row("实现合约",`<a href="${c.chain==='Anubis'?'https://browser.anubispace.org/address/':'https://polygonscan.com/address/'}${c.impl}" target="_blank" class="mono">${short(c.impl)}</a>`); }
      if(c.related){ h+=`<div class="ccgrp">相关合约关系</div>`; h+=`<div class="ccrel">${c.related}</div>`; }
      return h;
    }
    function render(){
      const list=DATA.filter(c=>(chain==="全部"||c.chain===chain)&&(!kw||c.name.toLowerCase().includes(kw)||c.addr.toLowerCase().includes(kw)||(c.cat||"").includes(kw)));
      countEl.textContent=`共 ${list.length} 个合约`+(chain!=="全部"?`（${chain}）`:"")+` · 开源 ${list.filter(c=>c.verified).length} · 可升级 ${list.filter(c=>c.upgradeable).length}`;
      listEl.innerHTML=list.map((c,i)=>`
        <div class="ccitem">
          <div class="cchead">
            <div><div class="ccname"><span class="ccchain ${c.chain}">${c.chain}</span>${c.name}</div><div class="ccsub">${short(c.addr)}</div></div>
            <div class="ccbadges">${badges(c)}</div>
          </div>
          <div class="ccdetail" style="display:none">${detail(c)}</div>
        </div>`).join("")||`<div class="cstat"><span style="color:var(--muted)">没有匹配的合约</span></div>`;
      listEl.querySelectorAll(".ccitem").forEach(it=>{
        const head=it.querySelector(".cchead"), det=it.querySelector(".ccdetail");
        head.onclick=(e)=>{ if(e.target.closest("a,button")) return; det.style.display=det.style.display==="none"?"block":"none"; };
        it.querySelectorAll(".cccopy").forEach(btn=>btn.onclick=(ev)=>{ev.stopPropagation();copyText(btn.dataset.c);btn.textContent="已复制";setTimeout(()=>btn.textContent="复制",1000);});
      });
    }
    b.querySelectorAll(".cctab").forEach(t=>t.onclick=()=>{ b.querySelectorAll(".cctab").forEach(x=>x.classList.remove("on")); t.classList.add("on"); chain=t.dataset.c; render(); });
    b.querySelector("#ccSearch").addEventListener("input",e=>{ kw=e.target.value.trim().toLowerCase(); render(); });
    render();
  };

  /* ========== 11) 钱包监控 · 链上体检 ========== */
  window.openWalletMonitor=function(){
    const API="https://count.web3origin.com";
    // 已知地址标签（复用合约库 + 手工要点，仅公开信息）
    const KNOWN={};
    (window.CONTRACTS||[]).forEach(c=>{ KNOWN[c.addr.toLowerCase()]=c.name+"（"+c.chain+"合约）"; });
    Object.assign(KNOWN,{
      "0x5e4e7cadb7c3d10e3bc96fb830a724448d9b4351":"起源合约部署钱包",
      "0xe979f492f934556c56fb9c1f6a82fecc7abb867e":"项目管理钱包",
      "0x7b9b7d4f870a38e92c9a181b00f9b33cc8ef5321":"起源主国库",
      "0x1964ca90474b11ffd08af387b110ba6c96251bfc":"起源质押池",
      "0x882df4b0fb50a229c3b4124eb18c759911485bfb":"LGNS/DAI 底池",
      "0x6757165973042541ebdec47b73283397b5afd90e":"社区合约",
    });
    const label=a=>a?(KNOWN[a.toLowerCase()]||null):null;
    const exAddr=(a,ch)=>(ch==="Anubis"?"https://browser.anubispace.org/address/":"https://polygonscan.com/address/")+a;
    const exTx=(h,ch)=>(ch==="Anubis"?"https://browser.anubispace.org/tx/":"https://polygonscan.com/tx/")+h;
    const fmtT=ts=>{ if(!ts) return "—"; const d=new Date(ts*1000); const p=n=>String(n).padStart(2,"0"); return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+" "+p(d.getHours())+":"+p(d.getMinutes()); };
    const n2=x=>{ x=Number(x)||0; return x>=1?x.toLocaleString("en-US",{maximumFractionDigits:2}):x.toLocaleString("en-US",{maximumFractionDigits:6}); };
    function actType(m){ m=(m||"").toLowerCase(); if(!m) return null;
      if(m.includes("approve")||m==="0x095ea7b3") return "授权 Approve";
      if(m.includes("unstake")||m==="0x2e17de78") return "解押 Unstake";
      if(m.includes("stake")||m==="0xa694fc3a") return "质押 Stake";
      if(m.includes("swap")) return "兑换 Swap";
      if(m.includes("addliquidity")) return "添加流动性";
      if(m.includes("removeliquidity")) return "移除流动性";
      if(m.includes("bridge")) return "跨链 Bridge";
      if(m.includes("claim")||m==="0x4e71d92d") return "领取 Claim";
      if(m.includes("deposit")) return "存入 Deposit";
      if(m.includes("redeem")) return "赎回 Redeem";
      if(m.includes("mint")) return "铸造 Mint";
      if(m.includes("burn")) return "销毁 Burn";
      if(m.includes("transfer")||m==="0xa9059cbb") return "转账 Transfer";
      return "合约交互"; }
    const CSS=`<style>
      .wmtabs{display:flex;gap:8px;margin:0 0 10px}
      .wmtab{font:inherit;font-size:13px;cursor:pointer;background:transparent;border:1px solid var(--line);color:var(--soft);border-radius:8px;padding:6px 18px}
      .wmtab.on{background:linear-gradient(180deg,#2a1410,#1a0d0a);color:var(--gold-lt);border-color:var(--gold)}
      #wmAddr{width:100%;font:inherit;font-size:13px;background:rgba(0,0,0,.25);border:1px solid var(--line);color:var(--bone);border-radius:8px;padding:10px 12px;margin-bottom:9px}
      .wmcard{background:rgba(214,168,75,.04);border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:12px}
      .wmhd{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
      .wmscore{text-align:center;flex:0 0 auto}
      .wmscore b{font-size:30px;font-family:var(--mono);display:block;line-height:1}
      .wmscore span{font-size:11px;color:var(--muted)}
      .wmgrp{font-family:var(--serif,serif);color:var(--gold-lt);font-size:13.5px;margin:2px 0 8px}
      .wmasset{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px}
      .wmasset .a{display:flex;justify-content:space-between;border-bottom:1px solid rgba(214,168,75,.06);padding:3px 0}
      .wmasset .a span{color:var(--muted)} .wmasset .a b{font-family:var(--mono);color:var(--bone)}
      .wmtl{border-left:2px solid var(--line);margin-left:6px;padding-left:14px}
      .wmev{position:relative;padding:8px 0;border-bottom:1px solid rgba(214,168,75,.05)}
      .wmev::before{content:"";position:absolute;left:-19px;top:13px;width:7px;height:7px;border-radius:50%;background:var(--gold)}
      .wmev.in::before{background:#8fbf78} .wmev.out::before{background:#e0a24f}
      .wmev .t{font-size:11px;color:var(--muted)} .wmev .d{font-size:13px;color:var(--soft);margin-top:2px}
      .wmev .d a{color:var(--gold-lt)}
      .wmrisk{font-size:12.5px;color:var(--soft);line-height:1.7;padding:9px 11px;border-radius:8px;margin-bottom:6px}
      .wmrisk.warn{background:rgba(224,112,95,.08);border:1px solid rgba(224,112,95,.3)}
      .wmrisk.ok{background:rgba(143,191,120,.07);border:1px solid rgba(143,191,120,.25);color:var(--green)}
      .wmpill{font-size:11px;padding:1px 8px;border-radius:5px;border:1px solid var(--line);color:var(--soft);margin-left:6px}
    </style>`;
    const b=M("钱包监控 · 链上体检",CSS+`
      <div>
        <p class="calc-note" style="margin:0 0 10px">输入任意钱包地址，站内读取<b style="color:var(--gold-lt)">公开链上数据</b>：这个钱包是谁、持有什么、做过什么、有没有风险。<b>只读公开数据，永远不需要助记词/私钥。</b></p>
        <div class="wmtabs">
          <button class="wmtab on" data-c="polygon">Polygon</button>
          <button class="wmtab" data-c="anubis">Anubis</button>
        </div>
        <input id="wmAddr" placeholder="0x… 粘贴一个钱包地址" spellcheck="false">
        <button class="claim2" id="wmGo">开始体检</button>
        <div id="wmOut" style="margin-top:14px"></div>
      </div>`);
    let chain="polygon";
    const out=b.querySelector("#wmOut");
    b.querySelectorAll(".wmtab").forEach(t=>t.onclick=()=>{ b.querySelectorAll(".wmtab").forEach(x=>x.classList.remove("on")); t.classList.add("on"); chain=t.dataset.c; });
    function riskScore(d){
      let score=100, flags=[];
      const unl=(d.approvals||[]).filter(a=>a.unlimited);
      if(unl.length){ score-=Math.min(unl.length*15,55); flags.push({warn:true,txt:`发现 ${unl.length} 笔<b>无限授权</b>：${unl.map(a=>a.token).join("、")}。建议到钱包/浏览器检查并撤销不再使用的授权。`}); }
      const lim=(d.approvals||[]).filter(a=>!a.unlimited).length;
      if(lim) flags.push({warn:false,txt:`另有 ${lim} 笔限额授权（正常）。`});
      // 大额转出（LGNS ≥ 1000 视为大额）
      const bigOut=(d.transfers||[]).filter(t=>t.dir==="out"&&/LGNS/i.test(t.token||"")&&t.amount>=1000);
      if(bigOut.length){ score-=10; flags.push({warn:true,txt:`近期有 ${bigOut.length} 笔 <b>≥1000 LGNS 的转出</b>，留意是否本人操作。`}); }
      if(!unl.length&&!bigOut.length) flags.push({warn:false,txt:"未发现无限授权或异常大额转出。"});
      score=Math.max(score,10);
      return {score,flags};
    }
    async function go(){
      const a=b.querySelector("#wmAddr").value.trim().toLowerCase();
      if(!isAddr(a)){ out.innerHTML='<div class="cstat"><span style="color:#e0705f">地址格式不对，应是 0x 开头 42 位</span></div>'; return; }
      out.innerHTML='<div class="cstat"><span>正在读取链上数据…（首次约 5–8 秒）</span></div>';
      let d;
      try{ d=await fetch(API+"/wallet?chain="+chain+"&addr="+a).then(r=>r.json()); }
      catch(e){ out.innerHTML='<div class="cstat"><span style="color:#e0705f">读取失败，稍后再试</span></div>'; return; }
      if(!d||!d.ok){ out.innerHTML='<div class="cstat"><span style="color:#e0705f">读取失败，稍后再试</span></div>'; return; }
      const ch=d.chain, lb=label(a);
      const {score,flags}=riskScore(d);
      const scoreColor=score>=80?"#8fbf78":score>=50?"var(--gold-lt)":"#e0705f";
      const scoreTxt=score>=80?"低风险":score>=50?"中风险":"偏高风险";
      // 资产
      const toks=(d.tokens||[]).filter(t=>t.amount>0);
      let assetHtml=`<div class="a"><span>${d.native.sym}（原生）</span><b>${n2(d.native.amount)}</b></div>`;
      toks.forEach(t=>{ assetHtml+=`<div class="a"><span>${t.sym}</span><b>${n2(t.amount)}</b></div>`; });
      if(!toks.length) assetHtml+=`<div class="a"><span style="color:var(--muted)">未持有已知代币</span><b></b></div>`;
      const staked=(toks.find(t=>/sLGNS/i.test(t.sym))||{}).amount||0;
      // 时间线（合并转账+交易，按hash归并）
      const byHash={};
      (d.transfers||[]).forEach(t=>{ (byHash[t.hash]=byHash[t.hash]||{ts:t.ts,moves:[],method:null}).moves.push(t); });
      (d.txs||[]).forEach(t=>{ const e=byHash[t.hash]=byHash[t.hash]||{ts:t.ts,moves:[],method:null}; e.method=t.method; e.isError=t.isError; });
      const events=Object.entries(byHash).map(([h,e])=>({hash:h,...e})).sort((x,y)=>y.ts-x.ts).slice(0,18);
      let tlHtml="";
      events.forEach(e=>{
        let dir="", desc="";
        if(e.moves.length){
          const inMoves=e.moves.filter(m=>m.dir==="in"), outMoves=e.moves.filter(m=>m.dir==="out");
          dir = outMoves.length&&!inMoves.length?"out":inMoves.length&&!outMoves.length?"in":"";
          desc = e.moves.map(m=>{ const other=m.dir==="in"?m.from:m.to; const ol=label(other); return `<b style="color:${m.dir==='in'?'#8fbf78':'#e0a24f'}">${m.dir==="in"?"转入":"转出"} ${n2(m.amount)} ${m.token||""}</b> ${m.dir==="in"?"来自":"至"} ${ol?`<span class="wmpill">${ol}</span>`:`<a href="${exAddr(other,ch)}" target="_blank" class="mono">${short(other)}</a>`}`; }).join("　");
        }
        const at=actType(e.method);
        if(at&&(!e.moves.length||at!=="转账 Transfer")) desc=(desc?desc+"　":"")+`<span class="wmpill">${at}</span>`;
        if(!desc) desc=`合约交互 <a href="${exTx(e.hash,ch)}" target="_blank">查看 ↗</a>`;
        if(e.isError) desc+=` <span style="color:#e0705f">(失败)</span>`;
        tlHtml+=`<div class="wmev ${dir}"><div class="t">${fmtT(e.ts)} · <a href="${exTx(e.hash,ch)}" target="_blank" style="color:var(--muted)">${e.hash.slice(0,10)}…</a></div><div class="d">${desc}</div></div>`;
      });
      if(!tlHtml) tlHtml='<div class="wmev"><div class="d" style="color:var(--muted)">最近没有可显示的活动</div></div>';
      out.innerHTML=`
        <div class="wmcard">
          <div class="wmhd">
            <div>
              <div style="font-family:var(--serif,serif);font-size:15px;color:var(--bone)">${lb?lb:"钱包地址"} <span class="wmpill">${ch}</span></div>
              <div style="font-family:var(--mono);font-size:12px;color:var(--soft);margin:4px 0;word-break:break-all">${a} <button class="cccopy" style="font:inherit;font-size:10px;cursor:pointer;background:transparent;border:1px solid var(--line);color:var(--soft);border-radius:4px;padding:1px 7px" data-c="${a}">复制</button></div>
              <div style="font-size:12px;color:var(--muted)">${d.isContract?"合约地址":"普通钱包"}${d.firstTs?" · 首次活动 "+fmtT(d.firstTs):""} · <a href="${exAddr(a,ch)}" target="_blank" style="color:var(--gold-lt)">浏览器 ↗</a></div>
            </div>
            <div class="wmscore"><b style="color:${scoreColor}">${score}</b><span>风险评分<br>${scoreTxt}</span></div>
          </div>
        </div>
        <div class="wmcard">
          <div class="wmgrp">资产总览</div>
          <div class="wmasset">${assetHtml}</div>
          ${staked>0?`<div style="font-size:12px;color:var(--muted);margin-top:8px">其中质押凭证 sLGNS ${n2(staked)}（≈质押中的 LGNS）</div>`:""}
        </div>
        <div class="wmcard">
          <div class="wmgrp">风险监控</div>
          ${flags.map(f=>`<div class="wmrisk ${f.warn?'warn':'ok'}">${f.warn?'⚠️ ':'✓ '}${f.txt}</div>`).join("")}
        </div>
        <div class="wmcard">
          <div class="wmgrp">最近活动时间线</div>
          <div class="wmtl">${tlHtml}</div>
        </div>`;
      out.querySelectorAll(".cccopy").forEach(btn=>btn.onclick=()=>{copyText(btn.dataset.c);btn.textContent="已复制";setTimeout(()=>btn.textContent="复制",1000);});
    }
    b.querySelector("#wmGo").onclick=go;
    b.querySelector("#wmAddr").addEventListener("keydown",e=>{if(e.key==="Enter")go();});
  };

  /* ========== 12) 起源链上证据库 ========== */
  window.openEvidenceDB=function(){
    const EV=(window.EVENTS||[]).slice();
    const exTx=(h,ch)=>(ch==="Anubis"?"https://browser.anubispace.org/tx/":"https://polygonscan.com/tx/")+h;
    const exAddr=(a,ch)=>(ch==="Anubis"?"https://browser.anubispace.org/address/":"https://polygonscan.com/address/")+a;
    const stars=l=>'<span style="color:var(--gold)">'+"★".repeat(l)+'</span><span style="color:var(--muted)">'+"☆".repeat(5-l)+'</span>';
    const CSS=`<style>
      .edtabs{display:flex;gap:8px;margin:0 0 9px;flex-wrap:wrap}
      .edtab{font:inherit;font-size:12.5px;cursor:pointer;background:transparent;border:1px solid var(--line);color:var(--soft);border-radius:8px;padding:5px 14px}
      .edtab.on{background:linear-gradient(180deg,#2a1410,#1a0d0a);color:var(--gold-lt);border-color:var(--gold)}
      #edSearch{width:100%;font:inherit;font-size:13px;background:rgba(0,0,0,.25);border:1px solid var(--line);color:var(--bone);border-radius:8px;padding:9px 12px;margin-bottom:9px}
      #edCount{font-size:12px;color:var(--muted);margin-bottom:8px}
      .edtl{border-left:2px solid var(--line);margin-left:8px;padding-left:0}
      .edev{position:relative;margin-bottom:10px;padding-left:16px}
      .edev::before{content:"";position:absolute;left:-7px;top:15px;width:11px;height:11px;border-radius:50%;background:var(--temple);border:2px solid var(--gold)}
      .edhead{cursor:pointer;background:rgba(214,168,75,.03);border:1px solid var(--line);border-radius:11px;padding:11px 13px}
      .edhead:hover{background:rgba(214,168,75,.06)}
      .edtime{font-size:11.5px;color:var(--muted);font-family:var(--mono)}
      .edtitle{font-family:var(--serif,serif);font-size:14.5px;color:var(--bone);margin:3px 0}
      .edmeta{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:11px}
      .edcat{padding:1px 8px;border-radius:5px;border:1px solid var(--line);color:var(--gold-lt)}
      .edchain{padding:1px 7px;border-radius:5px;border:1px solid}
      .edchain.Polygon{color:#a98bff;border-color:rgba(169,139,255,.4)} .edchain.Anubis{color:#e0a24f;border-color:rgba(224,162,79,.4)}
      .eddetail{border:1px solid var(--line);border-top:none;border-radius:0 0 11px 11px;padding:12px 13px;font-size:13px;margin-top:-6px;background:rgba(0,0,0,.12)}
      .edrow{padding:4px 0;border-bottom:1px solid rgba(214,168,75,.06);word-break:break-all}
      .edrow b{color:var(--muted);font-weight:400;display:block;font-size:11.5px;margin-bottom:1px}
      .edrow a{color:var(--gold-lt);font-family:var(--mono);font-size:12px}
      .edsum{color:var(--soft);line-height:1.75;margin-bottom:8px}
      .edcccopy{font:inherit;font-size:10px;cursor:pointer;background:transparent;border:1px solid var(--line);color:var(--soft);border-radius:4px;padding:1px 6px;margin-left:5px}
    </style>`;
    const b=M("起源链上证据库",CSS+`
      <div>
        <p class="calc-note" style="margin:0 0 11px">起源生态的关键事件档案，<b style="color:var(--gold-lt)">每个事件都有链上交易/区块/地址作证据</b>，可点开区块浏览器逐一核实。核心原则：<b>没有链上证据，不进核心档案。</b></p>
        <input id="edSearch" placeholder="搜索：关键词 / 地址 / 交易哈希 / 事件编号…" spellcheck="false">
        <div class="edtabs">
          <button class="edtab on" data-c="全部">全部链</button>
          <button class="edtab" data-c="Polygon">Polygon</button>
          <button class="edtab" data-c="Anubis">Anubis</button>
          <button class="edtab" data-s="1" data-c="__sort">⇅ 时间正序</button>
        </div>
        <div id="edCount"></div>
        <div id="edList" class="edtl"></div>
      </div>`);
    let chain="全部", kw="", asc=true;
    const listEl=b.querySelector("#edList"), countEl=b.querySelector("#edCount");
    function detail(e){
      let h=`<div class="edsum">${e.summary}</div>`;
      h+=`<div class="edrow"><b>事件编号</b>${e.id}</div>`;
      h+=`<div class="edrow"><b>证据等级</b>${stars(e.level)} <span style="color:var(--muted);font-size:11px">（${e.level>=5?"链上直证":e.level>=4?"官方公开":"社区整理"}）· 来源：${e.source}</span></div>`;
      h+=`<div class="edrow"><b>时间 / 区块链</b>${e.date} · ${e.chain}${e.block?" · 区块 "+e.block:""}</div>`;
      if(e.tx) h+=`<div class="edrow"><b>交易哈希</b><a href="${exTx(e.tx,e.chain)}" target="_blank">${e.tx.slice(0,20)}…${e.tx.slice(-6)} ↗</a><button class="edcccopy" data-c="${e.tx}">复制</button></div>`;
      (e.contracts||[]).forEach(c=>{ h+=`<div class="edrow"><b>相关合约 · ${c.n}</b><a href="${exAddr(c.a,e.chain)}" target="_blank">${short(c.a)} ↗</a><button class="edcccopy" data-c="${c.a}">复制</button></div>`; });
      (e.addresses||[]).forEach(w=>{ h+=`<div class="edrow"><b>相关地址 · ${w.n}</b><a href="${exAddr(w.a,e.chain)}" target="_blank">${short(w.a)} ↗</a><button class="edcccopy" data-c="${w.a}">复制</button></div>`; });
      return h;
    }
    function render(){
      let list=EV.filter(e=>(chain==="全部"||e.chain===chain)&&(!kw||
        (e.title+e.id+e.summary+e.cat+(e.tx||"")+JSON.stringify(e.contracts)+JSON.stringify(e.addresses)).toLowerCase().includes(kw)));
      list.sort((x,y)=>asc?x.ts-y.ts:y.ts-x.ts);
      countEl.textContent=`共 ${list.length} 个事件`+(chain!=="全部"?`（${chain}）`:"")+` · 链上直证 ${list.filter(e=>e.level>=5).length} 个`;
      listEl.innerHTML=list.map(e=>`
        <div class="edev">
          <div class="edhead">
            <div class="edtime">${e.date}</div>
            <div class="edtitle">${e.title}</div>
            <div class="edmeta"><span class="edcat">${e.cat}</span><span class="edchain ${e.chain}">${e.chain}</span><span>${stars(e.level)}</span></div>
          </div>
          <div class="eddetail" style="display:none">${detail(e)}</div>
        </div>`).join("")||`<div class="cstat"><span style="color:var(--muted)">没有匹配的事件</span></div>`;
      listEl.querySelectorAll(".edev").forEach(it=>{
        const head=it.querySelector(".edhead"), det=it.querySelector(".eddetail");
        head.onclick=(e)=>{ if(e.target.closest("a,button")) return; det.style.display=det.style.display==="none"?"block":"none"; };
        it.querySelectorAll(".edcccopy").forEach(btn=>btn.onclick=(ev)=>{ev.stopPropagation();copyText(btn.dataset.c);btn.textContent="已复制";setTimeout(()=>btn.textContent="复制",1000);});
      });
    }
    b.querySelectorAll(".edtab").forEach(t=>t.onclick=()=>{
      if(t.dataset.c==="__sort"){ asc=!asc; t.textContent=asc?"⇅ 时间正序":"⇅ 时间倒序"; render(); return; }
      b.querySelectorAll(".edtab:not([data-c=__sort])").forEach(x=>x.classList.remove("on")); t.classList.add("on"); chain=t.dataset.c; render();
    });
    b.querySelector("#edSearch").addEventListener("input",e=>{ kw=e.target.value.trim().toLowerCase(); render(); });
    render();
  };
})();
