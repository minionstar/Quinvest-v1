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

  // const rqnvToken_address = "0x4f19845D322eEA728fAd44fc10155d8e9074d268"
  // const yqnvToken_address = "0x904Bd643b9652b012fe1c55594e4F3adb58A213F"
  // const usdtToken_address = "0xd9d514310b75FFF183fE5e24A8B8Bb9C82AE4D53"

  // const TreasuryContract = await hre.ethers.getContractFactory("QuinvestTreasury");
  // const treasuryContract = await TreasuryContract.deploy(rqnvToken_address, yqnvToken_address, usdtToken_address);
  // await treasuryContract.deployed();

   


  const TreasuryContract = await hre.ethers.getContractFactory("QuinvestTreasury");
  const treasuryContract = await TreasuryContract.deploy(rqnvToken.address, yqnvToken.address, usdtToken.address);
  await treasuryContract.deployed();

  console.log(rqnvToken.address);
  console.log(yqnvToken.address);
  console.log(usdtToken.address);

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