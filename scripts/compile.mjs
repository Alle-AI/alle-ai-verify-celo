#!/usr/bin/env node
/**
 * Solidity Compiler Script (`scripts/compile.mjs`)
 * Compiles `contracts/VerificationRegistry.sol` using `solc` 0.8.28 and OpenZeppelin 5.6.1.
 * Outputs:
 *  - `artifacts/VerificationRegistry.json` (ABI, bytecode, deployedBytecode, metadata)
 *  - `artifacts/VerificationRegistry.standard-input.json` (Standard JSON Input for Blockscout/Celoscan/Sourcify verification)
 */

import fs from "node:fs";
import path from "node:path";
import solc from "solc";

const ROOT = process.cwd();
const CONTRACT_REL_PATH = "contracts/VerificationRegistry.sol";
const CONTRACT_FULL_PATH = path.join(ROOT, CONTRACT_REL_PATH);
const ARTIFACTS_DIR = path.join(ROOT, "artifacts");

function findImports(importPath) {
  try {
    let resolvedPath;
    if (importPath.startsWith("@openzeppelin/")) {
      resolvedPath = path.join(ROOT, "node_modules", importPath);
    } else {
      resolvedPath = path.resolve(path.dirname(CONTRACT_FULL_PATH), importPath);
    }
    return { contents: fs.readFileSync(resolvedPath, "utf8") };
  } catch (err) {
    return { error: `File not found: ${importPath} (${err.message})` };
  }
}

// Collect all imported sources recursively so Standard JSON Input is self-contained for explorer verification
const sources = {};
function collectSources(sourceKey, fullPath) {
  if (sources[sourceKey]) return;
  const content = fs.readFileSync(fullPath, "utf8");
  sources[sourceKey] = { content };

  const importRegex = /import\s+(?:.*?\s+from\s+)?["']([^"']+)["'];/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const imp = match[1];
    let impKey;
    let impFull;
    if (imp.startsWith("@openzeppelin/")) {
      impKey = imp;
      impFull = path.join(ROOT, "node_modules", imp);
    } else {
      impFull = path.resolve(path.dirname(fullPath), imp);
      impKey = path.relative(ROOT, impFull).replace(/\\/g, "/");
    }
    collectSources(impKey, impFull);
  }
}

collectSources(CONTRACT_REL_PATH, CONTRACT_FULL_PATH);

const standardInput = {
  language: "Solidity",
  sources,
  settings: {
    evmVersion: "paris",
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode", "evm.deployedBytecode", "metadata"],
      },
    },
  },
};

console.log(`Compiling ${CONTRACT_REL_PATH} with solc ${solc.version()}...`);
const output = JSON.parse(solc.compile(JSON.stringify(standardInput), { import: findImports }));

if (output.errors) {
  let hasFatal = false;
  for (const err of output.errors) {
    if (err.severity === "error") {
      console.error(err.formattedMessage);
      hasFatal = true;
    } else {
      console.warn(err.formattedMessage);
    }
  }
  if (hasFatal) process.exit(1);
}

const contractOutput = output.contracts[CONTRACT_REL_PATH]["VerificationRegistry"];
if (!contractOutput) {
  console.error("Failed to locate VerificationRegistry in compiler output.");
  process.exit(1);
}

fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

const artifact = {
  contractName: "VerificationRegistry",
  sourceName: CONTRACT_REL_PATH,
  compilerVersion: `v${solc.version().replace(/\.Emscripten\.clang$/, "")}`,
  abi: contractOutput.abi,
  bytecode: `0x${contractOutput.evm.bytecode.object}`,
  deployedBytecode: `0x${contractOutput.evm.deployedBytecode.object}`,
  metadata: contractOutput.metadata,
};

fs.writeFileSync(
  path.join(ARTIFACTS_DIR, "VerificationRegistry.json"),
  JSON.stringify(artifact, null, 2)
);
fs.writeFileSync(
  path.join(ARTIFACTS_DIR, "VerificationRegistry.standard-input.json"),
  JSON.stringify(standardInput, null, 2)
);

console.log(
  `Compilation SUCCEEDED -> artifacts/VerificationRegistry.json (bytecode: ${artifact.bytecode.length} hex chars)`
);
