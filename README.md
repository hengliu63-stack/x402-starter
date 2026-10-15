# x402 中文上手包

> 一句话：x402 是"让 HTTP 请求自带付款"的开放标准——智能体调 API 时，不用注册、不用 API Key，
> 收到 `402 Payment Required` 就自动付稳定币、重试，一次 HTTP 往返完成付款+拿数据。
> 本包：中文教程 + 本地可运行的三件套 demo（Node.js）+ grant 情报。

---

## 0. 三分钟速览（给评审 / 新人）

- **这是什么**：x402 中文上手包——把 Coinbase 推出的智能体支付标准 x402 做成中文教程 + 一键运行的 demo，
  让中文开发者 10 分钟内亲手跑通"智能体自动付款买 API"的完整流程。
- **解决了什么**：中文区几乎没有 x402 的实战中文资料；英文文档对新手门槛高。我们把协议 12 步流程、
  EIP-712/EIP-3009 签名机制、反欺诈验证全部做成中文 + 可运行代码。
- **证据（已跑通）**：`code/` 三件套 demo（client / merchant / facilitator）本地一键运行，
  使用 **真实 EIP-712 签名验证**（viem），伪造签名/金额/网络会被拒绝——验签不是摆设。
- **一键复现**：
  ```bash
  cd ~/workspace/x402-starter/code && bash run-demo.sh
  ```
  你会看到 6 步中文日志：402 → 报价单 → 临时身份 → EIP-712 签名 → 重试 → 200 + 付款回执。
- **下一步（链上证据）**：`code/run-testnet.sh` 一键切到真实链路——merchant 接官方测试
  facilitator（`https://x402.org/facilitator`，2026-10-15 实测互通），Base Sepolia 真实结算。
  详见第 5 节与 `grant-application-draft.md`。

---

## 1. x402 是什么

- **出身**：Coinbase 2025 年 5 月推出；现由 **x402 Foundation**（Linux 基金会旗下）社区治理，
  成员 40+，包括 Google、Visa、Stripe、AWS、Mastercard、Circle、Shopify、Solana 基金会等。
- **现状**（2026-10-12 查看 x402.org）：近 30 天 **7541 万笔交易 / 2424 万美元 / 9.4 万买家 / 2.2 万卖家**。
  生态里已有 Agentic.Market（x402 应用商店）、Exa Search、CoinGecko 等用 x402 做按次付费。
- **一句话定位**：x402 解决"单次 HTTP 请求的机器对机器付款"；OpenAI+Stripe 的 ACP 解决"智能体代人下单结账"；
  Google 的 AP2 解决"证明是人授权了这笔消费"。三者分层，不互斥。

## 2. 为什么它是智能体支付的关键标准

传统 API 收费 = 注册账号 → 绑卡/KYC → 预充值 → 管 API Key。对人麻烦，对智能体根本走不通。
x402 把付款塞进 HTTP 本身：

1. **HTTP 原生**：复活了 1997 年就存在的 `402 Payment Required` 状态码，不用发明新交互。
2. **无摩擦**：无账号、无 API Key、无预充值，按次付费，用多少付多少。
3. **EIP-3009 签名授权**：client 只做一次链下签名（`transferWithAuthorization`），
   不需要预先 `approve`，不需要 gas——智能体口袋里可以一分钱 gas 都没有。这是 x402 能做微支付的技术根基。
4. **Facilitator 隔离复杂度**：merchant 不碰私钥、不连钱包，验签和上链广播是两次 HTTP 调用。
5. **中立开放**：链无关（EVM、Solana…）、代币无关（USDC 为主，也在接闪电网络等）。

## 3. 三件套与完整流程

```
┌──────────┐   HTTP 请求    ┌──────────────┐   /verify /settle   ┌─────────────┐
│  Client  │ ───────────▶ │   Merchant   │ ─────────────────▶ │ Facilitator │
│ (智能体)  │ ◀─────────── │ (资源服务器)  │ ◀───────────────── │  (结算方)    │
└──────────┘   402/200      └──────────────┘                     └─────────────┘
```

官方标准流程（12 步，意译自 x402 仓库 README）：

1. Client 向 Merchant 发 HTTP 请求。
2. Merchant 回 `402`，`PAYMENT-REQUIRED` 头里带 base64 的报价单（含 `accepts` 数组）。
3. Client 从 `accepts` 选一条（选 scheme+network 自己支持的），构造 `PaymentPayload`。
4. Client 带 `PAYMENT-SIGNATURE` 头（base64 的 PaymentPayload）重试**同一个**请求。
5. Merchant 把 `PaymentPayload` + `PaymentRequirements` POST 给 facilitator 的 `/verify`。
6. Facilitator 按 scheme+network 验签，返回验签结果。
7. 合法 → Merchant 干活；非法 → 再回 402。
8. Merchant 把同一份材料 POST 给 facilitator 的 `/settle`（或自己上链结算）。
9. Facilitator 按 scheme+network 把钱打到链上。
10. Facilitator 等链上确认。
11. Facilitator 把结算结果回给 Merchant。
12. Merchant 回 `200` + 资源，`PAYMENT-RESPONSE` 头里带 base64 的结算回执。

