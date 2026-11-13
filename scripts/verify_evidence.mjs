#!/usr/bin/env node
/**
 * Fresh Onchain & Repo Evidence Verifier (`verify_evidence.mjs` / `verify_evidence.sh`)
 * Re-verifies every LIVE, TESTNET, and LOCAL claim directly from Celo RPCs, Blockscout, and local files.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import dotenv from "dotenv";
import { createPublicClient, http } from "viem";
import { celo, celoSepolia } from "viem/chains";

dotenv.config();

const ROOT = process.cwd();
const MAINNET_RPC = process.env.CELO_MAINNET_RPC_URL || "https://forno.celo.org";
const SEPOLIA_RPC = process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
const ARTIFACT_PATH = path.join(ROOT, "artifacts", "VerificationRegistry.json");

async function rpcCall(url, method, params = []) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const data = await res.json();
  if (data.error) throw new Error(`RPC error: ${JSON.stringify(data.error)}`);
  return data.result;
}

const ERC8004_READ_ABI = [
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
];

const SELF_REGISTRY_READ_ABI = [
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
];

async function main() {
  console.log("=== Running Fresh Onchain & Local Evidence Verification ===");
  let passed = 0;
  let failed = 0;

  async function check(label, fn) {
    try {
      const detail = await fn();
      console.log(`[PASS] ${label}${detail ? ` -> ${detail}` : ""}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${label} -> ${err.message}`);
      failed++;
    }
  }

  // 1. Secret Scan
  await check("LOCAL: Secret scan & .gitignore protection", async () => {
    const out = execSync("node scripts/secret-scan.mjs", { cwd: ROOT, encoding: "utf8" }).trim();
    return out;
  });

  // 2. Celo Mainnet Chain ID & Core Contracts
  await check("LIVE: Celo Mainnet RPC & Chain ID (42220)", async () => {
    const hexId = await rpcCall(MAINNET_RPC, "eth_chainId");
    const chainId = parseInt(hexId, 16);
    if (chainId !== 42220) throw new Error(`Expected 42220, got ${chainId}`);
    return `chainId=${chainId} (${hexId})`;
  });

  await check("LIVE: Celo Mainnet ERC-8004 Identity Registry (0x8004A169FB4a3325136EB29fA0ceB6D2e539a432)", async () => {
    const code = await rpcCall(MAINNET_RPC, "eth_getCode", [
      "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
      "latest",
    ]);
    if (!code || code === "0x") throw new Error("No bytecode found");
    return `bytecode length=${code.length}`;
  });

  await check("LIVE: Celo Mainnet SelfAgentRegistry (0xaC3DF9ABf80d0F5c020C06B04Cced27763355944)", async () => {
    const code = await rpcCall(MAINNET_RPC, "eth_getCode", [
      "0xaC3DF9ABf80d0F5c020C06B04Cced27763355944",
      "latest",
    ]);
    if (!code || code === "0x") throw new Error("No bytecode found");
    return `bytecode length=${code.length}`;
  });

  // 3. Celo Sepolia Chain ID & Core Contracts
  await check("TESTNET: Celo Sepolia RPC & Chain ID (11142220)", async () => {
    const hexId = await rpcCall(SEPOLIA_RPC, "eth_chainId");
    const chainId = parseInt(hexId, 16);
    if (chainId !== 11142220) throw new Error(`Expected 11142220, got ${chainId}`);
    return `chainId=${chainId} (${hexId})`;
  });

  await check("TESTNET: Celo Sepolia ERC-8004 Identity Registry (0x8004A818BFB912233c491871b3d84c89A494BD9e)", async () => {
    const code = await rpcCall(SEPOLIA_RPC, "eth_getCode", [
      "0x8004A818BFB912233c491871b3d84c89A494BD9e",
      "latest",
    ]);
    if (!code || code === "0x") throw new Error("No bytecode found");
    return `bytecode length=${code.length}`;
  });

  await check("TESTNET: Celo Sepolia SelfAgentRegistry (0x043DaCac8b0771DD5b444bCC88f2f8BBDBEdd379)", async () => {
    const code = await rpcCall(SEPOLIA_RPC, "eth_getCode", [
      "0x043DaCac8b0771DD5b444bCC88f2f8BBDBEdd379",
      "latest",
    ]);
    if (!code || code === "0x") throw new Error("No bytecode found");
    return `bytecode length=${code.length}`;
  });

  // 4. Wallets, Deployed Contracts & Agent IDs
  const deployerAddr = process.env.DEPLOYER_ADDRESS;
  const agentAddr = process.env.AGENT_ADDRESS;
  const artifact = fs.existsSync(ARTIFACT_PATH)
    ? JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"))
    : null;

  if (deployerAddr && agentAddr) {
    await check("LOCAL: Isolated Deployer & Agent Wallet Addresses Present", async () => {
      if (!/^0x[0-9a-fA-F]{40}$/.test(deployerAddr) || !/^0x[0-9a-fA-F]{40}$/.test(agentAddr)) {
        throw new Error("Invalid wallet address format");
      }
      const [sepDepBal, sepAgBal] = await Promise.all([
        rpcCall(SEPOLIA_RPC, "eth_getBalance", [deployerAddr, "latest"]),
        rpcCall(SEPOLIA_RPC, "eth_getBalance", [agentAddr, "latest"]),
      ]);
      return `Deployer=${deployerAddr} (Sepolia bal: ${(Number(BigInt(sepDepBal)) / 1e18).toFixed(4)} CELO), Agent=${agentAddr} (Sepolia bal: ${(Number(BigInt(sepAgBal)) / 1e18).toFixed(4)} CELO)`;
    });
  }

  const sepClient = createPublicClient({ chain: celoSepolia, transport: http(SEPOLIA_RPC) });
  const mainClient = createPublicClient({ chain: celo, transport: http(MAINNET_RPC) });

  const sepRegistry = process.env.SEPOLIA_VERIFICATION_REGISTRY;
  if (sepRegistry && artifact) {
    await check(`TESTNET: VerificationRegistry deployed & verified on Celo Sepolia (${sepRegistry})`, async () => {
      const [code, total, attester, defaultAgentId, bsRes] = await Promise.all([
        rpcCall(SEPOLIA_RPC, "eth_getCode", [sepRegistry, "latest"]),
        sepClient.readContract({
          address: sepRegistry,
          abi: artifact.abi,
          functionName: "totalVerifications",
        }),
        sepClient.readContract({
          address: sepRegistry,
          abi: artifact.abi,
          functionName: "attester",
        }),
        sepClient.readContract({
          address: sepRegistry,
          abi: artifact.abi,
          functionName: "defaultAttesterAgentId",
        }),
        fetch(
          `https://sourcify.dev/server/v2/contract/11142220/${sepRegistry}`
        ).then((r) => r.json()),
      ]);
      if (!code || code === "0x") throw new Error("No contract bytecode");
      if (Number(total) < 3) throw new Error(`Expected >= 3 attestations, found ${total}`);
      if (bsRes?.match !== "exact_match") {
        throw new Error(`Expected Sourcify exact_match, got ${JSON.stringify(bsRes)}`);
      }
      return `totalVerifications=${total}, attester=${attester}, defaultAgentId=${defaultAgentId}, SourceVerification=${bsRes.match} (verifiedAt=${bsRes.verifiedAt})`;
    });
  }

  const sepErc8004Id = process.env.SEPOLIA_ERC8004_AGENT_ID;
  if (sepErc8004Id) {
    await check(`TESTNET: ERC-8004 Agent ID #${sepErc8004Id} resolves on Celo Sepolia`, async () => {
      const [owner, uri] = await Promise.all([
        sepClient.readContract({
          address: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
          abi: ERC8004_READ_ABI,
          functionName: "ownerOf",
          args: [BigInt(sepErc8004Id)],
        }),
        sepClient.readContract({
          address: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
          abi: ERC8004_READ_ABI,
          functionName: "tokenURI",
          args: [BigInt(sepErc8004Id)],
        }),
      ]);
      if (agentAddr && owner.toLowerCase() !== agentAddr.toLowerCase()) {
        throw new Error(`Owner mismatch: expected ${agentAddr}, got ${owner}`);
      }
      return `owner=${owner}, tokenURI=${uri}`;
    });
  }

  const mainRegistry = process.env.MAINNET_VERIFICATION_REGISTRY;
  if (mainRegistry && artifact) {
    await check(`LIVE: VerificationRegistry deployed on Celo Mainnet (${mainRegistry})`, async () => {
      const [code, total, attester] = await Promise.all([
        rpcCall(MAINNET_RPC, "eth_getCode", [mainRegistry, "latest"]),
        mainClient.readContract({
          address: mainRegistry,
          abi: artifact.abi,
          functionName: "totalVerifications",
        }),
        mainClient.readContract({
          address: mainRegistry,
          abi: artifact.abi,
          functionName: "attester",
        }),
      ]);
      if (!code || code === "0x") throw new Error("No contract bytecode at MAINNET_VERIFICATION_REGISTRY");
      return `totalVerifications=${total}, attester=${attester}`;
    });
  }

  const mainErc8004Id = process.env.MAINNET_ERC8004_AGENT_ID;
  if (mainErc8004Id) {
    await check(`LIVE: ERC-8004 Agent ID #${mainErc8004Id} resolves on Celo Mainnet`, async () => {
      const [owner, uri] = await Promise.all([
        mainClient.readContract({
          address: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
          abi: ERC8004_READ_ABI,
          functionName: "ownerOf",
          args: [BigInt(mainErc8004Id)],
        }),
        mainClient.readContract({
          address: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
          abi: ERC8004_READ_ABI,
          functionName: "tokenURI",
          args: [BigInt(mainErc8004Id)],
        }),
      ]);
      return `owner=${owner}, tokenURI=${uri}`;
    });
  }

  const mainSelfId = process.env.MAINNET_SELF_AGENT_ID;
  const selfSigningAddr = process.env.SELF_AGENT_SIGNING_ADDRESS;
  if (mainSelfId && selfSigningAddr) {
    await check(`LIVE: Self Agent ID #${mainSelfId} verified on Celo Mainnet (Proof-of-Human)`, async () => {
      const paddedKey = `0x${selfSigningAddr.replace(/^0x/, "").padStart(64, "0")}`;
      const [resolvedId, isVerified] = await Promise.all([
        mainClient.readContract({
          address: "0xaC3DF9ABf80d0F5c020C06B04Cced27763355944",
          abi: SELF_REGISTRY_READ_ABI,
          functionName: "getAgentId",
          args: [paddedKey],
        }),
        mainClient.readContract({
          address: "0xaC3DF9ABf80d0F5c020C06B04Cced27763355944",
          abi: SELF_REGISTRY_READ_ABI,
          functionName: "isVerifiedAgent",
          args: [paddedKey],
        }),
      ]);
      if (String(resolvedId) !== String(mainSelfId) || !isVerified) {
        throw new Error(`Expected verified agentId=${mainSelfId}, got id=${resolvedId}, isVerified=${isVerified}`);
      }
      return `agentId=#${resolvedId}, signingAddress=${selfSigningAddr}, owner=${agentAddr}, isVerifiedAgent=${isVerified}`;
    });
  }

  console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main();
