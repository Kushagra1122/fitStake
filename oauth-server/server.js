const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`🌐 [${timestamp}] ${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Enable CORS for your app
app.use(cors());
app.use(express.json());

// Strava OAuth configuration
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const APP_SCHEME = process.env.APP_SCHEME || 'fitstake';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

// Store pending auth sessions temporarily (in production, use Redis)
const pendingAuth = new Map();

// Health check
app.get('/', (req, res) => {
  console.log('🔍 Health check received');
  res.json({ 
    status: 'OK', 
    message: 'Strava OAuth Server Running',
    endpoints: {
      callback: '/exchange_token',
      status: '/auth-status/:sessionId'
    }
  });
});

// Handle Strava OAuth callback
app.get('/exchange_token', async (req, res) => {
  const { code, error, state } = req.query;

  console.log('📥 Received OAuth callback:', {
    hasCode: !!code,
    hasError: !!error,
    state,
    queryParams: req.query,
    timestamp: new Date().toISOString()
  });

  // Log environment variables status (without revealing secrets)
  console.log('🔧 Environment check:', {
    hasClientId: !!STRAVA_CLIENT_ID,
    hasClientSecret: !!STRAVA_CLIENT_SECRET,
    clientIdLength: STRAVA_CLIENT_ID ? STRAVA_CLIENT_ID.length : 0,
    port: PORT
  });

  // Handle error from Strava
  if (error) {
    console.error('❌ Strava OAuth error:', {
      error,
      state,
      fullQuery: req.query,
      timestamp: new Date().toISOString()
    });
    
    // Store error for app to fetch
    const sessionId = state || Date.now().toString();
    pendingAuth.set(sessionId, {
      success: false,
      error: error,
      timestamp: Date.now()
    });

    console.log(`💾 Stored error state for session: ${sessionId}`);
    
    // Show error page instead of redirecting
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Failed</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
              padding: 20px;
            }
            .container {
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
              max-width: 500px;
            }
            .error-icon { font-size: 80px; margin-bottom: 20px; }
            h1 { margin: 0 0 10px 0; font-size: 32px; }
            p { font-size: 18px; opacity: 0.9; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">❌</div>
            <h1>Authentication Failed</h1>
            <p>Error: ${error}</p>
            <p style="margin-top: 30px;">Please return to your app and try again.</p>
          </div>
        </body>
      </html>
    `);
  }

  // Handle missing code
  if (!code) {
    console.error('❌ No authorization code received:', {
      queryParams: req.query,
      state,
      headers: req.headers
    });
    
    const sessionId = state || Date.now().toString();
    pendingAuth.set(sessionId, {
      success: false,
      error: 'No authorization code received',
      timestamp: Date.now()
    });

    console.log(`💾 Stored missing code error for session: ${sessionId}`);
    
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Failed</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
              padding: 20px;
            }
            .container {
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
              max-width: 500px;
            }
            .error-icon { font-size: 80px; margin-bottom: 20px; }
            h1 { margin: 0 0 10px 0; font-size: 32px; }
            p { font-size: 18px; opacity: 0.9; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">❌</div>
            <h1>Authentication Failed</h1>
            <p>No authorization code received</p>
            <p style="margin-top: 30px;">Please return to your app and try again.</p>
          </div>
        </body>
      </html>
    `);
  }

  try {
    console.log('📤 Exchanging code for token...', {
      codeLength: code.length,
      state,
      clientId: STRAVA_CLIENT_ID ? `${STRAVA_CLIENT_ID.substring(0, 5)}...` : 'missing',
      tokenUrl: STRAVA_TOKEN_URL
    });
    
    // Exchange code for access token
    const tokenExchangeStart = Date.now();
    const response = await axios.post(STRAVA_TOKEN_URL, {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code'
    });

    const tokenExchangeTime = Date.now() - tokenExchangeStart;
    
    console.log('✅ Token exchange successful:', {
      responseTime: `${tokenExchangeTime}ms`,
      status: response.status,
      hasAccessToken: !!response.data.access_token,
      hasRefreshToken: !!response.data.refresh_token,
      athleteId: response.data.athlete?.id,
      athleteName: `${response.data.athlete?.firstname} ${response.data.athlete?.lastname}`,
      expiresAt: response.data.expires_at,
      tokenScopes: response.data.scope
    });

    // Generate session ID
    const sessionId = state || Date.now().toString();
    
    // Store the result temporarily for the app to fetch
    pendingAuth.set(sessionId, {
      success: true,
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: response.data.expires_at,
      athlete: response.data.athlete,
      timestamp: Date.now()
    });

    // Clean up old sessions (older than 5 minutes)
    const cleanupStart = Date.now();
    let cleanedCount = 0;
    for (const [key, value] of pendingAuth.entries()) {
      if (Date.now() - value.timestamp > 300000) {
        pendingAuth.delete(key);
        cleanedCount++;
      }
    }
    const cleanupTime = Date.now() - cleanupStart;

    console.log(`🧹 Session cleanup completed:`, {
      cleanedCount,
      remainingSessions: pendingAuth.size,
      cleanupTime: `${cleanupTime}ms`
    });

    console.log(`💾 Stored auth data with sessionId: ${sessionId}`);
    
    // Show success page
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful!</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
              padding: 20px;
            }
            .container {
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
              max-width: 500px;
            }
            .success-icon {
              font-size: 80px;
              margin-bottom: 20px;
              animation: bounce 1s infinite;
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-20px); }
            }
            h1 { margin: 0 0 10px 0; font-size: 32px; }
            p { font-size: 18px; opacity: 0.9; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h1>Auth Successful</h1>
            <p style="margin-top: 30px; font-size: 20px; font-weight: bold;">
              Open your app
            </p>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Token exchange failed:', {
      error: error.message,
      stack: error.stack,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
      requestUrl: error.config?.url,
      requestMethod: error.config?.method,
      requestData: error.config?.data ? JSON.parse(error.config.data) : null,
      timestamp: new Date().toISOString()
    });

    const sessionId = state || Date.now().toString();
    pendingAuth.set(sessionId, {
      success: false,
      error: error.response?.data?.message || error.message,
      details: error.response?.data,
      timestamp: Date.now()
    });

    console.log(`💾 Stored token exchange error for session: ${sessionId}`);
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Failed</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
              padding: 20px;
            }
            .container {
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
              max-width: 500px;
            }
            .error-icon { font-size: 80px; margin-bottom: 20px; }
            h1 { margin: 0 0 10px 0; font-size: 32px; }
            p { font-size: 18px; opacity: 0.9; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">❌</div>
            <h1>Authentication Failed</h1>
            <p>Error: ${error.message}</p>
            <p style="margin-top: 30px;">Please return to your app and try again.</p>
          </div>
        </body>
      </html>
    `);
  }
});

