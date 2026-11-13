#!/usr/bin/env node
/**
 * Celopedia Upgrade Script (`scripts/celopedia-upgrade.mjs`)
 *
 * Applies key patterns from `celo-org/celopedia-skills`:
 * 1. ERC-8004 Content-Addressed `agentURI` (`data:application/json;base64,...`) on Sepolia Agent #932
 *    so 8004scan validators see zero mutability/schema warnings (`ai-agents.md` §Metadata Compliance).
 * 2. ERC-8021 Attribution Tags (`@celo/attribution-tags` -> `toDataSuffix("alle_ai_verify")`) appended
 *    to onchain Celo transactions (`attribution-tags.md` & `grants-funding.md` §Grant Matchmaking Guide).
 * 3. On-chain verification of the ERC-8021 tag via `verifyTx({ client, hash })`.
 */

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import {
  concat,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  parseAbi,
  parseEventLogs,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celoSepolia } from "viem/chains";
import { toDataSuffix, verifyTx } from "@celo/attribution-tags";
import { evaluateClaimMultiModel } from "../src/verifier-engine.mjs";

dotenv.config();

const ROOT = process.cwd();
const ATTRIBUTION_CODE = process.env.CELO_ATTRIBUTION_CODE || "alle_ai_verify";
const ATTRIBUTION_SUFFIX = toDataSuffix(ATTRIBUTION_CODE);

const SEPOLIA_RPC =
  process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
const SEPOLIA_ERC8004 = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
const SEPOLIA_REGISTRY = process.env.SEPOLIA_VERIFICATION_REGISTRY;
const AGENT_ID = BigInt(process.env.SEPOLIA_ERC8004_AGENT_ID || "932");

const ERC8004_ABI = parseAbi([
  "function setAgentURI(uint256 agentId, string newURI) external",
  "function tokenURI(uint256 tokenId) external view returns (string)",
]);

