const { expect } = require("chai");
const { parseEther } = require("ethers");
const { ethers } = require("hardhat");

describe("Attack", function () {
    it("Should empty the balance of the good contract", async function () {
        // Deploy the good contract
        const goodContractFactory = await ethers.getContractFactory(
            "GoodContract"
        );
        const goodContract = await goodContractFactory.deploy();
        await goodContract.waitForDeployment();

        //Deploy the bad contract
        const badContractFactory = await ethers.getContractFactory(
            "BadContract"
        );
        const badContract = await badContractFactory.deploy(
            goodContract.getAddress()
        );
        await badContract.waitForDeployment();

        // Get two addresses, treat one as innocent user and one as attacker
        const [_, innocentAddress, attackerAddress] = await ethers.getSigners();

        // Innocent User deposits 10 ETH into GoodContract
        let tx = await goodContract.connect(innocentAddress).addBalance({
            value: parseEther("10"),
        });
        await tx.wait();

        // Check that at this point the GoodContract's balance is 10 ETH
        let balanceETH = await ethers.provider.getBalance(
            goodContract.getAddress()
        );
        expect(balanceETH).to.equal(parseEther("10"));

        // Attacker calls the `attack` function on BadContract
        // and sends 1 ETH
        tx = await badContract.connect(attackerAddress).attack({
            value: parseEther("1"),
        });
        await tx.wait();

        // Balance of the GoodContract's address is now zero
        balanceETH = await ethers.provider.getBalance(
            goodContract.getAddress()
        );
        expect(balanceETH).to.equal(BigInt("0"));

        // Balance of BadContract is now 11 ETH (10 ETH stolen + 1 ETH from attacker)
        balanceETH = await ethers.provider.getBalance(badContract.getAddress());
        expect(balanceETH).to.equal(parseEther("11"));
    });
});
