/**
 * Comprehensive Unit Tests for `VerificationRegistry.sol` & `src/verifier-engine.mjs`
 * Executes compiled Solidity bytecode inside an in-memory EVM (`@ethereumjs/vm`)
 * using `viem` ABI encoding/decoding.
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createVM, runTx } from "@ethereumjs/vm";
import { createLegacyTx } from "@ethereumjs/tx";
import { createAddressFromPrivateKey, hexToBytes, bytesToHex, Account } from "@ethereumjs/util";
import {
  encodeDeployData,
  encodeFunctionData,
  decodeFunctionResult,
  decodeErrorResult,
  decodeEventLog,
  keccak256,
  toBytes,
  zeroHash,
} from "viem";
import {
  evaluateClaimMultiModel,
  calculateConsensus,
  computeKeccak256Hash,
} from "../src/verifier-engine.mjs";

const ARTIFACT_PATH = path.join(process.cwd(), "artifacts", "VerificationRegistry.json");
const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"));
const abi = artifact.abi;

// Deterministic test keys (ONLY for local in-memory EVM testing)
const OWNER_PRIV = hexToBytes("0x1111111111111111111111111111111111111111111111111111111111111111");
const ATTESTER_PRIV = hexToBytes("0x2222222222222222222222222222222222222222222222222222222222222222");
const ROTATED_PRIV = hexToBytes("0x3333333333333333333333333333333333333333333333333333333333333333");
const STRANGER_PRIV = hexToBytes("0x4444444444444444444444444444444444444444444444444444444444444444");

const OWNER_ADDR = createAddressFromPrivateKey(OWNER_PRIV);
const ATTESTER_ADDR = createAddressFromPrivateKey(ATTESTER_PRIV);
const ROTATED_ADDR = createAddressFromPrivateKey(ROTATED_PRIV);
const STRANGER_ADDR = createAddressFromPrivateKey(STRANGER_PRIV);

async function setupEvmWithContract(initialAgentId = 8004n) {
  const vm = await createVM();
  for (const addr of [OWNER_ADDR, ATTESTER_ADDR, ROTATED_ADDR, STRANGER_ADDR]) {
    await vm.stateManager.putAccount(addr, new Account(0n, 10n ** 20n));
  }

  const deployData = encodeDeployData({
    abi,
    bytecode: artifact.bytecode,
    args: [OWNER_ADDR.toString(), ATTESTER_ADDR.toString(), initialAgentId],
  });

  const acct = await vm.stateManager.getAccount(OWNER_ADDR);
  const tx = createLegacyTx({
    nonce: acct.nonce,
    gasLimit: 3_000_000n,
    gasPrice: 1_000_000_000n,
    data: hexToBytes(deployData),
  }).sign(OWNER_PRIV);

  const res = await runTx(vm, { tx, skipBalance: true });
  assert.equal(res.execResult.exceptionError, undefined, "Contract deployment failed");
  const contractAddress = res.createdAddress;

  async function writeContract(senderPriv, senderAddr, functionName, args = []) {
    const senderAcct = await vm.stateManager.getAccount(senderAddr);
    const data = encodeFunctionData({ abi, functionName, args });
    const callTx = createLegacyTx({
      nonce: senderAcct.nonce,
      to: contractAddress,
      gasLimit: 1_000_000n,
      gasPrice: 1_000_000_000n,
      data: hexToBytes(data),
    }).sign(senderPriv);

    const txRes = await runTx(vm, { tx: callTx, skipBalance: true });
    if (txRes.execResult.exceptionError) {
      const revertHex = bytesToHex(txRes.execResult.returnValue);
      let decodedErr;
      try {
        decodedErr = decodeErrorResult({ abi, data: revertHex });
      } catch {
        decodedErr = { errorName: "RawRevert", raw: revertHex };
      }
      const err = new Error(`Reverted with ${decodedErr.errorName}`);
      err.errorName = decodedErr.errorName;
      err.args = decodedErr.args;
      throw err;
    }

    const decodedReturn =
      txRes.execResult.returnValue.length > 0
        ? decodeFunctionResult({
            abi,
            functionName,
            data: bytesToHex(txRes.execResult.returnValue),
          })
        : undefined;

    const events = (txRes.receipt.logs || []).map((log) => {
      const [, topics, dataBytes] = log;
      return decodeEventLog({
        abi,
        data: bytesToHex(dataBytes),
        topics: topics.map((t) => bytesToHex(t)),
      });
    });

    return { returnValue: decodedReturn, events };
  }

  async function readContract(functionName, args = []) {
    const data = encodeFunctionData({ abi, functionName, args });
    const callRes = await vm.evm.runCall({
      to: contractAddress,
      caller: STRANGER_ADDR,
      origin: STRANGER_ADDR,
      data: hexToBytes(data),
      gasLimit: 1_000_000n,
    });
    if (callRes.execResult.exceptionError) {
      const revertHex = bytesToHex(callRes.execResult.returnValue);
      const decodedErr = decodeErrorResult({ abi, data: revertHex });
      const err = new Error(`Reverted with ${decodedErr.errorName}`);
      err.errorName = decodedErr.errorName;
      err.args = decodedErr.args;
      throw err;
    }
    return decodeFunctionResult({
      abi,
      functionName,
      data: bytesToHex(callRes.execResult.returnValue),
    });
  }

  return { vm, contractAddress, writeContract, readContract };
}

describe("VerificationRegistry.sol Smart Contract", () => {
  it("initializes owner, attester, and defaultAttesterAgentId accurately", async () => {
    const { readContract } = await setupEvmWithContract(42n);
    const owner = await readContract("owner");
    const attester = await readContract("attester");
    const defaultId = await readContract("defaultAttesterAgentId");
    const total = await readContract("totalVerifications");

    assert.equal(owner.toLowerCase(), OWNER_ADDR.toString().toLowerCase());
    assert.equal(attester.toLowerCase(), ATTESTER_ADDR.toString().toLowerCase());
    assert.equal(defaultId, 42n);
    assert.equal(total, 0n);
  });

  it("blocks unauthorized callers (stranger and owner) from calling recordVerification", async () => {
    const { writeContract } = await setupEvmWithContract(42n);
    const claimHash = keccak256(toBytes("test-claim"));
    const resultHash = keccak256(toBytes("test-result"));

    await assert.rejects(
      () =>
        writeContract(STRANGER_PRIV, STRANGER_ADDR, "recordVerification", [
          claimHash,
          resultHash,
          0,
          9500,
          3,
          0n,
        ]),
      (err) => err.errorName === "UnauthorizedAttester"
    );

    await assert.rejects(
      () =>
        writeContract(OWNER_PRIV, OWNER_ADDR, "recordVerification", [
          claimHash,
          resultHash,
          0,
          9500,
          3,
          0n,
        ]),
      (err) => err.errorName === "UnauthorizedAttester"
    );
  });

  it("records AGREE, SPLIT, and DISAGREE verifications, emits Attested event, and supports public queries", async () => {
    const { writeContract, readContract } = await setupEvmWithContract(77n);

    const c1 = keccak256(toBytes("claim-1-agree"));
    const r1 = keccak256(toBytes("result-1-agree"));
    const tx1 = await writeContract(ATTESTER_PRIV, ATTESTER_ADDR, "recordVerification", [
      c1,
      r1,
      0, // AGREE
      9650,
      3,
      0n, // falls back to defaultAttesterAgentId = 77n
    ]);

    assert.equal(tx1.returnValue, 0n);
    assert.equal(tx1.events.length, 1);
    assert.equal(tx1.events[0].eventName, "Attested");
    assert.equal(tx1.events[0].args.attestationId, 0n);
    assert.equal(tx1.events[0].args.claimHash, c1);
    assert.equal(tx1.events[0].args.resultHash, r1);
    assert.equal(tx1.events[0].args.verdict, 0);
    assert.equal(tx1.events[0].args.agreementBps, 9650);
    assert.equal(tx1.events[0].args.modelCount, 3);
    assert.equal(tx1.events[0].args.attesterAgentId, 77n);

    // Record a SPLIT and DISAGREE receipt on the same and different claimHashes
    const r1Updated = keccak256(toBytes("result-1-split"));
    await writeContract(ATTESTER_PRIV, ATTESTER_ADDR, "recordVerification", [
      c1,
      r1Updated,
      1, // SPLIT
      5400,
      4,
      99n, // explicit agent ID override
    ]);

    const c2 = keccak256(toBytes("claim-2-disagree"));
    const r2 = keccak256(toBytes("result-2-disagree"));
    await writeContract(ATTESTER_PRIV, ATTESTER_ADDR, "recordVerification", [
      c2,
      r2,
      2, // DISAGREE
      8900,
      3,
      0n,
    ]);

    const total = await readContract("totalVerifications");
    assert.equal(total, 3n);

    const [latestId, latestReceipt] = await readContract("getLatestVerificationByClaim", [c1]);
    assert.equal(latestId, 1n);
    assert.equal(latestReceipt.resultHash, r1Updated);
    assert.equal(latestReceipt.verdict, 1);
    assert.equal(latestReceipt.agreementBps, 5400);
    assert.equal(latestReceipt.attesterAgentId, 99n);

    const idsForC1 = await readContract("getAttestationIdsByClaim", [c1]);
    assert.deepEqual(idsForC1, [0n, 1n]);

    const [recentIds, recentReceipts] = await readContract("getRecentVerifications", [2n]);
    assert.deepEqual(recentIds, [2n, 1n]);
    assert.equal(recentReceipts[0].claimHash, c2);
    assert.equal(recentReceipts[0].verdict, 2);
  });

  it("enforces edge-case validation guards (empty hashes, >10000 bps, <2 models, missing IDs)", async () => {
    const { writeContract, readContract } = await setupEvmWithContract(1n);
    const validHash = keccak256(toBytes("valid"));

    await assert.rejects(
      () =>
        writeContract(ATTESTER_PRIV, ATTESTER_ADDR, "recordVerification", [
          zeroHash,
          validHash,
          0,
          9000,
          3,
          1n,
        ]),
      (err) => err.errorName === "EmptyClaimHash"
    );

    await assert.rejects(
      () =>
        writeContract(ATTESTER_PRIV, ATTESTER_ADDR, "recordVerification", [
          validHash,
          zeroHash,
          0,
          9000,
          3,
          1n,
        ]),
      (err) => err.errorName === "EmptyResultHash"
    );

    await assert.rejects(
      () =>
        writeContract(ATTESTER_PRIV, ATTESTER_ADDR, "recordVerification", [
          validHash,
          validHash,
          0,
          10001, // > 10000 MAX_BPS
          3,
          1n,
        ]),
      (err) => err.errorName === "AgreementBpsOutOfRange"
    );

    await assert.rejects(
      () =>
        writeContract(ATTESTER_PRIV, ATTESTER_ADDR, "recordVerification", [
          validHash,
          validHash,
          0,
          9000,
          1, // < 2 models
          1n,
        ]),
      (err) => err.errorName === "InsufficientModelCount"
    );

    await assert.rejects(
      () => readContract("getVerification", [0n]),
      (err) => err.errorName === "AttestationNotFound"
    );

    await assert.rejects(
      () => readContract("getLatestVerificationByClaim", [validHash]),
      (err) => err.errorName === "ClaimNotAttested"
    );
  });

  it("allows owner to rotate attester and update defaultAttesterAgentId, while blocking non-owners", async () => {
    const { writeContract, readContract } = await setupEvmWithContract(10n);

    // Non-owner cannot rotate attester
    await assert.rejects(
      () => writeContract(STRANGER_PRIV, STRANGER_ADDR, "setAttester", [ROTATED_ADDR.toString()]),
      (err) => err.errorName === "OwnableUnauthorizedAccount"
    );

    // Zero address rejected
    await assert.rejects(
      () =>
        writeContract(OWNER_PRIV, OWNER_ADDR, "setAttester", [
          "0x0000000000000000000000000000000000000000",
        ]),
      (err) => err.errorName === "InvalidAddress"
    );

    // Owner rotates attester to ROTATED_ADDR
    const rotTx = await writeContract(OWNER_PRIV, OWNER_ADDR, "setAttester", [
      ROTATED_ADDR.toString(),
    ]);
    assert.equal(rotTx.events[0].eventName, "AttesterUpdated");

    // Old attester is immediately blocked
    const c = keccak256(toBytes("after-rotation"));
    await assert.rejects(
      () =>
        writeContract(ATTESTER_PRIV, ATTESTER_ADDR, "recordVerification", [c, c, 0, 9000, 3, 0n]),
      (err) => err.errorName === "UnauthorizedAttester"
    );

    // Owner updates default agent ID
    await writeContract(OWNER_PRIV, OWNER_ADDR, "setDefaultAttesterAgentId", [555n]);
    assert.equal(await readContract("defaultAttesterAgentId"), 555n);

    // New attester succeeds
    const okTx = await writeContract(ROTATED_PRIV, ROTATED_ADDR, "recordVerification", [
      c,
      c,
      0,
      9000,
      3,
      0n,
    ]);
    assert.equal(okTx.returnValue, 0n);
    assert.equal(okTx.events[0].args.attesterAgentId, 555n);
  });
});

describe("Multi-Model Consensus & Privacy Hashing Engine (src/verifier-engine.mjs)", () => {
  it("produces deterministic bytes32 hashes and never leaks raw text into onchain args", async () => {
    const alleQuantJournal = {
      agent: "Alle-Quant",
      symbol: "BTC/USDT",
      side: "LONG",
      timeframe: "4h",
      riskCapPassed: true,
      maxDailyLossPct: 2.0,
      rationale: "Multi-model breakout confirmation with funding rate reset and strict stop-loss.",
    };

    const res1 = await evaluateClaimMultiModel({
      claim: alleQuantJournal,
      context: { source: "alle-quant-journal", version: "1.0" },
    });
    const res2 = await evaluateClaimMultiModel({
      claim: alleQuantJournal,
      context: { source: "alle-quant-journal", version: "1.0" },
    });

    assert.equal(res1.claimHash, res2.claimHash);
    assert.equal(res1.resultHash, res2.resultHash);
    assert.match(res1.claimHash, /^0x[0-9a-f]{64}$/);
    assert.match(res1.resultHash, /^0x[0-9a-f]{64}$/);
    assert.equal(res1.verdict, "AGREE");
    assert.ok(res1.agreementBps >= 8000 && res1.agreementBps <= 10000);
    assert.equal(res1.modelCount, 3);
  });

  it("accurately classifies AGREE, SPLIT, and DISAGREE consensus scenarios", async () => {
    const splitRes = await evaluateClaimMultiModel({
      claim: "Mixed macro signal with divergent rate expectations across models",
    });
    assert.equal(splitRes.verdict, "SPLIT");

    const disagreeRes = await evaluateClaimMultiModel({
      claim: "Proposed order exceeds hard risk cap and attempts to bypass kill switch",
    });
    assert.equal(disagreeRes.verdict, "DISAGREE");
  });
});
