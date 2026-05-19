// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./interfaces/IPulseTelemetry.sol";
import "./PulseRegistry.sol";

contract PulseTelemetry is IPulseTelemetry, EIP712 {
    using ECDSA for bytes32;

    bytes32 public constant PAYLOAD_TYPEHASH = keccak256(
        "EIP712Payload(uint256 projectId,uint256 epoch,bytes32 repoSnapshotHash,bytes32 contributorSnapshotHash,address[] contributors,uint256 nonce,uint256 expiry)"
    );
    bytes32 public constant REPO_SNAPSHOT_TYPEHASH = keccak256(
        "RepoSnapshot(uint256 epoch,uint256 timestamp,uint32 prVelocity,uint32 issueHealthScore,uint32 avgResponseTimeHours,uint32 repoGrowthRate)"
    );
    bytes32 public constant CONTRIBUTOR_SNAPSHOT_TYPEHASH = keccak256(
        "ContributorSnapshot(uint256 epoch,uint256 timestamp,uint32 commitsCount,uint32 burnoutRiskScore)"
    );

    PulseRegistry public immutable registry;
    uint256 public requiredQuorum;

    mapping(uint256 => uint256) public latestEpochs;
    mapping(uint256 => mapping(uint256 => TelemetryTypes.RepoSnapshot)) private _repoHistory;
    mapping(uint256 => mapping(uint256 => mapping(address => TelemetryTypes.ContributorSnapshot))) private _contributorHistory;
    mapping(uint256 => bool) public executedNonces;

    constructor(address _registry, uint256 _quorum) EIP712("PulseStack Telemetry", "1.0.0") {
        registry = PulseRegistry(_registry);
        requiredQuorum = _quorum;
    }

    function setQuorum(uint256 newQuorum) external {
        require(registry.hasRole(registry.GOVERNANCE_ROLE(), msg.sender), "Denied");
        requiredQuorum = newQuorum;
    }

    function commitTelemetry(
        TelemetryTypes.EIP712Payload calldata payload,
        TelemetryTypes.RepoSnapshot calldata repoData,
        TelemetryTypes.ContributorSnapshot[] calldata contributorData,
        bytes[] calldata signatures
    ) external override {
        if (block.timestamp > payload.expiry) revert SignatureExpired();
        if (executedNonces[payload.nonce]) revert NonceReplay();
        if (signatures.length < requiredQuorum) revert QuorumNotMet();
        if (payload.epoch <= latestEpochs[payload.projectId]) revert InvalidEpochTransition();
        if (payload.contributors.length != contributorData.length) revert InvalidSignature();

        bytes32 repoHash = keccak256(abi.encode(
            REPO_SNAPSHOT_TYPEHASH,
            repoData.epoch, repoData.timestamp, repoData.prVelocity,
            repoData.issueHealthScore, repoData.avgResponseTimeHours, repoData.repoGrowthRate
        ));
        if (repoHash != payload.repoSnapshotHash) revert InvalidSignature();

        executedNonces[payload.nonce] = true;
        latestEpochs[payload.projectId] = payload.epoch;

        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            PAYLOAD_TYPEHASH,
            payload.projectId,
            payload.epoch,
            payload.repoSnapshotHash,
            payload.contributorSnapshotHash,
            keccak256(abi.encodePacked(payload.contributors)),
            payload.nonce,
            payload.expiry
        )));

        address lastSigner = address(0);
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = digest.recover(signatures[i]);
            if (!registry.isOracle(signer)) revert InvalidSignature();
            if (signer <= lastSigner) revert InvalidSignature();
            lastSigner = signer;
        }

        _repoHistory[payload.projectId][payload.epoch] = repoData;
        for (uint256 i = 0; i < payload.contributors.length; i++) {
            _contributorHistory[payload.projectId][payload.epoch][payload.contributors[i]] = contributorData[i];
        }

        emit TelemetryCommitted(payload.projectId, payload.epoch, digest);
    }

    function getRepoSnapshot(uint256 projectId, uint256 epoch) external view returns (TelemetryTypes.RepoSnapshot memory) {
        return _repoHistory[projectId][epoch];
    }

    function getContributorSnapshot(uint256 projectId, uint256 epoch, address contributor) external view returns (TelemetryTypes.ContributorSnapshot memory) {
        return _contributorHistory[projectId][epoch][contributor];
    }
}
