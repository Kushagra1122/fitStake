
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


  // --- AuthSession Configuration ---
  const redirectUri = 'https://auth.expo.io/kush1122/fit-stake';


  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: STRAVA_CLIENT_ID,
      // Strava expects scopes as a comma-separated string in the `scope` query param.
      // expo-auth-session by default joins `scopes` with spaces which Strava rejects.
      // Provide an empty `scopes` array and pass a comma-separated `scope` via extraParams.
      scopes: [],
      redirectUri,
      responseType: 'code',
      extraParams: {
        scope: 'read,activity:read_all',
      },
    },
    discovery
  );

  // --- Fade animation + initial check ---
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    checkStravaConnection();
  }, []);

  // --- OAuth response handling ---
  useEffect(() => {
    console.log('🔹 OAuth Response Changed:', response);

    if (response?.type === 'success') {
      const { code } = response.params;
      console.log('✅ Authorization Code received:', code);
      exchangeCodeForToken(code);
    } else if (response?.type === 'error') {
      setIsConnecting(false);
      console.error('❌ Auth error:', response.error);
      Alert.alert('Authentication Error', `${response.error?.message || 'Unknown error'}`);
    } else if (response?.type === 'dismiss') {
      setIsConnecting(false);
      console.log('ℹ️ User dismissed authentication');
    }
  }, [response]);

  // --- Check existing Strava connection ---
  const checkStravaConnection = async () => {
    try {
      const tokenString = await SecureStore.getItemAsync(STRAVA_TOKEN_KEY);
      console.log('🔹 Stored Strava Token:', tokenString);

      if (tokenString) {
        const token = JSON.parse(tokenString);
        const profile = await getStravaProfile(token.access_token);
        console.log('🔹 Existing Strava Profile:', profile);
        setStravaData(profile);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('❌ Error checking Strava connection:', error);
    }
  };

  // --- Exchange code for token ---
  const exchangeCodeForToken = async (code) => {
    console.log('🔹 Exchanging code for token...');
    setIsConnecting(true);

    try {
      const body = new URLSearchParams({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
      });

      console.log('🔹 Token Request Body:', body.toString());

      const tokenResponse = await fetch(discovery.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      const tokenData = await tokenResponse.json();
      console.log('🔹 Token Response:', tokenData);

      if (tokenData.access_token) {
        await SecureStore.setItemAsync(STRAVA_TOKEN_KEY, JSON.stringify(tokenData));
        const profile = await getStravaProfile(tokenData.access_token);
        console.log('🔹 Fetched Strava Profile:', profile);
        setStravaData(profile);
        setIsConnected(true);

        Alert.alert(
          'Connected! 🎉',
          'Your Strava account has been linked successfully.',
          [{ text: 'Continue', onPress: () => navigation.navigate('Home') }]
        );
      } else {
        throw new Error(tokenData.message || 'Failed to retrieve access token');
      }
    } catch (error) {
      console.error('❌ Token Exchange Error:', error);
      Alert.alert('Connection Failed', error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const getStravaProfile = async (accessToken) => {
    try {
      console.log('🔹 Fetching Strava profile...');
      const profileResponse = await fetch('https://www.strava.com/api/v3/athlete', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!profileResponse.ok) {
        throw new Error(`Failed to fetch Strava profile: ${profileResponse.status}`);
      }

      const profileData = await profileResponse.json();
      return {
        name: `${profileData.firstname} ${profileData.lastname}`,
        username: profileData.username,
        profile_image: profileData.profile_medium,
        id: profileData.id,
      };
    } catch (error) {
      console.error('❌ Get Profile Error:', error);
      throw error;
    }
  };

  const handleConnectStrava = async () => {
    console.log('Auth Request URLLLLLLLLLLLLLLL:', request?.url);
    setIsConnecting(true);
    console.log("\n\n\n\n")
    console.log("RESPONSEEEEEEEEEEEE URLLLLLLLL:", response.url );
    console.log("\n\n\n\n")
    try {
      await promptAsync();
    } catch (error) {
      console.error('❌ OAuth Prompt Error:', error);
      setIsConnecting(false);
      Alert.alert('Error', 'Failed to open Strava authorization. Please try again.');
    }
  };

  const handleDisconnectStrava = async () => {
    Alert.alert(
      'Disconnect Strava?',
      'Are you sure you want to disconnect your Strava account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync(STRAVA_TOKEN_KEY);
              setIsConnected(false);
              setStravaData(null);
              console.log('🔹 Strava disconnected successfully');
              Alert.alert('Disconnected', 'Strava account disconnected successfully.');
            } catch (error) {
              console.error('❌ Disconnect Error:', error);
              Alert.alert('Error', 'Failed to disconnect Strava.');
            }
          },
        },
      ]
    );
  };

  const handleSyncActivities = async () => {
    try {
      const tokenString = await SecureStore.getItemAsync(STRAVA_TOKEN_KEY);
      console.log('🔹 Sync token:', tokenString);

      if (tokenString) {
        Alert.alert('Coming Soon', 'Manual activity sync will be available soon!');
      }
    } catch (error) {
      console.error('❌ Sync Error:', error);
      Alert.alert('Error', 'Failed to sync activities.');
    }
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
