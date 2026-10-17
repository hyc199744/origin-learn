/* ANUBIS PLAY 多语言 i18n：按中文原文作为 key，DOM 叶子节点扫描替换 */
(function(){
  var ORDER=['en','ko','ja','ru','vi','es']; // D 数组顺序
  var FLAG_CN='<span class="flag"><svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#DE2910"/><path fill="#FFDE00" d="M7 3.5 8 6.7 11.3 6.7 8.6 8.6 9.6 11.8 7 9.9 4.4 11.8 5.4 8.6 2.7 6.7 6 6.7z"/><circle cx="13.5" cy="2.6" r=".9" fill="#FFDE00"/><circle cx="15.5" cy="4.6" r=".9" fill="#FFDE00"/><circle cx="15.5" cy="7.6" r=".9" fill="#FFDE00"/><circle cx="13.5" cy="9.6" r=".9" fill="#FFDE00"/></svg></span>';
  var FLAG_US='<span class="flag"><svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#fff"/><g fill="#B22234"><rect width="30" height="1.54"/><rect y="3.08" width="30" height="1.54"/><rect y="6.15" width="30" height="1.54"/><rect y="9.23" width="30" height="1.54"/><rect y="12.31" width="30" height="1.54"/><rect y="15.38" width="30" height="1.54"/><rect y="18.46" width="30" height="1.54"/></g><rect width="13" height="10.77" fill="#3C3B6E"/><g fill="#fff"><circle cx="2.6" cy="2.2" r=".55"/><circle cx="5.2" cy="2.2" r=".55"/><circle cx="7.8" cy="2.2" r=".55"/><circle cx="10.4" cy="2.2" r=".55"/><circle cx="3.9" cy="4.3" r=".55"/><circle cx="6.5" cy="4.3" r=".55"/><circle cx="9.1" cy="4.3" r=".55"/><circle cx="2.6" cy="6.4" r=".55"/><circle cx="5.2" cy="6.4" r=".55"/><circle cx="7.8" cy="6.4" r=".55"/><circle cx="10.4" cy="6.4" r=".55"/><circle cx="3.9" cy="8.5" r=".55"/><circle cx="6.5" cy="8.5" r=".55"/><circle cx="9.1" cy="8.5" r=".55"/></g></svg></span>';
  function fl(inner){return '<span class="flag"><svg viewBox="0 0 30 20">'+inner+'</svg></span>';}
  var FLAG_KR=fl('<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="5" fill="#CD2E3A"/><path d="M10 10 A5 5 0 0 0 20 10 Z" fill="#0047A0"/>');
  var FLAG_JP=fl('<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="5.5" fill="#BC002D"/>');
  var FLAG_RU=fl('<rect width="30" height="6.67" fill="#fff"/><rect y="6.67" width="30" height="6.67" fill="#0039A6"/><rect y="13.33" width="30" height="6.67" fill="#D52B1E"/>');
  var FLAG_VN=fl('<rect width="30" height="20" fill="#DA251D"/><path fill="#FF0" d="M15 5.2 16.1 8.6 19.6 8.6 16.8 10.7 17.9 14.1 15 12 12.1 14.1 13.2 10.7 10.4 8.6 13.9 8.6z"/>');
  var FLAG_ES=fl('<rect width="30" height="20" fill="#AA151B"/><rect y="5" width="30" height="10" fill="#F1BF00"/>');
  var FLAG_BR=fl('<rect width="30" height="20" fill="#009739"/><path d="M15 3 27 10 15 17 3 10z" fill="#FEDD00"/><circle cx="15" cy="10" r="3.6" fill="#012169"/>');
  var FLAG_FR=fl('<rect width="10" height="20" fill="#0055A4"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#EF4135"/>');
  var FLAG_TR=fl('<rect width="30" height="20" fill="#E30A17"/><circle cx="12" cy="10" r="4.6" fill="#fff"/><circle cx="13.6" cy="10" r="3.7" fill="#E30A17"/><path fill="#fff" d="M18.3 7.6 19 9.4 20.9 9.5 19.4 10.7 19.9 12.6 18.3 11.5 16.7 12.6 17.2 10.7 15.7 9.5 17.6 9.4z"/>');
  var LANGS=[['zh','中文',FLAG_CN,1],['en','English',FLAG_US,1],['ko','한국어',FLAG_KR,0],['ja','日本語',FLAG_JP,0],['ru','Русский',FLAG_RU,0],['vi','Tiếng Việt',FLAG_VN,0],['es','Español',FLAG_ES,0],['pt','Português',FLAG_BR,0],['fr','Français',FLAG_FR,0],['tr','Türkçe',FLAG_TR,0]];
  var D={
  '游戏大厅':['Lobby','게임 로비','ゲームロビー','Лобби','Sảnh game','Lobby'],
  '我的资产':['My Assets','내 자산','マイ資産','Мои активы','Tài sản','Mis activos'],
  '邀请奖励':['Referral','추천 보상','招待報酬','Рефералы','Mời thưởng','Referidos'],
  '我的记录':['My Records','내 기록','マイ記録','Мои записи','Lịch sử','Historial'],
  '平台公告':['News','공지','お知らせ','Новости','Thông báo','Noticias'],
  '你的下一场精彩':['Your next thrill','당신의 다음 즐거움','次の体験を','Ваше следующее','Trải nghiệm tiếp theo','Tu próxima emoción'],
  '从这里开启。':['Starts here.','여기서 시작.','ここから。','Начни здесь.','Bắt đầu tại đây.','Empieza aquí.'],
  '新手入门 →':['Get started →','시작하기 →','はじめに →','Начать →','Hướng dẫn →','Empezar →'],
  '欢迎回来':['Welcome back','환영합니다','おかえりなさい','С возвращением','Chào mừng','Bienvenido'],
  '连接钱包，开启链上游戏':['Connect wallet to play','지갑 연결로 시작','ウォレット接続で開始','Подключите кошелёк','Kết nối ví để chơi','Conecta tu wallet'],
  '连接钱包':['Connect Wallet','지갑 연결','ウォレット接続','Подключить','Kết nối ví','Conectar'],
  '一个钱包，连接你的链上游戏世界。每一次探索，都有新的期待。':['One wallet, your on-chain gaming world. Every discovery, a new surprise.','하나의 지갑으로 온체인 게임 세계를. 매번 새로운 기대.','ひとつのウォレットでオンチェーンゲームの世界へ。毎回新しい発見を。','Один кошелёк — ваш мир ончейн-игр. Каждый раз что-то новое.','Một ví, cả thế giới game on-chain. Mỗi lần khám phá, mỗi bất ngờ.','Una wallet, tu mundo de juegos on-chain. Cada descubrimiento, una sorpresa.'],
  '探索链上彩票':['Explore the Lottery','복권 둘러보기','ロトを見る','Открыть лотерею','Khám phá xổ số','Explorar lotería'],
  '正在进行':['Live Now','진행 중','開催中','Идёт сейчас','Đang diễn ra','En curso'],
  '进行中':['Live','진행중','開催中','В эфире','Live','En vivo'],
  '单张票价':['Ticket price','티켓 가격','チケット価格','Цена билета','Giá vé','Precio del boleto'],
  '售票截止':['Sales end in','판매 마감','販売終了','До конца продаж','Kết thúc bán','Cierre de ventas'],
  '查看奖池 / 进入购票':['View pool / Buy tickets','풀 보기 / 구매','プールを見る / 購入','Пул / Купить','Xem pool / Mua vé','Ver pozo / Comprar'],
  '链上可查':['On-chain verifiable','온체인 조회','オンチェーン検証','Проверяемо ончейн','Kiểm tra on-chain','Verificable on-chain'],
  '钱包签名':['Wallet signature','지갑 서명','ウォレット署名','Подпись кошелька','Chữ ký ví','Firma de wallet'],
  '理性参与':['Play responsibly','합리적 참여','責任あるプレイ','Играйте разумно','Chơi có trách nhiệm','Juego responsable'],
  '全部游戏 →':['All games →','전체 게임 →','全ゲーム →','Все игры →','Tất cả game →','Todos los juegos →'],
  '链上彩票':['On-chain Lottery','온체인 복권','オンチェーンロト','Ончейн-лотерея','Xổ số on-chain','Lotería on-chain'],
  '五大奖池、链上开奖、邀请返佣，全程可查。':['Five pools, on-chain draws, referral rewards — all verifiable.','5개 풀, 온체인 추첨, 추천 보상 — 모두 조회 가능.','5つのプール、オンチェーン抽選、招待報酬 — すべて検証可能。','Пять пулов, ончейн-розыгрыш, рефералы — всё проверяемо.','Năm pool, quay on-chain, thưởng giới thiệu — minh bạch.','Cinco pozos, sorteos on-chain, referidos — todo verificable.'],
  '进入游戏 →':['Play →','게임 →','プレイ →','Играть →','Vào game →','Jugar →'],
  '炸金花':['Golden Flower'],
  '我的币余额':['My token balances'],'金花对局次数':['Hands played'],
  '真人实时对战，押真币、链上公平结算，LGNS / DAI / RM / USDT 多池可选。':['Live PvP · real tokens · provably fair on-chain · LGNS / DAI / RM / USDT pools.'],
  '龙虎斗':['Dragon vs Tiger','드래곤 타이거','ドラゴンタイガー','Дракон и Тигр','Rồng Hổ','Dragón vs Tigre'],
  '经典对押，押中赢取奖池，链上实时结算。':['Classic head-to-head, win the pool, settled on-chain.','클래식 대결, 풀 획득, 온체인 정산.','クラシック対決、プール獲得、オンチェーン決済。','Классическая дуэль, забери пул, расчёт ончейн.','Đối đầu kinh điển, thắng pool, quyết toán on-chain.','Duelo clásico, gana el pozo, liquidado on-chain.'],
  '幸运转盘':['Lucky Wheel','행운의 룰렛','ラッキーホイール','Колесо удачи','Vòng quay may mắn','Ruleta de la suerte'],
  '转动命运之轮，赢取随机大奖。':['Spin the wheel for random rewards.','운명의 룰렛을 돌려 랜덤 보상을.','運命のホイールを回して大賞を。','Крути колесо за случайный приз.','Quay bánh xe số phận, nhận thưởng.','Gira la ruleta por premios al azar.'],
  '竞技场':['Arena','아레나','アリーナ','Арена','Đấu trường','Arena'],
  '多人同场竞技，胜者瓜分奖池。':['Multiplayer showdown, winners split the pool.','멀티플레이 대결, 승자가 풀 분배.','マルチ対戦、勝者がプールを分配。','Мультиплеер, победители делят пул.','Nhiều người đấu, người thắng chia pool.','Duelo multijugador, los ganadores reparten el pozo.'],
  '已上线':['Live','출시됨','公開中','В эфире','Đã mở','Activo'],
  '即将上线':['Coming soon','출시 예정','近日公開','Скоро','Sắp ra mắt','Próximamente'],
  '三步开始':['Three steps to start','3단계로 시작','3ステップで開始','Три шага к старту','Ba bước bắt đầu','Tres pasos para empezar'],
  '帮助中心 →':['Help Center →','도움말 →','ヘルプ →','Помощь →','Trợ giúp →','Ayuda →'],
  '用支持 Anubis 链的钱包（如 OKX）打开本站并连接。':['Open this site in a wallet that supports Anubis (e.g. OKX) and connect.','Anubis를 지원하는 지갑(OKX 등)으로 접속해 연결하세요.','Anubis対応ウォレット（OKX等）で本サイトを開いて接続。','Откройте сайт в кошельке с поддержкой Anubis (напр. OKX) и подключитесь.','Mở trang bằng ví hỗ trợ Anubis (vd OKX) và kết nối.','Abre el sitio en una wallet con Anubis (p. ej. OKX) y conéctate.'],
  '选奖池 · 买票':['Pick a pool · Buy','풀 선택 · 구매','プール選択 · 購入','Выбери пул · Купи','Chọn pool · Mua','Elige pozo · Compra'],
  '选择 LGNS / USDT / DAI / A / RM 任一奖池，授权一次后购票。':['Pick any pool (LGNS/USDT/DAI/A/RM), approve once, then buy.','풀 선택 후 1회 승인하고 구매.','プールを選び、一度承認して購入。','Выбери пул, одобри раз, покупай.','Chọn pool, duyệt 1 lần, rồi mua.','Elige un pozo, aprueba una vez y compra.'],
  '开奖 · 领奖':['Draw · Claim','추첨 · 수령','抽選 · 受取','Розыгрыш · Забрать','Quay · Nhận','Sorteo · Reclamar'],
  '每期用未来区块哈希开奖，中奖与返佣全部链上可查、随时领取。':['Drawn by a future block hash; wins and referrals are on-chain, claim anytime.','미래 블록 해시로 추첨, 당첨·보상 온체인, 언제든 수령.','将来のブロックハッシュで抽選。当選と報酬はオンチェーン、いつでも受取。','Розыгрыш по будущему хешу блока; выигрыши и рефералы ончейн, забирай в любой момент.','Quay bằng hash khối tương lai; thắng & thưởng on-chain, nhận bất cứ lúc nào.','Sorteo por hash de bloque futuro; premios y referidos on-chain, reclama cuando quieras.'],
  '邀请好友，一起赢':['Invite friends, win together','친구 초대, 함께 승리','友達を招待、一緒に勝つ','Приглашай друзей, выигрывайте вместе','Mời bạn, cùng thắng','Invita amigos, ganen juntos'],
  '好友每次参与，你都能拿返佣——直推 30%、间推 10%，从平台费里出，随时领取。':['Earn on every play by your invitees — 30% direct, 10% indirect, from the platform fee, claim anytime.','초대한 친구가 참여할 때마다 보상 — 직접 30%, 간접 10%, 수수료에서, 언제든 수령.','招待した人がプレイするたび報酬 — 直接30%・間接10%、手数料から、いつでも受取。','Доход с каждой игры приглашённых — 30% прямые, 10% непрямые, из комиссии, забирай всегда.','Nhận thưởng mỗi lần người bạn mời chơi — trực tiếp 30%, gián tiếp 10%, từ phí nền tảng.','Gana con cada jugada de tus invitados — 30% directo, 10% indirecto, de la comisión.'],
  '立即邀请 →':['Invite now →','지금 초대 →','今すぐ招待 →','Пригласить →','Mời ngay →','Invitar →'],
  '本期奖池':['Current pool','현재 풀','今期プール','Текущий пул','Pool hiện tại','Pozo actual'],
  '未连接':['Not connected','미연결','未接続','Не подключено','Chưa kết nối','Desconectado'],
  '已连接':['Connected','연결됨','接続済み','Подключено','Đã kết nối','Conectado'],
  '五大奖池 · 每期 1 小时 · 未来区块哈希开奖，全程链上可查。':['Five pools · 1h per round · drawn by a future block hash, all on-chain.'],
  '购票':['Buy Tickets'],
  '1 张':['1 ticket'],'5 张':['5 tickets'],'10 张':['10 tickets'],'50 张':['50 tickets'],
  '合计':['Total'],
  '首次用某代币买票需先授权一次，之后直接购票。每期按比例扣少量平台费，其余按奖项派给中奖者。开奖用截止后的未来区块哈希，任何人可触发，结果链上可查。':['First purchase with a token needs one approval, then buy directly. A small platform fee is taken each round; the rest goes to winners by tier. The draw uses a future block hash after cutoff — anyone can trigger it, result is on-chain.'],
  '奖项设置':['Prize Tiers'],
  '一等奖':['1st Prize'],'二等奖':['2nd Prize'],'三等奖':['3rd Prize'],
  '1 名':['1 winner'],'3 名':['3 winners'],'10 名':['10 winners'],
  '奖池 50%':['50% of pool'],'各 10%':['10% each'],'各 2%':['2% each'],
  '没人中的奖项自动滚入下期，奖池持续累积。':['Unwon prizes roll over; the pool keeps growing.'],
  '当前期数':['Round'],
  '已截止':['Ended'],
  '授权':['Approve'],'买票':['Buy'],'处理中…':['Processing…'],
  '奖池数据未就绪':['Pool data not ready'],
  '授权成功':['Approved'],'购票成功！':['Purchased!'],
  '交易已发送，等待确认…':['Transaction sent, confirming…'],
  '交易失败(被合约回退)':['Transaction reverted'],
  '确认超时，请在浏览器查看':['Confirmation timed out, check the explorer'],
  '连接失败':['Connection failed'],'未获取到地址':['No address found'],
  '未检测到钱包，请在 OKX / MetaMask 内置浏览器打开':['No wallet detected. Open in the OKX / MetaMask in-app browser.'],
  '开奖':['Draw'],'我的票据':['My Tickets'],'历史开奖':['Draw History'],
  '连接钱包查看你的战绩':['Connect your wallet to see your record'],
  '加载中…':['Loading…'],'暂无记录':['No records yet'],
  '累计买票':['Tickets bought'],'花费':['Spent'],'中奖':['Won'],'净盈亏':['Net P/L'],
  '本期进行中，截止后可开奖':['Round in progress; draw available after cutoff'],
  '已截止，可关期开奖':['Cutoff passed — close to lock the draw'],
  '已关期，等待开奖区块':['Closed — waiting for the draw block'],
  '可开奖，任何人可触发':['Ready to draw — anyone can trigger'],
  '关期并锁定开奖':['Close & lock draw'],'立即开奖':['Draw now'],
  '关期成功，等待开奖区块':['Closed — waiting for the draw block'],'开奖成功！':['Drawn!'],
  '第一等奖':['1st'],'二等奖池':['2nd'],
  '约':['≈'],
  '链上游戏大厅':['On-chain Game Hub'],
  '● NOW LIVE · 链上彩票':['● NOW LIVE · On-chain Lottery'],
  'LIVE · 链上彩票':['LIVE · On-chain Lottery'],
  '款游戏':['games'],'奖池':['pools'],'开发中':['In development'],
  '大厅':['Lobby'],'彩票':['Lottery'],'邀请':['Invite'],'我的':['Me'],
  '© ANUBIS PLAY · 链上游戏平台 · 参与有风险，请理性对待。':['© ANUBIS PLAY · On-chain gaming platform · Play responsibly, risks apply.'],
  '邀请好友赚返佣':['Invite friends, earn rewards'],
  '把你的专属链接发给好友，他们每次购票你都能拿返佣——直推 30%、间推 10%，从平台费里出，不影响奖池，随时领取。':['Share your link: earn on every ticket your invitees buy — 30% direct, 10% indirect, from the platform fee (the prize pool is untouched), claim anytime.'],
  '我的邀请链接':['My invite link'],
  '复制链接':['Copy link'],'已复制':['Copied'],'二维码':['QR code'],'分享':['Share'],
  '我的上级':['My referrer'],'无，首次购票时绑定':['None — bound on first purchase'],
  '可领返佣':['Claimable'],'领取':['Claim'],'全部领取':['Claim all'],
  '直推':['Direct'],'间推':['Indirect'],'累计返佣':['Total earned'],
  '返佣明细':['Reward details'],'下线':['Downline'],'交易':['Tx'],
  '连接钱包查看邀请数据':['Connect your wallet to see your referral data'],
  '领取成功！':['Claimed!'],'没有可领返佣':['Nothing to claim'],
  '首次购票时永久绑定邀请关系，不可更改。':['Referral binds permanently on first purchase and cannot be changed.'],
  '个人中心':['My Account'],'我的钱包':['My wallet'],'邀请概况':['Referral overview'],
  '去邀请页 →':['Open referral →'],'我的战绩':['My record'],'玩过的游戏':['Games played'],
  '交易历史':['Transaction history'],'已领返佣':['Claimed'],'暂无':['None'],
  '连接钱包查看你的资产':['Connect your wallet to see your account'],
  '复制地址':['Copy address'],'票':['tickets'],
  '帮助中心':['Help Center'],'新手三步':['Get started in 3 steps'],'游戏规则':['Game rules'],
  '邀请返佣':['Referral rewards'],'钱包与网络':['Wallet & network'],'风险提示':['Risk notice'],
  '常见问题':['FAQ'],'暂无公告':['No announcements yet'],'返回大厅':['Back to Lobby'],
  '奖项：一等奖 1 名拿奖池 50%，二等奖 3 名各 10%，三等奖 10 名各 2%；没人中的奖项自动滚入下期。每期截止后用未来区块哈希开奖，任何人可触发，中奖奖金在开奖时自动发放。':['Prizes: 1st (×1) takes 50% of the pool, 2nd (×3) 10% each, 3rd (×10) 2% each; unwon prizes roll over. After cutoff a future block hash draws the winners — anyone can trigger it, and prizes are paid automatically at the draw.'],
  '好友每次购票产生的平台费，你拿直推 30%、间推 10%，从平台费里出，不影响奖池，随时在邀请页领取。绑定在好友首次购票时自动完成，永久不可更改。':['On the platform fee from each ticket your invitees buy, you earn 30% (direct) and 10% (indirect) — taken from the fee, the prize pool is untouched; claim anytime on the Referral page. Binding happens automatically on their first purchase and is permanent.'],
  '用支持 Anubis 链（chainId 6714）的钱包打开本站，连接后按提示切换或添加 Anubis 网络即可。Gas 使用链上原生代币。':['Open this site in a wallet that supports Anubis (chainId 6714); after connecting, switch or add the Anubis network as prompted. Gas uses the chain’s native token.'],
  '参与链上彩票与博弈存在风险，可能损失本金。请量力而行、理性参与，未成年人请勿参与。本平台不作任何收益承诺。':['On-chain lottery and gaming carry risk — you may lose your funds. Play within your means and responsibly; not for minors. No returns are promised.'],
  '需要什么代币？':['Which tokens do I need?'],
  '每个奖池只收对应代币（LGNS/USDT/DAI/A/RM），外加少量 Gas。在彩票页切换奖池即可看到票价。':['Each pool accepts only its own token (LGNS/USDT/DAI/A/RM), plus a little gas. Switch pools on the Lottery page to see the ticket price.'],
  '怎么知道开奖公平？':['How is the draw fair?'],
  '开奖用的是售票截止之后才产生的未来区块哈希作随机源，买票时谁也预测不了，开奖后任何人都能在链上核对。':['The draw uses a future block hash produced only after sales close as the random source — unpredictable at purchase time and verifiable on-chain by anyone afterwards.'],
  '进入链上彩票':['Enter the Lottery'],'中奖了怎么领？':['How do I claim winnings?'],
  '中奖奖金在开奖时由合约自动打到你钱包，无需手动领取。返佣则在邀请页手动领取。':['Prizes are sent to your wallet automatically by the contract at the draw — no manual claim needed. Referral rewards are claimed manually on the Referral page.'],
  '房主管理':['Owner Panel'],'仅房主可见':['Owner only'],'改票价':['Set ticket price'],
  '改开奖周期（小时）':['Round duration (hours)'],'注资奖池':['Seed the pool'],
  '设置':['Set'],'注资':['Seed'],'当前':['Current'],'请输入金额':['Enter an amount'],
  '票价已更新':['Ticket price updated'],'开奖周期已更新':['Round duration updated'],'注资成功！':['Seeded!'],
  '确定要把票价改为':['Change ticket price to'],'吗？':['?'],
  '新票价':['New ticket price'],'新周期（小时）':['New duration (hours)'],'注资金额':['Seed amount'],
  'ANUBIS PLAY · 霓虹大厅预览':['ANUBIS PLAY · Game Lobby'],'链上彩票 · ANUBIS PLAY':['On-chain Lottery · ANUBIS PLAY'],
  '邀请奖励 · ANUBIS PLAY':['Referral Rewards · ANUBIS PLAY'],'个人中心 · ANUBIS PLAY':['Account · ANUBIS PLAY'],
  '帮助中心 · ANUBIS PLAY':['Help Center · ANUBIS PLAY'],'平台公告 · ANUBIS PLAY':['Announcements · ANUBIS PLAY']
  };
  var LANG='zh';
  try{
    LANG=localStorage.getItem('aplang')||'';
    if(!LANG){ var _bl=(navigator.language||navigator.userLanguage||'').slice(0,2).toLowerCase(); LANG=(_bl==='zh')?'zh':(ORDER.indexOf(_bl)>=0?_bl:'en'); } // 无存储则跟随浏览器语言(非中文=英文)
  }catch(e){ LANG='zh'; }
  function idx(l){return ORDER.indexOf(l);}
  window.tr=function(zh,l){l=l||LANG;if(l==='zh')return zh;var e=D[zh];var i=idx(l);return (e&&i>=0&&e[i])||zh;};
  window.getLang=function(){return LANG;};
  var _tn=[];
  function collect(){_tn=[];try{var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null,false),n;while(n=w.nextNode()){var v=n.nodeValue;if(!v)continue;var t=v.trim();if(t&&D[t]){var at=v.indexOf(t);_tn.push({node:n,zh:t,pre:v.slice(0,at),post:v.slice(at+t.length)});}}}catch(e){}}
  var HERO={zh:'探索游戏宇宙，<em>发现 Anubis 的更多可能</em>',
    en:'Explore the game universe, <em>discover more of Anubis</em>',
    ko:'게임 우주를 탐험하고, <em>Anubis의 더 많은 가능성을</em>',
    ja:'ゲームの宇宙を探索し、<em>Anubisの可能性を</em>',
    ru:'Исследуй вселенную игр, <em>открывай Anubis</em>',
    vi:'Khám phá vũ trụ game, <em>mở ra nhiều hơn với Anubis</em>',
    es:'Explora el universo del juego, <em>descubre más de Anubis</em>'};
  var _title='';
  window.applyLang=function(l){LANG=l;try{localStorage.setItem('aplang',l);}catch(e){}
    document.documentElement.setAttribute('lang',l==='zh'?'zh-CN':l);
    if(_title)try{document.title=window.tr(_title,l);}catch(e){}
    for(var _i=0;_i<_tn.length;_i++){var o=_tn[_i];try{o.node.nodeValue=o.pre+window.tr(o.zh,l)+o.post;}catch(e){}}
    var hh=document.getElementById('heroH2');if(hh)hh.innerHTML=HERO[l]||HERO.zh;
    var lc=document.getElementById('langCode');if(lc){lc.innerHTML='';}
    document.querySelectorAll('#langMenu .lmi').forEach(function(a){a.classList.toggle('on',a.getAttribute('data-l')===l);});
    try{if(window.__uiWallet)window.__uiWallet();}catch(e){}
    try{if(window.__poolRender)window.__poolRender();}catch(e){}
  };
  function closeMenu(){var m=document.getElementById('langMenu');if(m)m.hidden=true;var bd=document.getElementById('langBackdrop');if(bd)bd.hidden=true;}
  window.toggleLangMenu=function(ev){if(ev){ev.stopPropagation();ev.preventDefault();}var m=document.getElementById('langMenu');if(!m)return;var willOpen=m.hidden;m.hidden=!willOpen;var bd=document.getElementById('langBackdrop');if(bd)bd.hidden=!willOpen;};
  window.setLang=function(l){ try{localStorage.setItem('aplang',l);}catch(e){} location.reload(); }; // 切语言=存储后刷新,刷新后干净重译(含后渲染内容)
  function build(){
    if(!document.getElementById('langBackdrop')){var _bd=document.createElement('div');_bd.id='langBackdrop';_bd.hidden=true;_bd.style.cssText='position:fixed;inset:0;z-index:199;background:transparent';_bd.onclick=closeMenu;document.body.appendChild(_bd);}
    var menu=document.getElementById('langMenu');if(menu){menu.innerHTML=LANGS.map(function(x){var r=x[3];return '<a class="lmi'+(r?'':' soon')+'" data-l="'+x[0]+'"'+(r?' onclick="setLang(\''+x[0]+'\')"':'')+'>'+x[2]+'<span>'+x[1]+'</span>'+(r?'':'<em>soon</em>')+'</a>';}).join('');}
    _title=(document.title||'').trim();collect();applyLang(LANG);
    if(LANG!=='zh'){
      // 大厅内容是JS后渲染的:持续监听DOM,把新出现的中文也翻译掉(只做文本替换,不触发业务重渲染,防循环)
      var _tp=function(){ try{ collect(); for(var i=0;i<_tn.length;i++){var o=_tn[i]; o.node.nodeValue=o.pre+window.tr(o.zh,LANG)+o.post;} var hh=document.getElementById('heroH2'); if(hh&&HERO[LANG])hh.innerHTML=HERO[LANG]; }catch(e){} };
      try{
        var _o=new MutationObserver(function(){ if(window.__i18nP)return; window.__i18nP=true; (window.requestAnimationFrame||function(f){setTimeout(f,16);})(function(){ window.__i18nP=false; try{_o.disconnect();_tp();}catch(e){} try{_o.observe(document.body,{childList:true,subtree:true,characterData:true});}catch(e){} }); });
        _o.observe(document.body,{childList:true,subtree:true,characterData:true});
      }catch(e){}
      setTimeout(_tp,400); setTimeout(_tp,1500); setTimeout(_tp,3500);
    }
  }
  if(document.readyState!=='loading')build();else document.addEventListener('DOMContentLoaded',build);
})();
