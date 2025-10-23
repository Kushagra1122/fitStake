import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

// This is important for the redirect to work properly
WebBrowser.maybeCompleteAuthSession();

const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID ;
const STRAVA_CLIENT_SECRET = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET ;
const OAUTH_SERVER_HOST = process.env.EXPO_PUBLIC_OAUTH_SERVER_HOST || '10.85.28.154';

// OAuth endpoints
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/mobile/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

// OAuth Server Configuration
// IMPORTANT: We use the same IP for both:
// 1. OAUTH_SERVER_URL - For app to poll server
// 2. STRAVA_REDIRECT_URI - For Strava to redirect
// Using your machine's IP address so it's accessible from both browser and app

const OAUTH_SERVER_URL = `http://${OAUTH_SERVER_HOST}:3000`; // Your machine's IP from .env
// const OAUTH_SERVER_URL = 'http://10.0.2.2:3000'; // Android emulator (only if using localhost)
// const OAUTH_SERVER_URL = 'https://your-server.com'; // Production

// Strava redirects here (must be accessible by Strava's servers)
const STRAVA_REDIRECT_URI = `http://${OAUTH_SERVER_HOST}:3000/exchange_token`;
const REDIRECT_URI = STRAVA_REDIRECT_URI; // For backwards compatibility

// Secure storage keys
const STRAVA_ACCESS_TOKEN_KEY = 'strava_access_token';
const STRAVA_REFRESH_TOKEN_KEY = 'strava_refresh_token';
const STRAVA_ATHLETE_KEY = 'strava_athlete_data';
const STRAVA_TOKEN_EXPIRY_KEY = 'strava_token_expiry';

console.log('🔧 Strava Service Initialized');
console.log('📊 Config:', {
  clientId: STRAVA_CLIENT_ID ? `${STRAVA_CLIENT_ID.substring(0, 8)}...` : 'MISSING',
  oauthServer: OAUTH_SERVER_URL,
});

/**
 * Logs debug information
 */
const logDebug = (step, data) => {
  console.log(`[STRAVA DEBUG] ${step}:`, JSON.stringify(data, null, 2));
};

/**
 * Logs error information
 */
const logError = (step, error) => {
  console.error(`[STRAVA ERROR] ${step}:`, error);
};

/**
 * Store tokens securely
 */
