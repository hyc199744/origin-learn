/* =============================================================================
 * 起源链上工具 · 会员 30 项统一配置（单一数据源 / Single Source of Truth）
 * -----------------------------------------------------------------------------
 * 会员权益展示页（tools/membership/index.html）的 30 项工具、六大分类、
 * 免费/付费对比、套餐信息全部从本文件读取。以后逐个完成工具时，
 * 只需在这里改 status / route / enabled，页面自动更新，无需改动组件。
 *
 * 字段说明（每项工具）：
 *   id          唯一英文 id
 *   number      1–30 编号（决定显示顺序）
 *   name        工具名称
 *   description 一句话功能说明（面向普通用户，不夸大、不承诺收益）
 *   category    所属分类 id（见 CATEGORIES）
 *   icon        图标 emoji
 *   status      'live'（已上线）| 'soon'（即将上线）| 'dev'（开发中）
 *   isPremium   是否会员专属
 *   route       已上线工具的入口地址；未上线为 ''（点击只看介绍，不进空白页）
 *   enabled     true=可进入 route；false=仅展示介绍与预计开放提示
 *   note        状态判定依据（内部备注，供老板核对，不显示给普通用户）
 *
 * ⚠️ 状态由 Claude 按代码实测初判，老板请核对后自行修改。判定口径：
 *    live = 本仓库有可用真实路由（首页 /?tool=openX 弹窗或独立工具页）
 *    soon = 相关能力已存在但尚无独立工具入口 / 仅部分覆盖
 *    dev  = 本仓库尚无实现
 *    改状态只改本文件，绝不在多个组件里分别写死。
 * ========================================================================== */
