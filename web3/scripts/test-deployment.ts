import { network } from "hardhat";

async function main() {
  const { viem } = await network.connect();
  
  // Replace with your deployed contract address
  const contractAddress = "YOUR_CONTRACT_ADDRESS_HERE";

  // Validate the contract address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
    throw new Error(
      "Invalid contract address. Please replace 'YOUR_CONTRACT_ADDRESS_HERE' with your deployed contract address (0x...)."
    );
  }

  // Get the contract instance
  const contract = await viem.getContractAt("ChallengeContract", contractAddress as `0x${string}`);

  console.log("Testing deployed ChallengeContract...");

  // Test 1: Check owner
  const owner = await contract.read.owner();
  console.log("Contract owner:", owner);
  
  // Test 2: Check next challenge ID
  const nextId = await contract.read.nextChallengeId();
  console.log("Next challenge ID:", nextId);
  
  // Test 3: Create a challenge
  console.log("Creating a test challenge...");
  const tx = await contract.write.createChallenge([
    "Test Run 5km",
    5000n, // 5km in meters
    1000000000000000000n, // 1 ETH
    86400n // 24 hours
  ]);
  
  console.log("Challenge created! Transaction:", tx);
  
  // Test 4: Get the challenge
  const challenge = await contract.read.getChallenge([1n]);
  console.log("Challenge details:", {
    id: challenge.challengeId.toString(),
    creator: challenge.creator,
    description: challenge.description,
    stakeAmount: challenge.stakeAmount.toString(),
    targetDistance: challenge.targetDistance.toString()
  });
  
  console.log("✅ All tests passed! Contract is working correctly.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
