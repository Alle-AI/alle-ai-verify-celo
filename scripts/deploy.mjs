#!/usr/bin/env node
/**
 * Deploy & Auto-Verify `VerificationRegistry` on Celo Sepolia or Celo Mainnet (`scripts/deploy.mjs`)
 *
 * Features:
 * 1. Deploys `VerificationRegistry` from the isolated Deployer Wallet (`DEPLOYER_PRIVATE_KEY`),
 *    setting `initialOwner = DEPLOYER_ADDRESS` and `initialAttester = AGENT_ADDRESS`.
 * 2. If the Agent Wallet has < 0.05 CELO on Sepolia and Deployer has >= 0.2 CELO,
 *    automatically tops up the Agent Wallet with 0.1 CELO so it can sign attestations immediately.
 * 3. Automatically submits Standard JSON Input to Blockscout & Sourcify so the contract source
 *    is publicly verified on the explorer.
 * 4. Saves the deployed contract address to `.env`.
 */

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
  encodeAbiParameters,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo, celoSepolia } from "viem/chains";

dotenv.config();

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env");
const ARTIFACT_PATH = path.join(ROOT, "artifacts", "VerificationRegistry.json");
const STD_INPUT_PATH = path.join(ROOT, "artifacts", "VerificationRegistry.standard-input.json");

const args = process.argv.slice(2);
const networkIdx = args.indexOf("--network");
const networkName = networkIdx !== -1 ? args[networkIdx + 1] : "sepolia";

if (!["sepolia", "mainnet"].includes(networkName)) {
  console.error(`Invalid --network "${networkName}". Use "sepolia" or "mainnet".`);
  process.exit(1);
}

if (networkName === "mainnet" && !args.includes("--yes-i-approve-mainnet")) {
  console.error(
    "[SAFETY GATE] Refusing to broadcast to Celo Mainnet without explicit --yes-i-approve-mainnet flag."
  );
  process.exit(1);
}

const isMainnet = networkName === "mainnet";
const chain = isMainnet ? celo : celoSepolia;
const rpcUrl = isMainnet
  ? process.env.CELO_MAINNET_RPC_URL || "https://forno.celo.org"
  : process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
const blockscoutApi = isMainnet
  ? "https://celo.blockscout.com/api"
  : "https://celo-sepolia.blockscout.com/api";

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

async function verifyOnExplorer(contractAddress, artifact, stdInputStr, constructorArgsHex) {
  console.log(`\nSubmitting source verification to Blockscout (${blockscoutApi})...`);
  try {
    const form = new FormData();
    form.append("module", "contract");
    form.append("action", "verifysourcecode");
    form.append("contractaddress", contractAddress);
    form.append("codeformat", "solidity-standard-json-input");
    form.append("contractname", `${artifact.sourceName}:${artifact.contractName}`);
    form.append("compilerversion", artifact.compilerVersion);
    form.append("sourceCode", stdInputStr);
    form.append("constructorArguements", constructorArgsHex.replace(/^0x/, ""));

    const res = await fetch(blockscoutApi, { method: "POST", body: form });
    const data = await res.json();
    console.log("Blockscout verification response:", JSON.stringify(data));
  } catch (err) {
    console.warn("Blockscout verification notice:", err.message);
  }

  console.log(`Submitting source verification to Sourcify (chainId=${chain.id})...`);
  try {
    const metadataStr = artifact.metadata;
    const stdInput = JSON.parse(stdInputStr);
    const files = {
      "metadata.json": metadataStr,
    };
    for (const [k, v] of Object.entries(stdInput.sources)) {
      files[k] = v.content;
    }
    const res = await fetch("https://sourcify.dev/server/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: contractAddress,
        chain: String(chain.id),
        files,
      }),
    });
    const text = await res.text();
    console.log(`Sourcify status ${res.status}:`, text.slice(0, 300));
  } catch (err) {
    console.warn("Sourcify verification notice:", err.message);
  }
}

async function main() {
  if (!fs.existsSync(ARTIFACT_PATH)) {
    console.error("Artifact missing. Run `npm run compile` first.");
    process.exit(1);
  }

  const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
  const agentAddress = process.env.AGENT_ADDRESS;
  if (!deployerKey || !agentAddress) {
    console.error("DEPLOYER_PRIVATE_KEY or AGENT_ADDRESS missing in .env.");
    process.exit(1);
  }

  const deployerAccount = privateKeyToAccount(deployerKey);
  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  const walletClient = createWalletClient({
    account: deployerAccount,
    chain,
    transport: http(rpcUrl),
  });

  const [deployerBal, agentBal] = await Promise.all([
    publicClient.getBalance({ address: deployerAccount.address }),
    publicClient.getBalance({ address: agentAddress }),
  ]);

  console.log(`=== Deploying VerificationRegistry to ${chain.name} (Chain ID: ${chain.id}) ===`);
  console.log(`Deployer Address : ${deployerAccount.address} (Balance: ${formatEther(deployerBal)} CELO)`);
  console.log(`Agent Address    : ${agentAddress} (Balance: ${formatEther(agentBal)} CELO)`);

  if (deployerBal === 0n) {
    console.error(
      `\n[BLOCKED] Deployer wallet ${deployerAccount.address} has 0 CELO on ${chain.name}. Please fund it first.`
    );
    process.exit(1);
  }

  // Auto-fund Agent wallet from Deployer wallet if Agent wallet is empty or low
  if (agentBal < parseEther("0.05") && deployerBal >= parseEther("0.2")) {
    const topUpAmount = parseEther("0.15");
    console.log(`\nTopping up Agent Wallet (${agentAddress}) with ${formatEther(topUpAmount)} CELO for gas...`);
    const topUpHash = await walletClient.sendTransaction({
      to: agentAddress,
      value: topUpAmount,
    });
    await publicClient.waitForTransactionReceipt({ hash: topUpHash });
    console.log(`Agent Wallet funded -> tx: ${topUpHash}`);
  }

  const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"));
  const stdInputStr = fs.readFileSync(STD_INPUT_PATH, "utf8");

  const initialAgentId = BigInt(
    (isMainnet ? process.env.MAINNET_ERC8004_AGENT_ID : process.env.SEPOLIA_ERC8004_AGENT_ID) || "0"
  );

  const constructorArgs = [deployerAccount.address, agentAddress, initialAgentId];
  console.log(`\nBroadcasting VerificationRegistry deployment transaction...`);
  const deployHash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: constructorArgs,
  });

  console.log(`Deployment tx hash: ${deployHash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: deployHash });
  const contractAddress = receipt.contractAddress;

  console.log(`VerificationRegistry deployed at: ${contractAddress} (Block: ${receipt.blockNumber})`);

  const envKey = isMainnet ? "MAINNET_VERIFICATION_REGISTRY" : "SEPOLIA_VERIFICATION_REGISTRY";
  upsertEnvVar(envKey, contractAddress);
  console.log(`Updated .env -> ${envKey}=${contractAddress}`);

  const constructorArgsHex = encodeAbiParameters(
    [
      { type: "address", name: "initialOwner" },
      { type: "address", name: "initialAttester" },
      { type: "uint256", name: "initialAgentId" },
    ],
    constructorArgs
  );

  await verifyOnExplorer(contractAddress, artifact, stdInputStr, constructorArgsHex);
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
