#!/usr/bin/env node
/**
 * Fresh Onchain & Repo Evidence Verifier (`verify_evidence.mjs` / `verify_evidence.sh`)
 * Re-verifies every LIVE, TESTNET, and LOCAL claim directly from Celo RPCs and local files.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const MAINNET_RPC = process.env.CELO_MAINNET_RPC_URL || "https://forno.celo.org";
const SEPOLIA_RPC = process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";

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

  // 4. Optional Checks for Deployed VerificationRegistry if configured in .env
  const envPath = path.join(ROOT, ".env");
  if (fs.existsSync(envPath)) {
    const envText = fs.readFileSync(envPath, "utf8");
    const getVar = (k) => {
      const m = envText.match(new RegExp(`^${k}=(.*)$`, "m"));
      return m ? m[1].trim() : "";
    };

    const deployerAddr = getVar("DEPLOYER_ADDRESS");
    const agentAddr = getVar("AGENT_ADDRESS");
    if (deployerAddr && agentAddr) {
      await check("LOCAL: Isolated Deployer & Agent Wallet Addresses Present", async () => {
        if (!/^0x[0-9a-fA-F]{40}$/.test(deployerAddr) || !/^0x[0-9a-fA-F]{40}$/.test(agentAddr)) {
          throw new Error("Invalid wallet address format");
        }
        if (deployerAddr.toLowerCase() === agentAddr.toLowerCase()) {
          throw new Error("Deployer and Agent wallets must be distinct");
        }
        const [sepDepBal, sepAgBal] = await Promise.all([
          rpcCall(SEPOLIA_RPC, "eth_getBalance", [deployerAddr, "latest"]),
          rpcCall(SEPOLIA_RPC, "eth_getBalance", [agentAddr, "latest"]),
        ]);
        return `Deployer=${deployerAddr} (Sepolia bal: ${(Number(BigInt(sepDepBal)) / 1e18).toFixed(4)} CELO), Agent=${agentAddr} (Sepolia bal: ${(Number(BigInt(sepAgBal)) / 1e18).toFixed(4)} CELO)`;
      });
    }

    const sepRegistry = getVar("SEPOLIA_VERIFICATION_REGISTRY");
    if (sepRegistry) {
      await check(`TESTNET: VerificationRegistry deployed on Celo Sepolia (${sepRegistry})`, async () => {
        const code = await rpcCall(SEPOLIA_RPC, "eth_getCode", [sepRegistry, "latest"]);
        if (!code || code === "0x") throw new Error("No contract bytecode at SEPOLIA_VERIFICATION_REGISTRY");
        return `bytecode length=${code.length}`;
      });
    }

    const mainRegistry = getVar("MAINNET_VERIFICATION_REGISTRY");
    if (mainRegistry) {
      await check(`LIVE: VerificationRegistry deployed on Celo Mainnet (${mainRegistry})`, async () => {
        const code = await rpcCall(MAINNET_RPC, "eth_getCode", [mainRegistry, "latest"]);
        if (!code || code === "0x") throw new Error("No contract bytecode at MAINNET_VERIFICATION_REGISTRY");
        return `bytecode length=${code.length}`;
      });
    }
  }

  console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main();
