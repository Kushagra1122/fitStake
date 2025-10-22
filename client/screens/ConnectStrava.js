import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
<<<<<<< HEAD
import { LinearGradient } from 'expo-linear-gradient';
import stravaService from '../services/stravaService';
=======
import { useWeb3 } from '../context/Web3Context';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
>>>>>>> 371d86680ff50dbe8ce75da249a1e1186ee18bc1

const { width } = Dimensions.get('window');

<<<<<<< HEAD
const ConnectStrava = () => {
=======
const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET;
const STRAVA_TOKEN_KEY = 'strava_token';

const discovery = {
  authorizationEndpoint: 'https://www.strava.com/oauth/authorize',
  tokenEndpoint: 'https://www.strava.com/api/v3/oauth/token',
};

export default function ConnectStrava() {
>>>>>>> 371d86680ff50dbe8ce75da249a1e1186ee18bc1
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [athlete, setAthlete] = useState(null);
  const [checkingConnection, setCheckingConnection] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

<<<<<<< HEAD
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 30,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Check if already connected on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Handle OAuth callback from deep link
  useEffect(() => {
    const handleDeepLinkCallback = async (url) => {
      if (!url) return;
      
      const urlObj = new URL(url.replace('fitstake://', 'http://'));
      const success = urlObj.searchParams.get('success');
      const error = urlObj.searchParams.get('error');
      
      if (error) {
        Alert.alert('Connection Failed', decodeURIComponent(error));
        setLoading(false);
        return;
      }
      
      if (success === 'true') {
        // The stravaService is already polling the server
      }
    };

    const handleUrl = ({ url }) => {
      handleDeepLinkCallback(url);
    };

    const { Linking } = require('react-native');
    
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLinkCallback(url);
      }
    });

    const subscription = Linking.addEventListener('url', handleUrl);

    return () => {
      subscription?.remove();
    };
  }, []);

  const checkConnection = async () => {
    try {
      const isConnected = await stravaService.isConnected();
      
      if (isConnected) {
        const storedAthlete = await stravaService.getStoredAthlete();
        setAthlete(storedAthlete);
        setConnected(true);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    } finally {
      setCheckingConnection(false);
=======
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [stravaData, setStravaData] = useState(null);

  // --- Debug Environment Variables ---
  console.log('═══════════════════════════════════════════════════');
  console.log('🔧 ENVIRONMENT SETUP');
  console.log('═══════════════════════════════════════════════════');
  console.log('🔹 STRAVA_CLIENT_ID:', STRAVA_CLIENT_ID);
  console.log('🔹 STRAVA_CLIENT_SECRET:', STRAVA_CLIENT_SECRET ? '***SET***' : 'MISSING');
  console.log('🔹 CLIENT_ID Length:', STRAVA_CLIENT_ID?.length || 0);

  // --- AuthSession Configuration ---
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'fit-stake',
    path: 'auth'
  });

  console.log('═══════════════════════════════════════════════════');
  console.log('🔧 AUTH SESSION CONFIGURATION');
  console.log('═══════════════════════════════════════════════════');
  console.log('🔹 Redirect URI:', redirectUri);
  console.log('🔹 Authorization Endpoint:', discovery.authorizationEndpoint);
  console.log('🔹 Token Endpoint:', discovery.tokenEndpoint);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: STRAVA_CLIENT_ID,
      scopes: [],
      redirectUri,
      responseType: 'code',
      extraParams: {
        scope: 'read,activity:read_all',
      },
    },
    discovery
  );

  // Log request details when ready
  useEffect(() => {
    if (request) {
      console.log('═══════════════════════════════════════════════════');
      console.log('✅ AUTH REQUEST CREATED');
      console.log('═══════════════════════════════════════════════════');
      console.log('🔹 Request URL:', request.url);
      console.log('🔹 Request Code Verifier:', request.codeVerifier ? 'Present' : 'Missing');
      console.log('🔹 Request State:', request.state);
      console.log('🔹 Full Request Object:', JSON.stringify(request, null, 2));
    } else {
      console.log('⏳ Auth request not ready yet...');
    }
  }, [request]);

  // --- Handle Deep Links (for extracting code from URL) ---
  useEffect(() => {
    console.log('═══════════════════════════════════════════════════');
    console.log('🔗 SETTING UP DEEP LINK LISTENER');
    console.log('═══════════════════════════════════════════════════');

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      console.log('🔹 Initial URL:', url);
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for deep link events
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('═══════════════════════════════════════════════════');
      console.log('🔗 DEEP LINK RECEIVED');
      console.log('═══════════════════════════════════════════════════');
      console.log('🔹 URL:', url);
      handleDeepLink(url);
    });

    return () => {
      console.log('🔹 Removing deep link listener');
      subscription.remove();
    };
  }, []);

  // --- Handle Deep Link URL ---
  const handleDeepLink = (url) => {
    console.log('═══════════════════════════════════════════════════');
    console.log('🔍 PARSING DEEP LINK');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔹 Full URL:', url);

    try {
      // Parse the URL
      const parsed = Linking.parse(url);
      console.log('🔹 Parsed URL:', JSON.stringify(parsed, null, 2));
      
      // Extract query parameters
      const params = parsed.queryParams;
      console.log('🔹 Query Params:', JSON.stringify(params, null, 2));

      // Check if we have a code
      if (params?.code) {
        console.log('═══════════════════════════════════════════════════');
        console.log('✅ AUTHORIZATION CODE FOUND IN URL');
        console.log('═══════════════════════════════════════════════════');
        console.log('🔹 Code:', params.code);
        console.log('🔹 State:', params.state);
        console.log('🔹 Scope:', params.scope);
        
        // Exchange the code for token
        exchangeCodeForToken(params.code);
      } else if (params?.error) {
        console.log('═══════════════════════════════════════════════════');
        console.error('❌ ERROR IN URL PARAMS');
        console.log('═══════════════════════════════════════════════════');
        console.error('🔹 Error:', params.error);
        console.error('🔹 Error Description:', params.error_description);
        Alert.alert('Authorization Error', params.error_description || params.error);
      } else {
        console.log('ℹ️  No code or error in URL params');
      }
    } catch (error) {
      console.log('═══════════════════════════════════════════════════');
      console.error('❌ ERROR PARSING DEEP LINK');
      console.log('═══════════════════════════════════════════════════');
      console.error('🔹 Error:', error.message);
      console.error('🔹 Stack:', error.stack);
    }
  };

  // --- Fade animation + initial check ---
  useEffect(() => {
    console.log('═══════════════════════════════════════════════════');
    console.log('🎬 COMPONENT MOUNTED');
    console.log('═══════════════════════════════════════════════════');
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    console.log('🔹 Starting initial Strava connection check...');
    checkStravaConnection();
  }, []);

  // --- OAuth response handling (backup method) ---
  useEffect(() => {
    console.log('═══════════════════════════════════════════════════');
    console.log('🔄 OAUTH RESPONSE CHANGED');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔹 Response Type:', response?.type);
    console.log('🔹 Full Response:', JSON.stringify(response, null, 2));

    if (response?.type === 'success') {
      console.log('═══════════════════════════════════════════════════');
      console.log('✅ OAUTH SUCCESS (via AuthSession)');
      console.log('═══════════════════════════════════════════════════');
      const { code } = response.params;
      console.log('🔹 Authorization Code:', code);
      console.log('🔹 Code Length:', code?.length);
      console.log('🔹 Response Params:', JSON.stringify(response.params, null, 2));
      console.log('🔹 Initiating token exchange...');
      exchangeCodeForToken(code);
    } else if (response?.type === 'error') {
      console.log('═══════════════════════════════════════════════════');
      console.log('❌ OAUTH ERROR');
      console.log('═══════════════════════════════════════════════════');
      console.error('🔹 Error Type:', response.error);
      console.error('🔹 Error Message:', response.error?.message);
      console.error('🔹 Error Description:', response.params?.error_description);
      console.error('🔹 Full Error Object:', JSON.stringify(response, null, 2));
      setIsConnecting(false);
      Alert.alert('Authentication Error', `${response.error?.message || 'Unknown error'}`);
    } else if (response?.type === 'dismiss') {
      console.log('═══════════════════════════════════════════════════');
      console.log('ℹ️  USER DISMISSED AUTH');
      console.log('═══════════════════════════════════════════════════');
      console.log('🔹 User closed the authentication window');
      setIsConnecting(false);
    } else if (response?.type === 'cancel') {
      console.log('═══════════════════════════════════════════════════');
      console.log('🚫 USER CANCELLED AUTH');
      console.log('═══════════════════════════════════════════════════');
      setIsConnecting(false);
    } else if (response) {
      console.log('═══════════════════════════════════════════════════');
      console.log('⚠️  UNKNOWN RESPONSE TYPE');
      console.log('═══════════════════════════════════════════════════');
      console.log('🔹 Response:', JSON.stringify(response, null, 2));
    }
  }, [response]);

  // --- Check existing Strava connection ---
  const checkStravaConnection = async () => {
    console.log('═══════════════════════════════════════════════════');
    console.log('🔍 CHECKING EXISTING CONNECTION');
    console.log('═══════════════════════════════════════════════════');
    
    try {
      console.log('🔹 Reading from SecureStore...');
      const tokenString = await SecureStore.getItemAsync(STRAVA_TOKEN_KEY);
      console.log('🔹 Stored Token Exists:', !!tokenString);
      
      if (tokenString) {
        console.log('🔹 Token String Length:', tokenString.length);
        console.log('🔹 Parsing token...');
        const token = JSON.parse(tokenString);
        console.log('🔹 Token Object Keys:', Object.keys(token));
        console.log('🔹 Access Token Present:', !!token.access_token);
        console.log('🔹 Refresh Token Present:', !!token.refresh_token);
        console.log('🔹 Token Expires At:', token.expires_at);
        
        console.log('🔹 Fetching Strava profile...');
        const profile = await getStravaProfile(token.access_token);
        console.log('✅ Existing connection verified');
        console.log('🔹 Profile:', JSON.stringify(profile, null, 2));
        
        setStravaData(profile);
        setIsConnected(true);
      } else {
        console.log('ℹ️  No existing token found');
      }
    } catch (error) {
      console.log('═══════════════════════════════════════════════════');
      console.error('❌ ERROR CHECKING CONNECTION');
      console.log('═══════════════════════════════════════════════════');
      console.error('🔹 Error Name:', error.name);
      console.error('🔹 Error Message:', error.message);
      console.error('🔹 Error Stack:', error.stack);
>>>>>>> 371d86680ff50dbe8ce75da249a1e1186ee18bc1
    }
    
    console.log('═══════════════════════════════════════════════════');
  };

