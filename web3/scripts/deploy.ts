import hre from "hardhat";
import { parseEther } from "viem";

async function main() {
  console.log("Starting deployment...");
  
  // Check if viem is available
  if (!hre.viem) {
    throw new Error("Viem plugin not loaded. Make sure @nomicfoundation/hardhat-toolbox-viem is installed and imported in hardhat.config.ts");
  }

  // Get public client
  const publicClient = await hre.viem.getPublicClient();
  console.log("Connected to network:", publicClient.chain.name);

  // Get deployer account
  const [deployer] = await hre.viem.getWalletClients();
  console.log("Deploying contracts with account:", deployer.account.address);

  // Deploy contract
  const contract = await hre.viem.deployContract("ChallengeContract");

  console.log("✅ Contract deployed at:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});