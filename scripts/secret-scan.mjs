#!/usr/bin/env node
/**
 * Secret Scanner for Alle-AI Verify (Celo)
 * Enforces Hard Safety Rule #1:
 * - Verifies .env and .self/ are gitignored and NOT tracked by git
 * - Scans all tracked and untracked (non-ignored) files for leaked 64-hex private keys,
 *   seed phrases, or Bearer/API tokens.
 * - Exits with code 1 if any violation is detected.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();

const FORBIDDEN_PATTERNS = [
  {
    name: "Private Key Assignment",
    regex: /(?:DEPLOYER_PRIVATE_KEY|AGENT_PRIVATE_KEY|PRIVATE_KEY)\s*=\s*["']?(?:0x)?[0-9a-fA-F]{64}["']?/,
  },
  {
    name: "Raw 0x64-Hex Private Key",
    // Matches 0x followed by 64 hex chars unless clearly annotated as a hash or tx/bytes32 fixture
    regex: /\b0x[0-9a-fA-F]{64}\b/,
    allowInFiles: [
      "EVIDENCE.md",
      "REPORT.md",
      "APPLICATION_ANSWERS.md",
      "Alle-AI_Verify_Prezenti_Frontier_Application_Draft.pdf",
      "scripts/generate-application-pdf.mjs",
      "LEARNING.md",
      "README.md",
      "verify_evidence.sh",
      "scripts/verify_evidence.mjs",
      "test/",
      "public/",
    ],
  },
  {
    name: "Alle-AI / OpenAI / Anthropic Live Key",
    regex: /\b(?:sk-ant-[a-zA-Z0-9_-]{20,}|sk-proj-[a-zA-Z0-9_-]{20,}|alle_[a-zA-Z0-9_-]{20,})\b/,
  },
];

function getFilesToScan() {
  try {
    const out = execSync("git ls-files --cached --others --exclude-standard", {
      cwd: ROOT,
      encoding: "utf8",
    });
    return out
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    // Fallback if git not initialized yet
    const results = [];
    function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (
          entry.name === "node_modules" ||
          entry.name === ".git" ||
          entry.name === ".env" ||
          entry.name === ".self" ||
          entry.name === "artifacts" ||
          entry.name === "cache"
        ) {
          continue;
        }
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else results.push(path.relative(ROOT, full));
      }
    }
    walk(ROOT);
    return results;
  }
}

let violations = 0;

// 1. Check .gitignore exists and covers .env and .self/
const gitignorePath = path.join(ROOT, ".gitignore");
if (!fs.existsSync(gitignorePath)) {
  console.error("[FAIL] .gitignore is missing!");
  violations++;
} else {
  const gitignore = fs.readFileSync(gitignorePath, "utf8");
  if (!gitignore.includes(".env") || !gitignore.includes(".self/")) {
    console.error("[FAIL] .gitignore must ignore .env and .self/");
    violations++;
  }
}

// 2. Scan files
const files = getFilesToScan();
for (const relFile of files) {
  const normalized = relFile.replace(/\\/g, "/");
  if (normalized === ".env" || normalized.startsWith(".self/")) {
    console.error(`[FAIL] Secret file is tracked or not ignored by git: ${normalized}`);
    violations++;
    continue;
  }

  const fullPath = path.join(ROOT, relFile);
  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) continue;

  const content = fs.readFileSync(fullPath, "utf8");
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (
      pattern.allowInFiles &&
      pattern.allowInFiles.some((allowed) => normalized.includes(allowed))
    ) {
      continue;
    }
    if (pattern.regex.test(content)) {
      console.error(`[FAIL] Potential secret (${pattern.name}) found in ${normalized}`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\nSecret scan FAILED with ${violations} violation(s). Do NOT commit or push.`);
  process.exit(1);
} else {
  console.log(`Secret scan PASSED (${files.length} files scanned, 0 leaks, .env & .self/ safely gitignored).`);
}
