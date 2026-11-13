# 2–3 Minute Demo Video Script & Shot List (`DEMO_SCRIPT.md`)

**Presenter:** Dickson Agyei (CEO & Co-Founder, Alle-AI LTD)  
**Target Length:** 2 minutes 30 seconds  
**Tone:** Direct, technical founder showing real working software and live Celo explorer proofs.

---

## Pre-Recording Setup (30 Seconds Before You Hit Record)
1. In your terminal, start the local Proof Dashboard:
   ```bash
   npm start
   ```
2. Open these 4 browser tabs side-by-side:
   - **Tab 1:** `http://localhost:3001` (Alle-AI Verify Proof Dashboard)
   - **Tab 2:** [`https://celoscan.io/nft/0xaC3DF9ABf80d0F5c020C06B04Cced27763355944/202`](https://celoscan.io/nft/0xaC3DF9ABf80d0F5c020C06B04Cced27763355944/202) (Our LIVE Celo Mainnet Self Agent ID `#202` Soulbound NFT & ERC-8004 Card [`https://agent-api.self.xyz/api/cards/42220/202`](https://agent-api.self.xyz/api/cards/42220/202))
   - **Tab 3:** [`https://celo-sepolia.blockscout.com/address/0x31c2f9f8527e556d25ac6fd40d760c147c4a0e16?tab=contract`](https://celo-sepolia.blockscout.com/address/0x31c2f9f8527e556d25ac6fd40d760c147c4a0e16?tab=contract) (Our Verified `VerificationRegistry.sol` Contract & Onchain Attestations)
   - **Tab 4:** Terminal window ready to run `npm run verify:evidence` and `node scripts/e2e-verify-call.mjs --network sepolia`.

---

## Shot-by-Shot Script

### Shot 1 — Introduction & The Problem (0:00 – 0:35)
* **On Screen:** Tab 1 (`http://localhost:3001` — Alle-AI Verify Proof Dashboard).
* **What to Say:**
  > "Hi Prezenti team, I'm Dickson Agyei, CEO and co-founder of Alle-AI LTD, based in Kumasi, Ghana. Since 2023, we've built Alle-AI into a multi-model AI platform with over 35,000 users and 30,000 API installs, allowing developers to run and compare frontier models like Claude, GPT, and Gemini side-by-side.
  >
  > As autonomous agents move onchain on Celo, they face a major bottleneck: how do you know an agent didn't hallucinate an output, and how do you prove an agent's decision rationale wasn't tampered with after the fact?
  >
  > That's why we built **Alle-AI Verify on Celo** — an open multi-model verification and consensus attestation layer for the Celo agent economy."

### Shot 2 — Celo Mainnet Self Agent ID `#202` & ERC-8004 Identity (0:35 – 1:15)
* **On Screen:** Switch to **Tab 2** (Celoscan showing Self Agent ID NFT `#202` and `https://agent-api.self.xyz/api/cards/42220/202`).
* **What to Say:**
  > "First, our verifier agent itself has a verifiable, sybil-resistant identity on Celo Mainnet. Here on Celoscan is our Self Agent ID Soulbound NFT `#202` on Celo Mainnet (`0xaC3DF9AB...`), backed by a zero-knowledge proof from my NFC passport, and our ERC-8004 registration (`#932` on Sepolia and `#202` on Mainnet Self Registry). Any agent can discover our service via our ERC-8004 `agent.json` and A2A agent card."

### Shot 3 — Smart Contract & Privacy-Preserving Architecture (1:15 – 1:50)
* **On Screen:** Switch to **Tab 3** (Blockscout showing `VerificationRegistry.sol` verified source code and `Attested` events).
* **What to Say:**
  > "Here is our `VerificationRegistry` smart contract, fully open-source under MIT and source-verified on the explorer. By design, we never put raw prompts, proprietary trading strategies, or user data onchain. Instead, when an agent—such as our autonomous trading copilot Alle-Quant, or any third-party Celo agent—calls `POST /v1/verify`, we evaluate the claim across multiple AI models, compute an agreement score in basis points from 0 to 10,000 and a verdict (`AGREE`, `SPLIT`, or `DISAGREE`), and anchor only the `keccak256` `claimHash` and `resultHash` on Celo."

### Shot 4 — Live End-to-End Verification Call & Evidence Check (1:50 – 2:30)
* **On Screen:** Switch to **Tab 4 (Terminal)** and run `node scripts/e2e-verify-call.mjs --network sepolia`, then switch back to **Tab 1 (Proof Dashboard)** and click Refresh.
* **What to Say:**
  > "Let's trigger a live verification call right now. Here an Alle-Quant pre-trade risk and rationale entry is sent to `POST /v1/verify`. Three models evaluate it, reach 97.15% agreement (`9715` basis points), and our authorized agent wallet writes the receipt onchain in under 3 seconds, returning the transaction hash.
  >
  > Back on our public Proof Dashboard, anyone can click straight through to the block explorer or paste the original claim JSON into the local hash checker to verify that its `keccak256` fingerprint matches the onchain record without exposing sensitive data. Thank you, and we're excited to scale open verification infrastructure for every builder on Celo."
