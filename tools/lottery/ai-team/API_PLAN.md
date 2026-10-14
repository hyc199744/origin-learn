# 三家 AI 的 API 接口规划 v1.1

> 更新：2026-10-14，GPT 已实测接入成功（Responses API）

## 1. OpenAI GPT ✅ 已接入

- 接口：`https://api.openai.com/v1/responses`（Responses API，已实测）
- 认证：`Authorization: Bearer` + 保险柜动态凭证（`custom.openai`），Key 永不落盘
- 默认模型：`gpt-4.1-mini`（2026-10-14 实测版本 `gpt-4.1-mini-2025-04-14`）
  - 费率：$0.40 / $1.60 per 1M tokens（输入/输出）
  - 选用理由：编程能力强、性价比最高
- 备选：`gpt-4o-mini`（最便宜，$0.15/$0.60，简单任务）
- 申请地址：https://platform.openai.com/api-keys
- 调用工具：`~/workspace/skills/openai/bin/gpt_chat.py`
  - `gpt_chat.py models` — 列出可用模型
  - `gpt_chat.py [model] [prompt]` — Responses API 调用
- 用量日志：`~/workspace/skills/openai/usage.log`
- 月预算：¥30（接近 ¥25 提醒，达到后停止调用）
- 备注：按量付费，需要绑卡；国内需代理（保险柜服务端直连，无影响）

## 2. DeepSeek

- 接口：`https://api.deepseek.com/v1/chat/completions`
- 认证：`Authorization: Bearer <DEEPSEEK_API_KEY>`
- 建议模型：`deepseek-chat`（日常）、`deepseek-reasoner`（复杂推理）
- 申请地址：https://platform.deepseek.com/api_keys
- 备注：OpenAI 兼容格式，最便宜；国内可直连

## 3. Anthropic Claude ✅ 已接入

- 接口：`https://api.anthropic.com/v1/messages`（Messages API，已实测）
- 认证：`x-api-key` 请求头 + `anthropic-version: 2023-06-01`，Key 走保险柜动态凭证（`custom.anthropic`），永不落盘
- 默认模型：`claude-sonnet-5-5`（2026-10-14 实测，14 个可用模型中最新的 Sonnet）
  - 费率参考：约 $3 / $15 per 1M tokens（输入/输出，Sonnet 系标准）
  - 选用理由：前端编程、复杂页面设计、UI/UX 最强
- 备选：`claude-sonnet-4-6`、`claude-haiku-4-5-20251001`（便宜，简单任务）
- 申请地址：https://console.anthropic.com/
- 调用工具：`~/workspace/skills/claude/bin/claude_chat.py`
  - `claude_chat.py models` — 列出可用模型
  - `claude_chat.py [model] [prompt]` — Messages API 调用
- 用量日志：`~/workspace/skills/claude/usage.log`
- 月预算：¥30（接近 ¥25 提醒，达到后应用层停止调用）
- 备注：**不是** OpenAI 兼容格式，已单独封装；Key 曾因复制问题 401 一次，重录后正常

## 4. 统一调度设计（待实现）

```
用户需求 → 总指挥(Muse)
  → 按任务类型选 AI（GPT 做功能 / DeepSeek 审代码 / Claude 磨 UI）
  → 调对应 API，prompt 带上：任务说明 + 相关代码 + 规范要求
  → 收回结果 → 按 REVIEW.md 审核 → 进 PR 流程
```

## 5. 成本控制

- 默认用各家最便宜的够用模型，复杂任务才升级
- 每次调用记录 token 用量，月结时向用户汇报
- 任务 prompt 模板化，避免重复传大段代码
