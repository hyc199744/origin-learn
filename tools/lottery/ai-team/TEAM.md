# 四 AI 协作团队规范 v1.0

项目：anubislottery.com（Anubis 游戏聚合平台）
仓库：hyc199744/origin-learn
工作目录：tools/lottery/
生效日期：2026-10-14

## 1. 角色分工

| AI | 职责 | 说明 |
|---|---|---|
| Muse（我） | 总指挥 | 任务分配、进度跟踪、代码审核、上线验证、安全把关 |
| GPT | 待分配（建议：合约逻辑/新功能开发） | API 接入后由总指挥派单 |
| DeepSeek | 代码审核员（已接入 2026-10-14） | 只读审查：分析 PR、提建议；禁合并/部署/动钱包，详见 DEEPSEEK.md |
| Claude | 前端 UI 打磨 | 用户电脑端独立参与，走仓库协作 |

## 2. 工作语言

- 沟通、文档、注释：中文大白话
- 代码变量名：英文（沿用项目现有风格）
- 页面文案：中英文双语（项目铁律）

## 3. 分支策略（铁律）

- `main`：生产分支，**任何 AI 禁止直接推送**
- `dev`：集成开发分支，所有 AI 的日常工作分支
- `feature/<ai>-<任务名>`：具体任务分支，命名示例 `feature/gpt-referral-ui`
- 合并流程：任务分支 → PR 到 dev → 总指挥审核通过 → 合并 → 用户验收后 → 总指挥合并到 main

## 4. 任务流转

1. 用户一句话提需求 → 总指挥拆成任务 → 写入 TASK_QUEUE.md
2. AI 从队列认领（把状态改成"进行中"，写上自己的名字）
3. 在自己的 feature 分支开发，完成后推送
4. 在 HANDOFF.md 写交接记录
5. 总指挥按 REVIEW.md 做审核+测试
6. 通过 → 合并到 dev；不通过 → 打回，写明原因
7. 用户验收 → 总指挥合并到 main → 上线验证

## 5. 协作纪律

- 每天开工先读 TASK_QUEUE.md 和 HANDOFF.md
- 只改自己任务范围内的文件，不碰别人的任务文件
- 推送前本地自查：JS 过 node --check，HTML 检查括号配平
- 任何疑问写进 HANDOFF.md，不要猜
- 密钥、钱包、私钥相关内容永不进仓库、永不进聊天记录

---

## GPT 接入记录（2026-10-14）

- 接入方式：OpenAI 官方 API（api.openai.com），Key 存保险柜 `custom.openai`
- 默认模型：gpt-4.1-mini（编程性价比最高，$0.40/$1.60 per 1M tokens）
- 连接测试：Responses API 返回 OK，14 tokens，费用可忽略
- 月预算：¥30，接近 ¥25 提醒，达到后停止调用，用量记 skills/openai/usage.log
- 调用工具：skills/openai/bin/gpt_chat.py
- 约束：只走 feature/dev 分支 + PR 审核流程；禁动 main、禁部署主网、禁操作真实钱包/资金
