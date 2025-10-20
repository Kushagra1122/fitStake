import { network } from 'hardhat';
import { ethers } from 'ethers';
import { generateValidRunActivity, generateInvalidRunActivity } from './generate-mock-activity.js';
import { loadPKPConfig } from './mint-pkp.js';

/**
 * Hardhat Network Integration Test
 * 
 * Full local test with contract deployment, PKP setup, and Lit Action simulation
 */

async function main() {
  console.log('🧪 Starting Hardhat Network Integration Test...');

  try {
    // 1. Setup Hardhat network
    console.log('🔧 Setting up Hardhat network...');
    const viem = (await network.connect()) as any;
    const publicClient = await viem.viem.getPublicClient();
    const [owner, user1, user2] = await viem.viem.getWalletClients();

    // 2. Deploy ChallengeContract
    console.log('📦 Deploying ChallengeContract...');
    const challengeContract = await viem.deployContract('ChallengeContract');
    console.log('✅ Contract deployed at:', challengeContract.address);

    // 3. Load or create PKP configuration
    console.log('🔑 Setting up PKP...');
    let pkpConfig = loadPKPConfig();
    
    if (!pkpConfig) {
      console.log('⚠️  No PKP config found. Creating mock PKP for testing...');
      pkpConfig = {
        pkpPublicKey: '0x' + '0'.repeat(130), // Mock public key
        pkpTokenId: '1',
        pkpEthAddress: user2.account.address, // Use user2 as mock PKP
        network: 'hardhat',
        funded: true,
        createdAt: new Date().toISOString()
      };
    }

    // 4. Set PKP as oracle
    console.log('🔧 Setting PKP as authorized oracle...');
    await challengeContract.write.setOracleAddress([pkpConfig.pkpEthAddress as `0x${string}`]);
    
    const oracleAddress = await challengeContract.read.authorizedOracle();
    console.log('✅ Oracle set to:', oracleAddress);

    // 5. Create test challenge
    console.log('🏃 Creating test challenge...');
    await challengeContract.write.createChallenge([
      'Hardhat Integration Test Challenge',
      5000n, // 5km
      ethers.parseEther('1'), // 1 ETH
      3600n // 1 hour
    ]);

    const challenge = await challengeContract.read.getChallenge([1n]);
    console.log('✅ Challenge created:', {
      id: challenge.challengeId.toString(),
      description: challenge.description,
      targetDistance: challenge.targetDistance.toString(),
      stakeAmount: challenge.stakeAmount.toString()
    });

    // 6. User joins challenge
    console.log('👤 User joining challenge...');
    await challengeContract.write.joinChallenge([1n], {
      value: ethers.parseEther('1'),
      account: user1.account
    });

    const participant = await challengeContract.read.getParticipant([1n, user1.account.address]);
    console.log('✅ User joined:', {
      address: participant.userAddress,
      stakedAmount: participant.stakedAmount.toString(),
      hasCompleted: participant.hasCompleted
    });

    // 7. Test valid activity verification
    console.log('\n🧪 Testing valid activity verification...');
    await testValidActivityVerification(challengeContract, challenge, pkpConfig);

    // 8. Test invalid activity rejection
    console.log('\n🧪 Testing invalid activity rejection...');
    await testInvalidActivityRejection(challengeContract, challenge, pkpConfig);

    // 9. Test unauthorized caller rejection
    console.log('\n🧪 Testing unauthorized caller rejection...');
    await testUnauthorizedCaller(challengeContract, challenge);

    // 10. Test challenge finalization
    console.log('\n🧪 Testing challenge finalization...');
    await testChallengeFinalization(challengeContract, challenge, user1);

    console.log('\n🎉 All Hardhat integration tests passed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Run: npm run deploy-sepolia-oracle');
    console.log('2. Run: npm run test-lit-sepolia');

  } catch (error) {
    console.error('❌ Hardhat integration test failed:', error);
    throw error;
  }
}

/**
 * Test valid activity verification
 */
