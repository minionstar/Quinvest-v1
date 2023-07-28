const hre = require("hardhat");
require("@nomiclabs/hardhat-etherscan");

async function main() {
  
  const rQNVToken = await hre.ethers.getContractFactory("RQNV");
  const rqnvToken = await rQNVToken.deploy();
  await rqnvToken.deployed();

  const yQNVToken = await hre.ethers.getContractFactory("YQNV");
  const yqnvToken = await yQNVToken.deploy();
  await yqnvToken.deployed();

  const UsdtToken = await hre.ethers.getContractFactory("MocUSDT");
  const usdtToken = await UsdtToken.deploy();
  await usdtToken.deployed();

  const TreasuryContract = await hre.ethers.getContractFactory("QuinvestTreasury");
  const treasuryContract = await TreasuryContract.deploy(rqnvToken.address, yqnvToken.address, usdtToken.address);
    await treasuryContract.deployed();

  console.log(rqnvToken.address);
  console.log(yqnvToken.address);
  console.log(usdtToken.address);
  console.log(treasuryContract.address);

  await hre.run("verify:verify", {
    address: rqnvToken.address,
    contract: "contracts/rQNV.sol:RQNV",
    constructorArguments: [],
  });

  await hre.run("verify:verify", {
    address: yqnvToken.address,
    contract: "contracts/yQNV.sol:YQNV",
    constructorArguments: [],
  });


  await hre.run("verify:verify", {
    address: usdtToken.address,
    contract: "contracts/MocUSDT.sol:MocUSDT",
    constructorArguments: [],
  });

  await hre.run("verify:verify", {
    address: treasuryContract.address,
    contract: "contracts/QuinvestTreasury.sol:QuinvestTreasury",
    constructorArguments: [rqnvToken.address, yqnvToken.address, usdtToken.address],
  });

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});