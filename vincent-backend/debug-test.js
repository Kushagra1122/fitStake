// Simple test to debug Strava verification
const axios = require('axios');

async function testStrava() {
  try {
    console.log('🧪 Testing Strava verification step by step...\n');

    // Test 1: Health check
    console.log('1️⃣ Health check...');
    try {
      const health = await axios.get('http://localhost:3001/health');
      console.log('✅ Backend is running');
      console.log('');
    } catch (error) {
      console.log('❌ Backend not running. Please start it with: npm start');
      return;
    }

    // Test 2: Contract info
    console.log('2️⃣ Contract info...');
    const contract = await axios.get('http://localhost:3001/api/contract-info');
    console.log('✅ Contract connected:', contract.data.contractAddress);
    console.log('✅ Oracle address:', contract.data.oracleAddress);
    console.log('');

    // Test 3: Strava verification with detailed logging
    console.log('3️⃣ Strava verification...');
    console.log('📤 Sending request...');
    
    const stravaResponse = await axios.post('http://localhost:3001/api/verify-strava', {
      challengeId: 1,
      stravaAccessToken: 'mock_token',
      userAddress: '0x1234567890123456789012345678901234567890',
      contractAddress: '0xe38d8f585936c60ecb7bfae7297457f6a35058bb'
    });
    
    console.log('✅ Strava verification successful!');
    console.log('📊 Response:', JSON.stringify(stravaResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testStrava();