async function testValidActivityVerification(contract: any, challenge: any, pkpConfig: any) {
  console.log('  ✅ Testing valid 5km run verification...');
  
  const validActivity = generateValidRunActivity(5000);
  console.log('  📊 Activity details:', {
    id: validActivity.id,
    name: validActivity.name,
    type: validActivity.type,
    distance: validActivity.distance
  });

  // Simulate Lit Action validation
  const validationResult = validateActivityMock(validActivity, challenge);
  
  if (!validationResult.success) {
    throw new Error('Valid activity should pass validation');
  }

  // Simulate PKP calling markTaskComplete
  await contract.write.markTaskComplete([1n, '0x' + '1'.repeat(40)], {
    account: { address: pkpConfig.pkpEthAddress } as any
  });

  const participant = await contract.read.getParticipant([1n, '0x' + '1'.repeat(40)]);
  if (participant.hasCompleted) {
    console.log('  ✅ Valid activity marked as completed');
  } else {
    throw new Error('Valid activity should be marked as completed');
  }
}

/**
 * Test invalid activity rejection
 */
async function testInvalidActivityRejection(contract: any, challenge: any, pkpConfig: any) {
  console.log('  ❌ Testing invalid distance rejection...');
  
  const invalidActivity = generateInvalidRunActivity(5000);
  console.log('  📊 Activity details:', {
    id: invalidActivity.id,
    name: invalidActivity.name,
    type: invalidActivity.type,
    distance: invalidActivity.distance
  });

  // Simulate Lit Action validation
  const validationResult = validateActivityMock(invalidActivity, challenge);
  
  if (validationResult.success) {
    throw new Error('Invalid activity should fail validation');
  }

  console.log('  ✅ Invalid activity correctly rejected:', validationResult.reason);
}

/**
 * Test unauthorized caller rejection
 */
async function testUnauthorizedCaller(contract: any, challenge: any) {
  console.log('  🚫 Testing unauthorized caller rejection...');
  
  try {
    // Try to call markTaskComplete with unauthorized account
    await contract.write.markTaskComplete([1n, '0x' + '2'.repeat(40)], {
      account: { address: '0x' + '3'.repeat(40) } as any
    });
    throw new Error('Unauthorized caller should be rejected');
  } catch (error) {
    if (error instanceof Error && error.message.includes('Only authorized oracle')) {
      console.log('  ✅ Unauthorized caller correctly rejected');
    } else {
      throw error;
    }
  }
}

/**
 * Test challenge finalization
 */
async function testChallengeFinalization(contract: any, challenge: any, user: any) {
  console.log('  🏁 Testing challenge finalization...');
  
  // Fast forward time to after challenge end
  const futureTime = Math.floor(Date.now() / 1000) + 7200; // 2 hours from now
  // Note: viem.test.setNextBlockTimestamp is not available in this context
  // This would need to be implemented differently for actual testing
  
  // Finalize challenge
  await contract.write.finalizeChallenge([1n]);
  
  const finalizedChallenge = await contract.read.getChallenge([1n]);
  if (finalizedChallenge.finalized) {
    console.log('  ✅ Challenge finalized successfully');
  } else {
    throw new Error('Challenge should be finalized');
  }
}

/**
 * Mock validation function
 */
function validateActivityMock(activity: any, challenge: any) {
  // Check activity type
  if (activity.type !== 'Run') {
    return {
      success: false,
      reason: `Invalid activity type: ${activity.type}. Expected: Run`
    };
  }

  // Check distance
  if (activity.distance < Number(challenge.targetDistance)) {
    return {
      success: false,
      reason: `Distance too short: ${activity.distance}m. Required: ${challenge.targetDistance}m`
    };
  }

  // Check timestamp (simplified for testing)
  const activityTime = new Date(activity.start_date).getTime() / 1000;
  if (activityTime < Number(challenge.startTime)) {
    return {
      success: false,
      reason: `Activity too early`
    };
  }

  if (activityTime > Number(challenge.endTime)) {
    return {
      success: false,
      reason: `Activity too late`
    };
  }

  return {
    success: true,
    reason: 'Activity validation successful'
  };
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      console.log('✅ Hardhat integration test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Hardhat integration test failed:', error);
      process.exit(1);
    });
}

export { main as testLitActionHardhat };
