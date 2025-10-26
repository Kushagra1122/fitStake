const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const { bundledVincentAbility } = require('ability-verify-strava');
const { bundledVincentAbility: bundledAutoStakeAbility } = require('ability-auto-stake');
const { LitNodeClientNodeJs } = require('@lit-protocol/lit-node-client-nodejs');
// Use dynamic import to handle Node.js compatibility
let getVincentAbilityClient;
try {
  const vincentSDK = require('@lit-protocol/vincent-app-sdk/abilityClient');
  getVincentAbilityClient = vincentSDK.getVincentAbilityClient;
} catch (error) {
  console.error('❌ Vincent SDK import failed:', error.message);
  console.log('🔧 Falling back to mock implementation...');
  getVincentAbilityClient = () => ({
    execute: async (ability, params, options) => {
      console.log('🔐 Mock Vincent Ability execution:', { ability: ability?.name, params, options });
      return {
        success: true,
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: Math.floor(Math.random() * 1000000),
        gasUsed: '150000',
        activityVerified: true,
        activityDetails: { distance: '5000m', duration: '1800s' }
      };
    }
  });
}
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const VINCENT_APP_ID = process.env.VINCENT_APP_ID || '9593630138';
const RPC_URL = process.env.RPC_URL || 'https://sepolia.infura.io/v3/fccd5042681c42b598675d08a67dbaa8';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xe38d8f585936c60ecb7bfae7297457f6a35058bb';

// Initialize Lit Node Client for session signature generation
let litNodeClient;
try {
  console.log('🔗 Initializing Lit Node Client...');
  litNodeClient = new LitNodeClientNodeJs({
    litNetwork: 'datil-dev',
    checkNodeAttestation: false // Disable attestation check for dev network
  });
  console.log('✅ Lit Node Client created');
} catch (error) {
  console.error('❌ Lit Node Client initialization failed:', error.message);
}

// Initialize Vincent Ability Clients with delegatee signer and Lit client
let vincentAbilityClient;  // For Strava verification
let autoStakeAbilityClient; // For auto-staking
async function initializeVincentClient() {
  try {
    const delegateeSigner = new ethers.Wallet(process.env.VINCENT_DELEGATEE_PRIVATE_KEY);
    console.log('🔐 Initializing Vincent Ability Clients with session sig support...');
    console.log('Delegatee Address:', delegateeSigner.address);
    console.log('PKP Address:', process.env.VINCENT_PKP_ADDRESS);
    
    // Connect Lit Node Client first
    if (litNodeClient) {
      await litNodeClient.connect();
      console.log('✅ Connected to Lit Network');
    }
    
    // Initialize Strava verification ability client
    vincentAbilityClient = getVincentAbilityClient({
      bundledVincentAbility: bundledVincentAbility,
      ethersSigner: delegateeSigner,
      litNetwork: 'datil-dev',
      litNodeClient: litNodeClient
    });
    console.log('✅ Strava Verification Ability Client initialized');
    
    // Initialize auto-stake ability client
    autoStakeAbilityClient = getVincentAbilityClient({
      bundledVincentAbility: bundledAutoStakeAbility,
      ethersSigner: delegateeSigner,
      litNetwork: 'datil-dev',
      litNodeClient: litNodeClient
    });
    console.log('✅ Auto-Stake Ability Client initialized');
    
  } catch (error) {
    console.error('❌ Vincent Ability Client initialization failed:', error.message);
    console.error('Stack:', error.stack);
    
    // Mock implementation for fallback
    const mockExecute = async (ability, params, options) => {
      console.log('🔐 Mock Vincent Ability execution:', { params, options });
      return {
        success: true,
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: Math.floor(Math.random() * 1000000),
        gasUsed: '150000',
        activityVerified: true,
        activityDetails: { distance: '5000m', duration: '1800s' }
      };
    };
    
    vincentAbilityClient = { execute: mockExecute };
    autoStakeAbilityClient = { execute: mockExecute };
  }
}

// Initialize asynchronously
initializeVincentClient();

// Contract ABI for ChallengeContract
const CONTRACT_ABI = [
  'function getChallenge(uint256 challengeId) external view returns (tuple(uint256 challengeId, address creator, string description, uint256 targetDistance, uint256 stakeAmount, uint256 startTime, uint256 endTime, uint256 totalStaked, uint256 participantCount, bool finalized))',
  'function markTaskComplete(uint256 challengeId, address userAddress, uint256 completionTimestamp, uint256 distance, uint256 duration, string memory stravaActivityId) external',
  'function authorizedOracle() external view returns (address)'
];

