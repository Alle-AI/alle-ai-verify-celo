#!/usr/bin/env node
/**
 * Verify `VerificationRegistry` Source Code on Blockscout v2 & Sourcify v2 (`scripts/verify-contract.mjs`)
 */

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { encodeAbiParameters } from "viem";

dotenv.config();

const ROOT = process.cwd();
const ARTIFACT_PATH = path.join(ROOT, "artifacts", "VerificationRegistry.json");
const STD_INPUT_PATH = path.join(ROOT, "artifacts", "VerificationRegistry.standard-input.json");

const args = process.argv.slice(2);
const networkIdx = args.indexOf("--network");
const networkName = networkIdx !== -1 ? args[networkIdx + 1] : "sepolia";
const isMainnet = networkName === "mainnet";
const chainId = isMainnet ? 42220 : 11142220;

const contractAddress = isMainnet
  ? process.env.MAINNET_VERIFICATION_REGISTRY
  : process.env.SEPOLIA_VERIFICATION_REGISTRY;
const blockscoutBase = isMainnet
  ? "https://celo.blockscout.com"
  : "https://celo-sepolia.blockscout.com";

async function main() {
  if (!contractAddress) {
    console.error("Missing contract address in .env.");
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"));
  const stdInputStr = fs.readFileSync(STD_INPUT_PATH, "utf8");
  const stdInput = JSON.parse(stdInputStr);

  const constructorArgsHex = encodeAbiParameters(
    [
      { type: "address", name: "initialOwner" },
      { type: "address", name: "initialAttester" },
      { type: "uint256", name: "initialAgentId" },
    ],
    [process.env.DEPLOYER_ADDRESS, process.env.AGENT_ADDRESS, 0n]
  ).replace(/^0x/, "");

  // 1. Submit to Sourcify v2 API
  console.log(`Submitting to Sourcify v2 API for chain ${chainId}, contract ${contractAddress}...`);
  try {
    const scRes = await fetch(
      `https://sourcify.dev/server/v2/verify/${chainId}/${contractAddress}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stdJsonInput: stdInput,
          compilerVersion: artifact.compilerVersion.replace(/^v/, ""),
          contractIdentifier: `${artifact.sourceName}:${artifact.contractName}`,
        }),
      }
    );
    console.log("Sourcify v2 status:", scRes.status, await scRes.text());
  } catch (err) {
    console.warn("Sourcify v2 error:", err.message);
  }

  // 2. Submit to Blockscout v2 API with full path contract_name
  console.log(
    `Submitting Standard JSON Input via Blockscout v2 API (${blockscoutBase}) for ${contractAddress}...`
  );
  const form = new FormData();
  form.append("compiler_version", artifact.compilerVersion);
  form.append("license_type", "mit");
  form.append("contract_name", `${artifact.sourceName}:${artifact.contractName}`);
  form.append("autodetect_constructor_args", "false");
  form.append("constructor_args", constructorArgsHex);
  form.append(
    "files[0]",
    new Blob([stdInputStr], { type: "application/json" }),
    "standard-input.json"
  );

  const res = await fetch(
    `${blockscoutBase}/api/v2/smart-contracts/${contractAddress}/verification/via/standard-input`,
    {
      method: "POST",
      body: form,
    }
  );
  console.log("Blockscout v2 submit status:", res.status, await res.text());

  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const checkRes = await fetch(
      `${blockscoutBase}/api?module=contract&action=getsourcecode&address=${contractAddress}`
    );
    if (checkRes.ok) {
      const info = await checkRes.json();
      const entry = info?.result?.[0];
      if (entry && entry.ContractName) {
        console.log(
          `[VERIFIED ON EXPLORER] ${blockscoutBase}/address/${contractAddress}?tab=contract (ContractName=${entry.ContractName}, Compiler=${entry.CompilerVersion})`
        );
        return;
      }
      console.log(`Waiting for verification indexing (attempt ${i + 1}/8)...`);
    }
  }
}

main().catch((err) => {
  console.error("Verification script error:", err);
  process.exit(1);
});
