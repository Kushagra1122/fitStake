// @ts-nocheck
import express from 'express';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Lit Protocol Oracle Backend Service
 * 
 * This service receives verification requests from the React Native app
 * and triggers Lit Actions to verify Strava activities and mark tasks complete
 */

const app = express();
app.use(express.json());

// Configuration
let CONTRACT_ADDRESS = "0xe38d8f585936c60ecb7bfae7297457f6a35058bb";
let FUNCTION_SELECTOR = "0xf7aeca30"; // Default for old contract

// Try to load enhanced deployment config
try {
  const deploymentConfigPath = path.join(process.cwd(), 'deployment-enhanced.json');
  if (fs.existsSync(deploymentConfigPath)) {
    const deploymentConfig = JSON.parse(fs.readFileSync(deploymentConfigPath, 'utf8'));
    CONTRACT_ADDRESS = deploymentConfig.contractAddress;
    FUNCTION_SELECTOR = deploymentConfig.markTaskCompleteSelector;
    console.log('✅ Loaded enhanced contract configuration');
  console.log('   Contract:', CONTRACT_ADDRESS);
    console.log('   Selector:', FUNCTION_SELECTOR);
  }
} catch (error) {
  console.log('⚠️  No enhanced deployment config found, using defaults');
}

const PORT = process.env.ORACLE_PORT || 3000;
const LIT_NETWORK = process.env.LIT_NETWORK || 'habanero';

// Load Lit Action code
const litActionPath = path.join(process.cwd(), 'lit-actions', 'verifyStravaActivity.js');
const litActionCode = fs.readFileSync(litActionPath, 'utf8');

// Load PKP configuration
let pkpConfig: any = null;
try {
  const pkpConfigPath = path.join(process.cwd(), '.pkp-config.json');
  pkpConfig = JSON.parse(fs.readFileSync(pkpConfigPath, 'utf8'));
  console.log('✅ PKP config loaded:', pkpConfig.pkpEthAddress);
} catch (error) {
  console.warn('⚠️  No PKP config found. Run npm run mint-pkp first.');
}

// Initialize Lit Protocol client
let litClient: any = null;

async function initializeLitClient() {
  console.log('🔧 Initializing Lit Protocol client...');
  
  litClient = new LitNodeClient({ 
    litNetwork: 'cayenne',
    debug: true 
  });
  
  await litClient.connect();
  console.log('✅ Lit Protocol client connected to cayenne');
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    litNetwork: LIT_NETWORK,
    contractAddress: CONTRACT_ADDRESS,
    pkpConfigured: !!pkpConfig,
    litClientReady: !!litClient,
    timestamp: new Date().toISOString()
  });
});

/**
 * Verify Strava run endpoint
 * Called by React Native app when user completes a run
 */
app.post('/verify-strava-run', async (req, res) => {
  console.log('\n🏃 Verification request received');
  
  try {
    const { challengeId, userAddress, stravaAccessToken, activityId, mockActivityData } = req.body;

    // Validate input
    if (!challengeId || !userAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: challengeId, userAddress' 
      });
    }

    if (!litClient) {
      return res.status(503).json({ 
        success: false, 
        error: 'Lit Protocol client not initialized. Try again in a few seconds.' 
      });
    }

    console.log('Challenge ID:', challengeId);
    console.log('User Address:', userAddress);
    console.log('Activity ID:', activityId || 'using mock data');

    // Execute Lit Action
    console.log('🔐 Executing Lit Action...');
    
    const result = await litClient.executeJs({
      code: litActionCode,
      authSig: await generateAuthSig(),
      jsParams: {
        challengeId: challengeId.toString(),
        userAddress: userAddress,
        contractAddress: CONTRACT_ADDRESS,
        functionSelector: FUNCTION_SELECTOR,
        stravaAccessToken: stravaAccessToken || '',
        activityId: activityId || '',
        mockActivityData: mockActivityData || null
      }
    });

    console.log('✅ Lit Action executed');
    console.log('Result:', JSON.stringify(result, null, 2));

    res.json({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error executing Lit Action:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
});

/**
 * Generate authentication signature for Lit Protocol
 * For hackathon demo - using a simple auth method
 */
async function generateAuthSig() {
  // For production, implement proper auth signature
  // For hackathon demo, we can use a simplified version
  
  // TODO: Implement proper authentication
  // This is a placeholder for the demo
  return {
    sig: "0x" + "0".repeat(130),
    derivedVia: "web3.eth.personal.sign",
    signedMessage: "Lit Protocol Oracle Service",
    address: pkpConfig?.pkpEthAddress || "0x0000000000000000000000000000000000000000"
  };
}

/**
 * Test endpoint - trigger verification with mock data
 */
app.post('/test-verification', async (req, res) => {
  console.log('\n🧪 Test verification request');
  
  const { challengeId, userAddress } = req.body;
  
  // Mock Strava activity data (5km run)
  const mockActivityData = {
    id: 999999,
    name: 'Test Run - Hackathon Demo',
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
  } as any, res);
});

/**
 * Start server
 */
async function startServer() {
  try {
    console.log('🚀 Starting Lit Protocol Oracle Service...\n');
    
    // Initialize Lit client
    await initializeLitClient();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║   🔐 Lit Protocol Oracle Service RUNNING     ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log(`\n📡 Server: http://localhost:${PORT}`);
      console.log(`🌐 Network: ${LIT_NETWORK}`);
      console.log(`📝 Contract: ${CONTRACT_ADDRESS}`);
      console.log(`🔑 PKP: ${pkpConfig?.pkpEthAddress || 'Not configured'}`);
      console.log('\n📋 Endpoints:');
      console.log(`   GET  /health - Health check`);
      console.log(`   POST /verify-strava-run - Verify Strava activity`);
      console.log(`   POST /test-verification - Test with mock data`);
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

