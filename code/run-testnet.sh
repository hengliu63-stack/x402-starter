#!/bin/bash
# x402 测试网真实结算演示：merchant 接官方测试 facilitator，链上真实结算（测试币）
#
# 前置：付款方地址要有 Base Sepolia 测试 USDC（Circle 水龙头 faucet.circle.com，
#       免注册：选 Base Sepolia + USDC，粘贴付款地址，领 20 测试 USDC）
# 密钥只从文件读，不经过命令行，不打印。
#
# 用法：
#   export PAYER_KEY_FILE=~/workspace/agent-pay-toolkit/wallets/x402-payer-testnet.json
#   export PAY_TO=0x你的BaseSepolia收款地址
#   bash run-testnet.sh
set -u
cd "$(dirname "$0")"

if [ -z "${PAYER_KEY_FILE:-}" ] || [ -z "${PAY_TO:-}" ]; then
  echo "先设置两个环境变量："
  echo "  export PAYER_KEY_FILE=~/workspace/agent-pay-toolkit/wallets/x402-payer-testnet.json"
  echo "  export PAY_TO=0x你的BaseSepolia收款地址"
  exit 1
fi

export FACILITATOR_URL="https://x402.org/facilitator"
echo "=== 1/2 启动 Merchant（:3001），facilitator = 官方测试网 ==="
echo "      收款地址 PAY_TO=$PAY_TO"
PORT=3001 node merchant.js & MER_PID=$!
cleanup() { kill $MER_PID 2>/dev/null; }
trap cleanup EXIT

for i in $(seq 1 20); do
  if curl -s -o /dev/null http://localhost:3001/free; then break; fi
  sleep 0.5
done

echo "=== 2/2 运行 Client（测试网真实签名付款）==="
node client.js
STATUS=$?
echo "=== 结束（client 退出码 $STATUS）==="
exit $STATUS
