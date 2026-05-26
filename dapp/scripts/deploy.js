const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("⚡ A publicar contratos com a conta:", deployer.address);

  
  const DecentralizedFinance = await hre.ethers.getContractFactory("DecentralizedFinance");
  const dex = await DecentralizedFinance.deploy(1000, 60, 10, hre.ethers.parseEther("0.01"), 86400);
  
  await dex.waitForDeployment();
  const dexAddress = await dex.getAddress();
  console.log("Contrato DEX publicado no endereço:", dexAddress);

  //  Deploy do NFT Market
  const NFTPawningMarketplace = await hre.ethers.getContractFactory("NFTPawningMarketplace");
  const nftMarket = await NFTPawningMarketplace.deploy(dexAddress);
  
  await nftMarket.waitForDeployment();
  const nftMarketAddress = await nftMarket.getAddress();
  console.log(" Contrato NFT publicado no endereço:", nftMarketAddress);

  // 3. EXPORTAR PARA O BACKEND (A Mágica da Web2.5)
  saveToBackend(dexAddress, nftMarketAddress);
}

function saveToBackend(dexAddr, nftAddr) {
 
  const backendConfigPath = path.join(__dirname, "..", "backend", "contractConfig.json");
  const dexArtifact = hre.artifacts.readArtifactSync("DecentralizedFinance");
  const nftMarketArtifact = hre.artifacts.readArtifactSync("NFTPawningMarketplace");

  const networkConfig = {
    DEX_ADDRESS: dexAddr,
    NFT_MARKET_ADDRESS: nftAddr,
    DEX_ABI: dexArtifact.abi,
    NFT_MARKET_ABI: nftMarketArtifact.abi
  };

  fs.writeFileSync(backendConfigPath, JSON.stringify(networkConfig, null, 2));
  console.log(" Configurações exportadas com sucesso para o Node.js!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});