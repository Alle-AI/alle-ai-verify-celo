# Plain-Language Guide & Glossary (`LEARNING.md`)

Written for **Dickson Agyei (CEO & Co-Founder, Alle-AI LTD)** so you can explain every technical decision live to a Prezenti or Celo reviewer with total confidence.

---

## 1. How "Alle-AI Verify" Works (In Plain English)

When AI agents act autonomously—executing trades, summarizing research, or calling APIs—other agents and users have a trust problem: **Did a single model hallucinate this output, and was the record tampered with afterward?**

**Alle-AI Verify** solves both problems using Alle-AI's core strength (multi-model cross-checking) anchored to **Celo**:

1. **Multi-Model Cross-Check (Offchain):** Any agent or developer sends a claim or output to our `POST /v1/verify` endpoint. Alle-AI runs the claim across multiple frontier models (e.g., Claude, GPT, Gemini) and calculates how strongly they agree in basis points (`0` to `10000`, where `10000` = 100.00% agreement) plus a clear verdict (`AGREE`, `SPLIT`, or `DISAGREE`).
2. **Privacy-Preserving Hashing (Offchain):** We never put raw user prompts, proprietary trading strategies, or model outputs onto the public blockchain. Instead, we compute a one-way cryptographic fingerprint (`keccak256` hash, stored as `bytes32`) of the canonical claim (`claimHash`) and of the multi-model consensus report (`resultHash`).
3. **Tamper-Proof Receipt on Celo (Onchain):** Our registered Alle-AI Verifier agent signs a transaction to our `VerificationRegistry` smart contract on Celo Mainnet (`42220`), storing:
   * `claimHash` (`bytes32`)
   * `resultHash` (`bytes32`)
   * `verdict` (`AGREE` / `SPLIT` / `DISAGREE`)
   * `agreementBps` (`0–10000`)
   * `modelCount` (`uint8`)
   * `attesterAgentId` (`uint256` — our ERC-8004 / Self Agent ID)
   * `timestamp` (`uint64`)
4. **Independent Verification (Anyone, Anytime):** Any user, auditor, or downstream agent can take the original text, hash it locally, and query our Celo smart contract (or view our Proof Page / Celoscan) to confirm that the exact claim was verified by Alle-AI's multi-model engine at that exact timestamp, backed by an ERC-8004 and Self Protocol human-verified agent identity.

---

## 2. How Prezenti Grant Payouts & Milestones Work

* **Why we deploy to Celo Mainnet *before* applying:** The Prezenti Frontier Pool requires applicants to already have a working deployment on Celo Mainnet, ERC-8004 registration, Self Agent ID integration, and real verifiable onchain transactions at the time of application.
* **How the 20% / 80% payment split works:**
  * **20% Upfront:** Paid in `USDm` (Mento USD stablecoin on Celo) right after your application is approved, KYC is completed, and the grant contract is signed.
  * **80% on Milestones:** Paid once you complete the agreed post-signing milestones (up to 4 months allowed, though you can finish and claim much sooner). Because our core contract, identity, and verification service will already be live at application time, our grant milestones focus on **ecosystem expansion and usage** (publishing SDKs/MCP packages, x402 stablecoin micropayments, and hitting verifiable onchain attestation targets), allowing you to complete the milestones and unlock the 80% rapidly.

---

## 3. Glossary of Terms (Defined Once in Plain English)

| Term | Plain-English Meaning |
| :--- | :--- |
| **Celo Mainnet (`42220`)** | The live Celo production blockchain (an Ethereum Layer-2 network optimized for fast, sub-cent mobile and stablecoin transactions). Every network has a unique number called a **Chain ID**; Celo Mainnet is `42220`. |
| **Celo Sepolia (`11142220`)** | Celo's current test network where developers rehearse deployments using free test tokens before touching real money on Mainnet. (Replaces the retired Alfajores testnet). |
| **RPC (Remote Procedure Call)** | The HTTPS URL our server calls to read data from or send transactions to the Celo network (`https://forno.celo.org`). |
| **Smart Contract (`VerificationRegistry`)** | A small, immutable computer program deployed onto Celo. Once deployed, its rules cannot be secretly changed: only our authorized Alle-AI agent wallet can write verification receipts, and anyone in the world can read them for free. |
| **Hash (`bytes32` / `keccak256`)** | A deterministic 64-character hexadecimal fingerprint of any piece of data. Even a one-letter change in a claim produces a completely different hash. You can prove a document matches a hash, but nobody can reverse a hash back into the secret document. |
| **Basis Points (`agreementBps`)** | Hundredths of a percent (`100 bps = 1%`, `10000 bps = 100%`). Smart contracts do not use decimal floats like `87.5%`, so storing `8750` lets us represent `87.50%` agreement with exact integer math. |
| **ERC-8004** | The Ethereum/Celo open standard for **AI Agent Trust Infrastructure**. It has three onchain registries: **Identity** (each agent gets an NFT pointing to its `agent.json` manifest of endpoints), **Reputation** (ratings from callers), and **Validation** (third-party verification hooks). |
| **Self Agent ID (`@selfxyz/agent-sdk`)** | A Celo protocol built on top of ERC-8004 that links an AI agent's cryptographic key to a **Zero-Knowledge (ZK) Proof-of-Human**. When you scan your passport's NFC chip with the Self app, your phone generates a mathematical proof that a real, unique adult human backs the agent—without ever putting your name or passport number onchain. |
| **Soulbound NFT (`SAID`)** | An onchain identity token minted to our agent by Self Agent ID that cannot be transferred or sold ("bound" permanently to the identity). |
| **Deployer Wallet vs. Agent Wallet** | We use two separate wallets for security: the **Deployer Wallet** (owner/admin that deploys the contract and can rotate the attester key if ever needed) and the **Agent Wallet** (the operational hot wallet that signs daily verification receipts). |
| **USDm** | Mento Dollar (formerly cUSD), the primary US-dollar stablecoin native to the Celo ecosystem, and the currency Prezenti uses to pay grants. |
