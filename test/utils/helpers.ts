import hre, { ethers } from "hardhat";
import { BigNumber } from "ethers";

export const timeTravel = async (seconds: number) => {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
};

export const getTimeStamp = async () => {
  const blockNumber = await hre.network.provider.send("eth_blockNumber");
  const blockTimestamp = (await hre.network.provider.send("eth_getBlockByNumber", [blockNumber, false])).timestamp;
  return parseInt(blockTimestamp.slice(2), 16);
};

export const getLatestBlockTimestamp = async (): Promise<number> => {
  const latestBlock = await ethers.provider.getBlock("latest");
  return latestBlock.timestamp;
};

export const deploySC = async (scName: string, params: any) => {
  const contract = await ethers.getContractFactory(scName);
  const SC = await contract.deploy(...params);
  await SC.deployed();
  return SC;
};

export const toDAI = (amount: number, decimal: number) => {
  let newAmount: BigNumber;
  newAmount = BigNumber.from(amount);
  return newAmount.mul(BigNumber.from("10").pow(decimal));
};

export const impersonateAccount = async (address: string) => {
  return await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address],
  });
};
