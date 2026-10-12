


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
  featTitle:'正在进行 · 链上彩票', featSub:'当前选中奖池 · 数据链上实时', ftLive:'进行中', ftPoolWord:'奖池', ftPoolLabel:'本期奖池', ftPrice:'单张票价', ftEnd:'售票截止', ftEnter:'查看奖池', navLobby:'游戏大厅', navRecords:'我的记录', navHelp:'帮助中心', navNotice:'公告', navInvite:'邀请奖励', tabHome:'首页', tabPlay:'彩票', tabRecords:'记录', tabInvite:'邀请', noticeT:'公告', noticeB:'暂无新公告。最新动态请关注官方渠道。',
 invTitle:'邀请好友，一起赢', invSub:'邀请朋友加入 ANUBIS PLAY，他们每一次参与，你都有一份奖励——直推 30%、间推 10%，链上结算，随时提取。', invDetail:'邀请明细', invConnect:'连接钱包后查看你的邀请数据', refGoBtn:'打开邀请奖励页 →',
 invS1:'分享链接', invS1s:'复制你的专属链接发给朋友', invS2:'朋友玩游戏', invS2s:'他首次参与即与你绑定（不可改）', invS3:'赚取返佣', invS3s:'直推 30% · 间推 10%，随时提取', invEarnTitle:'各游戏 / 奖池返佣', invCovers:'覆盖范围', invCoversV:'全部 5 个奖池 · 更多游戏陆续接入', invNone:'暂无',
 recTitle:'我的记录', recSub:'你在各奖池的参与与收益，链上实时统计', recPool:'奖池', recTickets:'买票', recSpent:'花费', recWon:'中奖 (次/额)', recNet:'净盈亏', recConnect:'连接钱包后查看你的记录', recNote:'说明：花费按当前票价估算；盈亏仅统计买票与中奖，不含邀请返佣（返佣见「邀请奖励」页）。',
  recEst: '估算', recEstNote: '按当前票价估算，实际成本以当时交易为准',
  hUpdated: '更新于 {t}', refPoolNote: '{n} 个奖池有绑定',
 s2Title:'五大奖池，总有一注属于你', s2Sub:'LGNS · USDT · DAI · A · RM，1 小时一期，链上开奖可验证。', s2Cta:'查看奖池', s3Title:'邀请好友，一起赢', s3Sub:'他们每一次参与，你都有奖励——直推 30% · 间推 10%，随时提取。', s3Cta:'立即邀请', winHdr:'中奖播报',
 barName:'链上彩票', footLine:'链上可查 · 钱包签名 · 理性参与', feat1:'链上可验证', feat1s:'开奖哈希公开', feat2:'5 大奖池', feat2s:'1 小时一期', feat3:'钱包签名', feat3s:'资金不托管',
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
  joinBtn: '加入', joinOk: '已加入！首次购票时将永久绑定邀请关系',
  joinPrompt: '邀请人 {addr} 邀请你加入，点加入确认绑定', joinedMsg: '已加入，邀请人 {addr}，首次购票时永久绑定',
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
  featTitle:'Live · On-chain Lottery', featSub:'Selected pool · live on-chain data', ftLive:'Live', ftPoolWord:'Pool', ftPoolLabel:'Current pool', ftPrice:'Ticket price', ftEnd:'Sales end in', ftEnter:'View pool', navLobby:'Lobby', navRecords:'My Records', navHelp:'Help Center', navNotice:'News', navInvite:'Referral', tabHome:'Home', tabPlay:'Lottery', tabRecords:'Records', tabInvite:'Invite', noticeT:'News', noticeB:'No new announcements. Follow our official channels for updates.',
 invTitle:'Invite friends, win together', invSub:'Invite friends to ANUBIS PLAY. Every time they play, you earn — 30% direct, 10% indirect, settled on-chain, claim anytime.', invDetail:'Referral details', invConnect:'Connect your wallet to see your referral data', refGoBtn:'Open referral page →',
 invS1:'Share link', invS1s:'Copy your unique link and send to friends', invS2:'Friend plays', invS2s:'Binds to you on their first play (permanent)', invS3:'Earn rewards', invS3s:'Direct 30% · Indirect 10%, claim anytime', invEarnTitle:'Rewards by game / pool', invCovers:'Coverage', invCoversV:'All 5 pools · more games coming', invNone:'None',
 recTitle:'My Records', recSub:'Your activity and returns across all pools, live on-chain', recPool:'Pool', recTickets:'Tickets', recSpent:'Spent', recWon:'Won (times/amt)', recNet:'Net P/L', recConnect:'Connect your wallet to see your records', recNote:'Note: spend is estimated at current price; P/L counts tickets and winnings only, excluding referral rewards (see the Referral page).',
  recEst: 'est.', recEstNote: 'Estimated at current ticket price; actual cost per transaction at time of purchase',
  hUpdated: 'Updated {t}', refPoolNote: '{n} pools bound',
 s2Title:'Five pools, one is yours', s2Sub:'LGNS · USDT · DAI · A · RM — hourly rounds, verifiable on-chain draws.', s2Cta:'View pools', s3Title:'Invite friends, win together', s3Sub:'Every time they play, you earn — 30% direct, 10% indirect, claim anytime.', s3Cta:'Invite now', winHdr:'RECENT WINNER',
 barName:'On-chain Lottery', footLine:'On-chain · Wallet-signed · Play responsibly', feat1:'Verifiable', feat1s:'Public draw hash', feat2:'5 Pools', feat2s:'Hourly rounds', feat3:'Wallet-signed', feat3s:'Non-custodial',
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
  joinBtn: 'Join', joinOk: 'Joined! Referral will bind permanently on first purchase',
  joinPrompt: '{addr} invited you. Tap Join to confirm.', joinedMsg: 'Joined. Inviter {addr}, binds permanently on first purchase',
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
  try{
    if(!$('view-play').hidden){ loadHistory(); renderMyStats(); }
    if(!$('view-records').hidden){ loadRecords(); }
    if(!$('view-invite').hidden){ loadInvite(); }
  }catch(e){}
}
function toggleLang(){
  LANG = LANG==='zh' ? 'en' : 'zh';
  localStorage.setItem('lottery_lang', LANG);
  applyLang(); updateWalletBtn();
  refresh(true);
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
    token: '0x4d1d808a081fdac440703b3765fc61f8028c06b8', 
    decimals: 9,
    CONTRACT: '0xb8A20cEFDDAE4b298A4086f3376F01Bdb2d300C7', 
    router: '0x3E412E02B6157fBE80b6C6697f3Ce1142E629019', 
    payTokens: [ 
      {sym:'LGNS', addr:'0x4d1d808a081fdac440703b3765fc61f8028c06b8', dec:9}
    ],
    native: {name:'DAI', symbol:'DAI', decimals:18},
    deployBlock: 16182340 
  },
  polygon: {
    chainId: 137, chainHex: '0x89', chainName: 'Polygon',
    rpcUrl: 'https://polygon-bor-rpc.publicnode.com',
    explorer: 'https://polygonscan.com',
    token: '0xeB51D9A39AD5EEF215dC0Bf39a8821ff804A0F01', 
    decimals: 9,
    CONTRACT: '0x4f528929fc0663280f63b342f60af945f44f644f', 
    native: {name:'POL', symbol:'POL', decimals:18},
    deployBlock: 94920000 
  }
};
let chainKey = 'anubis';
let CFG = CHAINS.anubis;
const POOLS = [
  { sym:'LGNS',
    CONTRACT:'0xb8A20cEFDDAE4b298A4086f3376F01Bdb2d300C7',
    token:'0x4d1d808a081fdac440703b3765fc61f8028c06b8', decimals:9,
    deployBlock:16182340, 
    payTokens:[
      {sym:'LGNS', addr:'0x4d1d808a081fdac440703b3765fc61f8028c06b8', dec:9} 
    ] },
  { sym:'USDT',
    CONTRACT:'0x88f94a52BA5B24Be6BC894f16d4657B12BAb2859',
    token:'0xDfb6a28BC6DC51fed17c27C880F2c66cDd040A3e', decimals:6,
    deployBlock:16196737, 
    payTokens:[
      {sym:'USDT', addr:'0xDfb6a28BC6DC51fed17c27C880F2c66cDd040A3e', dec:6} 
    ] },
  { sym:'DAI',
    CONTRACT:'0x7EC71344CE6fffd602d4911caB54A15f53Cc01A0',
    token:'0x83fd06f0846d9d90b3016bf670efe2e0b11cde14', decimals:18,
    deployBlock:16200709, 
    payTokens:[
      {sym:'DAI', addr:'0x83fd06f0846d9d90b3016bf670efe2e0b11cde14', dec:18} 
    ] },
  { sym:'A',
    CONTRACT:'0x6100cA0904E8b9c521129dEC05AfD4F5BBB9D6fb',
    token:'0xa921267c56b3a57696d6fd7949c9fad0a8e0c177', decimals:18,
    deployBlock:16202660, 
    payTokens:[
      {sym:'A', addr:'0xa921267c56b3a57696d6fd7949c9fad0a8e0c177', dec:18} 
    ] },
  { sym:'RM',
    CONTRACT:'0x5beAdBd9E7C87ACcac218d25aA83Bb707A7E96A3',
    token:'0x2e045e1380f5f5b6e7550328910a7377c9fce59d', decimals:9,
    deployBlock:16204394, 
    payTokens:[
      {sym:'RM', addr:'0x2e045e1380f5f5b6e7550328910a7377c9fce59d', dec:9} 
    ] },
];
let poolIdx = 0;
try{ poolIdx = Number(localStorage.getItem('lottery_pool')||0)||0; if(poolIdx<0||poolIdx>4) poolIdx=0; }catch(e){}
try{ var _qp=new URLSearchParams(location.search).get('pool'); if(_qp!==null){ var _pn=Number(_qp); if(_pn>=0&&_pn<=4){ poolIdx=_pn; try{localStorage.setItem('lottery_pool',String(_pn));}catch(e){} } } }catch(e){}
function TSYM(){ return POOLS[poolIdx].sym; }
Object.assign(CFG, POOLS[poolIdx]);
let poolReqSeq = 0;
function setPool(i){
  if(i===poolIdx) return;
  poolIdx = i;
  poolReqSeq++;
  try{ localStorage.setItem('lottery_pool', String(i)); }catch(e){}
  Object.assign(CFG, POOLS[poolIdx]);
  payIdx = 0; buyN = 1;
  TICKET = 0n; roundPhase = '';
  ['perTicket','totalCost','sold','sales','jackpot','lockedPool','myTickets','myBal'].forEach(function(id){ var e=$(id); if(e) e.textContent='-'; });
  var _pp=$('prizePool'); if(_pp){ _pp.textContent='--'; _pp.classList.add('skel'); }
  var _cd=$('countdown'); if(_cd){ _cd.textContent='--'; _cd.classList.add('skel'); }
  var _lw=$('lastWinners'); if(_lw){ _lw.innerHTML='<div class="note">'+t('loading')+'</div>'; }
  var _lr=$('lastRollover'); if(_lr){ _lr.textContent='-'; }
  var _hl=$('historyList'); if(_hl){ _hl.innerHTML='<div class="note">'+t('loading')+'</div>'; }
  var _lb=$('leaderboard'); if(_lb){ _lb.innerHTML='<div class="note">'+t('loading')+'</div>'; }
  var _ri=$('roundId'); if(_ri){ _ri.textContent='-'; }
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
  getAmountsIn: '1f00ca74', swapTokensForExactTokens: '4a25d94a', 
  ticketPrice: '1209b1f6', feeBps: '24a9d853', currentRound: '8a19c8bc',
  rounds: '8c65c81f', lastDrawnRound: '9fe8862a', lastRollover: '953523e8',
  getLastWinners: '95690936', getTicketOwners: '36a65e80', owner: '8da5cb5b',
  lockedJackpot: '975008a3', winnableJackpot: 'eb111f91', setRoundDuration: '36c92c3f'
};
function encUint(v){ return BigInt(v).toString(16).padStart(64,'0'); }
function encAddr(a){ return '0'.repeat(24) + a.toLowerCase().replace(/^0x/,''); }
function encAddrArray(arr){ 
  return encUint(64) + encUint(arr.length) + arr.map(encAddr).join('');
}
function decUint(h){ return BigInt('0x'+h); }
function decAddr(h){ return '0x'+h.slice(-40); }
function decBool(h){ return BigInt('0x'+h) !== 0n; }
function decAddrArray(h, off){ 
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
let payIdx = 0, quoteInMax = 0n; 
function setBuyN(n){
  buyN = Math.max(1, Math.min(200, n));
  const sn = $('stepperNum'); if(sn) sn.textContent = t('ticketsCount', {n: buyN});
  document.querySelectorAll('#ticketRow .qbtn').forEach(b=> b.classList.toggle('sel', Number(b.dataset.n)===buyN));
  updateTotal();
  updateBuyBtn();
}
function payToken(){ return (CFG.payTokens && CFG.payTokens[payIdx]) || CFG.payTokens[0]; }
function payPath(pt){ return pt.via ? [pt.addr, pt.via, CFG.token] : [pt.addr, CFG.token]; }
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
async function quotePay(){
  quoteInMax = 0n;
  if(payIdx===0 || TICKET<=0n) return 0n;
  const pt = payToken();
  const need = TICKET * BigInt(buyN);
  const h = await ethCall(CFG.router, '0x'+SEL.getAmountsIn+encUint(need)+encAddrArray(payPath(pt)));
  const amtIn = decUint(h.slice(128, 192)); 
  quoteInMax = amtIn * 105n / 100n;
  return quoteInMax;
}
function fmtPay(v, pt){
  const s = formatUnits(v, pt.dec);
  const dot = s.indexOf('.');
  if(dot < 0) return s;
  const cut = s.slice(dot+1, dot+3).replace(/0+$/, ''); 
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
async function nextBuyStep(){
  if(!myAddr) return 'connect';
  if(payIdx>0 && CFG.router){
    const pt = payToken(), need = TICKET*BigInt(buyN);
    await quotePay(); 
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
  return reqPublic(m,p);
}
var PUBLIC_RPC = 'https://rpc.anubispace.org';
function reqPublic(m,p,retries){
  var maxTry = (retries==null)?2:retries, attempt=0;
  function once(){
    attempt++;
    var ctrl=null, timer=null;
    try{ if(typeof AbortController!=='undefined'){ ctrl=new AbortController(); timer=setTimeout(function(){ try{ctrl.abort();}catch(e){} },10000); } }catch(e){}
    var opt={method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({jsonrpc:'2.0',id:Date.now()+''+attempt,method:m,params:p})};
    if(ctrl) opt.signal=ctrl.signal;
    return fetch(PUBLIC_RPC,opt).then(function(r){
      if(timer)clearTimeout(timer);
      if(!r.ok) throw new Error('HTTP '+r.status);
      return r.json();
    }).then(function(j){
      if(j.error) throw new Error(j.error.message||'rpc error');
      return j.result;
    }).catch(function(e){
      if(timer)clearTimeout(timer);
      if(attempt<=maxTry) return new Promise(function(res){ setTimeout(res,800*attempt); }).then(once);
      throw e;
    });
  }
  return once();
}
async function ethCall(to,d){ return ((await reqPublic('eth_call',[{to,data:d},'latest']))||'0x').replace(/^0x/,''); }
async function sendTx(to,d){
  const tx = {from:myAddr,to,data:d};
  if (chainKey === 'anubis'){
    tx.type = '0x0';
    const gp = await reqPublic('eth_gasPrice',[]);
    tx.gasPrice = gp;
  }
  if(!window.ethereum) throw new Error(t('noWallet'));
  const hash = await window.ethereum.request({method:'eth_sendTransaction',params:[tx]});
  toast(t('txSent'));
  for (let i=0;i<150;i++){
    await new Promise(r=>setTimeout(r,2000));
    const rc = await reqPublic('eth_getTransactionReceipt',[hash]);
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
let refreshingFor = -1, lastHeavy = 0, roundEndTime = 0, roundPhase = '';
async function refresh(force){
  const mySeq = (typeof poolReqSeq!=='undefined') ? poolReqSeq : 0;
  if(refreshingFor === mySeq) return;
  refreshingFor = mySeq;
  const alive = () => (typeof poolReqSeq==='undefined') || poolReqSeq===mySeq;
  try{
    await loadStatic(); if(!alive()) return;
    refreshReferral();
    updatePriceEcho();
    const rid = Number(decUint(await ethCall(CFG.CONTRACT,'0x'+SEL.currentRound))); if(!alive()) return;
    const h = await ethCall(CFG.CONTRACT,'0x'+SEL.rounds+encUint(rid)); if(!alive()) return;
    const w = i => h.slice(i*64,(i+1)*64);
    const endTime=Number(decUint(w(0))), drawBlock=Number(decUint(w(1))),
          sold=Number(decUint(w(2))), sales=decUint(w(3)), jackpot=decUint(w(4));
    const pool = sales + jackpot; 
    const pp = $('prizePool'); pp.textContent = fmt2(pool); pp.classList.remove('skel');
    try{
      const locked = decUint(await ethCall(CFG.CONTRACT,'0x'+SEL.lockedJackpot)); if(!alive()) return;
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
      const bal = decUint(await ethCall(CFG.token,'0x'+SEL.balanceOf+encAddr(myAddr))); if(!alive()) return;
      $('myBal').textContent = fmt(bal)+' '+TSYM();
      updatePayBal();
      try{
        const th = await ethCall(CFG.CONTRACT,'0x'+SEL.getTicketOwners+encUint(rid)); if(!alive()) return;
        const off = Number(decUint(th.slice(0,64)))*2;
        const owners = decAddrArray(th, off);
        $('myTickets').textContent = owners.filter(a=>a.toLowerCase()===myAddr.toLowerCase()).length + t('ticketsUnit');
      }catch(e){ $('myTickets').textContent='-'; }
    }
    const lr = Number(decUint(await ethCall(CFG.CONTRACT,'0x'+SEL.lastDrawnRound))); if(!alive()) return;
    if (lr>0){
      $('lastRound').textContent = t('lastRound', {n: lr});
      const wh = await ethCall(CFG.CONTRACT,'0x'+SEL.getLastWinners); if(!alive()) return;
      const offW = Number(decUint(wh.slice(0,64)))*2, offA = Number(decUint(wh.slice(64,128)))*2;
      const winners = decAddrArray(wh, offW), amounts = decUintArray(wh, offA);
      let html='';
      for(let i=0;i<winners.length;i++){
        const pz = i===0?t('prize1'):(i<4?t('prize2'):t('prize3'));
        html += '<div class="winner '+(i===0?'':(i<4?'t2':'t3'))+'"><span><span class="tag">'+pz+'</span>'+short(winners[i])+'</span><span><b>'+fmt(amounts[i])+'</b> '+TSYM()+'</span></div>';
      }
      $('lastWinners').innerHTML = (html || '<div class="note">'+t('noBuyers')+'</div>')
        + '<div style="margin-top:10px"><button class="btn-verify" onclick="verifyRound('+lr+',\'lastVerify\')">'+t('verifyBtn')+'</button><div id="lastVerify"></div></div>';
      if(!alive()) return; $('lastRollover').textContent = fmt(decUint(await ethCall(CFG.CONTRACT,'0x'+SEL.lastRollover)))+' '+TSYM(); if(!alive()) return;
    }
    const nowMs = Date.now();
    if(force || nowMs - lastHeavy > 40000){
      lastHeavy = nowMs;
      loadHistory();
      refreshRefStats();
      renderMyStats();
    }
  }catch(e){ console.error(e); try{ toast(t('loadFail')); }catch(_){} }
  finally{ if(refreshingFor===mySeq) refreshingFor=-1; }
}
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
async function verifyRound(rid, elId){
  const el = $(elId); if(!el) return;
  el.innerHTML = '<div class="note">'+t('verifyLoading')+'</div>';
  try{
    const h = await ethCall(CFG.CONTRACT,'0x'+SEL.rounds+encUint(rid)); if(!alive()) return;
    const drawBlock = Number(decUint(h.slice(64,128))); 
    if(!drawBlock){ el.innerHTML = '<div class="note">'+t('verifyNoBlock')+'</div>'; return; }
    let bh='—';
    try{ const blk = await reqPublic('eth_getBlockByNumber',['0x'+drawBlock.toString(16), false]); bh=(blk&&blk.hash)||'—'; }catch(e){}
    el.innerHTML = '<div class="verify-box">'
      +'<div class="kv"><span class="k">'+t('verifyDrawBlock')+'</span><span class="v"><a href="'+CFG.explorer+'/block/'+drawBlock+'" target="_blank" rel="noopener" style="color:var(--wine);text-decoration:none">#'+drawBlock+' ↗</a></span></div>'
      +'<div class="kv"><span class="k">'+t('verifyBlockHash')+'</span><span class="v" style="font-size:10.5px;word-break:break-all">'+bh+'</span></div>'
      +'<div class="note" style="margin-top:4px">'+t('verifyExplain')+'</div>'
      +'</div>';
  }catch(e){ el.innerHTML='<div class="note">'+t('verifyNoBlock')+'</div>'; }
}
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
        const curPool = decUint(rh.slice(3*64,4*64)) + decUint(rh.slice(4*64,5*64)); 
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
async function renderMyStats(){
  const box = $('myStats'); if(!box) return;
  const pl = $('myStatsPool'); if(pl) pl.textContent = myAddr ? t('msPool') : '';
  if(!myAddr){ box.innerHTML = '<div class="note">'+t('myStatsConnect')+'</div>'; return; }
  const me = myAddr.toLowerCase();
  try{
    const [tLogs, wLogs, rLogs] = await Promise.all([
      scanLogs([EV_TICKETS]), scanLogs([EV_WIN]), scanLogs([EV_REFREWARD])
    ]);
    let tickets = 0n;
    for(const l of tLogs){
      if(('0x'+l.topics[2].slice(-40)).toLowerCase()!==me) continue;
      tickets += BigInt('0x'+(l.data||'0x').replace(/^0x/,'').slice(0,64));
    }
    let winCnt=0, winAmt=0n;
    for(const l of wLogs){
      const d=(l.data||'0x').replace(/^0x/,'');
      const offW=Number(BigInt('0x'+d.slice(0,64)))*2, offA=Number(BigInt('0x'+d.slice(64,128)))*2;
      const ws=decAddrArray(d,offW), as=decUintArray(d,offA);
      for(let i=0;i<ws.length;i++){ if(ws[i].toLowerCase()===me){ winCnt++; winAmt+=as[i]; } }
    }
    let ref=0n;
    for(const l of rLogs){
      const d=(l.data||'0x').replace(/^0x/,'');
      const l1=('0x'+d.slice(0,64).slice(-40)).toLowerCase(), dd1=BigInt('0x'+(d.slice(64,128)||'0'));
      const l2=('0x'+d.slice(128,192).slice(-40)).toLowerCase(), dd2=BigInt('0x'+(d.slice(192,256)||'0'));
      if(l1===me) ref+=dd1;
      if(l2===me) ref+=dd2;
    }
    const spent = tickets * TICKET; 
    const net = winAmt + ref - spent;
    const neg = net<0n, netAbs = neg ? -net : net;
    const sym = TSYM();
    box.innerHTML = '<div class="mystats">'
      +'<div class="ms"><div class="k">'+t('msTicketsBought')+'</div><div class="v">'+tickets.toString()+t('ticketsUnit')+'</div></div>'
      +'<div class="ms"><div class="k">'+t('msSpent')+'</div><div class="v">≈ '+fmt(spent)+' '+sym+'</div></div>'
      +'<div class="ms"><div class="k">'+t('msWon')+'</div><div class="v">'+t('msWonTimes',{n:winCnt})+' · '+fmt(winAmt)+' '+sym+'</div></div>'
      +'<div class="ms"><div class="k">'+t('msRefEarned')+'</div><div class="v">'+fmt(ref)+' '+sym+'</div></div>'
      +'<div class="ms" style="grid-column:1/-1"><div class="k">'+t('msNet')+' '+t('msSpentNote')+'</div><div class="v" style="color:'+(neg?'var(--wine)':'#3E6B4F')+'">'+(neg?'-':'+')+fmt(netAbs)+' '+sym+'</div></div>'
      +'</div>';
  }catch(e){ console.error('myStats',e); box.innerHTML='<div class="note">'+t('loadFail')+'</div>'; }
}
const EV_WIN = '0xab9af1684355064aa9258894f5c85b041fd7a83e4fe0eb02e607c13d8cb627b4';
const EV_REFBOUND = '0x8ceb585bfbbc2a8c702024b1d2f212e7ba1caff58b232f071b023d184997b111';
const EV_TICKETS = '0xc8c5c2b0e44fb6312c0098ec42642058527713d0a1d29a5c6ccbfe34d714d41e';
const EV_REFREWARD = '0xbfcb51139629056da37f44a10daa7f67e6ce0b9083e03a7408b3ad1a456ce097';
const PADADDR = a => '0x' + '0'.repeat(24) + a.toLowerCase().replace(/^0x/,'');
const _logCache = {};
const _logPending = {};
function resetLogCache(){ for(const k in _logCache) delete _logCache[k]; for(const k in _logPending) delete _logPending[k]; }
function _logId(l){ return (l.transactionHash||'')+':'+(l.logIndex||''); }
async function scanLogs(topics, contract, deployFrom){
  contract = contract || CFG.CONTRACT;
  const dep = (deployFrom!=null) ? deployFrom : (CFG.deployBlock || 0);
  const key = chainKey + '|' + contract + '|' + JSON.stringify(topics);
  let c = _logCache[key];
  if(!c){ c = { next: dep, logs: [], seen: {} }; _logCache[key] = c; }
  if(_logPending[key]){ try{ await _logPending[key]; }catch(e){} return c.logs; }
  const job = (async ()=>{
    const latest = Number(BigInt(await reqPublic('eth_blockNumber',[])));
    const CHUNK = 4000;
    let from = c.next;
    while(from <= latest){
      const to = Math.min(from + CHUNK - 1, latest);
      const part = await reqPublic('eth_getLogs',[{address:contract, topics,
        fromBlock:'0x'+from.toString(16), toBlock:'0x'+to.toString(16)}]);
      if(part && part.length) for(const l of part){
        const id = _logId(l);
        if(l.removed){ if(c.seen[id]){ delete c.seen[id]; c.logs = c.logs.filter(function(x){ return _logId(x)!==id; }); } continue; }
        if(!c.seen[id]){ c.seen[id]=1; c.logs.push(l); }
      }
      from = to + 1;
    }
    if(latest + 1 > c.next) c.next = latest + 1;
  })();
  _logPending[key]=job;
  try{ await job; }finally{ delete _logPending[key]; }
  return c.logs;
}
async function refreshRefStats(){
  const box = $('refStats');
  if(!box) return;
  if(!myAddr){ box.style.display='none'; return; }
  const me = myAddr.toLowerCase();
  try{
    const [bLogs, tLogs, rLogs] = await Promise.all([
      scanLogs([EV_REFBOUND]), scanLogs([EV_TICKETS]), scanLogs([EV_REFREWARD])
    ]);
    const boundRef = {}; 
    for(const l of bLogs){
      const buyer = ('0x'+l.topics[1].slice(-40)).toLowerCase();
      const ref = ('0x'+l.topics[2].slice(-40)).toLowerCase();
      boundRef[buyer] = ref;
    }
    const direct = Object.keys(boundRef).filter(b => boundRef[b]===me);
    const dset = new Set(direct);
    const indirect = Object.keys(boundRef).filter(b => !dset.has(b) && b!==me && dset.has(boundRef[b]));
    const ticketsBy = {};
    for(const l of tLogs){
      const buyer = ('0x'+l.topics[2].slice(-40)).toLowerCase();
      const n = BigInt('0x'+(l.data||'0x').replace(/^0x/,'').slice(0,64));
      ticketsBy[buyer] = (ticketsBy[buyer]||0n) + n;
    }
    const earnBy = {}; 
    for(const l of rLogs){
      const d = (l.data||'0x').replace(/^0x/,'');
      const buyer = ('0x'+l.topics[2].slice(-40)).toLowerCase();
      const l1 = ('0x'+d.slice(0,64).slice(-40)).toLowerCase();
      const dd1 = BigInt('0x'+(d.slice(64,128)||'0'));
      const l2 = ('0x'+d.slice(128,192).slice(-40)).toLowerCase();
      const dd2 = BigInt('0x'+(d.slice(192,256)||'0'));
      if(!earnBy[buyer]) earnBy[buyer] = {e1:0n, e2:0n};
      if(l1===me) earnBy[buyer].e1 += dd1;
      if(l2===me) earnBy[buyer].e2 += dd2;
    }
    const sum = (arr, f) => arr.reduce((a,b)=>a+f(b), 0n);
    const dTk = sum(direct, b => ticketsBy[b]||0n);
    const iTk = sum(indirect, b => ticketsBy[b]||0n);
    const dEarn = sum(direct, b => (earnBy[b]||{e1:0n}).e1);
    const iEarn = sum(indirect, b => (earnBy[b]||{e2:0n}).e2);
    $('refDirectStat').textContent = t('refStatLine', {n: direct.length, tk: dTk.toString(), amt: fmt(dEarn)});
    $('refIndirectStat').textContent = t('refStatLine', {n: indirect.length, tk: iTk.toString(), amt: fmt(iEarn)});
    let html = '';
    const row = (b, tag) => {
      const e = earnBy[b]||{e1:0n,e2:0n};
      const amt = tag==='d' ? e.e1 : e.e2;
      html += '<div class="winner"><span><span class="tag">'+t(tag==='d'?'refTagD':'refTagI')+'</span>'+short(b)+'</span><span>'+t('refRowStat',{tk:(ticketsBy[b]||0n).toString(), amt:fmt(amt)})+'</span></div>';
    };
    direct.forEach(b => row(b,'d'));
    indirect.forEach(b => row(b,'i'));
    $('refDetailList').innerHTML = html || '<div class="note">'+t('refNoInvite')+'</div>';
    box.style.display='';
  }catch(e){ console.error('refStats', e); box.style.display='none'; }
}
async function loadHistory(){
  try{
    const logs = (await scanLogs([EV_WIN])).slice();
    if(!logs.length){
      $('historyList').innerHTML = '<div class="note">'+t('noHistory')+'</div>';
      $('leaderboard').innerHTML = '<div class="note">'+t('noData')+'</div>';
      return;
    }
    const total = {}; 
    let hhtml = '';
    logs.sort((a,b)=> Number(BigInt(a.topics[1])) - Number(BigInt(b.topics[1])));
    for(const lg of logs){
      const rid = Number(BigInt(lg.topics[1]));
      const d = (lg.data||'0x').replace(/^0x/,'');
      const offW = Number(BigInt('0x'+d.slice(0,64)))*2;
      const offA = Number(BigInt('0x'+d.slice(64,128)))*2;
      const winners = decAddrArray(d, offW), amounts = decUintArray(d, offA);
      let sum = 0n;
      let wh = '';
      for(let i=0;i<winners.length;i++){
        sum += amounts[i];
        const k = winners[i].toLowerCase();
        if(!total[k]) total[k] = {n:0, amt:0n};
        total[k].n++; total[k].amt += amounts[i];
        const pz = i===0?t('prize1'):(i<4?t('prize2'):t('prize3'));
        wh += '<div class="winner"><span><span class="tag">'+pz+'</span>'+short(winners[i])+'</span><span><b>'+fmt(amounts[i])+'</b></span></div>';
      }
      hhtml = '<div style="margin-bottom:10px"><div class="row"><span class="k"><b>'+t('roundN',{n:rid})+'</b></span><span class="v">'+t('totalPaid',{amt:fmt(sum)})+'</span></div>'+wh
        + '<div style="margin-top:4px"><button class="btn-verify" onclick="verifyRound('+rid+',\'hv'+rid+'\')">'+t('verifyBtn')+'</button><div id="hv'+rid+'"></div></div>'
        + '</div>' + hhtml;
    }
    $('historyList').innerHTML = hhtml || '<div class="note">'+t('noHistory')+'</div>';
    const arr = Object.entries(total).sort((a,b)=> Number(b[1].amt - a[1].amt)).slice(0,10);
    const medal = ['🥇','🥈','🥉'];
    let lh = '';
    arr.forEach(([addr, st], i)=>{
      lh += '<div class="winner"><span>'+(medal[i]||(i+1)+'.')+' '+short(addr)+'</span><span>'+t('wonTimes',{n:st.n, amt:fmt(st.amt)})+'</span></div>';
    });
    $('leaderboard').innerHTML = lh || '<div class="note">'+t('noData')+'</div>';
  }catch(e){
    console.error('history', e);
    $('historyList').innerHTML = '<div class="note">'+t('loadFail')+'</div>';
    $('leaderboard').innerHTML = '<div class="note">'+t('loadFail')+'</div>';
  }
}
async function approve(){
  await sendTx(CFG.token, '0x'+SEL.approve+encAddr(CFG.CONTRACT)+encUint(TICKET*200n));
  toast(t('approveOk'));
}
async function buy(){
  const ref = getRef();
  if(ref) await sendTx(CFG.CONTRACT, '0x'+SEL.buyTicketsWithRef+encUint(buyN)+encAddr(ref));
  else await sendTx(CFG.CONTRACT, '0x'+SEL.buyTickets+encUint(buyN));
  toast(t('buyOk')); sfx('success');
}
function getRef(){
  try{
    const saved = localStorage.getItem('anubis_joined_ref');
    if(saved && /^0x[0-9a-fA-F]{40}$/.test(saved)){
      if(myAddr && saved.toLowerCase()===myAddr.toLowerCase()) return null;
      return saved;
    }
    const r = new URLSearchParams(location.search).get('ref');
    if(r && /^0x[0-9a-fA-F]{40}$/.test(r)){
      if(myAddr && r.toLowerCase()===myAddr.toLowerCase()) return null;
      return r;
    }
  }catch(e){}
  return null;
}
function joinRef(){
  const r = new URLSearchParams(location.search).get('ref');
  if(r && /^0x[0-9a-fA-F]{40}$/.test(r)){
    try{ localStorage.setItem('anubis_joined_ref', r); }catch(e){}
    renderJoinBanner();
    toast(t('joinOk'));
  }
}
function renderJoinBanner(){
  const banner = $('joinBanner');
  if(!banner) return;
  const urlRef = (()=>{ try{ return new URLSearchParams(location.search).get('ref'); }catch(e){ return null; } })();
  const saved = (()=>{ try{ return localStorage.getItem('anubis_joined_ref'); }catch(e){ return null; } })();
  const validUrl = urlRef && /^0x[0-9a-fA-F]{40}$/.test(urlRef);
  if(saved && /^0x[0-9a-fA-F]{40}$/.test(saved)){
    banner.style.display = '';
    banner.innerHTML = '<span>'+t('joinedMsg',{addr: short(saved)})+'</span>';
  } else if(validUrl){
    if(myAddr && urlRef.toLowerCase()===myAddr.toLowerCase()){ banner.style.display='none'; return; }
    banner.style.display = '';
    banner.innerHTML = '<span>'+t('joinPrompt',{addr: short(urlRef)})+'</span> <button class="btn-join" onclick="joinRef()">'+t('joinBtn')+'</button>';
  } else {
    banner.style.display = 'none';
  }
}
function copyRefLink(){
  const el = $('refLink');
  if(!el || !el.value) return;
  el.select();
  try{ document.execCommand('copy'); }catch(e){}
  if(navigator.clipboard) navigator.clipboard.writeText(el.value).catch(()=>{});
  toast(t('copyOk'));
}
async function claimReferral(){
  await sendTx(CFG.CONTRACT, '0x'+SEL.claimReferral);
  toast(t('claimOk'));
}
async function refreshReferral(){
  const link = $('refLink');
  if(link) link.value = myAddr ? (location.origin + location.pathname + '?ref=' + myAddr) : '';
  if(link) link.placeholder = myAddr ? '' : t('notConnected');
  const banner = $('refViaBanner');
  if(banner) banner.style.display = getRef() ? '' : 'none';
  if(!myAddr){
    if($('myReferrer')) $('myReferrer').textContent='-';
    if($('myRefRewards')) $('myRefRewards').textContent='-';
    if($('claimRefBtn')) $('claimRefBtn').style.display='none';
    return;
  }
  try{
    const r = decAddr(await ethCall(CFG.CONTRACT,'0x'+SEL.referrer+encAddr(myAddr)));
    $('myReferrer').textContent =
      (r==='0x0000000000000000000000000000000000000000') ? t('noReferrer') : short(r);
  }catch(e){ $('myReferrer').textContent='-'; }
  try{
    const rw = decUint(await ethCall(CFG.CONTRACT,'0x'+SEL.referralRewards+encAddr(myAddr)));
    $('myRefRewards').textContent = fmt(rw)+' '+TSYM();
    $('claimRefBtn').style.display = rw>0n ? '' : 'none';
  }catch(e){ $('myRefRewards').textContent='-'; }
}
async function closeRound(){ await sendTx(CFG.CONTRACT,'0x'+SEL.closeRound); toast(t('closedOk')); }
async function sendTxQuiet(to,d){
  const tx = {from:myAddr,to,data:d};
  if (chainKey === 'anubis'){
    tx.type = '0x0';
    tx.gasPrice = await req('eth_gasPrice',[]);
  }
  const hash = await req('eth_sendTransaction',[tx]);
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
async function drawVisual(){
  const ov=$('drawOverlay'), stage=$('ballStage'), res=$('drawResults'), st=$('drawStatus');
  ov.classList.add('show'); res.innerHTML=''; $('drawClose').style.display='none';
  stage.innerHTML='';
  const balls=[];
  for(let i=0;i<14;i++){
    const b=document.createElement('div'); b.className='ball'; b.textContent='?';
    b.style.animationDuration=(0.7+Math.random()*0.9).toFixed(2)+'s';
    b.style.animationDelay=(Math.random()*0.6).toFixed(2)+'s';
    stage.appendChild(b); balls.push(b);
  }
  const rnd=setInterval(()=>{ balls.forEach(b=>{ if(!b.dataset.done) b.textContent=Math.floor(Math.random()*99)+1; }); },120);
  const stop=()=>clearInterval(rnd);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  try{
    if(!myAddr) throw new Error(t('needWallet'));
    const ridBefore=Number(decUint(await ethCall(CFG.CONTRACT,'0x'+SEL.currentRound)));
    st.textContent=t('waitingConfirm');
    await sendTxQuiet(CFG.CONTRACT,'0x'+SEL.draw);
    const ridAfter=Number(decUint(await ethCall(CFG.CONTRACT,'0x'+SEL.currentRound)));
    if(ridAfter<=ridBefore){
      stop();
      st.textContent=t('hashExpired');
      $('drawClose').style.display='block';
      return;
    }
    st.textContent=t('drawSuccess');
    const wh=await ethCall(CFG.CONTRACT,'0x'+SEL.getLastWinners);
    const offW=Number(decUint(wh.slice(0,64)))*2, offA=Number(decUint(wh.slice(64,128)))*2;
    const winners=decAddrArray(wh,offW), amounts=decUintArray(wh,offA);
    stop();
    if(!winners.length){
      balls.forEach(b=>{ b.classList.add('out'); b.textContent='-'; });
      st.textContent=t('noBuyers');
      $('drawClose').style.display='block';
      return;
    }
    const order=[];
    for(let i=4;i<winners.length;i++) order.push({i,t:'t3',label:t('prize3')});
    for(let i=1;i<Math.min(4,winners.length);i++) order.push({i,t:'t2',label:t('prize2')});
    order.push({i:0,t:'t1',label:t('prize1')});
    let bi=0;
    for(const o of order){
      const b=balls[bi++]; b.dataset.done='1';
      b.className='ball '+o.t; b.textContent=o.label[0];
      const row=document.createElement('div'); row.className='wrow';
      row.innerHTML='<span><span class="tag">'+o.label+'</span><span class="wa">'+short(winners[o.i])+'</span></span><span class="wamt">'+fmt(amounts[o.i])+' '+TSYM()+'</span>';
      res.appendChild(row);
      if(o.t==='t1'){ st.textContent=t('firstBorn'); sfx('win'); }
      await sleep(o.t==='t1'?1200:650);
    }
    balls.slice(bi).forEach(b=>{ b.classList.add('out'); b.textContent='-'; });
    st.textContent=t('drawDone');
    $('drawClose').style.display='block';
  }catch(e){
    stop();
    st.textContent=t('drawFail', {m: e.message||e});
    $('drawClose').style.display='block';
  }
}
function closeDraw(){ $('drawOverlay').classList.remove('show'); refresh(true); }
async function approveSeed(){
  const amt = parseUnits($('seedAmt').value||'0');
  if (amt<=0n) return toast(t('enterAmt'));
  await sendTx(CFG.token,'0x'+SEL.approve+encAddr(CFG.CONTRACT)+encUint(amt));
  toast(t('seedApproveOk'));
}
async function seed(){
  const amt = parseUnits($('seedAmt').value||'0');
  if (amt<=0n) return toast(t('enterAmt'));
  if(!confirm(t('seedConfirm', {amt: $('seedAmt').value}))) return;
  await sendTx(CFG.CONTRACT,'0x'+SEL.seedJackpot+encUint(amt));
  toast(t('seedDone'));
}
function setPriceQuick(v){
  $('priceAmt').value = v;
  updatePriceEcho();
}
function updatePriceEcho(){
  const v = ($('priceAmt').value || '').trim();
  const el = $('priceEcho');
  if(!el) return;
  if(v) el.textContent = '👉 ' + t('priceEcho', {p: v});
  else el.textContent = TICKET > 0n ? t('priceCur', {p: fmt(TICKET)}) : '';
}
async function doSetTicketPrice(){
  const v = ($('priceAmt').value || '0').trim();
  let amt = 0n;
  try{ amt = parseUnits(v); }catch(e){ return toast(t('amtBad')); }
  if(amt <= 0n) return toast(t('enterAmt'));
  if(!confirm(t('priceConfirm', {p: v}))) return;
  await sendTx(CFG.CONTRACT,'0x'+SEL.setTicketPrice+encUint(amt));
  $('priceAmt').value=''; updatePriceEcho();
  toast(t('priceDone', {p: v}));
  await refresh();
}
async function doSetRoundDuration(){
  if(!confirm(t('durationConfirm'))) return;
  await sendTx(CFG.CONTRACT,'0x'+SEL.setRoundDuration+encUint(3600n));
  toast(t('durationDone'));
  await refresh();
}
setInterval(()=>refresh(), 15000);
setInterval(tickCountdown, 1000);

var HG=['','',''];;
var POOLMETA=[{c:'#1E5541'},{c:'#2E7D6A'},{c:'#9A834F'},{c:'#4A6B8A'},{c:'#8A5A3C'}];
var HGAMES=[
  {zh:['龙虎斗','经典对押玩法，押中赢取奖池，链上实时结算、公平可查。'],en:['Dragon vs Tiger','Classic head-to-head betting, settled on-chain and verifiable.']},
  {zh:['幸运转盘','转动命运之轮，赢取随机大奖。'],en:['Lucky Wheel','Spin the wheel of fate for random rewards.']},
  {zh:['竞技场','多人同场竞技，胜者瓜分奖池。'],en:['Arena','Multiplayer showdown, winners split the pool.']}
];
var HHELP=[
  {zh:['准备钱包','安装并打开支持 Anubis 链的钱包（如 OKX Wallet），用钱包自带浏览器访问本站。'],en:['Get a wallet','Install a wallet that supports Anubis (e.g. OKX), open this site in its in-app browser.']},
  {zh:['切换网络','连接后按提示切换到 Anubis 链；网络不对时页面会提醒。'],en:['Switch network','After connecting, switch to Anubis when prompted.']},
  {zh:['准备代币与 Gas','准备对应奖池的代币（LGNS / USDT / DAI / A / RM）以及少量 Gas。'],en:['Tokens & gas','Hold the pool token (LGNS/USDT/DAI/A/RM) and a little gas.']},
  {zh:['了解规则','看懂票价、奖项、开奖与返佣规则，再参与。'],en:['Read the rules','Understand price, prizes, draw and referral before playing.']}
];
var HNOTE={zh:'<b>费用</b>：开奖按比例扣平台费，其余按奖项派给中奖者。<br><b>授权</b>：首次用某代币买票需先授权一次，之后直接购票。<br><b>开奖</b>：每期截止后锁定开奖区块，用之后的区块哈希做随机源，任何人可触发开奖。<br><b>记录</b>：历史开奖、我的票据、邀请返佣都在彩票页，全部链上可查。',en:'<b>Fees</b>: a platform fee is deducted at draw; the rest goes to winners by tier.<br><b>Approval</b>: first purchase with a token needs one approval.<br><b>Draw</b>: a future block hash after cutoff is the random source; anyone can trigger it.<br><b>Records</b>: history, your tickets and referrals live on the lottery page, all on-chain.'};
var hpool={};
function hcd(tt){var s=tt-Math.floor(Date.now()/1000);if(s<0)s=0;var h=String(Math.floor(s/3600)).padStart(2,'0'),m=String(Math.floor(s%3600/60)).padStart(2,'0'),x=String(s%60).padStart(2,'0');return h+':'+m+':'+x;}
function fmtD(v,dec){return Number(formatUnits(v,dec)).toLocaleString('en-US',{maximumFractionDigits:2});}
function fmtPr(v,dec){var s=BigInt(v).toString().padStart(dec+1,'0');var i=s.slice(0,-dec),f=s.slice(-dec).replace(/0+$/,'');return i+(f?'.'+f:'');}
function loadHPool(i){
  var P=POOLS[i], st=hpool[i]||(hpool[i]={});
  return ethCall(P.CONTRACT,'0x'+SEL.ticketPrice).then(function(h){st.price=decUint(h);return ethCall(P.CONTRACT,'0x'+SEL.currentRound);})
    .then(function(h){st.round=Number(decUint(h));return ethCall(P.CONTRACT,'0x'+SEL.rounds+encUint(st.round));})
    .then(function(h){var w=function(k){return h.slice(k*64,(k+1)*64);};st.endTime=Number(decUint(w(0)));var db=Number(decUint(w(1)));st.pool=decUint(w(3))+decUint(w(4));var now=Math.floor(Date.now()/1000);st.phase=now<=st.endTime?'live':(db===0?'closed':'draw');st.ok=true;return st;})
    .catch(function(){st.ok=false;return st;});
}
function renderHPools(){
  var box=$('hPools'); if(!box)return; var html='';
  POOLS.forEach(function(P,i){var st=hpool[i]||{};var price=st.ok?fmtPr(st.price,P.decimals)+' '+P.sym+(LANG==='zh'?'/张':'/tk'):(st.ok===false?t('hFail'):t('hLoading'));
    html+='<div class="h-pcard'+(i===poolIdx?' on':'')+'" onclick="homePickPool('+i+')"><div class="h-pbadge" style="background:'+POOLMETA[i].c+'">'+P.sym.charAt(0)+'</div><div class="h-psym">'+P.sym+(LANG==='zh'?' 池':'')+'</div><div class="h-pprice">'+price+'</div></div>';});
  box.innerHTML=html;
}
function renderHFeature(){
  var P=POOLS[poolIdx], st=hpool[poolIdx]||{}, e;
  if(e=$('hSym'))e.textContent=P.sym;
  var hp=$('hPool');
  if(st.ok){
    if(hp){hp.classList.remove('skel');hp.innerHTML=fmtD(st.pool,P.decimals)+'<span class="u" id="hUnit">'+P.sym+'</span>';}
    if(e=$('hPrice'))e.textContent=fmtPr(st.price,P.decimals)+' '+P.sym;
    if(e=$('hRound'))e.textContent=(LANG==='zh'?'第 '+st.round+' 期 · ':'Round '+st.round+' · ')+(st.phase==='live'?t('hSelling'):st.phase==='closed'?t('hClosed'):t('hDraw'));
    var _hu=$('hUpdated'); if(_hu){ var _d=new Date(); _hu.textContent=t('hUpdated',{t:String(_d.getHours()).padStart(2,'0')+':'+String(_d.getMinutes()).padStart(2,'0')+':'+String(_d.getSeconds()).padStart(2,'0')}); _hu.style.display=''; }
    if(e=$('hEnd'))e.textContent=st.phase==='live'?hcd(st.endTime):t('hClosed');
  }else{
    if(hp){hp.classList.add('skel');hp.innerHTML='—<span class="u" id="hUnit">'+P.sym+'</span>';}
    var u=$('hUnit'); if(u)u.textContent=P.sym;
  }
}
function homePickPool(i){ sfx('switch'); setPool(i); renderHPools(); renderHFeature(); }
function renderHGames(){var box=$('hGames');if(!box)return;var html='';HGAMES.forEach(function(g,i){var d=g[LANG]||g.zh;html+='<div class="h-game" role="button" tabindex="0" onclick="gameIntro('+i+')"><img src="'+HG[i]+'" alt="'+d[0]+'" loading="lazy"></div>';});box.innerHTML=html;}
function renderHHelp(){var box=$('hHelp');if(!box)return;var html='';HHELP.forEach(function(s,i){var d=s[LANG]||s.zh;html+='<div class="h-step"><div class="n">'+(i+1)+'</div><h3>'+d[0]+'</h3><p>'+d[1]+'</p></div>';});box.innerHTML=html;var n=$('hNote');if(n)n.innerHTML=HNOTE[LANG]||HNOTE.zh;}
function openHModal(o){var m=$('hmodal');if(!m)return;$('hmTitle').textContent=o.t;$('hmBody').innerHTML=o.b;m.classList.add('open');}
function closeHModal(){var m=$('hmodal');if(m)m.classList.remove('open');}
function gameIntro(i){var d=HGAMES[i][LANG]||HGAMES[i].zh;openHModal({t:d[0],b:d[1]+(LANG==='zh'?'<br><br>该游戏正在开发中，敬请期待。':'<br><br>In development. Stay tuned.')});}
function RULES_T(){return {t:t('hRules'),b:t('hRulesBody')};}
function NOTICE_T(){return {t:t('noticeT'),b:t('noticeB')};}
var invClaim={};
async function loadInvite(){
  var ZERO='0x0000000000000000000000000000000000000000';
  var link=$('refLink'); if(link){ link.value=myAddr?(location.origin+location.pathname+'?ref='+myAddr):''; link.placeholder=myAddr?'':t('notConnected'); }
  var ie=$('invEmpty'), mr=$('myReferrer'), pl=$('invPoolList'), d=$('refDirectStat'), g=$('refIndirectStat');
  if(!myAddr){ if(ie)ie.hidden=false; if(mr)mr.textContent='-'; if(pl)pl.innerHTML=''; if(d)d.textContent='-'; if(g)g.textContent='-'; return; }
  if(ie)ie.hidden=true;
  invClaim={}; var rows='', refParts=[];
  for(var i=0;i<POOLS.length;i++){
    var P=POOLS[i], rw=0n;
    try{ rw=decUint(await ethCall(P.CONTRACT,'0x'+SEL.referralRewards+encAddr(myAddr))); }catch(e){}
    try{ var rr=decAddr(await ethCall(P.CONTRACT,'0x'+SEL.referrer+encAddr(myAddr))); if(rr!==ZERO)refParts.push(P.sym+': '+short(rr)); }catch(e){}
    invClaim[i]=rw; var has=rw>0n;
    rows+='<div class="inv-row"><span class="inv-rn"><span class="inv-dot" style="background:'+POOLMETA[i].c+'"></span>'+P.sym+(LANG==='zh'?' 池':'')+'</span>'
      +'<span class="inv-ra">'+fmtD(rw,P.decimals)+' '+P.sym+'</span>'
      +(has?'<button class="inv-claim" onclick="claimPool('+i+')">'+t('claimRefBtn')+'</button>':'<span class="inv-ra0">'+t('invNone')+'</span>')+'</div>';
  }
  if(mr)mr.textContent = refParts.length ? refParts.join(' · ') : t('noReferrer');
  if(pl)pl.innerHTML=rows;
  loadInviteStats(myAddr.toLowerCase());
}
async function loadInviteStats(me){
  var bound={}, poolSyms=[];
  for(var i=0;i<POOLS.length;i++){
    var P=POOLS[i]; poolSyms.push(P.sym); bound[P.sym]={};
    try{ var bl=await scanLogs([EV_REFBOUND],P.CONTRACT,P.deployBlock);
      for(var j=0;j<bl.length;j++){ var l=bl[j]; var buyer=('0x'+l.topics[1].slice(-40)).toLowerCase(); var rf=('0x'+l.topics[2].slice(-40)).toLowerCase(); bound[P.sym][buyer]=rf; }
    }catch(e){}
  }
  var merged={}, poolsWithBind=0;
  for(var s=0;s<poolSyms.length;s++){
    var sym=poolSyms[s], hasAny=false;
    for(var b in bound[sym]){ hasAny=true; if(!(b in merged)) merged[b]=bound[sym][b]; }
    if(hasAny) poolsWithBind++;
  }
  var dset={}, dc=0;
  for(var b in merged){ if(merged[b]===me){ dset[b]=1; dc++; } }
  var ic=0;
  for(var b in merged){ if(!dset[b] && b!==me && dset[merged[b]]) ic++; }
  var d=$('refDirectStat'), g=$('refIndirectStat');
  if(d)d.textContent=dc+(LANG==='zh'?' 人':'');
  if(g)g.textContent=ic+(LANG==='zh'?' 人':'');
  var pn=$('refPoolNote');
  if(pn) pn.textContent=t('refPoolNote',{n:poolsWithBind});
}
function claimPool(i){ sendTx(POOLS[i].CONTRACT,'0x'+SEL.claimReferral).then(function(){ toast(t('claimOk')); loadInvite(); }).catch(function(e){ toast(e.message||e); }); }
async function loadRecords(){
  var ie=$('recEmpty'), box=$('recList');
  if(!myAddr){ if(ie)ie.hidden=false; if(box)box.innerHTML=''; return; }
  if(ie)ie.hidden=true;
  var me=myAddr.toLowerCase(), rows='';
  for(var i=0;i<POOLS.length;i++){
    var P=POOLS[i], tickets=0n, winCnt=0, winAmt=0n, price=0n;
    try{ price=decUint(await ethCall(P.CONTRACT,'0x'+SEL.ticketPrice)); }catch(e){}
    try{ var tl=await scanLogs([EV_TICKETS],P.CONTRACT,P.deployBlock);
      for(var j=0;j<tl.length;j++){ var l=tl[j]; if(('0x'+l.topics[2].slice(-40)).toLowerCase()!==me)continue; tickets+=BigInt('0x'+((l.data||'0x').replace(/^0x/,'')).slice(0,64)||'0'); }
    }catch(e){}
    try{ var wl=await scanLogs([EV_WIN],P.CONTRACT,P.deployBlock);
      for(var j=0;j<wl.length;j++){ var l=wl[j]; var d=(l.data||'0x').replace(/^0x/,''); var offW=Number(BigInt('0x'+d.slice(0,64)))*2, offA=Number(BigInt('0x'+d.slice(64,128)))*2; var ws=decAddrArray(d,offW), as=decUintArray(d,offA); for(var k=0;k<ws.length;k++){ if(ws[k].toLowerCase()===me){ winCnt++; winAmt+=as[k]; } } }
    }catch(e){}
    var spent=tickets*price, net=winAmt-spent, neg=net<0n, na=neg?-net:net;
    rows+='<div class="rec-row"><span class="rec-p"><span class="inv-dot" style="background:'+POOLMETA[i].c+'"></span>'+P.sym+(LANG==='zh'?' 池':'')+'</span>'
      +'<span class="rec-c">'+tickets.toString()+(LANG==='zh'?' 张':'')+'</span>'
      +'<span class="rec-c" title="'+t('recEstNote')+'">≈ '+fmtD(spent,P.decimals)+' '+P.sym+'</span>'
      +'<span class="rec-c">'+winCnt+(LANG==='zh'?' 次 / ':'× / ')+fmtD(winAmt,P.decimals)+'</span>'
      +'<span class="rec-c" style="color:'+(neg?'#B23B3B':'#3E6B4F')+';font-weight:700">'+(neg?'-':'+')+fmtD(na,P.decimals)+' '+P.sym+' <small style="font-weight:400;color:#8a8f7d">('+t('recEst')+')</small></span></div>';
  }
  if(box)box.innerHTML=rows;
}
function goRecords(){ showView('play'); setTimeout(function(){ var e=$('sec-my'); if(e)e.scrollIntoView({behavior:'smooth',block:'start'}); },120); }
var AC=null, sndOn=false; try{ sndOn=localStorage.getItem('ap_snd')==='1'; }catch(e){}
var SND_ON='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a3 3 0 010 6M18.5 7a6 6 0 010 10"/></svg>';
var SND_OFF='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/></svg>';
function sndInit(){ try{ if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)(); if(AC&&AC.state==='suspended')AC.resume(); }catch(e){} }
function beep(freq,dur,type,vol,delay){ if(!AC)return; var t=AC.currentTime+(delay||0),o=AC.createOscillator(),g=AC.createGain(); o.type=type||'sine'; o.frequency.value=freq; o.connect(g); g.connect(AC.destination); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol||0.06,t+0.012); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.start(t); o.stop(t+dur+0.03); }
function sfx(kind){ if(!sndOn)return; sndInit(); if(!AC)return;
  if(kind==='click'){ beep(520,0.07,'triangle',0.04); }
  else if(kind==='switch'){ beep(440,0.06,'sine',0.045); beep(660,0.08,'sine',0.04,0.04); }
  else if(kind==='win'){ [523,659,784,1047].forEach(function(f,i){ beep(f,0.2,'triangle',0.07,i*0.1); }); }
  else if(kind==='success'){ beep(587,0.12,'sine',0.06); beep(880,0.16,'sine',0.055,0.1); }
}
function updateSndBtn(){ var b=$('sndBtn'); if(b)b.innerHTML=sndOn?SND_ON:SND_OFF; }
function toggleSnd(){ sndOn=!sndOn; try{localStorage.setItem('ap_snd',sndOn?'1':'0');}catch(e){} if(sndOn){ sndInit(); sfx('click'); } updateSndBtn(); }
document.addEventListener('click',function(e){ if(!sndOn)return; var t=e.target.closest('button,a.h-btn,.hpc,.qbtn,.h-gold,.hbar-btn,.inv-claim,.pback,.pnav-links a,.game'); if(t&&t.id!=='sndBtn') sfx('click'); },true);
var WINLIST=[], winIdx=0, winTimer=null, winOff=false;
async function loadWinners(){
  var list=[];
  for(var i=0;i<POOLS.length;i++){
    var P=POOLS[i];
    try{ var wl=await scanLogs([EV_WIN],P.CONTRACT,P.deployBlock); wl=wl.slice(-2);
      for(var j=0;j<wl.length;j++){ var l=wl[j]; var rid=Number(BigInt(l.topics[1])); var d=(l.data||'0x').replace(/^0x/,''); var offW=Number(BigInt('0x'+d.slice(0,64)))*2, offA=Number(BigInt('0x'+d.slice(64,128)))*2; var ws=decAddrArray(d,offW), as=decUintArray(d,offA);
        for(var k=0;k<ws.length;k++){ list.push({a:ws[k],amt:as[k],dec:P.decimals,sym:P.sym,tier:(k===0?1:(k<4?2:3)),rid:rid}); }
      }
    }catch(e){}
  }
  WINLIST=list;
}
function winShowNext(){
  var el=$('winToast'); if(!el)return;
  var home=$('view-home');
  if(winOff || !WINLIST.length || (home&&home.hidden)){ el.classList.remove('show'); return; }
  var w=WINLIST[winIdx%WINLIST.length]; winIdx++;
  var tier=w.tier===1?t('prize1'):(w.tier===2?t('prize2'):t('prize3'));
  var tx=$('winTxt'); if(tx) tx.innerHTML=short(w.a)+' · '+w.sym+(LANG==='zh'?' 池 ':' ')+tier+' <b>'+fmtD(w.amt,w.dec)+' '+w.sym+'</b>';
  el.classList.add('show');
  setTimeout(function(){ el.classList.remove('show'); },5200);
}
function winClose(){ var el=$('winToast'); if(el)el.classList.remove('show'); winOff=true; }
function winStart(){ if(winTimer)clearInterval(winTimer); setTimeout(winShowNext,1500); winTimer=setInterval(winShowNext,9000); }
var apSlide=0, apTimer=null;
function apShow(n){ var s=document.querySelectorAll('#view-home .hslide'); if(!s.length)return; apSlide=(n+s.length)%s.length; for(var i=0;i<s.length;i++)s[i].classList.toggle('on',i===apSlide); var d=document.querySelectorAll('#view-home .hero-dots span'); for(var i=0;i<d.length;i++)d[i].classList.toggle('on',i===apSlide); }
function apPause(){ if(apTimer){clearInterval(apTimer);apTimer=null;} }
function apStart(){ apPause(); try{ if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return; }catch(e){} apTimer=setInterval(function(){apShow(apSlide+1);},5000); }
function renderHome(){renderHPools();renderHFeature();renderHGames();renderHHelp();}
function loadHome(){POOLS.forEach(function(P,i){loadHPool(i).then(function(){renderHPools();if(i===poolIdx)renderHFeature();});});}
function toggleBurger(forceClose){
  var m=$('pnavMenu'); if(!m) return;
  if(forceClose===true){ m.classList.remove('open'); m.hidden=true; return; }
  var open=m.classList.toggle('open'); m.hidden=!open;
}
document.addEventListener('click',function(e){
  var m=$('pnavMenu'), b=$('burgerBtn');
  if(!m||m.hidden) return;
  if(m.contains(e.target)||(b&&b.contains(e.target))) return;
  toggleBurger(true);
});
function routeFromHash(){
  var h='';
  try{ h=(''+(location.hash||'')).replace(/^#/,''); }catch(e){}
  return (h==='home'||h==='play'||h==='invite'||h==='records') ? h : 'home';
}
function showView(v, fromHash){
  if(window.renderJoinBanner) renderJoinBanner();
  var home=$('view-home'),play=$('view-play'),inv=$('view-invite'),rec=$('view-records'),pb=$('pback');
  if(home)home.hidden=(v!=='home');
  if(play)play.hidden=(v!=='play');
  if(inv)inv.hidden=(v!=='invite');
  if(rec)rec.hidden=(v!=='records');
  if(pb)pb.hidden=(v==='home');
  if(!fromHash){ try{ if((''+location.hash)!=='#'+v) location.hash=v; }catch(e){} }
  if(v==='play'){ refresh(true); }
  else if(v==='invite'){ loadInvite(); }
  else if(v==='records'){ loadRecords(); }
  else{ renderHome(); loadHome(); }
  try{window.scrollTo(0,0);}catch(e){}
  try{updateTabs(v);}catch(e){}
}
function updateTabs(v){
  var tabs=document.querySelectorAll('#ptabs a[data-view]');
  for(var i=0;i<tabs.length;i++){
    if(tabs[i].getAttribute('data-view')===v) tabs[i].classList.add('active');
    else tabs[i].classList.remove('active');
  }
}
window.addEventListener('hashchange', function(){
  var v=routeFromHash();
  showView(v, true);
});
document.addEventListener('keydown',function(e){ if(e.key==='Escape')closeHModal(); });
var _homeRefreshAt=0;
setInterval(function(){
  var hm=$('view-home'); if(!hm||hm.hidden) return;
  var st=hpool[poolIdx];
  if(st&&st.ok&&st.phase==='live'){var e=$('hEnd');if(e)e.textContent=hcd(st.endTime);}
  var nowMs=Date.now();
  if(nowMs-_homeRefreshAt>30000){ _homeRefreshAt=nowMs; try{ loadHome(); }catch(e){} }
},1000);
document.addEventListener('visibilitychange', function(){
  if(document.hidden) return;
  var hm=$('view-home');
  if(hm&&!hm.hidden){ _homeRefreshAt=Date.now(); try{ loadHome(); }catch(e){} }
});
window.addEventListener('load', ()=>{
  try{ var _ol=document.querySelector('.brand-logo'); if(_ol&&$('navLogo')) $('navLogo').src=_ol.src; }catch(e){}
  applyLang(); renderPoolTabs(); updateChainBtn(); updateWalletBtn(); setBuyN(1);
  var sp='home'; try{ sp=routeFromHash(); if(sp==='home'&&(new URLSearchParams(location.search).get('pool')!==null)) sp='play'; }catch(e){}
  showView(sp, true);
  apShow(0); apStart(); updateSndBtn();
  loadWinners().then(winStart).catch(function(){});
});
