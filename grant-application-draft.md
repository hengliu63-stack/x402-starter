# Base Builder Grants 申请稿草稿（中英双版）

> 状态：草稿，2026-10-15 起草。**申请只能由刘恒本人用自己的身份提交**（提名表单 + KYC），
> 助手不做任何注册/提交动作。所有陈述只写已核实事实，不编造指标。
> 官方申请入口：https://paragraph.com/@grants.base.eth/calling-based-builders
> 提名表：https://docs.google.com/forms/d/e/1FAIpQLSfXuEzmiAzRhie_z9raFCF1BXweXgVt18o-DvBuRRgyTygL2A/viewform

---

## 中文版

**项目名称**：x402 中文上手包（x402 Chinese Starter Kit）

**一句话**：让中文开发者 10 分钟亲手跑通 x402 智能体支付——中文教程 + 一键 demo + 真 EIP-712 签名验证。

**解决了什么问题**：
x402 是 Coinbase 2025 年推出的智能体支付开放标准（现由 Linux 基金会 x402 Foundation 治理，成员 40+，
包括 Google、Visa、Stripe、AWS、Mastercard、Circle）。它让 AI 智能体调用付费 API 时无需注册、无需 API Key，
收到 HTTP 402 就自动付稳定币——这是"机器对机器付款"的关键拼图。

但中文区几乎没有实战中文资料。英文官方文档对新手门槛高：
EIP-3009 授权、EIP-712 结构化签名、facilitator 验签/结算流程，对没玩过链的开发者是三座大山。
我们的上手包把这三座山做成中文教程 + 可运行代码，一台电脑、一个命令就能跑通。

**已经做了什么**（全部真实可验证）：
1. 中文教程 `README.md`：x402 12 步完整流程意译、核心名词表（scheme/network/EIP-3009/EIP-712）、
   与 ACP/AP2 的分层定位、反例测试记录。
2. 三件套 demo（Node.js + viem）：client（智能体付款方）、merchant（收款方）、
   facilitator（本地模拟结算方）。**签名验证是真的 EIP-712**（viem 库），
   伪造签名 / 金额不对 / 网络不对都会被拒绝——我们测过反例。
3. 一键运行脚本 `run-demo.sh`：6 步中文日志，402 → 报价 → 签名 → 重试 → 200 + 付款回执。
4. grant 情报 `grants.md`：Base/CDP/x402 相关资助渠道的中文整理（同样开源，对其他 builder 有用）。

**真实价值（为什么值得资助）**：
- x402 生态 30 天有 7500 万+ 笔交易，但中文开发者参与度极低——语言和上手门槛是主因。
- 这是面向 Base 生态的**中文开发者 onboarding 基础设施**：降低门槛 = 更多人来 Base 上 build x402 应用 = 更多链上交易。
- 代码已预留测试网切换口（`FACILITATOR_URL`），下一步接上 Base Sepolia 即成为链上可验证项目。

**诚实的当前状态**（2026-10-15 更新）：
- demo 已升级到 x402 v2 协议形状，与官方测试 facilitator（`https://x402.org/facilitator`）
  实测互通：`code/run-testnet.sh` 一键切真实链路，代码已就绪。
- **✅ 第一笔 Base Sepolia 真实结算已跑通（2026-10-15 08:00）**：Circle 水龙头领取 20 测试 USDC
  到付款方地址（`0x7185323E5A3f687aE33027713FDa93D0F2b8c8B1`，测试网专用钱包
  `wallets/x402-payer-testnet.json`）后，client 做 EIP-712 签名
  （EIP-3009 transferWithAuthorization），facilitator 在 Base Sepolia 上链结算 **0.01 测试 USDC**
  到收款地址 `0x4D577a2D84501A3Af9Dd1E282134daE7d09e1ccc`。交易哈希：
  `0xb6a48233156d7b5450220b90a9a8667ec28a39555d2ac22b9a69b321a4902de0`
  （链上 receipt 确认成功，区块 48127151）。
- 代码已整理为 GitHub-ready（英文 README、MIT 协议、.gitignore），待创建仓库后开源。

**链接占位**（申请时填真实链接）：
- GitHub 仓库：✅ https://github.com/hengliu63-stack/x402-starter（公开，2026-10-15 已推送）
- 在线 demo / 部署地址：[待部署 Base Sepolia 后填写]
- 教程：[待发布地址]

**团队**：刘恒，独立开发者（一人）。

**申请金额**：1 ETH（理由：当前完成度是"中文教程 + 本地真签名 demo + 一笔真实 Base Sepolia
测试网结算"，按官方"early ideas / initial prototypes"档位诚实申报；GitHub 公开 + 2 分钟 demo
视频补上后，可按 2–3 ETH 档重新评估）。

---

## English Version

**Project name**: x402 Chinese Starter Kit

**One-liner**: A Chinese-language onboarding kit for x402 — tutorial + one-command demo with real EIP-712
signature verification — so Chinese developers can run the full agent-payment flow in 10 minutes.

