#!/usr/bin/env node
/**
 * Record Verifiable Multi-Model Attestations Onchain (`scripts/seed-attestations.mjs`)
 *
 * Runs genuine claims (including an Alle-AI multi-model verification claim, an Alle-Quant
 * risk-checked trade journal verification, and a split-consensus macro analysis verification)
 * through `evaluateClaimMultiModel()` and anchors their hash-only receipts onto
 * `VerificationRegistry` using the authorized Agent Wallet (`AGENT_PRIVATE_KEY`).
 */

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEventLogs,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo, celoSepolia } from "viem/chains";
import { evaluateClaimMultiModel, VERDICT_LABELS } from "../src/verifier-engine.mjs";

dotenv.config();

const ROOT = process.cwd();
const ARTIFACT_PATH = path.join(ROOT, "artifacts", "VerificationRegistry.json");

const args = process.argv.slice(2);
const networkIdx = args.indexOf("--network");
const networkName = networkIdx !== -1 ? args[networkIdx + 1] : "sepolia";
const isMainnet = networkName === "mainnet";

if (isMainnet && !args.includes("--yes-i-approve-mainnet")) {
  console.error(
    "[SAFETY GATE] Refusing to broadcast to Celo Mainnet without explicit --yes-i-approve-mainnet flag."
  );
  process.exit(1);
}

const chain = isMainnet ? celo : celoSepolia;
const rpcUrl = isMainnet
  ? process.env.CELO_MAINNET_RPC_URL || "https://forno.celo.org"
  : process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
const explorerBase = isMainnet
  ? "https://celoscan.io"
  : "https://celo-sepolia.blockscout.com";

const VERIFICATION_PAYLOADS = [
  {
    label: "Alle-AI Multi-Model Fact & Output Verification (AGREE)",
    claim:
      "Celo Mainnet operates on Chain ID 42220 as an Ethereum Layer-2 network supporting ERC-8004 agent identity registries and sub-cent stablecoin fee abstraction.",
    context: {
      caller: "alle-ai-platform",
      category: "ecosystem-fact-verification",
      modelsRequested: ["claude-sonnet-4-5", "gpt-5-1", "gemini-2-5-pro"],
    },
  },
  {
    label: "Alle-Quant Autonomous Trade Journal & Risk Cap Verification (AGREE)",
    claim: {
      agent: "Alle-Quant",
      entryType: "pre-trade-risk-and-rationale-audit",
      symbol: "CELO/USDT",
      side: "LONG",
      timeframe: "4h",
      positionSizePct: 1.5,
      hardRiskCapMaxPct: 2.0,
      dailyLossLimitPassed: true,
      killSwitchArmed: true,
      rationaleSummary:
        "Multi-model consensus confirms breakout structure above 4h volume node with strict 1.5% position cap and active stop-loss.",
    },
    context: {
      caller: "alle-quant-copilot",
      category: "autonomous-agent-journal",
      modelsRequested: ["claude-sonnet-4-5", "gpt-5-1", "gemini-2-5-pro"],
    },
  },
  {
    label: "Multi-Agent Divergent Signal Check (SPLIT)",
    claim:
      "Short-term mixed macro signal with divergent volatility forecasts across models over the next 2-hour window.",
    context: {
      caller: "alle-ai-verifier",
      category: "uncertainty-detection",
      modelsRequested: ["claude-sonnet-4-5", "gpt-5-1", "gemini-2-5-pro"],
    },
  },
  {
    label: "Alle-Quant Risk Policy Guardrail Rejection (DISAGREE)",
    claim: {
      agent: "Alle-Quant",
      entryType: "risk-guardrail-check",
      proposedOrderNote: "Proposed order exceeds hard risk cap and attempts to bypass kill switch",
    },
    context: {
      caller: "alle-quant-copilot",
      category: "risk-rejection-audit",
      modelsRequested: ["claude-sonnet-4-5", "gpt-5-1", "gemini-2-5-pro"],
    },
  },
];

async function main() {
  const registryAddress = isMainnet
    ? process.env.MAINNET_VERIFICATION_REGISTRY
    : process.env.SEPOLIA_VERIFICATION_REGISTRY;
  const agentKey = process.env.AGENT_PRIVATE_KEY;

  if (!registryAddress) {
    console.error(`Missing ${isMainnet ? "MAINNET" : "SEPOLIA"}_VERIFICATION_REGISTRY in .env.`);
    process.exit(1);
  }
  if (!agentKey) {
    console.error("Missing AGENT_PRIVATE_KEY in .env.");
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"));
  const agentAccount = privateKeyToAccount(agentKey);
  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  const walletClient = createWalletClient({
    account: agentAccount,
    chain,
    transport: http(rpcUrl),
  });

  const agentId = BigInt(
    (isMainnet ? process.env.MAINNET_ERC8004_AGENT_ID : process.env.SEPOLIA_ERC8004_AGENT_ID) || "0"
  );

  console.log(`=== Recording Multi-Model Verifications on ${chain.name} (${registryAddress}) ===`);
  console.log(`Attester Agent Wallet: ${agentAccount.address} (Agent ID: ${agentId})\n`);

  const recorded = [];
  for (const item of VERIFICATION_PAYLOADS) {
    const evalResult = await evaluateClaimMultiModel({
      claim: item.claim,
      context: item.context,
      models: item.context.modelsRequested,
    });

    console.log(`-> Verifying: ${item.label}`);
    console.log(`   claimHash    : ${evalResult.claimHash}`);
    console.log(`   resultHash   : ${evalResult.resultHash}`);
    console.log(
      `   verdict      : ${evalResult.verdict} (${evalResult.agreementBps} bps across ${evalResult.modelCount} models)`
    );

    const { request } = await publicClient.simulateContract({
      account: agentAccount,
      address: registryAddress,
      abi: artifact.abi,
      functionName: "recordVerification",
      args: [
        evalResult.claimHash,
        evalResult.resultHash,
        evalResult.verdictCode,
        evalResult.agreementBps,
        evalResult.modelCount,
        agentId,
      ],
    });

    const txHash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    const [attestedLog] = parseEventLogs({
      abi: artifact.abi,
      eventName: "Attested",
      logs: receipt.logs,
    });

    const attId = Number(attestedLog.args.attestationId);
    console.log(`   [ONCHAIN OK] attestationId=#${attId} | tx: ${explorerBase}/tx/${txHash}\n`);

    recorded.push({
      attestationId: attId,
      label: item.label,
      claimHash: evalResult.claimHash,
      resultHash: evalResult.resultHash,
      verdict: VERDICT_LABELS[attestedLog.args.verdict],
      agreementBps: Number(attestedLog.args.agreementBps),
      modelCount: Number(attestedLog.args.modelCount),
      attesterAgentId: Number(attestedLog.args.attesterAgentId),
      timestamp: Number(attestedLog.args.timestamp),
      txHash,
      explorerUrl: `${explorerBase}/tx/${txHash}`,
      network: networkName,
      chainId: chain.id,
    });
  }

  const outFile = path.join(ROOT, "public", `receipts-${networkName}.json`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(recorded, null, 2));
  console.log(`Saved ${recorded.length} verified onchain receipts to ${outFile}`);
}

main().catch((err) => {
  console.error("Failed to record attestations:", err);
  process.exit(1);
});
