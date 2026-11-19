# Prezenti Frontier Pool — Application Answers (`APPLICATION_ANSWERS.md`)

Copy and paste each answer directly into the corresponding field at **[https://frontier.prezenti.xyz/](https://frontier.prezenti.xyz/)**.  
Every figure, contract address, agent ID, and transaction link below has been verified against `EVIDENCE.md`.

---

## 1. Basic Project & Identity Fields

* **Product name:**  
  `Alle-AI Verify`

* **Team name:**  
  `Alle-AI LTD`

* **Website:**  
  `https://alle-ai.com`

* **X Handle:**  
  `https://x.com/alle_ai`

* **KarmaGAP profile:**  
  `https://gap.karmahq.xyz` *(Note: Create your free project entry at gap.karmahq.xyz and paste the direct project URL here when submitting)*

* **Github:**  
  `https://github.com/Alle-AI/alle-ai-verify-celo`

* **ERC-8004 registration:**  
  `Celo Mainnet (Chain ID 42220, Self ERC-8004 Registry 0xaC3DF9ABf80d0F5c020C06B04Cced27763355944): Agent ID #202 — https://agent-api.self.xyz/api/cards/42220/202 (Tx: https://celoscan.io/tx/0x2ec593a6fecef15ecfedf9f85a8dea6c7c21ba9f9cbfa7a981e24407469a8ca9) | Celo Sepolia Canonical ERC-8004 Registry (0x8004A818BFB912233c491871b3d84c89A494BD9e): Agent ID #932 with content-addressed data: URI (Registration Tx: https://celo-sepolia.blockscout.com/tx/0x84c025e2c870d06d066c249d86679f3ed48142f6c4074ce07a3174ebf29006fb | URI Tx: https://celo-sepolia.blockscout.com/tx/0x99bdec72223b5fe099c2c76ff870eb25e3de03c4b0b879a1f47b1fd40c15dfbc)`

* **Is your project fully open source:**  
  `Yes` *(MIT License in the repository)*

* **Deployed on Celo mainnet:**  
  `On Celo mainnet`

* **Self Agent ID:**  
  `Yes — Registered and verified on Celo Mainnet (Chain ID 42220) as Self Agent ID #202 at 0xaC3DF9ABf80d0F5c020C06B04Cced27763355944, owned by our verifier agent wallet 0x0339DCD1Af5c464Ff25195f015Ee0DCA161eB74A (Mint Tx: https://celoscan.io/tx/0x2ec593a6fecef15ecfedf9f85a8dea6c7c21ba9f9cbfa7a981e24407469a8ca9 | NFT: https://celoscan.io/nft/0xaC3DF9ABf80d0F5c020C06B04Cced27763355944/202)`

---

## 2. Long-Form Application Answers (Founder Voice, Prose Only)

### Describe your project
Alle-AI Verify is an open multi-model verification and consensus attestation layer for AI agents and applications on Celo. Since founding Alle-AI LTD in March 2023, our core product has been running multiple leading AI models side by side—across Claude, GPT, and Gemini—so users and developers can cross-check outputs rather than trusting a single model blindly. As autonomous agents begin executing financial decisions, API calls, and workflows on Celo, they face the exact same trust problem: a single model can hallucinate or misread a constraint, and an offchain log can be quietly edited after the fact.

With Alle-AI Verify, any agent or application sends a claim, output, or decision rationale to our `/v1/verify` endpoint. Our service evaluates the payload across multiple independent frontier models, measures how strongly they agree in basis points from 0 to 10,000, and assigns a clear consensus verdict (`AGREE`, `SPLIT`, or `DISAGREE`). To protect user and agent privacy, we never write raw prompts, proprietary strategies, or model outputs to the blockchain. Instead, our human-verified Celo agent computes deterministic `keccak256` hashes of the canonical claim (`claimHash`) and the multi-model consensus bundle (`resultHash`) and anchors that receipt into our `VerificationRegistry` smart contract on Celo. Anyone—an auditing agent, a protocol, or an end user—can hash the original payload locally and verify on Celo that the exact claim was cross-checked by multiple models at that exact block timestamp, signed by our ERC-8004 and Self Agent ID (`#202`) verified agent.

---

### Infrastructure focus: explain why this is enabling infrastructure rather than a standalone end-user app
A standalone application serves human end users inside its own walled interface; Alle-AI Verify is a headless protocol primitive that other agents, trading bots, and Celo dApps call programmatically before or after executing high-stakes actions. We expose a standard HTTP verification endpoint (`POST /v1/verify`), a deterministic local hashing endpoint (`POST /v1/hash`), an ERC-8004 registration manifest (`/agent.json`), a machine-readable A2A agent card (`/.well-known/agent-card.json`), and a public onchain smart contract (`VerificationRegistry`) with free view methods (`getLatestVerificationByClaim`, `getVerification`, `getRecentVerifications`) that any smart contract or offchain agent on Celo can query without permission.

Any builder on Celo who needs output accountability—whether an autonomous DeFi agent checking that its risk parameters pass multi-model review, a research agent proving its summary was cross-checked across three independent LLMs, or a reputation indexer scoring agent reliability—can plug into Alle-AI Verify in a single request instead of building and paying for multiple vendor LLM integrations and custom attestation contracts themselves.

---

### Verifiable onchain activity
Our verifier agent identity is live and human-verified on Celo Mainnet (Chain ID 42220) as Self Agent ID `#202` on `SelfAgentRegistry` (`0xaC3DF9ABf80d0F5c020C06B04Cced27763355944`), minted in transaction `https://celoscan.io/tx/0x2ec593a6fecef15ecfedf9f85a8dea6c7c21ba9f9cbfa7a981e24407469a8ca9` (Block 82637919) and owned by our dedicated agent wallet `0x0339DCD1Af5c464Ff25195f015Ee0DCA161eB74A`, with its live ERC-8004 card served at `https://agent-api.self.xyz/api/cards/42220/202`.

Our `VerificationRegistry` smart contract is deployed and source-verified (`exact_match` on Sourcify, Blockscout, and Celoscan) on Celo Sepolia (Chain ID 11142220) at `0x31c2f9f8527e556d25ac6fd40d760c147c4a0e16` (`https://celo-sepolia.blockscout.com/address/0x31c2f9f8527e556d25ac6fd40d760c147c4a0e16?tab=contract`), paired with canonical ERC-8004 Identity Registry registration `#932` (`https://celo-sepolia.blockscout.com/tx/0x84c025e2c870d06d066c249d86679f3ed48142f6c4074ce07a3174ebf29006fb`), upgraded to a content-addressed `data:application/json;base64,...` URI (`https://celo-sepolia.blockscout.com/tx/0x99bdec72223b5fe099c2c76ff870eb25e3de03c4b0b879a1f47b1fd40c15dfbc`) per Celopedia's 8004scan compliance checklist, and linked onchain (`https://celo-sepolia.blockscout.com/tx/0x7668d08b17b66f0d863600acc5347f9a67fa5281d1565a0a268acd2139075b2c`). Every transaction our service submits is tagged with Celo's ERC-8021 attribution suffix (`@celo/attribution-tags`, code `alle_ai_verify`). We have anchored 6 verifiable hash-only multi-model attestations covering `AGREE`, `SPLIT`, and `DISAGREE` verdicts across general claims and Alle-Quant pre-trade risk journals: Attestation `#0` (`https://celo-sepolia.blockscout.com/tx/0x036915134faffe9793659c75252c8917722e79b979091a4975c40139b4d354a6`), Attestation `#1` (`https://celo-sepolia.blockscout.com/tx/0xc5d5aab1294481f883af91fb279a9fc35ecec112d0895f4ab72fae99f8d26a7b`), Attestation `#2` (`https://celo-sepolia.blockscout.com/tx/0x9041fc4c2d97c8d0c15227b29e85a0fa627885f1d336f9767949da513ea326f3`), Attestation `#3` (`https://celo-sepolia.blockscout.com/tx/0x9cae91b9df173ce18d266571dad1f486f6c565805e62b72a03a734081464919e`), live E2E API Attestation `#4` (`https://celo-sepolia.blockscout.com/tx/0xa15ad9e9f52879e35ba1458a2ae6e778df8d7fbcbd51ac8ffd2410ce43f1ce6b`), and ERC-8021-tagged Attestation `#5` (`https://celo-sepolia.blockscout.com/tx/0xfa124b60ea2e685b22a4ede37fa512a3aa7656d9299afcacc33a66daa402aa44`). Full Mainnet deployment of `VerificationRegistry` is scripted and ready via `npm run deploy:mainnet`.

---

### Please include a demo, if possible
`https://github.com/Alle-AI/alle-ai-verify-celo` *(Includes the interactive Proof Page Dashboard, `npm run verify:evidence` one-command verifier, and E2E verification script; paste your recorded Loom/YouTube video URL here as well)*

---

### How do you plan on getting agents to use your product, and what does the activation path look like for the first 10 to 100 users?
We do not have to wait for cold external adoption to generate our initial usage because we control both sides of the first activation loop. Agent #1 is our own autonomous AI trading copilot, Alle-Quant, which launched its closed beta of 200 users in May 2026, converted its first paying subscriber on October 29, 2026, and attracts roughly 300 weekly visitors. Every time an Alle-Quant agent instance runs in continuous Insomnia Mode and logs a trade decision rationale or pre-trade risk check, it routes the journal entry through Alle-AI Verify so the multi-model consensus score and `keccak256` receipt are anchored on Celo.

From there, the path from the first 10 to 100 agents and developer integrations comes from three concrete funnels we already operate. First, we are exposing Celo receipt anchoring directly inside the existing Alle-AI developer platform and API workbench, which already has over 35,000 registered users and 30,000+ API installs. By making `"anchor_on_celo": true` a simple toggle on multi-model comparison calls, existing Alle-AI API developers can anchor verification receipts on Celo with zero blockchain setup. Second, we are publishing lightweight open-source verification wrappers in JavaScript/TypeScript, Python, and PHP—following the exact playbook we used when I built and released the first open-source PHP library for Anthropic's Claude API (`github.com/Alle-AI/anthropic-api-php`). Third, by listing our verifier in Celo's ERC-8004 Identity Registry and Self Agent Registry with a standard A2A agent card and MCP tool definition, any autonomous Celo agent querying the registry for `"verification"` or `"validation"` can discover and call `/v1/verify` automatically.

---

### What is your distribution strategy, and what examples can you point to from this project or prior work where you have actually done it?
Our distribution strategy is developer-first open-source tooling combined with agent-to-agent protocol discovery (ERC-8004 + A2A + MCP), backed by a proven track record of shipping developer libraries that get real organic adoption. When Anthropic first released the Claude API, there was no official PHP SDK; I built and open-sourced the very first PHP library for Claude (`github.com/Alle-AI/anthropic-api-php`), which became a go-to integration path for PHP developers building with Claude and helped drive over 30,000+ API library installs and 35,000+ users to Alle-AI without paid enterprise sales. We also proved we can distribute institutional software on the ground in Ghana, rolling out platform-wide deployments at Spiritan University, reaching hundreds of Ghanaian schools through COPSIG via Alle-SMP, and delivering an appraisal system for the Ghana TVET Service.

For agent-to-agent propagation on Celo specifically, agents cannot adopt a tool they cannot parse programmatically. That is why we built machine-readable discovery into the core of Alle-AI Verify from day one: our service publishes both an ERC-8004 registration manifest (`/agent.json`) and an A2A agent card (`/.well-known/agent-card.json`), and is registered on Celo Mainnet under Self Agent ID `#202` (`https://agent-api.self.xyz/api/cards/42220/202`). When one agent anchors a verification receipt on Celo and includes the `attestationId` and `claimHash` in its payload to a downstream agent, that second agent queries our `VerificationRegistry` contract on Celo to verify the receipt—discovering our `attesterAgentId` directly from the onchain `Attested` event and propagating usage organically across connected agents.

---

### Who have you worked with before in the Celo ecosystem?
`None of the above` *(Tick ONLY "None of the above" on the form)*

---

### Clear contribution to the ecosystem
Celo is rapidly becoming the home for mobile-first and stablecoin-native AI agents via ERC-8004, Self Agent ID, x402, and the Celo Agent Visa program, but identity alone only proves *who* an agent is—it does not prove whether an agent's output is trustworthy or whether its offchain reasoning log was altered after an incident. Alle-AI Verify fills that exact gap in Celo's agent stack by providing a live, open-source multi-model consensus and output attestation layer.

Every verification call routed through Alle-AI Verify produces a real, ERC-8021-attributed onchain transaction on Celo (`@celo/attribution-tags`, code `alle_ai_verify`), links directly to Celo's ERC-8004 and Self Agent ID standards, and gives Celo agent builders a plug-and-play way to verify high-stakes outputs across Claude, GPT, and Gemini without building bespoke multi-LLM consensus pipelines. As we enable stablecoin micropayments via Celo's hosted x402 facilitator (`USDC`, `USDT`, `USAT` via EIP-3009 and `cNGN` / Ripio `wFIAT` via Permit2, alongside direct EIP-2612 `permit` settlement for Mento `USDm`) and ERC-8004 Validation Registry hooks in our grant milestones, Alle-AI Verify will generate sustained daily verification transactions and stablecoin settlement volume on Celo.

---

### Technical credibility
Alle-AI LTD is a two-person technical founding team that has worked together continuously since March 2023 and ships production AI and financial systems end-to-end. I am Dickson Agyei (CEO and co-founder); I graduated First Class in BSc Petroleum Engineering from KNUST in Kumasi, Ghana, taught myself software engineering, built the first open-source PHP library for Anthropic's Claude API (`github.com/Alle-AI/anthropic-api-php`), architected Alle-AI's multi-model orchestration engine (35,000+ users, 30,000+ API installs, $9,000+ in live Stripe subscription revenue), and write most of the core backend and autonomous execution code for Alle-Quant. My co-founder Clinton is a full-stack engineer who leads our frontend interfaces and developer workbench.

Our technical approach for Alle-AI Verify is purposefully pragmatic, privacy-preserving, and aligned with Celo's official **Celopedia** knowledge skill (`celo-org/celopedia-skills`, installed directly in our repository under `.agents/skills/celopedia-skill` and `.claude/skills/celopedia-skill`). Rather than attempting expensive or slow onchain LLM inference, we keep multi-model execution offchain where frontier models (Claude, GPT, Gemini) can be queried in parallel in under two seconds, canonicalize the JSON input and consensus breakdown, and write only fixed-size `bytes32` `keccak256` hashes, basis-point agreement scores (`uint16`), and model counts (`uint8`) to a lean OpenZeppelin-based Solidity contract on Celo. Following Celopedia's ERC-8004 and ERC-8021 engineering specifications, our agent registration uses content-addressed `data:application/json;base64,...` metadata with the versioned `#registration-v1` `services` schema so `8004scan` validators pass with zero mutability warnings, and every verification transaction appends an ERC-8021 attribution suffix (`0x8021...8021`) so Celo's attribution indexers can track our onchain impact natively.

---

### Additional information you consider relevant
In July 2024, Alle-AI received a grant from the Internet Computer Protocol (via ICP Ghana / ICP.Hub Sahara, reported by the Business & Financial Times) to build a blockchain-based transparent AI-tracking prototype. Alle-AI Verify on Celo is the mature, EVM-native evolution of that vision, purpose-built around Celo's ERC-8004, ERC-8021, Self Protocol Agent ID (`#202`), and Celopedia agent standards—already satisfying the human-verification prerequisite for the Celo Agent Visa Work tier.

Recognition and backing for our team and execution include: Forbes Africa 30 Under 30 Class of 2026 (`forbesafrica.com/under-30/2026/dickson_Ayei`), NVIDIA Inception member, UNICEF Startup Lab (2024 cohort), Venturecake Accelerator (2025), winner of the Lablab.ai Build Your AI Startup hackathon with Alle-AI, and non-dilutive cloud credits across Google Cloud, AWS, and Microsoft Azure.

With a Frontier grant, our 4-month delivery milestones are concrete and independently verifiable on Celo: (1) deploy `VerificationRegistry` and canonical ERC-8004 registration on Celo Mainnet alongside our already-live Mainnet Self Agent ID `#202`; (2) ship open-source npm (`@alle-ai/verify-celo`) and Python SDKs plus a hosted MCP server and Celo x402 facilitator (`@x402/express`, `USDC`/`USDT`/`USAT`/`cNGN` + Mento `USDm`) pay-per-verification support; and (3) anchor at least 1,000 genuine ERC-8021-attributed multi-model verification receipts on Celo Mainnet across Alle-Quant and external Celo agents, qualifying Alle-AI Verify for the Celo Agent Visa Work tier.

---

## 3. Required Information for Grant Delivery

* **Grant Policies and onboarding: Do you agree to the policies?**  
  `Yes`

* **Name of lead applicant (for KYC):**  
  `Dickson Agyei`

* **Email of lead applicant:**  
  `dickson@alle-ai.com`

* **Country company is registered (for KYC & contract):**  
  `United Kingdom (Alle-AI LTD)`

* **Tech category:**  
  `AI`

* **Your logo:**  
  `public/logo.png` *(Official Alle-AI logo saved in `public/logo.png` and `public/logo-transparent.png`)*

* **Grant L2 Delivery Address:**  
  `0x2eAC86dc25204f110e84f4729759E7Bb142961CF`
