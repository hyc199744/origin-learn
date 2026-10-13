/* b64 图片加载器：img/*.b64 是纯文本 base64，取回拼成 data URL */
function b64mime(u){ return u.indexOf('.webp.')>0?'image/webp':'image/jpeg'; }
function loadB64Imgs(){
  document.querySelectorAll('img[data-b64src]').forEach(function(el){
    var u=el.getAttribute('data-b64src'); if(!u||el.src.indexOf('data:')===0) return;
    fetch(u).then(function(r){return r.text();}).then(function(b){
      el.src='data:'+b64mime(u)+';base64,'+b.trim();
    }).catch(function(){});
  });
}
function b64ToDataUrl(u){ return fetch(u).then(function(r){return r.text();}).then(function(b){ return 'data:'+b64mime(u)+';base64,'+b.trim(); }); }

/* 无外部依赖：钱包直连 + 最小 ABI 编解码 */
/* ===== I18N ===== */
const I18N = {
zh: {
  pageTitle: '{chain} 彩票', docTitle: '{chain} 彩票',
  roundTitle: '🎟️ 本期', priceSub: '{p} {s} / 张 · 1 小时一期',
  connect: '连接钱包', connected: '已连接 {addr}',
  prizePool: '{s} 奖池', sold: '已售票数', sales: '本期票款', jackpot: '上期滚存',
  myTickets: '我的票数', myBal: '我的 {s}', ticketsUnit: ' 张',
  buyPh: '买几张（1-200）', approveBtn: '1. 授权 {s}', buyBtn: '2. 买票',
  closeBtn: '关闭本期', drawBtn: '开奖',
  drawNote: '本期已截止：先点「关闭本期」锁定开奖区块，再等约 50 个块后点「开奖」。任何人都可以点，Gas 谁点谁出。',
  prizeTitle: '🏆 奖项说明', p1: '一等奖 × 1 名', p1v: '奖池 50%', p2: '二等奖 × 3 名', p2v: '每人奖池 10%', p3: '三等奖 × 10 名', p3v: '每人奖池 2%',
  poolFormula: '· 奖池 = 本期票款 + 上期滚存 + 已解锁注资（显示为总额，开奖时扣除 {pct}% 平台费）<br>· 注资先锁进注资池：每卖出 1 张票释放 0.3 {s}（一期最多 30），没人买票一分不释放<br>· 邀请返佣：朋友通过你的链接买票，你拿他那笔平台费的 30%，他再邀请的人买票你再拿 10%（两代，返佣从平台费里出）<br>· 没人中的奖项自动滚入下期，奖池越滚越大<br>· 开奖用截止后未来区块的哈希做随机源，买票时谁也预知不了<br>· 票数不够 14 张时按实际票数开奖，剩下的全滚存',
  lastDraw: '上期开奖', lastRound: '(第 {n} 期)', noRecord: '暂无开奖记录', rolloverNext: '滚入下期',
  board: '累计中奖榜', history: '历史开奖', loading: '加载中…',
  noHistory: '暂无历史开奖', noData: '暂无数据', loadFail: '加载失败，请稍后刷新重试',
  roundN: '第 {n} 期', totalPaid: '共发出 {amt} {s}', wonTimes: '中 {n} 次 · <b>{amt}</b> {s}',
  prize1: '一等奖', prize2: '二等奖', prize3: '三等奖',
  ownerTitle: '房主管理', ownerNote: '冷启动注资：钱先锁进注资池，每卖出 1 张票释放 0.3 {s} 到奖池（一期最多 30）。没人买票一分不释放，防薅羊毛。锁定的钱可随时取回。',
  seedPh: '注入多少 {s}', approveSeedBtn: '1. 授权', seedBtn: '2. 注入锁定池', pricePh: '新票价（{s}/张）', setPriceBtn: '修改票价', setDurationBtn: '轮次改成 1 小时一期',
  lockedLabel: '🔒 待解锁注资',
  drawing: '开奖中', drawPreparing: '准备开奖…', drawClose: '关闭',
  selling: '⏳ 售票中，{t} 后截止', closedWaiting: '⏰ 已截止，等待关闭本期', waitingDraw: '🎲 等待开奖（目标块 {b}）',
  noBuyers: '本期无人购票，奖池全额滚存',
  txSent: '交易已发送，等待确认…', txReverted: '交易执行失败（被 revert）', txTimeout: '等太久没确认，请去浏览器查：{h}',
  noWallet: '没检测到钱包：手机请用钱包 App 自带浏览器打开本页面，电脑请装钱包插件',
  noAddr: '没拿到地址', connectFail: '连接失败：{m}',
  needWallet: '请先连接钱包', waitingConfirm: '等待钱包确认开奖交易…',
  hashExpired: '开奖区块太久没人开奖、哈希过期了，已自动重新锁定，再等约 50 个块后重试',
  drawSuccess: '开奖成功！正在揭晓中奖者…', drawDone: '本期开奖完成，奖金已自动打到中奖者钱包',
  drawFail: '开奖失败：{m}', firstBorn: '一等奖诞生！',
  approveOk: '授权成功，再点「买票」', buyOk: '买票成功，祝中大奖！', closedOk: '本期已关闭，等约 50 个块后点开奖',
  enterAmt: '先填注入金额', seedApproveOk: '授权成功，再点「注入锁定池」',
  seedConfirm: '往注资锁定池注入 {amt} {s}？按票释放进奖池，锁定的可随时取回。', seedDone: '注入成功！',
  priceConfirm: '把票价改成 {p} {s} / 张？', priceDone: '票价已改成 {p} {s}！', priceEcho: '将设为：{p} {s} / 张', priceCur: '当前票价：{p} {s} / 张',
  durationConfirm: '把轮次改成 1 小时一期？从第 2 期开始生效。', durationDone: '已改成 1 小时一期！',
  amtBad: '金额格式不对', decTooMany: '小数位太多',
  notConnected: '未连接', onchainLottery: '链上彩票',
  jackpotTitle: '本期奖池', saleEndsIn: '距售票截止',
  roundLive: '第 {n} 期 · 购票中', roundClosed: '第 {n} 期 · 已截止', roundWaitDraw: '第 {n} 期 · 待开奖',
  dashClosed: '已截止', waitDrawBlk: '目标块 {b}',
  poolTabL: 'LGNS 池', poolTabU: 'USDT 池', poolTabD: 'DAI 池', poolTabA: 'A 池', poolTabR: 'RM 池', backLobby: '返回游戏大厅',
  eyebrow:'A LITTLE DISCOVERY. A NEW WORLD.', heroTitle:'让每一次探索，<br>都有新的期待。', heroSub:'简洁、清晰的 Anubis 游戏体验。从一张彩票开始，发现更多可能。', heroStat:'<b>01</b> 款游戏已上线 &nbsp;/&nbsp; <b>05</b> 个奖池入口', heroCta1:'进入链上彩票', heroCta2:'查看游戏规则',
  featTitle:'正在进行 · 链上彩票', featSub:'当前选中奖池 · 数据链上实时', ftLive:'进行中', ftPoolWord:'奖池', ftPoolLabel:'本期奖池', ftPrice:'单张票价', ftEnd:'售票截止', ftEnter:'查看奖池', navLobby:'游戏大厅', navRecords:'我的记录', navHelp:'帮助中心', navNotice:'公告', navInvite:'邀请奖励', noticeT:'公告', noticeB:'暂无新公告。最新动态请关注官方渠道。',
 invTitle:'邀请好友，一起赢', invSub:'邀请朋友加入 ANUBIS PLAY，他们每一次参与，你都有一份奖励——直推 30%、间推 10%，链上结算，随时提取。', invDetail:'邀请明细', invConnect:'连接钱包后查看你的邀请数据', refGoBtn:'打开邀请奖励页 →',
 invS1:'分享链接', invS1s:'复制你的专属链接发给朋友', invS2:'朋友玩游戏', invS2s:'他首次参与即与你绑定（不可改）', invS3:'赚取返佣', invS3s:'直推 30% · 间推 10%，随时提取', invEarnTitle:'各游戏 / 奖池返佣', invCovers:'覆盖范围', invCoversV:'全部 5 个奖池 · 更多游戏陆续接入', invNone:'暂无',
 recTitle:'我的记录', recSub:'你在各奖池的参与与收益，链上实时统计', recPool:'奖池', recTickets:'买票', recSpent:'花费', recWon:'中奖 (次/额)', recNet:'净盈亏', recConnect:'连接钱包后查看你的记录', recNote:'说明：花费按当前票价估算；盈亏仅统计买票与中奖，不含邀请返佣（返佣见「邀请奖励」页）。',
 s2Title:'五大奖池，总有一注属于你', s2Sub:'LGNS · USDT · DAI · A · RM，1 小时一期，链上开奖可验证。', s2Cta:'查看奖池', s3Title:'邀请好友，一起赢', s3Sub:'他们每一次参与，你都有奖励——直推 30% · 间推 10%，随时提取。', s3Cta:'立即邀请', winHdr:'中奖播报',
 barName:'链上彩票', footLine:'链上可查 · 钱包签名 · 理性参与',
  navAccount:'我的', ledgerTitle:'佣金明细',
  accTitle:'我的', accSub:'你的钱包、邀请与收益，一页看清', accConnect:'连接钱包后查看你的账户',
  accAddr:'我的钱包', accReferrer:'我的邀请人', accLink:'我的邀请链接',
  qrBtn:'邀请二维码', shareBtn:'分享',
  accL1:'直属用户', accL2:'二级用户', accEarn:'累计佣金', accClaimable:'可提佣金', accClaimed:'已提佣金',
  accClaimGo:'提取', accClaimGoBtn:'去提取', accGames:'参加过的游戏', accTx:'交易历史', txBuy:'购票',
  joinTitle:'你被邀请加入 ANUBIS PLAY', joinSub:'链上彩票 · 1 小时一期 · 邀请好友拿返佣',
  joinFrom:'邀请人', joinNote:'点击加入后，你首次购票时将与邀请人永久绑定（同一奖池不可更改）。',
  joinGo:'加入平台', joinSkip:'先逛逛', joinOk:'已加入！首次购票时将绑定邀请人',
  qrTitle:'邀请二维码', noInviteYet:'暂无佣金记录',
  footRules:'使用协议', footAbout:'关于平台',
  footRisk:'⚠️ 风险提示：链上游戏存在资金损失风险，请理性参与，只投入你能承受损失的金额。',
  footLine2:'链上可查 · 钱包签名 · 理性参与', feat1:'链上可验证', feat1s:'开奖哈希公开', feat2:'5 大奖池', feat2s:'1 小时一期', feat3:'钱包签名', feat3s:'资金不托管',
  poolsTitle:'五大奖池', poolsSub:'点击切换 · 票价链上实时', gamesTitle:'更多游戏', gamesSub:'陆续上线', helpTitle:'新手上路', helpSub:'四步开始', mClose:'知道了',
  hSelling:'购票中', hClosed:'已截止', hDraw:'待开奖', hLoading:'读取中…', hFail:'读取失败', hRules:'游戏规则', hRulesBody:'彩票：每期售票，截止后用之后的区块哈希随机开奖。一等奖 1 名得奖池 50%，二等奖 3 名各 10%，三等奖 10 名各 2%，没中的奖项滚入下期。开奖扣少量平台费，邀请好友可得返佣。全部链上可查。',
  joinRound: '参与本期', perTicket: '{p} {s} / 张', ticketsCount: '{n} 张', totalCost: '本次票款',
  stepConnect: '连接钱包', stepApprove: '授权 {s}', stepBuyCount: '确认购票 · {n} 张', processing: '处理中…',
  flowHint: '连接钱包 · 授权代币 · 确认购票',
  payWith: '付款币种', payBal: '付款币余额', quoting: '询价中…',
  quoteFail: '询价失败：池子可能没深度，请稍后重试',
  stepPayApprove: '授权 {sym}', stepSwap: '兑换成 {s}',
  swapOk: '兑换成功，继续点按钮完成购票',
  swapNote: '用 DAI / USDT / A 按池子实时价换成 LGNS 再买票：USDT、A 走 USDT/A→DAI→LGNS 两跳兑换，跟 DAI 同价。输入上限按报价上浮 5% 防滑点，实际只扣买票所需的金额。',
  prizeDist: '奖项分配', max14: '最多 14 张中奖票',
  tier1: '一等奖', tier1n: '1 张', tier2: '二等奖', tier2n: '3 张', tier3: '三等奖', tier3n: '10 张',
  poolShare: '奖池占比', perTicketShare: '每张奖池占比',
  prizeNote: '奖池显示为票款总额，开奖时扣除 10% 平台费后按比例派奖。按票抽奖，同一钱包可多次中奖。',
  navHistory: '历史开奖', navMyTickets: '我的票据', navRules: '规则与合约',
  myAddrLabel: '我的地址', myBalLabel: '{s} 余额',
  myStatsConnect: '连接钱包后查看你的战绩', msPool: '（{s} 池）',
  msTicketsBought: '累计买票', msSpent: '累计花费', msWon: '累计中奖', msWonTimes: '{n} 次', msRefEarned: '返佣收入', msNet: '净盈亏', msSpentNote: '（花费按当前票价估算）',
  contractLottery: '彩票合约', contractToken: '票币合约', viewContract: '在浏览器查看合约',
  verifyBtn: '🔍 验证本期开奖', verifyLoading: '读取开奖区块…', verifyDrawBlock: '开奖区块', verifyBlockHash: '区块哈希', verifyNoBlock: '该期开奖区块信息读取不到',
  verifyExplain: '中奖者由上面这个区块的哈希决定。这个区块在本期售票截止之后才产生、哈希公开且无法篡改，所以买票时谁也预知不了、开奖后谁都能来核对，项目方动不了手脚。',
  transTitle: '📊 数据透明（五池链上实时）', transNote: '以下全部从链上合约实时读取，公开只读，任何人可自行核对。',
  transTicketPrice: '票价', transFee: '平台抽水', transOwner: '房主', transLocked: '注资锁定池', transCurPool: '本期奖池', transTotalPaid: '累计已派奖', transContract: '合约 ↗',
  refTitle: '邀请返佣', refNote: '把你的邀请链接发给朋友：他买票，你拿他那笔平台费的 30%；他再邀请的人买票，你再拿 10%。返佣从平台费里出，不影响奖池，随时可提。邀请关系第一次买票就定死。',
  myRefLink: '我的邀请链接', copyBtn: '复制', copyOk: '邀请链接已复制，去发给朋友吧',
  myReferrer: '我的邀请人', noReferrer: '无（首次购票时绑定）',
  myRefRewards: '可提返佣', claimRefBtn: '提取返佣', claimOk: '返佣已到账',
  refVia: '你通过邀请链接进入：本次购票将为邀请人带来返佣，你的奖金不受影响',
  refDirectLine: '直推', refIndirectLine: '间推',
  refStatLine: '{n} 人 · 购票 {tk} 张 · 贡献 {amt} {s}',
  refTagD: '直推', refTagI: '间推',
  refRowStat: '买了 {tk} 张 · 贡献 {amt} {s}',
  refNoInvite: '还没有邀请任何人，快把链接发给朋友吧'
},
en: {
  pageTitle: '{chain} Lottery', docTitle: '{chain} Lottery',
  roundTitle: '🎟️ Round', priceSub: '{p} {s} / ticket · 1h per round',
  connect: 'Connect Wallet', connected: 'Connected {addr}',
  prizePool: '{s} Prize Pool', sold: 'Tickets Sold', sales: 'Round Sales', jackpot: 'Rollover',
  myTickets: 'My Tickets', myBal: 'My {s}', ticketsUnit: '',
  buyPh: 'How many (1-200)', approveBtn: '1. Approve {s}', buyBtn: '2. Buy Tickets',
  closeBtn: 'Close Round', drawBtn: 'Draw',
  drawNote: 'Round closed: tap "Close Round" first to lock the draw block, then wait ~50 blocks and tap "Draw". Anyone can do it, caller pays gas.',
  prizeTitle: '🏆 Prizes', p1: '1st Prize × 1', p1v: '50% of pool', p2: '2nd Prize × 3', p2v: '10% of pool each', p3: '3rd Prize × 10', p3v: '2% of pool each',
  poolFormula: '· Pool = round sales + rollover + unlocked seed (gross; {pct}% platform fee deducted at draw)<br>· Seeds go into a locked vault: 0.3 {s} unlocks per ticket sold (max 30/round). No sales, no unlock — anti-farming<br>· Referral: earn 30% of the platform fee on your invitees\' purchases, 10% on their invitees\' (2 levels, paid from the fee)<br>· Unwon prizes roll over, pool keeps growing<br>· Draw uses a future block hash after cutoff — unpredictable when buying<br>· Fewer than 14 tickets? Drawn pro-rata, remainder rolls over',
  lastDraw: 'Last Draw', lastRound: '(Round {n})', noRecord: 'No draw records yet', rolloverNext: 'Rollover to next',
  board: 'Leaderboard', history: 'History', loading: 'Loading…',
  noHistory: 'No draw history yet', noData: 'No data', loadFail: 'Load failed, please refresh and retry',
  roundN: 'Round {n}', totalPaid: 'Paid out {amt} {s}', wonTimes: 'Won {n}× · <b>{amt}</b> {s}',
  prize1: '1st Prize', prize2: '2nd Prize', prize3: '3rd Prize',
  ownerTitle: 'Owner Panel', ownerNote: 'Cold-start seeding: funds go into a locked vault, 0.3 {s} unlocks per ticket sold (max 30/round). No sales, no unlock — anti-farming. Locked funds can be withdrawn anytime.',
  seedPh: 'Amount to seed ({s})', approveSeedBtn: '1. Approve', seedBtn: '2. Seed Locked Vault', pricePh: 'New price ({s}/ticket)', setPriceBtn: 'Set Price', setDurationBtn: 'Set 1-hour rounds',
  lockedLabel: '🔒 Locked seed (unlocking)',
  drawing: 'Drawing…', drawPreparing: 'Preparing…', drawClose: 'Close',
  selling: '⏳ Selling, closes in {t}', closedWaiting: '⏰ Closed, waiting to lock round', waitingDraw: '🎲 Waiting for draw (target block {b})',
  noBuyers: 'No tickets sold, full pool rolls over',
  txSent: 'Transaction sent, waiting for confirmation…', txReverted: 'Transaction reverted', txTimeout: 'Confirmation timed out, check in explorer: {h}',
  noWallet: 'No wallet detected: open this page in your wallet app browser on mobile, or install a wallet extension on desktop',
  noAddr: 'No address received', connectFail: 'Connection failed: {m}',
  needWallet: 'Please connect your wallet first', waitingConfirm: 'Waiting for wallet confirmation…',
  hashExpired: 'Draw block hash expired (nobody drew in time), re-locked automatically. Wait ~50 blocks and retry.',
  drawSuccess: 'Draw successful! Revealing winners…', drawDone: 'Draw complete, prizes sent to winners automatically',
  drawFail: 'Draw failed: {m}', firstBorn: '1st Prize winner!',
  approveOk: 'Approved, now tap "Buy Tickets"', buyOk: 'Tickets bought, good luck!', closedOk: 'Round closed, wait ~50 blocks then draw',
  enterAmt: 'Enter an amount first', seedApproveOk: 'Approved, now tap "Seed Locked Vault"',
  seedConfirm: 'Seed {amt} {s} into the locked vault? Unlocks per ticket sold; locked funds can be withdrawn anytime.', seedDone: 'Seeded successfully!',
  priceConfirm: 'Set ticket price to {p} {s}?', priceDone: 'Ticket price set to {p} {s}!', priceEcho: 'Will set to: {p} {s} / ticket', priceCur: 'Current price: {p} {s} / ticket',
  durationConfirm: 'Set round duration to 1 hour? Takes effect from round 2.', durationDone: 'Round duration set to 1 hour!',
  amtBad: 'Invalid amount format', decTooMany: 'Too many decimals',
  notConnected: 'Not connected', onchainLottery: 'On-chain Lottery',
  jackpotTitle: "This Round's Pool", saleEndsIn: 'Sale ends in',
  roundLive: 'Round {n} · Selling', roundClosed: 'Round {n} · Closed', roundWaitDraw: 'Round {n} · Awaiting Draw',
  dashClosed: 'Closed', waitDrawBlk: 'Target block {b}',
  poolTabL: 'LGNS Pool', poolTabU: 'USDT Pool', poolTabD: 'DAI Pool', poolTabA: 'A Pool', poolTabR: 'RM Pool', backLobby: 'Back to Lobby',
  eyebrow:'A LITTLE DISCOVERY. A NEW WORLD.', heroTitle:'Every play,<br>a new anticipation.', heroSub:'A clean, clear gaming experience on Anubis. Start with one ticket, discover more.', heroStat:'<b>01</b> game live &nbsp;/&nbsp; <b>05</b> pools', heroCta1:'Enter Lottery', heroCta2:'View Rules',
  featTitle:'Live · On-chain Lottery', featSub:'Selected pool · live on-chain data', ftLive:'Live', ftPoolWord:'Pool', ftPoolLabel:'Current pool', ftPrice:'Ticket price', ftEnd:'Sales end in', ftEnter:'View pool', navLobby:'Lobby', navRecords:'My Records', navHelp:'Help Center', navNotice:'News', navInvite:'Referral', noticeT:'News', noticeB:'No new announcements. Follow our official channels for updates.',
 invTitle:'Invite friends, win together', invSub:'Invite friends to ANUBIS PLAY. Every time they play, you earn — 30% direct, 10% indirect, settled on-chain, claim anytime.', invDetail:'Referral details', invConnect:'Connect your wallet to see your referral data', refGoBtn:'Open referral page →',
 invS1:'Share link', invS1s:'Copy your unique link and send to friends', invS2:'Friend plays', invS2s:'Binds to you on their first play (permanent)', invS3:'Earn rewards', invS3s:'Direct 30% · Indirect 10%, claim anytime', invEarnTitle:'Rewards by game / pool', invCovers:'Coverage', invCoversV:'All 5 pools · more games coming', invNone:'None',
 recTitle:'My Records', recSub:'Your activity and returns across all pools, live on-chain', recPool:'Pool', recTickets:'Tickets', recSpent:'Spent', recWon:'Won (times/amt)', recNet:'Net P/L', recConnect:'Connect your wallet to see your records', recNote:'Note: spend is estimated at current price; P/L counts tickets and winnings only, excluding referral rewards (see the Referral page).',
 s2Title:'Five pools, one is yours', s2Sub:'LGNS · USDT · DAI · A · RM — hourly rounds, verifiable on-chain draws.', s2Cta:'View pools', s3Title:'Invite friends, win together', s3Sub:'Every time they play, you earn — 30% direct, 10% indirect, claim anytime.', s3Cta:'Invite now', winHdr:'RECENT WINNER',
 barName:'On-chain Lottery', footLine:'On-chain · Wallet-signed · Play responsibly',
  navAccount:'Account', ledgerTitle:'Commission Details',
  accTitle:'Account', accSub:'Your wallet, referrals and earnings at a glance', accConnect:'Connect your wallet to view your account',
  accAddr:'My wallet', accReferrer:'My referrer', accLink:'My referral link',
  qrBtn:'Invite QR', shareBtn:'Share',
  accL1:'Direct users', accL2:'Level-2 users', accEarn:'Total commission', accClaimable:'Claimable', accClaimed:'Claimed',
  accClaimGo:'Claim', accClaimGoBtn:'Go claim', accGames:'Games played', accTx:'Transaction history', txBuy:'Buy',
  joinTitle:"You've been invited to ANUBIS PLAY", joinSub:'On-chain lottery · Hourly draws · Earn referral rewards',
  joinFrom:'Inviter', joinNote:"After joining, you'll be permanently bound to your inviter on first ticket purchase (per pool).",
  joinGo:'Join', joinSkip:'Browse first', joinOk:'Joined! Inviter will be bound on your first purchase',
  qrTitle:'Invite QR code', noInviteYet:'No commission records yet',
  footRules:'Terms', footAbout:'About',
  footRisk:'⚠️ Risk: on-chain games can lose money. Play responsibly, only spend what you can afford to lose.',
  footLine2:'On-chain · Wallet-signed · Play responsibly', feat1:'Verifiable', feat1s:'Public draw hash', feat2:'5 Pools', feat2s:'Hourly rounds', feat3:'Wallet-signed', feat3s:'Non-custodial',
  poolsTitle:'Five Pools', poolsSub:'Tap to switch · live price', gamesTitle:'More Games', gamesSub:'Coming soon', helpTitle:'Getting Started', helpSub:'Four steps', mClose:'Got it',
  hSelling:'Selling', hClosed:'Closed', hDraw:'Awaiting draw', hLoading:'Loading…', hFail:'Load failed', hRules:'Game Rules', hRulesBody:'Lottery: tickets sell each round; after cutoff a future block hash draws winners. 1st 50% of pool, 3×2nd at 10%, 10×3rd at 2%; unwon prizes roll over. A small platform fee at draw; referrals earn rewards. All verifiable on-chain.',
  joinRound: 'Join This Round', perTicket: '{p} {s} / ticket', ticketsCount: '{n}', totalCost: 'Total',
  stepConnect: 'Connect Wallet', stepApprove: 'Approve {s}', stepBuyCount: 'Confirm · {n} tickets', processing: 'Processing…',
  flowHint: 'Connect wallet · Approve token · Confirm purchase',
  payWith: 'Pay with', payBal: 'Pay token balance', quoting: 'Quoting…',
  quoteFail: 'Quote failed: pool may be too shallow, please retry later',
  stepPayApprove: 'Approve {sym}', stepSwap: 'Swap to {s}',
  swapOk: 'Swapped! Tap the button again to finish buying',
  swapNote: 'Pay with DAI / USDT / A, swapped to LGNS at the live pool price (USDT and A route via DAI→LGNS, same price as DAI). Input cap is quote + 5% for slippage; only the exact ticket cost is taken.',
  prizeDist: 'Prize Distribution', max14: 'Up to 14 winning tickets',
  tier1: '1st Prize', tier1n: '1 ticket', tier2: '2nd Prize', tier2n: '3 tickets', tier3: '3rd Prize', tier3n: '10 tickets',
  poolShare: 'of pool', perTicketShare: 'of pool per ticket',
  prizeNote: 'Pool shows gross ticket sales; 10% platform fee is deducted at draw before prizes are paid. Drawn per ticket; one wallet can win multiple times.',
  navHistory: 'History', navMyTickets: 'My Tickets', navRules: 'Rules & Contract',
  myAddrLabel: 'My Address', myBalLabel: '{s} Balance',
  myStatsConnect: 'Connect your wallet to see your stats', msPool: '({s} pool)',
  msTicketsBought: 'Tickets bought', msSpent: 'Total spent', msWon: 'Total won', msWonTimes: '{n}×', msRefEarned: 'Referral earned', msNet: 'Net P/L', msSpentNote: '(spend est. at current price)',
  contractLottery: 'Lottery Contract', contractToken: 'Token Contract', viewContract: 'View contract on explorer',
  verifyBtn: '🔍 Verify this draw', verifyLoading: 'Loading draw block…', verifyDrawBlock: 'Draw block', verifyBlockHash: 'Block hash', verifyNoBlock: 'Draw block info unavailable',
  verifyExplain: 'Winners are determined by the hash of the block above. That block is produced only after sales close; its hash is public and immutable — so it is unpredictable at purchase time and anyone can verify the draw afterwards. The team cannot tamper with it.',
  transTitle: '📊 Transparency (5 pools, live on-chain)', transNote: 'All values below are read live from on-chain contracts — public, read-only, verifiable by anyone.',
  transTicketPrice: 'Ticket price', transFee: 'Platform fee', transOwner: 'Owner', transLocked: 'Locked seed vault', transCurPool: 'Current pool', transTotalPaid: 'Total paid out', transContract: 'Contract ↗',
  refTitle: 'Referral Rewards', refNote: 'Share your invite link: earn 30% of the platform fee on your invitees\' ticket purchases, plus 10% on their invitees\'. Paid from the platform fee — the prize pool is untouched. Claim anytime. Referral binds on first purchase, permanently.',
  myRefLink: 'My Invite Link', copyBtn: 'Copy', copyOk: 'Invite link copied, go share it',
  myReferrer: 'My Referrer', noReferrer: 'None (bound on first purchase)',
  myRefRewards: 'Claimable Rewards', claimRefBtn: 'Claim Rewards', claimOk: 'Rewards claimed',
  refVia: 'You arrived via an invite link: this purchase earns your inviter rewards. Your prizes are unaffected.',
  refDirectLine: 'Direct', refIndirectLine: 'Indirect',
  refStatLine: '{n} people · {tk} tickets · earned {amt} {s}',
  refTagD: 'Direct', refTagI: 'Indirect',
  refRowStat: '{tk} tickets · {amt} {s} earned',
  refNoInvite: 'No invitees yet — share your link with friends'
}};
let LANG = localStorage.getItem('lottery_lang') || 'zh';
function t(k, p){
  let s = (I18N[LANG] && I18N[LANG][k]) || I18N.zh[k] || k;
  p = Object.assign({s: TSYM()}, p||{});
  for(const key in p) s = s.split('{'+key+'}').join(p[key]);
  return s;
}
function applyLang(){
  document.documentElement.lang = LANG==='zh' ? 'zh-CN' : 'en';
  document.title = t('docTitle', {chain: CFG.chainName});
  document.querySelectorAll('[data-i18n]').forEach(el=>{ var k=el.getAttribute('data-i18n'); if(k==='heroTitle'||k==='heroStat') el.innerHTML=t(k); else el.textContent=t(k); });
  document.querySelectorAll('[data-i18n-html]').forEach(el=>{ el.innerHTML = t(el.getAttribute('data-i18n-html'), {pct: el.dataset.pct || ''}); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{ el.placeholder = t(el.getAttribute('data-i18n-ph')); });
  $('langBtn').textContent = LANG==='zh' ? 'EN' : '中文';
  updateChainText();
  document.querySelectorAll('.qbtn[data-n]').forEach(b=>{ b.textContent = t('ticketsCount', {n: b.dataset.n}); });
  const sn = $('stepperNum'); if(sn) sn.textContent = t('ticketsCount', {n: buyN});
  updateTotal();
  updateBuyBtn();
  if(typeof renderHome==='function') renderHome();
}
function toggleLang(){
  LANG = LANG==='zh' ? 'en' : 'zh';
  localStorage.setItem('lottery_lang', LANG);
  applyLang(); updateWalletBtn();
  refresh();
}
function updateChainText(){
  const bt = $('chainBtnTxt'); if(bt) bt.textContent = CFG.chainName;
  const bn = $('chainBigName'); if(bn) bn.textContent = CFG.chainName.toUpperCase();
  const sn = $('chainSubName'); if(sn) sn.textContent = CFG.chainName + ' Chain';
  document.title = t('docTitle', {chain: CFG.chainName});
}
function updateChainBtn(){ updateChainText(); updateContractInfo(); }
function updateContractInfo(){
  const la = $('contractLotteryAddr'), ta = $('contractTokenAddr'), fe = $('footExplorer');
  if(la){ la.textContent = short(CFG.CONTRACT); la.href = CFG.explorer + '/address/' + CFG.CONTRACT; }
  if(ta){ ta.textContent = short(CFG.token); ta.href = CFG.explorer + '/address/' + CFG.token; }
  if(fe){ fe.href = CFG.explorer + '/address/' + CFG.CONTRACT; }
}
const CHAINS = {
  anubis: {
    chainId: 6714, chainHex: '0x1A3A', chainName: 'Anubis',
    rpcUrl: 'https://rpc.anubispace.org',
    explorer: 'https://browser.anubispace.org',
    token: '0x4d1d808a081fdac440703b3765fc61f8028c06b8', // LGNS 9 位精度
    decimals: 9,
    CONTRACT: '0xb8A20cEFDDAE4b298A4086f3376F01Bdb2d300C7', // 2026-10-11 V3 返佣版部署（1小时一期/返佣/0.3补贴）
    router: '0x3E412E02B6157fBE80b6C6697f3Ce1142E629019', // RocketSwap V2 路由
    payTokens: [ // LGNS 池只收 LGNS，直接买票
      {sym:'LGNS', addr:'0x4d1d808a081fdac440703b3765fc61f8028c06b8', dec:9}
    ],
    native: {name:'DAI', symbol:'DAI', decimals:18},
    deployBlock: 16182340 // 2026-10-11 V3 部署块，历史事件从这里开始扫
  },
  polygon: {
    chainId: 137, chainHex: '0x89', chainName: 'Polygon',
    rpcUrl: 'https://polygon-bor-rpc.publicnode.com',
    explorer: 'https://polygonscan.com',
    token: '0xeB51D9A39AD5EEF215dC0Bf39a8821ff804A0F01', // Polygon LGNS 9 位精度
    decimals: 9,
    CONTRACT: '0x4f528929fc0663280f63b342f60af945f44f644f', // 2026-10-04 部署
    native: {name:'POL', symbol:'POL', decimals:18},
    deployBlock: 94920000 // 2026-10-04 前后，历史事件从这里开始扫
  }
};
let chainKey = 'anubis';
let CFG = CHAINS.anubis;
// 双奖池：LGNS 池 / USDT 池，各自独立合约、独立开奖；切换时整体并入 CFG
const POOLS = [
  { sym:'LGNS',
    CONTRACT:'0xb8A20cEFDDAE4b298A4086f3376F01Bdb2d300C7',
    token:'0x4d1d808a081fdac440703b3765fc61f8028c06b8', decimals:9,
    deployBlock:16182340, // V3 部署块
    payTokens:[
      {sym:'LGNS', addr:'0x4d1d808a081fdac440703b3765fc61f8028c06b8', dec:9} // LGNS 池只收 LGNS，直接买票
    ] },
  { sym:'USDT',
    CONTRACT:'0x88f94a52BA5B24Be6BC894f16d4657B12BAb2859',
    token:'0xDfb6a28BC6DC51fed17c27C880F2c66cDd040A3e', decimals:6,
    deployBlock:16196737, // USDT 池部署块
    payTokens:[
      {sym:'USDT', addr:'0xDfb6a28BC6DC51fed17c27C880F2c66cDd040A3e', dec:6} // USDT 池只收 USDT，直接进奖池
    ] },
  { sym:'DAI',
    CONTRACT:'0x7EC71344CE6fffd602d4911caB54A15f53Cc01A0',
    token:'0x83fd06f0846d9d90b3016bf670efe2e0b11cde14', decimals:18,
    deployBlock:16200709, // DAI 池部署块
    payTokens:[
      {sym:'DAI', addr:'0x83fd06f0846d9d90b3016bf670efe2e0b11cde14', dec:18} // DAI 池只收 DAI，直接进奖池
    ] },
  { sym:'A',
    CONTRACT:'0x6100cA0904E8b9c521129dEC05AfD4F5BBB9D6fb',
    token:'0xa921267c56b3a57696d6fd7949c9fad0a8e0c177', decimals:18,
    deployBlock:16202660, // A 池部署块
    payTokens:[
      {sym:'A', addr:'0xa921267c56b3a57696d6fd7949c9fad0a8e0c177', dec:18} // A 池只收 A，直接进奖池
    ] },
  { sym:'RM',
    CONTRACT:'0x5beAdBd9E7C87ACcac218d25aA83Bb707A7E96A3',
    token:'0x2e045e1380f5f5b6e7550328910a7377c9fce59d', decimals:9,
    deployBlock:16204394, // RM 池部署块
    payTokens:[
      {sym:'RM', addr:'0x2e045e1380f5f5b6e7550328910a7377c9fce59d', dec:9} // RM 池只收 RM，直接进奖池
    ] },
];
let poolIdx = 0;
try{ poolIdx = Number(localStorage.getItem('lottery_pool')||0)||0; if(poolIdx<0||poolIdx>4) poolIdx=0; }catch(e){}
// 从首页带过来的 ?pool=N 选中对应奖池
try{ var _qp=new URLSearchParams(location.search).get('pool'); if(_qp!==null){ var _pn=Number(_qp); if(_pn>=0&&_pn<=4){ poolIdx=_pn; try{localStorage.setItem('lottery_pool',String(_pn));}catch(e){} } } }catch(e){}
function TSYM(){ return POOLS[poolIdx].sym; }
Object.assign(CFG, POOLS[poolIdx]);
function setPool(i){
  if(i===poolIdx) return;
  poolIdx = i;
  try{ localStorage.setItem('lottery_pool', String(i)); }catch(e){}
  Object.assign(CFG, POOLS[poolIdx]);
  payIdx = 0; buyN = 1;
  // 切池先清掉上一个池的旧数据，避免旧票价/旧奖池/旧倒计时短暂残留
  TICKET = 0n; roundPhase = '';
  ['perTicket','totalCost','sold','sales','jackpot','lockedPool','myTickets'].forEach(function(id){ var e=$(id); if(e) e.textContent='-'; });
  var _pp=$('prizePool'); if(_pp){ _pp.textContent='--'; _pp.classList.add('skel'); }
  var _cd=$('countdown'); if(_cd){ _cd.textContent='--'; _cd.classList.add('skel'); }
  renderPoolTabs(); applyLang(); updateContractInfo();
  if($('payRow')) renderPayRow();
  const sn = $('swapNote'); if(sn) sn.style.display='none';
  refresh(true);
}
function renderPoolTabs(){
  document.querySelectorAll('#poolTabs .qbtn').forEach((b,idx)=> b.classList.toggle('sel', idx===poolIdx));
  const pu = $('poolUnit'); if(pu) pu.textContent = TSYM();
  const lp = $('lockedPoolSym'); if(lp) lp.textContent = TSYM();
}
const SEL = {
  approve: '095ea7b3', allowance: 'dd62ed3e', balanceOf: '70a08231',
  buyTickets: '2f366637', buyTicketsWithRef: 'f93afa09', claimReferral: 'e02f1ebd',
  referrer: '2cf003c2', referralRewards: '53aaa63b',
  seedJackpot: '02950fb9', closeRound: 'e278fe6f', draw: '0eecae21',
  setTicketPrice: '15981650',
  getAmountsIn: '1f00ca74', swapTokensForExactTokens: '4a25d94a', // RocketSwap 路由
  ticketPrice: '1209b1f6', feeBps: '24a9d853', currentRound: '8a19c8bc',
  rounds: '8c65c81f', lastDrawnRound: '9fe8862a', lastRollover: '953523e8',
  getLastWinners: '95690936', getTicketOwners: '36a65e80', owner: '8da5cb5b',
  lockedJackpot: '975008a3', winnableJackpot: 'eb111f91', setRoundDuration: '36c92c3f'
};
function encUint(v){ return BigInt(v).toString(16).padStart(64,'0'); }
function encAddr(a){ return '0'.repeat(24) + a.toLowerCase().replace(/^0x/,''); }
function encAddrArray(arr){ // address[] 编码：offset(0x40) + 长度 + 地址
  return encUint(64) + encUint(arr.length) + arr.map(encAddr).join('');
}
function decUint(h){ return BigInt('0x'+h); }
function decAddr(h){ return '0x'+h.slice(-40); }
function decBool(h){ return BigInt('0x'+h) !== 0n; }
function decAddrArray(h, off){ // off: hex 字符偏移
  const n = Number(decUint(h.slice(off, off+64)));
  const a = [];
  for (let i=0;i<n;i++) a.push(decAddr(h.slice(off+64*(i+1), off+64*(i+2))));
  return a;
}
function decUintArray(h, off){
  const n = Number(decUint(h.slice(off, off+64)));
  const a = [];
  for (let i=0;i<n;i++) a.push(decUint(h.slice(off+64*(i+1), off+64*(i+2))));
  return a;
}
function parseUnits(str, dec){
  dec = dec || CFG.decimals; str = String(str).trim();
  if (!/^\d+(\.\d+)?$/.test(str)) throw new Error(t('amtBad'));
  const p = str.split('.'), f = p[1] || '';
  if (f.length > dec) throw new Error(t('decTooMany'));
  return BigInt(p[0] + (f + '0'.repeat(dec)).slice(0, dec));
}
function formatUnits(v, dec){
  dec = dec || CFG.decimals;
  const s = BigInt(v).toString().padStart(dec+1,'0');
  const i = s.slice(0,-dec), f = s.slice(-dec).replace(/0+$/,'');
  return i + (f ? '.'+f : '');
}
let myAddr = null, TICKET = 0n, FEE = 1000n, OWNER = '';
const $ = id => document.getElementById(id);
const short = a => a ? a.slice(0,6)+'…'+a.slice(-4) : '';
function updateWalletBtn(){
  const el = $('walletBtnTxt');
  if(el) el.textContent = myAddr ? short(myAddr) : t('connect');
}
const fmt = v => Number(formatUnits(v)).toLocaleString('zh-CN',{maximumFractionDigits:2});
const fmt2 = v => Number(formatUnits(v)).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
let buyN = 1, busy = false;
let payIdx = 0, quoteInMax = 0n; // 付款币种下标（0=LGNS），quoteInMax=按当前票数换足 LGNS 所需的付款币上限（含 5% 浮动）
function setBuyN(n){
  buyN = Math.max(1, Math.min(200, n));
  const sn = $('stepperNum'); if(sn) sn.textContent = t('ticketsCount', {n: buyN});
  document.querySelectorAll('#ticketRow .qbtn').forEach(b=> b.classList.toggle('sel', Number(b.dataset.n)===buyN));
  updateTotal();
  updateBuyBtn();
}
function payToken(){ return (CFG.payTokens && CFG.payTokens[payIdx]) || CFG.payTokens[0]; }
// 兑换路径：默认 [付款币, LGNS]；带 via 的走两跳 [付款币, via, LGNS]（如 A->DAI->LGNS）
function payPath(pt){ return pt.via ? [pt.addr, pt.via, CFG.token] : [pt.addr, CFG.token]; }
// 付款币种按钮按 payTokens 动态生成，加新币种只改配置不用动 HTML
function renderPayRow(){
  const pr = $('payRow'); if(!pr || !CFG.payTokens) return;
  pr.innerHTML = CFG.payTokens.map((p,i)=>'<button class="qbtn'+(i===payIdx?' sel':'')+'" data-p="'+i+'" onclick="setPay('+i+')">'+p.sym+'</button>').join('');
}
function setPay(i){
  if(!CFG.payTokens || !CFG.payTokens[i]) return;
  payIdx = i; quoteInMax = 0n;
  document.querySelectorAll('#payRow .qbtn').forEach(b=> b.classList.toggle('sel', Number(b.dataset.p)===payIdx));
  const showPay = payIdx > 0;
  $('payBalRow').style.display = showPay ? '' : 'none';
  $('swapNote').style.display = showPay ? '' : 'none';
  updateTotal(); updatePayBal(); updateBuyBtn();
}
// 按路由实时询价：买 buyN 张票需要多少付款币（精确输出 LGNS，输入上浮 5% 防滑点）
async function quotePay(){
  quoteInMax = 0n;
  if(payIdx===0 || TICKET<=0n) return 0n;
  const pt = payToken();
  const need = TICKET * BigInt(buyN);
  const h = await ethCall(CFG.router, '0x'+SEL.getAmountsIn+encUint(need)+encAddrArray(payPath(pt)));
  const amtIn = decUint(h.slice(128, 192)); // uint[] amounts，amounts[0] 在第 3 个 slot
  quoteInMax = amtIn * 105n / 100n;
  return quoteInMax;
}
function fmtPay(v, pt){
  const s = formatUnits(v, pt.dec);
  const dot = s.indexOf('.');
  if(dot < 0) return s;
  const cut = s.slice(dot+1, dot+3).replace(/0+$/, ''); // 最多 2 位小数，去掉多余的 0
  return cut ? s.slice(0, dot+1) + cut : s.slice(0, dot);
}
function updateTotal(){
  const tc = $('totalCost'); if(!tc) return;
  if(TICKET<=0n){ tc.textContent='-'; return; }
  if(payIdx===0){ tc.textContent = fmt(TICKET*BigInt(buyN)) + ' '+TSYM(); return; }
  const pt = payToken();
  tc.textContent = t('quoting');
  quotePay().then(q=>{
    if(q>0n) tc.textContent = '≈ ' + fmtPay(q, pt) + ' ' + pt.sym;
    else tc.textContent = '-';
  }).catch(()=>{ tc.textContent='-'; });
}
async function updatePayBal(){
  const row = $('payBalRow'); if(!row || row.style.display==='none') return;
  try{
    const pt = payToken();
    const b = decUint(await ethCall(pt.addr,'0x'+SEL.balanceOf+encAddr(myAddr)));
    $('payBal').textContent = fmtPay(b, pt) + ' ' + pt.sym;
  }catch(e){ $('payBal').textContent='-'; }
}
// 下一步该点什么：connect / payApprove / swap / approve / buy
async function nextBuyStep(){
  if(!myAddr) return 'connect';
  if(payIdx>0 && CFG.router){
    const pt = payToken(), need = TICKET*BigInt(buyN);
    await quotePay(); // 报价失败直接抛出去，mainAction 会 toast 提示
    const al = decUint(await ethCall(pt.addr,'0x'+SEL.allowance+encAddr(myAddr)+encAddr(CFG.router)));
    if(al < quoteInMax) return 'payApprove';
    const lb = decUint(await ethCall(CFG.token,'0x'+SEL.balanceOf+encAddr(myAddr)));
    if(lb < need) return 'swap';
  }
  try{ return (await needApprove()) ? 'approve' : 'buy'; }
  catch(e){ return 'approve'; }
}
async function needApprove(){
  if(!myAddr || TICKET<=0n) return false;
  try{
    const al = decUint(await ethCall(CFG.token,'0x'+SEL.allowance+encAddr(myAddr)+encAddr(CFG.CONTRACT)));
    return al < TICKET*BigInt(buyN);
  }catch(e){ return true; }
}
async function updateBuyBtn(){
  const btn = $('buyMainBtn'), txt = $('buyMainTxt');
  if(!btn || !txt) return;
  if(busy){ btn.disabled = true; txt.textContent = t('processing'); return; }
  btn.disabled = false;
  try{
    const s = await nextBuyStep();
    const pt = payToken();
    txt.textContent =
      s==='connect' ? t('stepConnect') :
      s==='payApprove' ? t('stepPayApprove', {sym: pt.sym}) :
      s==='swap' ? t('stepSwap', {sym: pt.sym}) :
      s==='approve' ? t('stepApprove') :
      t('stepBuyCount', {n: buyN});
  }catch(e){ txt.textContent = t('stepApprove'); }
}
async function doSwap(){
  // 付款币 -> LGNS：精确输出（正好够买票），输入上限为报价上浮 5%
  const pt = payToken(), need = TICKET*BigInt(buyN);
  await quotePay();
  if(quoteInMax<=0n) throw new Error(t('quoteFail'));
  const deadline = BigInt(Math.floor(Date.now()/1000) + 1200);
  const data = '0x'+SEL.swapTokensForExactTokens+encUint(need)+encUint(quoteInMax)
    +encAddrArray(payPath(pt))+encAddr(myAddr)+encUint(deadline);
  await sendTx(CFG.router, data);
  toast(t('swapOk'));
}
async function mainAction(){
  if(busy) return;
  busy = true; updateBuyBtn();
  try{
    if(!myAddr){ await connect(); return; }
    const step = await nextBuyStep();
    if(step==='payApprove'){
      const pt = payToken();
      await sendTx(pt.addr, '0x'+SEL.approve+encAddr(CFG.router)+encUint(2n**256n-1n));
      toast(t('approveOk'));
      return;
    }
    if(step==='swap'){ await doSwap(); }
    if(await needApprove()) await approve(); else await buy();
  }catch(e){ toast(e.message || e); }
  finally{
    busy = false; updateBuyBtn(); refresh(true);
  }
}
let _toastTimer=null;
function toast(m){
  const el=$('toast'); if(!el){ alert(m); return; }
  el.textContent=m; el.classList.add('show');
  if(_toastTimer) clearTimeout(_toastTimer);
  _toastTimer=setTimeout(()=>el.classList.remove('show'), 3200);
}
function req(m,p){
  if(window.ethereum) return window.ethereum.request({method:m, params:p});
  // 无钱包时只读请求走公共 RPC，新访客也能看到奖池/倒计时；写操作到不了这里
  return fetch(CFG.rpcUrl,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({jsonrpc:'2.0',id:Date.now(),method:m,params:p})})
    .then(r=>r.json()).then(j=>{ if(j.error) throw new Error(j.error.message); return j.result; });
}
async function ethCall(to,d){ return ((await req('eth_call',[{to,data:d},'latest']))||'0x').replace(/^0x/,''); }
async function sendTx(to,d){
  const tx = {from:myAddr,to,data:d};
  // Anubis 只认 legacy type-0，OKX 处理不了 type-2；Polygon 用默认 EIP-1559
  if (chainKey === 'anubis'){
    tx.type = '0x0';
    const gp = await req('eth_gasPrice',[]);
    tx.gasPrice = gp;
  }
  const hash = await req('eth_sendTransaction',[tx]);
  toast(t('txSent'));
  for (let i=0;i<150;i++){
    await new Promise(r=>setTimeout(r,2000));
    const rc = await req('eth_getTransactionReceipt',[hash]);
    if (rc && rc.blockNumber && rc.blockNumber!=='0x0'){
      if (rc.status==='0x1'){ await refresh(true); return rc; }
      throw new Error(t('txReverted'));
    }
  }
  throw new Error(t('txTimeout', {h: hash}));
}
async function connect(){
  if (!window.ethereum) return toast(t('noWallet'));
  try{
    const accs = await req('eth_requestAccounts',[]);
    if(!accs||!accs.length) throw new Error(t('noAddr'));
    myAddr = accs[0];
    const cid = await req('eth_chainId',[]);
    if (parseInt(cid,16)!==CFG.chainId){
      try{ await req('wallet_switchEthereumChain',[{chainId:CFG.chainHex}]); }
      catch(e){
        if(e.code===4902) await req('wallet_addEthereumChain',[{chainId:CFG.chainHex,chainName:CFG.chainName,rpcUrls:[CFG.rpcUrl],nativeCurrency:CFG.native,blockExplorerUrls:[CFG.explorer]}]);
        else throw e;
      }
    }
    $('myAddr').textContent = myAddr;
    updateBuyBtn(); updateWalletBtn();
    // 监听钱包切换
    if(window.ethereum && !window._lotteryListeners){
      window._lotteryListeners = true;
      window.ethereum.on('accountsChanged', accs=>{
        myAddr = (accs&&accs[0])||null;
        $('myAddr').textContent = myAddr || '-';
        updateBuyBtn(); updateWalletBtn();
        refresh();
      });
      window.ethereum.on('chainChanged', ()=> location.reload());
    }
    await refresh(true);
  }catch(e){ toast(t('connectFail', {m: e.message||e})); }
}
async function loadStatic(){
  TICKET = decUint(await ethCall(CFG.CONTRACT,'0x'+SEL.ticketPrice));
  const hasPay = !!(CFG.payTokens && CFG.payTokens.length > 1 && CFG.router);
  const pr = $('payRow'), pl = $('payLabel');
  if(pr) pr.style.display = hasPay ? '' : 'none';
  if(pl) pl.style.display = hasPay ? '' : 'none';
  if(hasPay) renderPayRow();
  if(!hasPay && payIdx!==0) setPay(0);
  const pt = $('perTicket'); if(pt) pt.textContent = t('perTicket', {p: fmt(TICKET)});
  updateTotal(); updateBuyBtn();
  FEE = decUint(await ethCall(CFG.CONTRACT,'0x'+SEL.feeBps));
  const pf = $('poolFormula'); if(pf){ pf.dataset.pct = Number(FEE)/100; pf.innerHTML = t('poolFormula', {pct: pf.dataset.pct}); }
  OWNER = decAddr(await ethCall(CFG.CONTRACT,'0x'+SEL.owner));
  if (myAddr && myAddr.toLowerCase()===OWNER.toLowerCase()) $('ownerPanel').style.display='block';
}
let refreshing = false, lastHeavy = 0, roundEndTime = 0, roundPhase = '';
async function refresh(force){
  if(refreshing) return;
  refreshing = true;
  try{
    await loadStatic();
    refreshReferral();
    updatePriceEcho();
    const rid = Number(decUint(await ethCall(CFG.CONTRACT,'0x'+SEL.currentRound)));
    const h = await ethCall(CFG.CONTRACT,'0x'+SEL.rounds+encUint(rid));
    const w = i => h.slice(i*64,(i+1)*64);
    const endTime=Number(decUint(w(0))), drawBlock=Number(decUint(w(1))),
          sold=Number(decUint(w(2))), sales=decUint(w(3)), jackpot=decUint(w(4));
    const pool = sales + jackpot; // 显示总额（含未扣的平台费），开奖时再扣 10%
    const pp = $('prizePool'); pp.textContent = fmt2(pool); pp.classList.remove('skel');
    try{
      const locked = decUint(await ethCall(CFG.CONTRACT,'0x'+SEL.lockedJackpot));
      $('lockedPool').textContent = fmt(locked);
    }catch(e){ $('lockedPool').textContent='-'; }
    $('sold').textContent = sold + t('ticketsUnit');
    $('sales').textContent = fmt(sales)+' '+TSYM();
    $('jackpot').textContent = fmt(jackpot)+' '+TSYM();
    const now = Math.floor(Date.now()/1000);
    const cd = $('countdown'); cd.classList.remove('skel');
    if (now <= endTime){
      roundEndTime = endTime; roundPhase = 'live';
      $('roundId').textContent = t('roundLive', {n: rid});
      tickCountdown();
      $('buyBox').style.display='block'; $('drawBox').style.display='none';
      updateBuyBtn();
    } else if (drawBlock===0){
      roundPhase = 'closed';
      $('roundId').textContent = t('roundClosed', {n: rid});
      cd.textContent = t('dashClosed');
      $('buyBox').style.display='none'; $('drawBox').style.display='block';
      $('closeBtn').disabled = false;
    } else {
      roundPhase = 'waitdraw';
      $('roundId').textContent = t('roundWaitDraw', {n: rid});
      cd.textContent = t('waitDrawBlk', {b: drawBlock});
      $('buyBox').style.display='none'; $('drawBox').style.display='block';
      $('closeBtn').disabled = true;
    }
    if (myAddr){
      const bal = decUint(await ethCall(CFG.token,'0x'+SEL.balanceOf+encAddr(myAddr)));
      $('myBal').textContent = fmt(bal)+' '+TSYM();
      updatePayBal();
      try{
        const th = await ethCall(CFG.CONTRACT,'0x'+SEL.getTicketOwners+encUint(rid));
        const off = Number(decUint(th.slice(0,64)))*2;
        const owners = decAddrArray(th, off);
        $('myTickets').textContent = owners.filter(a=>a.toLowerCase()===myAddr.toLowerCase()).length + t('ticketsUnit');
      }catch(e){ $('myTickets').textContent='-'; }
    }
    // 上期开奖
    const lr = Number(decUint(await ethCall(CFG.CONTRACT,'0x'+SEL.lastDrawnRound)));
    if (lr>0){
      $('lastRound').textContent = t('lastRound', {n: lr});
      const wh = await ethCall(CFG.CONTRACT,'0x'+SEL.getLastWinners);
      const offW = Number(decUint(wh.slice(0,64)))*2, offA = Number(decUint(wh.slice(64,128)))*2;
      const winners = decAddrArray(wh, offW), amounts = decUintArray(wh, offA);
      let html='';
      for(let i=0;i<winners.length;i++){
        const pz = i===0?t('prize1'):(i<4?t('prize2'):t('prize3'));
        html += '<div class="winner '+(i===0?'':(i<4?'t2':'t3'))+'"><span><span class="tag">'+pz+'</span>'+short(winners[i])+'</span><span><b>'+fmt(amounts[i])+'</b> '+TSYM()+'</span></div>';
      }
      $('lastWinners').innerHTML = (html || '<div class="note">'+t('noBuyers')+'</div>')
        + '<div style="margin-top:10px"><button class="btn-verify" onclick="verifyRound('+lr+',\'lastVerify\')">'+t('verifyBtn')+'</button><div id="lastVerify"></div></div>';
      $('lastRollover').textContent = fmt(decUint(await ethCall(CFG.CONTRACT,'0x'+SEL.lastRollover)))+' '+TSYM();
    }
    // 历史开奖 + 累计榜 + 返佣明细：重活儿，节流到约 40 秒一次（或手动触发时强制）
    const nowMs = Date.now();
    if(force || nowMs - lastHeavy > 40000){
      lastHeavy = nowMs;
      loadHistory();
      refreshRefStats();
      renderMyStats();
    }
  }catch(e){ console.error(e); }
  finally{ refreshing = false; }
}
// 倒计时本地每秒走，不依赖 RPC 刷新
function tickCountdown(){
  const cd = $('countdown'); if(!cd) return;
  if(roundPhase !== 'live' || !roundEndTime) return;
  cd.classList.remove('skel');
  let s = roundEndTime - Math.floor(Date.now()/1000); if(s < 0) s = 0;
  const hh = String(Math.floor(s/3600)).padStart(2,'0'),
        mm = String(Math.floor(s%3600/60)).padStart(2,'0'),
        ss = String(s%60).padStart(2,'0');
  cd.textContent = hh+' : '+mm+' : '+ss;
}
// 开奖可验证：亮出该期开奖用的区块号+区块哈希，谁都能自行核对随机源
async function verifyRound(rid, elId){
  const el = $(elId); if(!el) return;
  el.innerHTML = '<div class="note">'+t('verifyLoading')+'</div>';
  try{
    const h = await ethCall(CFG.CONTRACT,'0x'+SEL.rounds+encUint(rid));
    const drawBlock = Number(decUint(h.slice(64,128))); // rounds 结构第 2 个槽 = drawBlock
    if(!drawBlock){ el.innerHTML = '<div class="note">'+t('verifyNoBlock')+'</div>'; return; }
    let bh='—';
    try{ const blk = await req('eth_getBlockByNumber',['0x'+drawBlock.toString(16), false]); bh=(blk&&blk.hash)||'—'; }catch(e){}
    el.innerHTML = '<div class="verify-box">'
      +'<div class="kv"><span class="k">'+t('verifyDrawBlock')+'</span><span class="v"><a href="'+CFG.explorer+'/block/'+drawBlock+'" target="_blank" rel="noopener" style="color:var(--wine);text-decoration:none">#'+drawBlock+' ↗</a></span></div>'
      +'<div class="kv"><span class="k">'+t('verifyBlockHash')+'</span><span class="v" style="font-size:10.5px;word-break:break-all">'+bh+'</span></div>'
      +'<div class="note" style="margin-top:4px">'+t('verifyExplain')+'</div>'
      +'</div>';
  }catch(e){ el.innerHTML='<div class="note">'+t('verifyNoBlock')+'</div>'; }
}
// 底部三池透明：全部链上实时读，公开只读
async function renderTransparency(){
  const box = $('transPools'); if(!box) return;
  const fmtD = (v,dec)=> Number(formatUnits(v,dec)).toLocaleString('zh-CN',{maximumFractionDigits:2});
  try{
    const cards = await Promise.all(POOLS.map(async (P)=>{
      try{
        const [tp, rid] = await Promise.all([
          ethCall(P.CONTRACT,'0x'+SEL.ticketPrice),
          ethCall(P.CONTRACT,'0x'+SEL.currentRound)
        ]);
        const ridN = Number(decUint(rid));
        const rh = await ethCall(P.CONTRACT,'0x'+SEL.rounds+encUint(ridN));
        const curPool = decUint(rh.slice(3*64,4*64)) + decUint(rh.slice(4*64,5*64)); // sales + jackpot
        let paid = 0n;
        try{
          const logs = await scanLogs([EV_WIN], P.CONTRACT, P.deployBlock);
          for(const lg of logs){
            const d=(lg.data||'0x').replace(/^0x/,'');
            const offA=Number(BigInt('0x'+d.slice(64,128)))*2;
            for(const a of decUintArray(d, offA)) paid += a;
          }
        }catch(e){}
        return '<div class="trans-pool">'
          +'<div class="tp-head"><span>'+P.sym+' '+(LANG==='zh'?'池':'Pool')+'</span><a href="'+CFG.explorer+'/address/'+P.CONTRACT+'" target="_blank" rel="noopener">'+t('transContract')+'</a></div>'
          +'<div class="kv"><span class="k">'+t('transTicketPrice')+'</span><span class="v">'+fmtD(decUint(tp),P.decimals)+' '+P.sym+'</span></div>'
          +'<div class="kv"><span class="k">'+t('transCurPool')+'</span><span class="v">'+fmtD(curPool,P.decimals)+' '+P.sym+'</span></div>'
          +'<div class="kv"><span class="k">'+t('transTotalPaid')+'</span><span class="v">'+fmtD(paid,P.decimals)+' '+P.sym+'</span></div>'
          +'</div>';
      }catch(e){ return '<div class="trans-pool"><div class="tp-head">'+P.sym+'</div><div class="note">'+t('loadFail')+'</div></div>'; }
    }));
    box.innerHTML = cards.join('');
  }catch(e){ console.error('trans', e); }
}
// 我的战绩：当前池链上事件算出累计买票/花费/中奖/返佣/净盈亏