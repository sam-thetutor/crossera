require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable IR compiler to fix "Stack too deep" error
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    crossfi_testnet: {
      url: "https://rpc.testnet.ms/",
      chainId: 4157,
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY.replace(/^0x/, '')}`] : [],
      gasPrice: 500000000000, // 500 gwei - increased based on error message
    },
    crossfi_mainnet: {
      url: "https://rpc.mainnet.ms",
      chainId: 4158,
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY.replace(/^0x/, '')}`] : [],
      gasPrice: 600000000000, // 600 gwei - reasonable gas price
    },
  },
  etherscan: {
    apiKey: {
      crossfi_testnet: "your-crossfi-api-key", // Replace with actual API key when available
      crossfi_mainnet: "your-crossfi-api-key",
    },
    customChains: [
      {
        network: "crossfi_testnet",
        chainId: 4157,
        urls: {
          apiURL: "https://scan.testnet.crossfi.org/api",
          browserURL: "https://scan.testnet.crossfi.org",
        },
      },
      {
        network: "crossfi_mainnet",
        chainId: 4158,
        urls: {
          apiURL: "https://scan.crossfi.org/api",
          browserURL: "https://scan.crossfi.org",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};
