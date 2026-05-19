import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import {
  hashRepoSnapshot,
  hashContributorArray,
  buildEIP712Domain,
  EIP712_PAYLOAD_TYPES,
  RepoSnapshotData,
  ContributorSnapshotData
} from "./helpers/eip712";

describe("PulseStack Architecture Integration", function () {
  let registry: any;
  let telemetry: any;
  let owner: Signer;
  let oracle: Signer;
  let contributor: Signer;

  beforeEach(async function () {
    [owner, oracle, contributor] = await ethers.getSigners();

    const RegistryFactory = await ethers.getContractFactory("PulseRegistry");
    registry = await RegistryFactory.deploy(await owner.getAddress());

    const TelemetryFactory = await ethers.getContractFactory("PulseTelemetry");
    telemetry = await TelemetryFactory.deploy(await registry.getAddress(), 1);

    await registry.updateOracleStatus(await oracle.getAddress(), true);
  });

  it("Should correctly manage oracle authorization", async function () {
    expect(await registry.isOracle(await oracle.getAddress())).to.equal(true);
    expect(await registry.isOracle(await contributor.getAddress())).to.equal(false);
  });

  it("Should register a project and retrieve it", async function () {
    await registry.registerProject(
      "github.com/pulsestack/protocol",
      await owner.getAddress(),
      await owner.getAddress(),
      "ipfs://QmTest"
    );
    const project = await registry.getProject(1);
    expect(project.repoUrl).to.equal("github.com/pulsestack/protocol");
    expect(project.isActive).to.equal(true);
  });

  it("Should commit telemetry with valid oracle signature", async function () {
    await registry.registerProject(
      "github.com/pulsestack/protocol",
      await owner.getAddress(),
      await owner.getAddress(),
      "ipfs://QmTest"
    );

    const projectId = 1n;
    const epoch = 1n;
    const nonce = 99n;
    const now = BigInt(Math.floor(Date.now() / 1000));
    const expiry = now + 3600n;

    const repoData: RepoSnapshotData = {
      epoch, timestamp: now,
      prVelocity: 18, issueHealthScore: 88,
      avgResponseTimeHours: 6, repoGrowthRate: 12
    };

    const contributorAddr = await contributor.getAddress();
    const contributorSnapshots: ContributorSnapshotData[] = [{
      epoch, timestamp: now, commitsCount: 42, burnoutRiskScore: 85
    }];

    const repoSnapshotHash = hashRepoSnapshot(repoData);
    const contributorSnapshotHash = hashContributorArray(contributorSnapshots);

    const domain = buildEIP712Domain(31337, await telemetry.getAddress());
    const value = {
      projectId, epoch, repoSnapshotHash, contributorSnapshotHash,
      contributors: [contributorAddr], nonce, expiry
    };

    const sig = await (oracle as any).signTypedData(domain, EIP712_PAYLOAD_TYPES, value);

    await expect(
      telemetry.commitTelemetry(value, repoData, contributorSnapshots, [sig])
    ).to.emit(telemetry, "TelemetryCommitted").withArgs(projectId, epoch, (v: any) => !!v);

    expect(await telemetry.latestEpochs(projectId)).to.equal(epoch);
  });

  it("Should reject replay of used nonce", async function () {
    await registry.registerProject(
      "github.com/pulsestack/protocol",
      await owner.getAddress(),
      await owner.getAddress(),
      "ipfs://QmTest"
    );

    const projectId = 1n;
    const epoch = 1n;
    const nonce = 7n;
    const now = BigInt(Math.floor(Date.now() / 1000));
    const expiry = now + 3600n;

    const repoData: RepoSnapshotData = {
      epoch, timestamp: now,
      prVelocity: 18, issueHealthScore: 88,
      avgResponseTimeHours: 6, repoGrowthRate: 12
    };
    const contributorAddr = await contributor.getAddress();
    const contributorSnapshots: ContributorSnapshotData[] = [{
      epoch, timestamp: now, commitsCount: 42, burnoutRiskScore: 85
    }];

    const repoSnapshotHash = hashRepoSnapshot(repoData);
    const contributorSnapshotHash = hashContributorArray(contributorSnapshots);
    const domain = buildEIP712Domain(31337, await telemetry.getAddress());
    const value = {
      projectId, epoch, repoSnapshotHash, contributorSnapshotHash,
      contributors: [contributorAddr], nonce, expiry
    };
    const sig = await (oracle as any).signTypedData(domain, EIP712_PAYLOAD_TYPES, value);

    await telemetry.commitTelemetry(value, repoData, contributorSnapshots, [sig]);

    // Second commit with same nonce must revert
    const value2 = { ...value, epoch: 2n };
    const sig2 = await (oracle as any).signTypedData(domain, EIP712_PAYLOAD_TYPES, value2);
    await expect(
      telemetry.commitTelemetry(value, repoData, contributorSnapshots, [sig])
    ).to.be.revertedWithCustomError(telemetry, "NonceReplay");
  });
});
