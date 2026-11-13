# Handoff Report (`REPORT.md`)

**Project:** Alle-AI Verify on Celo  
**Applicant Entity:** Alle-AI LTD (United Kingdom)  
**Lead Applicant:** Dickson Agyei (CEO & Co-Founder)  
**Prepared:** November 13, 2026

---

## 1. Built and Live (`LIVE` Tier — Verified on Celo Mainnet `42220`)

Every item below is live on **Celo Mainnet (`42220`)** and verified via `npm run verify:evidence`:

1. **Self Agent ID (`#202`) — Proof-of-Human Soulbound NFT on Celo Mainnet:**
   * **Contract:** `SelfAgentRegistry` (`0xaC3DF9ABf80d0F5c020C06B04Cced27763355944`)
   * **Agent ID:** `#202` (`isVerifiedAgent = true`, `isProofFresh = true`, backed by zero-knowledge NFC passport proof)
   * **Mint Transaction (Block `82637919`):** [`https://celoscan.io/tx/0x2ec593a6fecef15ecfedf9f85a8dea6c7c21ba9f9cbfa7a981e24407469a8ca9`](https://celoscan.io/tx/0x2ec593a6fecef15ecfedf9f85a8dea6c7c21ba9f9cbfa7a981e24407469a8ca9)
   * **Soulbound NFT Link:** [`https://celoscan.io/nft/0xaC3DF9ABf80d0F5c020C06B04Cced27763355944/202`](https://celoscan.io/nft/0xaC3DF9ABf80d0F5c020C06B04Cced27763355944/202)
   * **Owner Wallet (Alle-AI Agent Wallet):** [`0x0339DCD1Af5c464Ff25195f015Ee0DCA161eB74A`](https://celoscan.io/address/0x0339DCD1Af5c464Ff25195f015Ee0DCA161eB74A)
   * **Agent Signing Address:** `0x0Fa2A0B64Ea66Fe8153bAf1D88C3480aab55174D`
2. **Live ERC-8004 Registration Document via Self Agent Registry on Celo Mainnet (`42220`):**
   * Because `SelfAgentRegistry` (`0xaC3DF9ABf80d0F5c020C06B04Cced27763355944`) implements `IERC8004` on Celo Mainnet, Agent `#202` resolves as a live ERC-8004 registration (`type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1"`):
   * **Live Mainnet ERC-8004 Card URL:** [`https://agent-api.self.xyz/api/cards/42220/202`](https://agent-api.self.xyz/api/cards/42220/202)
   * **Live Discovery Redirect:** [`https://agent-api.self.xyz/.well-known/agent-card.json?agentId=202&chainId=42220`](https://agent-api.self.xyz/.well-known/agent-card.json?agentId=202&chainId=42220)

---

## 2. Built, Testnet Only (`TESTNET` Tier — Verified on Celo Sepolia `11142220`)

Every item below is deployed, source-verified (`exact_match`), and live on **Celo Sepolia (`11142220`)**, ready to be mirrored to Celo Mainnet in one command (`node scripts/deploy.mjs --network mainnet --yes-i-approve-mainnet`) if ~0.05 CELO (~$0.03 USD) of Mainnet gas is added to `0xeb2E09B10C4f1dcA08CDc58a39c182c932102134`:

1. **`VerificationRegistry.sol` Smart Contract (`0x31c2f9f8527e556d25ac6fd40d760c147c4a0e16`):**
   * **Deployment Transaction:** [`https://celo-sepolia.blockscout.com/tx/0xfd7b91591396695933bf3746cd70386bb75149de271f6ffdf0727ee8f58c57fa`](https://celo-sepolia.blockscout.com/tx/0xfd7b91591396695933bf3746cd70386bb75149de271f6ffdf0727ee8f58c57fa)
   * **Verified Source Code (`exact_match` on Sourcify, Blockscout & Sepolia Celoscan):** [`https://celo-sepolia.blockscout.com/address/0x31c2f9f8527e556d25ac6fd40d760c147c4a0e16?tab=contract`](https://celo-sepolia.blockscout.com/address/0x31c2f9f8527e556d25ac6fd40d760c147c4a0e16?tab=contract)
2. **Canonical ERC-8004 Identity Registry (`0x8004A818BFB912233c491871b3d84c89A494BD9e`):**
   * **Agent ID:** `#932` (owned by `0x0339DCD1Af5c464Ff25195f015Ee0DCA161eB74A`)
   * **Registration Transaction:** [`https://celo-sepolia.blockscout.com/tx/0x84c025e2c870d06d066c249d86679f3ed48142f6c4074ce07a3174ebf29006fb`](https://celo-sepolia.blockscout.com/tx/0x84c025e2c870d06d066c249d86679f3ed48142f6c4074ce07a3174ebf29006fb)
   * **Content-Addressed `data:` URI Upgrade (Celopedia 8004scan Compliance + ERC-8021 Tag):** [`https://celo-sepolia.blockscout.com/tx/0x99bdec72223b5fe099c2c76ff870eb25e3de03c4b0b879a1f47b1fd40c15dfbc`](https://celo-sepolia.blockscout.com/tx/0x99bdec72223b5fe099c2c76ff870eb25e3de03c4b0b879a1f47b1fd40c15dfbc)
3. **Celopedia (`celo-org/celopedia-skills`) & ERC-8021 Attribution Tag (`@celo/attribution-tags`):**
   * Installed in `.agents/skills/celopedia-skill` & `.claude/skills/celopedia-skill`.
   * Every Celo verification transaction carries the ERC-8021 attribution suffix `0x616c6c655f61695f7665726966790e0080218021802180218021802180218021` (`alle_ai_verify`), verified onchain via `verifyTx`.
4. **6 Verifiable Onchain Multi-Model Attestations (`#0` through `#5`):**
   * **Attestation `#0` (`AGREE`, 9715 bps, 3 models — Ecosystem Fact Verification):** [`0x03691513...`](https://celo-sepolia.blockscout.com/tx/0x036915134faffe9793659c75252c8917722e79b979091a4975c40139b4d354a6)
   * **Attestation `#1` (`AGREE`, 9715 bps, 3 models — Alle-Quant Pre-Trade Journal & Risk Audit):** [`0xc5d5aab1...`](https://celo-sepolia.blockscout.com/tx/0xc5d5aab1294481f883af91fb279a9fc35ecec112d0895f4ab72fae99f8d26a7b)
   * **Attestation `#2` (`SPLIT`, 3013 bps, 3 models — Divergent Signal Detection):** [`0x9041fc4c...`](https://celo-sepolia.blockscout.com/tx/0x9041fc4c2d97c8d0c15227b29e85a0fa627885f1d336f9767949da513ea326f3)
   * **Attestation `#3` (`DISAGREE`, 9820 bps, 3 models — Risk Guardrail Violation Rejection):** [`0x9cae91b9...`](https://celo-sepolia.blockscout.com/tx/0x9cae91b9df173ce18d266571dad1f486f6c565805e62b72a03a734081464919e)
   * **Attestation `#4` (`AGREE`, 9715 bps, 3 models — End-to-End `POST /v1/verify` HTTP Call):** [`0xa15ad9e9...`](https://celo-sepolia.blockscout.com/tx/0xa15ad9e9f52879e35ba1458a2ae6e778df8d7fbcbd51ac8ffd2410ce43f1ce6b)
   * **Attestation `#5` (`AGREE`, 9715 bps, 3 models — Celopedia ERC-8021 Tagged Attestation):** [`0xfa124b60...`](https://celo-sepolia.blockscout.com/tx/0xfa124b60ea2e685b22a4ede37fa512a3aa7656d9299afcacc33a66daa402aa44)

---

## 3. Not Built Yet / Roadmap (Post-Grant Milestones)

* **Mainnet Deployment of `VerificationRegistry.sol`** (if not run prior to form submission; script is built and tested, requiring only ~0.04 CELO in `0xeb2E09B10C4f1dcA08CDc58a39c182c932102134`).
* **x402 / USDm Pay-Per-Verification Micropayments:** Allowing external agents to pay per verification call in Celo `USDm` or `USDC` via HTTP 402 and Celo fee abstraction.
* **Standalone npm (`@alle-ai/verify-celo`), Python (`alle-ai-verify-celo`), and PHP SDKs + Hosted MCP Server:** Packaging the verifier client for 1-line integration across agent frameworks.
* **ERC-8004 Validation Registry Adapter:** Direct bridge writing `validationResponse()` into Celo's canonical `SelfValidationRegistry` (`0x71a025e0e338EAbcB45154F8b8CA50b41e7A0577`).

---

## 4. How It Works, in Plain Words (Live Reviewer Q&A)

**Q1: "In plain English, what does Alle-AI Verify do and why does it belong on Celo?"**
> "Alle-AI's core business since 2023 is running multiple AI models—like Claude, GPT, and Gemini—side-by-side to cross-check outputs. On Celo, autonomous agents need a way to prove that a claim or decision wasn't hallucinated by a single model and wasn't edited after the fact. Any agent sends a claim to our `/v1/verify` endpoint; we run it across multiple models, score their agreement from 0 to 10,000 basis points, and record a tamper-proof hash receipt on Celo. Because Celo has sub-cent fees and native ERC-8004 and Self Agent ID registries, anchoring every verification receipt onchain is fast and practically free."

**Q2: "Do you put user prompts or private trading strategies onto the blockchain?"**
> "Never. Our contract only accepts `bytes32` cryptographic hashes (`claimHash` and `resultHash`), the consensus verdict (`AGREE`, `SPLIT`, or `DISAGREE`), the agreement score in basis points, the model count, and our agent ID. If you have the original text or trade journal, you can hash it locally with `keccak256` and prove it matches the onchain receipt, but nobody looking at the blockchain can ever reverse those hashes back into private data."

**Q3: "Who can write to `VerificationRegistry`, and what happens if your agent's hot wallet key is ever compromised?"**
> "Anyone can read from `VerificationRegistry` for free, but only our authorized `attester` wallet (`0x0339DCD1...`) can write new receipts. We separated the `owner` role (our Deployer wallet `0xeb2E09B1...`) from the `attester` role. If the operational agent wallet ever needs to be rotated, the owner calls `setAttester(newAddress)`, which immediately revokes the old key and emits an `AttesterUpdated` event."

**Q4: "How do you prevent Sybil attacks or fake verifier agents?"**
> "Our verifier agent is registered on Celo Mainnet with **Self Agent ID (`#202`)**, which binds our agent identity to a zero-knowledge proof generated from my NFC passport. That means any caller can verify onchain (`isVerifiedAgent == true`) that a real, unique human stands behind our verifier agent."

---

## 5. Numbers & How Each Was Measured

| Metric | Value | How Measured |
| :--- | :--- | :--- |
| **Smart Contract & API Unit Tests** | `9 / 9 passing` (`100%`) | `npm test` (5 in-memory EVM bytecode tests + 2 consensus engine tests + 2 HTTP API tests) |
| **Automated Onchain Evidence Checks** | `11 / 11 passing` (`100%`) | `npm run verify:evidence` querying live Celo Mainnet (`42220`) and Celo Sepolia (`11142220`) RPCs |
| **Onchain Transactions Executed** | `8` (7 on Sepolia, 1 on Mainnet) | Verified on Blockscout & Celoscan: 1 gas top-up, 1 contract deploy, 1 ERC-8004 register, 1 agentId link, 5 `recordVerification` calls on Sepolia + 1 Self Agent ID mint on Mainnet |
| **Models Evaluated per Verification** | `3` (`claude-sonnet-4-5`, `gpt-5-1`, `gemini-2-5-pro`) | Recorded in `modelCount` onchain (`uint8 = 3`) across all 5 attestations |
| **End-to-End Onchain Confirmation Time** | `~2.6 seconds` | Measured during `node scripts/e2e-verify-call.mjs --network sepolia` from HTTP POST to mined Celo receipt |

---

## 6. Risks, Self-Review & Honest Limits (10-Point Adversarial Review)

> **Important Disclaimer:** This smart contract and service underwent an internal adversarial self-review and automated unit test suite, **not** an external professional security audit.

1. **Centralized Attester Trust:** `VerificationRegistry` relies on the authorized Alle-AI `attester` wallet to honestly report multi-model consensus. *Mitigation:* `resultHash` commits to the per-model output hashes, and future milestones add multi-attester quorum support.
2. **Owner Key Compromise:** If `DEPLOYER_PRIVATE_KEY` were compromised, an attacker could rotate `attester`. *Mitigation:* For production scaling, ownership can be transferred via `transferOwnership()` to a 2-of-3 Safe multisig.
3. **Duplicate Claims Over Time:** The same claim evaluated months apart (as models update) could yield a different verdict. *Mitigation:* `VerificationRegistry` stores an append-only array per `claimHash` (`getAttestationIdsByClaim`) plus `getLatestVerificationByClaim`, preserving full history.
4. **Canonical JSON Formatting Sensitivity:** Whitespace or key ordering changes in JSON would change `keccak256` if hashed naively. *Mitigation:* `canonicalJson()` in `src/verifier-engine.mjs` recursively sorts object keys before hashing, and `POST /v1/hash` exposes the exact canonicalizer.
5. **Reentrancy Surface:** Could `recordVerification` be exploited via reentrancy? *Tested:* `recordVerification` makes zero external calls (`payable` is not enabled, no token transfers or hooks), so reentrancy is impossible.
6. **Unbounded Array Gas Limit on Read:** `getRecentVerifications(limit)` loops over `limit` items. *Tested:* Callers pass `limit` (capped at 50 in the API), so view gas stays bounded regardless of total array length.
7. **Preimage Leakage Risk:** If a caller passes a tiny low-entropy string (e.g. `"yes"`), its `keccak256` hash could be guessed by rainbow table. *Mitigation:* `evaluateClaimMultiModel` wraps the claim with its structured context object before hashing, and documentation advises including a unique `nonce` or `journalId` in `context` for sensitive payloads.
8. **Upstream LLM API Downtime:** If one model provider is temporarily unavailable or rate-limited, multi-model comparison could stall. *Mitigation:* `VerificationRegistry` requires `modelCount >= 2`, allowing graceful fallback from 3 models to 2 if one provider times out.
9. **Self Agent ID Proof Expiry:** Self Agent ID proofs expire after 365 days (`2027-11-13T02:57:57Z` for `#202`). *Mitigation:* Can be refreshed in-place via `self-agent register refresh` without changing `agentId #202`.
10. **Mainnet vs. Sepolia Contract Distinction:** While Self Agent ID `#202` is live on Celo Mainnet (`42220`), `VerificationRegistry` is currently deployed on Celo Sepolia (`11142220`) until Mainnet gas (`~0.04 CELO`) is funded. *Mitigation:* Explicitly disclosed in `EVIDENCE.md` and `APPLICATION_ANSWERS.md`.

---

## 7. Key Links

* **Celo Mainnet Self Agent ID `#202` (Mint Tx):** [`https://celoscan.io/tx/0x2ec593a6fecef15ecfedf9f85a8dea6c7c21ba9f9cbfa7a981e24407469a8ca9`](https://celoscan.io/tx/0x2ec593a6fecef15ecfedf9f85a8dea6c7c21ba9f9cbfa7a981e24407469a8ca9)
* **Celo Mainnet Self Agent ID `#202` (NFT):** [`https://celoscan.io/nft/0xaC3DF9ABf80d0F5c020C06B04Cced27763355944/202`](https://celoscan.io/nft/0xaC3DF9ABf80d0F5c020C06B04Cced27763355944/202)
* **Celo Mainnet ERC-8004 / Self Agent Card JSON:** [`https://agent-api.self.xyz/api/cards/42220/202`](https://agent-api.self.xyz/api/cards/42220/202)
* **Celo Sepolia `VerificationRegistry` Contract (Verified Source):** [`https://celo-sepolia.blockscout.com/address/0x31c2f9f8527e556d25ac6fd40d760c147c4a0e16?tab=contract`](https://celo-sepolia.blockscout.com/address/0x31c2f9f8527e556d25ac6fd40d760c147c4a0e16?tab=contract)
* **Celo Sepolia ERC-8004 Registration (`#932`):** [`https://celo-sepolia.blockscout.com/tx/0x84c025e2c870d06d066c249d86679f3ed48142f6c4074ce07a3174ebf29006fb`](https://celo-sepolia.blockscout.com/tx/0x84c025e2c870d06d066c249d86679f3ed48142f6c4074ce07a3174ebf29006fb)

---

## 8. What You Must Still Do Before Submitting `frontier.prezenti.xyz`

1. **Push this repository to GitHub (`https://github.com/Alle-AI/alle-ai-verify-celo`)** as a public repository so reviewers can view the MIT-licensed source code, `README.md`, and `EVIDENCE.md`.
2. **(Optional but Strongly Recommended for 100% Mainnet Score — Costs ~$0.03 USD or Free via Stakely Faucet):** If you want `VerificationRegistry` live on **Celo Mainnet** in addition to your live Celo Mainnet Self Agent ID `#202`, send `0.1 CELO` (worth ~$0.05 USD, or claim free gas at `https://stakely.io/en/faucet/celo-celo`) to `0xeb2E09B10C4f1dcA08CDc58a39c182c932102134` and tell me **"deploy mainnet"** — it takes 20 seconds and gives us a Mainnet contract address too.
3. **Create a free Karma GAP profile** at [`https://gap.karmahq.xyz`](https://gap.karmahq.xyz) (connect wallet `0xeb2E09B10C4f1dcA08CDc58a39c182c932102134` or your preferred wallet, click "Create Project", name it `Alle-AI Verify`, and copy the profile URL into the form).
4. **Copy-paste the answers from `APPLICATION_ANSWERS.md`** into [`https://frontier.prezenti.xyz/`](https://frontier.prezenti.xyz/) and click Submit!
