const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
require("hardhat-gas-reporter");


describe("test QNV token", function () {
    let accounts;
    let rqnvToken;
    let yqnvToken;
    let usdtToken;
    let treasury;
    let owner;
    let user;

    before(async function () {
        accounts = await ethers.getSigners();
        owner = accounts[0];
        user = accounts[1];
    })

    beforeEach(async function () {

        //deploy rqnv token
        const rQnvToken = await ethers.getContractFactory("RQNV");
        rqnvToken = await rQnvToken.deploy();
        await rqnvToken.deployed();
        console.log("rQNV token successfully deployed to ", rqnvToken.address);

        //deploy yqnv token
        const yQnvToken = await ethers.getContractFactory("YQNV");
        yqnvToken = await yQnvToken.deploy();
        await yqnvToken.deployed();
        console.log("yQNV token successfully deployed to ", yqnvToken.address);

        //deploy moc usdt token
        const UsdtToken = await ethers.getContractFactory("MocUSDT");
        usdtToken = await UsdtToken.deploy();
        await usdtToken.deployed();
        console.log("Moc USDT token successfully deployed to ", usdtToken.address);
        

        //deploy treasury contract
        const TreasuryContract = await ethers.getContractFactory("QuinvestTreasury");
        treasuryContract = await TreasuryContract.deploy(rqnvToken.address, yqnvToken.address, usdtToken.address);
        await treasuryContract.deployed();
        console.log("treasury contract was successfully deployed to ", treasuryContract.address);

        await usdtToken.connect(owner).transfer(treasuryContract.address, ethers.utils.parseEther("100"));
    })

    it("set the treasury as an admin", async function () {
        await rqnvToken.connect(owner).updateAdmin(owner.address);
        expect(await rqnvToken.admin()).to.be.equal(owner.address);

        await yqnvToken.connect(owner).updateAdmin(owner.address);
        expect(await yqnvToken.admin()).to.be.equal(owner.address);
    })

    it("test stake and claim tokens", async function () {
        await rqnvToken.connect(owner).updateAdmin(treasuryContract.address);
        expect(await rqnvToken.admin()).to.be.equal(treasuryContract.address);

        await yqnvToken.connect(owner).updateAdmin(treasuryContract.address);
        expect(await yqnvToken.admin()).to.be.equal(treasuryContract.address);

        //send some Moc USDT to user for test
        await usdtToken.connect(owner).transfer(user.address, ethers.utils.parseEther("100"));

        //approve usdt to the treasury contract.
        await usdtToken.connect(user).approve(treasuryContract.address, ethers.utils.parseEther("10"));
        expect(await usdtToken.allowance(user.address, treasuryContract.address)).to.be.equal(ethers.utils.parseEther("10"));

        const allowedAmount = await usdtToken.allowance(user.address, treasuryContract.address);
        console.log("allowed balance : ", allowedAmount);

        await treasuryContract.connect(user).stakeToken(allowedAmount, 1);
        
        //check expired time
        console.log("staked info:", await treasuryContract.connect(user).getStakedInfo());

        //check user's balance of yQNV token
        console.log(ethers.utils.formatEther(allowedAmount));
        expect(await yqnvToken.balanceOf(user.address)).to.be.equal(parseEther((ethers.utils.formatEther(allowedAmount)).toString()));

        await treasuryContract.connect(user).withdrawAll();
    })

});