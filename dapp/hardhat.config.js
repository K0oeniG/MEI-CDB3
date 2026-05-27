require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.30",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1        // mínimo = bytecode mais pequeno
      },
      viaIR: true,     // reduz ainda mais o tamanho
      evmVersion: "cancun"
    }
  },
  paths: {
    contracts: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};