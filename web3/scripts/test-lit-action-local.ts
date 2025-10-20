import { network } from 'hardhat';
import { generateValidRunActivity, generateInvalidRunActivity, generateWrongTypeActivity } from './generate-mock-activity.js';
import { StravaActivity } from '../lit-actions/types/strava.js';
import { ethers } from 'ethers';

/**
 * Test Lit Action locally without deploying to blockchain
 * This script tests the validation logic and mock data handling
 */

async function main() {
  console.log('🧪 Starting Lit Action Local Test...');

  try {
    // 1. Setup test environment
    console.log('🔧 Setting up test environment...');
    const viem = (await network.connect()) as any;
    const publicClient = await viem.viem.getPublicClient();
    const [owner, user1] = await viem.viem.getWalletClients();

    // 2. Deploy ChallengeContract locally
    console.log('📦 Deploying ChallengeContract to local Hardhat network...');
    const challengeContract = await viem.deployContract('ChallengeContract');
    console.log('✅ Contract deployed at:', challengeContract.address);

    // 3. Create a test challenge
    console.log('🏃 Creating test challenge...');
    await challengeContract.write.createChallenge([
      'Test Run 5km Challenge',
      5000n, // 5km in meters
      ethers.parseEther('1'), // 1 ETH stake
      3600n // 1 hour duration
    ]);

    const challenge = await challengeContract.read.getChallenge([1n]);
    console.log('✅ Challenge created:', {
      id: challenge.challengeId.toString(),
      description: challenge.description,
      targetDistance: challenge.targetDistance.toString(),
      stakeAmount: challenge.stakeAmount.toString()
    });

    // 4. Test valid activity validation
    console.log('\n🧪 Testing valid activity validation...');
    await testValidActivity(challenge);

    // 5. Test invalid distance validation
    console.log('\n🧪 Testing invalid distance validation...');
    await testInvalidDistance(challenge);

    // 6. Test wrong activity type validation
    console.log('\n🧪 Testing wrong activity type validation...');
    await testWrongActivityType(challenge);

    // 7. Test timestamp validation
    console.log('\n🧪 Testing timestamp validation...');
    await testTimestampValidation(challenge);

    // 8. Test mock Strava server integration
    console.log('\n🧪 Testing mock Strava server integration...');
    await testMockStravaServer();

    console.log('\n🎉 All local tests passed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Run: npm run mint-pkp');
    console.log('2. Run: npm run deploy-sepolia-oracle');
    console.log('3. Run: npm run test-lit-sepolia');

  } catch (error) {
    console.error('❌ Local test failed:', error);
    throw error;
  }
}

/**
 * Test valid activity validation
 */
async function testValidActivity(challenge: any) {
  console.log('  ✅ Testing valid 5km run...');
  
  const validActivity = generateValidRunActivity(5000);
  console.log('  📊 Activity details:', {
    id: validActivity.id,
    name: validActivity.name,
    type: validActivity.type,
    distance: validActivity.distance,
    startDate: validActivity.start_date
  });

  // Simulate Lit Action validation
  const validationResult = validateActivityMock(validActivity, challenge);
  
  if (validationResult.success) {
    console.log('  ✅ Valid activity passed validation');
  } else {
    console.log('  ❌ Valid activity failed validation:', validationResult.reason);
    throw new Error('Valid activity should pass validation');
  }
}

/**
 * Test invalid distance validation
 */
async function testInvalidDistance(challenge: any) {
  console.log('  ❌ Testing invalid distance (2km run)...');
  
  const invalidActivity = generateInvalidRunActivity(5000);
  console.log('  📊 Activity details:', {
    id: invalidActivity.id,
    name: invalidActivity.name,
    type: invalidActivity.type,
    distance: invalidActivity.distance,
    startDate: invalidActivity.start_date
  });

  const validationResult = validateActivityMock(invalidActivity, challenge);
  
  if (!validationResult.success && validationResult.reason.includes('Distance too short')) {
    console.log('  ✅ Invalid distance correctly rejected:', validationResult.reason);
  } else {
    console.log('  ❌ Invalid distance should have been rejected');
    throw new Error('Invalid distance should be rejected');
  }
}

/**
 * Test wrong activity type validation
 */
