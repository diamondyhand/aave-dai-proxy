import { Contract } from "ethers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import ERC20Abi from "./abi/ERC20.json";

describe("Start StrategyAaveDaiV3", async () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let strategyAaveDaiV3: Contract;
  beforeEach(async () => {
    [alice, bob] = await ethers.getSigners();
    const StrategyAaveDaiV3 = await ethers.getContractFactory("StrategyAaveDaiV3");
  });

  describe("Unit Test", () => {
    describe("Deposit", () => {
    });

  });
});
