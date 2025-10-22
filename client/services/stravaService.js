import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

// This is important for the redirect to work properly
WebBrowser.maybeCompleteAuthSession();

const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID ;
const STRAVA_CLIENT_SECRET = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET ;

// OAuth endpoints
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/mobile/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

// OAuth Server Configuration
// IMPORTANT: We use the same IP for both:
// 1. OAUTH_SERVER_URL - For app to poll server
// 2. STRAVA_REDIRECT_URI - For Strava to redirect
// Using your machine's IP address so it's accessible from both browser and app

const OAUTH_SERVER_URL = 'http://10.85.28.154:3000'; // Your machine's IP
// const OAUTH_SERVER_URL = 'http://10.0.2.2:3000'; // Android emulator (only if using localhost)
// const OAUTH_SERVER_URL = 'https://your-server.com'; // Production

// Strava redirects here (must be accessible by Strava's servers)
const STRAVA_REDIRECT_URI = 'http://10.85.28.154:3000/exchange_token';
const REDIRECT_URI = STRAVA_REDIRECT_URI; // For backwards compatibility

// Secure storage keys
const STRAVA_ACCESS_TOKEN_KEY = 'strava_access_token';
const STRAVA_REFRESH_TOKEN_KEY = 'strava_refresh_token';
const STRAVA_ATHLETE_KEY = 'strava_athlete_data';
const STRAVA_TOKEN_EXPIRY_KEY = 'strava_token_expiry';

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
    logDebug('💾 Storing tokens to SecureStore...', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      expiresAt,
      hasAthlete: !!athlete,
      athleteId: athlete?.id
    });
    
    await SecureStore.setItemAsync(STRAVA_ACCESS_TOKEN_KEY, accessToken);
    logDebug('✅ Stored access token', {});
    
    await SecureStore.setItemAsync(STRAVA_REFRESH_TOKEN_KEY, refreshToken);
    logDebug('✅ Stored refresh token', {});
    
    await SecureStore.setItemAsync(STRAVA_TOKEN_EXPIRY_KEY, expiresAt.toString());
    logDebug('✅ Stored expiry', {});
    
    await SecureStore.setItemAsync(STRAVA_ATHLETE_KEY, JSON.stringify(athlete));
    logDebug('✅ Stored athlete data', {});
    
    logDebug('✅ All tokens stored successfully', { expiresAt, athleteId: athlete?.id });
    return true;
  } catch (error) {
    logError('❌ Error storing tokens', {
      error: error.message,
      stack: error.stack
    });
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
    logError('Error retrieving tokens', error);
    return null;
  }
};

/**
 * Check if token is expired
 */
const isTokenExpired = (expiresAt) => {
  return Date.now() / 1000 >= expiresAt;
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    logDebug('Refreshing access token', { refreshToken: refreshToken.substring(0, 10) + '...' });
    
    const response = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();
    logDebug('Token refresh response', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to refresh token');
    }

    // Store new tokens
    await storeTokens(
      data.access_token,
      data.refresh_token,
      data.expires_at,
      data.athlete
    );

    return data.access_token;
  } catch (error) {
    logError('Error refreshing token', error);
    throw error;
  }
};

/**
 * Get valid access token (refresh if needed)
 */
const getValidAccessToken = async () => {
  const tokens = await getStoredTokens();
  
  if (!tokens) {
    throw new Error('No stored tokens found');
  }

  if (isTokenExpired(tokens.expiresAt)) {
    logDebug('Token expired, refreshing', {});
    return await refreshAccessToken(tokens.refreshToken);
  }

  return tokens.accessToken;
};

/**
 * Exchange authorization code for tokens
 */
const exchangeCodeForToken = async (code) => {
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
      throw new Error(data.message || `Failed to exchange code for token (${response.status})`);
    }

    if (!data.access_token) {
      logError('❌ No access token in response', { data });
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
      throw new Error('Failed to store tokens securely');
    }

    logDebug('✅ Tokens stored successfully', {});

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
    throw error;
  }
};

/**
 * Initialize OAuth flow with Express server
 */
