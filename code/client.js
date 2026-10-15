// ============================================================
// Client（智能体付款方）—— x402 v2
// ------------------------------------------------------------
// 演示智能体如何为一次 HTTP 请求自动付款，全程无人工介入：
//   1. 直接请求 /premium（不带付款）
//   2. 收到 402，解析 PAYMENT-REQUIRED 报价单
//   3. 付款身份：PAYER_KEY_FILE 指向的测试网钱包（只读文件，不打印私钥）；
//      未设置则生成临时测试密钥（只在内存里，用完即焚，不写文件）
//   4. 按 EIP-3009 构造 transferWithAuthorization 授权，做 EIP-712 签名
//      —— 注意：这是"只签名"，不需要预先 approve，也不需要 gas，
//      这正是 x402 能做机器微支付的关键
//   5. 带 PAYMENT-SIGNATURE 头（x402 v2 形状）重试
//   6. 收到 200 + PAYMENT-RESPONSE（付款回执），拿到资源
//
// 环境变量：
//   MERCHANT_URL    merchant 地址（默认 http://localhost:3001）
//   PAYER_KEY_FILE  付款方钱包 JSON 文件路径（{"address","private_key",...}），
//                   不设置则用内存临时密钥
// ============================================================
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { randomBytes } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";

const MERCHANT = process.env.MERCHANT_URL || "http://localhost:3001";
const log = (s) => console.log(`[client] ${s}`);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64");
const unb64 = (s) => JSON.parse(Buffer.from(s, "base64").toString("utf8"));

// EIP-3009 TransferWithAuthorization 的类型定义（和 facilitator 侧保持一致）
const AUTH_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
};

// 付款身份：优先用 PAYER_KEY_FILE（测试网钱包），否则内存临时密钥。私钥绝不打印。
function loadAccount() {
  const f = process.env.PAYER_KEY_FILE;
  if (f && existsSync(f)) {
    const rec = JSON.parse(readFileSync(f, "utf8"));
    log(`付款身份：测试网钱包 ${rec.address}（密钥来自文件，仅内存使用）`);
    return privateKeyToAccount(rec.private_key);
  }
  const ephemeral = privateKeyToAccount(generatePrivateKey());
  log(`付款身份：临时密钥 ${ephemeral.address}（仅内存，用完即焚）`);
  return ephemeral;
}

async function main() {
  const account = loadAccount();

  // —— 第 1 步：裸请求 ——
  log("第 1 步：请求 /premium（不带付款）…");
  let r = await fetch(`${MERCHANT}/premium`);
  log(`收到 HTTP ${r.status}`);
  if (r.status !== 402) throw new Error(`期望 402，实际 ${r.status}`);

  // —— 第 2 步：读懂报价单 ——
  const reqBody = unb64(r.headers.get("payment-required"));
  const req = reqBody.accepts[0];
  const price = req.amount ?? req.maxAmountRequired;
  log("第 2 步：解析 PAYMENT-REQUIRED，商家报价：");
  log(`  ${req.description}`);
  log(`  金额 ${price}（USDC 最小单位） 收款 ${req.payTo} 网络 ${req.network}`);

  // —— 第 3 步：EIP-712 签名付款授权 ——
  const now = Math.floor(Date.now() / 1000);
  const authorization = {
    from: account.address,
    to: req.payTo,
    value: BigInt(price),
    validAfter: 0n,
    validBefore: BigInt(now + req.maxTimeoutSeconds),
    nonce: `0x${randomBytes(32).toString("hex")}`,
  };
  const signature = await account.signTypedData({
    domain: {
      name: req.extra.name, // "USDC"
      version: req.extra.version, // "2"
      chainId: 84532, // Base Sepolia
      verifyingContract: req.asset,
    },
    types: AUTH_TYPES,
    primaryType: "TransferWithAuthorization",
    message: authorization,
  });
  log("第 3 步：EIP-712 签名完成（只签名、不转账、不花 gas）");

  // x402 v2 的 PAYMENT-SIGNATURE 形状
  const paymentPayload = {
    x402Version: 2,
    resource: {
      url: `${MERCHANT}/premium`,
      description: req.description,
      mimeType: req.mimeType,
    },
    accepted: req,
    payload: {
      signature,
      authorization: {
        from: authorization.from,
        to: authorization.to,
        value: authorization.value.toString(),
        validAfter: "0",
        validBefore: authorization.validBefore.toString(),
        nonce: authorization.nonce,
      },
    },
    extensions: {},
  };

  // —— 第 4 步：带付款凭证重试 ——
  log("第 4 步：携带 PAYMENT-SIGNATURE 重试请求…");
  r = await fetch(`${MERCHANT}/premium`, {
    headers: { "PAYMENT-SIGNATURE": b64(paymentPayload) },
  });
  log(`收到 HTTP ${r.status}`);
  if (r.status !== 200) {
    throw new Error(`付款失败，状态 ${r.status}：${(await r.text()).slice(0, 300)}`);
  }

  // —— 第 5 步：验回收执，拿资源 ——
  const receipt = unb64(r.headers.get("payment-response"));
  const data = await r.json();
  log("第 5 步：✅ 200！拿到资源：");
  console.log("  资源内容：", JSON.stringify(data));
  console.log("  付款回执：", JSON.stringify(receipt));
  log("演示完成：一次真实的 EIP-712 签名付款，全程无 API Key、无注册、无真钱。");
}

main().catch((e) => {
  console.error("[client] 出错：", e.message);
  process.exit(1);
});
