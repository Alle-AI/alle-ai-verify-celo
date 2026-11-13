// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VerificationRegistry
 * @author Alle-AI LTD (https://alle-ai.com)
 * @notice Open verification & multi-model consensus attestation layer for the Celo agent economy.
 * @dev Privacy by design: ONLY cryptographic hashes (bytes32 claimHash and resultHash) and
 *      consensus metadata are stored onchain. Raw prompts, claims, user data, or model outputs
 *      must NEVER be passed to or stored in this contract.
 */
contract VerificationRegistry is Ownable {
    /// @notice Consensus verdict across evaluated AI models
    enum Verdict {
        AGREE,    // 0: Models reached strong consensus supporting/agreeing on the output
        SPLIT,    // 1: Models diverged / partial agreement
        DISAGREE  // 2: Models rejected / disagreed with the claim or contradicted each other
    }

    /// @notice Tamper-proof verification receipt stored on Celo
    struct VerificationReceipt {
        bytes32 claimHash;        // keccak256 hash of canonical claim/input (never raw text)
        bytes32 resultHash;       // keccak256 hash of multi-model evaluation bundle
        uint256 attesterAgentId;  // ERC-8004 / Self Agent ID of the verifier agent
        uint64 timestamp;         // Block timestamp when receipt was anchored
        uint16 agreementBps;      // Model agreement score in basis points (0 - 10000)
        uint8 modelCount;         // Number of independent AI models consulted (>= 2)
        Verdict verdict;          // Consensus verdict (AGREE, SPLIT, DISAGREE)
    }

    /// @notice Maximum valid basis points (100.00% = 10,000 bps)
    uint16 public constant MAX_BPS = 10_000;

    /// @notice Authorized Alle-AI verifier agent wallet permitted to record attestations
    address public attester;

    /// @notice Default ERC-8004 / Self Agent ID associated with the authorized attester
    uint256 public defaultAttesterAgentId;

    /// @dev Sequential list of all verification receipts
    VerificationReceipt[] private _receipts;

    /// @dev Mapping from claimHash => array of receipt IDs (1-indexed stored or 0-indexed with existence tracking)
    mapping(bytes32 => uint256[]) private _receiptIdsByClaim;

    // =========================================================================
    // Events
    // =========================================================================

    /// @notice Emitted whenever a multi-model verification receipt is anchored onchain
    event Attested(
        uint256 indexed attestationId,
        bytes32 indexed claimHash,
        bytes32 indexed resultHash,
        Verdict verdict,
        uint16 agreementBps,
        uint8 modelCount,
        uint256 attesterAgentId,
        address attester,
        uint64 timestamp
    );

    /// @notice Emitted when the owner rotates the authorized attester wallet
    event AttesterUpdated(address indexed previousAttester, address indexed newAttester);

    /// @notice Emitted when the owner updates the default attester agent ID
    event DefaultAgentIdUpdated(uint256 indexed previousAgentId, uint256 indexed newAgentId);

    // =========================================================================
    // Custom Errors
    // =========================================================================

    error UnauthorizedAttester(address caller);
    error InvalidAddress();
    error EmptyClaimHash();
    error EmptyResultHash();
    error AgreementBpsOutOfRange(uint16 providedBps);
    error InsufficientModelCount(uint8 providedCount);
    error AttestationNotFound(uint256 attestationId);
    error ClaimNotAttested(bytes32 claimHash);

    // =========================================================================
    // Constructor & Modifiers
    // =========================================================================

    /**
     * @param initialOwner Admin address (Deployer wallet) that can rotate the attester
     * @param initialAttester Authorized Alle-AI agent wallet that signs verification receipts
     * @param initialAgentId Initial ERC-8004 / Self Agent ID (can be 0 before registration and updated after)
     */
    constructor(
        address initialOwner,
        address initialAttester,
        uint256 initialAgentId
    ) Ownable(initialOwner) {
        if (initialAttester == address(0)) revert InvalidAddress();
        attester = initialAttester;
        defaultAttesterAgentId = initialAgentId;

        emit AttesterUpdated(address(0), initialAttester);
        emit DefaultAgentIdUpdated(0, initialAgentId);
    }

    modifier onlyAttester() {
        if (msg.sender != attester) revert UnauthorizedAttester(msg.sender);
        _;
    }

    // =========================================================================
    // Write Functions (Restricted to Authorized Attester or Owner)
    // =========================================================================

    /**
     * @notice Record a new multi-model verification receipt on Celo.
     * @param claimHash keccak256 hash of the canonical claim/prompt/journal entry
     * @param resultHash keccak256 hash of the canonical multi-model comparison payload
     * @param verdict Consensus enum (0 = AGREE, 1 = SPLIT, 2 = DISAGREE)
     * @param agreementBps Agreement score in basis points (0 to 10000)
     * @param modelCount Number of AI models evaluated (must be >= 2)
     * @param attesterAgentId ERC-8004 / Self Agent ID (if 0, uses defaultAttesterAgentId)
     * @return attestationId The sequential ID of the newly stored receipt
     */
    function recordVerification(
        bytes32 claimHash,
        bytes32 resultHash,
        Verdict verdict,
        uint16 agreementBps,
        uint8 modelCount,
        uint256 attesterAgentId
    ) external onlyAttester returns (uint256 attestationId) {
        if (claimHash == bytes32(0)) revert EmptyClaimHash();
        if (resultHash == bytes32(0)) revert EmptyResultHash();
        if (agreementBps > MAX_BPS) revert AgreementBpsOutOfRange(agreementBps);
        if (modelCount < 2) revert InsufficientModelCount(modelCount);

        uint256 resolvedAgentId = attesterAgentId == 0 ? defaultAttesterAgentId : attesterAgentId;
        uint64 currentTimestamp = uint64(block.timestamp);

        attestationId = _receipts.length;
        _receipts.push(
            VerificationReceipt({
                claimHash: claimHash,
                resultHash: resultHash,
                attesterAgentId: resolvedAgentId,
                timestamp: currentTimestamp,
                agreementBps: agreementBps,
                modelCount: modelCount,
                verdict: verdict
            })
        );

        _receiptIdsByClaim[claimHash].push(attestationId);

        emit Attested(
            attestationId,
            claimHash,
            resultHash,
            verdict,
            agreementBps,
            modelCount,
            resolvedAgentId,
            msg.sender,
            currentTimestamp
        );
    }

    /**
     * @notice Rotate the authorized attester wallet. Callable only by the contract owner.
     * @param newAttester New agent wallet address
     */
    function setAttester(address newAttester) external onlyOwner {
        if (newAttester == address(0)) revert InvalidAddress();
        address previous = attester;
        attester = newAttester;
        emit AttesterUpdated(previous, newAttester);
    }

    /**
     * @notice Update the default ERC-8004 / Self Agent ID for the attester. Callable only by owner.
     * @param newAgentId Registered onchain agent token ID
     */
    function setDefaultAttesterAgentId(uint256 newAgentId) external onlyOwner {
        uint256 previous = defaultAttesterAgentId;
        defaultAttesterAgentId = newAgentId;
        emit DefaultAgentIdUpdated(previous, newAgentId);
    }

    // =========================================================================
    // Read Functions (Public & Free for Any Agent or User)
    // =========================================================================

    /**
     * @notice Total number of verification receipts anchored in this registry.
     */
    function totalVerifications() external view returns (uint256) {
        return _receipts.length;
    }

    /**
     * @notice Fetch a verification receipt by its sequential attestation ID.
     */
    function getVerification(
        uint256 attestationId
    ) external view returns (VerificationReceipt memory) {
        if (attestationId >= _receipts.length) revert AttestationNotFound(attestationId);
        return _receipts[attestationId];
    }

    /**
     * @notice Fetch the latest verification receipt for a specific claimHash.
     */
    function getLatestVerificationByClaim(
        bytes32 claimHash
    ) external view returns (uint256 attestationId, VerificationReceipt memory receipt) {
        uint256[] storage ids = _receiptIdsByClaim[claimHash];
        if (ids.length == 0) revert ClaimNotAttested(claimHash);
        attestationId = ids[ids.length - 1];
        receipt = _receipts[attestationId];
    }

    /**
     * @notice Fetch all attestation IDs recorded for a given claimHash.
     */
    function getAttestationIdsByClaim(
        bytes32 claimHash
    ) external view returns (uint256[] memory) {
        return _receiptIdsByClaim[claimHash];
    }

    /**
     * @notice Fetch up to `limit` most recent verification receipts (newest first).
     */
    function getRecentVerifications(
        uint256 limit
    )
        external
        view
        returns (uint256[] memory attestationIds, VerificationReceipt[] memory receipts)
    {
        uint256 total = _receipts.length;
        uint256 count = limit > total ? total : limit;
        attestationIds = new uint256[](count);
        receipts = new VerificationReceipt[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 idx = total - 1 - i;
            attestationIds[i] = idx;
            receipts[i] = _receipts[idx];
        }
    }
}
