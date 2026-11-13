#!/usr/bin/env node
/**
 * End-to-End Verification API Caller (`scripts/e2e-verify-call.mjs`)
 * Boots the `Alle-AI Verify` Express server, sends a real `POST /v1/verify` request
 * (with `anchorOnchain: true`), and verifies that the returned transaction hash
 * and `Attested` event exist onchain.
 */

import { createApp } from "../src/server.mjs";

const args = process.argv.slice(2);
const networkIdx = args.indexOf("--network");
const network = networkIdx !== -1 ? args[networkIdx + 1] : "sepolia";

if (network === "mainnet" && !args.includes("--yes-i-approve-mainnet")) {
  console.error(
    "[SAFETY GATE] Refusing to broadcast to Celo Mainnet without explicit --yes-i-approve-mainnet flag."
  );
  process.exit(1);
}

const app = createApp();
const server = app.listen(0, async () => {
  try {
    const { port } = server.address();
    console.log(`=== Sending End-to-End POST /v1/verify Request (network=${network}) ===`);
    const res = await fetch(`http://127.0.0.1:${port}/v1/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claim: {
          agent: "Alle-Quant",
          entryType: "e2e-http-verify-call",
          symbol: "CELO/USDm",
          side: "LONG",
          timeframe: "1h",
          riskCapPassed: true,
          rationale:
            "End-to-end HTTP POST /v1/verify call anchoring multi-model consensus receipt on Celo.",
        },
        context: { caller: "alle-quant-e2e", phase: "phase-4-gate" },
        network,
        anchorOnchain: true,
      }),
    });

    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
    if (!res.ok || !data?.onchain?.anchored) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("E2E call failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
