import { ethers } from "hardhat";

export interface RepoSnapshotData {
  epoch: bigint;
  timestamp: bigint;
  prVelocity: number;
  issueHealthScore: number;
  avgResponseTimeHours: number;
  repoGrowthRate: number;
}

export interface ContributorSnapshotData {
  epoch: bigint;
  timestamp: bigint;
  commitsCount: number;
  burnoutRiskScore: number;
}

const REPO_TYPEHASH = ethers.keccak256(ethers.toUtf8Bytes(
  "RepoSnapshot(uint256 epoch,uint256 timestamp,uint32 prVelocity,uint32 issueHealthScore,uint32 avgResponseTimeHours,uint32 repoGrowthRate)"
));

const CONTRIBUTOR_TYPEHASH = ethers.keccak256(ethers.toUtf8Bytes(
  "ContributorSnapshot(uint256 epoch,uint256 timestamp,uint32 commitsCount,uint32 burnoutRiskScore)"
));

export function hashRepoSnapshot(repo: RepoSnapshotData): string {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'uint256', 'uint256', 'uint32', 'uint32', 'uint32', 'uint32'],
      [REPO_TYPEHASH, repo.epoch, repo.timestamp, repo.prVelocity, repo.issueHealthScore, repo.avgResponseTimeHours, repo.repoGrowthRate]
    )
  );
}

export function hashContributorSnapshot(c: ContributorSnapshotData): string {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'uint256', 'uint256', 'uint32', 'uint32'],
      [CONTRIBUTOR_TYPEHASH, c.epoch, c.timestamp, c.commitsCount, c.burnoutRiskScore]
    )
  );
}

export function hashContributorArray(snapshots: ContributorSnapshotData[]): string {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32[]'],
      [snapshots.map(hashContributorSnapshot)]
    )
  );
}

export function buildEIP712Domain(chainId: number, verifyingContract: string) {
  return { name: 'PulseStack Telemetry', version: '1.0.0', chainId, verifyingContract };
}

export const EIP712_PAYLOAD_TYPES = {
  EIP712Payload: [
    { name: 'projectId', type: 'uint256' },
    { name: 'epoch', type: 'uint256' },
    { name: 'repoSnapshotHash', type: 'bytes32' },
    { name: 'contributorSnapshotHash', type: 'bytes32' },
    { name: 'contributors', type: 'address[]' },
    { name: 'nonce', type: 'uint256' },
    { name: 'expiry', type: 'uint256' }
  ]
};
