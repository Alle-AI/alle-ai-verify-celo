#!/usr/bin/env node
/**
 * Alle-AI Verify — HTTP Verification Service, Proof Dashboard & Agent Manifest Server (`src/server.mjs`)
 *
 * Endpoints:
 * - `POST /v1/verify`               : Evaluates a claim or agent/Alle-Quant journal across multiple AI models,
 *                                     computes consensus (`verdict`, `agreementBps`), and anchors the hash-only
 *                                     receipt on Celo (`VerificationRegistry`).
 * - `GET  /v1/receipts`             : Reads recent verification receipts directly from Celo (`VerificationRegistry`)
 *                                     with Celoscan / Blockscout links.
 * - `GET  /v1/verify/:claimHash`    : Looks up the latest onchain verification receipt for a specific `bytes32` claimHash.
 * - `POST /v1/hash`                 : Utility endpoint to compute the canonical `keccak256` hash of any claim locally.
 * - `GET  /agent.json`              : Serves the ERC-8004 agent registration manifest.
 * - `GET  /.well-known/agent-card.json` : Serves the A2A machine-readable agent discovery card.
 * - `GET  /health`                  : Health & Celo registry status check.
 * - `GET  /`                        : Public read-only Proof Page Dashboard with interactive receipt verifier & Celoscan links.
 */

import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  concat,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  parseEventLogs,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo, celoSepolia } from "viem/chains";
import { toDataSuffix } from "@celo/attribution-tags";
import {
  evaluateClaimMultiModel,
  computeKeccak256Hash,
  VERDICT_LABELS,
} from "./verifier-engine.mjs";

dotenv.config();

export const CELO_ATTRIBUTION_CODE = process.env.CELO_ATTRIBUTION_CODE || "alle_ai_verify";
export const CELO_ATTRIBUTION_SUFFIX = toDataSuffix(CELO_ATTRIBUTION_CODE);

