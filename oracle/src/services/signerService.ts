import { ethers } from 'ethers';
import { CONFIG } from '../config/environment';
import { FinalizedEcosystemTelemetry } from './telemetryEngine';

export class SignerService {
  private wallet: ethers.Wallet;

  constructor() {
    this.wallet = new ethers.Wallet(CONFIG.ORACLE_PRIVATE_KEY);
  }

  public async generateEIP712Signature(
    projectId: number,
    epoch: number,
    telemetry: FinalizedEcosystemTelemetry,
    nonce: number
  ) {
    const domain = {
      name: 'PulseStack Telemetry',
      version: '1.0.0',
      chainId: CONFIG.CHAIN_ID,
      verifyingContract: CONFIG.TELEMETRY_CONTRACT_ADDRESS
    };

    const types = {
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

    const now = Math.floor(Date.now() / 1000);

    const repoSnapshotHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'uint256', 'uint256', 'uint32', 'uint32', 'uint32', 'uint32'],
        [
          ethers.keccak256(ethers.toUtf8Bytes("RepoSnapshot(uint256 epoch,uint256 timestamp,uint32 prVelocity,uint32 issueHealthScore,uint32 avgResponseTimeHours,uint32 repoGrowthRate)")),
          epoch, now,
          telemetry.prVelocity, telemetry.issueHealthScore,
          telemetry.avgResponseTimeHours, telemetry.repoGrowthRate
        ]
      )
    );

    const contributorSnapshotHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32[]'],
        [
          telemetry.contributorData.map(c =>
            ethers.keccak256(
              ethers.AbiCoder.defaultAbiCoder().encode(
                ['bytes32', 'uint256', 'uint256', 'uint32', 'uint32'],
                [
                  ethers.keccak256(ethers.toUtf8Bytes("ContributorSnapshot(uint256 epoch,uint256 timestamp,uint32 commitsCount,uint32 burnoutRiskScore)")),
                  epoch, now, c.commitsCount, c.burnoutRiskScore
                ]
              )
            )
          )
        ]
      )
    );

    const expiry = now + 3600;
    const value = {
      projectId, epoch, repoSnapshotHash, contributorSnapshotHash,
      contributors: telemetry.contributors, nonce, expiry
    };

    const signature = await this.wallet.signTypedData(domain, types, value);
    return { value, signature, repoSnapshotHash, contributorSnapshotHash };
  }
}
