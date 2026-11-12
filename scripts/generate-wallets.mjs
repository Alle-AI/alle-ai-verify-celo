#!/usr/bin/env node
/**
 * Generate Isolated Project Wallets (Deployer + Agent)
 * Enforces Hard Safety Rule #1:
 * - Generates two brand-new cryptographically random secp256k1 private keys using node:crypto
 *   and derives their Ethereum/Celo addresses using viem.
 * - Writes private keys ONLY to local `.env` (which is gitignored).
 * - NEVER prints or logs private keys or seed phrases to stdout/stderr.
 * - Prints ONLY the public addresses so the user can fund them.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { privateKeyToAccount } from "viem/accounts";

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env");
const ENV_EXAMPLE_PATH = path.join(ROOT, ".env.example");

function generateKeypair() {
  const privHex = `0x${crypto.randomBytes(32).toString("hex")}`;
  const account = privateKeyToAccount(privHex);
  return { privateKey: privHex, address: account.address };
}

function upsertEnvVar(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  }
  return `${content.trimEnd()}\n${key}=${value}\n`;
}

function getEnvVar(content, key) {
  const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match ? match[1].trim() : "";
}

let envContent = "";
if (fs.existsSync(ENV_PATH)) {
  envContent = fs.readFileSync(ENV_PATH, "utf8");
} else if (fs.existsSync(ENV_EXAMPLE_PATH)) {
  envContent = fs.readFileSync(ENV_EXAMPLE_PATH, "utf8");
}

let deployerAddress = getEnvVar(envContent, "DEPLOYER_ADDRESS");
let agentAddress = getEnvVar(envContent, "AGENT_ADDRESS");
const hasDeployerKey = /^0x[0-9a-fA-F]{64}$/.test(getEnvVar(envContent, "DEPLOYER_PRIVATE_KEY"));
const hasAgentKey = /^0x[0-9a-fA-F]{64}$/.test(getEnvVar(envContent, "AGENT_PRIVATE_KEY"));

if (!hasDeployerKey) {
  const deployer = generateKeypair();
  envContent = upsertEnvVar(envContent, "DEPLOYER_PRIVATE_KEY", deployer.privateKey);
  envContent = upsertEnvVar(envContent, "DEPLOYER_ADDRESS", deployer.address);
  deployerAddress = deployer.address;
} else {
  const account = privateKeyToAccount(getEnvVar(envContent, "DEPLOYER_PRIVATE_KEY"));
  deployerAddress = account.address;
  envContent = upsertEnvVar(envContent, "DEPLOYER_ADDRESS", deployerAddress);
}

if (!hasAgentKey) {
  const agent = generateKeypair();
  envContent = upsertEnvVar(envContent, "AGENT_PRIVATE_KEY", agent.privateKey);
  envContent = upsertEnvVar(envContent, "AGENT_ADDRESS", agent.address);
  agentAddress = agent.address;
} else {
  const account = privateKeyToAccount(getEnvVar(envContent, "AGENT_PRIVATE_KEY"));
  agentAddress = account.address;
  envContent = upsertEnvVar(envContent, "AGENT_ADDRESS", agentAddress);
}

fs.writeFileSync(ENV_PATH, envContent, { mode: 0o600 });

console.log("=== Isolated Project Wallets Ready (Private keys saved ONLY to gitignored .env) ===");
console.log(`Deployer Wallet Address (Public): ${deployerAddress}`);
console.log(`Agent Wallet Address    (Public): ${agentAddress}`);