// Endpoint for app to fetch auth result
app.get('/auth-status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  console.log(`📊 Auth status check for session: ${sessionId}`, {
    timestamp: new Date().toISOString(),
    pendingSessions: pendingAuth.size,
    hasSession: pendingAuth.has(sessionId)
  });
  
  const authData = pendingAuth.get(sessionId);
  
  if (!authData) {
    console.log(`❌ Session not found: ${sessionId}`, {
      availableSessions: Array.from(pendingAuth.keys())
    });
    
    return res.status(404).json({
      success: false,
      error: 'Session not found or expired',
      availableSessions: Array.from(pendingAuth.keys())
    });
  }

  // Return and remove the data (one-time use)
  pendingAuth.delete(sessionId);
  
  console.log(`✅ Returning auth data for session: ${sessionId}`, {
    success: authData.success,
    hasAccessToken: !!authData.accessToken,
    athleteId: authData.athlete?.id,
    remainingSessions: pendingAuth.size
  });
  
  res.json(authData);
});

// Get server info
app.get('/info', (req, res) => {
  console.log('🔍 Server info requested');
  
  const info = {
    server: 'Strava OAuth Server',
    version: '1.0.0',
    clientId: STRAVA_CLIENT_ID ? `${STRAVA_CLIENT_ID.substring(0, 5)}...` : 'missing',
    clientSecret: STRAVA_CLIENT_SECRET ? '***' + STRAVA_CLIENT_SECRET.substring(STRAVA_CLIENT_SECRET.length - 3) : 'missing',
    redirectUri: `http://localhost:${PORT}/exchange_token`,
    appScheme: APP_SCHEME,
    pendingSessions: pendingAuth.size,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  };
  
  console.log('📋 Server info:', info);
  res.json(info);
});

// Enhanced error handling for unhandled routes
app.use('*', (req, res) => {
  console.error('❌ Route not found:', {
    method: req.method,
    path: req.originalUrl,
    query: req.query,
    body: req.body
  });
  
  res.status(404).json({
    success: false,
    error: 'Route not found',
    availableEndpoints: [
      'GET /',
      'GET /exchange_token',
      'GET /auth-status/:sessionId',
      'GET /info'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 ============================================');
  console.log(`🚀 Strava OAuth Server running on port ${PORT}`);
  console.log('🚀 ============================================');
  console.log(`📍 Callback URL: http://localhost:${PORT}/exchange_token`);
  console.log(`📱 App Scheme: ${APP_SCHEME}://oauth-callback`);
  console.log(`🔑 Client ID: ${STRAVA_CLIENT_ID}`);
  console.log(`🔐 Client Secret: ${STRAVA_CLIENT_SECRET ? '***' + STRAVA_CLIENT_SECRET.substring(STRAVA_CLIENT_SECRET.length - 3) : 'MISSING'}`);
  console.log('');
  console.log('🔧 Add this to Strava settings:');
  console.log(`   Domain: localhost`);
  console.log(`   Redirect URI: http://localhost:${PORT}/exchange_token`);
  console.log('🚀 ============================================');
  
  // Log environment verification
  console.log('🔍 Environment Verification:');
  console.log(`   PORT: ${PORT}`);
  console.log(`   STRAVA_CLIENT_ID: ${STRAVA_CLIENT_ID ? '✓ Set' : '✗ Missing'}`);
  console.log(`   STRAVA_CLIENT_SECRET: ${STRAVA_CLIENT_SECRET ? '✓ Set' : '✗ Missing'}`);
  console.log(`   APP_SCHEME: ${APP_SCHEME}`);
  console.log('🚀 ============================================');
});

// Enhanced graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully', {
    pendingSessions: pendingAuth.size,
    timestamp: new Date().toISOString()
  });
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully', {
    pendingSessions: pendingAuth.size,
    timestamp: new Date().toISOString()
  });
  process.exit(0);
});

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Promise Rejection:', {
    reason,
    promise,
    timestamp: new Date().toISOString()
  });
});

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
});