// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  // 1. Get the contract factory
  const MemoryPack = await hre.ethers.getContractFactory("MemoryPack");

  // 2. Deploy the contract
  const memoryPack = await MemoryPack.deploy(); // no .deployed() needed

  // 3. Wait for deployment transaction to be mined
  await memoryPack.waitForDeployment?.(); // optional in newer Hardhat versions

  console.log("MemoryPack deployed to:", memoryPack.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
