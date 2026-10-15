# x402 Chinese Starter Kit

> [中文版](README.md) | x402 is the open standard for agent payments: an AI agent calling a paid
> API needs no account and no API key — on HTTP `402 Payment Required` it pays stablecoins
> automatically and retries. This kit turns the x402 protocol into a Chinese tutorial plus a
> runnable demo, so Chinese-speaking developers can run the full agent-payment flow in 10 minutes.

## What this is

- **Chinese tutorial** (`README.md`): the full 12-step x402 flow explained in Chinese, a glossary
  of key concepts (`scheme` / `network` / EIP-3009 / EIP-712), positioning vs ACP/AP2, and
  adversarial test notes.
- **Three-piece demo** (`code/`, Node.js + viem, x402 v2): `client` (agent payer), `merchant`
  (payee), `facilitator` (settlement). Signature verification is **real EIP-712** (viem);
  forged signatures, wrong amounts, and wrong networks are rejected — negative cases tested.
- **One-command runner** (`code/run-demo.sh`): 402 → quote → sign → retry → 200 + payment receipt.
- **Testnet mode** (`code/run-testnet.sh`): point the merchant at the official x402 testnet
  facilitator (`https://x402.org/facilitator`) and settle for real on **Base Sepolia**
  with test USDC — no real money involved, ever.
- **Grants intel** (`grants.md`): a Chinese-language roundup of Base / CDP / x402 grant programs.

## Quick start

```bash
cd code
npm install
bash run-demo.sh        # local: mock facilitator, real EIP-712 signatures
```

Testnet (real on-chain settlement on Base Sepolia):

```bash
# 1. Get test USDC from the Circle faucet (faucet.circle.com, no account needed):
#    select Base Sepolia + USDC, paste your payer address, claim 20 test USDC.
export PAYER_KEY_FILE=/path/to/testnet-payer-wallet.json   # {"address","private_key",...}
export PAY_TO=0xYourBaseSepoliaWallet                       # where the merchant receives
bash run-testnet.sh
```

The payer key is only ever read from a file into memory — it is never printed, never committed,
and testnet-only. **Never fund these wallets with real assets.**

## Status

- Local demo: working, real EIP-712 verification (viem), adversarial cases tested.
- Base Sepolia deployment: in progress — merchant wired to the official testnet facilitator;
  awaiting test-USDC funding for the payer address before the first on-chain settlement.

## License

MIT — see [LICENSE](LICENSE).
