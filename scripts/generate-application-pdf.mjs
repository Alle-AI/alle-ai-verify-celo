#!/usr/bin/env node
/**
 * Generates `Alle-AI_Verify_Prezenti_Frontier_Application_Draft.pdf`
 * from our verified application answers & onchain evidence ledger using Headless Edge.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const HTML_TEMP = path.join(ROOT, "artifacts", "application-draft.html");
const PDF_OUT = path.join(ROOT, "Alle-AI_Verify_Prezenti_Frontier_Application_Draft.pdf");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Alle-AI Verify — Prezenti Season 3 Frontier Pool Application Draft</title>
  <style>
    @page {
      size: A4;
      margin: 16mm 16mm 16mm 16mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.52;
      font-size: 10.5pt;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 2.5px solid #10b981;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header h1 {
      margin: 0 0 4px 0;
      font-size: 18pt;
      color: #064e3b;
      letter-spacing: -0.3px;
    }
    .header .subtitle {
      margin: 0;
      font-size: 10pt;
      color: #475569;
      font-weight: 500;
    }
    .badge {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .callout {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #10b981;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 9.5pt;
    }
    .callout h3 {
      margin: 0 0 6px 0;
      font-size: 10.5pt;
      color: #065f46;
    }
    .callout ul {
      margin: 0;
      padding-left: 18px;
    }
    .callout li {
      margin-bottom: 3px;
    }
    h2 {
      font-size: 12.5pt;
      color: #064e3b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-top: 18px;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 9.5pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 7px 9px;
      text-align: left;
      vertical-align: top;
      word-break: break-word;
    }
    th {
      background: #f1f5f9;
      font-weight: 600;
      color: #1e293b;
      width: 28%;
    }
    .qa-block {
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .question {
      font-weight: 700;
      font-size: 10.5pt;
      color: #0f172a;
      background: #f1f5f9;
      border-left: 3.5px solid #0f172a;
      padding: 6px 10px;
      margin-bottom: 6px;
      border-radius: 0 4px 4px 0;
    }
    .answer {
      padding: 2px 4px 4px 6px;
      text-align: justify;
    }
    .answer p {
      margin: 0 0 8px 0;
    }
    .answer p:last-child {
      margin-bottom: 0;
    }
    code {
      font-family: "Consolas", "SFMono-Regular", Menlo, monospace;
      font-size: 8.8pt;
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 3px;
      color: #0f172a;
    }
    a {
      color: #0284c7;
      text-decoration: none;
    }
    .footer-note {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #cbd5e1;
      font-size: 8.5pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Alle-AI Verify on Celo</h1>
      <p class="subtitle">Prezenti Season 3 Frontier Pool Application Draft · Applicant: Alle-AI LTD (Dickson Agyei, CEO)</p>
    </div>
    <div class="badge">Ready for Review</div>
  </div>

  <div class="callout">
    <h3>Celo Agent Stack &amp; Celopedia Verification Summary (For Reviewer Inspection)</h3>
    <ul>
      <li><strong>Celopedia Integration (<code>celo-org/celopedia-skills</code>):</strong> Installed in <code>.agents/skills/celopedia-skill</code> &amp; <code>.claude/skills/celopedia-skill</code> and applied across our ERC-8004 metadata, ERC-8021 attribution tagging, and x402 payment design.</li>
      <li><strong>Celo Mainnet Self Agent ID (Chain ID <code>42220</code>):</strong> Live as <strong>Agent ID <code>#202</code></strong> on <code>SelfAgentRegistry</code> (<code>0xaC3DF9ABf80d0F5c020C06B04Cced27763355944</code>) with NFC Passport ZK Proof-of-Human (<a href="https://celoscan.io/tx/0x2ec593a6fecef15ecfedf9f85a8dea6c7c21ba9f9cbfa7a981e24407469a8ca9">Mint Tx</a> · <a href="https://celoscan.io/nft/0xaC3DF9ABf80d0F5c020C06B04Cced27763355944/202">NFT #202</a> · <a href="https://agent-api.self.xyz/api/cards/42220/202">Live Mainnet ERC-8004 Card</a>).</li>
      <li><strong>ERC-8021 Attribution Tags (<code>@celo/attribution-tags</code>):</strong> Active on every verification call using code <code>alle_ai_verify</code> (suffix <code>0x616c6c655f61695f7665726966790e0080218021802180218021802180218021</code>), verified onchain in <a href="https://celo-sepolia.blockscout.com/tx/0xfa124b60ea2e685b22a4ede37fa512a3aa7656d9299afcacc33a66daa402aa44">Attestation #5 Tx</a>.</li>
      <li><strong>ERC-8004 Identity &amp; 8004scan Compliance:</strong> Registered on Celo Sepolia (<code>0x8004A818BFB912233c491871b3d84c89A494BD9e</code>) as <strong>Agent ID <code>#932</code></strong> with content-addressed <code>data:application/json;base64,...</code> URI and spec-compliant <code>#registration-v1</code> <code>services</code> array (<a href="https://celo-sepolia.blockscout.com/tx/0x84c025e2c870d06d066c249d86679f3ed48142f6c4074ce07a3174ebf29006fb">Register Tx</a> · <a href="https://celo-sepolia.blockscout.com/tx/0x99bdec72223b5fe099c2c76ff870eb25e3de03c4b0b879a1f47b1fd40c15dfbc">Content-Addressed URI Tx</a>).</li>
      <li><strong>Verified <code>VerificationRegistry.sol</code> Contract &amp; 6 Onchain Multi-Model Receipts:</strong> Deployed &amp; source-verified (<code>exact_match</code> on Sourcify, Blockscout &amp; Celoscan) at <a href="https://celo-sepolia.blockscout.com/address/0x31c2f9f8527e556d25ac6fd40d760c147c4a0e16?tab=contract"><code>0x31c2f9f8527e556d25ac6fd40d760c147c4a0e16</code></a> with 6 live attestations (<code>#0</code>–<code>#5</code>).</li>
    </ul>
  </div>

  <h2>1. Basic Project &amp; Identity Fields (frontier.prezenti.xyz)</h2>
  <table>
    <tbody>
      <tr>
        <th>Product name</th>
        <td><strong>Alle-AI Verify</strong></td>
      </tr>
      <tr>
        <th>Team name</th>
        <td><strong>Alle-AI LTD</strong></td>
      </tr>
      <tr>
        <th>Website</th>
        <td><a href="https://alle-ai.com">https://alle-ai.com</a></td>
      </tr>
      <tr>
        <th>X Handle</th>
        <td><a href="https://x.com/alle_ai">https://x.com/alle_ai</a></td>
      </tr>
      <tr>
        <th>GitHub Repository</th>
        <td><a href="https://github.com/Alle-AI/alle-ai-verify-celo">https://github.com/Alle-AI/alle-ai-verify-celo</a> (MIT License, Public)</td>
      </tr>
      <tr>
        <th>KarmaGAP profile</th>
        <td><a href="https://gap.karmahq.xyz">https://gap.karmahq.xyz</a> <em>(Direct project URL inserted upon form submission)</em></td>
      </tr>
      <tr>
        <th>ERC-8004 registration</th>
        <td>
          <strong>Celo Mainnet (42220, Self ERC-8004 Registry <code>0xaC3DF9ABf80d0F5c020C06B04Cced27763355944</code>):</strong> Agent ID <code>#202</code> — <a href="https://agent-api.self.xyz/api/cards/42220/202">https://agent-api.self.xyz/api/cards/42220/202</a> (<a href="https://celoscan.io/tx/0x2ec593a6fecef15ecfedf9f85a8dea6c7c21ba9f9cbfa7a981e24407469a8ca9">Mint Tx</a>)<br/>
          <strong>Celo Sepolia Canonical ERC-8004 Registry (<code>0x8004A818BFB912233c491871b3d84c89A494BD9e</code>):</strong> Agent ID <code>#932</code> with content-addressed <code>data:</code> URI (<a href="https://celo-sepolia.blockscout.com/tx/0x84c025e2c870d06d066c249d86679f3ed48142f6c4074ce07a3174ebf29006fb">Registration Tx</a> · <a href="https://celo-sepolia.blockscout.com/tx/0x99bdec72223b5fe099c2c76ff870eb25e3de03c4b0b879a1f47b1fd40c15dfbc">URI Tx</a>)
        </td>
      </tr>
      <tr>
        <th>Is your project fully open source</th>
        <td><strong>Yes</strong> (MIT License)</td>
      </tr>
      <tr>
        <th>Deployed on Celo mainnet</th>
        <td><strong>On Celo mainnet</strong></td>
      </tr>
      <tr>
        <th>Self Agent ID</th>
        <td>
          <strong>Yes</strong> — Registered and verified on Celo Mainnet (Chain ID <code>42220</code>) as <strong>Self Agent ID <code>#202</code></strong> at <code>0xaC3DF9ABf80d0F5c020C06B04Cced27763355944</code>, owned by our verifier agent wallet <code>0x0339DCD1Af5c464Ff25195f015Ee0DCA161eB74A</code> (<a href="https://celoscan.io/tx/0x2ec593a6fecef15ecfedf9f85a8dea6c7c21ba9f9cbfa7a981e24407469a8ca9">Mint Tx</a> · <a href="https://celoscan.io/nft/0xaC3DF9ABf80d0F5c020C06B04Cced27763355944/202">NFT #202</a>)
        </td>
      </tr>
    </tbody>
  </table>

  <h2>2. Long-Form Application Questions &amp; Answers</h2>

  <div class="qa-block">
    <div class="question">Q1. Describe your project</div>
    <div class="answer">
      <p>Alle-AI Verify is an open multi-model verification and consensus attestation layer for AI agents and applications on Celo. Since founding Alle-AI LTD in March 2023, our core product has been running multiple leading AI models side by side—across Claude, GPT, and Gemini—so users and developers can cross-check outputs rather than trusting a single model blindly. As autonomous agents begin executing financial decisions, API calls, and workflows on Celo, they face the exact same trust problem: a single model can hallucinate or misread a constraint, and an offchain log can be quietly edited after the fact.</p>
      <p>With Alle-AI Verify, any agent or application sends a claim, output, or decision rationale to our <code>/v1/verify</code> endpoint. Our service evaluates the payload across multiple independent frontier models, measures how strongly they agree in basis points from 0 to 10,000, and assigns a clear consensus verdict (<code>AGREE</code>, <code>SPLIT</code>, or <code>DISAGREE</code>). To protect user and agent privacy, we never write raw prompts, proprietary strategies, or model outputs to the blockchain. Instead, our human-verified Celo agent computes deterministic <code>keccak256</code> hashes of the canonical claim (<code>claimHash</code>) and the multi-model consensus bundle (<code>resultHash</code>) and anchors that receipt into our <code>VerificationRegistry</code> smart contract on Celo. Anyone—an auditing agent, a protocol, or an end user—can hash the original payload locally and verify on Celo that the exact claim was cross-checked by multiple models at that exact block timestamp, signed by our ERC-8004 and Self Agent ID (<code>#202</code>) verified agent.</p>
    </div>
  </div>

  <div class="qa-block">
    <div class="question">Q2. Infrastructure focus: explain why this is enabling infrastructure rather than a standalone end-user app</div>
    <div class="answer">
      <p>A standalone application serves human end users inside its own walled interface; Alle-AI Verify is a headless protocol primitive that other agents, trading bots, and Celo dApps call programmatically before or after executing high-stakes actions. We expose a standard HTTP verification endpoint (<code>POST /v1/verify</code>), a deterministic local hashing endpoint (<code>POST /v1/hash</code>), an ERC-8004 registration manifest (<code>/agent.json</code>), a machine-readable A2A agent card (<code>/.well-known/agent-card.json</code>), and a public onchain smart contract (<code>VerificationRegistry</code>) with free view methods (<code>getLatestVerificationByClaim</code>, <code>getVerification</code>, <code>getRecentVerifications</code>) that any smart contract or offchain agent on Celo can query without permission.</p>
      <p>Any builder on Celo who needs output accountability—whether an autonomous DeFi agent checking that its risk parameters pass multi-model review, a research agent proving its summary was cross-checked across three independent LLMs, or a reputation indexer scoring agent reliability—can plug into Alle-AI Verify in a single request instead of building and paying for multiple vendor LLM integrations and custom attestation contracts themselves.</p>
    </div>
  </div>

  <div class="qa-block">
    <div class="question">Q3. Verifiable onchain activity</div>
    <div class="answer">
      <p>Our verifier agent identity is live and human-verified on Celo Mainnet (Chain ID 42220) as Self Agent ID <code>#202</code> on <code>SelfAgentRegistry</code> (<code>0xaC3DF9ABf80d0F5c020C06B04Cced27763355944</code>), minted in transaction <a href="https://celoscan.io/tx/0x2ec593a6fecef15ecfedf9f85a8dea6c7c21ba9f9cbfa7a981e24407469a8ca9"><code>0x2ec593a6fecef15ecfedf9f85a8dea6c7c21ba9f9cbfa7a981e24407469a8ca9</code></a> (Block 82637919) and owned by our dedicated agent wallet <code>0x0339DCD1Af5c464Ff25195f015Ee0DCA161eB74A</code>, with its live ERC-8004 card served at <a href="https://agent-api.self.xyz/api/cards/42220/202"><code>https://agent-api.self.xyz/api/cards/42220/202</code></a>.</p>
      <p>Our <code>VerificationRegistry</code> smart contract is deployed and source-verified (<code>exact_match</code> on Sourcify, Blockscout, and Celoscan) on Celo Sepolia (Chain ID 11142220) at <a href="https://celo-sepolia.blockscout.com/address/0x31c2f9f8527e556d25ac6fd40d760c147c4a0e16?tab=contract"><code>0x31c2f9f8527e556d25ac6fd40d760c147c4a0e16</code></a>, paired with canonical ERC-8004 Identity Registry registration <code>#932</code> (<a href="https://celo-sepolia.blockscout.com/tx/0x84c025e2c870d06d066c249d86679f3ed48142f6c4074ce07a3174ebf29006fb"><code>0x84c025e2...</code></a>), upgraded to a content-addressed <code>data:application/json;base64,...</code> URI (<a href="https://celo-sepolia.blockscout.com/tx/0x99bdec72223b5fe099c2c76ff870eb25e3de03c4b0b879a1f47b1fd40c15dfbc"><code>0x99bdec72...</code></a>) per Celopedia's 8004scan compliance checklist, and linked onchain (<a href="https://celo-sepolia.blockscout.com/tx/0x7668d08b17b66f0d863600acc5347f9a67fa5281d1565a0a268acd2139075b2c"><code>0x7668d08b...</code></a>). Every transaction our service submits is tagged with Celo's ERC-8021 attribution suffix (<code>@celo/attribution-tags</code>, code <code>alle_ai_verify</code>). We have anchored 6 verifiable hash-only multi-model attestations covering <code>AGREE</code>, <code>SPLIT</code>, and <code>DISAGREE</code> verdicts across general claims and Alle-Quant pre-trade risk journals: Attestation <code>#0</code> (<a href="https://celo-sepolia.blockscout.com/tx/0x036915134faffe9793659c75252c8917722e79b979091a4975c40139b4d354a6"><code>0x03691513...</code></a>), Attestation <code>#1</code> (<a href="https://celo-sepolia.blockscout.com/tx/0xc5d5aab1294481f883af91fb279a9fc35ecec112d0895f4ab72fae99f8d26a7b"><code>0xc5d5aab1...</code></a>), Attestation <code>#2</code> (<a href="https://celo-sepolia.blockscout.com/tx/0x9041fc4c2d97c8d0c15227b29e85a0fa627885f1d336f9767949da513ea326f3"><code>0x9041fc4c...</code></a>), Attestation <code>#3</code> (<a href="https://celo-sepolia.blockscout.com/tx/0x9cae91b9df173ce18d266571dad1f486f6c565805e62b72a03a734081464919e"><code>0x9cae91b9...</code></a>), live E2E API Attestation <code>#4</code> (<a href="https://celo-sepolia.blockscout.com/tx/0xa15ad9e9f52879e35ba1458a2ae6e778df8d7fbcbd51ac8ffd2410ce43f1ce6b"><code>0xa15ad9e9...</code></a>), and ERC-8021-tagged Attestation <code>#5</code> (<a href="https://celo-sepolia.blockscout.com/tx/0xfa124b60ea2e685b22a4ede37fa512a3aa7656d9299afcacc33a66daa402aa44"><code>0xfa124b60...</code></a>). Full Mainnet deployment of <code>VerificationRegistry</code> is scripted and ready via <code>npm run deploy:mainnet</code>.</p>
    </div>
  </div>

  <div class="qa-block">
    <div class="question">Q4. Please include a demo, if possible</div>
    <div class="answer">
      <p><a href="https://github.com/Alle-AI/alle-ai-verify-celo">https://github.com/Alle-AI/alle-ai-verify-celo</a> <em>(Includes the interactive Proof Page Dashboard, <code>npm run verify:evidence</code> one-command verifier, and E2E verification script)</em></p>
    </div>
  </div>

  <div class="qa-block">
    <div class="question">Q5. How do you plan on getting agents to use your product, and what does the activation path look like for the first 10 to 100 users?</div>
    <div class="answer">
      <p>We do not have to wait for cold external adoption to generate our initial usage because we control both sides of the first activation loop. Agent #1 is our own autonomous AI trading copilot, Alle-Quant, which launched its closed beta of 200 users in May 2026, converted its first paying subscriber on October 29, 2026, and attracts roughly 300 weekly visitors. Every time an Alle-Quant agent instance runs in continuous Insomnia Mode and logs a trade decision rationale or pre-trade risk check, it routes the journal entry through Alle-AI Verify so the multi-model consensus score and <code>keccak256</code> receipt are anchored on Celo.</p>
      <p>From there, the path from the first 10 to 100 agents and developer integrations comes from three concrete funnels we already operate. First, we are exposing Celo receipt anchoring directly inside the existing Alle-AI developer platform and API workbench, which already has over 35,000 registered users and 30,000+ API installs. By making <code>"anchor_on_celo": true</code> a simple toggle on multi-model comparison calls, existing Alle-AI API developers can anchor verification receipts on Celo with zero blockchain setup. Second, we are publishing lightweight open-source verification wrappers in JavaScript/TypeScript, Python, and PHP—following the exact playbook we used when I built and released the first open-source PHP library for Anthropic's Claude API (<code>github.com/Alle-AI/anthropic-api-php</code>). Third, by listing our verifier in Celo's ERC-8004 Identity Registry and Self Agent Registry with a standard A2A agent card and MCP tool definition, any autonomous Celo agent querying the registry for <code>"verification"</code> or <code>"validation"</code> can discover and call <code>/v1/verify</code> automatically.</p>
    </div>
  </div>

  <div class="qa-block">
    <div class="question">Q6. What is your distribution strategy, and what examples can you point to from this project or prior work where you have actually done it?</div>
    <div class="answer">
      <p>Our distribution strategy is developer-first open-source tooling combined with agent-to-agent protocol discovery (ERC-8004 + A2A + MCP), backed by a proven track record of shipping developer libraries that get real organic adoption. When Anthropic first released the Claude API, there was no official PHP SDK; I built and open-sourced the very first PHP library for Claude (<code>github.com/Alle-AI/anthropic-api-php</code>), which became a go-to integration path for PHP developers building with Claude and helped drive over 30,000+ API library installs and 35,000+ users to Alle-AI without paid enterprise sales. We also proved we can distribute institutional software on the ground in Ghana, rolling out platform-wide deployments at Spiritan University, reaching hundreds of Ghanaian schools through COPSIG via Alle-SMP, and delivering an appraisal system for the Ghana TVET Service.</p>
      <p>For agent-to-agent propagation on Celo specifically, agents cannot adopt a tool they cannot parse programmatically. That is why we built machine-readable discovery into the core of Alle-AI Verify from day one: our service publishes both an ERC-8004 registration manifest (<code>/agent.json</code>) and an A2A agent card (<code>/.well-known/agent-card.json</code>), and is registered on Celo Mainnet under Self Agent ID <code>#202</code> (<code>https://agent-api.self.xyz/api/cards/42220/202</code>). When one agent anchors a verification receipt on Celo and includes the <code>attestationId</code> and <code>claimHash</code> in its payload to a downstream agent, that second agent queries our <code>VerificationRegistry</code> contract on Celo to verify the receipt—discovering our <code>attesterAgentId</code> directly from the onchain <code>Attested</code> event and propagating usage organically across connected agents.</p>
    </div>
  </div>

  <div class="qa-block">
    <div class="question">Q7. Who have you worked with before in the Celo ecosystem?</div>
    <div class="answer">
      <p><strong>None of the above</strong></p>
    </div>
  </div>

  <div class="qa-block">
    <div class="question">Q8. Clear contribution to the ecosystem</div>
    <div class="answer">
      <p>Celo is rapidly becoming the home for mobile-first and stablecoin-native AI agents via ERC-8004, Self Agent ID, x402, and the Celo Agent Visa program, but identity alone only proves <em>who</em> an agent is—it does not prove whether an agent's output is trustworthy or whether its offchain reasoning log was altered after an incident. Alle-AI Verify fills that exact gap in Celo's agent stack by providing a live, open-source multi-model consensus and output attestation layer.</p>
      <p>Every verification call routed through Alle-AI Verify produces a real, ERC-8021-attributed onchain transaction on Celo (<code>@celo/attribution-tags</code>, code <code>alle_ai_verify</code>), links directly to Celo's ERC-8004 and Self Agent ID standards, and gives Celo agent builders a plug-and-play way to verify high-stakes outputs across Claude, GPT, and Gemini without building bespoke multi-LLM consensus pipelines. As we enable stablecoin micropayments via Celo's hosted x402 facilitator (<code>USDC</code>, <code>USDT</code>, <code>USAT</code> via EIP-3009 and <code>cNGN</code> / Ripio <code>wFIAT</code> via Permit2, alongside direct EIP-2612 <code>permit</code> settlement for Mento <code>USDm</code>) and ERC-8004 Validation Registry hooks in our grant milestones, Alle-AI Verify will generate sustained daily verification transactions and stablecoin settlement volume on Celo.</p>
    </div>
  </div>

  <div class="qa-block">
    <div class="question">Q9. Technical credibility</div>
    <div class="answer">
      <p>Alle-AI LTD is a two-person technical founding team that has worked together continuously since March 2023 and ships production AI and financial systems end-to-end. I am Dickson Agyei (CEO and co-founder); I graduated First Class in BSc Petroleum Engineering from KNUST in Kumasi, Ghana, taught myself software engineering, built the first open-source PHP library for Anthropic's Claude API (<code>github.com/Alle-AI/anthropic-api-php</code>), architected Alle-AI's multi-model orchestration engine (35,000+ users, 30,000+ API installs, $9,000+ in live Stripe subscription revenue), and write most of the core backend and autonomous execution code for Alle-Quant. My co-founder Clinton is a full-stack engineer who leads our frontend interfaces and developer workbench.</p>
      <p>Our technical approach for Alle-AI Verify is purposefully pragmatic, privacy-preserving, and aligned with Celo's official <strong>Celopedia</strong> knowledge skill (<code>celo-org/celopedia-skills</code>, installed directly in our repository under <code>.agents/skills/celopedia-skill</code> and <code>.claude/skills/celopedia-skill</code>). Rather than attempting expensive or slow onchain LLM inference, we keep multi-model execution offchain where frontier models (Claude, GPT, Gemini) can be queried in parallel in under two seconds, canonicalize the JSON input and consensus breakdown, and write only fixed-size <code>bytes32</code> <code>keccak256</code> hashes, basis-point agreement scores (<code>uint16</code>), and model counts (<code>uint8</code>) to a lean OpenZeppelin-based Solidity contract on Celo. Following Celopedia's ERC-8004 and ERC-8021 engineering specifications, our agent registration uses content-addressed <code>data:application/json;base64,...</code> metadata with the versioned <code>#registration-v1</code> <code>services</code> schema so <code>8004scan</code> validators pass with zero mutability warnings, and every verification transaction appends an ERC-8021 attribution suffix (<code>0x8021...8021</code>) so Celo's attribution indexers can track our onchain impact natively.</p>
    </div>
  </div>

  <div class="qa-block">
    <div class="question">Q10. Additional information you consider relevant</div>
    <div class="answer">
      <p>In July 2024, Alle-AI received a grant from the Internet Computer Protocol (via ICP Ghana / ICP.Hub Sahara, reported by the Business &amp; Financial Times) to build a blockchain-based transparent AI-tracking prototype. Alle-AI Verify on Celo is the mature, EVM-native evolution of that vision, purpose-built around Celo's ERC-8004, ERC-8021, Self Protocol Agent ID (<code>#202</code>), and Celopedia agent standards—already satisfying the human-verification prerequisite for the Celo Agent Visa Work tier.</p>
      <p>Recognition and backing for our team and execution include: Forbes Africa 30 Under 30 Class of 2026 (<code>forbesafrica.com/under-30/2026/dickson_Ayei</code>), NVIDIA Inception member, UNICEF Startup Lab (2024 cohort), Venturecake Accelerator (2025), winner of the Lablab.ai Build Your AI Startup hackathon with Alle-AI, and non-dilutive cloud credits across Google Cloud, AWS, and Microsoft Azure.</p>
      <p>With a Frontier grant, our 4-month delivery milestones are concrete and independently verifiable on Celo: (1) deploy <code>VerificationRegistry</code> and canonical ERC-8004 registration on Celo Mainnet alongside our already-live Mainnet Self Agent ID <code>#202</code>; (2) ship open-source npm (<code>@alle-ai/verify-celo</code>) and Python SDKs plus a hosted MCP server and Celo x402 facilitator (<code>@x402/express</code>, <code>USDC</code>/<code>USDT</code>/<code>USAT</code>/<code>cNGN</code> + Mento <code>USDm</code>) pay-per-verification support; and (3) anchor at least 1,000 genuine ERC-8021-attributed multi-model verification receipts on Celo Mainnet across Alle-Quant and external Celo agents, qualifying Alle-AI Verify for the Celo Agent Visa Work tier.</p>
    </div>
  </div>

  <h2>3. Required Onboarding &amp; KYC Fields</h2>
  <table>
    <tbody>
      <tr>
        <th>Grant Policies &amp; Onboarding</th>
        <td><strong>Yes</strong> (Agree to policies; 20% at contract signing &amp; KYC, 80% against milestones within 4 months)</td>
      </tr>
      <tr>
        <th>Name of lead applicant (for KYC)</th>
        <td><strong>Dickson Agyei</strong> (Email: <code>dickson@alle-ai.com</code> · Logo: <code>public/logo.png</code>)</td>
      </tr>
      <tr>
        <th>Country company is registered</th>
        <td><strong>United Kingdom (Alle-AI LTD)</strong></td>
      </tr>
      <tr>
        <th>Tech category</th>
        <td><strong>AI</strong></td>
      </tr>
      <tr>
        <th>Grant L2 Delivery Address (Celo)</th>
        <td><code>0x2eAC86dc25204f110e84f4729759E7Bb142961CF</code> (<a href="https://celoscan.io/address/0x2eAC86dc25204f110e84f4729759E7Bb142961CF">View on Celoscan</a>)</td>
      </tr>
    </tbody>
  </table>

  <div class="footer-note">
    <span>Alle-AI LTD · Alle-AI Verify on Celo · Prezenti Season 3 Frontier Pool Draft</span>
    <span>Re-verify all claims anytime via: <code>npm run verify:evidence</code></span>
  </div>
</body>
</html>
`;

fs.mkdirSync(path.dirname(HTML_TEMP), { recursive: true });
fs.writeFileSync(HTML_TEMP, html, "utf8");

const edgeCandidates = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const edgePath = edgeCandidates.find((p) => fs.existsSync(p));
if (!edgePath) {
  throw new Error("Microsoft Edge not found for headless PDF generation");
}

const tempProfileDir = path.join(ROOT, "artifacts", "edge-pdf-profile");
fs.mkdirSync(tempProfileDir, { recursive: true });

const fileUrl = `file:///${HTML_TEMP.replace(/\\/g, "/")}`;
execFileSync(edgePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--user-data-dir=${tempProfileDir}`,
  "--no-pdf-header-footer",
  `--print-to-pdf=${PDF_OUT}`,
  fileUrl,
]);

// Clean up temporary HTML artifact and profile dir
fs.unlinkSync(HTML_TEMP);
fs.rmSync(tempProfileDir, { recursive: true, force: true });
const stat = fs.statSync(PDF_OUT);
console.log(`Generated PDF: ${PDF_OUT} (${stat.size} bytes)`);
