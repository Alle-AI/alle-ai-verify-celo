#!/usr/bin/env node
/**
 * ERC-8004 Agent Registration Script (`scripts/register-erc8004.mjs`)
 *
 * Implements the official Celo ERC-8004 Identity Registry registration flow:
 * 1. Registers `agentURI` on Celo Sepolia (`0x8004A818BFB912233c491871b3d84c89A494BD9e`)
 *    or Celo Mainnet (`0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`) from the Agent Wallet
 *    (`AGENT_PRIVATE_KEY`), so the Agent Wallet owns the ERC-8004 identity NFT and is set as `agentWallet`.
 * 2. Parses the `Registered(uint256 indexed agentId, string agentURI, address indexed owner)` event
 *    from the transaction receipt.
 * 3. Updates `public/agent.json` with the newly minted `agentId` and CAIP-10 registry reference
 *    (`eip155:<chainId>:<registryAddress>`).
 * 4. If `VerificationRegistry` is already deployed on that network, updates `defaultAttesterAgentId`
 *    on `VerificationRegistry` via the Deployer (owner) wallet.
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

dotenv.config();

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env");
const AGENT_JSON_PATH = path.join(ROOT, "public", "agent.json");
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
const identityRegistry = isMainnet
  ? "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
  : "0x8004A818BFB912233c491871b3d84c89A494BD9e";
const explorerBase = isMainnet
  ? "https://celoscan.io"
  : "https://celo-sepolia.blockscout.com";

const ERC8004_ABI = [
  {
    type: "function",
    name: "register",
    stateMutability: "nonpayable",
    inputs: [{ name: "agentURI", type: "string" }],
    outputs: [{ name: "agentId", type: "uint256" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "event",
    name: "Registered",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "agentURI", type: "string" },
      { name: "owner", type: "address", indexed: true },
    ],
  },
];

function upsertEnvVar(key, value) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content = `${content.trimEnd()}\n${key}=${value}\n`;
  }
  fs.writeFileSync(ENV_PATH, content, { mode: 0o600 });
}

async function main() {
  const agentKey = process.env.AGENT_PRIVATE_KEY;
  const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!agentKey) {
    console.error("Missing AGENT_PRIVATE_KEY in .env.");
    process.exit(1);
  }

  const agentAccount = privateKeyToAccount(agentKey);
  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  const agentWalletClient = createWalletClient({
    account: agentAccount,
    chain,
    transport: http(rpcUrl),
  });

  const agentURI =
    process.env.ERC8004_AGENT_URI ||
    "https://raw.githubusercontent.com/Alle-AI/alle-ai-verify-celo/main/public/agent.json";

  console.log(`=== Registering Alle-AI Verify in ERC-8004 Identity Registry on ${chain.name} ===`);
  console.log(`Registry Address : ${identityRegistry}`);
  console.log(`Agent Owner      : ${agentAccount.address}`);
  console.log(`agentURI         : ${agentURI}\n`);

  const { request } = await publicClient.simulateContract({
    account: agentAccount,
    address: identityRegistry,
    abi: ERC8004_ABI,
    functionName: "register",
    args: [agentURI],
  });

  const txHash = await agentWalletClient.writeContract(request);
  console.log(`Registration tx broadcast: ${explorerBase}/tx/${txHash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  const [registeredEvent] = parseEventLogs({
    abi: ERC8004_ABI,
    eventName: "Registered",
    logs: receipt.logs,
  });

  const agentId = registeredEvent.args.agentId;
  console.log(`ERC-8004 Registered! agentId = ${agentId.toString()}`);

  const envKey = isMainnet ? "MAINNET_ERC8004_AGENT_ID" : "SEPOLIA_ERC8004_AGENT_ID";
  upsertEnvVar(envKey, agentId.toString());

  // Update public/agent.json registrations array
  const agentJson = JSON.parse(fs.readFileSync(AGENT_JSON_PATH, "utf8"));
  const registryCaip = `eip155:${chain.id}:${identityRegistry}`;
  const existingIdx = agentJson.registrations.findIndex((r) => r.agentRegistry === registryCaip);
  const entry = {
    agentId: Number(agentId),
    agentRegistry: registryCaip,
    txHash,
  };
  if (existingIdx !== -1) {
    agentJson.registrations[existingIdx] = entry;
  } else {
    agentJson.registrations.push(entry);
  }
  fs.writeFileSync(AGENT_JSON_PATH, JSON.stringify(agentJson, null, 2));
  console.log(`Updated public/agent.json with registration ${registryCaip} -> agentId #${agentId}`);

  // Also link defaultAttesterAgentId on VerificationRegistry if deployed
  const verRegistry = isMainnet
    ? process.env.MAINNET_VERIFICATION_REGISTRY
    : process.env.SEPOLIA_VERIFICATION_REGISTRY;
  if (verRegistry && deployerKey && fs.existsSync(ARTIFACT_PATH)) {
    const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"));
    const deployerAccount = privateKeyToAccount(deployerKey);
    const deployerClient = createWalletClient({
      account: deployerAccount,
      chain,
      transport: http(rpcUrl),
    });
    console.log(`\nLinking agentId #${agentId} to VerificationRegistry (${verRegistry})...`);
    const linkTx = await deployerClient.writeContract({
      address: verRegistry,
      abi: artifact.abi,
      functionName: "setDefaultAttesterAgentId",
      args: [agentId],
    });
    await publicClient.waitForTransactionReceipt({ hash: linkTx });
    console.log(`Linked defaultAttesterAgentId on VerificationRegistry -> tx: ${explorerBase}/tx/${linkTx}`);
  }
}

main().catch((err) => {
  console.error("ERC-8004 registration failed:", err);
  process.exit(1);
});