const storeTokens = async (accessToken, refreshToken, expiresAt, athlete) => {
  try {
    await SecureStore.setItemAsync(STRAVA_ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(STRAVA_REFRESH_TOKEN_KEY, refreshToken);
    await SecureStore.setItemAsync(STRAVA_TOKEN_EXPIRY_KEY, expiresAt.toString());
    await SecureStore.setItemAsync(STRAVA_ATHLETE_KEY, JSON.stringify(athlete));
    
    return true;
  } catch (error) {
    console.error('Error storing tokens:', error.message);
    return false;
  }
};

/**
 * Retrieve stored tokens
 */
const getStoredTokens = async () => {
  try {
    const accessToken = await SecureStore.getItemAsync(STRAVA_ACCESS_TOKEN_KEY);
    const refreshToken = await SecureStore.getItemAsync(STRAVA_REFRESH_TOKEN_KEY);
    const expiresAt = await SecureStore.getItemAsync(STRAVA_TOKEN_EXPIRY_KEY);
    const athleteData = await SecureStore.getItemAsync(STRAVA_ATHLETE_KEY);
    
    if (accessToken && refreshToken && expiresAt) {
      return {
        accessToken,
        refreshToken,
        expiresAt: parseInt(expiresAt),
        athlete: athleteData ? JSON.parse(athleteData) : null
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving tokens:', error.message);
    return null;
  }
};

/**
 * Check if token is expired
 */
const isTokenExpired = (expiresAt) => {
  const now = Date.now() / 1000;
  return now >= expiresAt;
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (refreshToken) => {
  console.log('═══════════════════════════════════════════════════');
  console.log('🔄 [REFRESH_TOKEN] Starting token refresh...');
  console.log('═══════════════════════════════════════════════════');
  
  try {
    logDebug('Refreshing access token', { refreshToken: refreshToken.substring(0, 10) + '...' });
    
    const requestBody = {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    };
    
    console.log('📤 [REFRESH_TOKEN] Sending refresh request to:', STRAVA_TOKEN_URL);
    console.log('📊 [REFRESH_TOKEN] Request body:', {
      hasClientId: !!requestBody.client_id,
      hasClientSecret: !!requestBody.client_secret,
      grantType: requestBody.grant_type,
      hasRefreshToken: !!requestBody.refresh_token
    });
    
    const response = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 [REFRESH_TOKEN] Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    const data = await response.json();
    logDebug('Token refresh response', data);

    if (!response.ok) {
      console.error('❌ [REFRESH_TOKEN] Refresh failed:', data);
      throw new Error(data.message || 'Failed to refresh token');
    }

    console.log('✅ [REFRESH_TOKEN] Token refreshed successfully');
    console.log('💾 [REFRESH_TOKEN] Storing new tokens...');
    
    // Store new tokens
    await storeTokens(
      data.access_token,
      data.refresh_token,
      data.expires_at,
      data.athlete
    );

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [REFRESH_TOKEN] Token refresh complete!');
    console.log('═══════════════════════════════════════════════════');
    
    return data.access_token;
  } catch (error) {
    logError('Error refreshing token', error);
    console.log('═══════════════════════════════════════════════════');
    throw error;
  }
};

/**
 * Get valid access token (refresh if needed)
 */
const getValidAccessToken = async () => {
  const tokens = await getStoredTokens();
  
  if (!tokens) {
    throw new Error('Not connected to Strava. Please connect your account first.');
  }

  if (isTokenExpired(tokens.expiresAt)) {
    const newToken = await refreshAccessToken(tokens.refreshToken);
    return newToken;
  }

  return tokens.accessToken;
};

/**
 * Exchange authorization code for tokens
 */
const exchangeCodeForToken = async (code) => {
  console.log('═══════════════════════════════════════════════════');
  console.log('🔄 [EXCHANGE_CODE] Starting code exchange...');
  console.log('═══════════════════════════════════════════════════');
  
  try {
    logDebug('📤 Exchanging code for token', { 
      code: code.substring(0, 10) + '...',
      fullCode: code,
      codeLength: code.length,
      clientId: STRAVA_CLIENT_ID
    });

    const requestBody = {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
    };

    logDebug('📤 Token exchange request', {
      url: STRAVA_TOKEN_URL,
      method: 'POST',
      hasClientId: !!requestBody.client_id,
      hasClientSecret: !!requestBody.client_secret,
      hasCode: !!requestBody.code,
      grantType: requestBody.grant_type
    });

    console.log('📤 [EXCHANGE_CODE] Sending request to Strava...');
    const response = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    logDebug('📥 Token exchange response received', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: response.headers
    });

    const data = await response.json();
    
    logDebug('📥 Token exchange response data', {
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      hasAthlete: !!data.athlete,
      expiresAt: data.expires_at,
      athleteId: data.athlete?.id,
      athleteName: data.athlete ? `${data.athlete.firstname} ${data.athlete.lastname}` : 'N/A',
      errors: data.errors,
      message: data.message,
      fullResponse: JSON.stringify(data).substring(0, 200)
    });

    if (!response.ok) {
      logError('❌ Token exchange failed', {
        status: response.status,
        data: data
      });
      console.log('═══════════════════════════════════════════════════');
      throw new Error(data.message || `Failed to exchange code for token (${response.status})`);
    }

    if (!data.access_token) {
      logError('❌ No access token in response', { data });
      console.log('═══════════════════════════════════════════════════');
      throw new Error('No access token received from Strava');
    }

    logDebug('💾 Storing tokens...', {});
    
    // Store tokens securely
    const stored = await storeTokens(
      data.access_token,
      data.refresh_token,
      data.expires_at,
      data.athlete
    );

    if (!stored) {
      logError('❌ Failed to store tokens', {});
      console.log('═══════════════════════════════════════════════════');
      throw new Error('Failed to store tokens securely');
    }

    logDebug('✅ Tokens stored successfully', {});

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [EXCHANGE_CODE] Code exchange complete!');
    console.log('═══════════════════════════════════════════════════');

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      athlete: data.athlete,
    };
  } catch (error) {
    logError('❌ Error exchanging code for token', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    console.log('═══════════════════════════════════════════════════');
    throw error;
  }
};

/**
 * Initialize OAuth flow with Express server
 */
const connectStrava = async () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('🚀 [CONNECT_STRAVA] Starting OAuth flow...');
  console.log('═══════════════════════════════════════════════════');
  
  try {
    const redirectUri = REDIRECT_URI;
    const sessionId = Date.now().toString();
    
    logDebug('🚀 Starting OAuth flow with server', { 
      redirectUri,
      sessionId,
      clientId: STRAVA_CLIENT_ID,
      oauthServer: OAUTH_SERVER_URL
    });

    // Build authorization URL with session ID as state
    const authUrl = `${STRAVA_AUTH_URL}?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&approval_prompt=auto&scope=activity:read_all,profile:read_all&state=${sessionId}`;

    logDebug('🌐 Opening auth URL', { 
      authUrl: authUrl.substring(0, 150) + '...',
      hasState: authUrl.includes('state='),
      fullAuthUrl: authUrl
    });

    logDebug('📱 Opening browser for authorization...', {});
    
    console.log('📱 [CONNECT_STRAVA] Opening browser with WebBrowser.openBrowserAsync()');
    
    // Open browser for Strava authorization
    // User will authorize, then server handles the callback
    const result = await WebBrowser.openBrowserAsync(authUrl);
    
    logDebug('📱 Browser closed/returned', { type: result.type });
    console.log('📱 [CONNECT_STRAVA] Browser result:', {
      type: result.type,
      url: result.url
    });

    // After user authorizes and browser redirects to server,
    // the server processes the code and stores the result
    // We need to check with the server for the auth result
    
    if (result.type === 'cancel') {
      logDebug('❌ User cancelled authorization', {});
      console.log('═══════════════════════════════════════════════════');
      return {
        success: false,
        error: 'Authorization cancelled'
      };
    }

    // Poll the server for auth result
    logDebug('🔍 Checking server for auth result...', { 
      sessionId,
      serverUrl: OAUTH_SERVER_URL 
    });
    
    console.log('🔍 [CONNECT_STRAVA] Starting server polling...');
    
    const maxAttempts = 20; // Increased to 20 attempts (20 seconds)
    const pollInterval = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      logDebug(`📊 Poll attempt ${attempt}/${maxAttempts}`, { 
        url: `${OAUTH_SERVER_URL}/auth-status/${sessionId}` 
      });
      
      console.log(`🔄 [CONNECT_STRAVA] Poll attempt ${attempt}/${maxAttempts}`);
      
      try {
        console.log(`📤 [CONNECT_STRAVA] Fetching: ${OAUTH_SERVER_URL}/auth-status/${sessionId}`);
        
        const statusResponse = await fetch(`${OAUTH_SERVER_URL}/auth-status/${sessionId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        logDebug(`📥 Server response`, {
          status: statusResponse.status,
          ok: statusResponse.ok,
          statusText: statusResponse.statusText
        });
        
        console.log(`📥 [CONNECT_STRAVA] Server response:`, {
          status: statusResponse.status,
          ok: statusResponse.ok,
          statusText: statusResponse.statusText
        });
        
        if (statusResponse.ok) {
          console.log('✅ [CONNECT_STRAVA] Got 200 OK response, parsing JSON...');
          const authData = await statusResponse.json();
          
          logDebug('✅ Got auth data from server', {
            success: authData.success,
            hasAccessToken: !!authData.accessToken,
            hasRefreshToken: !!authData.refreshToken,
            hasAthlete: !!authData.athlete,
            athleteId: authData.athlete?.id,
            athleteName: authData.athlete ? `${authData.athlete.firstname} ${authData.athlete.lastname}` : 'N/A',
            fullData: JSON.stringify(authData).substring(0, 300)
          });
          
          console.log('📊 [CONNECT_STRAVA] Auth data:', {
            success: authData.success,
            hasAccessToken: !!authData.accessToken,
            hasRefreshToken: !!authData.refreshToken,
            hasAthlete: !!authData.athlete,
            error: authData.error
          });
          
          if (authData.success) {
            console.log('✅ [CONNECT_STRAVA] Success! Storing tokens...');
            
            // Store tokens
            logDebug('💾 Storing tokens from server response...', {});
            await storeTokens(
              authData.accessToken,
              authData.refreshToken,
              authData.expiresAt,
              authData.athlete
            );
            
            logDebug('✅ OAuth complete! Returning to app...', {});
            
            console.log('═══════════════════════════════════════════════════');
            console.log('🎉 [CONNECT_STRAVA] OAuth flow complete!');
            console.log('═══════════════════════════════════════════════════');
            
            return {
              success: true,
              athlete: authData.athlete
            };
          } else {
            logError('❌ Server returned error', { error: authData.error });
            console.log('═══════════════════════════════════════════════════');
            return {
              success: false,
              error: authData.error || 'Authentication failed'
            };
          }
        } else if (statusResponse.status === 404) {
          // Session not found yet, wait and retry
          logDebug('⏳ Session not ready yet, waiting...', { 
            attempt,
            maxAttempts,
            willRetry: attempt < maxAttempts
          });
          
          console.log(`⏳ [CONNECT_STRAVA] Session not ready (404), waiting ${pollInterval}ms...`);
          
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        } else {
          const errorText = await statusResponse.text();
          logError('⚠️ Unexpected server response', { 
            status: statusResponse.status,
            errorText: errorText.substring(0, 200)
          });
          
          console.error(`⚠️ [CONNECT_STRAVA] Unexpected status ${statusResponse.status}:`, errorText.substring(0, 200));
          
          throw new Error(`Server returned ${statusResponse.status}: ${errorText}`);
        }
      } catch (pollError) {
        logError(`⚠️ Poll attempt ${attempt} failed`, { 
          error: pollError.message,
          attempt,
          maxAttempts,
          willRetry: attempt < maxAttempts
        });
        
        console.error(`❌ [CONNECT_STRAVA] Poll attempt ${attempt} failed:`, {
          error: pollError.message,
          stack: pollError.stack
        });
        
        if (attempt === maxAttempts) {
          logError('❌ Max poll attempts reached', { maxAttempts });
          console.log('═══════════════════════════════════════════════════');
          throw new Error('Timeout: Failed to get authorization result from server. Please try again.');
        }
        
        // Wait before retrying
        console.log(`⏳ [CONNECT_STRAVA] Waiting ${pollInterval}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    console.log('⏰ [CONNECT_STRAVA] Timeout reached after all poll attempts');
    console.log('═══════════════════════════════════════════════════');
    
    return {
      success: false,
      error: 'Timeout waiting for authorization result'
    };
  } catch (error) {
    logError('💥 OAuth flow error - CAUGHT EXCEPTION', {
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack
    });
    
    console.log('═══════════════════════════════════════════════════');
    
    return {
      success: false,
      error: error.message || 'An unknown error occurred during OAuth',
    };
  }
};

/**
 * Get athlete profile
 */
const getAthleteProfile = async () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('👤 [GET_ATHLETE_PROFILE] Fetching athlete profile...');
  console.log('═══════════════════════════════════════════════════');
  
  try {
    console.log('🔑 [GET_ATHLETE_PROFILE] Getting valid access token...');
    const accessToken = await getValidAccessToken();
    
    logDebug('Fetching athlete profile', {});

    console.log('📤 [GET_ATHLETE_PROFILE] Sending request to:', `${STRAVA_API_BASE}/athlete`);
    const response = await fetch(`${STRAVA_API_BASE}/athlete`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('📥 [GET_ATHLETE_PROFILE] Response received:', {
      status: response.status,
      ok: response.ok
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [GET_ATHLETE_PROFILE] Request failed:', data);
      console.log('═══════════════════════════════════════════════════');
      throw new Error(data.message || 'Failed to fetch athlete profile');
    }

    logDebug('Athlete profile fetched', {
      id: data.id,
      username: data.username,
      firstname: data.firstname,
      lastname: data.lastname
    });

    console.log('💾 [GET_ATHLETE_PROFILE] Updating stored athlete data...');
    // Update stored athlete data
    await SecureStore.setItemAsync(STRAVA_ATHLETE_KEY, JSON.stringify(data));

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [GET_ATHLETE_PROFILE] Profile fetched successfully!');
    console.log('═══════════════════════════════════════════════════');

    return data;
  } catch (error) {
    logError('Error fetching athlete profile', error);
    console.log('═══════════════════════════════════════════════════');
    throw error;
  }
};

/**
 * Get athlete activities
 */
const getAthleteActivities = async () => {
  try {
    const accessToken = await getValidAccessToken();

    const url = `${STRAVA_API_BASE}/athlete/activities`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch activities');
    }

    return data;
  } catch (error) {
    console.error('Error fetching activities:', error.message);
    throw error;
  }
};

/**
 * Get specific activity details
 */
const getActivity = async (activityId) => {
  console.log('═══════════════════════════════════════════════════');
  console.log('🔍 [GET_ACTIVITY] Fetching activity details...');
  console.log('📊 [GET_ACTIVITY] Activity ID:', activityId);
  console.log('═══════════════════════════════════════════════════');
  
  try {
    console.log('🔑 [GET_ACTIVITY] Getting valid access token...');
    const accessToken = await getValidAccessToken();
    
    logDebug('Fetching activity details', { activityId });

    const url = `${STRAVA_API_BASE}/activities/${activityId}`;
    console.log('📤 [GET_ACTIVITY] Sending request to:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('📥 [GET_ACTIVITY] Response received:', {
      status: response.status,
      ok: response.ok
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ [GET_ACTIVITY] Request failed:', data);
      console.log('═══════════════════════════════════════════════════');
      throw new Error(data.message || 'Failed to fetch activity');
    }

    logDebug('Activity details fetched', {
      id: data.id,
      name: data.name,
      type: data.type,
      distance: data.distance
    });

    console.log('✅ [GET_ACTIVITY] Activity fetched:', {
      id: data.id,
      name: data.name,
      type: data.type,
      distance: data.distance,
      duration: data.moving_time
    });

    console.log('═══════════════════════════════════════════════════');

    return data;
  } catch (error) {
    logError('Error fetching activity', error);
    console.log('═══════════════════════════════════════════════════');
    throw error;
  }
};

/**
 * Check if user is connected
 */
const isConnected = async () => {
  try {
    const tokens = await getStoredTokens();
    return tokens !== null;
  } catch (error) {
    console.error('Error checking connection:', error.message);
    return false;
  }
};

/**
 * Get stored athlete data
 */
const getStoredAthlete = async () => {
  try {
    const tokens = await getStoredTokens();
    return tokens?.athlete || null;
  } catch (error) {
    console.error('Error getting stored athlete:', error.message);
    return null;
  }
};

/**
 * Disconnect (clear stored tokens)
 */
const disconnect = async () => {
  try {
    await SecureStore.deleteItemAsync(STRAVA_ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(STRAVA_REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(STRAVA_TOKEN_EXPIRY_KEY);
    await SecureStore.deleteItemAsync(STRAVA_ATHLETE_KEY);
    
    return true;
  } catch (error) {
    console.error('Error disconnecting:', error.message);
    return false;
  }
};

console.log('📦 Exporting Strava Service');

export default {
  connectStrava,
  getAthleteProfile,
  getAthleteActivities,
  getActivity,
  isConnected,
  getStoredAthlete,
  disconnect,
  refreshAccessToken,
};