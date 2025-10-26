import { network } from 'hardhat';
import { ethers } from 'ethers';

/**
 * Create Test Challenge for Verification Testing
 * 
 * This script creates a test challenge that we can use to test
 * the verification flow with the real oracle.
 */

const CONTRACT_ADDRESS = '0xe38d8f585936c60ecb7bfae7297457f6a35058bb';

async function main() {
  console.log('🏃 Creating test challenge for verification...\n');

  try {
    // Connect to network
    const viem = (await network.connect()) as any;
    const publicClient = await viem.viem.getPublicClient();
    const [deployer] = await viem.viem.getWalletClients();

    const chainId = await publicClient.getChainId();
    console.log('✅ Connected to chain:', chainId);
    console.log('   Deployer:', deployer.account.address);

    // Verify we're on Sepolia
    if (Number(chainId) !== 11155111) {
      throw new Error(`Wrong network! Expected Sepolia (11155111), got ${chainId}`);
    }

    // Get contract instance
    const contract = await viem.viem.getContractAt('ChallengeContract', CONTRACT_ADDRESS);
    console.log('✅ Contract loaded at:', CONTRACT_ADDRESS);

    // Create test challenge
    const now = Math.floor(Date.now() / 1000);
    const duration = 7 * 24 * 60 * 60; // 7 days in seconds
    
    const challengeData = {
      description: "Test 5km Run Challenge - Verification Demo",
      targetDistance: 5000, // 5km in meters
      stakeAmount: ethers.parseEther("0.01"), // 0.01 ETH
      duration: BigInt(duration)
    };

    console.log('📝 Challenge details:');
    console.log('   Description:', challengeData.description);
    console.log('   Target Distance:', challengeData.targetDistance, 'meters');
    console.log('   Stake Amount:', ethers.formatEther(challengeData.stakeAmount), 'ETH');
    console.log('   Duration:', duration, 'seconds (7 days)');

    // Create challenge
    console.log('\n📤 Creating challenge...');
    const tx = await contract.createChallenge(
      challengeData.description,
      challengeData.targetDistance,
      challengeData.stakeAmount,
      challengeData.duration,
      { value: challengeData.stakeAmount }
    );

    console.log('⏳ Transaction submitted:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Challenge created!');
    console.log('   Block:', receipt.blockNumber);
    console.log('   Gas used:', receipt.gasUsed.toString());

    // Get the challenge ID from events
    const createEvent = receipt.logs.find(log => {
      try {
        const decoded = contract.interface.parseLog(log);
        return decoded?.name === 'ChallengeCreated';
      } catch {
        return false;
      }
    });

    if (createEvent) {
      const decoded = contract.interface.parseLog(createEvent);
      const challengeId = decoded?.args.challengeId;
      console.log('\n🎯 Challenge ID:', challengeId.toString());
      
      // Join the challenge
      console.log('\n📝 Joining challenge...');
      const joinTx = await contract.joinChallenge(challengeId, { value: challengeData.stakeAmount });
      console.log('⏳ Join transaction submitted:', joinTx.hash);
      const joinReceipt = await joinTx.wait();
      console.log('✅ Joined challenge!');
      console.log('   Block:', joinReceipt.blockNumber);
      console.log('   Gas used:', joinReceipt.gasUsed.toString());

      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║        ✅ TEST CHALLENGE READY!                ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log(`\n📋 Challenge ID: ${challengeId}`);
      console.log(`📝 Description: ${challengeData.description}`);
      console.log(`🎯 Target: ${challengeData.targetDistance}m`);
      console.log(`💰 Stake: ${ethers.formatEther(challengeData.stakeAmount)} ETH`);
      console.log(`⏰ Duration: ${duration} seconds (7 days)`);
      console.log(`\n🔗 View on Etherscan:`);
      console.log(`   https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`);
      console.log(`\n🧪 Test verification with:`);
      console.log(`   Challenge ID: ${challengeId}`);
      console.log(`   User Address: ${deployer.account.address}`);
    }

  } catch (error) {
    console.error('❌ Error creating test challenge:', error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