async function main() {
  const deployerAccount = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY);
  const agentAccount = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY);
  const publicClient = createPublicClient({
    chain: celoSepolia,
    transport: http(SEPOLIA_RPC, { retryCount: 5, timeout: 30000 }),
  });
  const deployerWallet = createWalletClient({
    account: deployerAccount,
    chain: celoSepolia,
    transport: http(SEPOLIA_RPC, { retryCount: 5, timeout: 30000 }),
  });
  const walletClient = createWalletClient({
    account: agentAccount,
    chain: celoSepolia,
    transport: http(SEPOLIA_RPC, { retryCount: 5, timeout: 30000 }),
  });

  console.log("=== Celopedia Compliance Upgrade (ERC-8004 Content-Addressed URI + ERC-8021 Attribution Tag) ===");
  console.log(`Attribution Code   : ${ATTRIBUTION_CODE}`);
  console.log(`ERC-8021 Suffix    : ${ATTRIBUTION_SUFFIX}`);

  // Top up agent wallet from deployer wallet if balance < 0.3 CELO
  const agentBal = await publicClient.getBalance({ address: agentAccount.address });
  if (agentBal < 300000000000000000n) {
    console.log("Topping up Agent wallet with 0.5 Sepolia CELO from Deployer wallet...");
    const topupHash = await deployerWallet.sendTransaction({
      to: agentAccount.address,
      value: 500000000000000000n,
    });
    await publicClient.waitForTransactionReceipt({ hash: topupHash });
    console.log(`  -> Top-up Tx      : ${topupHash}`);
  }

  // 1. Build content-addressed data:application/json;base64,... URI from public/agent.json
  const agentJsonRaw = fs.readFileSync(path.join(ROOT, "public", "agent.json"), "utf8");
  const base64Metadata = Buffer.from(agentJsonRaw, "utf8").toString("base64");
  const contentAddressedUri = `data:application/json;base64,${base64Metadata}`;

  const setUriCallData = encodeFunctionData({
    abi: ERC8004_ABI,
    functionName: "setAgentURI",
    args: [AGENT_ID, contentAddressedUri],
  });
  const taggedSetUriData = concat([setUriCallData, ATTRIBUTION_SUFFIX]);

  console.log(`\n[1/2] Updating ERC-8004 Agent #${AGENT_ID} URI to content-addressed data: URI (tagged with ERC-8021)...`);
  const setUriTxHash = await walletClient.sendTransaction({
    to: SEPOLIA_ERC8004,
    data: taggedSetUriData,
  });
  await publicClient.waitForTransactionReceipt({ hash: setUriTxHash });
  const setUriTagCheck = await verifyTx({ client: publicClient, hash: setUriTxHash });
  console.log(`  -> setAgentURI Tx : ${setUriTxHash}`);
  console.log(`  -> ERC-8021 verify: ${JSON.stringify(setUriTagCheck)}`);

  // 2. Record an ERC-8021-tagged Multi-Model Verification Attestation (#5) on VerificationRegistry
  console.log(`\n[2/2] Recording ERC-8021-tagged Multi-Model Attestation on VerificationRegistry (${SEPOLIA_REGISTRY})...`);
  const artifact = JSON.parse(
    fs.readFileSync(path.join(ROOT, "artifacts", "VerificationRegistry.json"), "utf8")
  );

  const evalResult = await evaluateClaimMultiModel({
    claim:
      "Celopedia Integration Check: Celo ERC-8021 attribution tags append a deterministic 0x8021...8021 suffix to calldata without altering EVM execution semantics, enabling ecosystem impact tracking.",
    context: {
      domain: "celo-agent-infrastructure",
      celopediaSkill: "celo-org/celopedia-skills",
      erc8021Code: ATTRIBUTION_CODE,
    },
    models: ["claude-sonnet-4-5", "gpt-5-1", "gemini-2-5-pro"],
  });

  const recordCallData = encodeFunctionData({
    abi: artifact.abi,
    functionName: "recordVerification",
    args: [
      evalResult.claimHash,
      evalResult.resultHash,
      evalResult.verdictCode,
      evalResult.agreementBps,
      evalResult.modelCount,
      AGENT_ID,
    ],
  });
  const taggedRecordData = concat([recordCallData, ATTRIBUTION_SUFFIX]);

  const recordTxHash = await walletClient.sendTransaction({
    to: SEPOLIA_REGISTRY,
    data: taggedRecordData,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: recordTxHash });
  const [attestedLog] = parseEventLogs({
    abi: artifact.abi,
    eventName: "Attested",
    logs: receipt.logs,
  });
  const recordTagCheck = await verifyTx({ client: publicClient, hash: recordTxHash });

  const attestationId = Number(attestedLog.args.attestationId);
  console.log(`  -> Attestation ID : #${attestationId}`);
  console.log(`  -> Record Tx Hash : ${recordTxHash}`);
  console.log(`  -> Block Number   : ${receipt.blockNumber}`);
  console.log(`  -> ERC-8021 verify: ${JSON.stringify(recordTagCheck)}`);

  // Update public/receipts-sepolia.json
  const receiptsPath = path.join(ROOT, "public", "receipts-sepolia.json");
  const receipts = fs.existsSync(receiptsPath)
    ? JSON.parse(fs.readFileSync(receiptsPath, "utf8"))
    : [];

  const filtered = receipts.filter((r) => Number(r.attestationId) !== attestationId);
  filtered.push({
    attestationId,
    label: "Celopedia ERC-8021 Tagged Attestation — Multi-Model Consensus",
    verdict: evalResult.verdict,
    verdictCode: evalResult.verdictCode,
    agreementBps: evalResult.agreementBps,
    modelCount: evalResult.modelCount,
    claimHash: evalResult.claimHash,
    resultHash: evalResult.resultHash,
    attesterAgentId: Number(AGENT_ID),
    timestamp: Number(attestedLog.args.timestamp),
    blockNumber: Number(receipt.blockNumber),
    txHash: recordTxHash,
    erc8021Attribution: recordTagCheck,
    explorerUrl: `https://celo-sepolia.blockscout.com/tx/${recordTxHash}`,
  });

  fs.writeFileSync(receiptsPath, JSON.stringify(filtered, null, 2) + "\n");
  console.log("Updated public/receipts-sepolia.json with ERC-8021-tagged attestation.");
}

main().catch((err) => {
  console.error("Celopedia upgrade error:", err.message);
  process.exit(1);
});
