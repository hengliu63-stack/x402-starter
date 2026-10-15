// ============================================================
// Facilitator（结算方）—— 本地模拟版
// ------------------------------------------------------------
// x402 里 facilitator 是"帮 merchant 干脏活"的角色，对外只暴露三个端点：
// GET /supported —— 告诉大家我支持哪些 (scheme, network)
// POST /verify —— 验付款：签名对不对、金额对不对、nonce 用过没
// POST /settle —— 结算付款：真 facilitator 会在这里把 USDC 转到 merchant 账上
//
// 真实 facilitator（如 Coinbase 的）会在 /settle 里做链上
// 余额检查并广播交易。本文件为了零成本本地演示，只做真密码学签名验证，
// 跳过链上广播，返回明确标注的模拟交易哈希。不碰主网、不花一分钱。
// 上生产/测试网时，把 merchant 的 FACILITATOR_URL 指向真实 facilitator 即可，
// merchant 和 client 一行代码都不用改。
// ============================================================
import express from "express";
import { recoverTypedDataAddress} from "viem";

const app = express();
app.use(express.json({ limit: "256kb"}));

// 本演示只支持：exact 方案 × Base Sepolia 测试网（eip155:84532）
const SUPPORTED = [{ x402Version: 2, scheme: "exact", network: "eip155:84532" }];

// 记录用过的 nonce，防重放攻击（生产环境应持久化，这里内存就够了）
const usedNonces = new Set();

// EIP-3009 transferWithAuthorization 的 EIP-712 类型定义（USDC 等代币的标准）
// 注意：这是"只签名不转账"的授权，client 不需要预先 approve，也不需要 gas ——
// 这正是 x402 能做智能体微支付的关键。
const TRANSFER_WITH_AUTH_TYPES = {
TransferWithAuthorization: [
{ name: "from", type: "address"},
{ name: "to", type: "address"},
{ name: "value", type: "uint256"},
{ name: "validAfter", type: "uint256"},
{ name: "validBefore", type: "uint256"},
{ name: "nonce", type: "bytes32"},
],
};

// 从 PaymentRequirements.extra 里取出 token 的 EIP-712 domain 信息
function domainFor(requirements) {
const extra = requirements.extra || {};
return {
name: extra.name || "USDC",
version: extra.version || "2",
chainId: 84532, // Base Sepolia
verifyingContract: requirements.asset,
};
}

// 核心验证逻辑：返回 { ok, payer?, nonceKey?, reason?}
// 兼容 x402 v2 信封：paymentPayload = { x402Version, resource, accepted, payload, extensions }
async function verifyPayment(paymentPayload, paymentRequirements) {
const req = paymentRequirements;
const payload = paymentPayload?.payload || {};
const accepted = paymentPayload?.accepted || {};
const auth = payload.authorization || {};
const signature = payload.signature;
const amountRequired = req.amount ?? req.maxAmountRequired;

// 1. scheme / network 是否在支持列表里（v2：accepted 里带 scheme+network）
if ((accepted.scheme ?? req.scheme)!== "exact" || req.scheme!== "exact") {
return { ok: false, reason: "unsupported_scheme"};
}
const net = accepted.network ?? req.network;
if (net!== "eip155:84532" || req.network!== "eip155:84532") {
return { ok: false, reason: "invalid_network"};
}
// 2. exact 语义：金额必须分毫不差（多了少了都不行）
if (String(auth.value)!== String(amountRequired)) {
return { ok: false, reason: "invalid_amount"};
}
// 3. 收款地址必须就是 merchant 要的那个
if (String(auth.to).toLowerCase()!== String(req.payTo).toLowerCase()) {
return { ok: false, reason: "invalid_recipient"};
}
// 4. 授权必须在有效时间窗内
const now = Math.floor(Date.now() / 1000);
if (Number(auth.validAfter) > now || Number(auth.validBefore) <= now) {
return { ok: false, reason: "authorization_expired"};
}
// 5. nonce 不能重用（防重放）
const nonceKey = `${auth.from}:${auth.nonce}`.toLowerCase();
if (usedNonces.has(nonceKey)) {
return { ok: false, reason: "nonce_already_used"};
}
// 6. 真密码学验证：EIP-712 签名必须能恢复出付款人地址
try {
const recovered = await recoverTypedDataAddress({
domain: domainFor(req),
types: TRANSFER_WITH_AUTH_TYPES,
primaryType: "TransferWithAuthorization",
message: {
from: auth.from,
to: auth.to,
value: BigInt(auth.value),
validAfter: BigInt(auth.validAfter),
validBefore: BigInt(auth.validBefore),
nonce: auth.nonce,
},
signature,
});
if (recovered.toLowerCase()!== String(auth.from).toLowerCase()) {
return { ok: false, reason: "invalid_signature"};
}
} catch {
return { ok: false, reason: "invalid_signature"};
}
return { ok: true, payer: auth.from, nonceKey};
}

app.get("/supported", (req, res) => {
res.json({ kinds: SUPPORTED});
});

app.post("/verify", async (req, res) => {
const { paymentPayload, paymentRequirements} = req.body || {};
if (!paymentPayload ||!paymentRequirements) {
return res.json({ isValid: false, invalidReason: "missing_payload"});
}
const r = await verifyPayment(paymentPayload, paymentRequirements);
if (r.ok) return res.json({ isValid: true, payer: r.payer});
return res.json({ isValid: false, invalidReason: r.reason});
});

app.post("/settle", async (req, res) => {
const { paymentPayload, paymentRequirements} = req.body || {};
if (!paymentPayload ||!paymentRequirements) {
return res.json({ success: false, errorReason: "missing_payload"});
}
const r = await verifyPayment(paymentPayload, paymentRequirements);
if (!r.ok) return res.json({ success: false, errorReason: r.reason});
usedNonces.add(r.nonceKey); // 结算成功才标记 nonce 已用
// 本地模拟交易哈希：明确标注，未上链
const mockTx =
"0x" +
Buffer.from(`local-mock-settle-${Date.now()}-${r.nonceKey}`)
.toString("hex")
.slice(0, 64)
.padEnd(64, "0");
res.json({
success: true,
transaction: mockTx,
network: paymentRequirements.network,
payer: r.payer,
note: "LOCAL_MOCK_NO_CHAIN",
});
});

app.listen(3002, () => {
console.log("[facilitator] 本地模拟 Facilitator 运行在 http://localhost:3002");
console.log("[facilitator] 支持: exact × eip155:84532（Base Sepolia 测试网）");
});
