#!/usr/bin/env node
/**
 * Save & Verify Celo Mainnet Self Agent ID (`scripts/save-self-agent-id.mjs`)
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import dotenv from "dotenv";
import { createPublicClient, http, pad } from "viem";
import { celo } from "viem/chains";

dotenv.config();

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env");
const SESSION_PATH = path.join(ROOT, ".self", "session-mainnet.json");
const SELF_REGISTRY = "0xaC3DF9ABf80d0F5c020C06B04Cced27763355944";

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

const SELF_ABI = [
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "getAgentId",
    stateMutability: "view",
    inputs: [{ name: "agentKey", type: "bytes32" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "isVerifiedAgent",
    stateMutability: "view",
    inputs: [{ name: "agentKey", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "isProofFresh",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "agentRegisteredAt",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "proofExpiresAt",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
];

async function main() {
  const statusOut = execSync(
    `npx --no-install self-agent register status --session "${SESSION_PATH}"`,
    { cwd: ROOT, encoding: "utf8" }
  );
  const statusJson = JSON.parse(statusOut);
  const agentId = String(statusJson.agentId || "202");
  const signingAddress = statusJson.agentAddress || "0x0Fa2A0B64Ea66Fe8153bAf1D88C3480aab55174D";

  // Export key silently into .env without ever printing privateKey
  try {
    const out = execSync(
      `npx --no-install self-agent register export --session "${SESSION_PATH}" --unsafe --print-private-key`,
      { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    );
    const parsed = JSON.parse(out);
    if (parsed.privateKey) {
      upsertEnvVar("SELF_AGENT_PRIVATE_KEY", parsed.privateKey);
    }
  } catch {
    // ignore if already exported
  }

  upsertEnvVar("MAINNET_SELF_AGENT_ID", agentId);
  upsertEnvVar("SELF_AGENT_SIGNING_ADDRESS", signingAddress);

  const client = createPublicClient({
    chain: celo,
    transport: http(process.env.CELO_MAINNET_RPC_URL || "https://forno.celo.org"),
  });

  const agentKeyBytes32 = pad(signingAddress, { size: 32 });
  const [owner, resolvedId, isVerified, isFresh, regBlock, expiresAt] = await Promise.all([
    client.readContract({
      address: SELF_REGISTRY,
      abi: SELF_ABI,
      functionName: "ownerOf",
      args: [BigInt(agentId)],
    }),
    client.readContract({
      address: SELF_REGISTRY,
      abi: SELF_ABI,
      functionName: "getAgentId",
      args: [agentKeyBytes32],
    }),
    client.readContract({
      address: SELF_REGISTRY,
      abi: SELF_ABI,
      functionName: "isVerifiedAgent",
      args: [agentKeyBytes32],
    }),
    client.readContract({
      address: SELF_REGISTRY,
      abi: SELF_ABI,
      functionName: "isProofFresh",
      args: [BigInt(agentId)],
    }),
    client.readContract({
      address: SELF_REGISTRY,
      abi: SELF_ABI,
      functionName: "agentRegisteredAt",
      args: [BigInt(agentId)],
    }),
    client.readContract({
      address: SELF_REGISTRY,
      abi: SELF_ABI,
      functionName: "proofExpiresAt",
      args: [BigInt(agentId)],
    }),
  ]);

  console.log("=== Celo Mainnet Self Agent ID Verified Onchain ===");
  console.log(`Registry Address    : ${SELF_REGISTRY}`);
  console.log(`Self Agent ID       : #${resolvedId}`);
  console.log(`NFT Owner (Wallet)  : ${owner}`);
  console.log(`Agent Signing Key   : ${signingAddress}`);
  console.log(`isVerifiedAgent     : ${isVerified}`);
  console.log(`isProofFresh        : ${isFresh}`);
  console.log(`Registered at Block : ${regBlock}`);
  console.log(`Proof Expires At    : ${new Date(Number(expiresAt) * 1000).toISOString()}`);

  const agentJsonPath = path.join(ROOT, "public", "agent.json");
  const agentJson = JSON.parse(fs.readFileSync(agentJsonPath, "utf8"));
  const selfCaip = `eip155:42220:${SELF_REGISTRY}`;
  const idx = agentJson.registrations.findIndex((r) => r.agentRegistry === selfCaip);
  const selfEntry = {
    agentId: Number(resolvedId),
    agentRegistry: selfCaip,
    agentSigningAddress: signingAddress,
    ownerWallet: owner,
    registeredAtBlock: Number(regBlock),
  };
  if (idx !== -1) agentJson.registrations[idx] = selfEntry;
  else agentJson.registrations.push(selfEntry);
  fs.writeFileSync(agentJsonPath, JSON.stringify(agentJson, null, 2));
}

main().catch((err) => {
  console.error("Error verifying Self Agent ID:", err);
  process.exit(1);
});
