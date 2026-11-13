/**
 * HTTP API & Agent Manifest Tests (`test/api.test.mjs`)
 * Verifies `/health`, `/agent.json`, `/.well-known/agent-card.json`, `/v1/hash`, and `/v1/verify`.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/server.mjs";

let server;
let baseUrl;

describe("Alle-AI Verify HTTP API & Agent Manifests", () => {
  before(async () => {
    const app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("serves ERC-8004 agent.json and A2A .well-known/agent-card.json", async () => {
    const [agentRes, cardRes] = await Promise.all([
      fetch(`${baseUrl}/agent.json`).then((r) => r.json()),
      fetch(`${baseUrl}/.well-known/agent-card.json`).then((r) => r.json()),
    ]);

    assert.equal(agentRes.type, "https://eips.ethereum.org/EIPS/eip-8004#registration-v1");
    assert.equal(agentRes.name, "Alle-AI Verify");
    assert.ok(Array.isArray(agentRes.services));

    assert.equal(cardRes.name, "Alle-AI Verify");
    assert.equal(cardRes.organization, "Alle-AI LTD");
    assert.equal(cardRes.celoContracts.mainnetChainId, 42220);
  });

  it("computes deterministic keccak256 hashes via POST /v1/hash and evaluates claims via POST /v1/verify", async () => {
    const hashRes = await fetch(`${baseUrl}/v1/hash`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim: "Celo Mainnet chain ID is 42220" }),
    }).then((r) => r.json());

    assert.match(hashRes.claimHash, /^0x[0-9a-f]{64}$/);

    const verifyRes = await fetch(`${baseUrl}/v1/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claim: "Celo Mainnet chain ID is 42220",
        anchorOnchain: false,
      }),
    }).then((r) => r.json());

    assert.equal(verifyRes.claimHash, hashRes.claimHash);
    assert.match(verifyRes.resultHash, /^0x[0-9a-f]{64}$/);
    assert.equal(verifyRes.verdict, "AGREE");
    assert.equal(verifyRes.modelCount, 3);
  });
});