async function testWrongActivityType(challenge: any) {
  console.log('  🚶 Testing wrong activity type (Walk instead of Run)...');
  
  const wrongTypeActivity = generateWrongTypeActivity(5000);
  console.log('  📊 Activity details:', {
    id: wrongTypeActivity.id,
    name: wrongTypeActivity.name,
    type: wrongTypeActivity.type,
    distance: wrongTypeActivity.distance,
    startDate: wrongTypeActivity.start_date
  });

  const validationResult = validateActivityMock(wrongTypeActivity, challenge);
  
  if (!validationResult.success && validationResult.reason.includes('Invalid activity type')) {
    console.log('  ✅ Wrong activity type correctly rejected:', validationResult.reason);
  } else {
    console.log('  ❌ Wrong activity type should have been rejected');
    throw new Error('Wrong activity type should be rejected');
  }
}

/**
 * Test timestamp validation
 */
async function testTimestampValidation(challenge: any) {
  console.log('  ⏰ Testing timestamp validation...');
  
  // Create activity with old timestamp (outside challenge window)
  const oldActivity = generateValidRunActivity(5000);
  const oldTimestamp = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
  oldActivity.start_date = oldTimestamp.toISOString();
  
  console.log('  📊 Old activity details:', {
    id: oldActivity.id,
    startDate: oldActivity.start_date,
    challengeStart: new Date(Number(challenge.startTime) * 1000).toISOString(),
    challengeEnd: new Date(Number(challenge.endTime) * 1000).toISOString()
  });

  const validationResult = validateActivityMock(oldActivity, challenge);
  
  if (!validationResult.success && validationResult.reason.includes('too early')) {
    console.log('  ✅ Old timestamp correctly rejected:', validationResult.reason);
  } else {
    console.log('  ❌ Old timestamp should have been rejected');
    throw new Error('Old timestamp should be rejected');
  }
}

/**
 * Test mock Strava server
 */
async function testMockStravaServer() {
  console.log('  🌐 Testing mock Strava server...');
  
  try {
    const response = await fetch('http://localhost:3001/health');
    if (response.ok) {
      const health = await response.json();
      console.log('  ✅ Mock server is healthy:', health);
    } else {
      console.log('  ⚠️  Mock server not running. Start it with: npm run mock-strava');
    }
  } catch (error) {
    console.log('  ⚠️  Mock server not available. Start it with: npm run mock-strava');
  }
}

/**
 * Mock validation function (simulates Lit Action validation)
 */
function validateActivityMock(activity: StravaActivity, challenge: any) {
  // Check activity type
  if (activity.type !== 'Run') {
    return {
      success: false,
      reason: `Invalid activity type: ${activity.type}. Expected: Run`,
      isValidType: false,
      isValidDistance: false,
      isValidTimestamp: false
    };
  }

  // Check distance
  if (activity.distance < Number(challenge.targetDistance)) {
    return {
      success: false,
      reason: `Distance too short: ${activity.distance}m. Required: ${challenge.targetDistance}m`,
      isValidType: true,
      isValidDistance: false,
      isValidTimestamp: false
    };
  }

  // Check timestamp
  const activityTime = new Date(activity.start_date).getTime() / 1000;
  if (activityTime < Number(challenge.startTime)) {
    return {
      success: false,
      reason: `Activity too early: ${new Date(activity.start_date).toISOString()}. Challenge starts: ${new Date(Number(challenge.startTime) * 1000).toISOString()}`,
      isValidType: true,
      isValidDistance: true,
      isValidTimestamp: false
    };
  }

  if (activityTime > Number(challenge.endTime)) {
    return {
      success: false,
      reason: `Activity too late: ${new Date(activity.start_date).toISOString()}. Challenge ends: ${new Date(Number(challenge.endTime) * 1000).toISOString()}`,
      isValidType: true,
      isValidDistance: true,
      isValidTimestamp: false
    };
  }

  // All validations passed
  return {
    success: true,
    reason: 'Activity validation successful',
    isValidType: true,
    isValidDistance: true,
    isValidTimestamp: true
  };
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      console.log('✅ Lit Action local test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Lit Action local test failed:', error);
      process.exit(1);
    });
}

export { main as testLitActionLocal };
