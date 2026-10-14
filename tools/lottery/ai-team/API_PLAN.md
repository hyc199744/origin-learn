# 三家 AI 的 API 接口规划 v1.0

> 状态：只规划，不调用。等用户授权录入 Key 后再逐个实测。
> 统一用 OpenAI 兼容的 chat completions 格式封装，方便一套代码调三家。

## 1. OpenAI GPT

- 接口：`https://api.openai.com/v1/chat/completions`
- 认证：`Authorization: Bearer <OPENAI_API_KEY>`
- 建议模型：`gpt-4o-mini`（日常任务，便宜快）、`gpt-4o`（复杂推理）
- 申请地址：https://platform.openai.com/api-keys
- 备注：按量付费，需要绑卡

## 2. DeepSeek

- 接口：`https://api.deepseek.com/v1/chat/completions`
- 认证：`Authorization: Bearer <DEEPSEEK_API_KEY>`
- 建议模型：`deepseek-chat`（日常）、`deepseek-reasoner`（复杂推理）
- 申请地址：https://platform.deepseek.com/api_keys
- 备注：OpenAI 兼容格式，最便宜；国内可直连

## 3. Anthropic Claude

- 接口：`https://api.anthropic.com/v1/messages`
- 认证：`x-api-key: <ANTHROPIC_API_KEY>` + `anthropic-version: 2023-06-01`
- 建议模型：`claude-sonnet-4-5`（日常）、`claude-opus-4-1`（复杂）
- 申请地址：https://console.anthropic.com/
- 备注：**不是** OpenAI 兼容格式，需单独封装；价格最高

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
