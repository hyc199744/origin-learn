/* ============================================================
   起源学习站 · 资料清单
   —— 以后加资料，只改这一个文件，不用碰 index.html ——

   每条资料是一个 { } 对象，四种类型：

   ① 视频（本地 mp4）：
      { type:"video", cat:"视频课", title:"标题", desc:"一句话简介",
        src:"assets/media/你的视频.mp4" }
      → 把 mp4 文件放进 assets/media/ 文件夹，src 写文件名即可。

   ② PDF / PPT课件（PPT 先在 PowerPoint 里"另存为 PDF"）：
      { type:"pdf", cat:"课件", title:"标题", desc:"简介",
        src:"assets/docs/你的文件.pdf" }
      → 把 pdf 放进 assets/docs/ 文件夹。点开在网页里直接翻页看。

   ③ 本地图文文章（直接在这里写正文，支持简单 HTML）：
      { type:"article", cat:"图文", title:"标题", desc:"简介",
        html:"<p>第一段……</p><p>第二段……</p>" }

   ④ 公众号文章（外链，点了新窗口打开）：
      { type:"link", cat:"公众号", title:"标题", desc:"简介",
        url:"https://mp.weixin.qq.com/s/xxxxx" }

   cat 是分类标签，随便起名，同名的会归到一个筛选按钮里。
   顺序 = 显示顺序，想置顶就往上放。
   ============================================================ */

const LIBRARY = [

  // —— 视频课 ——
  {
    type: "video", cat: "视频课",
    title: "畅游老师 · 起源底层逻辑讲解",
    desc: "7 月 12 日 · 约 68 分钟完整讲解，从底层逻辑一步步拆解起源的机制。",
    src: "https://media.web3origin.com/changyou-dicengluoji.mp4"
  },
  {
    type: "video", cat: "视频课",
    title: "起源底层逻辑",
    desc: "约 28 分钟 · 用大白话讲清起源这套 DeFi 机制到底怎么运转。",
    src: "https://media.web3origin.com/qiyuan-dicengluoji.mp4"
  },
  {
    type: "video", cat: "视频课",
    title: "为什么跌不破一美金",
    desc: "约 1 小时 46 分 · 看懂底池、储备与机制托底的逻辑——但记住，软底不是硬底。",
    src: "https://media.web3origin.com/weishenme-diebupo-1usd.mp4"
  },

  // —— 课件 / PDF（这几个是真资料，已放进 assets/docs/）——
  {
    type: "pdf", cat: "课件",
    title: "比特币经济模型 · 小白完全图解",
    desc: "从零看懂 BTC 的发行与通缩机制，适合最开始建立货币直觉。",
    src: "assets/docs/btc-economics.pdf"
  },
  {
    type: "pdf", cat: "课件",
    title: "以太坊 ETH 经济模型 · 小白完全图解",
    desc: "读懂 Gas、增发与销毁，理解一条公链的经济账。",
    src: "assets/docs/eth-economics.pdf"
  },
  {
    type: "pdf", cat: "课件",
    title: "ORIGIN 白皮书合辑",
    desc: "起源官方白皮书，机制、代币、路线图的一手资料。",
    src: "https://media.web3origin.com/origin-whitepaper.pdf"
  },
  {
    type: "pdf", cat: "课件",
    title: "金山老师课件",
    desc: "金山老师的起源课程课件，共 24 页，系统讲解生态机制。",
    src: "assets/docs/jinshan-kejian.pdf"
  },

  // —— 本地图文（正文直接写在 html 字段里）——
  {
    type: "article", cat: "图文",
    title: "三分钟看懂：起源到底是什么",
    desc: "名词先对上号——起源、LGNS、Anubis 各是什么、什么关系。",
    html:
      "<p><b>起源</b>是一整个 Web3 生态的统称。你可以先把它理解成“一个有自己代币和规则的链上社区”。</p>" +
      "<p><b>LGNS</b> 是这个生态里的核心代币。你可以持有、质押它来参与生态；它用一套叫 (3,3) 的博弈模型，鼓励大家长期持有而不是短炒。</p>" +
      "<p><b>Anubis</b> 是生态自己搭的一条隐私公链（Chain ID 6714，链上的 gas 直接用 DAI）。</p>" +
      "<p>类比一下：起源像一座城市，LGNS 像城里流通的货币，Anubis 像城市脚下的地基。三者是「生态 → 代币 → 链」的层级关系。</p>" +
      "<p style='color:#b79c74'>提示：这是一篇本地图文示例。想加自己的文章，照着 library.js 里的 article 格式写正文即可，支持 &lt;p&gt;&lt;b&gt;&lt;br&gt; 这些简单标签。</p>"
  },

  // —— 公众号外链（换成你自己的文章网址）——
  {
    type: "link", cat: "公众号",
    title: "示例：起源赚什么钱 · 底池逻辑",
    desc: "点开跳转到微信公众号原文（把 url 换成你自己的文章链接）。",
    url: "https://mp.weixin.qq.com/"
  },

];
