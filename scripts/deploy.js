const hre = require("hardhat");
require("@nomiclabs/hardhat-etherscan");

async function main() {

    const rQNVToken = await hre.ethers.getContractFactory("RQNV");
    const rqnvToken = await rQNVToken.deploy();
    await rqnvToken.deployed();

    const yQNVToken = await hre.ethers.getContractFactory("YQNV");
    const yqnvToken = await yQNVToken.deploy();
    await yqnvToken.deployed();

    const usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    const TreasuryContract = await hre.ethers.getContractFactory("QuinvestTreasury");
    const treasuryContract = await TreasuryContract.deploy(rqnvToken.address, yqnvToken.address, usdtAddress);
    await treasuryContract.deployed();

    console.log(rqnvToken.address);
    console.log(yqnvToken.address);
    console.log(treasuryContract);

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
        address: treasuryContract.address,
        contract: "contracts/QuinvestTreasury.sol:QuinvestTreasury",
        constructorArguments: [rqnvToken.address, yqnvToken.address, usdtAddress],
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});