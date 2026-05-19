// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library TelemetryTypes {
    struct RepoSnapshot {
        uint256 epoch;
        uint256 timestamp;
        uint32 prVelocity;
        uint32 issueHealthScore;
        uint32 avgResponseTimeHours;
        uint32 repoGrowthRate;
    }

    struct ContributorSnapshot {
        uint256 epoch;
        uint256 timestamp;
        uint32 commitsCount;
        uint32 burnoutRiskScore;
    }

    struct EIP712Payload {
        uint256 projectId;
        uint256 epoch;
        bytes32 repoSnapshotHash;
        bytes32 contributorSnapshotHash;
        address[] contributors;
        uint256 nonce;
        uint256 expiry;
    }
}