关键名词：

| 名词 | 含义 |
|---|---|
| `scheme: "exact"` | 付款方案：精确金额，一分不多一分不少（另有 `upto` 等扩展） |
| `network: "eip155:84532"` | CAIP-2 链标识，这里是 Base Sepolia 测试网 |
| `maxAmountRequired: "10000"` | 金额（USDC 6 位小数 → 10000 = 0.01 USDC） |
| `EIP-3009` | 只签名不转账的授权标准，client 免 approve、免 gas |
| `EIP-712` | 结构化签名标准，签名内容人可读、防钓鱼 |

## 4. 本地 demo（一键跑通）

`code/` 里是三件套的最小实现，全部跑在 localhost，**不碰任何链、不花一分钱**：

- `facilitator.js`（:3002）—— 本地模拟 facilitator：`GET /supported`、`POST /verify`、
  `POST /settle`。签名是**真** EIP-712 验证（viem），只是跳过链上广播，交易哈希明确标注 `LOCAL_MOCK`。
- `merchant.js`（:3001）—— 收款方：`GET /free` 免费，`GET /premium` 走完整 x402 流程。
- `client.js` —— 智能体付款方：402 → 解析报价 → 内存临时密钥签名 → 重试 → 200。

```bash
cd ~/workspace/x402-starter/code
npm install        # 装 express + viem（已装过可跳过）
bash run-demo.sh   # 一键：起 facilitator → 起 merchant → 跑 client → 自动清理
```

你会看到 6 步中文日志：402 → 报价单 → 临时身份 → EIP-712 签名 → 重试 → 200 + 付款回执。
想单独玩：`node facilitator.js`、`node merchant.js`、`node client.js` 各开一个终端；
想改价格/端口：看各文件头部的中文注释（`requirements`、`PORT`、`PAYMENT-SIGNATURE` 等）。

**反例也测过**：伪造签名 → 402；金额/网络不对 → facilitator 拒绝。验签不是摆设。

## 5. 从本地 demo 上测试网（真实链路）

demo 已升级到 **x402 v2** 协议形状，与官方测试 facilitator 实测互通。
`run-testnet.sh` 一键切到真实链路，不用改逻辑：

```bash
# 1. 先给付款方领测试 USDC：打开 https://faucet.circle.com（免注册），
#    选 Base Sepolia + USDC，粘贴付款方地址，领 20 测试 USDC
# 2. 付款方钱包文件（测试网专用，600 权限，私钥绝不进代码/聊天）：
export PAYER_KEY_FILE=~/workspace/agent-pay-toolkit/wallets/x402-payer-testnet.json
# 3. 收款地址换成你自己的 Base Sepolia 钱包：
export PAY_TO=0x你的BaseSepolia收款地址
# 4. 跑！
bash run-testnet.sh
```

你会看到和本地 demo 一样的 5 步中文日志，但这一次 `/settle` 是官方测试
facilitator（`https://x402.org/facilitator`，免 Key，Base Sepolia 专用）在链上
真实广播的 `transferWithAuthorization`，回执里的交易哈希可以在
Base Sepolia 浏览器（sepolia.basescan.org）上查到。

要点：

1. 官方测试 facilitator 地址（2026-10-15 实测可用）：`https://x402.org/facilitator`，
   只支持测试网（Base Sepolia / Solana Devnet），主网不要用它；
2. 付款方需要 ≥0.01 测试 USDC（签名授权转的是付款方账上的币）；
   付款方不需要 gas——gas 由 facilitator 赞助；
3. 密钥只从 `PAYER_KEY_FILE` 文件读进内存，**绝不写进代码、绝不打印、
   绝不提交到 Git**（`.gitignore` 已配好）；
4. `requirements` 里的 `payTo` 通过 `PAY_TO` 环境变量注入。

> 红线：全程只碰测试网。不要往任何地址充真钱，不要用这个 demo 收主网 USDC。

## 6. 下一步建议

1. 把 `merchant.js` 的 `/premium` 换成你自己的 API（数据接口、AI 推理、文件下载都行），
   你就有一个"智能体可付费调用"的服务了——这正是 grant 申请里最好讲的故事。
2. 去 `grants.md` 看有哪些 grant 正在开放、申请条件是什么。
3. 想深入：官方仓库 https://github.com/x402-foundation/x402（specs/ 有完整协议文档），
   TypeScript 官方 SDK：`@x402/express`（服务端）、`@x402/fetch`（客户端）。

---
*本包 2026-10-12 整理；协议数据以 x402.org / 官方仓库为准。*
