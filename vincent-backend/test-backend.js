// Test script for Vincent Backend
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testBackend() {
  try {
    console.log('🧪 Testing Vincent Backend...\n');

    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    console.log('');

    // Test 2: Contract info
    console.log('2️⃣ Testing contract info...');
    const contractResponse = await axios.get(`${BASE_URL}/api/contract-info`);
    console.log('✅ Contract info:', contractResponse.data);
    console.log('');

    // Test 3: Strava verification
    console.log('3️⃣ Testing Strava verification...');
    
    try {
      const stravaResponse = await axios.post(`${BASE_URL}/api/verify-strava`, {
        challengeId: 1,
        stravaAccessToken: 'mock_token',
        userAddress: '0x1234567890123456789012345678901234567890',
        contractAddress: '0xe38d8f585936c60ecb7bfae7297457f6a35058bb'
      });
      console.log('✅ Strava verification:', stravaResponse.data);
    } catch (error) {
      console.log('❌ Strava verification failed:', error.response?.data || error.message);
    }
    console.log('');

    // Test 4: Vincent execute
    console.log('4️⃣ Testing Vincent execute...');
    const vincentResponse = await axios.post(`${BASE_URL}/api/vincent-execute`, {
      ability: '@lit-protocol/vincent-ability-erc20-transfer',
      params: {
        to: '0x1234567890123456789012345678901234567890',
        amount: '1.0',
        tokenAddress: '0x1234567890123456789012345678901234567890'
      }
    });
    console.log('✅ Vincent execute:', vincentResponse.data);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run tests
testBackend();
