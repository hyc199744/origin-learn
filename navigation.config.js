/* Web3Origin 统一桌面导航配置 —— 单一维护来源
 * 只改这个文件即可增删栏目。href 用站点绝对路径(/xxx/)或首页锚点(/#xxx);
 * tool 字段=首页弹窗工具函数名(经 /?tool=fn 跨页打开);badge=角标;soon=即将上线(禁用)。
 * 标签 {zh,en}:中文默认,非中文语言按站点惯例回退英文。
 */
window.W3O_NAV = {
  brand: { label: "Web3Origin", href: "/", logo: "/assets/logo.png" },
  searchPlaceholder: { zh: "搜索文章、课程、工具、合约或问题", en: "Search articles, courses, tools, contracts or FAQ" },
  items: [
    { id: "home", label: { zh: "首页", en: "Home" }, href: "/" },

    { id: "learn", label: { zh: "学习", en: "Learn" }, children: [
      { label: { zh: "新人学习路线", en: "Beginner Path" }, href: "/academy/" },
      { label: { zh: "链上学习学院", en: "On-chain Academy" }, href: "/academy/" },
      { label: { zh: "Web3 基础", en: "Web3 Basics" }, href: "/academy/#l1-what-is-blockchain" },
      { label: { zh: "钱包与安全", en: "Wallet & Security" }, href: "/academy/#l2-how-to-create-wallet" },
      { label: { zh: "DeFi 基础", en: "DeFi Basics" }, href: "/academy/#l3-what-is-smart-contract" },
      { label: { zh: "Origin 生态课程", en: "Origin Ecosystem" }, href: "/academy/#l4-origin-ecosystem" },
      { label: { zh: "常见问题", en: "FAQ" }, href: "/faq/" },
      { label: { zh: "Web3 术语词典", en: "Web3 Glossary" }, soon: true }
    ]},

    { id: "research", label: { zh: "研究", en: "Research" }, children: [
      { label: { zh: "研究文章", en: "Research Articles" }, href: "/articles/" },
      { label: { zh: "LGNS 百科", en: "LGNS Wiki" }, href: "/baike/lgns/" },
      { label: { zh: "Anubis Chain", en: "Anubis Chain" }, href: "/baike/anubis/" },
      { label: { zh: "Awake DAO", en: "Awake DAO" }, href: "/baike/awake-dao/" },
      { label: { zh: "数据来源与可信度", en: "Data Sources" }, href: "/sources/" }
    ]},

    { id: "onchain", label: { zh: "链上数据", en: "On-chain" }, children: [
      { label: { zh: "链上雷达", en: "On-chain Radar" }, href: "/#radar" },
      { label: { zh: "实时链上事件", en: "Live Events" }, href: "/#radar" },
      { label: { zh: "鲸鱼动态", en: "Whale Activity" }, href: "/#radar" },
      { label: { zh: "生态健康指数", en: "Health Index" }, href: "/#radar" },
      { label: { zh: "风险雷达", en: "Risk Radar" }, href: "/#radar" },
      { label: { zh: "链上日报", en: "Daily Report" }, tool: "openDailyNews" },
      { label: { zh: "合约地址大全", en: "All Contracts" }, href: "/contracts/" },
      { label: { zh: "链上证据库", en: "Evidence DB" }, tool: "openEvidenceDB" }
    ]},

    { id: "tools", label: { zh: "工具", en: "Tools" }, groups: [
      { title: { zh: "钱包工具", en: "Wallet" }, items: [
        { label: { zh: "钱包监控·链上体检", en: "Wallet Monitor" }, tool: "openWalletMonitor" },
        { label: { zh: "查推荐人", en: "Referrer Lookup" }, tool: "openReferrer", badge: { zh: "付费", en: "PAID" } },
        { label: { zh: "链上提币", en: "On-chain Withdraw" }, href: "/tools/onchain-withdraw/", badge: { zh: "付费", en: "PAID" } }
      ]},
      { title: { zh: "合约与安全", en: "Contract & Security" }, items: [
        { label: { zh: "代币安全自查", en: "Token Safety Check" }, tool: "openSecurity" },
        { label: { zh: "合约验证中心", en: "Contract Verify" }, tool: "openContractCenter" },
        { label: { zh: "合约地址大全", en: "All Contracts" }, href: "/contracts/" }
      ]},
      { title: { zh: "数据与计算", en: "Data & Calc" }, items: [
        { label: { zh: "收益计算器", en: "Yield Calculator" }, tool: "openCalc" },
        { label: { zh: "质押数据面板", en: "Staking Panel" }, tool: "openStaking" },
        { label: { zh: "大额成交监测", en: "Whale Monitor" }, tool: "openWhale" }
      ]}
    ]},

    { id: "video", label: { zh: "视频", en: "Video" }, href: "/video/" },

    { id: "mine", label: { zh: "我的", en: "Me" }, children: [
      { label: { zh: "我的链上中心", en: "My Dashboard" }, href: "/dashboard/" },
      { label: { zh: "学习进度", en: "Learning Progress" }, href: "/dashboard/" },
      { label: { zh: "研究收藏", en: "Bookmarks" }, href: "/dashboard/" },
      { label: { zh: "钱包监控", en: "Wallet Monitor" }, href: "/dashboard/" },
      { label: { zh: "我的报告", en: "My Reports" }, href: "/dashboard/" }
    ]},

    { id: "about", label: { zh: "关于", en: "About" }, children: [
      { label: { zh: "关于 Web3Origin", en: "About Web3Origin" }, href: "/about/" },
      { label: { zh: "数据来源", en: "Data Sources" }, href: "/sources/" },
      { label: { zh: "常见问题", en: "FAQ" }, href: "/faq/" },
      { label: { zh: "社区反馈", en: "Feedback" }, href: "/feedback/" },
      { label: { zh: "联系我们", en: "Contact" }, href: "/#contact" }
    ]}
  ],
  /* 搜索索引:真实存在的页面(供导航搜索框用,不接AI/不猜链接) */
  searchIndex: [
    { t: { zh: "首页", en: "Home" }, u: "/" },
    { t: { zh: "链上学习学院", en: "On-chain Academy" }, u: "/academy/" },
    { t: { zh: "常见问题 FAQ", en: "FAQ" }, u: "/faq/" },
    { t: { zh: "研究文章", en: "Research Articles" }, u: "/articles/" },
    { t: { zh: "LGNS 百科", en: "LGNS Wiki" }, u: "/baike/lgns/" },
    { t: { zh: "Anubis Chain 百科", en: "Anubis Chain Wiki" }, u: "/baike/anubis/" },
    { t: { zh: "Awake DAO", en: "Awake DAO" }, u: "/baike/awake-dao/" },
    { t: { zh: "数据来源与可信度", en: "Data Sources" }, u: "/sources/" },
    { t: { zh: "合约地址大全", en: "All Contracts" }, u: "/contracts/" },
    { t: { zh: "视频学院", en: "Video Academy" }, u: "/video/" },
    { t: { zh: "个人中心 / 我的链上中心", en: "My Dashboard" }, u: "/dashboard/" },
    { t: { zh: "留言区 / 社区反馈", en: "Feedback" }, u: "/feedback/" },
    { t: { zh: "关于 Web3Origin", en: "About" }, u: "/about/" },
    { t: { zh: "链上提币工具", en: "On-chain Withdraw" }, u: "/tools/onchain-withdraw/" }
  ]
};
