require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
  defaultNetwork: "hardhat",

  paths: {
    artifacts: './src/artifacts',
  },
  networks: {
    hardhat: {},
    mumbai: {
      url: "https://polygon-mumbai.g.alchemy.com/v2/JIGtGieoV-DRZMJZtE3GiKKUlB7JIL6v",
      accounts: [`0x95fda7eeab8021f0a3f897588e37afb04382b08a8119e9c33bf40b631f2e220c`]

    }
  },
  solidity: "0.8.0",
  etherscan: {
    apiKey: "GD1SHMHGW2QF8PCGC5ED7CQ9SD3KYFHCBK",
  },
  gasReporter: {
    currency: 'CHF',
    gasPrice: 21
  },
};