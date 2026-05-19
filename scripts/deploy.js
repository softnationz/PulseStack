const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Registry = await ethers.getContractFactory("PulseRegistry");
  const registry = await Registry.deploy(deployer.address);
  await registry.waitForDeployment();
  console.log("PulseRegistry:", await registry.getAddress());

  const Telemetry = await ethers.getContractFactory("PulseTelemetry");
  const telemetry = await Telemetry.deploy(await registry.getAddress(), 1);
  await telemetry.waitForDeployment();
  console.log("PulseTelemetry:", await telemetry.getAddress());

  // Deploy a mock ERC20 for local testing
  const MockToken = await ethers.getContractFactory("MockERC20");
  const token = await MockToken.deploy("PulseUSD", "PUSD", 6);
  await token.waitForDeployment();
  console.log("MockERC20:", await token.getAddress());

  const ActionEngine = await ethers.getContractFactory("PulseActionEngine");
  const engine = await ActionEngine.deploy(
    await registry.getAddress(),
    await telemetry.getAddress(),
    await token.getAddress()
  );
  await engine.waitForDeployment();
  console.log("PulseActionEngine:", await engine.getAddress());
}

main().catch((err) => { console.error(err); process.exit(1); });
