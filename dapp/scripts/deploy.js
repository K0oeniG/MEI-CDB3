const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("A publicar contratos com a conta:", deployer.address);

  const DecentralizedFinance = await hre.ethers.getContractFactory("DecentralizedFinance");
  const dex = await DecentralizedFinance.deploy(1000, 60, 10, hre.ethers.parseEther("0.01"), 86400);
  await dex.waitForDeployment();
  const dexAddress = await dex.getAddress();
  console.log("Contrato DEX publicado no endereço:", dexAddress);

  const NFTPawningMarketplace = await hre.ethers.getContractFactory("NFTPawningMarketplace");
  const nftMarket = await NFTPawningMarketplace.deploy(dexAddress);
  await nftMarket.waitForDeployment();
  console.log("Contrato NFT publicado no endereço:", await nftMarket.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});