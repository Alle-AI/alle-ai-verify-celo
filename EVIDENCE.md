# Evidence Ledger (`EVIDENCE.md`)

This ledger is the single source of truth for **Alle-AI Verify on Celo** (Prezenti Season 3 Frontier Pool application).

## Tier Definitions & Rules
* **LIVE**: On Celo Mainnet (`42220`) or live public infrastructure, with a Celoscan/Blockscout link or a deterministic command anyone can run to confirm.
* **TESTNET**: Verified working on Celo Sepolia (`11142220`) only, with explorer links and commands.
* **LOCAL**: Verified working on the development machine (tests pass, scripts run).
* **NOT BUILT**: Planned or in progress; zero unproven claims may be stated as fact in the grant application.

---

## Ledger

| Claim | Tier | Proof (link/hash/command) | Re-verified when |
| :--- | :--- | :--- | :--- |
| Celo Mainnet RPC (`42220`) & Canonical ERC-8004 Identity Registry (`0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`) exist onchain | **LIVE** | [Celoscan](https://celoscan.io/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432) / `node scripts/verify_evidence.mjs` | 2026-11-12T23:36Z |
| Celo Mainnet Self Agent Registry (`0xaC3DF9ABf80d0F5c020C06B04Cced27763355944`) exists onchain | **LIVE** | [Celoscan](https://celoscan.io/address/0xaC3DF9ABf80d0F5c020C06B04Cced27763355944) / `node scripts/verify_evidence.mjs` | 2026-11-12T23:36Z |
| Celo Sepolia RPC (`11142220`), ERC-8004 Identity Registry (`0x8004A818BFB912233c491871b3d84c89A494BD9e`), and Self Agent Registry (`0x043DaCac8b0771DD5b444bCC88f2f8BBDBEdd379`) exist onchain | **TESTNET** | [Sepolia Blockscout](https://celo-sepolia.blockscout.com/address/0x043DaCac8b0771DD5b444bCC88f2f8BBDBEdd379) / `node scripts/verify_evidence.mjs` | 2026-11-12T23:36Z |
| Repository structure, MIT License, `.gitignore`, and automated secret scanner (`scripts/secret-scan.mjs`) active | **LOCAL** | `npm run secret:scan` | 2026-11-12T23:36Z |
| Isolated Deployer (`0xeb2E09B10C4f1dcA08CDc58a39c182c932102134`) & Agent (`0x0339DCD1Af5c464Ff25195f015Ee0DCA161eB74A`) wallets generated locally (keys stored only in gitignored `.env`) | **LOCAL** | `npm run verify:evidence` | 2026-11-12T23:43Z |
| `VerificationRegistry.sol` smart contract written & unit-tested (access control, events, hash-only privacy, attester rotation, edge cases) + multi-model consensus engine (`7/7` tests passing) | **LOCAL** | `npm test` | 2026-11-13T00:34Z |
| `VerificationRegistry` deployed & source-verified on Celo Sepolia (`11142220`) at `0x31c2f9f8527e556d25ac6fd40d760c147c4a0e16` with 4 test attestations (`#0` AGREE, `#1` AGREE Alle-Quant, `#2` SPLIT, `#3` DISAGREE) | **TESTNET** | [Contract on Blockscout](https://celo-sepolia.blockscout.com/address/0x31c2f9f8527e556d25ac6fd40d760c147c4a0e16) / [Tx #0](https://celo-sepolia.blockscout.com/tx/0x036915134faffe9793659c75252c8917722e79b979091a4975c40139b4d354a6) / [Tx #1](https://celo-sepolia.blockscout.com/tx/0xc5d5aab1294481f883af91fb279a9fc35ecec112d0895f4ab72fae99f8d26a7b) / [Tx #2](https://celo-sepolia.blockscout.com/tx/0x9041fc4c2d97c8d0c15227b29e85a0fa627885f1d336f9767949da513ea326f3) / [Tx #3](https://celo-sepolia.blockscout.com/tx/0x9cae91b9df173ce18d266571dad1f486f6c565805e62b72a03a734081464919e) | 2026-11-13T01:45Z |
| Alle-AI Verifier registered on Celo Sepolia via ERC-8004 (`agentId = 932`) | **TESTNET** | [Registration Tx](https://celo-sepolia.blockscout.com/tx/0x84c025e2c870d06d066c249d86679f3ed48142f6c4074ce07a3174ebf29006fb) / `npm run verify:evidence` | 2026-11-13T01:45Z |
| Alle-AI Verifier registered on Celo Sepolia via Self Agent ID (mock passport) | **NOT BUILT** | — | — |
| `POST /v1/verify` multi-model consensus service + agent/Alle-Quant verification hook working end-to-end on Celo Sepolia (`attestationId = #4`) | **TESTNET** | [E2E Tx #4 on Blockscout](https://celo-sepolia.blockscout.com/tx/0xa15ad9e9f52879e35ba1458a2ae6e778df8d7fbcbd51ac8ffd2410ce43f1ce6b) / `node scripts/e2e-verify-call.mjs --network sepolia` | 2026-11-13T01:54Z |
| `VerificationRegistry` deployed & source-verified on Celo Mainnet (`42220`) | **NOT BUILT** | — | — |
| Alle-AI Verifier registered on Celo Mainnet via ERC-8004 (`0x8004A169...`) | **NOT BUILT** | — | — |
| Alle-AI Verifier registered on Celo Mainnet via Self Agent ID (`0xaC3DF9AB...`) with human NFC passport proof | **NOT BUILT** | — | — |
| Genuine onchain verification transactions recorded on Celo Mainnet `VerificationRegistry` | **NOT BUILT** | — | — |
| Public read-only Proof Page + machine-readable Agent Card (`.well-known/agent-card.json` & ERC-8004 `agent.json`) live | **NOT BUILT** | — | — |
