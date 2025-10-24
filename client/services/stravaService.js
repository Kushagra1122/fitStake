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

/**
 * Comprehensive Strava data fetching service
 * This service fetches all available data from Strava API
 */

// Additional Strava API endpoints
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

/**
 * Fetch comprehensive athlete data including stats, zones, etc.
 */
const fetchAthleteData = async (accessToken) => {
  try {
    const [athlete, stats, zones] = await Promise.all([
      fetch(`${STRAVA_API_BASE}/athlete`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).then(res => res.json()),
      
      fetch(`${STRAVA_API_BASE}/athletes/${athlete?.id}/stats`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).then(res => res.json()).catch(() => null), // Stats might not be available
      
      fetch(`${STRAVA_API_BASE}/athlete/zones`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).then(res => res.json()).catch(() => null) // Zones might not be available
    ]);

    return {
      athlete,
      stats,
      zones
    };
  } catch (error) {
    console.error('Error fetching athlete data:', error);
    throw error;
  }
};

/**
 * Fetch detailed activity data including streams, photos, comments, kudos
 */
const fetchActivityDetails = async (accessToken, activityId) => {
  try {
    const [activity, streams, photos, comments, kudos] = await Promise.all([
      fetch(`${STRAVA_API_BASE}/activities/${activityId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).then(res => res.json()),
      
      fetch(`${STRAVA_API_BASE}/activities/${activityId}/streams?keys=time,distance,latlng,altitude,velocity_smooth,heartrate,cadence,watts,temp,moving,grade_smooth&key_by_type=true`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).then(res => res.json()).catch(() => null),
      
      fetch(`${STRAVA_API_BASE}/activities/${activityId}/photos`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).then(res => res.json()).catch(() => null),
      
      fetch(`${STRAVA_API_BASE}/activities/${activityId}/comments`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).then(res => res.json()).catch(() => null),
      
      fetch(`${STRAVA_API_BASE}/activities/${activityId}/kudos`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).then(res => res.json()).catch(() => null)
    ]);

    return {
      activity,
      streams,
      photos,
      comments,
      kudos
    };
  } catch (error) {
    console.error(`Error fetching activity ${activityId} details:`, error);
    throw error;
  }
};

/**
 * Fetch athlete's segments (starred segments)
 */
const fetchAthleteSegments = async (accessToken, athleteId) => {
  try {
    const response = await fetch(`${STRAVA_API_BASE}/athletes/${athleteId}/segments`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch segments: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const segments = await response.json();
    return Array.isArray(segments) ? segments : [];
  } catch (error) {
    console.error('Error fetching athlete segments:', error);
    return [];
  }
};

/**
 * Fetch athlete's routes
 */
const fetchAthleteRoutes = async (accessToken, athleteId) => {
  try {
    const response = await fetch(`${STRAVA_API_BASE}/athletes/${athleteId}/routes`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch routes: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const routes = await response.json();
    return Array.isArray(routes) ? routes : [];
  } catch (error) {
    console.error('Error fetching athlete routes:', error);
    return [];
  }
};

/**
 * Fetch athlete's clubs
 */
const fetchAthleteClubs = async (accessToken, athleteId) => {
  try {
    const response = await fetch(`${STRAVA_API_BASE}/athletes/${athleteId}/clubs`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch clubs: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const clubs = await response.json();
    return Array.isArray(clubs) ? clubs : [];
  } catch (error) {
    console.error('Error fetching athlete clubs:', error);
    return [];
  }
};

/**
 * Fetch athlete's gear (bikes and shoes)
 */
const fetchAthleteGear = async (accessToken, athleteId) => {
  try {
    const response = await fetch(`${STRAVA_API_BASE}/athletes/${athleteId}/gear`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch gear: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const gear = await response.json();
    return Array.isArray(gear) ? gear : [];
  } catch (error) {
    console.error('Error fetching athlete gear:', error);
    return [];
  }
};

/**
 * Fetch segment details including leaderboard
 */
const fetchSegmentDetails = async (accessToken, segmentId) => {
  try {
    const [segment, leaderboard] = await Promise.all([
      fetch(`${STRAVA_API_BASE}/segments/${segmentId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).then(res => res.json()),
      
      fetch(`${STRAVA_API_BASE}/segments/${segmentId}/leaderboard`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).then(res => res.json()).catch(() => null)
    ]);

    return {
      segment,
      leaderboard
    };
  } catch (error) {
    console.error(`Error fetching segment ${segmentId} details:`, error);
    throw error;
  }
};

/**
 * Fetch comprehensive Strava data for a user
 * This is the main function that fetches ALL available data
 */
const fetchAllStravaData = async (accessToken, athleteId, options = {}) => {
  console.log('🚀 Starting comprehensive Strava data fetch...');
  
  const {
    includeActivities = true,
    includeDetailedActivities = false,
    maxActivities = 50,
    includeSegments = true,
    includeRoutes = true,
    includeClubs = true,
    includeGear = true,
    includeStats = true,
    includeZones = true
  } = options;

  try {
    const results = {
      timestamp: new Date().toISOString(),
      athleteId,
      data: {}
    };

    // 1. Fetch athlete profile and stats
    console.log('📊 Fetching athlete profile and stats...');
    const athleteData = await fetchAthleteData(accessToken);
    results.data.athlete = athleteData.athlete;
    if (includeStats && athleteData.stats) {
      results.data.stats = athleteData.stats;
    }
    if (includeZones && athleteData.zones) {
      results.data.zones = athleteData.zones;
    }

    // 2. Fetch activities
    if (includeActivities) {
      console.log('🏃 Fetching activities...');
      const activities = await fetch(`${STRAVA_API_BASE}/athlete/activities?per_page=${maxActivities}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).then(res => res.json());
      
      results.data.activities = activities;

      // 3. Fetch detailed activity data if requested
      if (includeDetailedActivities && activities.length > 0) {
        console.log('📈 Fetching detailed activity data...');
        const detailedActivities = [];
        
        // Limit to first 10 activities for detailed data to avoid rate limits
        const activitiesToDetail = activities.slice(0, Math.min(10, activities.length));
        
        for (const activity of activitiesToDetail) {
          try {
            const details = await fetchActivityDetails(accessToken, activity.id);
            detailedActivities.push(details);
          } catch (error) {
            console.warn(`Failed to fetch details for activity ${activity.id}:`, error.message);
          }
        }
        
        results.data.detailedActivities = detailedActivities;
      }
    }

    // 4. Fetch segments
    if (includeSegments) {
      console.log('🏁 Fetching segments...');
      try {
        results.data.segments = await fetchAthleteSegments(accessToken, athleteId);
      } catch (error) {
        console.warn('Failed to fetch segments:', error.message);
        results.data.segments = [];
      }
    }

    // 5. Fetch routes
    if (includeRoutes) {
      console.log('🗺️ Fetching routes...');
      try {
        results.data.routes = await fetchAthleteRoutes(accessToken, athleteId);
      } catch (error) {
        console.warn('Failed to fetch routes:', error.message);
        results.data.routes = [];
      }
    }

    // 6. Fetch clubs
    if (includeClubs) {
      console.log('👥 Fetching clubs...');
      try {
        results.data.clubs = await fetchAthleteClubs(accessToken, athleteId);
      } catch (error) {
        console.warn('Failed to fetch clubs:', error.message);
        results.data.clubs = [];
      }
    }

    // 7. Fetch gear
    if (includeGear) {
      console.log('🚴 Fetching gear...');
      try {
        results.data.gear = await fetchAthleteGear(accessToken, athleteId);
      } catch (error) {
        console.warn('Failed to fetch gear:', error.message);
        results.data.gear = [];
      }
    }

    console.log('✅ Comprehensive Strava data fetch completed!');
    return results;

  } catch (error) {
    console.error('❌ Error fetching comprehensive Strava data:', error);
    throw error;
  }
};

/**
 * Get summary statistics from fetched data
 */
const getDataSummary = (data) => {
  const summary = {
    athlete: {
      name: `${data.athlete?.firstname} ${data.athlete?.lastname}`,
      username: data.athlete?.username,
      location: data.athlete?.city && data.athlete?.country 
        ? `${data.athlete.city}, ${data.athlete.country}` 
        : null,
      profilePicture: data.athlete?.profile,
      memberSince: data.athlete?.created_at,
      premium: data.athlete?.premium
    },
    activities: {
      total: data.activities?.length || 0,
      types: data.activities?.reduce((acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      }, {}) || {},
      totalDistance: data.activities?.reduce((sum, activity) => sum + (activity.distance || 0), 0) || 0,
      totalTime: data.activities?.reduce((sum, activity) => sum + (activity.moving_time || 0), 0) || 0
    },
    segments: {
      total: data.segments?.length || 0
    },
    routes: {
      total: data.routes?.length || 0
    },
    clubs: {
      total: data.clubs?.length || 0,
      names: data.clubs?.map(club => club.name) || []
    },
    gear: {
      bikes: data.gear?.filter(item => item.resource_state === 3 && item.frame_type === 1) || [],
      shoes: data.gear?.filter(item => item.resource_state === 3 && item.frame_type === 4) || []
    }
  };

  return summary;
};

console.log('📦 Exporting Strava Service');

export default {
  connectStrava,
  fetchAllStravaData,
  fetchAthleteData,
  fetchActivityDetails,
  fetchAthleteSegments,
  fetchAthleteRoutes,
  fetchAthleteClubs,
  fetchAthleteGear,
  fetchSegmentDetails,
  getDataSummary,
};