import { Contract } from "ethers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { impersonateAccount, mine } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import ERC20Abi from "./abi/ERC20.json";
import { deploySC, toWei } from "./utils/helpers";
import { DAI_DECIMAL } from "./utils/constants";

describe("Start AaveDaiProxy", async () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let aaveDaiProxy: Contract;
  let aaveDaiMock: Contract;

  let daiToken: Contract;
  let aDaiToken: Contract;

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const POOL_ADDRESS = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951" ; 
  const ADAI_ADDRESS = '0x29598b72eb5CeBd806C5dCD549490FdA35B13cD8';
  const DAI_ADDRESS = '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357';
  const DAI_HOLDER = '0x0F97F07d7473EFB5c846FB2b6c201eC1E316E994';
  const DAI10 = toWei(10, DAI_DECIMAL);
  const DAI500 = toWei(500, DAI_DECIMAL);

  beforeEach(async () => {
    [alice, bob] = await ethers.getSigners();

    const AaveDaiProxy = await ethers.getContractFactory("AaveDaiProxy");
    aaveDaiProxy = await AaveDaiProxy.deploy(DAI_ADDRESS, ADAI_ADDRESS, POOL_ADDRESS);

    daiToken = await ethers.getContractAt(ERC20Abi, DAI_ADDRESS);
    aDaiToken = await ethers.getContractAt(ERC20Abi, ADAI_ADDRESS);
    await impersonateAccount(DAI_HOLDER);
    await alice.sendTransaction({ value: toWei(1, 18), to: DAI_HOLDER });
    const daiHolder = await ethers.getSigner(DAI_HOLDER);
    await daiToken.connect(daiHolder).transfer(alice.address, toWei(1000, DAI_DECIMAL));

    await aaveDaiProxy.deployed();
  });

  describe("Unit Test AaveDaiProxy contract", () => {
    describe('Deploy Test', () => {
      it('Test',async () => {
        const AaveDaiProxy = await ethers.getContractFactory("AaveDaiProxy");
        await expect(
          AaveDaiProxy.deploy(ZERO_ADDRESS, DAI_ADDRESS, POOL_ADDRESS),
        ).to.be.revertedWith("Invalid");
      });    
    });

    describe("Deposit Func", () => {
      it("If totalShares is zero", async () => {
        await daiToken.approve(aaveDaiProxy.address, DAI10);

        await aaveDaiProxy.deposit(1, DAI10);

        expect(
          await aDaiToken.balanceOf(aaveDaiProxy.address),
        ).to.be.equal(DAI10);
      });

      it("If totalShares is not zero", async () => {
        await daiToken.approve(aaveDaiProxy.address, DAI500);
        await aaveDaiProxy.deposit(1, DAI10);

        expect(
          await aDaiToken.balanceOf(aaveDaiProxy.address),
        ).to.be.equal(DAI10);

        await aaveDaiProxy.deposit(1, DAI10);

        expect(
          await aDaiToken.balanceOf(aaveDaiProxy.address),
        ).to.be.equal(await aaveDaiProxy.getAmountOfTokenId(1));
      });
    });

    describe("withdraw Func", () => {
      it("If Invalid shares", async () => {
        await daiToken.approve(aaveDaiProxy.address, DAI10);
        await aaveDaiProxy.deposit(1, DAI10);
        await expect(
          aaveDaiProxy.withdraw(2, 100)
        ).to.be.revertedWith("Invalid shares");
      });

      it("If not Invalid shares", async () => {
        await daiToken.approve(aaveDaiProxy.address, DAI500);
        await aaveDaiProxy.deposit(1, DAI10);
        await aaveDaiProxy.deposit(1, DAI10);

        const shares = await aaveDaiProxy.amountToShares(DAI10.mul(2));
        await aaveDaiProxy.withdraw(1, shares);
      });
    });

    describe("withdrawToken Func", () => {
      it("If Invalid", async () => {
        await daiToken.approve(aaveDaiProxy.address, DAI10);
        await aaveDaiProxy.deposit(1, DAI10);
        await expect(
          aaveDaiProxy.withdrawToken(1, DAI500)
        ).to.be.revertedWith("Invalid");
      });

      it("If not Invalid", async () => {
        await daiToken.approve(aaveDaiProxy.address, DAI10);
        await aaveDaiProxy.deposit(1, DAI10);
        await aaveDaiProxy.withdrawToken(1, DAI10);
      });
    });


    describe("withdrawAll Func", () => {
      it("If withdrawAll", async () => {
        await daiToken.approve(aaveDaiProxy.address, DAI10);
        await aaveDaiProxy.deposit(1, DAI10);
        await aaveDaiProxy.withdrawAll(1);
      });
    });

  });
});
