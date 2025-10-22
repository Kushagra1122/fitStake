import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useWeb3 } from '../context/Web3Context';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET;
const STRAVA_TOKEN_KEY = 'strava_token';

const discovery = {
  authorizationEndpoint: 'https://www.strava.com/oauth/authorize',
  tokenEndpoint: 'https://www.strava.com/api/v3/oauth/token',
};

export default function ConnectStrava() {
  const navigation = useNavigation();
  const { account } = useWeb3();
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    }
    
    console.log('═══════════════════════════════════════════════════');
  };

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
        Alert.alert(
          'Connected! 🎉',
          'Your Strava account has been linked successfully.',
          [{ text: 'Continue', onPress: () => navigation.navigate('Home') }]
        );
      } else {
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
    
    Alert.alert(
      'Disconnect Strava?',
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
            }
          },
        },
      ]
    );
  };

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
  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <Animated.View style={{ opacity: fadeAnim }} className="px-6 pt-16">
          {/* Header */}
          <View className="flex-row items-center mb-8">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="bg-white/20 p-3 rounded-xl mr-4"
            >
              <Text className="text-white text-xl">←</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-white text-3xl font-black">Connect Strava</Text>
              <Text className="text-white/70 text-sm mt-1">Track your fitness activities</Text>
            </View>
          </View>

          {/* Strava Logo Card */}
          <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 mb-4 items-center shadow-2xl">
            <View className="bg-orange-500 rounded-2xl p-4 mb-4">
              <Text className="text-6xl">🏃</Text>
            </View>
            <Text className="text-gray-900 font-black text-2xl mb-2">Strava Integration</Text>
            <Text className="text-gray-600 text-center text-sm">
              Connect your Strava account to automatically track and verify your fitness activities
            </Text>
          </View>

          {isConnected && stravaData ? (
            <View>
              {/* Profile Card */}
              <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 mb-4 shadow-2xl">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-gray-500 text-sm font-semibold uppercase tracking-wide">
                    Connected Account
                  </Text>
                  <View className="bg-green-100 px-3 py-1 rounded-full">
                    <Text className="text-green-700 text-xs font-bold">● Active</Text>
                  </View>
                </View>

                <View className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-2xl mb-4">
                  <View className="flex-row items-center mb-2">
                    <Image
                      source={{ uri: stravaData.profile_image }}
                      className="w-12 h-12 rounded-full mr-3 bg-orange-200"
                    />
                    <View className="flex-1">
                      <Text className="text-gray-900 font-bold text-lg">
                        {stravaData.name || 'Strava Athlete'}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        @{stravaData.username || 'athlete'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Stats */}
                <View className="flex-row justify-between bg-gray-50 p-4 rounded-xl">
                  <StatBox label="Activities" value="0" icon="🏃" />
                  <View className="w-px bg-gray-200" />
                  <StatBox label="This Week" value="0 km" icon="📊" />
                  <View className="w-px bg-gray-200" />
                  <StatBox label="Verified" value="0" icon="✅" />
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-5 rounded-2xl shadow-xl mb-3"
                onPress={handleSyncActivities}
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-lg text-center tracking-wide">
                  Sync Activities 🔄
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-white/20 backdrop-blur-xl px-8 py-4 rounded-2xl border border-white/30"
                onPress={handleDisconnectStrava}
                activeOpacity={0.7}
              >
                <Text className="text-white font-semibold text-base text-center">
                  Disconnect Strava
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* Features List */}
              <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 mb-4 shadow-xl">
                <Text className="text-gray-900 font-bold text-lg mb-4">Why Connect Strava?</Text>
                <FeatureItem
                  icon="📊"
                  title="Automatic Tracking"
                  description="Your activities are automatically verified"
                />
                <FeatureItem
                  icon="✅"
                  title="Proof of Completion"
                  description="Smart contracts verify your progress"
                />
                <FeatureItem
                  icon="🔒"
                  title="Secure & Private"
                  description="We only access activity data you choose"
                />
                <FeatureItem
                  icon="⚡"
                  title="Real-time Updates"
                  description="Progress updates as you complete activities"
                />
              </View>

              {/* Connect Button */}
              <TouchableOpacity
                className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-5 rounded-2xl shadow-2xl mb-4"
                onPress={handleConnectStrava}
                disabled={isConnecting || !request}
                activeOpacity={0.9}
              >
                {isConnecting ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator color="white" size="small" />
                    <Text className="text-white font-bold text-lg ml-3">Connecting...</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-center">
                    <Text className="text-white font-bold text-lg tracking-wide mr-2">
                      Connect with Strava
                    </Text>
                    <Text className="text-white text-xl">→</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                <Text className="text-white font-bold text-sm mb-2">💡 How it works</Text>
                <Text className="text-white/80 text-xs leading-5">
                  1. Authorize FitStake to access your Strava data{'\n'}
                  2. Complete activities and they'll sync automatically{'\n'}
                  3. Smart contracts verify your activities{'\n'}
                  4. Earn rewards when you complete challenges
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

function FeatureItem({ icon, title, description }) {
  return (
    <View className="flex-row items-start mb-4 last:mb-0">
      <View className="bg-orange-100 w-10 h-10 rounded-xl items-center justify-center mr-3">
        <Text className="text-xl">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-bold text-base mb-1">{title}</Text>
        <Text className="text-gray-600 text-sm">{description}</Text>
      </View>
    </View>
  );
}

function StatBox({ label, value, icon }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-2xl mb-1">{icon}</Text>
      <Text className="text-gray-900 font-bold text-lg mb-1">{value}</Text>
      <Text className="text-gray-500 text-xs">{label}</Text>
    </View>
  );
}