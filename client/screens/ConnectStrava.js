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
import { LinearGradient } from 'expo-linear-gradient';
import stravaService from '../services/stravaService';

const { width } = Dimensions.get('window');

const ConnectStrava = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [athlete, setAthlete] = useState(null);
  const [checkingConnection, setCheckingConnection] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      const result = await stravaService.connectStrava();

      if (result.success) {
        setConnected(true);
        setAthlete(result.athlete);
        
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
    Alert.alert(
      'Disconnect Strava',
      'Are you sure you want to disconnect your Strava account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await stravaService.disconnect();
              setConnected(false);
              setAthlete(null);
              Alert.alert('Disconnected', 'Your Strava account has been disconnected');
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect');
            }
          }
        }
      ]
    );
  };

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
}

export default ConnectStrava;