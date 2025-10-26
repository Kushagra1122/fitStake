/**
 * Vincent Service for FitStake
 * 
 * This service handles:
 * - Vincent wallet authentication
 * - Ability execution (verify Strava, distribute rewards)
 * - JWT management
 */

import { Platform } from 'react-native';
import { parseUnits } from 'ethers';

// Note: @lit-protocol/vincent-app-sdk is designed for web
// For React Native, we'll use direct API calls
// In production, consider using a web view or native bridge

const VINCENT_APP_ID = '9593630138';

// Determine backend URL based on platform
// - Android Emulator: use 10.0.2.2 (special IP for host machine)
// - iOS Simulator: use localhost (works fine)
// - Physical device: use actual IP address of your dev machine
//   TODO: For physical devices, you need to replace this with your actual IP
//   Run: ipconfig (Windows) or ifconfig (Mac/Linux) to find your IP
//   Example: 'http://192.168.1.100:3001'
const getVincentBackendUrl = () => {
  // Physical device - use your computer's IP address
  return 'http://10.68.250.64:3001';
  
  // Commented out for physical device - uncomment if using emulator
  // if (Platform.OS === 'android') {
  //   // Android emulator uses 10.0.2.2 to reach host machine
  //   return 'http://10.0.2.2:3001';
  // } else if (Platform.OS === 'ios') {
  //   // iOS simulator can use localhost
  //   return 'http://localhost:3001';
  // } else {
  //   // Web or other platforms
  //   return 'http://localhost:3001';
  // }
};

const VINCENT_BACKEND_URL = getVincentBackendUrl();
const VINCENT_DASHBOARD_URL = 'https://dashboard.heyvincent.ai';

/**
 * Storage helper for React Native
 */
const storage = {
  async getItem(key) {
    try {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn('AsyncStorage not available, using memory storage');
      return this.memoryStorage[key] || null;
    }
  },
  
  async setItem(key, value) {
    try {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn('AsyncStorage not available, using memory storage');
      this.memoryStorage[key] = value;
    }
  },
  
  async removeItem(key) {
    try {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('AsyncStorage not available, using memory storage');
      delete this.memoryStorage[key];
    }
  },
  
  memoryStorage: {}
};

/**
 * JWT helper functions
 */
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT');
    }
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

function isJWTExpired(token) {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  const now = Date.now() / 1000;
  return decoded.exp < now;
}

/**
 * Check if user is authenticated with Vincent
 */
export async function checkVincentAuth() {
  const jwt = await storage.getItem('VINCENT_AUTH_JWT');
  
  if (jwt && !isJWTExpired(jwt)) {
    const decoded = decodeJWT(jwt);
    return { 
      authenticated: true, 
      jwt, 
      user: decoded 
    };
  }
  
  return { authenticated: false };
}

/**
 * Connect to Vincent
 * 
 * Opens Vincent Dashboard for user to:
 * 1. Create Vincent wallet (if needed)
 * 2. Delegate to FitStake app
 * 3. Set policies
 */
export async function connectToVincent() {
  const { Linking } = await import('react-native');
  
  // Build Vincent connect URL
  const redirectUri = encodeURIComponent('fitstake://auth/callback');
  const connectUrl = `${VINCENT_DASHBOARD_URL}/connect?app_id=${VINCENT_APP_ID}&redirect_uri=${redirectUri}`;
  
  console.log('🔐 Opening Vincent Dashboard...');
  console.log('Connect URL:', connectUrl);
  
  // Open Vincent Dashboard
  const supported = await Linking.canOpenURL(connectUrl);
  
  if (supported) {
    await Linking.openURL(connectUrl);
  } else {
    throw new Error('Cannot open Vincent Dashboard. Please check your browser settings.');
  }
}

/**
 * Handle authentication callback
 * Call this when app receives the redirect from Vincent
 */
