const hre = require("hardhat");

async function main() {
  const memoryPackAddress = "0xYOUR_DEPLOYED_ADDRESS"; // replace with actual address
  const MemoryPack = await hre.ethers.getContractFactory("MemoryPack");
  const memoryPack = await MemoryPack.attach(memoryPackAddress);

  // Get first signer from Hardhat node
  const [owner] = await hre.ethers.getSigners();

  // Mint a token to that account
  const tx = await memoryPack.safeMint(owner.address, "cid123");
  await tx.wait();

  console.log("Token minted to:", owner.address);
}

main().catch(console.error);