const connectStrava = async () => {
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
      hasState: authUrl.includes('state=')
    });

    logDebug('📱 Opening browser for authorization...', {});
    
    // Open browser for Strava authorization
    // User will authorize, then server handles the callback
    const result = await WebBrowser.openBrowserAsync(authUrl);
    
    logDebug('📱 Browser closed/returned', { type: result.type });

    // After user authorizes and browser redirects to server,
    // the server processes the code and stores the result
    // We need to check with the server for the auth result
    
    if (result.type === 'cancel') {
      logDebug('❌ User cancelled authorization', {});
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
    
    const maxAttempts = 20; // Increased to 20 attempts (20 seconds)
    const pollInterval = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      logDebug(`📊 Poll attempt ${attempt}/${maxAttempts}`, { 
        url: `${OAUTH_SERVER_URL}/auth-status/${sessionId}` 
      });
      
      try {
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
        
        if (statusResponse.ok) {
          const authData = await statusResponse.json();
          
          logDebug('✅ Got auth data from server', {
            success: authData.success,
            hasAccessToken: !!authData.accessToken,
            hasRefreshToken: !!authData.refreshToken,
            hasAthlete: !!authData.athlete,
            athleteId: authData.athlete?.id,
            athleteName: authData.athlete ? `${authData.athlete.firstname} ${authData.athlete.lastname}` : 'N/A'
          });
          
          if (authData.success) {
            // Store tokens
            logDebug('💾 Storing tokens from server response...', {});
            await storeTokens(
              authData.accessToken,
              authData.refreshToken,
              authData.expiresAt,
              authData.athlete
            );
            
            logDebug('✅ OAuth complete! Returning to app...', {});
            return {
              success: true,
              athlete: authData.athlete
            };
          } else {
            logError('❌ Server returned error', { error: authData.error });
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
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        } else {
          const errorText = await statusResponse.text();
          logError('⚠️ Unexpected server response', { 
            status: statusResponse.status,
            errorText: errorText.substring(0, 200)
          });
          throw new Error(`Server returned ${statusResponse.status}: ${errorText}`);
        }
      } catch (pollError) {
        logError(`⚠️ Poll attempt ${attempt} failed`, { 
          error: pollError.message,
          attempt,
          maxAttempts,
          willRetry: attempt < maxAttempts
        });
        
        if (attempt === maxAttempts) {
          logError('❌ Max poll attempts reached', { maxAttempts });
          throw new Error('Timeout: Failed to get authorization result from server. Please try again.');
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
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
  try {
    const accessToken = await getValidAccessToken();
    
    logDebug('Fetching athlete profile', {});

    const response = await fetch(`${STRAVA_API_BASE}/athlete`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch athlete profile');
    }

    logDebug('Athlete profile fetched', {
      id: data.id,
      username: data.username,
      firstname: data.firstname,
      lastname: data.lastname
    });

    // Update stored athlete data
    await SecureStore.setItemAsync(STRAVA_ATHLETE_KEY, JSON.stringify(data));

    return data;
  } catch (error) {
    logError('Error fetching athlete profile', error);
    throw error;
  }
};

/**
 * Get athlete activities
 */
const getAthleteActivities = async (page = 1, perPage = 30) => {
  try {
    const accessToken = await getValidAccessToken();
    
    logDebug('Fetching athlete activities', { page, perPage });

    const response = await fetch(
      `${STRAVA_API_BASE}/athlete/activities?page=${page}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch activities');
    }

    logDebug('Activities fetched', { count: data.length });

    return data;
  } catch (error) {
    logError('Error fetching activities', error);
    throw error;
  }
};

/**
 * Get specific activity details
 */
const getActivity = async (activityId) => {
  try {
    const accessToken = await getValidAccessToken();
    
    logDebug('Fetching activity details', { activityId });

    const response = await fetch(
      `${STRAVA_API_BASE}/activities/${activityId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch activity');
    }

    logDebug('Activity details fetched', {
      id: data.id,
      name: data.name,
      type: data.type,
      distance: data.distance
    });

    return data;
  } catch (error) {
    logError('Error fetching activity', error);
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
    logDebug('Disconnected successfully', {});
    return true;
  } catch (error) {
    logError('Error disconnecting', error);
    return false;
  }
};

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