export async function handleAuthCallback(url) {
  try {
    // Parse URL for JWT
    const urlObj = new URL(url);
    const jwt = urlObj.searchParams.get('jwt');
    
    if (!jwt) {
      throw new Error('No JWT in callback URL');
    }
    
    // Validate JWT
    if (isJWTExpired(jwt)) {
      throw new Error('JWT is expired');
    }
    
    // Store JWT
    await storage.setItem('VINCENT_AUTH_JWT', jwt);
    
    const decoded = decodeJWT(jwt);
    console.log('✅ Vincent authentication successful');
    console.log('User PKP:', decoded.pkpAddress);
    
    return { 
      success: true, 
      jwt, 
      user: decoded 
    };
  } catch (error) {
    console.error('❌ Failed to handle auth callback:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Logout from Vincent
 */
export async function disconnectVincent() {
  await storage.removeItem('VINCENT_AUTH_JWT');
  console.log('🔓 Vincent disconnected');
}

/**
 * Execute Vincent Ability
 * 
 * @param {string} abilityName - Name of ability ('verify-strava' or 'distribute-rewards')
 * @param {object} params - Ability parameters
 * @returns {Promise<object>} Execution result
 */
export async function executeAbility(abilityName, params) {
  const auth = await checkVincentAuth();
  
  if (!auth.authenticated) {
    throw new Error('Not authenticated with Vincent. Please connect first.');
  }
  
  console.log(`🚀 Executing ${abilityName} ability...`);
  console.log('Parameters:', params);
  
  try {
    const response = await fetch(`${VINCENT_BACKEND_URL}/abilities/${abilityName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.jwt}`
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`✅ ${abilityName} execution complete:`, result);
    
    return result;
  } catch (error) {
    console.error(`❌ Failed to execute ${abilityName}:`, error);
    throw error;
  }
}

/**
 * Verify Strava Run
 * 
 * @param {number} challengeId - Challenge ID
 * @param {string} userAddress - User's wallet address
 * @param {string} stravaAccessToken - Strava OAuth token
 * @returns {Promise<object>} Verification result with transaction hash
 */
export async function verifyStravaRun(challengeId, userAddress, stravaAccessToken) {
  return executeAbility('verify-strava', {
    challengeId,
    userAddress,
    stravaAccessToken,
    contractAddress: '0xe38d8f585936c60ecb7bfae7297457f6a35058bb' // Sepolia contract
  });
}

/**
 * Distribute Challenge Rewards
 * 
 * @param {number} challengeId - Challenge ID
 * @returns {Promise<object>} Distribution result with transaction hash
 */
export async function distributeChallengeRewards(challengeId) {
  return executeAbility('distribute-rewards', {
    challengeId,
    contractAddress: '0xe38d8f585936c60ecb7bfae7297457f6a35058bb' // Sepolia contract
  });
}

/**
 * Check Vincent App health
 */
export async function checkVincentAppHealth() {
  try {
    const response = await fetch(`${VINCENT_BACKEND_URL}/api/health`);
    
    if (!response.ok) {
      return { healthy: false, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    return { healthy: true, data };
  } catch (error) {
    console.error('❌ Vincent App health check failed:', error);
    return { healthy: false, error: error.message };
  }
}

/**
 * Auto-stake to a challenge using Vincent
 * 
 * @param {string} challengeId - Challenge ID to join
 * @param {string} stakeAmount - Stake amount in ETH (not wei)
 * @param {string} userAddress - User's wallet address
 * @returns {Promise<object>} Auto-stake result with transaction hash
 */
export async function autoStakeToChallenge(challengeId, stakeAmount, userAddress, jwt = null) {
  try {
    console.log('🚀 Requesting Vincent auto-stake...');
    console.log('Challenge ID:', challengeId);
    console.log('Stake Amount (ETH):', stakeAmount);
    console.log('User Address:', userAddress);
    console.log('Backend URL:', VINCENT_BACKEND_URL);
    console.log('JWT provided:', jwt ? 'Yes' : 'No');
    
    // Convert ETH to Wei for contract interaction (ethers v6 syntax)
    const stakeAmountWei = parseUnits(stakeAmount.toString(), 18).toString();
    console.log('💰 Stake Amount (Wei):', stakeAmountWei);
    
    const requestPayload = {
      challengeId: parseInt(challengeId),
      stakeAmount: stakeAmountWei,
      userAddress: userAddress
    };
    
    console.log('📤 Request payload:', JSON.stringify(requestPayload, null, 2));
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add JWT to authorization header if provided
    if (jwt) {
      headers['Authorization'] = `Bearer ${jwt}`;
      console.log('📝 Adding JWT to request headers');
    }
    
    const response = await fetch(`${VINCENT_BACKEND_URL}/api/auto-stake`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestPayload)
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText };
      }
      throw new Error(errorData.reason || errorData.error || `HTTP ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Vincent auto-stake successful:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Vincent auto-stake failed:', error);
    console.error('❌ Error type:', error.constructor.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
}

// Export all functions
export default {
  checkVincentAuth,
  connectToVincent,
  handleAuthCallback,
  disconnectVincent,
  executeAbility,
  verifyStravaRun,
  distributeChallengeRewards,
  checkVincentAppHealth,
  autoStakeToChallenge
};

