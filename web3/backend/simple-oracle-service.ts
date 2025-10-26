import express from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Simple Oracle Service (without Lit Protocol)
 * 
 * This service provides a mock verification endpoint for testing
 * the React Native integration. Later, this will be replaced with
 * the full Lit Protocol implementation.
 */

const app = express();
app.use(express.json());

// Configuration
const CONTRACT_ADDRESS = '0x21854089df4aeb1e0ac1770a43f5e892a8fd04d9';
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/fccd5042681c42b598675d08a67dbaa8';
const PORT = process.env.ORACLE_PORT || 3000;

// Contract ABI for markTaskComplete
const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "challengeId", "type": "uint256"},
      {"internalType": "address", "name": "userAddress", "type": "address"},
      {"internalType": "uint256", "name": "completionTimestamp", "type": "uint256"},
      {"internalType": "uint256", "name": "distance", "type": "uint256"},
      {"internalType": "uint256", "name": "duration", "type": "uint256"},
      {"internalType": "string", "name": "stravaActivityId", "type": "string"}
    ],
    "name": "markTaskComplete",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "challengeId", "type": "uint256"}],
    "name": "getChallenge",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "challengeId", "type": "uint256"},
          {"internalType": "address", "name": "creator", "type": "address"},
          {"internalType": "string", "name": "description", "type": "string"},
          {"internalType": "uint256", "name": "targetDistance", "type": "uint256"},
          {"internalType": "uint256", "name": "stakeAmount", "type": "uint256"},
          {"internalType": "uint256", "name": "startTime", "type": "uint256"},
          {"internalType": "uint256", "name": "endTime", "type": "uint256"},
          {"internalType": "uint256", "name": "totalStaked", "type": "uint256"},
          {"internalType": "uint256", "name": "participantCount", "type": "uint256"},
          {"internalType": "bool", "name": "finalized", "type": "bool"}
        ],
        "internalType": "struct ChallengeContract.ChallengeDetails",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Initialize provider and contract
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'simple-oracle',
    contractAddress: CONTRACT_ADDRESS,
    timestamp: new Date().toISOString()
  });
});

/**
 * Verify Strava run endpoint (MOCK IMPLEMENTATION)
 * 
 * This is a simplified version that validates the activity
 * but doesn't actually call the smart contract.
 * 
 * TODO: Replace with full Lit Protocol implementation
 */
app.post('/verify-strava-run', async (req, res) => {
  console.log('\n🏃 Verification request received (MOCK)');
  
  try {
    const { challengeId, userAddress, stravaAccessToken, activityData } = req.body;

    // Validate input
    if (!challengeId || !userAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: challengeId, userAddress' 
      });
    }

    console.log('Challenge ID:', challengeId);
    console.log('User Address:', userAddress);
    console.log('Activity Data:', activityData ? 'Provided' : 'Not provided');

    // Fetch challenge details from contract
    let challenge;
    try {
      challenge = await contract.getChallenge(challengeId);
      console.log('Challenge details:', {
        targetDistance: challenge.targetDistance.toString(),
        startTime: challenge.startTime.toString(),
        endTime: challenge.endTime.toString()
      });
    } catch (error) {
      console.error('Error fetching challenge:', error);
      return res.status(400).json({
        success: false,
        error: 'Challenge not found or invalid'
      });
    }

    // Validate activity (simplified)
    if (!activityData) {
      return res.status(400).json({
        success: false,
        error: 'No activity data provided'
      });
    }

    const activityTime = new Date(activityData.start_date).getTime() / 1000;
    const challengeStartTime = Number(challenge.startTime);
    const challengeEndTime = Number(challenge.endTime);
    const targetDistance = Number(challenge.targetDistance);

    // Validation checks
    const validations = {
      isRun: activityData.type === 'Run',
      hasDistance: activityData.distance >= targetDistance,
      withinTimeWindow: activityTime >= challengeStartTime && activityTime <= challengeEndTime
    };

    console.log('Validation results:', validations);

    if (!validations.isRun) {
      return res.json({
        success: false,
        error: 'Activity must be a run',
        validation: validations
      });
    }

    if (!validations.hasDistance) {
      return res.json({
        success: false,
        error: `Distance too short: ${activityData.distance}m. Required: ${targetDistance}m`,
        validation: validations
      });
    }

    if (!validations.withinTimeWindow) {
      return res.json({
        success: false,
        error: 'Activity is outside challenge time window',
        validation: validations
      });
    }

    // Mock successful verification
    const mockTxHash = '0x' + Array.from({length: 64}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    console.log('✅ Mock verification successful');
    console.log('Mock transaction hash:', mockTxHash);

    res.json({
      success: true,
      result: {
        signature: 'mock_signature_' + Date.now(),
        txData: 'mock_tx_data',
        transaction: {
          transactionHash: mockTxHash,
          status: 'pending'
        },
        verificationResult: {
          success: true,
          reason: 'Activity validation successful',
          isValidDistance: validations.hasDistance,
          isValidType: validations.isRun,
          isValidTimestamp: validations.withinTimeWindow,
          activityId: activityData.id,
          distance: activityData.distance,
          activityType: activityData.type,
          timestamp: activityTime
        },
        activityId: activityData.id,
        distance: activityData.distance,
        activityType: activityData.type,
        contractAddress: CONTRACT_ADDRESS,
        challengeId: challengeId,
        userAddress: userAddress
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in verification:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
});

/**
 * Test endpoint - trigger verification with mock data
 */
app.post('/test-verification', async (req, res) => {
  console.log('\n🧪 Test verification request');
  
  const { challengeId, userAddress } = req.body;
  
  // Mock Strava activity data (5km run)
  const mockActivityData = {
    id: 999999,
    name: 'Test Run - Mock Verification',
    distance: 5200, // 5.2 km
    moving_time: 1800,
    elapsed_time: 1900,
    type: 'Run',
    start_date: new Date().toISOString(),
    start_date_local: new Date().toISOString()
  };

  // Forward to main verification endpoint
  return app.post('/verify-strava-run', {
    ...req,
    body: {
      challengeId,
      userAddress,
      mockActivityData
    }
  } as any, res as any);
});

/**
 * Start server
 */
async function startServer() {
  try {
    console.log('🚀 Starting Simple Oracle Service...\n');
    
    // Test contract connection
    try {
      const nextChallengeId = await contract.nextChallengeId();
      console.log('✅ Contract connected, nextChallengeId:', nextChallengeId.toString());
    } catch (error) {
      console.warn('⚠️  Could not connect to contract:', error.message);
    }
    
    // Start Express server
    app.listen(PORT, () => {
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║   🔐 Simple Oracle Service RUNNING (MOCK)     ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log(`\n📡 Server: http://localhost:${PORT}`);
      console.log(`📝 Contract: ${CONTRACT_ADDRESS}`);
      console.log('\n📋 Endpoints:');
      console.log(`   GET  /health - Health check`);
      console.log(`   POST /verify-strava-run - Verify Strava activity (MOCK)`);
      console.log(`   POST /test-verification - Test with mock data`);
      console.log('\n⚠️  NOTE: This is a MOCK service for testing React Native integration');
      console.log('   Real Lit Protocol integration will be added later');
      console.log('\n✅ Ready for verification requests!\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