**The problem**:
x402 (launched by Coinbase in 2025, now governed by the x402 Foundation under the Linux Foundation,
40+ members incl. Google, Visa, Stripe, AWS, Mastercard, Circle) is the open standard for agent payments:
an AI agent calling a paid API needs no account and no API key — on HTTP 402 it pays stablecoins
automatically and retries. It is the missing piece for machine-to-machine payments.

But there is almost no hands-on Chinese-language material. The English docs are steep for newcomers:
EIP-3009 authorizations, EIP-712 structured signing, and the facilitator verify/settle flow are three
walls for developers who have never touched a chain. This kit turns those walls into a Chinese tutorial
plus runnable code — one machine, one command, full flow.

**What is built** (all verifiable):
1. Chinese tutorial (README.md): the full 12-step x402 flow in Chinese, key-concept glossary
   (scheme / network / EIP-3009 / EIP-712), positioning vs ACP/AP2, and adversarial test notes.
2. Three-piece demo (Node.js + viem): client (agent payer), merchant (payee), facilitator (local
   settlement mock). **Signature verification is real EIP-712** (viem); forged signatures, wrong
   amounts, and wrong networks are all rejected — we tested the negative cases.
3. One-command runner `run-demo.sh`: 6-step Chinese log, 402 → quote → sign → retry → 200 + receipt.
4. Chinese-language grants intel (`grants.md`) — useful to other builders as well.

**Why it deserves funding**:
- The x402 ecosystem did 75M+ transactions in 30 days, yet Chinese developer participation is minimal —
  language and onboarding friction are the main causes.
- This is Chinese developer onboarding infrastructure for the Base ecosystem: lower friction means
  more people building x402 apps on Base, which means more onchain transactions.
- The code already has a testnet switch (`FACILITATOR_URL`); pointing it at a Base Sepolia facilitator
  makes it a verifiable onchain project.

**Honest current state** (updated 2026-10-15):
- The demo has been upgraded to x402 v2 message shapes and verified interoperable with the
  official testnet facilitator (`https://x402.org/facilitator`). `code/run-testnet.sh`
  switches to the real chain path with one command; the code is ready.
- **✅ First real Base Sepolia settlement completed (2026-10-15 08:00)**: after claiming
  20 test USDC from the Circle faucet to the payer address
  (`0x7185323E5A3f687aE33027713FDa93D0F2b8c8B1`, testnet-only wallet
  `wallets/x402-payer-testnet.json`), the client signed an EIP-712
  (EIP-3009 transferWithAuthorization) payment, and the facilitator settled **0.01 test USDC**
  on Base Sepolia to `0x4D577a2D84501A3Af9Dd1E282134daE7d09e1ccc`. Transaction hash:
  `0xb6a48233156d7b5450220b90a9a8667ec28a39555d2ac22b9a69b321a4902de0`
  (receipt confirmed on-chain, block 48127151).
- The code is GitHub-ready (English README, MIT license, .gitignore), pending repo creation.

**Links** (fill in real URLs when applying):
- GitHub repo: ✅ https://github.com/hengliu63-stack/x402-starter (public, pushed 2026-10-15)
- Live demo / deployment: [to be filled after Base Sepolia deployment]
- Tutorial: [to be filled]

**Team**: Heng Liu, solo independent developer.

**Requested amount**: 1 ETH. Rationale: current state is "Chinese tutorial + local demo with real
signatures + one real Base Sepolia testnet settlement," which fits the official "early ideas /
initial prototypes" tier honestly. After the GitHub repo goes public with a 2-minute demo video,
reassess at the 2–3 ETH tier.

---

## 申请前下一步清单

1. **~~部署到 Base Sepolia（最重要）~~ ✅ 已完成（2026-10-15）**：`run-testnet.sh` 一键切官方测试
   facilitator，x402 v2 形状实测互通；Circle 水龙头 20 测试 USDC 到账后跑通第一笔链上结算，
   交易哈希 `0xb6a48233156d7b5450220b90a9a8667ec28a39555d2ac22b9a69b321a4902de0`
   （Base Sepolia，区块 48127151，0.01 测试 USDC）。
2. **开源到 GitHub**：已完成整理——英文 README（README.en.md）、MIT LICENSE、.gitignore、
   package.json 补 license 字段与 testnet 脚本；无硬编码本地路径。待用户用自己身份建仓库并推送
   （助手不注册任何账号）。
3. **录一段 2 分钟 demo 视频**：✅ 已完成（demo-video/demo.mp4，2分12秒，中文配音+字幕，含真实结算交易哈希）
4. **在 Farcaster / X 上发 build log**：官方主要靠 Twitter/Farcaster 发现 builder，先有公开痕迹。
   可顺手注册 talent.app / builderscore.xyz 参与 Builder Rewards（每周约 2 ETH 池子）。
5. **KYC 准备**：受赠需交 W8/W9（税务表格），提前了解流程。
6. **防骗**：只认 @buildonbase 官方账号；凡是让你先转账/充值的"grant"都是诈骗。
