/* ANUBIS PLAY 多语言 i18n：按中文原文作为 key，DOM 叶子节点扫描替换 */
(function(){
  var ORDER=['en','ko','ja','ru','vi','es']; // D 数组顺序
  var LANGS=[['zh','中文'],['en','English'],['ko','한국어'],['ja','日本語'],['ru','Русский'],['vi','Tiếng Việt'],['es','Español']];
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
  '已连接':['Connected','연결됨','接続済み','Подключено','Đã kết nối','Conectado']
  };
  var LANG='zh';
  try{LANG=localStorage.getItem('aplang')||'zh';}catch(e){}
  function idx(l){return ORDER.indexOf(l);}
  window.tr=function(zh,l){l=l||LANG;if(l==='zh')return zh;var e=D[zh];var i=idx(l);return (e&&i>=0&&e[i])||zh;};
  function collect(){document.querySelectorAll('body *').forEach(function(el){if(el.children.length===0){var t=(el.textContent||'').trim();if(t&&D[t]&&!el.hasAttribute('data-zh'))el.setAttribute('data-zh',t);}});
    var hh=document.getElementById('heroH2');if(hh&&!hh.hasAttribute('data-zh'))hh.setAttribute('data-zh','heroH2');}
  var HERO={zh:'探索游戏宇宙，<em>发现 Anubis 的更多可能</em>',
    en:'Explore the game universe, <em>discover more of Anubis</em>',
    ko:'게임 우주를 탐험하고, <em>Anubis의 더 많은 가능성을</em>',
    ja:'ゲームの宇宙を探索し、<em>Anubisの可能性を</em>',
    ru:'Исследуй вселенную игр, <em>открывай Anubis</em>',
    vi:'Khám phá vũ trụ game, <em>mở ra nhiều hơn với Anubis</em>',
    es:'Explora el universo del juego, <em>descubre más de Anubis</em>'};
  window.applyLang=function(l){LANG=l;try{localStorage.setItem('aplang',l);}catch(e){}
    document.documentElement.setAttribute('lang',l==='zh'?'zh-CN':l);
    document.querySelectorAll('[data-zh]').forEach(function(el){var k=el.getAttribute('data-zh');
      if(k==='heroH2'){el.innerHTML=HERO[l]||HERO.zh;return;}
      el.textContent=window.tr(k,l);});
    var lc=document.getElementById('langCode');if(lc){var m={zh:'中',en:'EN',ko:'KO',ja:'JA',ru:'RU',vi:'VI',es:'ES'};lc.textContent=m[l]||'中';}
    document.querySelectorAll('#langMenu .lmi').forEach(function(a){a.classList.toggle('on',a.getAttribute('data-l')===l);});
    try{if(window.__uiWallet)window.__uiWallet();}catch(e){}
    try{if(window.__poolRender)window.__poolRender();}catch(e){}
  };
  window.toggleLangMenu=function(ev){if(ev)ev.stopPropagation();var m=document.getElementById('langMenu');if(m)m.hidden=!m.hidden;};
  window.setLang=function(l){window.applyLang(l);var m=document.getElementById('langMenu');if(m)m.hidden=true;};
  document.addEventListener('click',function(e){var m=document.getElementById('langMenu');if(m&&!m.hidden){var b=document.getElementById('langBtn');if(!m.contains(e.target)&&b&&!b.contains(e.target))m.hidden=true;}});
  function build(){
    var menu=document.getElementById('langMenu');if(menu){menu.innerHTML=LANGS.map(function(x){return '<a class="lmi" data-l="'+x[0]+'" onclick="setLang(\''+x[0]+'\')">'+x[1]+'</a>';}).join('');}
    collect();applyLang(LANG);
  }
  if(document.readyState!=='loading')build();else document.addEventListener('DOMContentLoaded',build);
})();
