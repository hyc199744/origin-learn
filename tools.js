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
    async function bindTime(user){
      // 走自建 Worker(Etherscan索引查询+KV缓存),秒级返回
      try{
        const j=await fetch(API+"/bindtime?addr="+user.toLowerCase()).then(r=>r.json());
        return (j&&j.ok&&j.time)?new Date(j.time*1000):null;
      }catch(e){ return null; }
    }
    const b=M("查推荐人（绑定关系）",`
      <div class="calc">
        <div class="calc-row" style="grid-template-columns:1fr">
          <label>输入地址，查它绑定的推荐人（上级）
            <input id="rAddr" type="text" placeholder="0x… 粘贴一个钱包地址" spellcheck="false"></label>
        </div>
        <button class="claim2" id="rGo">查 询</button>
        <div class="calc-out" id="rOut" style="margin-top:14px;display:none"></div>
        <p class="calc-note">读社区合约的绑定关系（members），返回这个地址的推荐人钱包和绑定时间——链上真实数据，不跳转。<b style="color:var(--gold-lt)">完整推荐人地址</b>需支付 2 LGNS 解锁，付到指定收款地址后本页自动放行。</p>
      </div>`);
    const out=b.querySelector("#rOut");
    let curAddr="";
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
        `<div class="cstat" id="rTime"><span>绑定时间</span><b style="font-size:14px">查询中…</b></div>`+
        `<div id="rUnlock" style="margin-top:14px"></div>`;
      bindTime(a).then(dt=>{const el=out.querySelector("#rTime b"); if(el) el.textContent=dt?dt.toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}):"未查到（可能是很早或迁移绑定）";});
      renderUnlock();
    }
    function renderUnlock(){
      const el=out.querySelector("#rUnlock"); if(!el) return;
      el.innerHTML=`<button class="claim2" id="rBuy" style="background:linear-gradient(180deg,#c9313a,#8f0c11);border-color:#7a0b12">🔓 支付 2 LGNS 看完整推荐人地址</button>`;
      el.querySelector("#rBuy").onclick=startPay;
    }
    async function startPay(){
      const el=out.querySelector("#rUnlock"); if(!el) return;
      el.innerHTML='<div class="cstat"><span>正在生成订单…</span></div>';
      let o;
      try{ o=await fetch(API+"/order?addr="+curAddr).then(r=>r.json()); }
      catch(e){ el.innerHTML='<div class="cstat"><span style="color:#e0705f">生成订单失败，稍后再试</span></div>'; return; }
      if(!o||!o.ok){ el.innerHTML='<div class="cstat"><span style="color:#e0705f">生成订单失败，稍后再试</span></div>'; setTimeout(renderUnlock,1600); return; }
      el.innerHTML=`
        <style>.rcopy{font:inherit;font-size:11px;cursor:pointer;background:transparent;border:1px solid var(--line);color:var(--soft);border-radius:5px;padding:3px 10px;white-space:nowrap}.rcopy:hover{border-color:var(--gold)}#rQR img,#rQR canvas{margin:0 auto;border:6px solid #fff;border-radius:8px}</style>
        <div style="background:rgba(214,168,75,.06);border:1px solid rgba(214,168,75,.3);border-radius:12px;padding:16px">
          <div style="font-family:var(--serif,serif);color:var(--gold-lt);margin-bottom:12px;font-size:15px">支付解锁 · 完整推荐人地址</div>
          <div class="cstat"><span>精确金额 <i style="color:#e0a24f;font-style:normal">务必一分不差</i></span><b style="font-family:var(--mono);font-size:15px" id="rAmt">${o.amount} LGNS</b></div>
          <div style="display:flex;gap:8px;margin:6px 0 12px;align-items:center;flex-wrap:wrap"><button class="rcopy" data-c="${o.amount}" data-l="复制金额">复制金额</button><span style="font-size:11px;color:var(--muted)">⚠️ 转整数或改动小数将无法识别订单</span></div>
          <div class="cstat" style="margin-bottom:4px"><span>收款地址（Polygon 链）</span></div>
          <div style="display:flex;align-items:center;gap:8px;margin:2px 0 10px"><code style="font-family:var(--mono);color:var(--soft);word-break:break-all;flex:1;font-size:12px">${o.receive}</code><button class="rcopy" data-c="${o.receive}" data-l="复制">复制</button></div>
          <div id="rQR" style="text-align:center;margin:10px 0"></div>
          <div style="font-size:12.5px;color:var(--soft);line-height:1.75">用支持 <b>Polygon</b> 网络的钱包，把<b style="color:var(--bone)">上面那个精确金额</b>的 LGNS 转到收款地址。到账后本页<b style="color:var(--gold-lt)">自动解锁</b>完整地址（约 20–60 秒）。<br><span id="rPayStatus" style="color:var(--gold-lt)">● 等待付款中…</span></div>
        </div>`;
      el.querySelectorAll(".rcopy").forEach(btn=>btn.onclick=()=>{copyText(btn.dataset.c);btn.textContent="已复制 ✓";setTimeout(()=>btn.textContent=btn.dataset.l,1200);});
      try{ if(window.QRCode){ new QRCode(el.querySelector("#rQR"),{text:o.receive,width:148,height:148,colorDark:"#1a1305",colorLight:"#ffffff"}); } }catch(e){}
      const started=Date.now();
      const timer=setInterval(async()=>{
        if(Date.now()-started>15*60*1000){ clearInterval(timer); const s=el.querySelector("#rPayStatus"); if(s)s.innerHTML='<span style="color:#e0705f">● 订单已超时。若已付款请关闭重查，系统仍会认款并解锁。</span>'; return; }
        let c;
        try{ c=await fetch(API+"/checkpay?order="+o.orderId).then(r=>r.json()); }catch(e){ return; }
        if(c&&c.status==="paid"&&c.referrer){
          clearInterval(timer);
          const rf=out.querySelector("#rRef"); if(rf) rf.textContent=short(c.referrer);
          el.innerHTML=
            `<div class="cstat"><span style="color:#8fbf78">✓ 已解锁 · 完整推荐人地址</span></div>`+
            `<div style="display:flex;align-items:center;gap:8px;margin:6px 0 2px"><code style="font-family:var(--mono);color:var(--bone);word-break:break-all;flex:1;font-size:13px">${c.referrer}</code><button class="rcopy" data-c="${c.referrer}" data-l="复制完整地址" style="font:inherit;font-size:11px;cursor:pointer;background:transparent;border:1px solid var(--line);color:var(--soft);border-radius:5px;padding:3px 10px;white-space:nowrap">复制完整地址</button></div>`;
          el.querySelector(".rcopy").onclick=(ev)=>{copyText(c.referrer);ev.target.textContent="已复制 ✓";setTimeout(()=>ev.target.textContent="复制完整地址",1200);};
        }
      }, 5000);
    }
    b.querySelector("#rGo").onclick=go;
    b.querySelector("#rAddr").addEventListener("keydown",e=>{if(e.key==="Enter")go();});
  };
})();
