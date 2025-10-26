const axios = require('axios');
const { ethers } = require('ethers');

const BASE_URL = 'http://localhost:3001';

async function testAutoStake() {
  console.log('🧪 Testing Auto-Stake Endpoint...\n');
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: Contract Info
    console.log('2️⃣ Getting contract info...');
    const infoResponse = await axios.get(`${BASE_URL}/api/contract-info`);
    console.log('✅ Contract info:', infoResponse.data);
    console.log('');

    // Test 3: Auto-Stake with 0.01 ETH
    console.log('3️⃣ Testing auto-stake to challenge...');
    console.log('⚠️  NOTE: This will execute a real transaction on Sepolia testnet');
    console.log('Make sure:');
    console.log('  - Challenge ID 1 exists and is active');
    console.log('  - PKP wallet has sufficient ETH for stake + gas');
    console.log('  - Test address is valid\n');

    const testParams = {
      challengeId: 1, // Must be an existing challenge
      userAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0', // Test address (40 hex chars)
      stakeAmount: ethers.utils.parseEther('0.01').toString() // 0.01 ETH in wei
    };

    console.log('Request parameters:');
    console.log(JSON.stringify(testParams, null, 2));
    console.log('');

    const stakeResponse = await axios.post(`${BASE_URL}/api/auto-stake`, testParams);
    
    if (stakeResponse.data.success) {
      console.log('✅ AUTO-STAKE SUCCESSFUL!');
      console.log('Transaction Hash:', stakeResponse.data.transactionHash);
      console.log('Challenge ID:', stakeResponse.data.challengeId);
      console.log('Staked Amount:', ethers.utils.formatEther(stakeResponse.data.stakedAmount), 'ETH');
      console.log('Block Number:', stakeResponse.data.blockNumber);
      console.log('IPFS CID:', stakeResponse.data.ipfsCid);
      console.log('');
      console.log(`🔗 View on Sepolia Etherscan:`);
      console.log(`https://sepolia.etherscan.io/tx/${stakeResponse.data.transactionHash}`);
    } else {
      console.log('❌ Auto-stake failed:', stakeResponse.data);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    
    if (error.response) {
      // Server responded with error
      console.error('Status:', error.response.status);
      console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data.error === 'CHALLENGE_NOT_FOUND') {
        console.log('\n💡 TIP: Challenge ID 1 may not exist. Try creating a challenge first.');
      } else if (error.response.data.error === 'ALREADY_JOINED') {
        console.log('\n💡 TIP: Test address already joined this challenge. Try a different challenge ID.');
      } else if (error.response.data.error === 'PKP_NOT_CONFIGURED') {
        console.log('\n💡 TIP: Check that VINCENT_PKP_PRIVATE_KEY is set in .env');
      }
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server. Is the backend running?');
      console.error('Start it with: node src/index.js');
    } else {
      // Other errors
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

// Test parameter validation
async function testValidation() {
  console.log('\n4️⃣ Testing parameter validation...');
  
  try {
    await axios.post(`${BASE_URL}/api/auto-stake`, {
      // Missing required parameters
      challengeId: 1
    });
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Validation working correctly');
      console.log('   Error:', error.response.data.error);
    } else {
      throw error;
    }
  }
}

// Run tests
async function runAllTests() {
  try {
    await testAutoStake();
    await testValidation();
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Verify transaction on Sepolia Etherscan');
    console.log('2. Check that challenge participant count increased');
    console.log('3. Integrate this endpoint into your React Native app');
    
  } catch (error) {
    console.error('\n❌ Test suite failed');
    process.exit(1);
  }
}

// Check if server is running first
axios.get(`${BASE_URL}/health`)
  .then(() => {
    console.log('✅ Backend server is running\n');
    runAllTests();
  })
  .catch(() => {
    console.error('❌ Backend server is not running!');
    console.error('Please start it first with:');
    console.error('  cd vincent-backend');
    console.error('  node src/index.js');
    process.exit(1);
  });