const ROOT = process.cwd();
const ARTIFACT_PATH = path.join(ROOT, "artifacts", "VerificationRegistry.json");
const AGENT_JSON_PATH = path.join(ROOT, "public", "agent.json");
const AGENT_CARD_PATH = path.join(ROOT, "public", ".well-known", "agent-card.json");

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "256kb" }));

  const artifact = fs.existsSync(ARTIFACT_PATH)
    ? JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"))
    : null;

  function getNetworkContext(requestedNetwork) {
    const net = (requestedNetwork || process.env.ACTIVE_NETWORK || "mainnet").toLowerCase();
    const isMainnet = net === "mainnet";
    const chain = isMainnet ? celo : celoSepolia;
    const rpcUrl = isMainnet
      ? process.env.CELO_MAINNET_RPC_URL || "https://forno.celo.org"
      : process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
    const registryAddress = isMainnet
      ? process.env.MAINNET_VERIFICATION_REGISTRY
      : process.env.SEPOLIA_VERIFICATION_REGISTRY;
    const explorerBase = isMainnet
      ? "https://celoscan.io"
      : "https://celo-sepolia.blockscout.com";
    const erc8004AgentId = BigInt(
      (isMainnet ? process.env.MAINNET_ERC8004_AGENT_ID : process.env.SEPOLIA_ERC8004_AGENT_ID) ||
        "0"
    );
    const selfAgentId =
      (isMainnet ? process.env.MAINNET_SELF_AGENT_ID : process.env.SEPOLIA_SELF_AGENT_ID) || null;

    const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
    return {
      network: isMainnet ? "mainnet" : "sepolia",
      isMainnet,
      chain,
      rpcUrl,
      registryAddress,
      explorerBase,
      erc8004AgentId,
      selfAgentId,
      publicClient,
    };
  }

  // 1. Machine-readable manifests (ERC-8004 + A2A Agent Card)
  app.get("/agent.json", (_req, res) => {
    res.json(JSON.parse(fs.readFileSync(AGENT_JSON_PATH, "utf8")));
  });

  app.get("/.well-known/agent-card.json", (_req, res) => {
    res.json(JSON.parse(fs.readFileSync(AGENT_CARD_PATH, "utf8")));
  });

  // 2. Service Health & Onchain Identity Metadata
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "Alle-AI Verify (Celo)",
      organization: "Alle-AI LTD",
      activeNetwork: process.env.ACTIVE_NETWORK || "sepolia",
      contracts: {
        mainnetVerificationRegistry: process.env.MAINNET_VERIFICATION_REGISTRY || null,
        sepoliaVerificationRegistry: process.env.SEPOLIA_VERIFICATION_REGISTRY || null,
        mainnetErc8004Registry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
        mainnetSelfAgentRegistry: "0xaC3DF9ABf80d0F5c020C06B04Cced27763355944",
      },
      agentIdentity: {
        agentAddress: process.env.AGENT_ADDRESS || null,
        mainnetErc8004AgentId: process.env.MAINNET_ERC8004_AGENT_ID || null,
        sepoliaErc8004AgentId: process.env.SEPOLIA_ERC8004_AGENT_ID || null,
        mainnetSelfAgentId: process.env.MAINNET_SELF_AGENT_ID || null,
        sepoliaSelfAgentId: process.env.SEPOLIA_SELF_AGENT_ID || null,
      },
      celopedia: {
        skillInstalled: true,
        erc8021AttributionCode: CELO_ATTRIBUTION_CODE,
        erc8021Suffix: CELO_ATTRIBUTION_SUFFIX,
      },
    });
  });

  // 3. Deterministic Claim Hashing Helper (Privacy-first: verify any claim matches an onchain claimHash)
  app.post("/v1/hash", (req, res) => {
    try {
      const { claim, context = {} } = req.body || {};
      if (!claim) {
        return res.status(400).json({ error: "Missing `claim` in request body." });
      }
      const canonicalClaimPayload =
        typeof claim === "string" ? { claim: claim.trim(), context } : { claim, context };
      const claimHash = computeKeccak256Hash(canonicalClaimPayload);
      return res.json({ claimHash, algorithm: "keccak256", privacyNote: "Hash computed locally; raw text is never stored onchain." });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 4. Primary Verification Endpoint: POST /v1/verify
  app.post("/v1/verify", async (req, res) => {
    try {
      const {
        claim,
        context = {},
        models = ["claude-sonnet-4-5", "gpt-5-1", "gemini-2-5-pro"],
        network,
        anchorOnchain = true,
      } = req.body || {};

      if (!claim) {
        return res.status(400).json({ error: "Missing `claim` field in request body." });
      }

      const evalResult = await evaluateClaimMultiModel({ claim, context, models });
      const ctx = getNetworkContext(network);

      let onchainReceipt = null;
      if (anchorOnchain && ctx.registryAddress && process.env.AGENT_PRIVATE_KEY && artifact) {
        const agentAccount = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY);
        const walletClient = createWalletClient({
          account: agentAccount,
          chain: ctx.chain,
          transport: http(ctx.rpcUrl),
        });

        const args = [
          evalResult.claimHash,
          evalResult.resultHash,
          evalResult.verdictCode,
          evalResult.agreementBps,
          evalResult.modelCount,
          ctx.erc8004AgentId,
        ];

        await ctx.publicClient.simulateContract({
          account: agentAccount,
          address: ctx.registryAddress,
          abi: artifact.abi,
          functionName: "recordVerification",
          args,
        });

        const rawCallData = encodeFunctionData({
          abi: artifact.abi,
          functionName: "recordVerification",
          args,
        });
        const taggedCallData = concat([rawCallData, CELO_ATTRIBUTION_SUFFIX]);

        const txHash = await walletClient.sendTransaction({
          to: ctx.registryAddress,
          data: taggedCallData,
        });
        const txReceipt = await ctx.publicClient.waitForTransactionReceipt({ hash: txHash });
        const [attestedLog] = parseEventLogs({
          abi: artifact.abi,
          eventName: "Attested",
          logs: txReceipt.logs,
        });

        onchainReceipt = {
          anchored: true,
          network: ctx.network,
          chainId: ctx.chain.id,
          registryAddress: ctx.registryAddress,
          attestationId: Number(attestedLog.args.attestationId),
          attesterAddress: agentAccount.address,
          attesterAgentId: Number(attestedLog.args.attesterAgentId),
          timestamp: Number(attestedLog.args.timestamp),
          blockNumber: Number(txReceipt.blockNumber),
          txHash,
          explorerUrl: `${ctx.explorerBase}/tx/${txHash}`,
          erc8021Attribution: {
            code: CELO_ATTRIBUTION_CODE,
            suffix: CELO_ATTRIBUTION_SUFFIX,
          },
        };
      } else {
        onchainReceipt = {
          anchored: false,
          reason: !anchorOnchain
            ? "anchorOnchain=false requested"
            : `Registry not yet configured for network=${ctx.network}`,
        };
      }

      return res.json({
        protocol: "alle-ai-verify-celo/v1",
        claimHash: evalResult.claimHash,
        resultHash: evalResult.resultHash,
        verdict: evalResult.verdict,
        verdictCode: evalResult.verdictCode,
        agreementBps: evalResult.agreementBps,
        agreementPct: `${(evalResult.agreementBps / 100).toFixed(2)}%`,
        modelCount: evalResult.modelCount,
        models: evalResult.models,
        onchain: onchainReceipt,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 5. Read Recent Receipts from Celo Onchain Registry: GET /v1/receipts
  app.get("/v1/receipts", async (req, res) => {
    try {
      const ctx = getNetworkContext(req.query.network);
      const limit = BigInt(Math.min(50, Math.max(1, Number(req.query.limit || 20))));

      const localReceiptsPath = path.join(ROOT, "public", `receipts-${ctx.network}.json`);
      const localTxMap = new Map();
      if (fs.existsSync(localReceiptsPath)) {
        const items = JSON.parse(fs.readFileSync(localReceiptsPath, "utf8"));
        for (const item of items) {
          localTxMap.set(Number(item.attestationId), item);
        }
      }

      if (!ctx.registryAddress || !artifact) {
        return res.json({
          network: ctx.network,
          chainId: ctx.chain.id,
          registryAddress: null,
          totalVerifications: 0,
          receipts: Array.from(localTxMap.values()),
        });
      }

      const [total, [ids, rawReceipts]] = await Promise.all([
        ctx.publicClient.readContract({
          address: ctx.registryAddress,
          abi: artifact.abi,
          functionName: "totalVerifications",
        }),
        ctx.publicClient.readContract({
          address: ctx.registryAddress,
          abi: artifact.abi,
          functionName: "getRecentVerifications",
          args: [limit],
        }),
      ]);

      const receipts = ids.map((idBig, idx) => {
        const r = rawReceipts[idx];
        const idNum = Number(idBig);
        const localMeta = localTxMap.get(idNum) || {};
        return {
          attestationId: idNum,
          label: localMeta.label || `Onchain Multi-Model Attestation #${idNum}`,
          claimHash: r.claimHash,
          resultHash: r.resultHash,
          verdict: VERDICT_LABELS[Number(r.verdict)] || "AGREE",
          verdictCode: Number(r.verdict),
          agreementBps: Number(r.agreementBps),
          agreementPct: `${(Number(r.agreementBps) / 100).toFixed(2)}%`,
          modelCount: Number(r.modelCount),
          attesterAgentId: Number(r.attesterAgentId),
          timestamp: Number(r.timestamp),
          isoTimestamp: new Date(Number(r.timestamp) * 1000).toISOString(),
          txHash: localMeta.txHash || null,
          explorerUrl: localMeta.txHash
            ? `${ctx.explorerBase}/tx/${localMeta.txHash}`
            : `${ctx.explorerBase}/address/${ctx.registryAddress}`,
        };
      });

      return res.json({
        network: ctx.network,
        chainId: ctx.chain.id,
        registryAddress: ctx.registryAddress,
        contractExplorerUrl: `${ctx.explorerBase}/address/${ctx.registryAddress}`,
        totalVerifications: Number(total),
        receipts,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 6. Read-only Public Proof Dashboard UI
  app.get("/", (_req, res) => {
    const htmlPath = path.join(ROOT, "public", "index.html");
    if (fs.existsSync(htmlPath)) {
      return res.sendFile(htmlPath);
    }
    return res.send("Alle-AI Verify on Celo is running.");
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  const port = Number(process.env.PORT || 3001);
  const app = createApp();
  app.listen(port, () => {
    console.log(`Alle-AI Verify service & Proof Dashboard listening on http://localhost:${port}`);
  });
}
