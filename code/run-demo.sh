#!/bin/bash
# 一键跑通 x402 本地演示：启动 facilitator → 启动 merchant → 运行 client → 清理
set -u
cd "$(dirname "$0")"

echo "=== 1/3 启动本地 Facilitator（:3002）==="
node facilitator.js & FAC_PID=$!
echo "=== 2/3 启动 Merchant（:3001）==="
node merchant.js & MER_PID=$!

cleanup() { kill $FAC_PID $MER_PID 2>/dev/null; }
trap cleanup EXIT

# 等两个服务就绪（最多等 10 秒）
for i in $(seq 1 20); do
  if curl -s -o /dev/null http://localhost:3002/supported && curl -s -o /dev/null http://localhost:3001/free; then
    break
  fi
  sleep 0.5
done

echo "=== 3/3 运行 Client（智能体付款）==="
node client.js
STATUS=$?
echo "=== 演示结束（client 退出码 $STATUS）==="
exit $STATUS