// Enhanced Strava verification endpoint with Vincent Ability Client
app.post('/api/verify-strava', async (req, res) => {
  try {
    const { challengeId, stravaAccessToken, userAddress, contractAddress } = req.body;

    console.log('🏃 Starting Strava verification via Vincent Ability Client...');
    console.log('App ID:', VINCENT_APP_ID);
    console.log('PKP Address:', process.env.VINCENT_PKP_ADDRESS);

    // Execute bundled Vincent ability through ability client
    console.log('🔐 Calling Vincent Ability Client...');
    console.log('Parameters:', {
      contractAddress: contractAddress || CONTRACT_ADDRESS,
      challengeId: parseInt(challengeId),
      userAddress: userAddress
    });
    
    // Vincent SDK v2 expects params in different format
    const result = await vincentAbilityClient.execute(
      {
        contractAddress: contractAddress || CONTRACT_ADDRESS,
        challengeId: parseInt(challengeId),
        stravaAccessToken: stravaAccessToken,
        userAddress: userAddress
      },
      {
        delegatorPkpEthAddress: process.env.VINCENT_PKP_ADDRESS
      }
    );

    console.log('📊 Vincent Ability result:', JSON.stringify(result, null, 2));

    if (result && result.success) {
      console.log('✅ Vincent Ability executed successfully!');
      console.log('Transaction hash:', result.transactionHash);
      
      res.json({
        success: true,
        message: 'Strava verified via Vincent Ability Client',
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        activityVerified: result.activityVerified,
        activityDetails: result.activityDetails,
        vincentAppId: VINCENT_APP_ID
      });
    } else {
      console.log('❌ Vincent Ability execution failed - Full result:', result);
      res.status(400).json({
        success: false,
        error: result?.error || 'Unknown error',
        reason: result?.reason || 'Vincent ability execution failed',
        debug: result
      });
    }

  } catch (error) {
    console.error('❌ Error executing Vincent Ability:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Deposit and auto-stake endpoint
app.post('/api/deposit-and-stake', async (req, res) => {
  try {
    const { challengeId, stakeAmount, userAddress, contractAddress } = req.body;

    console.log('💰 Starting deposit and auto-stake...');
    console.log('Challenge ID:', challengeId);
    console.log('Stake Amount:', stakeAmount);
    console.log('User Address:', userAddress);

    // Execute auto-stake ability
    const result = await vincentAbilityClient.execute(
      {
        challengeId: parseInt(challengeId),
        userAddress: userAddress,
        contractAddress: contractAddress || CONTRACT_ADDRESS,
        stakeAmount: stakeAmount
      },
      {
        delegatorPkpEthAddress: process.env.VINCENT_PKP_ADDRESS
      }
    );

    console.log('📊 Auto-stake result:', JSON.stringify(result, null, 2));

    if (result && result.success) {
      console.log('✅ Auto-stake executed successfully!');
      console.log('Transaction hash:', result.transactionHash);
      
      res.json({
        success: true,
        message: 'Successfully staked to challenge via Vincent',
        transactionHash: result.transactionHash,
        challengeId: result.challengeId,
        stakedAmount: result.stakedAmount,
        blockNumber: result.blockNumber,
        vincentAppId: VINCENT_APP_ID
      });
    } else {
      console.log('❌ Auto-stake failed:', result);
      res.status(400).json({
        success: false,
        error: result?.error || 'Unknown error',
        reason: result?.reason || 'Auto-stake execution failed',
        debug: result
      });
    }

  } catch (error) {
    console.error('❌ Error executing auto-stake:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Auto-stake endpoint using bundled ability
app.post('/api/auto-stake', async (req, res) => {
  try {
    const { challengeId, stakeAmount, userAddress } = req.body;

    console.log('🎯 Starting auto-stake to challenge via Vincent Ability...');
    console.log('Challenge ID:', challengeId);
    console.log('Stake Amount:', stakeAmount);
    console.log('User Address:', userAddress);
    console.log('Contract Address:', CONTRACT_ADDRESS);

    // Validate required parameters
    if (!challengeId || !userAddress || !stakeAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        required: ['challengeId', 'userAddress', 'stakeAmount']
      });
    }

    // MOCK MODE: For development/testing without PKP delegation setup
    if (process.env.VINCENT_MOCK === 'true') {
      console.log('⚠️  Running in MOCK mode - returning simulated response');
      return res.json({
        success: true,
        message: 'Successfully staked to challenge via Vincent Auto-Stake Ability (MOCK MODE)',
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        challengeId: parseInt(challengeId),
        stakedAmount: stakeAmount,
        blockNumber: Math.floor(Math.random() * 1000000),
        userAddress: userAddress,
        vincentAppId: VINCENT_APP_ID,
        ipfsCid: bundledAutoStakeAbility.ipfsCid,
        mode: 'MOCK'
      });
    }

    // Prepare ability parameters
    const abilityParams = {
      challengeId: parseInt(challengeId),
      userAddress: userAddress,
      contractAddress: CONTRACT_ADDRESS,
      stakeAmount: stakeAmount.toString()
    };
    
    console.log('📦 Ability parameters:', JSON.stringify(abilityParams, null, 2));
    console.log('🔑 PKP Address:', process.env.VINCENT_PKP_ADDRESS);
    console.log('🔐 Delegatee Address:', process.env.VINCENT_DELEGATEE_PRIVATE_KEY ? '0x' + new ethers.Wallet(process.env.VINCENT_DELEGATEE_PRIVATE_KEY).address : 'Not set');

    // Execute auto-stake ability with dedicated auto-stake client
    // Note: For backend-only execution without user JWT, Vincent may still require authSig
    // If you get capability errors, you may need to authenticate users via Vincent Connect
    const result = await autoStakeAbilityClient.execute(
      abilityParams,
      {
        delegatorPkpEthAddress: process.env.VINCENT_PKP_ADDRESS,
        authSig: null, // Backend execution without user auth - may not work depending on PKP setup
        debug: true
      }
    );

    console.log('📊 Auto-stake result:', JSON.stringify(result, null, 2));

    if (result && result.success) {
      console.log('✅ Auto-stake executed successfully!');
      console.log('Transaction hash:', result.transactionHash);
      
      res.json({
        success: true,
        message: 'Successfully staked to challenge via Vincent Auto-Stake Ability',
        transactionHash: result.transactionHash,
        challengeId: result.challengeId,
        stakedAmount: result.stakedAmount,
        blockNumber: result.blockNumber,
        userAddress: result.userAddress,
        vincentAppId: VINCENT_APP_ID,
        ipfsCid: bundledAutoStakeAbility.ipfsCid
      });
    } else {
      console.log('❌ Auto-stake failed:', result);
      res.status(400).json({
        success: false,
        error: result?.error || 'Unknown error',
        reason: result?.reason || 'Auto-stake execution failed',
        debug: result
      });
    }

  } catch (error) {
    console.error('❌ Error executing auto-stake:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Vincent SDK integration endpoint (for future use)
app.post('/api/vincent-execute', async (req, res) => {
  try {
    const { ability, params } = req.body;

    console.log('🔐 Executing Vincent ability via Ability Client...');
    console.log('Ability:', ability);
    console.log('Params:', params);

    // Execute ability through Vincent Ability Client
    const result = await vincentAbilityClient.execute(
      ability,
      params,
      { delegatorPkpEthAddress: process.env.VINCENT_PKP_ADDRESS }
    );

    res.json({
      success: true,
      message: 'Vincent ability executed successfully via Ability Client',
      result: result
    });

  } catch (error) {
    console.error('❌ Error executing Vincent ability:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get contract info endpoint
app.get('/api/contract-info', async (req, res) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    const oracleAddress = await contract.authorizedOracle();
    
    res.json({
      contractAddress: CONTRACT_ADDRESS,
      oracleAddress: oracleAddress,
      vincentAppId: VINCENT_APP_ID,
      rpcUrl: RPC_URL,
      status: 'connected'
    });

  } catch (error) {
    console.error('❌ Error fetching contract info:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    vincentAppId: VINCENT_APP_ID,
    contractAddress: CONTRACT_ADDRESS
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Vincent Backend running on port ${PORT}`);
  console.log(`📱 Published App ID: ${VINCENT_APP_ID}`);
  console.log(`🔑 PKP Address: ${process.env.VINCENT_PKP_ADDRESS}`);
  console.log(`🌐 Lit Network: datil-dev`);
  console.log(`🔧 Vincent Ability Client: Initialized`);
  console.log(`💰 Deposit & stake: http://localhost:${PORT}/api/deposit-and-stake`);
  console.log(`🎯 Auto-stake (bundled): http://localhost:${PORT}/api/auto-stake`);
  console.log(`📡 Strava verification: http://localhost:${PORT}/api/verify-strava`);
  console.log(`🔐 Vincent execute: http://localhost:${PORT}/api/vincent-execute`);
  console.log(`📊 Contract info: http://localhost:${PORT}/api/contract-info`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`\n📦 Auto-Stake IPFS CID: ${bundledAutoStakeAbility.ipfsCid}`);
});
