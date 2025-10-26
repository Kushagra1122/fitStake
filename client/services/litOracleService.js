/**
 * Lit Protocol Oracle Service
 * 
 * This service communicates with the Lit Protocol backend oracle
 * to verify Strava activities and mark challenges as complete on-chain.
 */

// Backend oracle URL - using localhost for development
const ORACLE_BACKEND_URL = 'http://10.68.250.64:3000';

/**
 * Logs debug information
 */
const logDebug = (step, data) => {
  console.log(`[LIT ORACLE DEBUG] ${step}:`, JSON.stringify(data, null, 2));
};

/**
 * Logs error information
 */
const logError = (step, error) => {
  console.error(`[LIT ORACLE ERROR] ${step}:`, error);
};

/**
 * Check if the oracle backend is healthy
 * @returns {Promise<boolean>} True if backend is running
 */
export const checkOracleHealth = async () => {
  try {
    logDebug('🔍 Checking oracle health', { url: ORACLE_BACKEND_URL });
    
    const response = await fetch(`${ORACLE_BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      logError('❌ Health check failed', { 
        status: response.status, 
        statusText: response.statusText 
      });
      return false;
    }
    
    const healthData = await response.json();
    logDebug('✅ Oracle health check passed', healthData);
    
    return healthData.status === 'healthy';
  } catch (error) {
    logError('❌ Health check error', error);
    return false;
  }
};

/**
 * Verify a Strava activity against a challenge
 * @param {Object} params - Verification parameters
 * @param {number} params.challengeId - Challenge ID
 * @param {string} params.userAddress - User's wallet address
 * @param {string} params.stravaAccessToken - Strava access token
 * @param {Object} params.activityData - Strava activity data (optional)
 * @returns {Promise<Object>} Verification result
 */
export const verifyStravaActivity = async ({ 
  challengeId, 
  userAddress, 
  stravaAccessToken, 
  activityData = null 
}) => {
  try {
    console.log('🔐 Starting Strava activity verification...');
    logDebug('📊 Verification parameters', {
      challengeId,
      userAddress,
      hasAccessToken: !!stravaAccessToken,
      hasActivityData: !!activityData
    });

    // Check oracle health first
    const isHealthy = await checkOracleHealth();
    if (!isHealthy) {
      throw new Error('Oracle backend is not available. Please try again later.');
    }

    // Prepare request body
    const requestBody = {
      challengeId: challengeId.toString(),
      userAddress,
      stravaAccessToken: stravaAccessToken || '',
      activityId: activityData?.id?.toString() || '',
      mockActivityData: activityData || null
    };

    logDebug('📤 Sending verification request', {
      url: `${ORACLE_BACKEND_URL}/verify-strava-run`,
      body: requestBody
    });

    // Send verification request to oracle backend
    const response = await fetch(`${ORACLE_BACKEND_URL}/verify-strava-run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    logDebug('📥 Oracle response received', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      logError('❌ Oracle request failed', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 200)
      });
      throw new Error(`Oracle request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    logDebug('✅ Verification result', result);

    if (!result.success) {
      throw new Error(result.error || 'Verification failed');
    }

    console.log('🎉 Strava activity verified successfully!');
    console.log('📄 Transaction details:', {
      hash: result.result?.transaction?.transactionHash,
      status: result.result?.transaction?.status
    });

    return {
      success: true,
      result: result.result,
      timestamp: result.timestamp
    };

  } catch (error) {
    logError('💥 Verification error', {
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack
    });
    
    console.log('═══════════════════════════════════════════════════');
    
    return {
      success: false,
      error: error.message || 'An unknown error occurred during verification',
    };
  }
};

/**
 * Test the oracle with mock data
 * @param {number} challengeId - Challenge ID
 * @param {string} userAddress - User's wallet address
 * @returns {Promise<Object>} Test result
 */
export const testOracleWithMockData = async (challengeId, userAddress) => {
  try {
    console.log('🧪 Testing oracle with mock data...');
    
    const mockActivityData = {
      id: 999999,
      name: 'Test Run - React Native Demo',
      distance: 5200, // 5.2 km
      moving_time: 1800,
      elapsed_time: 1900,
      type: 'Run',
      start_date: new Date().toISOString(),
      start_date_local: new Date().toISOString()
    };

    return await verifyStravaActivity({
      challengeId,
      userAddress,
      stravaAccessToken: '',
      activityData: mockActivityData
    });
  } catch (error) {
    logError('❌ Mock test error', error);
    return {
      success: false,
      error: error.message || 'Mock test failed'
    };
  }
};

console.log('📦 Exporting Lit Oracle Service');

export default {
  checkOracleHealth,
  verifyStravaActivity,
  testOracleWithMockData,
};