(function (root) {
  'use strict';

  /* ---- 六大能力分类 ---- */
  var CATEGORIES = [
    { id: 'wallet-id',     icon: '🪪', name: '钱包与身份', desc: '推荐关系、钱包等级、晋升记录、地址关系。' },
    { id: 'asset-staking', icon: '💰', name: '资产与质押', desc: '双链资产、活期质押、360、600 及全网质押数据。' },
    { id: 'trade-whale',   icon: '🐋', name: '交易与大户', desc: '大额交易、大户增减仓、资金来源、资金去向和钱包预警。' },
    { id: 'security-dd',   icon: '🛡️', name: '安全与尽调', desc: '钱包综合尽调、授权检查、异常行为识别和交易翻译。' },
    { id: 'price-calc',    icon: '🧮', name: '价格与计算', desc: '实时价格、买入计算、卖出模拟、成本和收益计算。' },
    { id: 'data-evidence', icon: '📜', name: '资料与证据', desc: '合约地址、发展时间轴、托底逻辑、国库资产和 PDF 报告。' }
  ];

  /* ---- 状态样式元信息 ---- */
  var STATUS_META = {
    live: { label: '已上线', cls: 'live', color: '#25C96F', dot: '🟢' },
    soon: { label: '即将上线', cls: 'soon', color: '#6fb6ff', dot: '🔵' },
    dev:  { label: '开发中',  cls: 'dev',  color: '#e8a45c', dot: '🟠' }
  };

  /* ---- 30 项工具 ---- */
  var TOOLS = [
    { id: 'referrer', number: 1, name: '推荐人查询', category: 'wallet-id', icon: '🔗',
      description: '查询钱包的直接推荐人、绑定时间、所属链和链上凭证。',
      status: 'live', isPremium: true, route: '/?tool=openReferrer', enabled: true,
      note: '首页 openReferrer 弹窗，已上线。' },

    { id: 'withdraw', number: 2, name: '链上提币 DApp', category: 'asset-staking', icon: '💸',
      description: '在符合合约规则的情况下，通过自己的钱包完成领取、赎回或提取。',
      status: 'live', isPremium: true, route: '/tools/onchain-withdraw/', enabled: true,
      note: '独立工具页 /tools/onchain-withdraw/，已上线（需连钱包签名，能否执行以合约与权限为准）。' },

    { id: 'whale', number: 3, name: '大额交易监控', category: 'trade-whale', icon: '🐋',
      description: '监控大额买入、卖出、转账、质押和赎回动态。',
      status: 'live', isPremium: true, route: '/?tool=openWhale', enabled: true,
      note: '首页 openWhale 弹窗，已上线。' },

    { id: 'staking-top', number: 4, name: '活期质押大户榜', category: 'asset-staking', icon: '🏆',
      description: '查询双链活期质押排名及大户资产变化。',
      status: 'live', isPremium: true, route: '/tools/origin-monitor/', enabled: true,
      note: '链上尽调助手·监控中心「持仓榜」，已上线（后台定时扫描，页面标注更新时间）。' },

    { id: 'v-count', number: 5, name: '全网 V1–V6 数量', category: 'wallet-id', icon: '📊',
      description: '统计各等级钱包数量，并提供双链分别统计和跨链去重数据。',
      status: 'live', isPremium: true, route: '/tools/origin-monitor/', enabled: true,
      note: '链上尽调助手·监控中心「等级分布」，已上线（后台定时扫描）。' },

    { id: 'staking-query', number: 6, name: '双链质押查询', category: 'asset-staking', icon: '🔒',
      description: '查询活期、360、600 及钱包名下的总质押记录。',
      status: 'live', isPremium: true, route: '/?tool=openStaking', enabled: true,
      note: '首页 openStaking 弹窗，已上线。' },

    { id: 'v-level', number: 7, name: '钱包 V 等级查询', category: 'wallet-id', icon: '🎖️',
      description: '查看钱包当前等级、所属链及相关链上依据。',
      status: 'live', isPremium: true, route: '/?tool=openWalletMonitor', enabled: true,
      note: '首页 openWalletMonitor（钱包监控·链上体检）含等级，已上线。' },

    { id: 'promotion-today', number: 8, name: '今日晋升查询', category: 'wallet-id', icon: '📈',
      description: '查看当天新晋升 V1–V6 的钱包、晋升时间和链上依据。',
      status: 'live', isPremium: true, route: '/tools/origin-monitor/', enabled: true,
      note: '链上尽调助手·监控中心「近24小时新增晋升」明细表（读 Anubis daoLevel 事件，含 V 级变化与交易哈希），老板确认已上线。' },

    { id: 'contracts', number: 9, name: '双链合约地址库', category: 'data-evidence', icon: '📇',
      description: '汇总并核验起源生态相关合约地址、用途和所属链。',
      status: 'live', isPremium: false, route: '/contracts/', enabled: true,
      note: '独立页 /contracts/，公开免费(SEO引流页,不上锁)。' },

    { id: 'history', number: 10, name: '起源前世今生', category: 'data-evidence', icon: '🕰️',
      description: '通过时间轴查看起源的重要公告、合约变化、迁移和发展记录。',
      status: 'soon', isPremium: true, route: '', enabled: false,
      note: '前世今生内容已有素材，但本站尚无独立时间轴工具页，标即将上线。' },

    { id: 'treasury', number: 11, name: '国库资产查询', category: 'data-evidence', icon: '🏛️',
      description: '查看公开国库地址的资产构成、余额和资金流动。',
      status: 'live', isPremium: true, route: '/tools/origin-monitor/', enabled: true,
      note: '链上尽调助手·监控中心「国库」，链上实时，已上线。' },

    { id: 'peg-logic', number: 12, name: '1美元托底逻辑', category: 'data-evidence', icon: '⚖️',
      description: '解释托底机制、触发条件、资金来源和目前可以验证的数据。',
      status: 'soon', isPremium: true, route: '', enabled: false,
      note: '相关说明散见资料页，尚无独立解读工具，标即将上线。' },

    { id: 'staking-total', number: 13, name: '全网质押总量看板', category: 'asset-staking', icon: '📟',
      description: '统计双链各类质押总量、参与钱包数量及每日变化。',
      status: 'live', isPremium: true, route: '/tools/origin-monitor/', enabled: true,
      note: '链上尽调助手·监控中心含质押率/总量，已上线（每日变化为部分覆盖）。' },

    { id: 'full-dd', number: 14, name: '钱包综合尽调报告', category: 'security-dd', icon: '🔍',
      description: '一次查询钱包持仓、质押、等级、推荐关系、交易和授权等信息。',
      status: 'live', isPremium: true, route: '/tools/origin-monitor/', enabled: true,
      note: '链上尽调助手（origin-monitor）核心功能，已上线。' },

    { id: 'roi-calc', number: 15, name: '收益与成本计算器', category: 'price-calc', icon: '🧮',
      description: '计算持币成本、费用、模拟收益、浮盈亏和回本价格。',
      status: 'live', isPremium: true, route: '/?tool=openCalc', enabled: true,
      note: '首页 openCalc 弹窗，已上线（收益为模拟结果，非承诺）。' },

    { id: 'whale-track', number: 16, name: '大户增减仓追踪', category: 'trade-whale', icon: '📉',
      description: '追踪重点地址的增持、减持、卖出、赎回和资产转移。',
      status: 'soon', isPremium: true, route: '', enabled: false,
      note: '大额交易监控已覆盖成交，但针对单地址的持仓增减追踪尚未独立，标即将上线。' },

    { id: 'approval-check', number: 17, name: '合约授权安全检查', category: 'security-dd', icon: '🔐',
      description: '查看钱包授权过的合约、授权资产、授权额度和潜在风险。',
      status: 'live', isPremium: true, route: '/?tool=openSecurity', enabled: true,
      note: '首页 openSecurity 弹窗，已上线。' },

    { id: 'sell-sim', number: 18, name: '卖出冲击模拟器', category: 'price-calc', icon: '🌊',
      description: '估算卖出数量对应的滑点、手续费、预计到账和价格影响。',
      status: 'dev', isPremium: true, route: '', enabled: false,
      note: '本仓库无独立卖出模拟工具页，标开发中。' },

    { id: 'address-graph', number: 19, name: '地址关联关系图', category: 'wallet-id', icon: '🕸️',
      description: '展示钱包之间的推荐、转账、资金来源和交互关系。',
      status: 'dev', isPremium: true, route: '', enabled: false,
      note: '关系图可视化尚未实现，标开发中。' },

    { id: 'wallet-alert', number: 20, name: '自选钱包预警', category: 'trade-whale', icon: '⭐',
      description: '收藏关注的钱包，在出现指定链上行为时获得提醒。',
      status: 'soon', isPremium: true, route: '', enabled: false,
      note: '个人中心有收藏，但主动预警需常驻后端推送，尚未接入，标即将上线。' },

    { id: 'fund-source', number: 21, name: '资金来源追踪', category: 'trade-whale', icon: '⤵️',
      description: '追查钱包第一笔资金及主要资金从哪里转入。',
      status: 'dev', isPremium: true, route: '', enabled: false,
      note: '资金来源溯源尚未实现，标开发中。' },

    { id: 'fund-dest', number: 22, name: '资金去向追踪', category: 'trade-whale', icon: '⤴️',
      description: '查看卖出、赎回或转账后的资产流向。',
      status: 'dev', isPremium: true, route: '', enabled: false,
      note: '资金去向追踪尚未实现，标开发中。' },

    { id: 'lp-pool', number: 23, name: 'LP底池监控', category: 'asset-staking', icon: '💧',
      description: '查看流动性池储备、资产比例、添加和移除流动性记录。',
      status: 'soon', isPremium: true, route: '', enabled: false,
      note: '首页雷达展示 LP 储备，但无独立底池监控工具页，标即将上线。' },

    { id: 'price-center', number: 24, name: 'LGNS实时价格中心', category: 'price-calc', icon: '💹',
      description: '展示双链价格、流动性、成交量、价差和更新时间。',
      status: 'soon', isPremium: true, route: '', enabled: false,
      note: '首页雷达有实时价格，但无独立价格中心工具页，标即将上线。' },

    { id: 'buy-calc', number: 25, name: '买入到账计算器', category: 'price-calc', icon: '🛒',
      description: '输入投入金额，估算可以买到的币量、滑点、费用和实际到账。',
      status: 'soon', isPremium: true, route: '', enabled: false,
      note: '收益计算器偏成本/收益，买入到账估算尚未独立，标即将上线。' },

    { id: 'anomaly', number: 26, name: '钱包异常行为识别', category: 'security-dd', icon: '🚨',
      description: '识别短时间批量转账、集中赎回、高频交互等异常特征。',
      status: 'dev', isPremium: true, route: '', enabled: false,
      note: '异常行为识别尚未实现，标开发中。' },

    { id: 'tx-translate', number: 27, name: '合约交互翻译器', category: 'security-dd', icon: '🗣️',
      description: '把复杂的交易方法、输入参数和事件日志翻译成大白话。',
      status: 'live', isPremium: false, route: '/tools/onchain-search/', enabled: true,
      note: '链上搜索工具，公开免费(SEO引流页,不上锁)。' },

    { id: 'bill', number: 28, name: '个人链上账单', category: 'trade-whale', icon: '🧾',
      description: '按日、周、月统计买入、卖出、转账、质押、赎回和奖励记录。',
      status: 'dev', isPremium: true, route: '', enabled: false,
      note: '按周期汇总的账单尚未实现，标开发中。' },

    { id: 'dual-compare', number: 29, name: '双链资产对比', category: 'asset-staking', icon: '⚖️',
      description: '对比同一钱包在 Polygon 和 AnubisChain 上的资产、质押和等级。',
      status: 'live', isPremium: true, route: '/tools/origin-monitor/', enabled: true,
      note: '链上尽调助手一次查全双链资产，已上线。' },

    { id: 'evidence-pdf', number: 30, name: '链上证据报告导出', category: 'data-evidence', icon: '📄',
      description: '将查询结果生成包含地址、时间、区块高度和交易哈希的 PDF 报告。',
      status: 'soon', isPremium: true, route: '', enabled: false,
      note: '已有链上证据库，但一键 PDF 导出尚未接入，标即将上线。' }
  ];

  /* ---- 会员套餐 / 定价（占位，待老板确认后修改；本页不接入任何收款）----
   * ⚠️ 价格与开通方式均为占位符，Claude 不擅自设定线上价格、不接入收款。
   *    老板确认定价与开通方式后，改这里即可，页面自动更新。 */
  var PLAN = {
    priceText: '10 LGNS',                   // 会员价格（老板确认 2026-08）
    period: '永久使用',                     // 有效期
    quotaText: '无限查询（不限次数）',       // 查询次数/使用额度
    alertQuota: '会员范围内不限（对应工具上线后）',  // 钱包预警数量
    exportQuota: '会员范围内不限（对应工具上线后）', // 报告导出次数
    autoRenew: '否（一次性付费，永久使用）', // 是否自动续费
    payMethods: 'Polygon / Anubis 链上 LGNS 转账（沿用现有手动转账收款方式）',
    refundRule: '数字商品一经解锁不支持退款；开通前请先确认已上线工具清单与会员权益（详见下方说明）。',
    ctaText: '立即解锁会员工具',
    tosUrl: '/about/',              // 服务协议入口（占位，指向关于页）
    privacyUrl: '/about/'           // 隐私政策入口（占位）
  };

  var API = {
    CATEGORIES: CATEGORIES,
    STATUS_META: STATUS_META,
    TOOLS: TOOLS,
    PLAN: PLAN,
    countByStatus: function () {
      var c = { live: 0, soon: 0, dev: 0 };
      TOOLS.forEach(function (t) { if (c[t.status] != null) c[t.status]++; });
      return c;
    },
    byCategory: function (catId) {
      return TOOLS.filter(function (t) { return t.category === catId; });
    }
  };

  root.MEMBERSHIP = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : this);
