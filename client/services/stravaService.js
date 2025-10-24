import * as WebBrowser from 'expo-web-browser';

// This is important for the redirect to work properly
WebBrowser.maybeCompleteAuthSession();

const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID;
const OAUTH_SERVER_HOST = process.env.EXPO_PUBLIC_OAUTH_SERVER_HOST || '10.85.28.154';

// OAuth endpoints
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/mobile/authorize';

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
            console.log('✅ [CONNECT_STRAVA] Success! Returning tokens...');
            
            logDebug('✅ OAuth complete! Returning to app...', {});
            
            console.log('═══════════════════════════════════════════════════');
            console.log('🎉 [CONNECT_STRAVA] OAuth flow complete!');
            console.log('═══════════════════════════════════════════════════');
            
            return {
              success: true,
              accessToken: authData.accessToken,
              refreshToken: authData.refreshToken,
              expiresAt: authData.expiresAt,
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

console.log('📦 Exporting Strava Service');

export default {
  connectStrava,
};