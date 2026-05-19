// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../libraries/TelemetryTypes.sol";

interface IPulseTelemetry {
    error InvalidSignature();
    error SignatureExpired();
    error NonceReplay();
    error QuorumNotMet();
    error InvalidEpochTransition();

    event TelemetryCommitted(uint256 indexed projectId, uint256 indexed epoch, bytes32 indexed rootHash);

    function commitTelemetry(
        TelemetryTypes.EIP712Payload calldata payload,
        TelemetryTypes.RepoSnapshot calldata repoData,
        TelemetryTypes.ContributorSnapshot[] calldata contributorData,
        bytes[] calldata signatures
    ) external;
}
