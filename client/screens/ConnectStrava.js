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
  FlatList,
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
  const [activities, setActivities] = useState([]);
  const [showActivities, setShowActivities] = useState(false);
  const [testResults, setTestResults] = useState({});
  
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
      
      try {
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
      } catch (parseError) {
        console.error('Error parsing deep link:', parseError);
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
      console.error('Error checking connection:', error.message);
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
      console.error('Connect error:', error.message);
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
        { 
          text: 'Cancel', 
          style: 'cancel'
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await stravaService.disconnect();
              setConnected(false);
              setAthlete(null);
              setActivities([]);
              setShowActivities(false);
              setTestResults({});
              Alert.alert('Disconnected', 'Your Strava account has been disconnected');
            } catch (error) {
              console.error('Disconnect error:', error.message);
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
      setTestResults({ ...testResults, profile: 'loading' });
      
      const profile = await stravaService.getAthleteProfile();
      
      setAthlete(profile);
      setTestResults({ ...testResults, profile: 'success' });
      
      Alert.alert('Success! 🎉', 'Profile refreshed successfully!');
    } catch (error) {
      console.error('Refresh profile error:', error.message);
      setTestResults({ ...testResults, profile: 'error' });
      Alert.alert('Error', 'Failed to refresh profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetActivities = async () => {
    try {
      setLoading(true);
      setTestResults({ ...testResults, activities: 'loading' });
      
      const activitiesData = await stravaService.getAthleteActivities();
      
      setActivities(activitiesData || []);
      setShowActivities(true);
      setTestResults({ ...testResults, activities: 'success' });
      
      Alert.alert('Success! 🎉', `Fetched ${activitiesData?.length || 0} activities`);
    } catch (error) {
      console.error('Get activities error:', error.message);
      setTestResults({ ...testResults, activities: 'error' });
      Alert.alert('Error', 'Failed to fetch activities: ' + error.message);
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
              <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mb-6">
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

                {/* Test API Buttons */}
                <View className="border-t border-gray-200 pt-4 mt-2">
                  <Text className="text-gray-700 font-bold text-sm mb-3">🧪 Test API Functions:</Text>
                  
                  <View className="space-y-2">
                    <TestButton
                      icon=""
                      label="Refresh Profile"
                      onPress={handleRefreshProfile}
                      status={testResults.profile}
                      disabled={loading}
                    />
                    
                    <TestButton
                      icon="🏃"
                      label="Get Activities"
                      onPress={handleGetActivities}
                      status={testResults.activities}
                      disabled={loading}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Activities List */}
            {showActivities && activities.length > 0 && (
              <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-gray-900 font-bold text-lg">
                    Recent Activities 🏃
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowActivities(false)}
                    className="bg-gray-100 px-3 py-1 rounded-full"
                  >
                    <Text className="text-gray-600 text-xs font-bold">Hide</Text>
                  </TouchableOpacity>
                </View>

                <View className="space-y-3">
                  {activities.slice(0, 5).map((activity, index) => (
                    <ActivityCard key={activity.id} activity={activity} index={index} />
                  ))}
                </View>

                {activities.length > 5 && (
                  <Text className="text-gray-500 text-xs text-center mt-3">
                    Showing 5 of {activities.length} activities
                  </Text>
                )}
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

function TestButton({ icon, label, onPress, status, disabled }) {
  const getStatusColor = () => {
    if (status === 'loading') return 'bg-blue-50 border-blue-300';
    if (status === 'success') return 'bg-green-50 border-green-300';
    if (status === 'error') return 'bg-red-50 border-red-300';
    return 'bg-gray-50 border-gray-300';
  };

  const getStatusIcon = () => {
    if (status === 'loading') return '⏳';
    if (status === 'success') return '✅';
    if (status === 'error') return '❌';
    return '';
  };

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-between p-3 rounded-xl border mb-2 ${getStatusColor()}`}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center flex-1">
        <Text className="text-xl mr-3">{icon}</Text>
        <Text className="text-gray-800 font-semibold text-sm">{label}</Text>
      </View>
      {status && (
        <Text className="text-base ml-2">{getStatusIcon()}</Text>
      )}
    </TouchableOpacity>
  );
}

function ActivityCard({ activity, index }) {
  const formatDistance = (distance) => {
    return (distance / 1000).toFixed(2);
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getActivityIcon = (type) => {
    const icons = {
      'Run': '🏃',
      'Ride': '🚴',
      'Walk': '🚶',
      'Swim': '🏊',
      'Hike': '🥾',
      'Workout': '💪',
    };
    return icons[type] || '🏃';
  };

  return (
    <View className="bg-gray-50 p-4 rounded-xl mb-2 border border-gray-200">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-base mr-2">{getActivityIcon(activity.type)}</Text>
            <Text className="text-gray-900 font-bold text-base flex-1" numberOfLines={1}>
              {activity.name}
            </Text>
          </View>
          <Text className="text-gray-500 text-xs">
            {new Date(activity.start_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
        </View>
      </View>
      
      <View className="flex-row items-center justify-between pt-2 border-t border-gray-200">
        <View className="flex-row items-center">
          <View className="bg-blue-100 px-3 py-1 rounded-full mr-2">
            <Text className="text-blue-700 text-xs font-bold">
              {formatDistance(activity.distance)} km
            </Text>
          </View>
          <View className="bg-purple-100 px-3 py-1 rounded-full">
            <Text className="text-purple-700 text-xs font-bold">
              {formatDuration(activity.moving_time)}
            </Text>
          </View>
        </View>
        {activity.average_speed && (
          <Text className="text-gray-500 text-xs">
            ⚡ {(activity.average_speed * 3.6).toFixed(1)} km/h
          </Text>
        )}
      </View>
    </View>
  );
}

export default ConnectStrava;