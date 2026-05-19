const { ethers } = require("hardhat");

// Simulates a contributor with high burnout score claiming a wellness stipend
async function main() {
  const actionEngineAddress = process.env.ACTION_ENGINE_ADDRESS;
  const projectId = process.env.PROJECT_ID || 1;
  if (!actionEngineAddress) throw new Error("Set ACTION_ENGINE_ADDRESS env var");

  const [, , contributor] = await ethers.getSigners();
  const engine = await ethers.getContractAt("PulseActionEngine", actionEngineAddress);

  console.log("Contributor:", contributor.address);
  console.log("Claiming wellness stipend for project:", projectId);

  const tx = await engine.connect(contributor).claimWellnessStipend(projectId);
  const receipt = await tx.wait();
  console.log("Stipend claimed. Tx:", receipt.hash);
}

main().catch((err) => { console.error(err); process.exit(1); });