<<<<<<< HEAD
  const handleConnect = async () => {
    try {
      setLoading(true);
      const result = await stravaService.connectStrava();

      if (result.success) {
        setConnected(true);
        setAthlete(result.athlete);
        
=======
  // --- Exchange code for token ---
  const exchangeCodeForToken = async (code) => {
    console.log('═══════════════════════════════════════════════════');
    console.log('🔄 TOKEN EXCHANGE STARTED');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔹 Authorization Code:', code);
    
    setIsConnecting(true);

    try {
      const body = new URLSearchParams({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
      });

      console.log('🔹 Request Body (URL Encoded):');
      console.log('   - client_id:', STRAVA_CLIENT_ID);
      console.log('   - client_secret:', STRAVA_CLIENT_SECRET ? '***SET***' : 'MISSING');
      console.log('   - code:', code);
      console.log('   - grant_type: authorization_code');
      console.log('🔹 Full Body String:', body.toString());

      console.log('🔹 Making POST request to:', discovery.tokenEndpoint);
      const tokenResponse = await fetch(discovery.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      console.log('🔹 Token Response Status:', tokenResponse.status);
      console.log('🔹 Token Response Status Text:', tokenResponse.statusText);
      console.log('🔹 Token Response Headers:', JSON.stringify([...tokenResponse.headers], null, 2));

      const tokenData = await tokenResponse.json();
      console.log('🔹 Token Response Data:', JSON.stringify(tokenData, null, 2));

      if (tokenData.access_token) {
        console.log('═══════════════════════════════════════════════════');
        console.log('✅ TOKEN EXCHANGE SUCCESS');
        console.log('═══════════════════════════════════════════════════');
        console.log('🔹 Access Token Present:', !!tokenData.access_token);
        console.log('🔹 Refresh Token Present:', !!tokenData.refresh_token);
        console.log('🔹 Token Type:', tokenData.token_type);
        console.log('🔹 Expires At:', tokenData.expires_at);
        console.log('🔹 Expires In:', tokenData.expires_in);
        console.log('🔹 Athlete ID:', tokenData.athlete?.id);
        
        console.log('🔹 Saving token to SecureStore...');
        await SecureStore.setItemAsync(STRAVA_TOKEN_KEY, JSON.stringify(tokenData));
        console.log('✅ Token saved successfully');
        
        console.log('🔹 Fetching athlete profile...');
        const profile = await getStravaProfile(tokenData.access_token);
        console.log('✅ Profile fetched successfully');
        
        setStravaData(profile);
        setIsConnected(true);

        console.log('🔹 Showing success alert...');
>>>>>>> 371d86680ff50dbe8ce75da249a1e1186ee18bc1
        Alert.alert(
          'Success! 🎉',
          `Connected as ${result.athlete.firstname} ${result.athlete.lastname}`,
          [
            {
              text: 'Continue',
              onPress: () => navigation.navigate('Home')
            }
          ]
        );
      } else {
<<<<<<< HEAD
        Alert.alert('Connection Failed', result.error || 'Failed to connect to Strava');
      }
    } catch (error) {
      console.error('Error connecting to Strava:', error);
      Alert.alert('Error', error.message || 'Failed to connect to Strava. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
=======
        console.log('═══════════════════════════════════════════════════');
        console.error('❌ TOKEN EXCHANGE FAILED - NO ACCESS TOKEN');
        console.log('═══════════════════════════════════════════════════');
        console.error('🔹 Error Message:', tokenData.message);
        console.error('🔹 Error Details:', tokenData.errors);
        throw new Error(tokenData.message || 'Failed to retrieve access token');
      }
    } catch (error) {
      console.log('═══════════════════════════════════════════════════');
      console.error('❌ TOKEN EXCHANGE ERROR');
      console.log('═══════════════════════════════════════════════════');
      console.error('🔹 Error Name:', error.name);
      console.error('🔹 Error Message:', error.message);
      console.error('🔹 Error Stack:', error.stack);
      Alert.alert('Connection Failed', error.message);
    } finally {
      console.log('🔹 Token exchange process complete');
      setIsConnecting(false);
      console.log('═══════════════════════════════════════════════════');
    }
  };

  const getStravaProfile = async (accessToken) => {
    console.log('═══════════════════════════════════════════════════');
    console.log('👤 FETCHING STRAVA PROFILE');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔹 Access Token Present:', !!accessToken);
    console.log('🔹 Access Token Length:', accessToken?.length);
    
    try {
      console.log('🔹 Making GET request to: https://www.strava.com/api/v3/athlete');
      const profileResponse = await fetch('https://www.strava.com/api/v3/athlete', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log('🔹 Profile Response Status:', profileResponse.status);
      console.log('🔹 Profile Response Status Text:', profileResponse.statusText);

      if (!profileResponse.ok) {
        console.error('❌ Profile fetch failed');
        console.error('🔹 Response Status:', profileResponse.status);
        const errorText = await profileResponse.text();
        console.error('🔹 Error Response Body:', errorText);
        throw new Error(`Failed to fetch Strava profile: ${profileResponse.status}`);
      }

      const profileData = await profileResponse.json();
      console.log('🔹 Raw Profile Data:', JSON.stringify(profileData, null, 2));
      
      const profile = {
        name: `${profileData.firstname} ${profileData.lastname}`,
        username: profileData.username,
        profile_image: profileData.profile_medium,
        id: profileData.id,
      };
      
      console.log('✅ Profile processed successfully');
      console.log('🔹 Processed Profile:', JSON.stringify(profile, null, 2));
      console.log('═══════════════════════════════════════════════════');
      
      return profile;
    } catch (error) {
      console.log('═══════════════════════════════════════════════════');
      console.error('❌ GET PROFILE ERROR');
      console.log('═══════════════════════════════════════════════════');
      console.error('🔹 Error Name:', error.name);
      console.error('🔹 Error Message:', error.message);
      console.error('🔹 Error Stack:', error.stack);
      console.log('═══════════════════════════════════════════════════');
      throw error;
    }
  };

  const handleConnectStrava = async () => {
    console.log('═══════════════════════════════════════════════════');
    console.log('🚀 CONNECT BUTTON PRESSED');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔹 Request Ready:', !!request);
    console.log('🔹 Request URL:', request?.url);
    console.log('🔹 Is Already Connecting:', isConnecting);
    
    if (!request) {
      console.error('❌ Auth request not ready yet');
      Alert.alert('Error', 'Authentication is still initializing. Please wait a moment.');
      return;
    }
    
    setIsConnecting(true);
    console.log('🔹 Opening OAuth prompt...');

    try {
      console.log('🔹 Calling promptAsync()...');
      const result = await promptAsync();
      console.log('🔹 PromptAsync Result:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('═══════════════════════════════════════════════════');
      console.error('❌ OAUTH PROMPT ERROR');
      console.log('═══════════════════════════════════════════════════');
      console.error('🔹 Error Name:', error.name);
      console.error('🔹 Error Message:', error.message);
      console.error('🔹 Error Stack:', error.stack);
      setIsConnecting(false);
      Alert.alert('Error', 'Failed to open Strava authorization. Please try again.');
    }
    
    console.log('═══════════════════════════════════════════════════');
  };

  const handleDisconnectStrava = async () => {
    console.log('═══════════════════════════════════════════════════');
    console.log('🔌 DISCONNECT INITIATED');
    console.log('═══════════════════════════════════════════════════');
    
>>>>>>> 371d86680ff50dbe8ce75da249a1e1186ee18bc1
    Alert.alert(
      'Disconnect Strava',
      'Are you sure you want to disconnect your Strava account?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => console.log('🔹 User cancelled disconnect')
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
<<<<<<< HEAD
              await stravaService.disconnect();
              setConnected(false);
              setAthlete(null);
              Alert.alert('Disconnected', 'Your Strava account has been disconnected');
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect');
=======
              console.log('🔹 Deleting token from SecureStore...');
              await SecureStore.deleteItemAsync(STRAVA_TOKEN_KEY);
              console.log('✅ Token deleted successfully');
              
              setIsConnected(false);
              setStravaData(null);
              console.log('✅ State updated - disconnected');
              
              Alert.alert('Disconnected', 'Strava account disconnected successfully.');
              console.log('═══════════════════════════════════════════════════');
            } catch (error) {
              console.log('═══════════════════════════════════════════════════');
              console.error('❌ DISCONNECT ERROR');
              console.log('═══════════════════════════════════════════════════');
              console.error('🔹 Error Name:', error.name);
              console.error('🔹 Error Message:', error.message);
              console.error('🔹 Error Stack:', error.stack);
              Alert.alert('Error', 'Failed to disconnect Strava.');
>>>>>>> 371d86680ff50dbe8ce75da249a1e1186ee18bc1
            }
          }
        }
      ]
    );
  };

<<<<<<< HEAD
  const handleRefreshProfile = async () => {
    try {
      setLoading(true);
      const profile = await stravaService.getAthleteProfile();
      setAthlete(profile);
      Alert.alert('Success', 'Profile updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh profile');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigation.navigate('Home');
  };

  if (checkingConnection) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1 items-center justify-center"
      >
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white text-base mt-3">Checking connection...</Text>
      </LinearGradient>
    );
  }

=======
  const handleSyncActivities = async () => {
    console.log('═══════════════════════════════════════════════════');
    console.log('🔄 SYNC ACTIVITIES INITIATED');
    console.log('═══════════════════════════════════════════════════');
    
    try {
      console.log('🔹 Reading token from SecureStore...');
      const tokenString = await SecureStore.getItemAsync(STRAVA_TOKEN_KEY);
      console.log('🔹 Token Found:', !!tokenString);

      if (tokenString) {
        const token = JSON.parse(tokenString);
        console.log('🔹 Token parsed successfully');
        console.log('🔹 Access Token Present:', !!token.access_token);
        Alert.alert('Coming Soon', 'Manual activity sync will be available soon!');
      } else {
        console.log('⚠️  No token found - user not connected');
      }
    } catch (error) {
      console.log('═══════════════════════════════════════════════════');
      console.error('❌ SYNC ERROR');
      console.log('═══════════════════════════════════════════════════');
      console.error('🔹 Error Name:', error.name);
      console.error('🔹 Error Message:', error.message);
      console.error('🔹 Error Stack:', error.stack);
      Alert.alert('Error', 'Failed to sync activities.');
    }
    
    console.log('═══════════════════════════════════════════════════');
  };  
>>>>>>> 371d86680ff50dbe8ce75da249a1e1186ee18bc1
  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-16">
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            {/* Header Section */}
            <View className="mb-8 items-center">
              <View className="bg-white/20 backdrop-blur-xl rounded-full p-6 mb-6 shadow-lg">
                <Text className="text-6xl">🏃</Text>
              </View>
              <Text className="text-4xl font-black text-white mb-3 text-center">
                Connect to Strava
              </Text>
              <Text className="text-white/90 text-center text-base px-4">
                {connected
                  ? 'Your Strava account is connected!'
                  : 'Link your fitness tracking to unlock challenges'}
              </Text>
            </View>

            {/* Connection Status */}
            {connected && athlete && (
              <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mb-4">
                <View className="flex-row items-center justify-between mb-5">
                  <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                    Connected Account
                  </Text>
                  <View className="bg-green-500/20 px-3 py-1.5 rounded-full border border-green-500/30">
                    <Text className="text-green-700 text-xs font-bold">● Active</Text>
                  </View>
                </View>

                <View className="bg-gradient-to-r from-orange-50 to-red-50 p-5 rounded-2xl mb-4">
                  <Text className="text-gray-900 font-black text-2xl mb-2">
                    {athlete.firstname} {athlete.lastname}
                  </Text>
                  {athlete.username && (
                    <Text className="text-orange-600 font-bold text-base mb-2">
                      @{athlete.username}
                    </Text>
                  )}
                  {athlete.city && athlete.country && (
                    <Text className="text-gray-500 text-sm">
                      📍 {athlete.city}, {athlete.country}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Features - Only show if not connected */}
            {!connected && (
              <View className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 mb-6 border border-white/20">
                <FeatureItem icon="🏃" text="Track your fitness activities" />
                <FeatureItem icon="📊" text="Sync workout data automatically" />
                <FeatureItem icon="✅" text="Verify challenge completion" />
                <FeatureItem icon="🏆" text="Earn rewards for your efforts" />
              </View>
            )}

            {/* Action Buttons */}
            {!connected ? (
              <TouchableOpacity
                className="bg-white px-8 py-5 rounded-2xl shadow-2xl mb-3"
                onPress={handleConnect}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator color="#667eea" size="small" />
                    <Text className="text-purple-600 font-black text-lg ml-3">
                      Connecting...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-purple-600 font-black text-lg text-center tracking-wide">
                    Connect with Strava
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  className="bg-white px-8 py-5 rounded-2xl shadow-2xl mb-3"
                  onPress={handleContinue}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text className="text-purple-600 font-black text-lg text-center tracking-wide">
                    Continue to App →
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-white/20 backdrop-blur-xl px-8 py-4 rounded-2xl border border-white/30 mb-3"
                  onPress={handleRefreshProfile}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="text-white font-bold text-base text-center">
                      Refresh Profile
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-white/10 backdrop-blur-xl px-8 py-4 rounded-2xl border border-white/20"
                  onPress={handleDisconnect}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text className="text-white/80 font-bold text-base text-center">
                    Disconnect
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Info Section */}
            <View className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 mt-6 border border-white/20">
              <Text className="text-white font-bold text-lg mb-4">
                🔒 What we access:
              </Text>
              <InfoItem text="Your profile information" />
              <InfoItem text="Activity data (runs, rides, etc.)" />
              <InfoItem text="Activity details (distance, duration, pace)" />
              <Text className="text-white/60 text-xs mt-4 italic">
                We will never post to Strava without your permission
              </Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

function FeatureItem({ icon, text }) {
  return (
    <View className="flex-row items-center mb-4 last:mb-0">
      <View className="bg-white/10 w-10 h-10 rounded-xl items-center justify-center mr-3">
        <Text className="text-2xl">{icon}</Text>
      </View>
      <Text className="text-white font-semibold text-base flex-1">{text}</Text>
    </View>
  );
}

function InfoItem({ text }) {
  return (
    <View className="flex-row items-center mb-3">
      <Text className="text-white/80 text-sm mr-2">•</Text>
      <Text className="text-white/80 text-sm flex-1">{text}</Text>
    </View>
  );
<<<<<<< HEAD
}

export default ConnectStrava;
=======
}
>>>>>>> 371d86680ff50dbe8ce75da249a1e1186ee18bc1
