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
| `VerificationRegistry.sol` smart contract written & unit-tested (access control, events, hash-only privacy, attester rotation, edge cases) | **NOT BUILT** | — | — |
| `VerificationRegistry` deployed & source-verified on Celo Sepolia (`11142220`) with >= 3 test attestations | **NOT BUILT** | — | — |
| Alle-AI Verifier registered on Celo Sepolia via ERC-8004 & Self Agent ID (mock passport) | **NOT BUILT** | — | — |
| `POST /v1/verify` multi-model consensus service + agent/Alle-Quant verification hook working end-to-end on Celo Sepolia | **NOT BUILT** | — | — |
| `VerificationRegistry` deployed & source-verified on Celo Mainnet (`42220`) | **NOT BUILT** | — | — |
| Alle-AI Verifier registered on Celo Mainnet via ERC-8004 (`0x8004A169...`) | **NOT BUILT** | — | — |
| Alle-AI Verifier registered on Celo Mainnet via Self Agent ID (`0xaC3DF9AB...`) with human NFC passport proof | **NOT BUILT** | — | — |
| Genuine onchain verification transactions recorded on Celo Mainnet `VerificationRegistry` | **NOT BUILT** | — | — |
| Public read-only Proof Page + machine-readable Agent Card (`.well-known/agent-card.json` & ERC-8004 `agent.json`) live | **NOT BUILT** | — | — |
