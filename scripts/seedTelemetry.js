const { ethers } = require("hardhat");

// Seeds a single telemetry epoch using the hardhat default oracle signer
async function main() {
  const [owner, oracle] = await ethers.getSigners();

  const registryAddress = process.env.REGISTRY_ADDRESS;
  const telemetryAddress = process.env.TELEMETRY_ADDRESS;
  if (!registryAddress || !telemetryAddress) throw new Error("Set REGISTRY_ADDRESS and TELEMETRY_ADDRESS env vars");

  const registry = await ethers.getContractAt("PulseRegistry", registryAddress);
  const telemetry = await ethers.getContractAt("PulseTelemetry", telemetryAddress);

  // Register oracle
  await registry.updateOracleStatus(oracle.address, true);
  console.log("Oracle registered:", oracle.address);

  // Register a project
  const tx = await registry.registerProject(
    "github.com/pulsestack/protocol",
    owner.address,
    owner.address,
    "ipfs://QmSeedMetadata"
  );
  const receipt = await tx.wait();
  const projectId = 1n;
  console.log("Project registered, id:", projectId.toString());

  const epoch = 1n;
  const nonce = 42n;
  const now = BigInt(Math.floor(Date.now() / 1000));
  const expiry = now + 3600n;

  const REPO_TYPEHASH = ethers.keccak256(ethers.toUtf8Bytes(
    "RepoSnapshot(uint256 epoch,uint256 timestamp,uint32 prVelocity,uint32 issueHealthScore,uint32 avgResponseTimeHours,uint32 repoGrowthRate)"
  ));

  const repoData = { epoch, timestamp: now, prVelocity: 18, issueHealthScore: 88, avgResponseTimeHours: 6, repoGrowthRate: 12 };
  const repoSnapshotHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32','uint256','uint256','uint32','uint32','uint32','uint32'],
      [REPO_TYPEHASH, repoData.epoch, repoData.timestamp, repoData.prVelocity, repoData.issueHealthScore, repoData.avgResponseTimeHours, repoData.repoGrowthRate]
    )
  );

  const CONTRIBUTOR_TYPEHASH = ethers.keccak256(ethers.toUtf8Bytes(
    "ContributorSnapshot(uint256 epoch,uint256 timestamp,uint32 commitsCount,uint32 burnoutRiskScore)"
  ));
  const contributors = [owner.address];
  const contributorData = [{ epoch, timestamp: now, commitsCount: 42, burnoutRiskScore: 85 }];

  const contributorSnapshotHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32[]'],
      [[ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32','uint256','uint256','uint32','uint32'],
        [CONTRIBUTOR_TYPEHASH, contributorData[0].epoch, contributorData[0].timestamp, contributorData[0].commitsCount, contributorData[0].burnoutRiskScore]
      ))]]
    )
  );

  const domain = { name: 'PulseStack Telemetry', version: '1.0.0', chainId: 31337, verifyingContract: telemetryAddress };
  const types = {
    EIP712Payload: [
      { name: 'projectId', type: 'uint256' }, { name: 'epoch', type: 'uint256' },
      { name: 'repoSnapshotHash', type: 'bytes32' }, { name: 'contributorSnapshotHash', type: 'bytes32' },
      { name: 'contributors', type: 'address[]' }, { name: 'nonce', type: 'uint256' }, { name: 'expiry', type: 'uint256' }
    ]
  };
  const value = { projectId, epoch, repoSnapshotHash, contributorSnapshotHash, contributors, nonce, expiry };
  const sig = await oracle.signTypedData(domain, types, value);

  await telemetry.commitTelemetry(value, repoData, contributorData, [sig]);
  console.log("Telemetry epoch 1 seeded successfully");
}

main().catch((err) => { console.error(err); process.exit(1); });
