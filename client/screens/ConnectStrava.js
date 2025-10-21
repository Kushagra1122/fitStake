import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeb3 } from '../context/Web3Context';
import { useNavigation } from '@react-navigation/native';

export default function ConnectStrava() {
  const navigation = useNavigation();
  const { account } = useWeb3();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [stravaData, setStravaData] = useState(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    checkStravaConnection();
  }, []);

  const checkStravaConnection = async () => {
    try {
      // TODO: Check if Strava is already connected
      // const connected = await checkStravaToken(account);
      // if (connected) {
      //   const data = await getStravaProfile();
      //   setStravaData(data);
      //   setIsConnected(true);
      // }
      
      // For now, default to not connected
      setIsConnected(false);
    } catch (error) {
      console.error('Error checking Strava connection:', error);
    }
  };

  const handleConnectStrava = async () => {
    setIsConnecting(true);
    try {
      // TODO: Implement Strava OAuth flow
      // const authUrl = await getStravaAuthUrl(account);
      // const supported = await Linking.canOpenURL(authUrl);
      // 
      // if (supported) {
      //   await Linking.openURL(authUrl);
      //   // Handle OAuth callback
      //   // const token = await handleOAuthCallback();
      //   // await saveStravaToken(account, token);
      //   // const profile = await getStravaProfile(token);
      //   // setStravaData(profile);
      //   // setIsConnected(true);
      // }

      // Simulate connection for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Strava Connected! 🎉',
        'Your Strava account has been connected successfully. Your activities will now be tracked automatically.',
        [{ text: 'OK' }]
      );
      
      // Simulate connected state
      setIsConnected(true);
      setStravaData({
        name: 'Athlete Name',
        username: 'athlete_username',
        profile_image: null,
      });
    } catch (error) {
      console.error('Error connecting Strava:', error);
      Alert.alert('Connection Failed', error.message || 'Failed to connect to Strava. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectStrava = async () => {
    Alert.alert(
      'Disconnect Strava?',
      'Are you sure you want to disconnect your Strava account? Your progress tracking will be disabled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Remove Strava token
              // await removeStravaToken(account);
              
              setIsConnected(false);
              setStravaData(null);
              Alert.alert('Disconnected', 'Strava account disconnected successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect Strava.');
            }
          },
        },
      ]
    );
  };

  const handleSyncActivities = async () => {
    try {
      // TODO: Sync recent activities
      // const activities = await syncStravaActivities(account);
      // Alert.alert('Success', `Synced ${activities.length} activities`);
      
      Alert.alert('Coming Soon', 'Manual activity sync will be available soon!');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync activities');
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
            /* Connected State */
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
                    <View className="bg-orange-500 w-12 h-12 rounded-full items-center justify-center mr-3">
                      <Text className="text-white text-xl font-bold">
                        {stravaData.name?.charAt(0) || 'S'}
                      </Text>
                    </View>
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
            /* Not Connected State */
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
                disabled={isConnecting}
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

              {/* Info Card */}
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

// Feature Item Component
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

// Stat Box Component
function StatBox({ label, value, icon }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-2xl mb-1">{icon}</Text>
      <Text className="text-gray-900 font-bold text-lg mb-1">{value}</Text>
      <Text className="text-gray-500 text-xs">{label}</Text>
    </View>
  );
}
