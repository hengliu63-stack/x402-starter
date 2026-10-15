// ============================================================
// Merchant（资源服务器 / 收款方）—— x402 v2
// ------------------------------------------------------------
// 一个收 x402 付款的 HTTP 服务：
//   GET /        —— 服务说明
//   GET /free    —— 免费接口，直接 200
//   GET /premium —— 收费接口，走完整 x402 v2 流程：
//                     没带 PAYMENT-SIGNATURE → 402 + PAYMENT-REQUIRED（告诉 client 怎么付）
//                     带了 → 调 facilitator /verify → /settle → 200 + PAYMENT-RESPONSE（付款回执）
//
// merchant 自己不碰私钥、不连钱包：验签和结算两个脏活全丢给 facilitator，
// 就是两次 HTTP 调用。这也是 x402 对商家的核心卖点。
//
// 环境变量：
//   FACILITATOR_URL  facilitator 地址（默认本地模拟；测试网用官方测试 facilitator
//                    https://x402.org/facilitator；代码不用改）
//   PORT             本服务端口（默认 3001）
//   PAY_TO           收款地址（默认示例占位地址，生产/测试网请换成自己的钱包地址）
// ============================================================
import express from "express";

const FACILITATOR_URL = process.env.FACILITATOR_URL || "http://localhost:3002";
const PORT = Number(process.env.PORT || 3001);

// 示例收款地址 —— 生产/测试网请用 PAY_TO 环境变量换成你自己的钱包地址
const PAY_TO =
  process.env.PAY_TO || "0x1111111111111111111111111111111111111111";

// 这就是 402 里告诉 client 的"报价单"（PaymentRequirements，x402 v2 形状）
const requirements = {
  scheme: "exact",
  network: "eip155:84532", // Base Sepolia 测试网
  amount: "10000", // 10000 个最小单位 = 0.01 USDC（USDC 6 位小数）
  asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia 上的 USDC 合约（Circle 官方测试网地址）
  payTo: PAY_TO,
  resource: `http://localhost:${PORT}/premium`,
  description: "高级数据接口：每次调用 0.01 测试 USDC",
  mimeType: "application/json",
  maxTimeoutSeconds: 300,
  extra: { name: "USDC", version: "2" }, // EIP-712 domain 用（USDC 的链上定义）
};

const app = express();
const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64");

// 返回 402：header 和 body 里都带上报价单（按 x402 v2 规范）
function replyPaymentRequired(res) {
  const body = { x402Version: 2, accepts: [requirements] };
  res.set("PAYMENT-REQUIRED", b64(body));
  return res.status(402).json(body);
}

// 不同 facilitator 实现回执里的交易哈希字段名不一样，兼容读取
function txHashOf(settleResp) {
  return (
    settleResp?.transaction ??
    settleResp?.txHash ??
    settleResp?.transactionHash ??
    settleResp?.hash ??
    null
  );
}

app.get("/", (req, res) =>
  res.json({
    service: "x402 中文上手包 · 示例 Merchant（x402 v2）",
    endpoints: { free: "GET /free（免费）", premium: "GET /premium（x402 收费）" },
  })
);

app.get("/free", (req, res) => {
  res.json({ data: "这是免费接口，不需要付款", price: 0 });
});

app.get("/premium", async (req, res) => {
  // —— 第 1 步：没带付款凭证 → 402 ——
  const sigHeader = req.get("PAYMENT-SIGNATURE");
  if (!sigHeader) return replyPaymentRequired(res);

  let paymentPayload;
  try {
    paymentPayload = JSON.parse(Buffer.from(sigHeader, "base64").toString("utf8"));
  } catch {
    return replyPaymentRequired(res); // 凭证解析失败也按没付处理
  }

  const facilBody = {
    x402Version: 2,
    paymentPayload,
    paymentRequirements: requirements,
  };

  // —— 第 2 步：调 facilitator 验签 ——
  const verifyResp = await fetch(`${FACILITATOR_URL}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(facilBody),
  })
    .then((r) => r.json())
    .catch(() => null);
  if (!verifyResp?.isValid) return replyPaymentRequired(res); // 验不过 → 还是 402

  // —— 第 3 步：调 facilitator 结算 ——
  const settleResp = await fetch(`${FACILITATOR_URL}/settle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(facilBody),
  })
    .then((r) => r.json())
    .catch(() => null);
  const tx = txHashOf(settleResp);
  if (!settleResp?.success || !tx) {
    return res
      .status(502)
      .json({ error: "结算失败", detail: settleResp?.errorReason || "facilitator_unreachable" });
  }

  // —— 第 4 步：返回资源 + 付款回执 ——
  res.set(
    "PAYMENT-RESPONSE",
    b64({ success: true, transaction: tx, network: settleResp.network, payer: settleResp.payer })
  );
  res.json({
    data: "付款成功！高级数据：{ 天气：晴，温度：26°C，湿度：45% }",
    price: "0.01 USDC",
    receipt: tx,
  });
});

app.listen(PORT, () => {
  console.log(`[merchant] 运行在 http://localhost:${PORT}`);
  console.log(`[merchant] facilitator: ${FACILITATOR_URL}`);
  console.log(`[merchant] 收款地址: ${PAY_TO}`);
  console.log(`[merchant] /premium 收费：0.01 测试 USDC / 次`);
});
