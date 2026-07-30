/* ═══════════ Web3Origin 个人中心 · 我的链上中心 ═══════════
   钱包连接(注入式) + personal_sign 身份签名(只读·不发交易·不碰私钥/助记词)。
   个人数据(多钱包/监控/收藏/报告/提醒/等级)全部存浏览器 localStorage，不上传、不收集。
   资产/授权读自建 Worker /wallet；行情读 /radar。需真后端的(邮件/TG推送/跨设备同步/公开主页)界面标「预留」。 */
(function(){
"use strict";
/* ---------- i18n ---------- */
try{var _lc=localStorage.getItem("web3origin_locale")||"";if(_lc){window.SITE_LANG=(_lc==="zh-CN")?"zh":_lc;document.documentElement.lang=_lc;if(_lc==="ar")document.documentElement.dir="rtl";}}catch(e){}
function EN(){return (window.SITE_LANG||"zh")!=="zh";}
var T={"zh":{"just_now":"刚刚","min_ago":"分钟前","hour_ago":"小时前","day_ago":"天前","wallet_generic":"钱包","no_wallet":"未检测到钱包插件，请在 MetaMask / OKX / TokenPocket 等钱包内打开","sign_msg_1":"登录 Web3Origin 个人中心\n地址：","sign_msg_2":"\n用途：仅用于身份验证，本操作不会发起任何链上交易、不会转移任何资产。\n时间：","sign_cancelled":"已取消签名，未登录","connect_fail":"连接失败：","user_rejected":"用户拒绝","nav_overview":"概览","nav_assets":"资产","nav_wallets":"我的钱包","nav_monitor":"钱包监控","nav_alerts":"提醒中心","nav_research":"研究收藏","nav_reports":"链上报告","nav_learn":"学习中心","nav_security":"安全中心","nav_rank":"我的等级","mnav_home":"首页","mnav_monitor":"监控","mnav_learn":"学习","mnav_me":"我的","gate_title":"我的链上中心","gate_sub":"连接钱包，管理你自己的链上资产、监控、收藏、学习进度与研究报告——每个 Origin 用户自己的链上工作空间。","connect_wallet":"连接钱包","wallets_hint":"支持 MetaMask · OKX · TokenPocket 等注入式钱包 · WalletConnect（预留）","gate_safe":"🔒 只做<b>身份签名</b>与<b>只读</b>公开数据 · 本站<b>绝不索要</b>你的助记词 / 私钥 / 钱包密码，也<b>不会发起任何交易</b>","brand_full":"起源 · <b>个人中心</b>","nav_feedback":"留言区","nav_academy":"学习学院","nav_radar":"链上雷达","nav_home_site":"返回主站","copy_addr":"复制地址","onchain_record":"链上记录 ↗","disconnect":"断开","addr_copied":"地址已复制","loading":"加载中…","ov_asset_val":"资产估值","ov_monitors":"监控地址","ov_learn":"学习进度","ov_sub":"你的链上工作台一览","no_alerts":"暂无提醒","recent_alerts":"最近提醒","view_all_alerts":"查看全部提醒 ›","alert_price_1":"LGNS 24h 价格变化 ","alert_price_2":"%（阈值 ","alert_price_3":"%）","dir_in":"转入","dir_out":"转出","large_tag":"（大额）","risk_unl_1":"检测到 ","risk_unl_2":" 个无限授权，建议尽快撤销","news_1":"今日 LGNS 约 ","news_buys":"，买 ","news_sells":" / 卖 ","news_count":" 笔","asset_sum_note":"估算总价值（LGNS/sLGNS 按现价，DAI/USDT 按 $1；其它仅计数）","th_token":"代币","th_chain":"链","th_amount":"数量","th_price":"现价","th_value":"估值","no_tokens":"该地址暂无可显示的代币余额","assets_title":"我的资产","assets_sub":"连接地址在 Polygon 与 Anubis 两条链上的公开代币余额","current_tag":"当前","ph_label":"备注名","view_assets":"查看资产","delete":"删除","no_wallets":"还没有添加钱包","wallets_sub":"添加多个地址统一查看（主钱包 / 观察钱包 / 团队钱包）。备注只存在你本地。","ph_add_addr":"粘贴要添加的地址 0x…","ph_label_eg":"备注名（如 观察钱包）","add":"添加","bad_addr":"地址格式不对","already_added":"已添加过","wallet_default":"钱包","added":"已添加","label_saved":"已保存备注","report_saved":"报告已保存","main_wallet":"主钱包","monitor_addr":"监控地址","remove":"移除","no_monitors":"还没有设置监控地址","monitor_sub":"设置要盯的地址与事件类型。<b>打开本页时</b>会检查监控地址的近期链上活动并汇总到「提醒中心」。定时推送到 邮件/Telegram 属常驻后端能力（预留）。","ph_mon_addr":"监控地址 0x…","ph_mon_name":"名称（如 LGNS 大户）","add_monitor":"添加监控","already_monitored":"已在监控","added_monitor":"已加入监控","alerts_sub":"价格波动、监控地址动向、风险授权、链上快讯——打开本页实时计算。","checking":"正在检查…","alert_settings":"提醒设置","price_threshold":"价格波动阈值","large_threshold":"大额转账阈值","web_notify":"网站通知","email":"邮件","ph_email":"邮箱（预留）","reserved_paren":"（预留）","save_settings":"保存设置","alert_note":"邮件 / Telegram 推送需常驻后端，当前为预留项；网站通知即打开本页时的实时汇总。","settings_saved":"设置已保存","alerts_word":"提醒","no_alerts_calm":"暂无提醒，一切平静","g_article":"文章","g_evidence":"证据","g_address":"地址","g_tx":"交易","g_course":"收藏课程","ph_bk_val":"链接 / 地址 / Tx Hash","ph_note":"备注","save_btn":"收藏","no_bookmarks":"还没有收藏。可在上方添加文章/证据/地址/交易，或在学习学院收藏课程。","research_title":"我的研究收藏","research_sub":"把文章、链上证据、关键地址与交易攒成你自己的研究资料库（存在本地）。","enter_content":"请输入内容","saved":"已收藏","view":"查看","download_pdf":"下载 PDF","no_reports":"还没有报告","reports_title":"我的链上报告","reports_sub":"为任意地址生成钱包分析快照（身份 / 资产 / 授权 / 活动），保存到本地，可打印为 PDF。","ph_rep_addr":"要分析的地址（默认当前 ","gen_report":"生成钱包分析报告","rep_flow_note":"资金流报告需跨多跳追踪，属进阶功能（预留）。","generating":"生成中…（首次约 10-25 秒）","risk_high":"高","risk_mid":"中","risk_low":"低","rep_title":"钱包分析报告 ","sum_val":"估值 ","sum_appr":" · 授权 ","sum_unl":"（无限 ","sum_risk":"）· 风险 ","rep_gen_time":"生成时间：","r_addr":"地址","r_type":"类型","r_contract":"合约","r_eoa":"外部账户 EOA","r_first":"首次活跃","r_est_assets":"估算资产","r_tokens":"持有代币","r_appr_total":"授权总数","r_unl":"（无限授权 ","r_risk_score":"风险评分","r_recent_tx":"近期转账","r_time":"时间","r_dir":"方向","rep_disclaimer":"本报告基于公开链上数据自动生成，仅供研究参考，不构成投资建议。","learn_sub":"与 Web3Origin 链上学习学院同步（进度存在本地）。","my_learning":"我的学习","lm_done":"已完成 ","lm_prog":" 课 · 进度 ","lm_fav":" · 收藏 ","lm_lessons":" 课","go_academy":"前往学习学院 ›","level_progress":"各等级进度","security_sub":"检查当前地址的代币授权，识别风险，一键跳转撤销。","checking_appr":"检查授权中…（首次约 10-25 秒，之后有缓存会很快）","safebar":"🔒 Web3Origin 永远不会索要你的助记词、私钥或钱包密码，也不会请求任何转账/授权类签名。","appr_unl":"♾ 无限","appr_limited":"有限","go_revoke":"去撤销 ↗","no_approvals":"当前地址在 Polygon 上未发现代币授权记录","approved_contracts":"已授权合约","th_spender":"被授权方","th_allowance":"额度","th_risk":"风险","th_action":"操作","revoke_note":"撤销通过第三方公开工具 revoke.cash 进行（跳转后由你在自己钱包确认），本站不经手你的任何签名。无限授权风险较高，建议用完即撤。","rank_sub":"Web3Origin Rank：通过学习课程、使用工具、添加监控、生成报告积累成长值。","how_upgrade":"如何升级","up_course":"🎓 完成学习学院课程（每节 +3）","up_wallet":"👛 添加钱包地址（每个 +2）","up_monitor":"📡 设置监控地址（每个 +2）","up_report":"📄 生成链上报告（每份 +5）","up_bookmark":"⭐ 收藏研究内容（每条 +1）","rank_note":"成长值与等级存在你本地浏览器。个人主页（web3origin.com/user/…）与徽章分享为进阶功能，需常驻后端（预留）。","growth_pts":"成长值","to_next":"距下一级还需","max_level":"已满级"},"en":{"just_now":"just now","min_ago":"m ago","hour_ago":"h ago","day_ago":"d ago","wallet_generic":"Wallet","no_wallet":"No wallet detected. Please open inside MetaMask / OKX / TokenPocket or another wallet.","sign_msg_1":"Sign in to Web3Origin Dashboard\nAddress: ","sign_msg_2":"\nPurpose: identity verification only. This does not send any on-chain transaction or move any assets.\nTime: ","sign_cancelled":"Signature cancelled, not signed in","connect_fail":"Connection failed: ","user_rejected":"user rejected","nav_overview":"Overview","nav_assets":"Assets","nav_wallets":"My Wallets","nav_monitor":"Monitor","nav_alerts":"Alerts","nav_research":"Research","nav_reports":"Reports","nav_learn":"Learn","nav_security":"Security","nav_rank":"Level","mnav_home":"Home","mnav_monitor":"Monitor","mnav_learn":"Learn","mnav_me":"Me","gate_title":"My On-chain Hub","gate_sub":"Connect your wallet to manage your own on-chain assets, monitoring, bookmarks, learning progress and research reports — every Origin user's personal on-chain workspace.","connect_wallet":"Connect Wallet","wallets_hint":"Supports MetaMask · OKX · TokenPocket injected wallets · WalletConnect (reserved)","gate_safe":"🔒 Only <b>identity signing</b> and <b>read-only</b> public data · this site <b>never asks</b> for your seed phrase / private key / wallet password, and <b>never sends any transaction</b>","brand_full":"Origin · <b>Dashboard</b>","nav_feedback":"Feedback","nav_academy":"Academy","nav_radar":"Radar","nav_home_site":"Home","copy_addr":"Copy address","onchain_record":"On-chain records ↗","disconnect":"Disconnect","addr_copied":"Address copied","loading":"Loading…","ov_asset_val":"Asset value","ov_monitors":"Monitored","ov_learn":"Progress","ov_sub":"Your on-chain workspace at a glance","no_alerts":"No alerts","recent_alerts":"Recent alerts","view_all_alerts":"View all alerts ›","alert_price_1":"LGNS 24h price change ","alert_price_2":"% (threshold ","alert_price_3":"%)","dir_in":"in","dir_out":"out","large_tag":" (large)","risk_unl_1":"Detected ","risk_unl_2":" unlimited approval(s). Revoke them soon.","news_1":"Today LGNS ~ ","news_buys":", buys ","news_sells":" / sells ","news_count":" tx","asset_sum_note":"Estimated total (LGNS/sLGNS at current price, DAI/USDT at $1; others counted only)","th_token":"Token","th_chain":"Chain","th_amount":"Amount","th_price":"Price","th_value":"Value","no_tokens":"No displayable token balance for this address","assets_title":"My Assets","assets_sub":"Public token balances of the connected address on Polygon and Anubis","current_tag":"Current","ph_label":"Label","view_assets":"View assets","delete":"Delete","no_wallets":"No wallets added yet","wallets_sub":"Add multiple addresses to view together (main / watch / team wallets). Notes stay only on your device.","ph_add_addr":"Paste an address to add 0x…","ph_label_eg":"Label (e.g. Watch wallet)","add":"Add","bad_addr":"Invalid address format","already_added":"Already added","wallet_default":"Wallet","added":"Added","label_saved":"Note saved","report_saved":"Report saved","main_wallet":"Main wallet","monitor_addr":"Monitored address","remove":"Remove","no_monitors":"No monitored addresses yet","monitor_sub":"Set the addresses and event types to watch. <b>When you open this page</b> it checks recent on-chain activity of monitored addresses and summarizes it in Alerts. Scheduled email/Telegram push needs an always-on backend (reserved).","ph_mon_addr":"Address to monitor 0x…","ph_mon_name":"Name (e.g. LGNS whale)","add_monitor":"Add monitor","already_monitored":"Already monitoring","added_monitor":"Added to monitor","alerts_sub":"Price moves, monitored-address activity, risky approvals, on-chain news — computed live when you open this page.","checking":"Checking…","alert_settings":"Alert settings","price_threshold":"Price change threshold","large_threshold":"Large transfer threshold","web_notify":"Web notification","email":"Email","ph_email":"Email (reserved)","reserved_paren":" (reserved)","save_settings":"Save settings","alert_note":"Email / Telegram push needs an always-on backend and is reserved for now; web notification is the live summary shown when you open this page.","settings_saved":"Settings saved","alerts_word":"Alerts","no_alerts_calm":"No alerts — all calm","g_article":"Articles","g_evidence":"Evidence","g_address":"Addresses","g_tx":"Transactions","g_course":"Saved courses","ph_bk_val":"Link / address / Tx hash","ph_note":"Note","save_btn":"Save","no_bookmarks":"No bookmarks yet. Add articles/evidence/addresses/transactions above, or save courses in the Academy.","research_title":"My Research","research_sub":"Build your own research library of articles, on-chain evidence, key addresses and transactions (stored locally).","enter_content":"Please enter content","saved":"Saved","view":"View","download_pdf":"Download PDF","no_reports":"No reports yet","reports_title":"My On-chain Reports","reports_sub":"Generate a wallet analysis snapshot (identity / assets / approvals / activity) for any address, saved locally and printable as PDF.","ph_rep_addr":"Address to analyze (default ","gen_report":"Generate wallet report","rep_flow_note":"Fund-flow reports need multi-hop tracing and are an advanced feature (reserved).","generating":"Generating… (first time ~10-25s)","risk_high":"High","risk_mid":"Mid","risk_low":"Low","rep_title":"Wallet report ","sum_val":"Value ","sum_appr":" · Approvals ","sum_unl":" (unlimited ","sum_risk":") · Risk ","rep_gen_time":"Generated: ","r_addr":"Address","r_type":"Type","r_contract":"Contract","r_eoa":"EOA (external account)","r_first":"First active","r_est_assets":"Est. assets","r_tokens":"Tokens held","r_appr_total":"Total approvals","r_unl":" (unlimited ","r_risk_score":"Risk score","r_recent_tx":"Recent transfers","r_time":"Time","r_dir":"Direction","rep_disclaimer":"This report is auto-generated from public on-chain data, for research reference only, not investment advice.","learn_sub":"Synced with the Web3Origin Academy (progress stored locally).","my_learning":"My learning","lm_done":"Completed ","lm_prog":" lessons · Progress ","lm_fav":" · Saved ","lm_lessons":" lessons","go_academy":"Go to Academy ›","level_progress":"Progress by level","security_sub":"Check token approvals of the current address, spot risks, and jump to revoke in one click.","checking_appr":"Checking approvals… (first time ~10-25s, fast after caching)","safebar":"🔒 Web3Origin will never ask for your seed phrase, private key or wallet password, and will never request any transfer/approval signature.","appr_unl":"♾ Unlimited","appr_limited":"Limited","go_revoke":"Revoke ↗","no_approvals":"No token approvals found for this address on Polygon","approved_contracts":"Approved contracts","th_spender":"Spender","th_allowance":"Allowance","th_risk":"Risk","th_action":"Action","revoke_note":"Revoking is done via the public third-party tool revoke.cash (you confirm in your own wallet after the jump); this site never handles any of your signatures. Unlimited approvals are higher-risk — revoke once done.","rank_sub":"Web3Origin Rank: earn growth points by taking courses, using tools, adding monitors and generating reports.","how_upgrade":"How to level up","up_course":"🎓 Complete Academy courses (+3 each)","up_wallet":"👛 Add wallet addresses (+2 each)","up_monitor":"📡 Set monitored addresses (+2 each)","up_report":"📄 Generate on-chain reports (+5 each)","up_bookmark":"⭐ Save research items (+1 each)","rank_note":"Growth points and level are stored in your local browser. Personal profile page (web3origin.com/user/…) and badge sharing are advanced features needing an always-on backend (reserved).","growth_pts":"Growth points","to_next":"To next level","max_level":"Max level"}};
function t(k){return (EN()?T.en:T.zh)[k]||T.zh[k];}

var W="https://count.web3origin.com";
var DK="origin_dash_v1", AK="origin_dash_addr", ACADK="origin_academy_v1";
var PS="https://polygonscan.com/address/";

/* ---------- 数据层 ---------- */
function db(){try{return JSON.parse(localStorage.getItem(DK))||{};}catch(e){return {};}}
function save(d){try{localStorage.setItem(DK,JSON.stringify(d));}catch(e){}}
function def(){var d=db();d.wallets=d.wallets||[];d.monitors=d.monitors||[];d.bookmarks=d.bookmarks||[];
  d.reports=d.reports||[];d.pref=d.pref||{pricePct:10,largeLGNS:1000,email:"",tg:""};d.seen=d.seen||{};d.profile=d.profile||{nick:"",pub:false};return d;}
function addr(){try{return localStorage.getItem(AK)||"";}catch(e){return "";}}
function setAddr(a){try{if(a)localStorage.setItem(AK,a);else localStorage.removeItem(AK);}catch(e){}}
function acad(){try{return JSON.parse(localStorage.getItem(ACADK))||{done:{},fav:{}};}catch(e){return {done:{},fav:{}};}}

/* ---------- 工具 ---------- */
function short(a){return a&&a.length>12?a.slice(0,6)+"…"+a.slice(-4):(a||"");}
function fUSD(n){if(n==null||isNaN(n))return "—";var a=Math.abs(n);if(a>=1e6)return "$"+(n/1e6).toFixed(2)+"M";if(a>=1e3)return "$"+(n/1e3).toFixed(1)+"K";return "$"+n.toFixed(2);}
function fNum(n){if(n==null||isNaN(n))return "—";if(Math.abs(n)>=1e6)return (n/1e6).toFixed(2)+"M";if(Math.abs(n)>=1e3)return (n/1e3).toFixed(1)+"K";return (+n).toLocaleString("en-US",{maximumFractionDigits:4});}
function ago(ts){if(!ts)return "";var s=Math.floor(Date.now()/1000)-ts;if(s<60)return t("just_now");if(s<3600)return Math.floor(s/60)+t("min_ago");if(s<86400)return Math.floor(s/3600)+t("hour_ago");return Math.floor(s/86400)+t("day_ago");}
function avatarBg(a){a=(a||"0x000000").toLowerCase();var x=parseInt(a.slice(2,8),16)||0,y=parseInt(a.slice(8,14),16)||0;return "linear-gradient(135deg,hsl("+(x%360)+",65%,48%),hsl("+(y%360)+",70%,34%))";}
function chainName(id){var m={"0x1":"Ethereum","0x89":"Polygon","0x1a3a":"Anubis","0x38":"BNB Chain"};return m[id]||("Chain "+(id?parseInt(id,16):"?"));}
function esc(s){return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function toast(m){var t=document.getElementById("dashToast");if(!t){t=document.createElement("div");t.id="dashToast";document.body.appendChild(t);}t.textContent=m;t.className="show";clearTimeout(t._t);t._t=setTimeout(function(){t.className="";},2200);}

/* ---------- 钱包连接 ---------- */
var NET="0x89";
function getEth(){return window.ethereum||null;}
function walletName(){var e=getEth();if(!e)return "";if(e.isMetaMask)return "MetaMask";if(e.isOkxWallet||e.isOKExWallet)return "OKX";if(e.isTokenPocket)return "TokenPocket";return t("wallet_generic");}
async function connect(){
  var e=getEth();
  if(!e){ toast(t("no_wallet")); return; }
  try{
    var accts=await e.request({method:"eth_requestAccounts"});
    var a=(accts&&accts[0]||"").toLowerCase(); if(!a)return;
    try{ NET=await e.request({method:"eth_chainId"}); }catch(_){}
    // 身份签名(仅验证身份，不发交易)
    var msg=t("sign_msg_1")+a+t("sign_msg_2")+new Date().toLocaleString();
    try{ await e.request({method:"personal_sign",params:[msg,a]}); }
    catch(se){ toast(t("sign_cancelled")); return; }
    setAddr(a);
    var d=def(); if(!d.wallets.some(function(w){return w.addr===a;})){ d.wallets.unshift({addr:a,label:t("main_wallet"),added:Date.now()}); save(d); }
    bindEvents(); render();
  }catch(err){ toast(t("connect_fail")+(err&&err.message||t("user_rejected"))); }
}
function disconnect(){ setAddr(""); render(); }
var _bound=false;
function bindEvents(){ var e=getEth(); if(!e||_bound)return; _bound=true;
  if(e.on){ e.on("accountsChanged",function(ac){ if(!ac||!ac.length){disconnect();} else { setAddr(ac[0].toLowerCase()); render(); } });
    e.on("chainChanged",function(id){ NET=id; render(); }); } }

/* ---------- 拉链上数据(Worker /wallet 双链) ---------- */
var _cache={},_acache={};
// 快:只查余额(/assets,约2-3秒) — 资产卡/概览用
async function assetsData(a){
  if(_acache[a]&&Date.now()-_acache[a].t<45000)return _acache[a].d;
  var out={polygon:null,anubis:null};
  try{ var r=await Promise.all([
    fetch(W+"/assets?chain=polygon&addr="+a).then(function(x){return x.json();}),
    fetch(W+"/assets?chain=anubis&addr="+a).then(function(x){return x.json();}) ]);
    out.polygon=r[0]&&r[0].ok?r[0]:null; out.anubis=r[1]&&r[1].ok?r[1]:null;
  }catch(e){}
  _acache[a]={t:Date.now(),d:out}; return out;
}
// 全:含转账/授权(/wallet,首次较慢) — 安全/监控/报告用
async function walletData(a){
  if(_cache[a]&&Date.now()-_cache[a].t<45000)return _cache[a].d;
  var out={polygon:null,anubis:null};
  try{ var r=await Promise.all([
    fetch(W+"/wallet?chain=polygon&addr="+a).then(function(x){return x.json();}),
    fetch(W+"/wallet?chain=anubis&addr="+a).then(function(x){return x.json();}) ]);
    out.polygon=r[0]&&r[0].ok?r[0]:null; out.anubis=r[1]&&r[1].ok?r[1]:null;
  }catch(e){}
  _cache[a]={t:Date.now(),d:out}; return out;
}
var _radar=null;
async function radar(){ if(_radar&&Date.now()-_radar.t<60000)return _radar.d; try{var d=await fetch(W+"/radar").then(function(x){return x.json();});_radar={t:Date.now(),d:d};return d;}catch(e){return null;} }
function priceOf(sym,rd){ var p=(rd&&rd.market&&rd.market.price)||null; if(sym==="DAI"||sym==="USDT")return 1; if(sym==="LGNS"||sym==="sLGNS")return p; return null; }

/* ---------- 等级(Web3Origin Rank) ---------- */
var RANKS=["Web3新人","链上用户","DeFi探索者","链上研究员","Origin专家"];
var RANKS_EN=["Web3 Newcomer","On-chain User","DeFi Explorer","On-chain Researcher","Origin Expert"];
var RTH=[0,15,40,80,140];
function rankInfo(){ var d=def(),ac=acad();
  var done=Object.keys(ac.done||{}).length;
  var pts=done*3 + d.wallets.length*2 + d.monitors.length*2 + d.reports.length*5 + d.bookmarks.length*1;
  var i=0;for(var k=0;k<RTH.length;k++){if(pts>=RTH[k])i=k;}
  var next=i<4?RTH[i+1]:null;
  return {lv:i+1,name:(EN()?RANKS_EN[i]:RANKS[i]),pts:pts,next:next,done:done};
}

/* ---------- 提醒计算(打开时客户端计算) ---------- */
async function computeAlerts(){
  var d=def(),out=[],a=addr();
  var rd=await radar();
  if(rd&&rd.market&&rd.market.change24h!=null&&Math.abs(rd.market.change24h)>=(d.pref.pricePct||10))
    out.push({t:"price",lv:"info",m:t("alert_price_1")+rd.market.change24h.toFixed(1)+t("alert_price_2")+(d.pref.pricePct||10)+t("alert_price_3"),ts:Math.floor(Date.now()/1000)});
  // 监控地址近期转账
  for(var i=0;i<d.monitors.length;i++){ var mo=d.monitors[i];
    try{ var wd=await walletData(mo.addr); var tr=(wd.polygon&&wd.polygon.transfers)||[];
      tr.slice(0,6).forEach(function(x){ if(mo.lastSeenTs&&x.ts<=mo.lastSeenTs)return;
        var big=(x.token==="LGNS"&&x.amount>=(d.pref.largeLGNS||1000));
        if(!mo.lastSeenTs||big||x.amount>0) out.push({t:"monitor",lv:big?"warn":"info",
          m:(mo.label||short(mo.addr))+" "+(x.dir==="in"?t("dir_in"):t("dir_out"))+" "+fNum(x.amount)+" "+(x.token||"")+(big?t("large_tag"):""),ts:x.ts,hash:x.hash}); });
      if(tr[0]){ mo.lastSeenTs=tr[0].ts; }
    }catch(e){}
  }
  save(d);
  // 风险授权
  if(a){ try{ var w=await walletData(a); var ap=(w.polygon&&w.polygon.approvals)||[]; var unl=ap.filter(function(x){return x.unlimited;});
    if(unl.length) out.push({t:"risk",lv:"warn",m:t("risk_unl_1")+unl.length+t("risk_unl_2"),ts:Math.floor(Date.now()/1000)}); }catch(e){} }
  // 新闻:最新日报一句话
  try{ var dl=await fetch(W+"/daily").then(function(x){return x.json();}); if(dl&&dl.ok&&dl.market&&dl.market.price!=null){
    out.push({t:"news",lv:"info",m:t("news_1")+(+dl.market.price).toFixed(3)+" DAI"+(dl.buys!=null?t("news_buys")+dl.buys+t("news_sells")+dl.sells+t("news_count"):""),ts:dl.generatedAt?Math.floor(dl.generatedAt/1000):Math.floor(Date.now()/1000)}); } }catch(e){}
  out.sort(function(x,y){return y.ts-x.ts;});
  return out;
}

/* ═══════════ 渲染 ═══════════ */
var NAV=[["overview","🏠",t("nav_overview")],["assets","💰",t("nav_assets")],["wallets","👛",t("nav_wallets")],["monitor","📡",t("nav_monitor")],
  ["alerts","🔔",t("nav_alerts")],["research","⭐",t("nav_research")],["reports","📄",t("nav_reports")],["learn","🎓",t("nav_learn")],
  ["security","🛡️",t("nav_security")],["rank","🏆",t("nav_rank")]];
var MNAV=[["overview","🏠",t("mnav_home")],["assets","💰",t("nav_assets")],["monitor","📡",t("mnav_monitor")],["learn","🎓",t("mnav_learn")],["rank","🏆",t("mnav_me")]];
var _active="overview";

function render(){
  css(); var root=document.getElementById("dashRoot"); if(!root)return;
  if(!addr()){ root.innerHTML=gateHTML(); wireGate(); return; }
  root.innerHTML=shellHTML();
  wireShell(); go(_active);
}
function gateHTML(){
  var has=!!getEth();
  return '<div class="d-gate">'+topbar()+
    '<div class="d-gate-in"><div class="d-gate-logo">◎</div>'
    +'<h1>'+t("gate_title")+'</h1><p class="d-en">Web3Origin Dashboard</p>'
    +'<p class="d-gate-sub">'+t("gate_sub")+'</p>'
    +'<button class="d-connect" id="dGateConnect">🔗 '+t("connect_wallet")+''+(has?"（"+walletName()+"）":"")+'</button>'
    +'<div class="d-wallets-hint">'+t("wallets_hint")+'</div>'
    +'<div class="d-safe">'+t("gate_safe")+'</div>'
    +'</div></div>';
}
function wireGate(){ var b=document.getElementById("dGateConnect"); if(b)b.onclick=connect; }

function topbar(){
  return '<nav class="d-top"><a class="d-brand" href="/"><img src="/assets/logo.svg" alt=""><span>'+t("brand_full")+'</span></a>'
    +'<span class="d-sp"></span><a href="/tools/onchain-search/" style="color:var(--d-gold,#e8cf7e);font-weight:600">🔍 链上搜索</a><a href="/feedback/">'+t("nav_feedback")+'</a><a href="/academy/">'+t("nav_academy")+'</a><a href="/#radar">'+t("nav_radar")+'</a><a href="/">'+t("nav_home_site")+'</a></nav>';
}
function shellHTML(){
  var a=addr(),d=def(),ri=rankInfo();
  var head='<div class="d-userhead"><div class="d-ava" style="background:'+avatarBg(a)+'"></div>'
    +'<div class="d-uinfo"><div class="d-uaddr">'+short(a)+' <button class="d-copy" data-copy="'+a+'" title="'+t("copy_addr")+'">⧉</button></div>'
    +'<div class="d-umeta"><span class="d-net"><span class="d-dot"></span>'+chainName(NET)+'</span> · <span>Lv.'+ri.lv+' '+ri.name+'</span></div></div>'
    +'<div class="d-uact"><a class="d-mini" href="'+PS+a+'" target="_blank" rel="noopener">'+t("onchain_record")+'</a>'
    +'<button class="d-mini d-dis" id="dDisc">'+t("disconnect")+'</button></div></div>';
  var side='<aside class="d-side">'+NAV.map(function(n){return '<button class="d-navi" data-go="'+n[0]+'"><span>'+n[1]+'</span>'+n[2]+'</button>';}).join("")+'</aside>';
  var mnav='<nav class="d-bottom">'+MNAV.map(function(n){return '<button class="d-bi" data-go="'+n[0]+'"><span>'+n[1]+'</span>'+n[2]+'</button>';}).join("")+'</nav>';
  return topbar()+'<div class="d-body">'+side+'<main class="d-main">'+head+'<div id="dPanel"></div></main></div>'+mnav;
}
function wireShell(){
  document.getElementById("dRootBind")||0;
  document.querySelectorAll("[data-go]").forEach(function(b){b.onclick=function(){go(b.getAttribute("data-go"));};});
  var dc=document.getElementById("dDisc"); if(dc)dc.onclick=disconnect;
  document.querySelectorAll(".d-copy").forEach(function(b){b.onclick=function(){navigator.clipboard&&navigator.clipboard.writeText(b.getAttribute("data-copy"));toast(t("addr_copied"));};});
}
function go(p){ _active=p;
  document.querySelectorAll(".d-navi").forEach(function(b){b.classList.toggle("on",b.getAttribute("data-go")===p);});
  document.querySelectorAll(".d-bi").forEach(function(b){b.classList.toggle("on",b.getAttribute("data-go")===p);});
  var el=document.getElementById("dPanel"); if(!el)return; el.innerHTML='<div class="d-load">'+t("loading")+'</div>';
  var fn={overview:pOverview,assets:pAssets,wallets:pWallets,monitor:pMonitor,alerts:pAlerts,research:pResearch,reports:pReports,learn:pLearn,security:pSecurity,rank:pRank}[p];
  if(fn)fn(el);
}
function panel(el,title,sub,body){ el.innerHTML='<div class="d-phead"><h2>'+title+'</h2>'+(sub?'<p>'+sub+'</p>':'')+'</div>'+body; }

/* ---------- 概览 ---------- */
async function pOverview(el){
  var d=def(),ri=rankInfo(),ac=acad();
  var rd=await radar();
  var wd=await assetsData(addr());
  var val=assetValue(wd,rd);
  var alerts=[];
  if(rd&&rd.market&&rd.market.change24h!=null&&Math.abs(rd.market.change24h)>=(d.pref.pricePct||10))
    alerts.push({t:"price",lv:"info",m:t("alert_price_1")+rd.market.change24h.toFixed(1)+t("alert_price_2")+(d.pref.pricePct||10)+t("alert_price_3"),ts:Math.floor(Date.now()/1000)});
  var acTotal=(window.ACADEMY||[]).length||36, acDone=Object.keys(ac.done||{}).length;
  var cards='<div class="d-stats">'
    +stat("💰",t("ov_asset_val"),fUSD(val),"assets")
    +stat("👛",t("nav_wallets"),d.wallets.length+(EN()?"":" 个"),"wallets")
    +stat("📡",t("ov_monitors"),d.monitors.length+(EN()?"":" 个"),"monitor")
    +stat("🎓",t("ov_learn"),acDone+"/"+acTotal,"learn")
    +stat("⭐",t("nav_research"),d.bookmarks.length+(EN()?"":" 条"),"research")
    +stat("🏆",t("nav_rank"),"Lv."+ri.lv,"rank")+'</div>';
  if(_active!=="overview")return;
  var al=alerts.slice(0,5).map(alertRow).join("")||'<div class="d-empty">'+t("no_alerts")+'</div>';
  panel(el,t("nav_overview"),t("ov_sub"),
    cards+'<div class="d-2col"><div class="d-card"><h3>🔔 '+t("recent_alerts")+'</h3>'+al+'<button class="d-more" data-go="alerts">'+t("view_all_alerts")+'</button></div>'
    +'<div class="d-card"><h3>🏆 '+t("nav_rank")+'</h3>'+rankBody(ri)+'</div></div>');
  wireShell(); document.querySelectorAll(".d-stat,[data-go]").forEach(function(b){var g=b.getAttribute("data-go");if(g)b.onclick=function(){go(g);};});
}
function stat(ic,label,val,go){return '<button class="d-stat" data-go="'+go+'"><div class="d-stat-ic">'+ic+'</div><div class="d-stat-v">'+val+'</div><div class="d-stat-l">'+label+'</div></button>';}
function assetValue(wd,rd){ var v=0; ["polygon","anubis"].forEach(function(c){ var w=wd&&wd[c]; if(!w)return;
  (w.tokens||[]).forEach(function(tk){var p=priceOf(tk.sym,rd);if(p!=null)v+=tk.amount*p;});
  if(w.native&&(w.native.sym==="DAI"))v+=w.native.amount; }); return v; }

/* ---------- 资产 ---------- */
async function pAssets(el){
  var rd=await radar(), wd=await assetsData(addr());
  var rows=[],total=0;
  ["polygon","anubis"].forEach(function(c){ var w=wd&&wd[c]; if(!w)return;
    if(w.native&&w.native.amount>0){ var pv=w.native.sym==="DAI"?w.native.amount:null; if(pv!=null)total+=pv;
      rows.push({sym:w.native.sym,chain:c,amt:w.native.amount,val:pv}); }
    (w.tokens||[]).forEach(function(tk){ if(tk.amount<=0)return; var p=priceOf(tk.sym,rd); var val=p!=null?tk.amount*p:null; if(val)total+=val;
      rows.push({sym:tk.sym,chain:c,amt:tk.amount,val:val,price:p}); }); });
  // 合并同名(跨链)
  rows.sort(function(a,b){return (b.val||0)-(a.val||0);});
  var chg=rd&&rd.market&&rd.market.change24h;
  var body='<div class="d-card d-asset-sum"><div class="d-asset-total">'+fUSD(total)+'</div><div class="d-asset-sub">'+t("asset_sum_note")+''
    +(chg!=null?' · LGNS 24h <b class="'+(chg>=0?"up":"dn")+'">'+(chg>=0?"+":"")+chg.toFixed(1)+'%</b>':'')+'</div></div>';
  if(_active!=="assets")return;
  body+='<div class="d-card"><table class="d-tbl"><thead><tr><th>'+t("th_token")+'</th><th>'+t("th_chain")+'</th><th>'+t("th_amount")+'</th><th>'+t("th_price")+'</th><th>'+t("th_value")+'</th></tr></thead><tbody>'
    +(rows.length?rows.map(function(r){return '<tr><td><b>'+esc(r.sym)+'</b></td><td><span class="d-chip '+r.chain+'">'+(r.chain==="polygon"?"Polygon":"Anubis")+'</span></td>'
      +'<td>'+fNum(r.amt)+'</td><td>'+(r.price!=null?"$"+(+r.price).toFixed(4):"—")+'</td><td>'+(r.val!=null?fUSD(r.val):"—")+'</td></tr>';}).join("")
      :'<tr><td colspan="5" class="d-empty">'+t("no_tokens")+'</td></tr>')+'</tbody></table></div>';
  panel(el,t("assets_title"),t("assets_sub"),body);
}

/* ---------- 我的钱包 ---------- */
function pWallets(el){
  var d=def();
  var list=d.wallets.map(function(w,i){return '<div class="d-wrow"><div class="d-ava sm" style="background:'+avatarBg(w.addr)+'"></div>'
    +'<div class="d-wmid"><input class="d-wlabel" data-i="'+i+'" value="'+esc(w.label||"")+'" placeholder="'+t("ph_label")+'"><div class="d-waddr">'+esc(w.addr)+(w.addr===addr()?' <span class="d-tag-cur">'+t("current_tag")+'</span>':'')+'</div></div>'
    +'<div class="d-wact"><button class="d-mini" data-view="'+esc(w.addr)+'">'+t("view_assets")+'</button><button class="d-mini d-del" data-del="'+i+'">'+t("delete")+'</button></div></div>';}).join("")
    ||'<div class="d-empty">'+t("no_wallets")+'</div>';
  panel(el,t("nav_wallets"),t("wallets_sub"),
    '<div class="d-card"><div class="d-addwrap"><input id="dNewAddr" placeholder="'+t("ph_add_addr")+'"><input id="dNewLabel" placeholder="'+t("ph_label_eg")+'" style="max-width:160px"><button class="d-btn" id="dAddW">'+t("add")+'</button></div></div>'
    +'<div class="d-card">'+list+'</div>');
  document.getElementById("dAddW").onclick=function(){ var a=(document.getElementById("dNewAddr").value||"").trim().toLowerCase();
    if(!/^0x[0-9a-f]{40}$/.test(a)){toast(t("bad_addr"));return;}
    var d=def(); if(d.wallets.some(function(w){return w.addr===a;})){toast(t("already_added"));return;}
    d.wallets.push({addr:a,label:(document.getElementById("dNewLabel").value||"").trim()||t("wallet_default"),added:Date.now()});save(d);go("wallets");toast(t("added")); };
  el.querySelectorAll(".d-wlabel").forEach(function(inp){inp.onchange=function(){var d=def();d.wallets[+inp.getAttribute("data-i")].label=inp.value;save(d);toast(t("label_saved"));};});
  el.querySelectorAll("[data-del]").forEach(function(b){b.onclick=function(){var d=def();d.wallets.splice(+b.getAttribute("data-del"),1);save(d);go("wallets");};});
  el.querySelectorAll("[data-view]").forEach(function(b){b.onclick=function(){setAddr(b.getAttribute("data-view"));_cache={};render();};});
}

/* ---------- 钱包监控 ---------- */
function pMonitor(el){
  var d=def();
  var list=d.monitors.map(function(m,i){var wt=m.watch||{};
    return '<div class="d-mrow"><div class="d-mmid"><div class="d-maddr"><b>'+esc(m.label||t("monitor_addr"))+'</b> '+short(m.addr)+'</div>'
    +'<div class="d-mtags">'+(EN()?["transfer:Transfer","buy:Buy","sell:Sell","stake:Stake","approval:Approval"]:["transfer:转账","buy:买入","sell:卖出","stake:质押","approval:授权"]).map(function(t){var k=t.split(":")[0];return '<label class="d-mt"><input type="checkbox" data-i="'+i+'" data-k="'+k+'"'+(wt[k]?" checked":"")+'>'+t.split(":")[1]+'</label>';}).join("")+'</div></div>'
    +'<button class="d-mini d-del" data-mdel="'+i+'">'+t("remove")+'</button></div>';}).join("")||'<div class="d-empty">'+t("no_monitors")+'</div>';
  panel(el,t("nav_monitor"),t("monitor_sub"),
    '<div class="d-card"><div class="d-addwrap"><input id="dMonAddr" placeholder="'+t("ph_mon_addr")+'"><input id="dMonLabel" placeholder="'+t("ph_mon_name")+'" style="max-width:160px"><button class="d-btn" id="dAddM">'+t("add_monitor")+'</button></div></div>'
    +'<div class="d-card">'+list+'</div>');
  document.getElementById("dAddM").onclick=function(){var a=(document.getElementById("dMonAddr").value||"").trim().toLowerCase();
    if(!/^0x[0-9a-f]{40}$/.test(a)){toast(t("bad_addr"));return;}var d=def();
    if(d.monitors.some(function(m){return m.addr===a;})){toast(t("already_monitored"));return;}
    d.monitors.push({addr:a,label:(document.getElementById("dMonLabel").value||"").trim()||t("monitor_addr"),watch:{transfer:true,buy:true,sell:true,stake:false,approval:true},lastSeenTs:0});save(d);go("monitor");toast(t("added_monitor"));};
  el.querySelectorAll(".d-mt input").forEach(function(c){c.onchange=function(){var d=def();var m=d.monitors[+c.getAttribute("data-i")];m.watch=m.watch||{};m.watch[c.getAttribute("data-k")]=c.checked;save(d);};});
  el.querySelectorAll("[data-mdel]").forEach(function(b){b.onclick=function(){var d=def();d.monitors.splice(+b.getAttribute("data-mdel"),1);save(d);go("monitor");};});
}

/* ---------- 提醒中心 ---------- */
async function pAlerts(el){
  var d=def();
  panel(el,t("nav_alerts"),t("alerts_sub"),'<div class="d-card"><div class="d-load">'+t("checking")+'</div></div>'
    +'<div class="d-card"><h3>⚙️ '+t("alert_settings")+'</h3><div class="d-pref">'
    +'<label>'+t("price_threshold")+' <input type="number" id="dPP" value="'+(d.pref.pricePct||10)+'" min="1" max="90"> %</label>'
    +'<label>'+t("large_threshold")+' <input type="number" id="dPL" value="'+(d.pref.largeLGNS||1000)+'"> LGNS</label></div>'
    +'<div class="d-pref2"><label class="d-ch"><input type="checkbox" checked disabled> '+t("web_notify")+'</label>'
    +'<label class="d-ch"><input type="checkbox" id="dChMail"'+(d.pref.email?" checked":"")+' disabled> '+t("email")+' <input id="dMail" placeholder="'+t("ph_email")+'" value="'+esc(d.pref.email||"")+'"></label>'
    +'<label class="d-ch"><input type="checkbox" disabled> Telegram'+t("reserved_paren")+'</label></div>'
    +'<button class="d-btn" id="dSavePref">'+t("save_settings")+'</button><div class="d-note">'+t("alert_note")+'</div></div>');
  document.getElementById("dSavePref").onclick=function(){var d=def();d.pref.pricePct=+document.getElementById("dPP").value||10;d.pref.largeLGNS=+document.getElementById("dPL").value||1000;d.pref.email=document.getElementById("dMail").value.trim();save(d);toast(t("settings_saved"));go("alerts");};
  var alerts=await computeAlerts();
  if(_active!=="alerts")return;
  var box=el.querySelector(".d-card .d-load"); if(box){ box.parentNode.innerHTML='<h3>🔔 '+t("alerts_word")+'（'+alerts.length+'）</h3>'+(alerts.length?alerts.map(alertRow).join(""):'<div class="d-empty">'+t("no_alerts_calm")+'</div>'); }
}
function alertRow(a){var ic={price:"📈",monitor:"📡",risk:"⚠️",news:"📰"}[a.t]||"🔹";
  return '<div class="d-alert '+(a.lv||"info")+'"><span class="d-al-ic">'+ic+'</span><span class="d-al-m">'+esc(a.m)+'</span>'
    +(a.hash?'<a class="d-al-x" href="https://polygonscan.com/tx/'+a.hash+'" target="_blank" rel="noopener">↗</a>':'')
    +'<span class="d-al-t">'+ago(a.ts)+'</span></div>';}

/* ---------- 研究收藏 ---------- */
function pResearch(el){
  var d=def(),ac=acad();
  var favCourses=(window.ACADEMY||[]).filter(function(c){return ac.fav&&ac.fav[c.id];});
  var groups={article:"📄 "+t("g_article"),evidence:"🔎 "+t("g_evidence"),address:"👛 "+t("g_address"),tx:"🔗 "+t("g_tx"),course:"🎓 "+t("g_course")};
  var items=d.bookmarks.slice();
  favCourses.forEach(function(c){items.push({type:"course",value:c.slug,label:(EN()&&c.title_en?c.title_en:c.title),note:"Level "+c.level});});
  var byType={};items.forEach(function(b){(byType[b.type]=byType[b.type]||[]).push(b);});
  var body='<div class="d-card"><div class="d-addwrap"><select id="dBkType" class="d-sel"><option value="article">'+t("g_article")+'</option><option value="evidence">'+t("g_evidence")+'</option><option value="address">'+t("g_address")+'</option><option value="tx">'+t("g_tx")+'</option></select>'
    +'<input id="dBkVal" placeholder="'+t("ph_bk_val")+'"><input id="dBkNote" placeholder="'+t("ph_note")+'" style="max-width:140px"><button class="d-btn" id="dAddBk">'+t("save_btn")+'</button></div></div>';
  Object.keys(groups).forEach(function(tp){ var arr=byType[tp]; if(!arr||!arr.length)return;
    body+='<div class="d-card"><h3>'+groups[tp]+'（'+arr.length+'）</h3>'+arr.map(function(b,i){
      var link=b.type==="address"?("https://polygonscan.com/address/"+b.value):b.type==="tx"?("https://polygonscan.com/tx/"+b.value):b.type==="course"?("/academy/"+b.value+"/"):b.value;
      return '<div class="d-bk"><a class="d-bk-l" href="'+esc(link)+'" target="_blank" rel="noopener">'+esc(b.label||b.value)+'</a>'
        +(b.note?'<span class="d-bk-n">'+esc(b.note)+'</span>':'')
        +(b.type!=="course"?'<button class="d-bk-x" data-bkdel="'+d.bookmarks.indexOf(b)+'">✕</button>':'')+'</div>';}).join("")+'</div>';});
  if(!items.length)body+='<div class="d-empty">'+t("no_bookmarks")+'</div>';
  panel(el,t("research_title"),t("research_sub"),body);
  document.getElementById("dAddBk").onclick=function(){var v=(document.getElementById("dBkVal").value||"").trim();if(!v){toast(t("enter_content"));return;}
    var d=def();d.bookmarks.unshift({type:document.getElementById("dBkType").value,value:v,label:v.length>50?v.slice(0,50)+"…":v,note:(document.getElementById("dBkNote").value||"").trim(),added:Date.now()});save(d);go("research");toast(t("saved"));};
  el.querySelectorAll("[data-bkdel]").forEach(function(b){b.onclick=function(){var d=def();d.bookmarks.splice(+b.getAttribute("data-bkdel"),1);save(d);go("research");};});
}

/* ---------- 链上报告 ---------- */
async function pReports(el){
  var d=def();
  var list=d.reports.map(function(r){return '<div class="d-rep"><div class="d-rep-t"><b>'+esc(r.title)+'</b><span>'+new Date(r.created).toLocaleString()+'</span></div>'
    +'<div class="d-rep-b">'+esc(r.summary||"")+'</div><div class="d-rep-act"><button class="d-mini" data-rview="'+r.id+'">'+t("view")+'</button>'
    +'<button class="d-mini" data-rprint="'+r.id+'">'+t("download_pdf")+'</button><button class="d-mini d-del" data-rdel="'+r.id+'">'+t("delete")+'</button></div></div>';}).join("")||'<div class="d-empty">'+t("no_reports")+'</div>';
  panel(el,t("reports_title"),t("reports_sub"),
    '<div class="d-card"><div class="d-addwrap"><input id="dRepAddr" placeholder="'+t("ph_rep_addr")+''+short(addr())+'）"><button class="d-btn" id="dGenRep">'+t("gen_report")+'</button></div><div class="d-note">'+t("rep_flow_note")+'</div></div>'
    +'<div class="d-card">'+list+'</div>');
  document.getElementById("dGenRep").onclick=async function(){ var a=(document.getElementById("dRepAddr").value||"").trim().toLowerCase()||addr();
    if(!/^0x[0-9a-f]{40}$/.test(a)){toast(t("bad_addr"));return;} toast(t("generating"));
    var rd=await radar(),wd=await walletData(a); var w=wd.polygon||{}; var ap=(w.approvals||[]),unl=ap.filter(function(x){return x.unlimited;});
    var val=assetValue(wd,rd); var risk=unl.length?t("risk_high"):(ap.length?t("risk_mid"):t("risk_low"));
    var toks=[]; ["polygon","anubis"].forEach(function(c){var ww=wd[c];if(ww)(ww.tokens||[]).forEach(function(t){if(t.amount>0)toks.push(t.sym+" "+fNum(t.amount)+"("+(c==="polygon"?"Poly":"ANB")+")");});});
    var rep={id:"R"+Date.now(),kind:"wallet",addr:a,title:t("rep_title")+short(a),created:Date.now(),
      summary:t("sum_val")+fUSD(val)+t("sum_appr")+ap.length+t("sum_unl")+unl.length+t("sum_risk")+risk,
      data:{addr:a,isContract:!!w.isContract,firstTs:w.firstTs,value:val,tokens:toks,approvals:ap.length,unlimited:unl.length,risk:risk,
        transfers:(w.transfers||[]).slice(0,10)}};
    var d=def();d.reports.unshift(rep);save(d);go("reports");toast(t("report_saved"));};
  el.querySelectorAll("[data-rdel]").forEach(function(b){b.onclick=function(){var d=def();d.reports=d.reports.filter(function(r){return r.id!==b.getAttribute("data-rdel");});save(d);go("reports");};});
  el.querySelectorAll("[data-rview]").forEach(function(b){b.onclick=function(){showReport(b.getAttribute("data-rview"));};});
  el.querySelectorAll("[data-rprint]").forEach(function(b){b.onclick=function(){printReport(b.getAttribute("data-rprint"));};});
}
function findRep(id){return def().reports.filter(function(r){return r.id===id;})[0];}
function reportHTML(r){var dt=r.data||{};
  return '<h2>'+esc(r.title)+'</h2><p>'+t("rep_gen_time")+''+new Date(r.created).toLocaleString()+'</p>'
    +'<table class="d-tbl"><tr><th>'+t("r_addr")+'</th><td>'+esc(dt.addr)+'</td></tr>'
    +'<tr><th>'+t("r_type")+'</th><td>'+(dt.isContract?t("r_contract"):t("r_eoa"))+'</td></tr>'
    +'<tr><th>'+t("r_first")+'</th><td>'+(dt.firstTs?new Date(dt.firstTs*1000).toLocaleDateString():"—")+'</td></tr>'
    +'<tr><th>'+t("r_est_assets")+'</th><td>'+fUSD(dt.value)+'</td></tr>'
    +'<tr><th>'+t("r_tokens")+'</th><td>'+(dt.tokens&&dt.tokens.length?esc(dt.tokens.join("、")):"—")+'</td></tr>'
    +'<tr><th>'+t("r_appr_total")+'</th><td>'+dt.approvals+t("r_unl")+dt.unlimited+'）</td></tr>'
    +'<tr><th>'+t("r_risk_score")+'</th><td><b>'+dt.risk+'</b></td></tr></table>'
    +'<h3>'+t("r_recent_tx")+'</h3><table class="d-tbl"><thead><tr><th>'+t("r_time")+'</th><th>'+t("r_dir")+'</th><th>'+t("th_amount")+'</th><th>'+t("th_token")+'</th></tr></thead><tbody>'
    +((dt.transfers||[]).map(function(x){return '<tr><td>'+new Date(x.ts*1000).toLocaleDateString()+'</td><td>'+(x.dir==="in"?t("dir_in"):t("dir_out"))+'</td><td>'+fNum(x.amount)+'</td><td>'+esc(x.token||"")+'</td></tr>';}).join("")||'<tr><td colspan="4">—</td></tr>')
    +'</tbody></table><p class="d-note">'+t("rep_disclaimer")+'</p>';
}
function showReport(id){var r=findRep(id);if(!r)return;var m=document.createElement("div");m.className="d-modal";m.innerHTML='<div class="d-modal-in"><button class="d-modal-x">✕</button><div class="d-rep-doc">'+reportHTML(r)+'</div></div>';document.body.appendChild(m);m.querySelector(".d-modal-x").onclick=function(){m.remove();};m.onclick=function(e){if(e.target===m)m.remove();};}
function printReport(id){var r=findRep(id);if(!r)return;var w=window.open("","_blank");w.document.write('<html><head><meta charset="utf-8"><title>'+esc(r.title)+'</title><style>body{font-family:system-ui;max-width:720px;margin:30px auto;color:#222;padding:0 20px}h2{border-bottom:2px solid #1c8f2d;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{text-align:left;padding:7px 10px;border-bottom:1px solid #ddd}.d-note{color:#888;font-size:12px}</style></head><body>'+reportHTML(r)+'<script>window.onload=function(){window.print();}<\/script></body></html>');w.document.close();}

/* ---------- 学习中心 ---------- */
function pLearn(el){
  var ac=acad(),acad_=window.ACADEMY||[];var total=acad_.length||36,done=Object.keys(ac.done||{}).length;
  var favN=Object.keys(ac.fav||{}).length;var pct=total?Math.round(done/total*100):0;
  var LV=EN()?["Web3 Novice","On-chain User","DeFi Explorer","On-chain Analyst","Web3 Researcher"]:["Web3新人","链上用户","DeFi探索者","链上分析师","Web3研究者"],TH=[0,7,15,23,31];var li=0;for(var k=0;k<TH.length;k++){if(done>=TH[k])li=k;}
  var byLvl={};acad_.forEach(function(c){(byLvl[c.level]=byLvl[c.level]||[]).push(c);});
  var levels="";[1,2,3,4,5].forEach(function(lv){var cs=byLvl[lv]||[];var dn=cs.filter(function(c){return ac.done&&ac.done[c.id];}).length;
    levels+='<div class="d-lvrow"><span class="d-lvname">Level '+lv+'</span><div class="d-lvbar"><div style="width:'+(cs.length?dn/cs.length*100:0)+'%"></div></div><span class="d-lvn">'+dn+'/'+cs.length+'</span></div>';});
  panel(el,t("nav_learn"),t("learn_sub"),
    '<div class="d-2col"><div class="d-card"><h3>🎓 '+t("my_learning")+'</h3>'
    +'<div class="d-learn-big">Lv.'+(li+1)+' <span>'+LV[li]+'</span></div>'
    +'<div class="d-bar"><div style="width:'+pct+'%"></div></div>'
    +'<div class="d-learn-meta">'+t("lm_done")+'<b>'+done+'</b> / '+total+t("lm_prog")+'<b>'+pct+'%</b>'+t("lm_fav")+'<b>'+favN+'</b>'+t("lm_lessons")+'</div>'
    +'<a class="d-btn" href="/academy/">'+t("go_academy")+'</a></div>'
    +'<div class="d-card"><h3>'+t("level_progress")+'</h3>'+levels+'</div></div>');
}

/* ---------- 安全中心 ---------- */
async function pSecurity(el){
  panel(el,t("nav_security"),t("security_sub"),'<div class="d-card"><div class="d-load">'+t("checking_appr")+'</div></div>'
    +'<div class="d-safebar">'+t("safebar")+'</div>');
  var wd=await walletData(addr()); var ap=(wd.polygon&&wd.polygon.approvals)||[];
  ap.sort(function(a,b){return (b.unlimited?1:0)-(a.unlimited?1:0);});
  var rows=ap.length?ap.map(function(x){var risk=x.unlimited?t("risk_high"):t("risk_mid");
    return '<tr class="'+(x.unlimited?"hi":"")+'"><td><b>'+esc(x.token)+'</b></td><td class="d-mono">'+short(x.spender)+'</td>'
      +'<td>'+(x.unlimited?t("appr_unl"):t("appr_limited"))+'</td><td><span class="d-risk '+(x.unlimited?"hi":"mid")+'">'+risk+'</span></td>'
      +'<td><a class="d-mini" href="https://revoke.cash/address/'+addr()+'?chainId=137" target="_blank" rel="noopener">'+t("go_revoke")+'</a></td></tr>';}).join("")
    :'<tr><td colspan="5" class="d-empty">'+t("no_approvals")+'</td></tr>';
  if(_active!=="security")return;
  var box=el.querySelector(".d-card .d-load");
  if(box)box.parentNode.innerHTML='<h3>🛡️ '+t("approved_contracts")+'（'+ap.length+'）</h3><table class="d-tbl"><thead><tr><th>'+t("th_token")+'</th><th>'+t("th_spender")+'</th><th>'+t("th_allowance")+'</th><th>'+t("th_risk")+'</th><th>'+t("th_action")+'</th></tr></thead><tbody>'+rows+'</tbody></table>'
    +'<div class="d-note">'+t("revoke_note")+'</div>';
}

/* ---------- 我的等级 ---------- */
function pRank(el){ var ri=rankInfo();
  panel(el,t("nav_rank"),t("rank_sub"),
    '<div class="d-card">'+rankBody(ri)+'</div>'
    +'<div class="d-card"><h3>'+t("how_upgrade")+'</h3><ul class="d-uplist"><li>'+t("up_course")+'</li><li>'+t("up_wallet")+'</li><li>'+t("up_monitor")+'</li><li>'+t("up_report")+'</li><li>'+t("up_bookmark")+'</li></ul>'
    +'<div class="d-note">'+t("rank_note")+'</div></div>');
}
function rankBody(ri){var pct=ri.next?Math.min(100,Math.round((ri.pts-RTH[ri.lv-1])/(ri.next-RTH[ri.lv-1])*100)):100;
  return '<div class="d-rank-big">🏆 Lv.'+ri.lv+' <span>'+ri.name+'</span></div>'
    +'<div class="d-bar"><div style="width:'+pct+'%"></div></div>'
    +'<div class="d-rank-meta">'+t("growth_pts")+' <b>'+ri.pts+'</b>'+(ri.next?' · '+t("to_next")+' <b>'+(ri.next-ri.pts)+'</b>':' · '+t("max_level")+'')+'</div>'
    +'<div class="d-rank-ladder">'+RANKS.map(function(n,i){return '<span class="'+(i+1===ri.lv?"on":"")+'">Lv'+(i+1)+' '+(EN()?RANKS_EN[i]:n)+'</span>';}).join("")+'</div>';}

/* ---------- 样式 ---------- */
function css(){ if(document.getElementById("dashCss"))return; var s=document.createElement("style");s.id="dashCss";
s.textContent=[
":root{--ob:#050303;--gold:#D6A84B;--gold-lt:#f0d48a;--bone:#F1DFC0;--ink:#e8d9be;--soft:#b79c74;--muted:#7c6a4f;--line:#3a2313;--green:#25C96F;--green-lt:#76FF36;--serif:'STZhongsong','Songti SC',Georgia,serif;--sans:'Microsoft YaHei','PingFang SC',system-ui,sans-serif}",
"*{box-sizing:border-box}body{margin:0;background:radial-gradient(1100px 560px at 50% -10%,#0f2318,#050303 60%) fixed,#050303;color:var(--ink);font-family:var(--sans);line-height:1.7}",
"a{color:var(--gold-lt);text-decoration:none}button{font-family:inherit}",
".d-top{display:flex;align-items:center;gap:14px;padding:12px 20px;border-bottom:1px solid var(--line);position:sticky;top:0;background:rgba(5,3,3,.92);backdrop-filter:blur(8px);z-index:30}",
".d-brand{display:flex;align-items:center;gap:9px;color:var(--bone);font-family:var(--serif);font-size:16px}.d-brand img{width:25px;height:25px}.d-brand b{color:var(--green)}",
".d-top a{font-size:13px;color:var(--soft)}.d-sp{margin-left:auto}",
/* gate */
".d-gate{min-height:100vh}.d-gate-in{max-width:560px;margin:0 auto;padding:60px 22px;text-align:center}",
".d-gate-logo{font-size:52px;color:var(--green);text-shadow:0 0 30px rgba(37,201,111,.5)}",
".d-gate h1{font-family:var(--serif);font-size:34px;color:var(--gold-lt);margin:14px 0 2px}",
".d-en{letter-spacing:.24em;color:var(--green);font-size:13px;text-transform:uppercase;margin:0}",
".d-gate-sub{color:var(--soft);font-size:14.5px;margin:16px 0 24px}",
".d-connect{background:linear-gradient(180deg,#1c8f2d,#0d3a1c);border:1px solid var(--green);color:#fff;font-size:16px;font-weight:700;padding:14px 34px;border-radius:12px;cursor:pointer;box-shadow:0 8px 30px rgba(37,201,111,.25)}",
".d-connect:hover{background:#1c8f2d}.d-wallets-hint{color:var(--muted);font-size:12px;margin:14px 0}",
".d-safe{margin-top:22px;background:rgba(37,201,111,.06);border:1px solid rgba(37,201,111,.25);border-radius:11px;padding:13px 16px;font-size:12.5px;color:var(--soft);line-height:1.8}.d-safe b{color:var(--green-lt)}",
/* shell */
".d-body{display:flex;max-width:1200px;margin:0 auto;min-height:80vh}",
".d-side{flex:0 0 190px;padding:16px 10px;border-right:1px solid var(--line)}",
".d-navi{display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;color:var(--soft);font-size:14px;padding:10px 13px;border-radius:9px;cursor:pointer;text-align:left;margin-bottom:2px}",
".d-navi span{font-size:16px}.d-navi:hover{background:rgba(214,168,75,.06);color:var(--bone)}.d-navi.on{background:rgba(37,201,111,.12);color:var(--green-lt);font-weight:600}",
".d-main{flex:1;padding:18px 22px;min-width:0}",
".d-userhead{display:flex;align-items:center;gap:13px;background:linear-gradient(160deg,#100e0b,#0a0807);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin-bottom:16px}",
".d-ava{width:46px;height:46px;border-radius:50%;flex:0 0 auto;border:2px solid var(--line)}.d-ava.sm{width:34px;height:34px}",
".d-uinfo{flex:1;min-width:0}.d-uaddr{font-size:16px;color:var(--bone);font-weight:600;font-family:var(--serif)}",
".d-copy{background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px}.d-copy:hover{color:var(--gold-lt)}",
".d-umeta{font-size:12.5px;color:var(--muted);margin-top:2px}.d-net{color:var(--green)}.d-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 6px var(--green);margin-right:4px}",
".d-uact{display:flex;flex-direction:column;gap:6px}",
".d-mini{background:#12100c;border:1px solid var(--line);border-radius:7px;color:var(--gold-lt);font-size:12px;padding:5px 11px;cursor:pointer;white-space:nowrap;text-align:center}.d-mini:hover{border-color:var(--green);text-decoration:none}.d-dis{color:#e56a54}.d-del{color:#e56a54}",
".d-phead{margin-bottom:14px}.d-phead h2{font-family:var(--serif);color:var(--gold-lt);font-size:22px;margin:0}.d-phead p{color:var(--muted);font-size:12.5px;margin:4px 0 0}",
".d-card{background:linear-gradient(160deg,#100e0b,#0a0807);border:1px solid var(--line);border-radius:13px;padding:15px 17px;margin-bottom:13px}",
".d-card h3{font-size:14px;color:var(--gold-lt);margin:0 0 11px;font-weight:700}",
".d-2col{display:grid;grid-template-columns:1fr 1fr;gap:13px}",
".d-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;margin-bottom:14px}",
".d-stat{background:linear-gradient(160deg,#12100c,#0a0807);border:1px solid var(--line);border-radius:12px;padding:14px;cursor:pointer;text-align:left;transition:.15s}.d-stat:hover{border-color:var(--green);transform:translateY(-2px)}",
".d-stat-ic{font-size:20px}.d-stat-v{font-size:21px;font-weight:800;color:var(--bone);margin-top:5px}.d-stat-l{font-size:12px;color:var(--muted)}",
".d-empty{color:var(--muted);font-size:13px;text-align:center;padding:18px}.d-load{color:var(--soft);font-size:13px;text-align:center;padding:16px}",
".d-tbl{width:100%;border-collapse:collapse;font-size:13px}.d-tbl th{color:var(--muted);font-weight:400;text-align:left;padding:8px 9px;border-bottom:1px solid var(--line);font-size:12px}",
".d-tbl td{padding:9px 9px;border-bottom:1px solid rgba(58,35,19,.5);color:var(--ink)}.d-tbl td b{color:var(--bone)}",
".d-chip{font-size:10.5px;padding:1px 7px;border-radius:5px;background:#1a130b;color:var(--soft)}.d-chip.polygon{color:#a98bff}.d-chip.anubis{color:#3ad6c7}",
".d-asset-sum{text-align:center}.d-asset-total{font-size:34px;font-weight:800;color:var(--green-lt)}.d-asset-sub{font-size:11.5px;color:var(--muted);margin-top:3px}.d-asset-sub .up{color:var(--green)}.d-asset-sub .dn{color:#e56a54}",
".d-addwrap{display:flex;gap:8px;flex-wrap:wrap}.d-addwrap input,.d-sel{flex:1;min-width:120px;background:#08110c;border:1px solid var(--line);border-radius:8px;color:var(--bone);padding:9px 11px;font:inherit;font-size:13px}.d-addwrap input:focus{outline:none;border-color:var(--green)}",
".d-btn{background:linear-gradient(180deg,#1c8f2d,#12100c);border:1px solid var(--green);color:#fff;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;display:inline-block}.d-btn:hover{text-decoration:none;background:#1c8f2d}",
".d-wrow,.d-mrow{display:flex;align-items:center;gap:11px;padding:10px 4px;border-bottom:1px solid rgba(58,35,19,.5)}.d-wmid,.d-mmid{flex:1;min-width:0}",
".d-wlabel{background:#08110c;border:1px solid var(--line);border-radius:6px;color:var(--bone);padding:4px 8px;font:inherit;font-size:13px;width:150px}",
".d-waddr,.d-maddr{font-size:12px;color:var(--muted);font-family:ui-monospace,monospace;word-break:break-all}.d-tag-cur{color:var(--green);font-family:var(--sans)}",
".d-wact{display:flex;gap:6px;flex-wrap:wrap}",
".d-mtags{margin-top:6px;display:flex;gap:10px;flex-wrap:wrap}.d-mt{font-size:12px;color:var(--soft)}.d-mt input{margin-right:3px}",
".d-alert{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:9px;font-size:13px;margin-bottom:7px;border:1px solid var(--line)}",
".d-alert.warn{background:rgba(229,106,84,.08);border-color:rgba(229,106,84,.3)}.d-alert.info{background:rgba(214,168,75,.05)}",
".d-al-m{flex:1;color:var(--ink)}.d-al-t{color:var(--muted);font-size:11px;white-space:nowrap}.d-al-x{color:var(--gold-lt)}",
".d-more{background:none;border:none;color:var(--green-lt);cursor:pointer;font-size:12.5px;margin-top:6px;padding:0}",
".d-pref{display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:var(--soft)}.d-pref input{width:70px;background:#08110c;border:1px solid var(--line);border-radius:6px;color:var(--bone);padding:5px 8px;font:inherit}",
".d-pref2{margin:11px 0;display:flex;flex-direction:column;gap:7px;font-size:13px;color:var(--soft)}.d-ch input[type=text],.d-ch input:not([type]){width:180px;background:#08110c;border:1px solid var(--line);border-radius:6px;color:var(--bone);padding:5px 8px;margin-left:6px;font:inherit}",
".d-note{font-size:11px;color:var(--muted);margin-top:9px;line-height:1.7}",
".d-bk{display:flex;align-items:center;gap:9px;padding:7px 3px;border-bottom:1px solid rgba(58,35,19,.4);font-size:13px}.d-bk-l{flex:1;color:var(--ink);word-break:break-all}.d-bk-n{color:var(--muted);font-size:11.5px}.d-bk-x{background:none;border:none;color:#e56a54;cursor:pointer}",
".d-rep{border-bottom:1px solid rgba(58,35,19,.5);padding:11px 3px}.d-rep-t{display:flex;justify-content:space-between;font-size:14px;color:var(--bone)}.d-rep-t span{color:var(--muted);font-size:11px}.d-rep-b{color:var(--soft);font-size:12.5px;margin:5px 0}.d-rep-act{display:flex;gap:7px}",
".d-modal{position:fixed;inset:0;background:rgba(0,0,0,.72);display:grid;place-items:center;z-index:100;padding:20px}.d-modal-in{background:#0d0b09;border:1px solid var(--line);border-radius:14px;max-width:640px;width:100%;max-height:88vh;overflow:auto;padding:22px;position:relative}.d-modal-x{position:absolute;top:12px;right:14px;background:none;border:none;color:var(--soft);font-size:18px;cursor:pointer}",
".d-rep-doc h2{color:var(--gold-lt);font-family:var(--serif)}.d-rep-doc h3{color:var(--gold-lt);font-size:15px;margin-top:18px}",
".d-learn-big,.d-rank-big{font-size:22px;font-weight:800;color:var(--green-lt);margin-bottom:9px}.d-learn-big span,.d-rank-big span{color:var(--bone)}",
".d-bar{height:9px;background:#1a130b;border-radius:6px;overflow:hidden;margin:8px 0}.d-bar>div{height:100%;background:linear-gradient(90deg,#1c8f2d,#25C96F,#76FF36);border-radius:6px;transition:width .5s}",
".d-learn-meta,.d-rank-meta{font-size:12.5px;color:var(--soft);margin:8px 0}.d-learn-meta b,.d-rank-meta b{color:var(--bone)}",
".d-lvrow{display:flex;align-items:center;gap:10px;margin:8px 0;font-size:12.5px}.d-lvname{width:64px;color:var(--soft)}.d-lvbar{flex:1;height:6px;background:#1a130b;border-radius:4px;overflow:hidden}.d-lvbar>div{height:100%;background:var(--green);border-radius:4px}.d-lvn{color:var(--muted);width:44px;text-align:right}",
".d-uplist{padding-left:18px;font-size:13px;color:var(--soft);line-height:1.9}",
".d-rank-ladder{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.d-rank-ladder span{font-size:11px;color:var(--muted);background:#12100c;border:1px solid var(--line);border-radius:20px;padding:3px 10px}.d-rank-ladder .on{color:var(--green-lt);border-color:var(--green)}",
".d-risk{font-size:11px;padding:1px 8px;border-radius:5px}.d-risk.hi{color:#e56a54;background:rgba(229,106,84,.13)}.d-risk.mid{color:var(--gold-lt);background:rgba(214,168,75,.13)}",
".d-tbl tr.hi td{background:rgba(229,106,84,.05)}.d-mono{font-family:ui-monospace,monospace;font-size:11.5px}",
".d-safebar{background:rgba(37,201,111,.06);border:1px solid rgba(37,201,111,.25);border-radius:10px;padding:11px 14px;font-size:12px;color:var(--soft)}",
"#dashToast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);background:#12100c;border:1px solid var(--green);color:var(--bone);padding:10px 20px;border-radius:24px;font-size:13px;opacity:0;transition:.25s;z-index:200;pointer-events:none}#dashToast.show{opacity:1;transform:translateX(-50%) translateY(0)}",
".d-bottom{display:none}",
/* mobile */
"@media(max-width:820px){.d-side{display:none}.d-body{display:block}.d-main{padding:14px 13px 90px}.d-2col{grid-template-columns:none}.d-stats{grid-template-columns:1fr 1fr}",
".d-bottom{display:flex;position:fixed;bottom:0;left:0;right:0;background:rgba(9,7,6,.97);border-top:1px solid var(--line);z-index:40;backdrop-filter:blur(8px)}",
".d-bi{flex:1;background:none;border:none;color:var(--muted);font-size:11px;padding:9px 2px 8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px}.d-bi span{font-size:19px}.d-bi.on{color:var(--green-lt)}",
".d-userhead{flex-wrap:wrap}.d-uact{flex-direction:row}}"
].join("\n");
document.head.appendChild(s);}

/* ---------- 启动 ---------- */
function boot(){ bindEvents(); render(); }
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
window.__dashTest=function(a){setAddr(a);render();}; // 测试用:免钱包直接进
})();
