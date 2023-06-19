// https://eth-sepolia.g.alchemy.com/v2/wEdbv_KpwQ9lVc25JKWnd150JnhNhwi9

require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.0",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/wEdbv_KpwQ9lVc25JKWnd150JnhNhwi9",
      accounts: [
        "adabe4f2d31a59d0da6578872ace71c950506cbb6ff5ba7cbf073077cfc8610b",
      ],
    },
  },
};
